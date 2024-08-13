#!/usr/bin/python
#
#  This file starts the user interface and controls the circuitry.
#
#  It contains the following sections:
#    - Global variables
#    - Data measurement
#    - Valve controls
#    - Data export
#    - Boot function

import eel                  # Connects js with py
import RPi.GPIO as GPIO     # Activates pins!
import threading            # Creates threads that can be interrupted
import os                   # Formats absolute filepaths
import mcp3008              # Reads data sensors using SPI  

eel.init(os.path.abspath('/home/benholland/github.com/pulse-manager/web'))

    ##############################
  ####     GLOBAL VARIABLES     ####
    ##############################

pins = {  #  The three pins used, and whether they're open
  "31": False,      # Outflow near a
  "32": False,      # Outflow near pockets
  "33": False       # Air inflow
}

pulse_count = 0;    # Used to detect flow rate

save_folder = '-';   # Location to save exported data

    ##############################
  ####     DATA MEASUREMENT     ####
    ##############################
  
# Constantly check the pressure sensors. Called in boot()
def check_pressure():
  global do_pulse
  while do_pulse:
    with mcp3008.MCP3008() as adc:
      pressureV = adc.read([mcp3008.CH0])[0]
      pressureV = pressureV * (3.3 / 1023) # Translates to volts (max 3.3v)
      pressureV = round(pressureV, 2)
      pressureKPa = round(pressureV - 1, 2)
      pressureMmHg = round(pressureKPa * 7.50062, 2)
      eel.update_pressure(pressureMmHg)
      
      #flowrate = adc.read([mcp3008.CH1])[0] * (3.3 / 1023)
      #eel.update_flowrate(flowrate)
      _log = "Pressure: " + str(pressureV) + "V, "
      _log += str(pressureKPa) + "kPa, "
      _log += str(pressureMmHg) + "mmHg"
      print(_log)
    eel.sleep(.1)
  
# Fires when the flow meter moves 1 rotation.  Called in boot()
def detect_flow_pulse(channel):
  global pulse_count
  pulse_count += 1;
  #print('Flow pulse ' + str(pulse_count) + ' detected!')

# Runs every 1 second.
def check_flow_rate():
  global pulse_count
  global do_pulse
  while do_pulse:
    liters_per_min = pulse_count / 7.5;
    eel.update_flowrate(liters_per_min)
    #print(str(liters_per_min) + " L/min")
    pulse_count = 0;
    eel.sleep(1)
    

    ##############################
  ####      VALVE CONTROLS      ####
    ##############################

# Used in other functions to turn pins on/off by pin #, & record status
def set_pin(pin_num, turn_on):
  pins[pin_num] = turn_on; # turn_on can be True or False
  GPIO.output(int(pin_num), turn_on);

#
#   The functions below are accessible in the JS!
#

#  Manually toggles specific GPIO lines
@eel.expose
def toggle_pin(pin_num):
  set_pin(pin_num, not pins[pin_num]);
  print("Toggled pin " + pin_num + " to " + ('on' if pins[pin_num] else 'off'))

#  Starts the pulse at a specific bpm / period
@eel.expose
def start_pulse(bpm):
  global do_pulse
  do_pulse = True
  eel.spawn(check_pressure)
  eel.spawn(check_flow_rate)
  
  def pulse(bpm):
    hz = round(int(bpm) / 60, 2)
    period = round(1 / hz, 2)
    print(period)
    timer = 0
    period_count = 0
    inflow = True
    while do_pulse:
      set_pin(33, inflow)
      set_pin(32, not inflow)
      set_pin(31, not inflow)
      eel.pulse_step(timer)     # Calls a JS function in UserInput.js
      timer += 0.025
      period_count += 0.025
      if (period_count >= round(period/2,2)):
        period_count -= round(period/2,2)
        inflow = not inflow;
      eel.sleep(0.025)
      
  eel.spawn(pulse, bpm)
    
#  Stops the pulse
@eel.expose
def stop_pulse():
  global do_pulse
  do_pulse = False
  set_pin(33, False)
  set_pin(32, True);
  set_pin(31, True);
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
    return;
  
  ext = '.csv' # if datatype == 'csv' else '.png'

  files = os.listdir(save_folder)
  new_file_name = 'data';
  unique_name = False;
  i = 0;
  while (not unique_name):
    i += 1;
    unique_name = True;
    for _file in files:
      if (_file == 'data' + str(i) + ext):
        unique_name = False;
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
  GPIO.setwarnings(False)
  GPIO.setmode(GPIO.BOARD)                    # Use gpio pin #'s (other choice: GPIO.BOARD)
  GPIO.setup(33, GPIO.OUT)
  GPIO.setup(32, GPIO.OUT)
  GPIO.setup(31, GPIO.OUT)
  
  GPIO.setup(36, GPIO.IN)
  GPIO.add_event_detect(36, GPIO.RISING, callback=detect_flow_pulse)
  
  eel.start('index.html', close_callback=on_close, size=(800,400))
  
boot()


