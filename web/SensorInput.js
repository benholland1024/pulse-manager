//
//    --^v--^v--  SensorInput.js  --^v--^v--
//

//    Manages sensor input: pressure, flowrate, camera

import PubSub from './PubSub.js';
import UserInput from './UserInput.js';

let SensorInput = {

  //  VARIABLES
  current_run: [
    /*{
      time: 0,
      vp:   0,
      ap:   0,
      mp:   0,
      bloodflow: 0,
      airflow:   0
    }*/
  ],
  run_history: [], //  An array of arrays, each being a "current_run"

  //  CONSTANTS:

  //  Methods
  // init:             SensorInput_init,
  new_run:     SensorInput_new_run
}

//  Returns HTML elements for the data table, given a run array
function run_to_table_rows(run) {
  let html = `<tr>
              <th>Time (s)</th>
              <th>VP</th>
              <th>AP</th>
              <th>MP</th>
              <th>Blood flow</th>
              <th>Airflow flow</th>
            </tr>`;
  for (let i = 0; i < run.length; i++) {
    let row = run[i];
    html += `<tr>
              <td>${row.time}</td>
              <td>${row.vp}</td>
              <td>${row.ap}</td>
              <td>${row.mp}</td>
              <td>${row.bloodflow}</td>
              <td>${row.airflow}</td>
            </tr>`;
  }
  return html;
}

//  Called from Python!  Updates the pressure display + current_run
eel.expose(update_pressure);
function update_pressure(pressure) {
  $('#m-pressure').text(pressure);
  SensorInput.current_run.push({
    time: Math.round(UserInput.clock*100) / 100,
    vp:   pressure,
    ap:   0,
    mp:   0,
    bloodflow: 0,
    airflow:   0
  });
  $('#data-table table').html(run_to_table_rows(SensorInput.current_run));
}

//  Called from Python!  Updates the pressure display + flow_rate
eel.expose(update_flowrate);
function update_flowrate(flowrate) {
  $('#m-flowrate').text(flowrate);
  console.log(`New flowrate: ${flowrate}`)
}

function SensorInput_new_run() {
  if (this.current_run.length != 0) {
    //  This is a hacky way to copy an object, instead of referencing it
    this.run_history.push(JSON.parse(JSON.stringify(this.current_run)));
    this.current_run = [];
  }
  let run_num = this.run_history.length + 1;
  $('#run-selector').append(`<option value="${run_num}">Run ${run_num}</option>`);
}

export default SensorInput;
