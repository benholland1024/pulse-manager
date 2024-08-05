#!/usr/bin/python
#
#  This file starts the user interface!
#  It also lets the UI control the circuit:
#
#    Ground ◄───────────────────────────────────────┐
#                                                   │
#    Pin 32 ─────► open inflow valve ───────────────┤
#                                                   │
#    Pin 33 ─────► open outflow valve near pocket ──┘


import eel                  # Connects js with py
import RPi.GPIO as GPIO     # Activates pins!
import threading            # Creates threads that can be interrupted
import os                   # Formats absolute filepaths
import mcp3008              # Reads data sensors using SPI  

eel.init(os.path.abspath('/home/benholland/github.com/pulse-manager/web'))

  ##################################
  ####     GLOBAL VARIABLES     ####
  ##################################

pins = {  #  The three pins used, and whether they're open
  "31": False,      # Outflow near a
  "32": False,      # Outflow near pockets
  "33": False       # Air inflow
}

pulse_count = 0;    # Used to detect flow rate

# Constantly check the pressure sensors. Called in boot()
def check_pressure():
  while True:
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
  print('Flow pulse ' + str(pulse_count) + ' detected!')
  
def check_flow_rate():
  global pulse_count
  while True:
    liters_per_min = pulse_count / 7.5;
    eel.update_flowrate(liters_per_min)
    print(str(liters_per_min) + " L/min")
    pulse_count = 0;
    eel.sleep(1)
      
#  This fires when the program first runs.
def boot():
  GPIO.setwarnings(False)
  GPIO.setmode(GPIO.BOARD)                    # Use gpio pin #'s (other choice: GPIO.BOARD)
  GPIO.setup(33, GPIO.OUT)
  GPIO.setup(32, GPIO.OUT)
  GPIO.setup(31, GPIO.OUT)
  #eel.spawn(check_pressure)
  GPIO.setup(36, GPIO.IN)
  GPIO.add_event_detect(36, GPIO.RISING, callback=detect_flow_pulse)
  eel.spawn(check_flow_rate)
boot()

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
  
  def pulse(bpm):
    hz = round(int(bpm) / 60, 2);
    period = round(1 / hz, 2);
    print(period)
    timer = 0
    period_count = 0;
    inflow = True
    while do_pulse:
      set_pin(33, inflow);
      set_pin(32, not inflow);
      set_pin(31, not inflow);
      eel.pulse_step(timer)     # Calls a JS function in UserInput.js
      timer += 0.025
      period_count += 0.025
      if (period_count >= round(period/2,2)):
        period_count -= round(period/2,2);
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
  


#  Fires when the app closes
def on_close(url, open_websockets):
  print("Bye!")
  if not open_websockets:
    GPIO.cleanup()
    exit()

eel.start('index.html', close_callback=on_close, size=(800,400))
