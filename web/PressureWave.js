

//     ---     ---                 ---     ---
//    /   \   /     Pressure Wave     \   /   \
// ---     ---                         ---     ---

//          Manages the graph of aortic &
//               ventricular pressure.

import UserInput from './UserInput.js';

let PressureWave = {
  //  Properties:
  ap:         [],         //  Aortic pressure (y value list, the same size as xValues)
  ap_faded:   [],         //  A faded version of the waveform, for the pulse
  vp:         [],         //  Ventricular pressure
  vp_faded:   [],
  pulse_i:    0,          //  Which x value is the pulse currently on?
  chart:      undefined,  //  Stores a ChartJS object
  pulse_loop: undefined,  //  Stores a setInterval object

  //  Methods:
  get_ap_all:    PressureWave_get_ap_all,
  get_ap_value:  PressureWave_get_ap_value,
  get_vp_all:    PressureWave_get_vp_all,
  get_vp_value:  PressureWave_get_vp_value,

  draw:          PressureWave_draw,
  start_pulse:   PressureWave_start_pulse,
  pulse_step:    PressureWave_pulse_step,
  stop_pulse:    PressureWave_stop_pulse,
  init:          PressureWave_init

}

//  Return all atrial pressures
function PressureWave_get_ap_all() {
  let _ap = [];
  let xrange = UserInput.xValues.length - 1;
  for (let i = 0; i < xrange; i++) {
    let value = this.get_ap_value(i);
    _ap.push(value);
  }
  return _ap;
}

//  Return an individual y value. Needed for pulse drawing
function PressureWave_get_ap_value(i) {
  let xrange = UserInput.xValues.length - 1;
  let yrange = UserInput.systole - UserInput.diastole;
   //  4 Pi because we want 2 wavelengths.
  let value = UserInput.diastole + ( yrange * Math.sin(i * 4 * Math.PI / xrange ) );
  value = Math.round(value * 1000) / 1000;
  if (value < UserInput.diastole)
    value = UserInput.diastole;
  return value;
}

//  Get left ventrical pressure
function PressureWave_get_vp_all() {
  let _vp = []
  let xrange = UserInput.xValues.length - 1;
  for (let i = 0; i < xrange; i++) {
    let value = this.get_vp_value(i);
    _vp.push(value);
  }
  return _vp;
}

//
function PressureWave_get_vp_value(i) {
  let xrange = UserInput.xValues.length - 1;
  let yrange = UserInput.systole - UserInput.diastole;
   //  4 Pi because we want 2 wavelengths.
  let value = ( UserInput.systole * Math.sin(i * 4 * Math.PI / xrange ) );
  value = Math.round(value * 1000) / 1000;
  if (value < 0)
    value = 0;
  return value;
}

//  Draw the waveform, with no changes
function PressureWave_draw() {
  this.ap = this.get_ap_all();
  this.vp = this.get_vp_all();
  this.ap_faded = this.get_ap_all();
  this.vp_faded = this.get_vp_all();
  this.chart.data.datasets[0].data = this.ap;
  this.chart.data.datasets[1].data = this.vp;
  this.chart.data.datasets[2].data = this.ap_faded;  //  faded datasets
  this.chart.data.datasets[3].data = this.vp_faded;
  this.chart.data.labels = UserInput.xValues;
  this.chart.update();
}

//  Trigged by "start pulse" button
function PressureWave_start_pulse() {
  this.ap = [];
  this.vp = [];
  this.chart.data.datasets[0].data = this.ap;
  this.chart.data.datasets[1].data = this.vp;
  this.chart.update();
}

//  Runs every few milliseconds after "start_pulse()"
function PressureWave_pulse_step() {
  let _this = PressureWave;
  _this.chart.data.datasets[0].data.push( _this.get_ap_value( _this.pulse_i ) );
  _this.chart.data.datasets[1].data.push( _this.get_vp_value( _this.pulse_i ) );
  if (_this.pulse_i < UserInput.xValues.length - 1) {
    _this.pulse_i++;
  } else {
    _this.ap = [];
    _this.vp = [];
    _this.chart.data.datasets[0].data = _this.ap;
    _this.chart.data.datasets[1].data = _this.vp;
    _this.pulse_i = 0;
  }
  _this.chart.update();
}

//  Stops the pulse loop
function PressureWave_stop_pulse() {
  clearInterval(this.pulse_loop);
  this.pulse_i = 0;
  this.draw();
}

//
function PressureWave_init() {

  let fontColor = 'white';
  let gridLineColor = 'rgba(255,255,255,0.1)';
  let _this = this; //  To refer to PressureWave and not Chart

  this.chart = new Chart("pressure-graph", {
    type: "line",
    data: {
      labels: UserInput.xValues,
      datasets: [{  //  AP values
        fill: false,
        pointRadius: 2,
        borderColor: "rgba(255,100,100,1)",
        label: 'Aortic pressure (AP)',
        showLine: false,
        data: this.ap
      }, {          //  VP values
        fill: false,
        pointRadius: 2,
        borderColor: "rgba(180,100,200,1)",
        label: 'Ventricular pressure (VP)',
        data: this.vp
      }, {          //  AP "faded values" for pulse
        fill: false,
        pointRadius: 2,
        borderColor: "rgba(255,100,100,0.5)",
        label: 'hide this',
        showLine: false,
        data: this.ap_faded,
        options: {legend: {display:false}}
      }, {          //  AP "faded values" for pulse
        fill: false,
        pointRadius: 2,
        borderColor: "rgba(180,100,200,0.5)",
        label: 'hide this',
        data: this.vp_faded
      }]
    },
    options: {
      legend: {
        display: true,
        labels: {
          fontColor: fontColor,
          filter: function (item, data) { return item.text != 'hide this'; }
        },
      },
      tooltips: {
        filter: function (item) { return item.datasetIndex < 2; }
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
          gridLines: {
            color: gridLineColor
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
          gridLines: {
            color: gridLineColor
          },
          ticks: {
            fontColor: fontColor,
            //  This hides unlabelled x-values. See const label_step
            callback: function(value, index, values) {
              return value;
              let scaled_step = UserInput.label_step * 1000;
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
