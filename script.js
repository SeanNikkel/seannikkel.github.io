"use strict"
// Animation delay

// skip if using back/forward buttons
let skip = window.performance && window.performance.navigation.type === window.performance.navigation.TYPE_BACK_FORWARD;
let games = document.getElementsByClassName("intro-sequence");
for (let i = 0; i < games.length; i++)
{
    if (!skip)
        games[i].style.animationDelay = String(i * 0.25) + "s";
    else
        games[i].style.animationDelay = "-999s";
}

// Navigation
function jumpTo(elementId)
{
    var elementTop = document.getElementById(elementId).offsetTop;
    var navHeight = document.getElementById("nav").scrollHeight;
    var marginSize = 10;
    window.scrollTo(0, elementTop - navHeight - marginSize);
    return false;
}

// Stars background

// vars
const starMoveMin = 0.005;
const starMoveMax = 0.05;
const starSizeMin = 2;
const starSizeMax = 6;
const starDensity = 0.001;
const maxStarsEver = 10000;
const furtherStarBias = 8;
const resizeWaitTime = 50;
const starColor = "#303030";
const backgroundColor = "#181818";
const dragAmount = 1.002;
const forceAmount = 0.5;
const forceRange = 150;
const minForceScalar = 0.1;
const maxForceScalar = 1.0;

// create canvas
let canvas = document.createElement("canvas");
let context = canvas.getContext("2d");
document.body.appendChild(canvas);
canvas.style.position = "fixed";
canvas.style.left = 0;
canvas.style.top = 0;
canvas.style.zIndex = -100;

// functions
function lerp(start, end, t) {
    return (end - start) * t + start;
}
function approach(position, speed, dt) {
	let distance = -position;
	let moveAmount = distance - distance / speed ** dt;
	return position + moveAmount;
}
function applyDrag(vel, amount, dt) {
    vel.x = approach(vel.x, amount, dt);
    vel.y = approach(vel.y, amount, dt);

    if (Math.abs(vel.x) < 0.01)
        vel.x = 0;
    if (Math.abs(vel.y) < 0.01)
        vel.y = 0;
}

// classes
function Vector(x, y) {
    this.x = x;
    this.y = y;

    this.length = function() {
        return Math.sqrt(this.x ** 2 + this.y ** 2);
    }
    this.scale = function(scalar) {
        this.x *= scalar;
        this.y *= scalar;
    }
    this.subtract = function(vector) {
        this.x -= vector.x;
        this.y -= vector.y;
    }
}

function Star(x, y, depth) {
    // Member variables
    this.position = new Vector(x, y);
    this.depth = depth;
    this.moveFactor = lerp(starMoveMin, starMoveMax, this.depth);
    this.size = lerp(starSizeMin, starSizeMax, this.depth);
    this.velocity = new Vector(0, 0);

    // Member functions
    this.addForce = function(vector) {
        let forceFactor = lerp(minForceScalar, maxForceScalar, this.depth);
        this.velocity.x += vector.x * forceFactor;
        this.velocity.y += vector.y * forceFactor;
    }
    this.move = function(dt) {

        // scrolling
        this.position.x -= this.moveFactor * dt;

        // performance check
        if (this.velocity.x != 0 || this.velocity.y != 0) {
            // apply velocity
            this.position.x += this.velocity.x * dt;
            this.position.y += this.velocity.y * dt;

            // apply drag
            applyDrag(this.velocity, dragAmount, dt);

            // off top or bottom of screen, wrap around
            if (this.position.y < -this.size / 2)
                this.position.y += canvas.height + this.size;
            if (this.position.y > canvas.height + this.size / 2)
                this.position.y -= canvas.height + this.size;
        }

        // off left of screen, wrap around
        if (this.position.x < -this.size / 2) {
            this.position.x += canvas.width + this.size;
            this.position.y = Math.random() * canvas.height;
        }
    }
    this.draw = function(ctx) {
        ctx.fillRect(this.position.x - this.size / 2, this.position.y - this.size / 2, this.size, this.size);
    }
}

// init
let stars = [];
function init() {
    // update canvas size
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    stars = []; // reset if called twice

    let starCount = Math.min(canvas.width * canvas.height * starDensity, maxStarsEver);
    for (let i = 0; i < starCount; i++) {
        stars.push(new Star(Math.random() * canvas.width, Math.random() * canvas.height, Math.random() ** furtherStarBias));
    }
}
init();

// call init again after resize has stopped for 50ms
let waitFunction;
window.addEventListener("resize", function() {
    clearTimeout(waitFunction); 
    waitFunction = setTimeout(init, resizeWaitTime); 
}); 

// click explosion
document.body.addEventListener("click", function(e) {
    let rect = canvas.getBoundingClientRect();
    let x = e.clientX - rect.left;
    let y = e.clientY - rect.top;

    for (let i = 0; i < stars.length; i++) {
        let coord = new Vector(x, y);
        coord.subtract(stars[i].position);

        let len = coord.length();
        coord.scale(-1 / len);

        len = Math.max(((forceRange - len) / forceRange) * forceAmount, 0);
        coord.scale(len);

        stars[i].addForce(coord);
    }
});

// update loop
window.requestAnimationFrame(updateStars);
let lastTime;
function updateStars(time)
{
    // Get delta time
    if (lastTime === undefined)
        lastTime = time;
    
    let dt = time - lastTime;
    lastTime = time;

    // Clear
    context.fillStyle = backgroundColor;
    context.fillRect(0, 0, canvas.width, canvas.height);

    context.fillStyle = starColor;

    // Move all stars left
    for (let i = 0; i < stars.length; i++) {
        stars[i].move(dt);
        stars[i].draw(context);
    }

    window.requestAnimationFrame(updateStars);
};