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
    const ctx = document.getElementById('myChart');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Red', 'Blue', 'Yellow', 'Green', 'Purple', 'Orange'],
            datasets: [{
                label: '# of Votes',
                data: [12, 19, 3, 5, 2, 3],
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}
draw_graph();

//  Example of how to expose JS functions to Python
eel.expose(prompt_alerts);
function prompt_alerts(description) {
  alert(description);
}
