//  main.js  --  This file runs when the app loads.

//  Implements "reactive data"!  A pattern seen in all modern JS frameworks
//    For example, when a slider updates, the text input updates too, and vice versa.
//    Adapted from frontendmasters.com/blog/vanilla-javascript-reactivity.
const pubsub = {
  events: {},
  subscribe(event, callback) {
    if (!this.events[event]) this.events[event] = [];
    this.events[event].push(callback);
  },
  publish(event, data) {
    if (this.events[event]) this.events[event].forEach(function(callback) { callback(data) });
  }
};

//  Called when the page loads.
function boot() {
	console.log('Pulse manager loaded! Hello! <3');

	//  All these are setting up reactive data!
  pubsub.subscribe('inflow', function(new_data) {    //  Link slider to number picker
    console.log('inflow updated');
    $('#inflow_n').val(new_data);
    $('#inflow_r').val(new_data);
  });
  pubsub.publish( 'inflow', $('#inflow_r').val() );

  //  Reactive outflow
  pubsub.subscribe('outflow', function(new_data) {
    $('#outflow_n').val(new_data);
    $('#outflow_r').val(new_data);
  });
  pubsub.publish( 'outflow', $('#outflow_r').val() );

  //  Reactive bpm
  pubsub.subscribe('bpm', function(new_data) {
    $('#bpm_n').val(new_data);
    $('#bpm_r').val(new_data);
	  let hz = Math.round(new_data * 100 / 60) / 100;
		$('#hz_n').val(hz);
		$('#hz_r').val(hz);
		let period = Math.round(100 / hz) / 100;
		$('#period_n').val(period);
		$('#period_r').val(period);
	});
	pubsub.publish( 'bpm', $('#bpm_r').val() );

  //  Reactive diastole
  pubsub.subscribe('diastole', function(new_data) {
    $('#diastole_n').val(new_data);
    $('#diastole_r').val(new_data);
  });

  //  Reactive systole
  pubsub.subscribe('systole', function(new_data) {
    $('#systole_n').val(new_data);
    $('#systole_r').val(new_data);
  });

}
boot();

//  Test function to toggle LEDs.
function toggle_LED(pin_num) {
  eel.toggle_LED(pin_num);
}

//  Changes the mode (this toggles between two UI interfaces)
let current_mode = 'manual';
function change_mode(new_mode) {
  document.getElementById(current_mode + '-btn').classList.remove('active');
  document.getElementById(current_mode).style.display = "none";
  document.getElementById(new_mode + '-btn').classList.add('active');
  document.getElementById(new_mode).style.display = "block";
  current_mode = new_mode;
  if (current_mode == "waveform") {
    draw_graph();
    draw_waveform();
  }
}

//     ###     ###                 ###     ###
//    #   #   #    Graph functions    #   #   #
// ###     ###                         ###     ###

// The user changes these directly:
let bpm = 100;          //  Beats per minute
let diastole = 80;      //  Pressure at diastole in mmHg
let systole = 120;      //  Pressure at systole

//  Used by functions:
let xValues = [];       //  A list of each x value plotted
let ap = [];       //  y value list, the same size as xValues
let vp = []
let pulse_i = 0;        //  Which x value is the pulse on?
let chart = undefined;  //  The chart. Populated in draw_chart()
let pulse_loop;         //  Starts & stops the pulse loop

//  Change these to edit the software:
const label_step = .5;  //  Which x labels should be shown? MUST be multiple of step_size
const step_size = .025; //  The interval between graph points

//  Fill the list of xValues, based on bpm
function get_xValues() {
  xValues = [];
  let hz = bpm / 60;    //  Because b/m * 1min/60sec == b/s == hz
  let period = 1 / hz;  //  Because period T = 1 / f
  let x_max = 2 * period;
  //  The steps are each 1/40th of a second
  let x_range = Math.floor(x_max);
  for (let i = 0; i < x_max + (step_size * 2); i += step_size) {
    xValues.push(i);
  }
}

//  Get all atrial pressures
function get_ap_all() {
  ap = [];
  let xrange = xValues.length - 1;
  for (let i = 0; i < xrange; i++) {
    let value = get_ap_value(i);
    ap.push(value);
  }
}

//  Get an individual y value. Needed for pulse drawing
function get_ap_value(i) {
  let xrange = xValues.length - 1;
  let yrange = systole - diastole;
   //  4 Pi because we want 2 wavelengths.
  let value = diastole + ( yrange * Math.sin(i * 4 * Math.PI / xrange ) );
  if (value < diastole)
    value = diastole;
  return value;
}

//  Get left ventrical pressure
function get_vp_all() {
  vp = []
  let xrange = xValues.length - 1;
  for (let i = 0; i < xrange; i++) {
    let value = get_vp_value(i);
    vp.push(value);
  }
}

//
function get_vp_value(i) {
  let xrange = xValues.length - 1;
  let yrange = systole - diastole;
   //  4 Pi because we want 2 wavelengths.
  let value = ( systole * Math.sin(i * 4 * Math.PI / xrange ) );
  if (value < 0)
    value = 0;
  return value;
}

//  Draw the waveform, with no changes
function draw_waveform() {
  get_ap_all();
  get_vp_all();
  chart.data.datasets[0].data = ap;
  chart.data.datasets[1].data = vp;
  chart.update();
}

//  Trigged by "start pulse" button
function start_pulse() {
  ap = [];
  vp = [];
  draw_graph();
  pulse_loop = setInterval(pulse_step, step_size * 1000);
  $('#stop-pulse').css('display', 'block');
  $('#start-pulse').css('display', 'none');
  eel.start_PWM(12);
}

//  Runs every few milliseconds after "start_pulse()"
function pulse_step() {
  chart.data.datasets[0].data.push( get_ap_value( pulse_i ) );
  chart.data.datasets[1].data.push( get_vp_value( pulse_i ) );
  if (pulse_i < xValues.length - 1) {
    pulse_i++;
  } else {
    ap = [];
    vp = [];
    chart.data.datasets[0].data = ap;
    chart.data.datasets[1].data = vp;
    pulse_i = 0;
  }
  chart.update();
}

//  Stops the pulse loop
function stop_pulse() {
  clearInterval(pulse_loop);
  pulse_i = 0;
  draw_waveform();
  $('#start-pulse').css('display', 'block');
  $('#stop-pulse').css('display','none');
  eel.stop_PWM(12);
}

//
function draw_graph() {
  get_xValues();

  let fontColor = 'white';
  let gridlineColor = '#333';

  chart = new Chart("pulse-graph", {
    type: "line",
    data: {
      labels: xValues,
      datasets: [{
        fill: false,
        pointRadius: 2,
        borderColor: "rgba(255,100,100,1)",
        label: 'Aortic pressure (AP)',
        showLine: false,
        data: ap
      }, {
        fill: false,
        pointRadius: 2,
        borderColor: "rgba(180,100,200,1)",
        label: 'Ventricular pressure (VP)',
        data: vp
      }]
    },
    options: {
      legend: {
        display: true,
        labels: {
          fontColor: fontColor
        }
      },
      title: {
        display: true,
        text: "Current waveform:",
        fontSize: 16,
        fontColor: fontColor,
      },
      scales: {
        yAxes: [{
          scaleLabel: {
            display: true,
               labelString: 'Pressure (mmHg)',
            fontColor: fontColor
          },
          ticks: {
            fontColor: fontColor,
            suggestedMin: 0,
            suggestedMax: 200
          }
        }],
        xAxes: [{
          scaleLabel: {
            display: true,
            labelString: 'Time (s)',
            fontColor: fontColor
          },
          ticks: {
            fontColor: fontColor,
            //  This hides unlabelled x-values. See const label_step
            callback: function(value, index, values) {
              let scaled_step = label_step * 1000;
              if (Math.round(value * 1000) % scaled_step == 0) {
                return Math.round(value * 1000) / 1000;
              } else {
                return null;
              }
            }
          }

        }]
      }
    }
  });
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


//  Example of how to expose JS functions to Python (not used
eel.expose(prompt_alerts);
function prompt_alerts(description) {
  alert(description);
}
