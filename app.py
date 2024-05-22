import eel
import random
from datetime import datetime
from gpiozero import LED
import time

eel.init('web')

leds = {
    17: LED(17),
    18: LED(18)
}

@eel.expose
def toggle_LED(pin_num):
    leds[pin_num].toggle()
    print("Toggled pin " + str(pin_num))

eel.start('index.html')
