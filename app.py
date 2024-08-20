#!/usr/bin/python
#
#  This file starts the user interface and controls the circuitry.
#
#  It contains the following sections:
#    - Classes
#    - Global variables
#    - Data measurement
#    - Pulse controls
#    - Data export
#    - Boot function

import eel                    # Connects js with py
import RPi.GPIO as GPIO       # Activates pins!
import threading              # Creates threads that can be interrupted
import os                     # Formats absolute filepaths
import mcp3008                # Reads data sensors using SPI  
import time                   # Get the current time, for pulse data


    ##############################
  ####          CLASSES         ####
    ##############################
    
class PulseDatapoint:
  def __init__(self, time, AP, VP, flowrate):
    self.time = time
    self.AP = AP
    self.VP = VP
    self.flowrate = flowrate
    self.json = '{ "time": ' + str(self.time) + ', '
    self.json += '"pressure": ' + str(self.AP) + ', '
    self.json += '"flowrate": ' + str(self.flowrate) + ' }'
  def __repr__(self):
    return self.json
  def __str__(self):
    return self.json

      
    ##############################
  ####     GLOBAL VARIABLES     ####
    ##############################

pins = {  #  The three pins used, and whether they're open
  "31": False,       # Outflow near a
  "32": False,       # Outflow near pockets
  "33": False        # Air inflow
}

datapoints   = []    # A list of all datapoints, to be sent to JS.

do_pulse     = False # True iff the pulse is going
secs_elapsed = 0     # Seconds since start of pulse
pulse_count  = 0     # Used to detect flow rate
flow_rate    = 0     # The current flow rate, in L/min
pressure     = 0     # The current pressure, in mmHg

save_folder  = '-'   # Location to save exported data

    ##############################
  ####     DATA MEASUREMENT     ####
    ##############################
  
# Constantly check the pressure sensors. Called in start_pulse()
def check_pressure():
  global pressure
  with mcp3008.MCP3008() as adc:
    pressureV = adc.read([mcp3008.CH0])[0]
    pressureV = pressureV * (3.3 / 1023) # Translates to volts (max 3.3v)
    pressureV = round(pressureV, 2)
    pressureKPa = round(pressureV - 1, 2)
    pressureMmHg = round(pressureKPa * 7.50062, 2)
    pressure = pressureMmHg
    return pressureMmHg
    
  
# Fires when the flow meter moves 1 rotation.  Called in start_pulse()
def detect_flow_pulse(channel):
  global pulse_count
  pulse_count += 1
  #print('Flow pulse ' + str(pulse_count) + ' detected!')

# Runs every 1 second.
def check_flow_rate():
  global pulse_count
  global flow_rate
  liters_per_min = pulse_count / 7.5
  flow_rate = liters_per_min
  pulse_count = 0

    ##############################
  ####      PULSE CONTROLS      ####
    ##############################

# Used in other functions to turn pins on/off by pin #, & record status
def set_pin(pin_num, turn_on):
  pins[pin_num] = turn_on  # turn_on can be True or False
  GPIO.output(int(pin_num), turn_on)
  
# Used in start_pulse(). Gets a wave period from a bpm
def get_period(bpm):
  hz = round(int(bpm) / 60, 2)
  period = round(1 / hz, 2)
  return period

### The functions below are accessible in the JS!

#  Manually toggles specific GPIO lines
@eel.expose
def toggle_pin(pin_num):
  set_pin(pin_num, not pins[pin_num])
  print("Toggled pin " + pin_num + " to " + ('on' if pins[pin_num] else 'off'))

#  Starts the pulse at a specific bpm / period
@eel.expose
def start_pulse(bpm, step_size):
  global do_pulse
  do_pulse = True
  period = get_period(bpm)
  
  def pulse(period):  # Starts an infinite loop. It's called below
    global secs_elapsed
    period_count = 0
    inflow = True
    start_seconds = round(time.time() * 1000) / 1000
    secs_elapsed = 0
    while do_pulse:
      
      #  Toggle airflow valves
      set_pin(33, inflow)
      set_pin(32, not inflow)
      set_pin(31, not inflow)
      
      #  Get pressure & flowrate
      pressureMmHg = check_pressure()
      lit_per_min  = check_flow_rate()
      
      #  Calculate timing
      previous_elapsed = secs_elapsed
      secs_elapsed = round(time.time() * 1000) / 1000
      secs_elapsed -= start_seconds
      secs_elapsed = round(secs_elapsed * 1000) / 1000
      sec_dif = secs_elapsed - previous_elapsed
      sec_dif = round(sec_dif*1000) / 1000
      _log = "Pulse time: " + str(sec_dif) + ", "
      _log += "Total elapsed time: " + str(secs_elapsed) + ", "
      _log += "Pressure: " + str(pressureMmHg) + ", "
      # print(_log)
      
      # Log datapoint
      datapoints.append(PulseDatapoint(secs_elapsed, pressure, 0, flow_rate).json)
      
      # Check if it's time to toggle the air valves
      period_count += sec_dif
      if (period_count >= round(period/2,2)):
        period_count -= round(period/2,2)
        inflow = not inflow
      
      eel.sleep(step_size)  #  Wait, then continue loop
      
  eel.spawn(pulse, period) # Call pulse() in its own thread
  
#  Get the current time, pressure, and flow rate. Called in UserInput.js
@eel.expose
def get_pulse_data(bpm):
  global do_pulse
  global datapoints
  #period = get_period(bpm)   TODO: Use this to save overflow datapoints
  data_to_send = datapoints.copy()
  datapoints = []
  return [do_pulse, secs_elapsed, pressure, flow_rate, data_to_send]
    
#  Stops the pulse
@eel.expose
def stop_pulse():
  global do_pulse
  do_pulse = False
  set_pin(33, False)
  set_pin(32, True)
  set_pin(31, True)
  eel.reset_clock()  # Calls a JS function in UserInput.js
  
    ##############################
  ####        DATA EXPORT       ####
    ##############################
    
#  Find available USB devices
@eel.expose
def find_usb_drives():
  username = os.getlogin()
  usb_directories = os.listdir('/media/' + username)
  for i, directory in enumerate(usb_directories):
    usb_directories[i] = '/media/' + username + '/' + directory
  usb_directories.insert(0, '/home/' + username + '/Documents')
  return usb_directories
find_usb_drives()

#  Sets the folder where data should be exported
@eel.expose
def set_save_folder(new_location):
  global save_folder
  save_folder = new_location
  
#  Saves data to the data location
@eel.expose
def export(data, datatype):
  global save_folder
  if (save_folder == '-'):
    return
  
  ext = '.csv' # if datatype == 'csv' else '.png'

  files = os.listdir(save_folder)
  new_file_name = 'data'
  unique_name = False
  i = 0
  while (not unique_name):
    i += 1
    unique_name = True
    for _file in files:
      if (_file == 'data' + str(i) + ext):
        unique_name = False
  file = open(save_folder + '/data' + str(i) + ext, 'w')
  file.write(data)
  file.close()
  return 'data' + str(i) + ext
  
    ##############################
  ####      BOOT FUNCTION       ####
    ##############################

#  Fires when the app closes
def on_close(url, open_websockets):
  print("Bye!")
  if not open_websockets:
    GPIO.cleanup()
    exit()
    
#  This fires when the program first runs.
def boot():
  
  #  This opens the HTML file representing the app, in web/index.html
  eel.init(os.path.abspath('/home/benholland/github.com/pulse-manager/web'))
  
  GPIO.setwarnings(False)
  GPIO.setmode(GPIO.BOARD)                    # Use gpio pin #'s (other choice: GPIO.BOARD)
  GPIO.setup(33, GPIO.OUT)
  GPIO.setup(32, GPIO.OUT)
  GPIO.setup(31, GPIO.OUT)
  
  GPIO.setup(36, GPIO.IN)
  GPIO.add_event_detect(36, GPIO.RISING, callback=detect_flow_pulse)
  
  eel.start('index.html', close_callback=on_close, size=(800,400))
  
boot()


