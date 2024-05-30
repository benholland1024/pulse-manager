

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

function boot() {
  //reactive_update('inflow_r','inflow_n');
  //reactive_update('outflow_r','outflow_n');
  pubsub.subscribe('inflow', function(new_data) {
    $('#inflow_n').attr('value', new_data);
    $('#inflow_r').attr('value', new_data);
  });
  pubsub.publish( 'inflow', $('#inflow_r').val() );
  pubsub.subscribe('outflow', function(new_data) {
    $('#outflow_n').attr('value', new_data);
    $('#outflow_r').attr('value', new_data);
  });
  pubsub.publish( 'outflow', $('#outflow_r').val() );
}
boot();


function reactive_update(from, to) {
  let new_val = $(`#${from}`).val();
  $('#' + to).attr('value', new_val);
}

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
let yValues = [];       //  y value list, the same size as xValues
let pulse_i = 0;        //  Which x value is the pulse on?
let chart = undefined;  //  The chart. Populated in draw_chart()
let pulse_loop;         //  Starts & stops the pulse loop

//  Change these to edit the software:
const label_step = .5;  //  Which x labels should be shown? MUST be multiple of step_size
const step_size = .025; //  The interval between graph points

//  Fill the list of xValues, based on bpm
function get_xValues() {
  xValues = [];
  //  beats/min * 1min/60sec = beats/sec = hz
  let hz = bpm / 60;
  document.getElementById('hz').innerHTML = Math.round(hz * 1000) / 1000;
  //  period T = 1 / f
  let period = 1 / hz;
  document.getElementById('period').innerHTML = period;
  let x_max = 2 * period;
  //  The steps are each 1/40th of a second
  let x_range = Math.floor(x_max);
  for (let i = 0; i < x_max + (step_size * 2); i += step_size) {
    xValues.push(i);
  }
}

//  Fill the list of yValues
function get_yValues() {
  yValues = [];
  let xrange = xValues.length - 1;
  for (let i = 0; i < xrange; i++) {
    let value = get_yValue(i);
    yValues.push(value);
  }
}

//  Get an individual y value. Needed for pulse drawing
function get_yValue(i) {
  let xrange = xValues.length - 1;
  let yrange = systole - diastole;
   //  4 Pi because we want 2 wavelengths.
  let value = diastole + ( Math.sin(i * 4 * Math.PI / xrange ) * yrange );
  if (value < diastole)
    value = diastole;
  return value;
}

//  Draw the waveform, with no changes
function draw_waveform() {
  get_yValues();
  chart.data.datasets[0].data = yValues;
  chart.update();
}

//  Trigged by "start pulse" button
function start_pulse() {
  yValues = [];
  draw_graph();
  pulse_loop = setInterval(pulse_step, step_size * 1000);
  document.getElementById('stop-pulse').style.display = 'block';
  document.getElementById('start-pulse').style.display = 'none';
}

//  Runs every few milliseconds after "start_pulse()"
function pulse_step() {
  let value = get_yValue(pulse_i);
  chart.data.datasets[0].data.push(value);
  chart.update();
  if (pulse_i < xValues.length - 1) {
    pulse_i++;
  } else {
    yValues = [];
    chart.data.datasets[0].data = yValues;
    pulse_i = 0;
    chart.update(step_size);
  }
}

//  Stops the pulse loop
function stop_pulse() {
  clearInterval(pulse_loop);
  pulse_i = 0;
  draw_waveform();
  document.getElementById('start-pulse').style.display = 'block';
  document.getElementById('stop-pulse').style.display = 'none';
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
        data: yValues
      }]
    },
    options: {
      legend: {display: false},
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
//draw_graph();

/*
  When the chart first loads, it shows the waveform,
    without pulsing. The heart is at diastole.

  The range of x values scales with the bpm, to show
    two waves. For 100bpm (1.67Hz), T = 1/1.67 = .60s,
    thus the x values are 0 to (2*0.60), or 0 to 1.2s.

  The amount each x value steps is such that:
    1. Each wave is shown by at least 20 values
    2. There is a step for each round second value

  The range of y values scales between diastole and
    systole. Systole must be higher than diastole.

  When the pulse starts, the x values remain the same,
    but the y values are added 1 by 1 over time.
*/


//  Example of how to expose JS functions to Python
eel.expose(prompt_alerts);
function prompt_alerts(description) {
  alert(description);
}
