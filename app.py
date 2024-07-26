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


import eel                  # Eel connects js with py
import RPi.GPIO as GPIO     # For PWM
import threading            # For interrupts
import os                   # For filepaths

eel.init(os.path.abspath('/home/benholland/github.com/pulse-manager/web'))

pins = {  #  The three pins used, and whether they're open
  "31": False,    # Outflow near a
  "32": False,    # Outflow near pockets
  "33": False     # Air inflow
}

#  This fires when the program first runs.
def boot():
  GPIO.setwarnings(False)
  GPIO.setmode(GPIO.BOARD)                    # Use gpio pin #'s (other choice: GPIO.BOARD)
  GPIO.setup(33, GPIO.OUT)
  GPIO.setup(32, GPIO.OUT)
  GPIO.setup(31, GPIO.OUT)
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
