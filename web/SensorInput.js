//
//    --^v--^v--  SensorInput.js  --^v--^v--
//

//    Manages sensor input: pressure, flowrate, camera

import PubSub from './PubSub.js';

let SensorInput = {

  //  VARIABLES BEING MEASURED
  pressure: 0,

  //  CONSTANTS:

  //  Methods
  // init:             SensorInput_init,
  // update_pressure:  SensorInput_update_pressure
}

eel.expose(update_pressure);
function update_pressure(pressure) {
  $('#m-pressure').text(pressure);
  console.log(`New pressure: ${pressure}`)
}

eel.expose(update_flowrate);
function update_flowrate(flowrate) {
  $('#m-flowrate').text(flowrate);
  console.log(`New flowrate: ${flowrate}`)
}

export default SensorInput;
