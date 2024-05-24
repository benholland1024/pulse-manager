
function boot() {
  reactive_update('inflow_r','inflow_n');
  reactive_update('inflow_n','inflow_r');
}
boot();

//  Implements "reactive data!"
//    For example, when a slider updates, the text input updates too, and vice versa.
function reactive_update(from, to) {
  let new_val = document.getElementById(from).value;
  document.getElementById(to).value = new_val;
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
  }
}

//
function draw_graph() {
  console.log("Called");
  var xValues = [];
  var yValues = [];
  generateData("80 + (Math.sin(x)*50)", 0, 10, 0.5);

  let fontColor = 'white';
  let gridlineColor = '#333';

  new Chart("pulse-graph", {
    type: "line",
    data: {
      labels: xValues,
      datasets: [{
        fill: false,
        pointRadius: 2,
        borderColor: "rgba(255,200,200,1)",
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
          }
        }],
        xAxes: [{
          scaleLabel: {
            display: true,
            labelString: 'Time (s)',
          }
        }]
      }
    }
  });
  function generateData(value, i1, i2, step = 1) {
    for (let x = i1; x <= i2; x += step) {
      let y_val = eval(value);
      if (y_val < 80) {
        y_val = 80;
      }
      yValues.push(y_val);
      xValues.push(x);
    }
  }
}
//draw_graph();

//  Example of how to expose JS functions to Python
eel.expose(prompt_alerts);
function prompt_alerts(description) {
  alert(description);
}
