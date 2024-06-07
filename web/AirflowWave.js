// ###     ###                         ###     ###
//    #   #   #      Airflow Wave     #   #   #
//     ###     ###                 ###     ###

//          Manages the graph of airflow,
//              which causes pressure.
//        This is dependent on PressureWave.js

import PressureWave from './PressureWave.js';

let AirflowWave = {
  //  Properties:
  inflow:       [],         //  List of airflow values, which can be negative
                          //    (y value list, the same size as PressureWave.xValues)
  inflow_faded: [],
  chart:        undefined,  //  Stores a ChartJS object
  pulse_loop:   undefined,  //  Stores a setInterval object

  //  CONSTANTS:  See PressureWave
  step_size: 0.025,     //  The interval between graph points
  label_step: 0.5,      //  Which x labels should be shown? (Must be a multiple of step_size)

  //  Methods:
  get_inflow_all:    AirflowWave_get_inflow_all,
  get_inflow_value:  AirflowWave_get_inflow_value,

  update_bpm:    AirflowWave_update_bpm,
  draw_waveform: AirflowWave_draw_waveform,
  start_pulse:   AirflowWave_start_pulse,
  pulse_step:    AirflowWave_pulse_step,
  stop_pulse:    AirflowWave_stop_pulse,
  init:          AirflowWave_init

}

//  Return all atrial pressures
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
function AirflowWave_get_inflow_value(i) {
  let xrange = PressureWave.xValues.length - 1;
  let yrange = PressureWave.systole - PressureWave.diastole;
   //  4 Pi because we want 2 wavelengths
  let value = 10 * Math.cos(i * 4 * Math.PI / xrange );
  let pressure_value = PressureWave.diastole + ( yrange * Math.sin(i * 4 * Math.PI / xrange ) );
  value = Math.round(value * 1000) / 1000;
  if (pressure_value < PressureWave.diastole)
    value = 0;
  return value;
}


//
function AirflowWave_update_bpm(new_bpm) {
  this.bpm = new_bpm;
  PressureWave.xValues = this.get_xValues();
  this.draw_waveform();
  this.chart.data.labels = PressureWave.xValues;
  this.chart.update();
}

//  Draw the waveform, with no changes
function AirflowWave_draw_waveform() {
  this.inflow = this.get_inflow_all();
  this.inflow_faded = this.get_inflow_all();
  this.chart.data.datasets[0].data = this.inflow;
  this.chart.data.datasets[1].data = this.inflow_faded;  //  faded datasets
  this.chart.update();
}

//  Trigged by "start pulse" button
function AirflowWave_start_pulse() {
  this.inflow = [];
  this.chart.data.datasets[0].data = this.inflow;
  this.chart.data.datasets[1].data = this.inflow_faded;
  this.chart.update();
  this.pulse_loop = setInterval(this.pulse_step, Math.round(this.step_size * 1000));
  $('#stop-pulse').css('display', 'block');
  $('#start-pulse').css('display', 'none');
  eel.start_PWM(12);
}

let clock = 0;
//  Runs every few milliseconds after "start_pulse()"
function AirflowWave_pulse_step() {
  let _this = AirflowWave;
  clock += Math.round(_this.step_size * 1000) / 1000;
  $('#clock').text(Math.round(clock*100)/100);
  console.log(_this.chart.data.datasets);
  _this.chart.data.datasets[0].data.push( _this.get_inflow_value( _this.pulse_i ) );
  if (_this.pulse_i < PressureWave.xValues.length - 1) {
    _this.pulse_i++;
  } else {
    _this.inflow = [];
    _this.chart.data.datasets[0].data = _this.inflow;
    _this.pulse_i = 0;
  }
  _this.chart.update();
}

//  Stops the pulse loop
function AirflowWave_stop_pulse() {
  clearInterval(this.pulse_loop);
  this.pulse_i = 0;
  this.draw_waveform();
  $('#start-pulse').css('display', 'block');
  $('#stop-pulse').css('display','none');
  eel.stop_PWM(12);
}

//
function AirflowWave_init() {

  let fontColor = 'white';
  let gridlineColor = '#333';
  let _this = this; //  To refer to AirflowWave and not Chart

  this.chart = new Chart("airflow-graph", {
    type: "line",
    data: {
      labels: PressureWave.xValues,
      datasets: [{  //  Air inflow values
        fill: false,
        pointRadius: 2,
        borderColor: "rgba(100,100,250,1)",
        label: 'Air inflow',
        showLine: true,
        data: this.inflow
      }, {          //  Air inflow "faded values" for pulse
        fill: false,
        pointRadius: 2,
        borderColor: "rgba(100,100,250,0.5)",
        label: 'hide this',
        showLine: true,
        data: this.inflow_faded,
        options: {legend: {display:false}}
      }]
    },
    options: {
      legend: {
        display: true,
        labels: {
          fontColor: fontColor,
          filter: function (item, data) { return item.text != 'hide this'; }
        }
      },
      tooltips: {
        filter: function (item) { return item.datasetIndex < 1; }
      },
      title: {
        display: false,
        text: "Airflow waveform:",
        fontSize: 16,
        fontColor: fontColor,
      },
      scales: {
        yAxes: [{
          scaleLabel: {
            display: true,
               labelString: 'Air inflow (cm<sup>3</sup>/s)',
            fontColor: fontColor
          },
          ticks: {
            fontColor: fontColor,
            suggestedMin: -15,
            suggestedMax: 15
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

export default AirflowWave;
