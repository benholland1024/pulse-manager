import PubSub from './PubSub.js';
import PressureWave from './PressureWave.js';

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
      PressureWave.update_bpm(new_bpm);
	  });
    $('#bpm_r').on('input', function() { PubSub.publish('bpm', $('#bpm_r').val() ) });
    $('#bpm_n').on('input', function() { PubSub.publish('bpm', $('#bpm_n').val() ) });
    $('#hz_r').on('input', function() { PubSub.publish('bpm', 60 * $('#hz_r').val() ) });
    $('#hz_n').on('input', function() { PubSub.publish('bpm', 60 * $('#hz_n').val() ) });
    $('#period_r').on('input', function() { PubSub.publish('bpm', 60 / $('#period_r').val() ) });
    $('#period_n').on('input', function() { PubSub.publish('bpm', 60 / $('#period_n').val() ) });
  }
}


let PressureControl = {

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
        console.log(`Systole: ${systole}`);
        PressureWave.diastole = diastole;
        PressureWave.systole = systole;
        PubSub.publish('diastole', diastole);
        PubSub.publish('systole', systole);
        PressureWave.draw_waveform();
      }
    });

    //  Diastole textbox
    PubSub.subscribe('diastole', function(new_diastole) {
      new_diastole = Number(new_diastole);
      $('#diastole_n').val(new_diastole);
      $('#pressure-range').slider('values', 0, new_diastole);
      $('#systole_n').attr('min', new_diastole);  //  Diastole must be < systole
      PressureWave.diastole = new_diastole;
      PressureWave.draw_waveform();
    });
    $('#diastole_n').on('input', function() { PubSub.publish('diastole', $('#diastole_n').val() ) });

    //  Systole textbox
    PubSub.subscribe('systole', function(new_systole) {
      new_systole = Number(new_systole);
      $('#systole_n').val(new_systole);
      $('#pressure-range').slider('values', 1, new_systole);
      $('#diastole_n').attr('max', new_systole);  //  systole must be > systole
      PressureWave.systole = new_systole;
      PressureWave.draw_waveform();
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

export { BpmControls, PressureControl, PulseButtons }

