import eel                  # Eel connects js with py
from gpiozero import LED    # Simple LED on/off lib
from time import sleep      # Timing of LEDs
import RPi.GPIO as GPIO     # For PWM
import threading            # For interrupts

eel.init('web')

leds = {          # LED variables for GPIO pin numbers (not board numbers) for LED library
    13: LED(13),  # Blue
    17: LED(17),
    18: LED(18)   # Red
}
pwm = False
                  # These are labelled by BOARD pin #'s (not GPIO numbers) for pwm
INFLOW_PIN = 13   # BLUE (based on current hardware
OUTFLOW_PIN = 18  # RED


@eel.expose
def toggle_LED(pin_num):
    leds[pin_num].toggle()
    print("Toggled pin " + str(pin_num))

#  Make LEDs pulse from dim to fully lit, using PWM
@eel.expose
def start_PWM(period):
  print('Starting pwm')
  GPIO.setwarnings(True)
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
  GPIO.cleanup()
  if not open_websockets:
    exit()

eel.start('index.html', close_callback=on_close)
