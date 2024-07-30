# Pulse Manager 🫀
This is software to control a pulse duplicator using a Raspberry Pi.  

## Setup 
This project requires Python, and python packages [eel](https://github.com/python-eel/Eel?tab=readme-ov-file#eel) and [gpiozero](https://gpiozero.readthedocs.io/en/stable/installing.html) to be installed on the RPi.  
When installing, you may want to use a [venv](https://stackoverflow.com/questions/75602063/pip-install-r-requirements-txt-is-failing-this-environment-is-externally-mana/75696359#75696359)  
(Or `pip install eel --break-system-packages` can be used)

The project also uses [chartjs](https://www.chartjs.org/docs/2.9.4) version 2.9.4 and JQuery-UI. (no installation required -- a CDN is used.)  

After cloning the project, run it:
```bash
git clone https://github.com/benholland1024/pulse-manager.git
cd pulse-manager
python app.py
```

<br/><br/><br/><br/>

## Editing the Code

I recommend editing using the Geany app on the RPi.  
Create a new project with the folder as the root.  
In the settings, set tabs to create 2 spaces. 

If you're coding on a RPI using `nano`, create a file called `~/.nanorc` and add:
```
set tabsize 2
set tabstospaces
```

<br/><br/><br/><br/>

## Running the Code

The code can be run through the terminal with `python app.py`.  
To create a file that can be double clicked to run the code, add a file called `pulse.sh` with this:  
```bash
#!/bin/bash
/home/benholland/github/pulse-manager/app.py
```
Replace the 2nd line with the correct path to `app.py`. 

<br/><br/><br/><br/>

## What is a pulse duplicator?
A [pulse duplicator](https://en.wikipedia.org/wiki/Pulse_duplicator) is a device used to duplicate the pulsing flow of the human heart. It's used to research the conditions of heart disease.  
Some examples are described in [this paper](https://scholar.sun.ac.za/server/api/core/bitstreams/bccb60ab-9c5d-49c6-a285-ae7c1f789fe6/content), among others.

<br/><br/><br/><br/>

## References
This app uses icons found on [svgrepo.com](https://www.svgrepo.com).
