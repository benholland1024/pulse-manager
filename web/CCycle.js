/*         [art from loveascii.com/hearts.html]
                    |  \ \ | |/ /
                    |  |\ `' ' /
                    |  ;'aorta \      / , pulmonary
                    | ;    _,   |    / / ,  arteries
           superior | |   (  `-.;_,-' '-' ,
          vena cava | `,   `-._       _,-'_
                    |,-`.    `.)    ,<_,-'_, pulmonary
                   ,'    `.   /   ,'  `;-' _,  veins
                  ;        `./   /`,    \-'
                  | right   /   |  ;\   |\
                  | atrium ;_,._|_,  `, ' \
                  |        \    \ `       `,
                  `      __ `    \   left  ;,
                   \   ,'  `      \,  ventricle
                    \_(            ;,      ;;
                    |  \           `;,     ;;
           inferior |  |`.          `;;,   ;'
          vena cava |  |  `-.        ;;;;,;'
                    |  |    |`-.._  ,;;;;;'
                    |  |    |   | ``';;;'
                            aorta
*/


//
//    --^v--^v--  CCycle: Cardiac Cycle  --^v--^v--
//

let CCycle = {
  bpm:           100,        //  Beats per minute
  diastole:      80,         //  Pressure at diastole in mmHg
  systole:       120,        //  Pressure at systole
  xValues:       [],         //  A list of each x value plotted

  //  CONSTANTS:
  step_size:     0.025,      //  The interval between graph points
  label_step:    0.5,        //  Which x labels should be shown? (Must be a multiple of step_size)

  //  Methods
  get_xValues:   CCycle_get_xValues,
  update_bpm:    CCycle_update_bpm,
  draw:          CCycle_draw
}

//  Returns a list of xValues, based on bpm
function CCycle_get_xValues() {
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

//  Update the bpm, and related values
function CCycle_update_bpm(new_bpm) {
  this.bpm = new_bpm;
  this.xValues = this.get_xValues();
  this.draw();
}

//  Draw all waves
function CCycle_draw() {
  console.log("TODO: Draw all waveforms");
  PressureWave.draw();
  //       this.chart.data.labels = this.xValues;
  //       this.chart.update();

}

export default CCycle;
