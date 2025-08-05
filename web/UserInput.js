 
//
//    --^v--^v--  UserInput.js  --^v--^v--
//

//    Manages user input: BPM, systole,
//     diastole, and starting/stopping
//     the pulse. Also, calibration tools.

/*    Objects include:
 *      - UserInput
 *      - BpmControls
 *      - PressureControls
 *      - PulseButton
 *      - GraphPicker
 *      - LoadARun        (export)
 *      - SelectFolder    (export)
 *      - Export          (export)
 *      - ManualControls  (settings)
 *      - ShowPulseButton (settings)
 *      - 
 * 
 */

import PubSub from './PubSub.js';
import PressureWave from './PressureWave.js';
import AirflowWave from './AirflowWave.js';
import SensorInput from './SensorInput.js';


let UserInput = {

  //  DIRECTLY CONTROLLABLE:
  bpm:           100,        //  Beats per minute
  diastole:      80,         //  Pressure at diastole in mmHg
  systole:       120,        //  Pressure at systole
  file_type:     'csv',      //  Export csv or png
  save_to:       '/home/benholland/Documents',         //  Filepath to save exported data
  show_pulse:    false,      //  Animate the pulse -- switch in Settings

  //  INDIRECTLY CONTROLLABLE:
  xValues:       [],         //  A list of each x value plotted

  //  CONSTANTS:
  step_size:     0.25,      //  The interval between graph points
  label_step:    0.5,        //  Which x labels should be shown? (Must be a multiple of step_size)

  //  Methods
  init:          UserInput_init,
  get_xValues:   UserInput_get_xValues,  //  Used in update_bpm
  update_bpm:    UserInput_update_bpm,	 //  Fired when bpm controls change
  draw:          UserInput_draw
}

//  Initialize all input objects!  (Defined further down in this file)
function UserInput_init() {
  BpmControls.init();
  this.xValues = this.get_xValues();
  PressureControls.init();
  PulseButtons.init();
  GraphPicker.init();
  LoadARun.init();
  ManualControls.init();
  ShowPulseButton.init();
  SelectFolder.init();
  Export.init();
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

//////////////////////////////////////////////////////////////////////
//  Object representing BPM controls (including bpm, hz, and period)
//////////////////////////////////////////////////////////////////////
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

//////////////////////////////////////////////////////////////////////
//  Object representing pressure controls (including systole and diastole)
//////////////////////////////////////////////////////////////////////
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

//////////////////////////////////////////////////////////////////////
//  Object representing start / stop pulse buttons
//////////////////////////////////////////////////////////////////////
let PulseButtons = {
  init: function() {
    $('#start-pulse').on('click', function() { PulseButtons.start_pulse(); });
    $('#stop-pulse').on('click', function() { PulseButtons.stop_pulse(); });
  },
  
  pulse_loop:   undefined,
  
  start_pulse:  PulseButtons_start_pulse,
  stop_pulse:   PulseButtons_stop_pulse,
  pulse_step:   PulseButtons_pulse_step
}
//  Start the pulse!
function PulseButtons_start_pulse() {
  $('#stop-pulse').css('display', 'block');
  $('#start-pulse').css('display', 'none');
  if (UserInput.show_pulse) {
    PressureWave.start_pulse();
    AirflowWave.start_pulse();
  }
  SensorInput.new_run();
  eel.start_pulse(UserInput.bpm, UserInput.step_size);
  requestAnimationFrame(PulseButtons_pulse_step);
}
//  Stop the pulse!
function PulseButtons_stop_pulse() {
  $('#stop-pulse').css('display', 'none');
  $('#start-pulse').css('display', 'block');
  if (UserInput.show_pulse) {
    PressureWave.stop_pulse();
    AirflowWave.stop_pulse();
  }
  $('#run-selector').val(SensorInput.run_history.length + 1);
  eel.stop_pulse();
}
//  This updates the displayed timer, pressure, flowrate + graph.
function PulseButtons_pulse_step(ms_since_req) {
  let promise = eel.get_pulse_data(UserInput.bpm);
  promise().then(function(step_data) {
    let do_pulse        = step_data[0];
    if (!do_pulse) {
      return;
    }
    let last_time_index = SensorInput.current_run.length - 1;
    if (last_time_index >= 0 && SensorInput.current_run[last_time_index].time == step_data[1]) {
		requestAnimationFrame(PulseButtons_pulse_step);
		return;
	}
    let seconds_elapsed = step_data[1];
    let pressure        = step_data[2];
    let pressure_1      = step_data[3];
    let pressure_2      = step_data[4];
    let flowrate        = step_data[5];
    let datapoints      = step_data[6];
    $('#clock').text(seconds_elapsed);
    SensorInput.update_flowrate(flowrate);
    SensorInput.update_pressure(pressure, pressure_1, pressure_2, flowrate, seconds_elapsed);
    if (UserInput.show_pulse) {
      PressureWave.pulse_step(seconds_elapsed, datapoints);
      AirflowWave.pulse_step(seconds_elapsed);
    }
    //  Ensures we update @ max screen refresh rate
    requestAnimationFrame(PulseButtons_pulse_step);
  });
}
//  Reset the clock, called in python. 
eel.expose(reset_clock);
function reset_clock() {
  UserInput.clock = 0;
  $('#clock').text('0.00')
}


//////////////////////////////////////////////////////////////////////
//  Object representing the graph picker dropdown
//////////////////////////////////////////////////////////////////////
let GraphPicker = {
  init: function() {
    $('#graph-picker').on('change', function() {
      let new_graph = $('#graph-picker').val();
      let graph_options = ['pressure', 'airflow', 'bloodflow'];
      for (let i = 0; i < graph_options.length; i++) {
        if (new_graph != graph_options[i]) {
          $('#' + graph_options[i] + '-graph').css('display', 'none');
        } else {
          $('#' + graph_options[i] + '-graph').css('display', 'block');
        }
      }
      if (new_graph == 'datatable') {
        $('#data-table').css('display', 'flex');
      } else {
        $('#data-table').css('display', 'none');
      }
    });
  }
}

//////////////////////////////////////////////////////////////////////
//  Object representing manual open/close controls
//////////////////////////////////////////////////////////////////////
let LoadARun = {
  init: function() {
    $('#run-selector').on("change", function() {
      if (this.value == '-') {
        return;
      }
      let data = SensorInput.run_history[this.value - 1];
      if (this.value == SensorInput.run_history.length + 1) {
        data = SensorInput.current_run;
      }
      $('#data-table table').html(SensorInput.get_table_rows(data));
    });
  }
}

//////////////////////////////////////////////////////////////////////
//  Object representing "select folder" dropdown menu
//////////////////////////////////////////////////////////////////////
let SelectFolder = {
  init: function() {
    
    $('#export-locations').on("change", function() {
      let new_location = $('#export-locations').val();
      eel.set_save_folder(new_location);
    });
    
    $('#refresh-export-locations').on("click", function() {
      SelectFolder.find_usb_drives();
    });
    SelectFolder.find_usb_drives();
    
  },
  
  find_usb_drives: SelectFolder_find_usb_drives
}
function SelectFolder_find_usb_drives() {
  let promise = eel.find_usb_drives();
  promise().then(function(usb_drives) {
    $('#export-locations').html('<option value="-">-</option>');
    for (let i = 0; i < usb_drives.length; i++) {
      $('#export-locations').append(`<option value="${usb_drives[i]}">
        ${usb_drives[i]}</option>`);
    }
  });
}


//////////////////////////////////////////////////////////////////////
//  Object representing "Export" button
//////////////////////////////////////////////////////////////////////

let Export = {
  init: function() {
    $('#export').on("click", function() {
      let location = $('#export-locations').val();
      if (location == '-') {
        $('#export-msg').text('No export location given');
        return;
      }
      
      let datatype = $('#export-data-type').val();
      
      let promise = eel.export(Export.get_CSV_data(), datatype);
      promise().then(function (file_name) {
        $('#export-msg').text('Saved to ' + location + '/' + file_name);
      });
    });
  },
  get_CSV_data:  Export_get_CSV_data
}
//  Creates a string formatted for a .csv file, like what Excel uses
function Export_get_CSV_data() {
  let json = SensorInput.current_run;
  let str = '';
  
  for (let i = 0; i < json.length; i++) {
    let line = '';
    for (let index in json[i]) {
      if (line != '') line += ','
      line += json[i][index];
    }
    str += line + '\n';
  }
  
  return str;
}


//////////////////////////////////////////////////////////////////////
//  Object representing manual open/close controls
//////////////////////////////////////////////////////////////////////
let ManualControls = {
  init: function() {
    $('#toggle-1').on("click", function() { 
      eel.toggle_pin('33');
      let current_status = $('#status-1').text();
      $('#status-1').text(current_status == 'off' ? 'on' : 'off');
    });
    $('#toggle-2').on("click", function() {
      eel.toggle_pin('32');
      let current_status = $('#status-2').text();
      $('#status-2').text(current_status == 'off' ? 'on' : 'off');
    });
    $('#toggle-3').on("click", function() {
      eel.toggle_pin('31');
      let current_status = $('#status-3').text();
      $('#status-3').text(current_status == 'off' ? 'on' : 'off');
    });
  }
}

//////////////////////////////////////////////////////////////////////
//  Object representing "show pulse" toggle button
//////////////////////////////////////////////////////////////////////
let ShowPulseButton = {
  init: function() {
    $('#show-pulse').on("click", function() { 
      UserInput.show_pulse = !UserInput.show_pulse;
    });
  }
}

export default UserInput;


