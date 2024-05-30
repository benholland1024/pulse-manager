import eel                  # Eel connects js with py
from gpiozero import LED    # Simple LED on/off lib
from time import sleep      # Timing
import RPi.GPIO as GPIO     # For PWM
import threading            # For interrupts

eel.init('web')

leds = {
    13: LED(13),
    17: LED(17),
    18: LED(18)
}
pwm = False
INFLOW_PIN = 12   # BLUE
OUTFLOW_PIN = 33  # RED


@eel.expose
def toggle_LED(pin_num):
    leds[pin_num].toggle()
    print("Toggled pin " + str(pin_num))

#  Turn an LED from dim to fully lit, using PWM
@eel.expose
def start_PWM(period):

  GPIO.setwarnings(False)
  GPIO.setmode(GPIO.BOARD)          # set pin numbering system
  GPIO.setup(INFLOW_PIN, GPIO.OUT)
  INFLOW_pwm = GPIO.PWM(INFLOW_PIN,1000)    # create PWM instance with freq
  INFLOW_pwm.start(0)
  GPIO.setup(OUTFLOW_PIN, GPIO.OUT)
  OUTFLOW_pwm = GPIO.PWM(OUTFLOW_PIN, 1)
  OUTFLOW_pwm.start(100)
  pwm = True
  while pwm:
    for duty in range(0,101,1):
      INFLOW_pwm.ChangeDutyCycle(duty)  # provide duty cycle in the range 0-100
      OUTFLOW_pwm.ChangeDutyCycle(100-duty)
      sleep(0.01)
    for duty in range(100,-1,-1):
      INFLOW_pwm.ChangeDutyCycle(duty)  # provide duty cycle in the range 0-100
      OUTFLOW_pwm.ChangeDutyCycle(100-duty)
      sleep(0.01)

@eel.expose
def stop_PWM(pin_num):
  pwm = False
  print(pwm)

#pwm_LED(12)

eel.start('index.html')
