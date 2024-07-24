#!/usr/bin/python
#
#  This file starts the user interface!
#  It also lets the UI control the circuit:
#             this is outdated:
#    Ground ◄────────────────────────────────────────────────────────┐
#                                                                    │
#    Pin 32 ─────► 8k resistor ──► red LED  ──► open inflow valve ───┤
#                                                                    │
#    Pin 33 ─────► 8k resistor ──► blue LED ──► open outflow valve ──┘


import eel                  # Eel connects js with py
import RPi.GPIO as GPIO     # For PWM
import threading            # For interrupts
import os                   # For filepaths

eel.init(os.path.abspath('/home/benholland/github.com/pulse-manager/web'))

#leds = {          # LED variables for GPIO pin numbers (not board numbers) for LED library
#  "red": {
#    "board": 32,
#    "gpio": 12,
#    "state": False
#  },
#  "blue": {
#    "board": 33,
#    "gpio": 13,
#    "state": False
#  }
#}
pins = {
  "31": False,
  "32": False,
  "33": False
}

                  # These are labelled by BOARD pin #'s (not GPIO numbers) for pwm
INFLOW_PIN = 32   # RED (based on current hardware)
OUTFLOW_PIN = 33  # BLUE

#  This fires when the program first runs.
def boot():
  GPIO.setwarnings(False)
  GPIO.setmode(GPIO.BOARD)                    # Use gpio pin #'s (other choice: GPIO.BOARD)
  GPIO.setup(INFLOW_PIN, GPIO.OUT)
  GPIO.setup(OUTFLOW_PIN, GPIO.OUT)
#  GPIO.output(INFLOW_PIN, True)
#  print("Set 32 to high!")
boot()

#  Manually toggles specific GPIO lines
@eel.expose
def toggle_LED(pin_num):
  pins[pin_num] = not pins[pin_num];
  GPIO.output(int(pin_num), pins[pin_num]);
  #LED(pin_num).toggle()
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
      GPIO.output(33, inflow);
      GPIO.output(32, not inflow);
      pins['33'] = inflow;
      pins['32'] = not inflow;
      eel.pulse_step(timer)
      timer += 0.025
      period_count += 0.025
      if (period_count >= period):
        period_count -= period;
        inflow = not inflow;
      eel.sleep(0.025)
      
  eel.spawn(pulse, bpm)
    
#  Stops the pulse
@eel.expose
def stop_pulse():
  global do_pulse
  do_pulse = False
  GPIO.output(33, False);
  GPIO.output(32, True);
  pins['33'] = False;
  pins['32'] = True;
  


#  Fires when the app closes
def on_close(url, open_websockets):
  print("Bye!")
  if not open_websockets:
    GPIO.cleanup()
    exit()

eel.start('index.html', close_callback=on_close, size=(800,400))
