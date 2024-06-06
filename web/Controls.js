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


let DiastoleControl = {
  init: function() {
    //  Reactive diastole
    PubSub.subscribe('diastole', function(new_data) {
      new_data = Number(new_data);
      $('#diastole_n').val(new_data);
      $('#diastole_r').val(new_data);
      $('#systole_n').attr('min', new_data + 10);  //  Diastole must be < systole
      $('#systole_r').attr('min', new_data + 10);
      $('#systole_min').text(new_data + 10);
      PressureWave.diastole = new_data;
      PressureWave.draw_waveform();
    });
    $('#diastole_r').on('input', function() { PubSub.publish('diastole', $('#diastole_r').val() ) });
    $('#diastole_n').on('input', function() { PubSub.publish('diastole', $('#diastole_n').val() ) });
  }
}


let SystoleControl = {
  init: function() {
    //  Reactive systole
    PubSub.subscribe('systole', function(new_data) {
      $('#systole_n').val(new_data);
      $('#systole_r').val(new_data);
      $('#diastole_n').attr('max', new_data - 10);  //  Systole must be > diastole
      $('#diastole_r').attr('max', new_data - 10);
      $('#diastole_max').text(new_data - 10);
      PressureWave.systole = new_data;
      PressureWave.draw_waveform();
    });
    $('#systole_r').on('input', function() { PubSub.publish('systole', $('#systole_r').val() ) });
    $('#systole_n').on('input', function() { PubSub.publish('systole', $('#systole_n').val() ) });
  }
}
export { BpmControls, DiastoleControl, SystoleControl }
//export BpmControls;
//export DiastoleControl;
//export SystoleControl;
