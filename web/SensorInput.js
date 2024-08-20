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
  update_flowrate:  SensorInput_update_flowrate,
  update_pressure:  SensorInput_update_pressure,
  get_table_rows:   SensorInput_get_table_rows,
  new_run:          SensorInput_new_run
}

//  Returns HTML elements for the data table, given a run array
function SensorInput_get_table_rows(run) {
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

//  Called from UserInput.  Updates the pressure display + current_run
function SensorInput_update_pressure(pressure) {
  $('#m-pressure').text(pressure);
  SensorInput.current_run.push({
    time: Math.round(UserInput.clock*100) / 100,
    vp:   pressure,
    ap:   0,
    mp:   0,
    bloodflow: 0,
    airflow:   0
  });
  $('#data-table table').html(SensorInput.get_table_rows(SensorInput.current_run));
}

//  Called from UserInput. Updates the pressure display + flow_rate
function SensorInput_update_flowrate(flowrate) {
  $('#m-flowrate').text(flowrate);
  console.log(`New flowrate: ${flowrate}`)
}

//  Starts recording a new set of data
function SensorInput_new_run() {
  if (this.current_run.length != 0) {
    //  This copies an object, instead of referencing it
    this.run_history.push(JSON.parse(JSON.stringify(this.current_run)));
    this.current_run = [];
  }
  let run_num = this.run_history.length + 1;
  $('#run-selector').append(`<option value="${run_num}">Run ${run_num}</option>`);
}

export default SensorInput;
