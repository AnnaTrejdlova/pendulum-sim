var l = 1; // Length of string is 1m
var g = 9.81; // Gravitational acceleration on Earth
var angle_m = 45; // Maximal angular displacement (in degrees)
var angle = 45; // Current angular displacement
//var angle_i = 0; // Initial angle
var w = Math.sqrt(g / l); // Angular acceleration
var m = 1; // Mass in kg

let pendulums = [];

// var frameTime = [];

// var t;
// var t_i = performance.now(); // Initial time (in milliseconds)
// console.log(t_i);

var pendulum = document.getElementById("pendulum");
var pendulum2 = document.getElementById("pendulum2");
var angle2 = 45;

var angleSlider = document.getElementById("slider-angle");
var diplayAngleValue = document.getElementById("angle-value");
diplayAngleValue.innerText = angle_m + "°";
var lengthSlider = document.getElementById("slider-length");
var displayLengthValue = document.getElementById("length-value");
displayLengthValue.innerText = lengthSlider.value + "m";
var massSlider = document.getElementById("slider-mass");
var displayMassValue = document.getElementById("mass-value");
displayMassValue.innerText = massSlider.value + "kg";
var gravitySlider = document.getElementById("slider-gravity");
var displayGravityValue = document.getElementById("gravity-value");
displayGravityValue.innerHTML = gravitySlider.value + " m/s&#178;";

var energyKinetic = document.getElementById("energy-kinetic");
var energyPotential = document.getElementById("energy-potential");
var energyTotal = document.getElementById("energy-total");
var energyMax = document.getElementById("energy-max");
var energyDiff = document.getElementById("energy-diff");

var algorithm_options = document.getElementsByName("algorithm");
var pendulum_selection = document.getElementsByName("pend-select");
var algorithm = anim5;//anim3; ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

var d_t_i;
var direction = -1;
var isRunning = true;

// x-axis projection definitions
var x = -Math.sin((angle) / 180 * Math.PI);
var a = -Math.pow(w, 2) * x;
var v = 0;

var E_k = 1/2*m*Math.pow(v,2); // Kinetic energy
var E_p = m*g*(1-Math.cos((angle) / 180 * Math.PI)); // Potential energy
var E_p_max = m*g*(1-Math.cos((angle_m) / 180 * Math.PI)); // Max energy

var run_lim = 8000;
var myWorker;

var animationID;

//
// ────────────────────────────────────────────────────────── PAGE VISIBILITY ─────
//

var hidden, visibilityChange;
if (typeof document.hidden !== "undefined") {
    hidden = "hidden";
    visibilityChange = "visibilitychange";
} else if (typeof document.mozHidden !== "undefined") {
    hidden = "mozHidden";
    visibilityChange = "mozvisibilitychange";
} else if (typeof document.msHidden !== "undefined") {
    hidden = "msHidden";
    visibilityChange = "msvisibilitychange";
} else if (typeof document.webkitHidden !== "undefined") {
    hidden = "webkitHidden";
    visibilityChange = "webkitvisibilitychange";
} else {
    console.log("Page Visibility API not supported.");
}

//
// ─────────────────────────────────────────────────────────────────── ONLOAD ─────
//

window.onload = function () {
    window.addEventListener("keypress", keyPressed);
    document.addEventListener(visibilityChange, handleVisibilityChange, false);

    angleSlider.addEventListener("mousedown", angleSliderDrag);
    angleSlider.addEventListener("mouseup", angleSliderDrop);
    angleSlider.addEventListener("input", changeAngle);
    lengthSlider.addEventListener("input", changeLength);
    massSlider.addEventListener("input", changeMass);
    gravitySlider.addEventListener("input", changeGravity);

    algorithm_options.forEach(element => {
        element.addEventListener("change", (event) => {
            console.log(event);
            // x = -Math.sin((angle_m) / 180 * Math.PI);
            // a = -Math.pow(w, 2) * x;
            // v = 0;
            // NEEDS ENHANCEMENT
            stop();
            switch (event.target.value) {
                case "anim1":
                    algorithm = anim1;
                    console.log("Switched to anim1");
                    break;
                case "anim2":
                    algorithm = anim2;
                    console.log("Switched to anim2");
                    break;
                case "anim3":
                    algorithm = anim3;
                    console.log("Switched to anim3");
                    break;
                case "anim4":
                    algorithm = anim4;
                    console.log("Switched to anim4");
                    break;
                case "anim5":
                    x = -Math.sin((angle) / 180 * Math.PI); //maybe temporarily
                    algorithm = anim5;
                    console.log("Switched to anim5");
                    break;
            }
        })
    })

    pendulum_selection.forEach(element => {
        element.addEventListener("change", (event) => {
            console.log(event);
            // algorithm_options.find(element => element.value == red_pendulum.algorithm)
        })
    })

    //
    // ─── ADD TO HOMESCREEN ──────────────────────────────────────────────────────────
    //

    let deferredPrompt;

    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('service-worker.js')
            .then(function (reg) {
                console.log("service-worker registered");
            }).catch(function (err) {
                console.log("service-worker failed to register. This happened: ", err)
            });
    }

    if (!window.matchMedia('(display-mode: standalone)').matches) {
        var btnAdd = document.getElementById("triggerPromptPositive");
        var btnRemove = document.getElementById("triggerPromptNegative");
        var triggerPrompt = document.getElementById("triggerPrompt");

        window.addEventListener('beforeinstallprompt', (e) => {
            // Prevent Chrome 67 and earlier from automatically showing the prompt
            e.preventDefault();
            // Stash the event so it can be triggered later.
            deferredPrompt = e;
            // Upperformance UI notify the user they can add to home screen
            // btnAdd.style.display = 'block';
        });

        btnAdd.addEventListener('click', (e) => {
            // hide our user interface that shows our A2HS button
            // btnAdd.style.display = 'none';
            triggerPrompt.style.display = 'none';
            // Show the prompt
            deferredPrompt.prompt();
            // Wait for the user to respond to the prompt
            deferredPrompt.userChoice
                .then((choiceResult) => {
                    if (choiceResult.outcome === 'accepted') {
                        console.log('User accepted the A2HS prompt');
                    } else {
                        console.log('User dismissed the A2HS prompt');
                    }
                    deferredPrompt = null;
                });
        });

        btnRemove.addEventListener('click', () => {
            triggerPrompt.style.display = 'none';
        });

        window.addEventListener('appinstalled', (evt) => {
            app.logEvent('a2hs', 'installed');
            console.log("App installed");
        });
    }

    //
    // ─── START OF ANIMATION ─────────────────────────────────────────────────────────
    //

    d_t_i = performance.now() - 16;
    animationID = requestAnimationFrame(algorithm); // Inicialization of simulation
};

// ────────────────────────────────────────────────────────────────────────────────

function keyPressed(e) {
    let pressedKey = e.keyCode;
    if (pressedKey == 32) {
        if (isRunning) {
            pause();
        } else {
            resume();
        }
    }
}

function handleVisibilityChange(event) {
    console.log("Tab hidden: " + document[hidden]);
    if (document[hidden]) {
        pause();
    } else {
        resume();
    }
}

//
// ─── GRAPH ──────────────────────────────────────────────────────────────────────
//

var graphTime = [];
var graphData = [];

function drawGraph() {
    Chart.defaults.global.elements.point.radius = 0;
    Chart.defaults.global.animation.duration = 500;
    var ctx = document.getElementById('myChart').getContext('2d');
    
    let x = graphTime.length-15*60;
    graphTime.splice(0, x);
    graphData.splice(0, x);
    console.log(graphData.length, graphTime.length);


    var chart = new Chart(ctx, {
        // The type of chart we want to create
        type: 'line',

        // The data for our dataset
        data: {
            labels: graphTime,
            datasets: [{
                label: "Pendulum",
                backgroundColor: 'rgb(255, 99, 132)',
                borderColor: 'rgb(255, 99, 132)',
                data: graphData,
            }]
        },

        // Configuration options go here
        options: {
            layout: {
                padding: {
                    left: 50,
                    right: 50,
                    top: 50,
                    bottom: 100
                }
            }
        }
    });
}

// ────────────────────────────────────────────────────────────────────────────────

class Pendulum {
    constructor(element = "pendulum", color = "black", algorithm = "anim3", angle = 45, angle_max = 45, l = 1, g = 9.81) {
        this.element = document.getElementById(element);
        this.color = color;
        this.algorithm = algorithm;
        this.algorithmId = 3;
        this.worker;
        this.workerId;

        this.angle = angle;
        this.angle_max = angle_max;
        this.l = l;
        this.g = g;
        this.w = Math.sqrt(this.g / this.l);
        this.x = Math.cos((this.angle + 90) / 180 * Math.PI);
        this.a = -Math.pow(this.w, 2) * this.x;
        this.v = 0;
    }

}
pendulums.push(new Pendulum());

// ────────────────────────────────────────────────────────────────────────────────

// Accurate
function anim1(time) {
    let d_t = (time - d_t_i) / 1000 / run_lim; // in seconds for calculations
    d_t_i = time;

    if (myWorker) {
        myWorker.postMessage([d_t, run_lim]);
    }

    // console.log(d_t);
    // frameTime.push(t);
    // angle = angle_m * Math.cos(w * t + angle_i); // Motion equation (in degrees)
    let d_angle, d2_angle;
    for (var run = 0; run < (run_lim); run++) {
        d_angle = direction * Math.sqrt((2 * g / l) * (Math.cos(angle / 180 * Math.PI) - Math.cos(angle_m / 180 * Math.PI))) * d_t * 180 / Math.PI;
        d2_angle = -g / l * Math.sin(angle / 180 * Math.PI) / 2 * Math.pow(d_t, 2) * 180 / Math.PI;
        // console.log("delta angle = " + d_angle);
        // console.log("delta 2 angle = " + d2_angle);
        angle += d_angle + d2_angle;
        if ((d_angle / d_t + d2_angle / d_t) > 0) { // SPEEDUP - DELETE "/d_t"
            direction = 1;
        } else {
            direction = -1;
        }
    }

    let c = "rotate(" + angle + "deg)";
    pendulum.style.transform = c;
    
    v = Math.sin(d_angle / 180 * Math.PI)*2*l / d_t;
    E_k = 1/2*m*Math.pow(v,2);
    E_p = m*g*(1-Math.cos((angle) / 180 * Math.PI));
    E_p_max = m*g*(1-Math.cos((angle_m) / 180 * Math.PI));

    //console.log(d_t);
    //console.log(t);
    console.log(c);

    if (myWorker) {
        c = "rotate(" + angle2 + "deg)";
        console.log(angle2);
        pendulum2.style.transform = c;
    }

    if (angle > angle_m) {
        angle = angle_m;
    }

    if (angle < -angle_m) {
        angle = -angle_m;
    }

    graphTime.push(Math.round(time) / 1000);
    //graphTime.push(time / 1000);
    graphData.push(angle);

    animationID = requestAnimationFrame(algorithm);
}

// Linear approximation
// function anim2(time) {
//     // let time = performance.now();
//     let d_t = (time - d_t_i) / 1000;
//     d_t_i = time;

//     x = -Math.sin((angle) / 180 * Math.PI);
//     console.log("x = " + x);
//     a = -Math.pow(w, 2) * x
//     v = v + a * d_t;
//     x = x + v * d_t;

//     angle = -Math.asin(x) * 180 / Math.PI;

//     let c = "rotate(" + angle + "deg)";
//     pendulum.style.transform = c;

//     console.log("dt = " + d_t);
//     console.log("x = " + x);
//     console.log("a = " + a);
//     console.log("v = " + v);
//     console.log(c);

//     if (angle > angle_m) {
//         angle = angle_m;
//     }

//     if (angle < -angle_m) {
//         angle = -angle_m;
//     }

//     graphTime.push(time);
//     graphData.push(angle);

//     animationID = requestAnimationFrame(algorithm);
// }

d_t_i = performance.now(); //TO REMOVE??

// Linear approximation + acceleration
function anim3(time) {
    let d_t = (time - d_t_i) / 1000 / run_lim;
    d_t_i = time;

    if (myWorker) {
        myWorker.postMessage([d_t, run_lim]);
    }

    ad = performance.now(); //TO REMOVE!!!
    for (var run = 0; run < (run_lim); run++) {
        //x = -Math.sin((angle) / 180 * Math.PI);
        a = -Math.pow(w, 2) * x;
        v = v + a * d_t;
        x = x + v * d_t + 1 / 2 * a * Math.pow(d_t, 2); // Added '+ 1 / 2 * a * Math.pow(d_t, 2)' beside 'anim2'
    }
    b = performance.now(); //TO REMOVE!!!

    d = b - ad; //TO REMOVE!!!

    // console.log("it took: " + d); //TO REMOVE!!!

    angle = -Math.asin(x) * 180 / Math.PI;
    let c = "rotate(" + angle + "deg)";

    E_k = 1/2*m*Math.pow(v,2);
    E_p = m*g*(1-Math.cos((angle) / 180 * Math.PI));
    E_p_max = m*g*(1-Math.cos((angle_m) / 180 * Math.PI));

    // console.log("dt = " + d_t);
    // console.log("x = " + x);
    // console.log("a = " + a);
    // console.log("v = " + v);
    // console.log(c);

    if (angle > angle_m) {
        angle = angle_m;
    }

    if (angle < -angle_m) {
        angle = -angle_m;
    }

    graphTime.push(Math.round(time) / 1000);
    graphData.push(angle);

    pendulum.style.transform = c;
    if (myWorker) {
        c = "rotate(" + angle2 + "deg)";
        console.log(angle2);
        pendulum2.style.transform = c;
    }
    animationID = requestAnimationFrame(algorithm);
}

// Quadratic approximation
function anim4(time) {
    let d_t = (time - d_t_i) / 1000 / run_lim;
    d_t_i = time;

    if (myWorker) {
        myWorker.postMessage([d_t, run_lim]);
    }

    for (var run = 0; run < (run_lim); run++) {
        //x = -Math.sin((angle) / 180 * Math.PI);
        a = -g / l * x * (1 + Math.pow(-Math.sin((angle_m) / 180 * Math.PI) / l, 2) - 3 / 2 * Math.pow(x / l, 2));
        //console.log("a multiplier = " + (1 + Math.pow(-Math.sin((angle_m) / 180 * Math.PI) / l, 2) - 3 / 2 * Math.pow(x / l, 2)));
        v = v + a * d_t;
        x = x + v * d_t + 1 / 2 * a * Math.pow(d_t, 2);

    }

    angle = -Math.asin(x) * 180 / Math.PI;
    let c = "rotate(" + angle + "deg)";

    E_k = 1/2*m*Math.pow(v,2);
    E_p = m*g*(1-Math.cos((angle) / 180 * Math.PI));
    E_p_max = m*g*(1-Math.cos((angle_m) / 180 * Math.PI));

    console.log("dt = " + d_t);
    console.log("x = " + x);
    console.log("a = " + a);
    console.log("v = " + v);
    console.log(c);

    if (angle > angle_m) {
        angle = angle_m;
    }

    if (angle < -angle_m) {
        angle = -angle_m;
    }

    graphTime.push(Math.round(time) / 1000);
    graphData.push(angle);

    pendulum.style.transform = c;
    if (myWorker) {
        c = "rotate(" + angle2 + "deg)";
        console.log(angle2);
        pendulum2.style.transform = c;
    }
    animationID = requestAnimationFrame(algorithm);
}

// Accurate in x-axis
function anim5(time) {
    let d_t = (time - d_t_i) / 1000 / run_lim;
    d_t_i = time;

    if (myWorker) {
        myWorker.postMessage([d_t, run_lim]);
    }

    for (var run = 0; run < (run_lim); run++) {
        //x = -Math.sin((angle) / 180 * Math.PI);
        //console.log("x2 " + x);
        a = -g / l * x * (3 * Math.sqrt(1 - Math.pow(x / l, 2)) - 2 * Math.sqrt(1 - Math.pow(-Math.sin((angle_m) / 180 * Math.PI) / l, 2)));
        //console.log("a multiplier = " + (3 * Math.sqrt(1 - Math.pow(x / l, 2)) - 2 * Math.sqrt(1 - Math.pow(-Math.sin((angle_m) / 180 * Math.PI) / l, 2))));
        v = v + a * d_t;
        x = x + v * d_t + 1 / 2 * a * Math.pow(d_t, 2);
        //console.log("x1 " + x);
    }

    angle = -Math.asin(x) * 180 / Math.PI;
    let c = "rotate(" + angle + "deg)";
    
    E_k = 1/2*m*Math.pow(v,2);
    E_p = m*g*(1-Math.cos((angle) / 180 * Math.PI));
    E_p_max = m*g*(1-Math.cos((angle_m) / 180 * Math.PI));

    // console.log("dt = " + d_t);
    // console.log("x = " + x);
    // console.log("a = " + a);
    // console.log("v = " + v);
    // console.log(c);

    if (angle > angle_m) {
        angle = angle_m;
        v = 0;
        console.log("Correction made");
    }

    if (angle < -angle_m) {
        angle = -angle_m;
        v = 0;
        console.log("Correction made");
    }

    //period(time,angle,angle_prev);
    //angle_prev = angle;

    graphTime.push(Math.round(time) / 1000);
    graphData.push(angle);

    pendulum.style.transform = c;
    if (myWorker) {
        c = "rotate(" + angle2 + "deg)";
        console.log(angle2);
        pendulum2.style.transform = c;
    }
    energyKinetic.innerHTML = "E<sub>k</sub> = " + E_k.toFixed(2);
    energyPotential.innerHTML = "E<sub>p</sub> = " + E_p.toFixed(2);
    energyTotal.innerHTML = "E<sub>k</sub>+E<sub>p</sub> = " + (E_k+E_p).toFixed(2);
    energyMax.innerHTML = "E<sub>max</sub> = " + E_p_max.toFixed(2);
    energyDiff.innerHTML = "E<sub>diff</sub> = " + (E_p_max - (E_k+E_p)).toFixed(2);
    animationID = requestAnimationFrame(algorithm);
}

Decimal.set({ precision: 20 });
// run_lim = 100;
let PI = new Decimal('3.1415926535897932384626433832795028841971693993751058209749445923078164062862089986280348253421170679821480865132823066470938446095505822317253594081284811174502841027019385211055596446229489549303819644288109756659334461284756482337867831652712019091456485669234603486104543266482133936072602491412737245870066063155881748815209209628292540917153643678925903600113305305488204665213841469519415116094330572703657595919530921861173819326117931051185480744623799627495673518857527248912279381830119491298336733624406566430860213949463952247371907021798609437027705392171762931767523846748184676694051320005681271452635608277857713427577896091736371787214684409012249534301465495853710507922796892589235420199561121290219608640344181598136297747713099605187072113499999983729780499510597317328160963185950244594553469083026425223082533446850352619311881710100031378387528865875332083814206171776691473035982534904287554687311595628638823537875937519577818577805321712268066130019278766111959092164201989380952572010654858632789');
// var x = Decimal.cos(new Decimal(new Decimal(angle).add(90)).div(180).mul(PI));
// console.log(x.toNumber());
// var a = -Math.pow(w, 2) * x;
// var v = 0;
let deviation = new Decimal(0);

let x2 = -Math.sin((angle) / 180 * Math.PI);
let a2 = -Math.pow(w, 2) * x;
let v2 = 0;
function anim5_dec(time) {
    let d_t = new Decimal(time).sub(d_t_i).div(1000).div(run_lim);
    if (myWorker) {
        myWorker.postMessage([(time - d_t_i) / 1000 / run_lim, run_lim]);
    }
    d_t_i = time;
    for (var run = 0; run < (run_lim); run++) {
        let sqrt1 = Decimal.sqrt(Decimal.sub(1, Decimal.pow(Decimal.div(x, l), 2)));
        let sqrt2 = Decimal.sqrt(Decimal.sub(1, Decimal.pow(new Decimal(Decimal.cos( new Decimal(angle_m).add(90).div(180).mul(PI) )).div(l), 2)));
        let q = Decimal.sub(Decimal.mul(3, sqrt1), Decimal.mul(2, sqrt2));
        a = new Decimal(Decimal.div(-g,l)).mul(x).mul(q);
        v = new Decimal(v).add(a.mul(d_t));
        x = new Decimal(x).add(v.mul(d_t)).add(new Decimal(1).div(2).mul(a).mul(Decimal.pow(d_t, 2)));

        a2 = -g / l * x2 * (3 * Math.sqrt(1 - Math.pow(x2 / l, 2)) - 2 * Math.sqrt(1 - Math.pow(-Math.sin((angle_m) / 180 * Math.PI) / l, 2)));
        v2 = v2 + a2 * d_t.toNumber();
        x2 = x2 + v2 * d_t.toNumber() + 1 / 2 * a2 * Math.pow(d_t.toNumber(), 2);
        deviation = Decimal.add(deviation, Decimal.abs(Decimal.sub(x, x2)));
    }

    console.log(Decimal.sub(a, a2).toString());
    console.log(Decimal.sub(v, v2).toString());
    console.log(Decimal.sub(x, x2).toString());
    console.log("deviation", deviation.toString());

    angle = new Decimal(Decimal.acos(x)).mul(180).div(PI).sub(90);
    angle = angle.toNumber();
    console.log("angle", angle);
    let c = "rotate(" + angle + "deg)";
    
    E_k = 1/2*m*Math.pow(v,2);
    E_p = m*g*(1-Math.cos((angle) / 180 * Math.PI));
    E_p_max = m*g*(1-Math.cos((angle_m) / 180 * Math.PI));

    // console.log("dt = " + d_t);
    // console.log("x = " + x);
    // console.log("a = " + a);
    // console.log("v = " + v);
    // console.log(c);

    if (angle > angle_m) {
        angle = angle_m;
        v = 0;
        console.log("Correction made");
    }

    if (angle < -angle_m) {
        angle = -angle_m;
        v = 0;
        console.log("Correction made");
    }

    //period(time,angle,angle_prev);
    //angle_prev = angle;

    graphTime.push(Math.round(time) / 1000);
    graphData.push(angle);

    pendulum.style.transform = c;
    if (myWorker) {
        c = "rotate(" + angle2 + "deg)";
        console.log(angle2);
        pendulum2.style.transform = c;
    }
    animationID = requestAnimationFrame(algorithm);
}

// ────────────────────────────────────────────────────────────────────────────────

var angle_prev = 45;
var period = 0;
var period_i;

function period(time, angle, angle_prev) {
    if (angle > angle_prev) {
        if (direction == 1) {} else {
            direction == 1;
        }
    }

    if (angle < angle_prev) {
        if (direction == -1) {} else {
            direction == -1;

            period = time - period_i;

            console.log("period = " + period);
            console.log("period = " + period);
            console.log("period = " + period);
            period_i = time;
        }
    }
    return;
}

function resume() {
    isRunning = true;
    //t_i = performance.now();
    d_t_i = performance.now();
    animationID = requestAnimationFrame(algorithm);
}

function pause(dragged) {
    isRunning = false;
    cancelAnimationFrame(animationID);
    //angle_i = w * t + angle_i;
    //t = 0;
    //if (!dragged) {
    //    t_i = 0;
    //}
    //console.log("angle_i =" + angle_i);
    console.log("dragged = " + dragged);

    // console.log(frameTime);
    // var timings = [];
    // for (i = 1; i < frameTime.length; i++) {
    //     let x = frameTime[i] - frameTime[i-1];
    //     timings.push(x*1000);
    // }
    // console.log(timings);
    // console.log(frameTime[frameTime.length-1] / frameTime.length * 1000);
    // frameTime = [];
}

function stop() {
    cancelAnimationFrame(animationID);

    // angleSlider.value = 45;
    // lengthSlider.value = 1;
    // massSlider.value = 1;
    // gravitySlider.value = 9.8;

    changeAngle();
    //t = 0;

    l = 1; // Length of string is 1m
    g = 9.81; // Gravitational acceleration on Earth
    angle_m = 45; // Maximal angular displacement (in degrees)
    angle = 45; // Current angular displacement
    //angle_i = 0; // Initial angle
    w = Math.sqrt(g / l); // Angular acceleration
}

function secondPendulum() {
    pendulum2.style.display = "block";
    if (window.Worker) {
        stop();
        myWorker = new Worker('pendulum-worker.js');
        myWorker.postMessage("initiate");
        console.log('Message posted to worker');

        angle = angle_m;
        x = -Math.sin((angle) / 180 * Math.PI);
        a = -Math.pow(w, 2) * x;
        v = 0;

        myWorker.onmessage = function (e) {
            if (e.data === "initiated") {
                resume();
            } else {
                angle2 = e.data;
                console.log('Message received from worker');
                console.log(angle2);
            }
        }
    }

    pendulum_selection[1].disabled = false;
    pendulum_selection[1].parentElement.classList.remove("is-disabled");
}


// ────────────────────────────────────────────────────────────────────────────────

function angleSliderDrag() {
    pause("dragged");
    changeAngle();
}

function angleSliderDrop() {
    resume();
}

function changeAngle() {
    angle_m = -angleSlider.value;
    angle = angle_m;
    //angle_i = 0;
    let c = "rotate(" + angle + "deg)";
    pendulum.style.transform = c;
    diplayAngleValue.innerText = angle_m + "°";
    console.log(angle_m);
    x = -Math.sin((angle) / 180 * Math.PI);
    a = acceleration[algorithm.name]();
    v = 0;
}

function changeLength() {
    let lineLength = lengthSlider.value * 100;
    let circlePosition = lengthSlider.value * 100;
    document.getElementById("line").setAttribute("y2", lineLength);
    document.getElementById("circle").setAttribute("cy", circlePosition);

    displayLengthValue.innerText = lengthSlider.value + "m";

    //angle_i = w * t + angle_i;
    //t = 0;
    //t_i = performance.now();
    l = Number(lengthSlider.value);
    w = Math.sqrt(g / l);
    console.log("length = " + l + "m");
    //console.log("angle_i = " + angle_i);
}

function changeMass() {
    m = Number(massSlider.value);
    pendulum.setAttribute("viewBox", "0 0 " + massSlider.value * 10 * 2 + " 200");
    document.getElementById("circle").setAttribute("r", massSlider.value * 10);
    document.getElementById("circle").setAttribute("cx", massSlider.value * 10);
    document.getElementById("line").setAttribute("x1", massSlider.value * 10);
    document.getElementById("line").setAttribute("x2", massSlider.value * 10);
    pendulum.style.left = window.innerWidth / 2 - 0.09 * window.innerHeight / 2 * massSlider.value;

    displayMassValue.innerText = massSlider.value + "kg";
}

function changeGravity() {
    //angle_i = w * t + angle_i;
    //t = 0;
    //t_i = performance.now();
    g = Number(gravitySlider.value);
    w = Math.sqrt(g / l);

    displayGravityValue.innerHTML = gravitySlider.value + " m/s&#178;";
    console.log("gravity = " + g + "m/s^2");
    //console.log("angle_i = " + angle_i);
}

let acceleration = {
    "anim1": () => { return 0 },
    "anim3": () => { return -Math.pow(w, 2) * x },
    "anim4": () => { return -g / l * x * (1 + Math.pow(-Math.sin((angle_m) / 180 * Math.PI) / l, 2) - 3 / 2 * Math.pow(x / l, 2)) },
    "anim5": () => { return -g / l * x * (3 * Math.sqrt(1 - Math.pow(x / l, 2)) - 2 * Math.sqrt(1 - Math.pow(-Math.sin((angle_m) / 180 * Math.PI) / l, 2))) },
    "anim5_dec": () => { return new Decimal(Decimal.div(-g,l)).mul(x).mul(q) }
}

// ────────────────────────────────────────────────────────────────────────────────

/*
    TODO:
        in function drawGraph() replace filter with slice/splice
        if g==0 then circle around
        Conservation of Energy --> no corrections
        Conservation of Speed
        Displaying speed/acceleration values
        Create object 'Pendulum' which has x, v, a, ...
        Benchmark => run_limit
        Better graph rendering

    Fix: 
        Mass change on mobile
        't' is obsolete variable
        initial velocity when switching algorithms
        pause on 'anim1' causes change of direction
        initial value after change of angle, ...
*/