//  Implements "reactive data!"
//    For example, when a slider updates, the text input updates too, and vice versa.
function reactive_update(from, to) {
    let new_val = document.getElementById(from).value;
    document.getElementById(to).value = new_val;
}

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
}

eel.expose(prompt_alerts);
function prompt_alerts(description) {
  alert(description);
}
