

//     ###     ###                 ###     ###
//    #   #   #     Pressure Wave     #   #   #
// ###     ###                         ###     ###

//          Manages the graph of aortic &
//               ventricular pressure.

let PressureWave = {
  //  Properties:
  bpm:        100,        //  Beats per minute
  diastole:   80,         //  Pressure at diastole in mmHg
  systole:    120,        //  Pressure at systole

  xValues:    [],         //  A list of each x value plotted
  ap:         [],         //  Aortic pressure (y value list, the same size as xValues)
  ap_faded:   [],         //  A faded version of the waveform, for the pulse
  vp:         [],         //  Ventricular pressure
  vp_faded:   [],
  pulse_i:    0,          //  Which x value is the pulse currently on?
  chart:      undefined,  //  Stores a ChartJS object
  pulse_loop: undefined,  //  Stores a setInterval object

  //  CONSTANTS:
  step_size: 0.025,     //  The interval between graph points
  label_step: 0.5,      //  Which x labels should be shown? (Must be a multiple of step_size)

  //  Methods:
  get_xValues:   PressureWave_get_xValues,
  get_ap_all:    PressureWave_get_ap_all,
  get_ap_value:  PressureWave_get_ap_value,
  get_vp_all:    PressureWave_get_vp_all,
  get_vp_value:  PressureWave_get_vp_value,

  update_bpm:    PressureWave_update_bpm,
  draw_waveform: PressureWave_draw_waveform,
  start_pulse:   PressureWave_start_pulse,
  pulse_step:    PressureWave_pulse_step,
  stop_pulse:    PressureWave_stop_pulse,
  init:          PressureWave_init

}

//  Returns a list of xValues, based on bpm
function PressureWave_get_xValues() {
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

//  Return all atrial pressures
function PressureWave_get_ap_all() {
  let _ap = [];
  let xrange = this.xValues.length - 1;
  for (let i = 0; i < xrange; i++) {
    let value = this.get_ap_value(i);
    _ap.push(value);
  }
  return _ap;
}

//  Return an individual y value. Needed for pulse drawing
function PressureWave_get_ap_value(i) {
  let xrange = this.xValues.length - 1;
  let yrange = this.systole - this.diastole;
   //  4 Pi because we want 2 wavelengths.
  let value = this.diastole + ( yrange * Math.sin(i * 4 * Math.PI / xrange ) );
  value = Math.round(value * 1000) / 1000;
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
  value = Math.round(value * 1000) / 1000;
  if (value < 0)
    value = 0;
  return value;
}

//
function PressureWave_update_bpm(new_bpm) {
  this.bpm = new_bpm;
  this.xValues = this.get_xValues();
  this.draw_waveform();
  this.chart.data.labels = this.xValues;
  this.chart.update();
}

//  Draw the waveform, with no changes
function PressureWave_draw_waveform() {
  this.ap = this.get_ap_all();
  this.vp = this.get_vp_all();
  this.ap_faded = this.get_ap_all();
  this.vp_faded = this.get_vp_all();
  this.chart.data.datasets[0].data = this.ap;
  this.chart.data.datasets[1].data = this.vp;
  this.chart.data.datasets[2].data = this.ap_faded;  //  faded datasets
  this.chart.data.datasets[3].data = this.vp_faded;
  this.chart.update();
}

//  Trigged by "start pulse" button
function PressureWave_start_pulse() {
  this.ap = [];
  this.vp = [];
  this.chart.data.datasets[0].data = this.ap;
  this.chart.data.datasets[1].data = this.vp;
  this.chart.update();
  this.pulse_loop = setInterval(this.pulse_step, Math.round(this.step_size * 1000));
  $('#stop-pulse').css('display', 'block');
  $('#start-pulse').css('display', 'none');
  eel.start_PWM(12);
}

let clock = 0;
//  Runs every few milliseconds after "start_pulse()"
function PressureWave_pulse_step() {
  let _this = PressureWave;
  clock += Math.round(_this.step_size * 1000) / 1000;
  $('#clock').text(Math.round(clock*100)/100);
  console.log(_this.chart.data.datasets);
  _this.chart.data.datasets[0].data.push( _this.get_ap_value( _this.pulse_i ) );
  _this.chart.data.datasets[1].data.push( _this.get_vp_value( _this.pulse_i ) );
  if (_this.pulse_i < _this.xValues.length - 1) {
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

  this.chart = new Chart("pressure-graph", {
    type: "line",
    data: {
      labels: this.xValues,
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
