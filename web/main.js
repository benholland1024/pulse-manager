/*                  [art from loveascii.com/hearts.html]

                            |  \ \ | |/ /
                            |  |\ `' ' /
                            |  ;'aorta \      / , pulmonary
                            | ;    _,   |    / / ,  arteries
                   superior | |   (  `-.;_,-' '-' ,
                  vena cava | `,   `-._       _,-'_
                            |,-`.    `.)    ,<_,-'_, pulmonary
                           ,'    `.   /   ,'  `;-' _,  veins
                          ;        `./   /`,    \-'
                          | right   /   |  ;\   |\
                          | atrium ;_,._|_,  `, ' \
                          |        \    \ `       `,
                          `      __ `    \   left  ;,
                           \   ,'  `      \,  ventricle
                            \_(            ;,      ;;
                            |  \           `;,     ;;
                   inferior |  |`.          `;;,   ;'
                  vena cava |  |  `-.        ;;;;,;'
                            |  |    |`-.._  ,;;;;;'
                            |  |    |   | ``';;;'
                                    aorta
*/


//
//    --^v--^v--  main.js : This file runs when the app loads  --^v--^v--
//

import PressureWave from './PressureWave.js';
import AirflowWave from './AirflowWave.js';
import UserInput from './UserInput.js';
import pubsub from './PubSub.js';

//  This object represents the entire app.
let App = {
  mode: 'waveform',  //  Options: 'manual', 'waveform'

  init:         App_init,
  change_mode:  App_change_mode,
}

//
function App_init() {
  $('#waveform-btn').on('click', function() { App.change_mode('waveform'); });
  $('#calibrate-btn').on('click', function() { App.change_mode('calibrate'); });
}

//  Changes the mode (this toggles between two UI interfaces)
function App_change_mode(new_mode) {
  console.log("Changing to " + new_mode);
  $(`#${this.mode}-btn`).removeClass('active');
  $(`#${this.mode}-left`).css('display', 'none');
  this.mode = new_mode;
  $(`#${this.mode}-btn`).addClass('active');
  $(`#${this.mode}-left`).css('display', 'block');
  if (this.mode == 'waveform') {

    PressureWave.init();
    AirflowWave.init();
  	pubsub.publish( 'bpm', $('#bpm_r').val() ); //  This draws the waves
  }
}


//  Called when the page loads.
function boot() {
  console.log('Pulse manager loaded! Hello! <3');

  App.init();
  UserInput.init();
  App.change_mode(App.mode);
  
}
boot();



//  Example of how to expose JS functions to Python (not used
eel.expose(prompt_alerts);
function prompt_alerts(description) {
  alert(description);
}


/*
                ~ ~ ~  NOTES:  ~ ~ ~

  When the chart first loads, it shows the waveform,
    without pulsing. The heart is at diastole.

  The range of x values scales with the bpm, to show
    two waves. For 100bpm (1.67Hz), T = 1/1.67 = .60s,
    thus the x values are 0 to (2*0.60), or 0 to 1.2s.

  The range of y values scales between diastole and
    systole. Systole must be higher than diastole.

  When the pulse starts, the x values remain the same,
    but the y values are added 1 by 1 over time.
*/
