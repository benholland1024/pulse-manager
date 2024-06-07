

// ###     ###                         ###     ###
//    #   #   #      Airflow Wave     #   #   #
//     ###     ###                 ###     ###

//          Manages the graph of airflow,
//              which causes pressure.
//        This is dependent on PressureWave.js

import PressureWave from './PressureWave.js';

let AirflowWave = {
  //  Properties:
  inflow:     [],         //  List of airflow values, which can be negative
                          //    (y value list, the same size as PressureWave.xValues)
  chart:      undefined,  //  Stores a ChartJS object
  pulse_loop: undefined,  //  Stores a setInterval object

  //  CONSTANTS:  See PressureWave
  step_size: 0.025,     //  The interval between graph points
  label_step: 0.5,      //  Which x labels should be shown? (Must be a multiple of step_size)

  //  Methods:
  get_inflow_all:    AirflowWave_get_inflow_all,
  get_inflow_value:  AirflowWave_get_inflow_value,

  update_bpm:    PressureWave_update_bpm,
  draw_waveform: PressureWave_draw_waveform,
  start_pulse:   PressureWave_start_pulse,
  pulse_step:    PressureWave_pulse_step,
  stop_pulse:    PressureWave_stop_pulse,
  init:          PressureWave_init

}

//  Return all inflow values
function AirflowWave_get_inflow_all() {
  let _inflow = [];
  let xrange = PressureWave.xValues.length - 1;
  for (let i = 0; i < xrange; i++) {
    let value = this.get_inflow_value(i);
    _inflow.push(value);
  }
  return _inflow;
}

//  Return an individual y value. Needed for pulse drawing
function PressureWave_get_ap_value(i) {
  let xrange = this.xValues.length - 1;
  let yrange = this.systole - this.diastole;
   //  4 Pi because we want 2 wavelengths.
  let value = this.diastole + ( yrange * Math.sin(i * 4 * Math.PI / xrange ) );
  if (value < this.diastole)
    value = this.diastole;
  return value;
}

//  Get left ventrical pressure
function PressureWave_get_vp_all() {
  let _vp = []
  let xrange = this.xValues.length - 1;
  for (let i = 0; i < xrange; i++) {
    let value = this.get_vp_value(i);
    _vp.push(value);
  }
  return _vp;
}

//
function PressureWave_get_vp_value(i) {
  let xrange = this.xValues.length - 1;
  let yrange = this.systole - this.diastole;
   //  4 Pi because we want 2 wavelengths.
  let value = ( this.systole * Math.sin(i * 4 * Math.PI / xrange ) );
  if (value < 0)
    value = 0;
  return value;
}

function PressureWave_update_bpm(new_bpm) {
  this.bpm = new_bpm;
  this.xValues = this.get_xValues();
  this.chart.data.labels = this.xValues;
  this.chart.update();
}

//  Draw the waveform, with no changes
function PressureWave_draw_waveform() {
  this.ap = this.get_ap_all();
  this.vp = this.get_vp_all();
  this.chart.data.datasets[0].data = this.ap;
  this.chart.data.datasets[1].data = this.vp;
  this.chart.update();
}

//  Trigged by "start pulse" button
function PressureWave_start_pulse() {
  this.ap = [];
  this.vp = [];
  this.init();
  this.pulse_loop = setInterval(this.pulse_step, this.step_size * 1000);
  $('#stop-pulse').css('display', 'block');
  $('#start-pulse').css('display', 'none');
  eel.start_PWM(12);
}

//  Runs every few milliseconds after "start_pulse()"
function PressureWave_pulse_step() {
  console.log(this.chart.data.datasets);
  this.chart.data.datasets[0].data.push( this.get_ap_value( pulse_i ) );
  this.chart.data.datasets[1].data.push( this.get_vp_value( pulse_i ) );
  if (this.pulse_i < this.xValues.length - 1) {
    this.pulse_i++;
  } else {
    this.ap = [];
    this.vp = [];
    this.chart.data.datasets[0].data = ap;
    this.chart.data.datasets[1].data = vp;
    this.pulse_i = 0;
  }
  this.chart.update();
}

//  Stops the pulse loop
function PressureWave_stop_pulse() {
  clearInterval(this.pulse_loop);
  this.pulse_i = 0;
  this.draw_waveform();
  $('#start-pulse').css('display', 'block');
  $('#stop-pulse').css('display','none');
  eel.stop_PWM(12);
}

//
function PressureWave_init() {
  this.xValues = this.get_xValues();

  let fontColor = 'white';
  let gridlineColor = '#333';
  let _this = this; //  To refer to PressureWave and not Chart

  this.chart = new Chart("pulse-graph", {
    type: "line",
    data: {
      labels: this.xValues,
      datasets: [{
        fill: false,
        pointRadius: 2,
        borderColor: "rgba(255,100,100,1)",
        label: 'Aortic pressure (AP)',
        showLine: false,
        data: this.ap
      }, {
        fill: false,
        pointRadius: 2,
        borderColor: "rgba(180,100,200,1)",
        label: 'Ventricular pressure (VP)',
        data: this.vp
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
              let scaled_step = _this.label_step * 1000;
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

export default PressureWave;
