#!/usr/bin/python
import eel                  # Eel connects js with py
from gpiozero import LED    # Simple LED on/off lib
from time import sleep      # Timing of LEDs
import RPi.GPIO as GPIO     # For PWM
import threading            # For interrupts
import os                   # For filepaths

eel.init(os.path.abspath('/home/benholland/github.com/pulse-manager/web'))

leds = {          # LED variables for GPIO pin numbers (not board numbers) for LED library
  "red": {
    "board": 32,
    "gpio": 12,
    "led": LED(12)
  },
  "blue": {
    "board": 33,
    "gpio": 13,
    "led": LED(13)
  }
}
pwm = True
                  # These are labelled by BOARD pin #'s (not GPIO numbers) for pwm
INFLOW_PIN = 32   # RED (based on current hardware)
OUTFLOW_PIN = 33  # BLUE


@eel.expose
def toggle_LED(color):
  led = leds[color]['led']
  led.toggle()
  sleep(1)
  #LED(pin_num).toggle()
  print("Toggled " + color + " pin")

#  Make LEDs pulse from dim to fully lit, using PWM
@eel.expose
def start_PWM(period):
  print('Starting pwm')
  GPIO.setwarnings(False)
  GPIO.setmode(GPIO.BOARD)                    # Use gpio pin #'s (other choice: GPIO.BOARD)

  # Set up inflow pin
  GPIO.setup(INFLOW_PIN, GPIO.OUT)
  INFLOW_pwm = GPIO.PWM(INFLOW_PIN,1000)    # create PWM instance with freq
  INFLOW_pwm.start(0)

  # Set up outflow pin
  GPIO.setup(OUTFLOW_PIN, GPIO.OUT)
  OUTFLOW_pwm = GPIO.PWM(OUTFLOW_PIN, 1000)
  OUTFLOW_pwm.start(100)

  while pwm:
    for duty in range(0,101,1):
      INFLOW_pwm.ChangeDutyCycle(duty)      # provide duty cycle in the range 0-100
      OUTFLOW_pwm.ChangeDutyCycle(duty)
      sleep(0.025)
    for duty in range(100,-1,-1):
      INFLOW_pwm.ChangeDutyCycle(duty)      # provide duty cycle in the range 0-100
      OUTFLOW_pwm.ChangeDutyCycle(duty)
      sleep(0.025)

#  Stop the LEDs from pulsing
@eel.expose
def stop_PWM(pin_num):  #  This function doesn't stop the pwm, it needs multithreading.
  pwm = False
  print(pwm)

def on_close(url, open_websockets):
  print("Bye!")
  if not open_websockets:
    GPIO.cleanup()
    exit()

eel.start('index.html', close_callback=on_close, size=(800,480))
