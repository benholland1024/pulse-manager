
//
//    --^v--^v--  UserInput.js  --^v--^v--
//

//    Manages user input: BPM, systole,
//     diastole, and starting/stopping
//     the pulse

import PubSub from './PubSub.js';
import PressureWave from './PressureWave.js';
import AirflowWave from './AirflowWave.js';

let UserInput = {

  //  DIRECTLY CONTROLLABLE:
  bpm:           100,        //  Beats per minute
  diastole:      80,         //  Pressure at diastole in mmHg
  systole:       120,        //  Pressure at systole

  //  INDIRECTLY CONTROLLABLE:
  xValues:       [],         //  A list of each x value plotted

  //  CONSTANTS:
  step_size:     0.025,      //  The interval between graph points
  label_step:    0.5,        //  Which x labels should be shown? (Must be a multiple of step_size)

  //  Methods
  init:          UserInput_init,
  get_xValues:   UserInput_get_xValues,
  update_bpm:    UserInput_update_bpm,
  draw:          UserInput_draw
}

//  Initialize all input objects!  (Defined further down in this file)
function UserInput_init() {
  BpmControls.init();
  this.xValues = this.get_xValues();
  PressureControls.init();
  PulseButtons.init();
}

//  Returns a list of xValues, based on bpm
function UserInput_get_xValues() {
  let _xValues = [];
  let hz = this.bpm / 60;    //  Because b/m * 1min/60sec == b/s == hz
  let period = 1 / hz;       //  Because period T = 1 / f
  let x_max = 2 * period;
  let x_range = Math.floor(x_max);
  for (let i = 0; i < x_max + this.step_size; i += this.step_size) {
    i = Math.round(i * 1000) / 1000;
    _xValues.push(i);
  }
  return _xValues
}

//  Update the bpm, and related values
function UserInput_update_bpm(new_bpm) {
  this.bpm = new_bpm;
  this.xValues = this.get_xValues();
  this.draw();
}


//  Draw all waves
function UserInput_draw() {
  PressureWave.draw();
  AirflowWave.draw();
  // this.chart.data.labels = this.xValues;
  // this.chart.update();

}


let BpmControls = {
  init: function () {
    //  Reactive bpm
    PubSub.subscribe('bpm', function(new_bpm) {
      $('#bpm_n').val(new_bpm);
      $('#bpm_r').val(new_bpm);
      let hz = Math.round(new_bpm * 100 / 60) / 100;
  		$('#hz_n').val(hz);
	  	$('#hz_r').val(hz);
		  let period = Math.round(100 / hz) / 100;
	  	$('#period_n').val(period);
	  	$('#period_r').val(period);
      UserInput.update_bpm(new_bpm);
	  });
    $('#bpm_r').on('input', function() { PubSub.publish('bpm', $('#bpm_r').val() ) });
    $('#bpm_n').on('input', function() { PubSub.publish('bpm', $('#bpm_n').val() ) });
    $('#hz_r').on('input', function() { PubSub.publish('bpm', 60 * $('#hz_r').val() ) });
    $('#hz_n').on('input', function() { PubSub.publish('bpm', 60 * $('#hz_n').val() ) });
    $('#period_r').on('input', function() { PubSub.publish('bpm', 60 / $('#period_r').val() ) });
    $('#period_n').on('input', function() { PubSub.publish('bpm', 60 / $('#period_n').val() ) });
  }
}


let PressureControls = {

  init: function() {
    //  The two-handled slider
    this.slider = $('#pressure-range').slider({
      range: true,
      min: 30,
      max: 210,
      values: [80, 120],
      slide: function(event, ui) {
        let diastole = ui.values[0];
        let systole = ui.values[1];
        this.diastole = diastole;
        this.systole = systole;
        PubSub.publish('diastole', diastole);
        PubSub.publish('systole', systole);
        //this.draw();
      }
    });

    //  Diastole textbox
    PubSub.subscribe('diastole', function(new_diastole) {
      new_diastole = Number(new_diastole);
      $('#diastole_n').val(new_diastole);
      $('#pressure-range').slider('values', 0, new_diastole);
      $('#systole_n').attr('min', new_diastole);  //  Diastole must be < systole
      UserInput.diastole = new_diastole;
      UserInput.draw();
    });
    $('#diastole_n').on('input', function() { PubSub.publish('diastole', $('#diastole_n').val() ) });

    //  Systole textbox
    PubSub.subscribe('systole', function(new_systole) {
      new_systole = Number(new_systole);
      $('#systole_n').val(new_systole);
      $('#pressure-range').slider('values', 1, new_systole);
      $('#diastole_n').attr('max', new_systole);  //  systole must be > systole
      UserInput.systole = new_systole;
      UserInput.draw();
    });
    $('#systole_n').on('input', function() { PubSub.publish('systole', $('#systole_n').val() ) });
  }
}


let PulseButtons = {
  init: function() {
    $('#start-pulse').on('click', function() { PressureWave.start_pulse(); });
    $('#stop-pulse').on('click', function() { PressureWave.stop_pulse(); });
  }
}

export default UserInput;


