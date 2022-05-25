var run_lim, a, d_t;
var l = 1;
var g = 9.81;
var w = Math.sqrt(g / l);
var v = 0;
var angle = 45;
var angle_m = 45;
var x = Math.cos((angle + 90) / 180 * Math.PI);

onmessage = function (e) {
    //console.log('Message received from main script');
    if (e.data === "initiate") {
        console.log("initiated");
        postMessage("initiated");
    } else {
        let d_t = e.data[0];
        let run_lim = e.data[1];

        // Accurate in x-axis
        for (var run = 0; run < (run_lim); run++) {
            a = -g / l * x * (3 * Math.sqrt(1 - Math.pow(x / l, 2)) - 2 * Math.sqrt(1 - Math.pow(Math.cos((angle_m + 90) / 180 * Math.PI) / l, 2)));
            v = v + a * d_t;
            x = x + v * d_t + 1 / 2 * a * Math.pow(d_t, 2);
        }
        let angle = Math.acos(x) * 180 / Math.PI - 90;
        console.log("angle from worker ", angle);

        //console.log('Posting message back to main script');
        postMessage(angle);
    }
}

/*
    TODO:
        reset() function
*/