//
//    --^v--^v--  SensorInput.js  --^v--^v--
//

//    Manages sensor input: pressure, flowrate, camera

import PubSub from './PubSub.js';
import UserInput from './UserInput.js';

let SensorInput = {

  //  VARIABLES BEING MEASURED
  history: [
    /*{
      time: 0,
      vp:   0,
      ap:   0,
      mp:   0,
      bloodflow: 0,
      airflow:   0
    }*/
  ]

  //  CONSTANTS:

  //  Methods
  // init:             SensorInput_init,
  // update_pressure:  SensorInput_update_pressure
}

//  Returns HTML elements for the data table, given a history object
function history_to_table_rows(history) {
  let html = `<tr>
              <th>Time (s)</th>
              <th>VP</th>
              <th>AP</th>
              <th>MP</th>
              <th>Blood flow</th>
              <th>Airflow flow</th>
            </tr>`;
  for (let i = 0; i < history.length; i++) {
    let row = history[i];
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

eel.expose(update_pressure);
function update_pressure(pressure) {
  $('#m-pressure').text(pressure);
  console.log(`New pressure: ${pressure}`)
  SensorInput.history.push({
    time: Math.round(UserInput.clock*100) / 100,
    vp:   pressure,
    ap:   0,
    mp:   0,
    bloodflow: 0,
    airflow:   0
  });
  console.log(SensorInput.history);
  $('#data-table table').html(history_to_table_rows(SensorInput.history));
}

eel.expose(update_flowrate);
function update_flowrate(flowrate) {
  $('#m-flowrate').text(flowrate);
  console.log(`New flowrate: ${flowrate}`)
}

export default SensorInput;
