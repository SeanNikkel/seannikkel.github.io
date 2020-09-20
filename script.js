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
    var navHeight = document.getElementById("nav").offsetHeight;
    window.scrollTo(0, elementTop - navHeight);
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
const forceDrawAmount = 0.002;
const forceDrawRange = 120;
const forceRelAmount = 0.5;
const forceRelRange = 200;
const minDepthDrawForceScalar = 0.45;
const minDepthRelForceScalar = 0.2;
const scrollMoveAmount = -5;

// create canvas
let canvas = document.createElement("canvas");
let context = canvas.getContext("2d");
document.body.appendChild(canvas);
canvas.style.position = "fixed";
canvas.style.left = 0;
canvas.style.top = 0;
canvas.style.zIndex = -10;

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
    this.addForce = function(vector, minForce = minDepthRelForceScalar) {
        let forceFactor = lerp(minForce, 1.0, this.depth);
        this.velocity.x += vector.x * forceFactor;
        this.velocity.y += vector.y * forceFactor;
    }
    this.offset = function(x, y) {
        this.position.x += x;
        this.position.y += y;

        // wrap around screen
        if (x < 0 && this.position.x < -this.size / 2)
            this.position.x += canvas.width + this.size;
        if (x > 0 && this.position.x > canvas.width + this.size / 2)
            this.position.x -= canvas.width + this.size;
        if (y < 0 && this.position.y < -this.size / 2)
            this.position.y += canvas.height + this.size;
        if (y > 0 && this.position.y > canvas.height + this.size / 2)
            this.position.y -= canvas.height + this.size;
    }
    this.move = function(dt) {
        let deltaX = 0;
        let deltaY = 0;

        // scrolling
        deltaX -= this.moveFactor * dt;

        // performance check
        if (this.velocity.x != 0 || this.velocity.y != 0) {
            // apply velocity
            deltaX += this.velocity.x * dt;
            deltaY += this.velocity.y * dt;

            // apply drag
            applyDrag(this.velocity, dragAmount, dt);
        }

        this.offset(deltaX, deltaY);
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

// scroll parallax
let lastScroll = 0;
let currentDeltaScroll = 0;
window.addEventListener("scroll", function() {
    currentDeltaScroll += window.scrollY - lastScroll;
    lastScroll = window.scrollY;
});

// save variables to keep track of state of mouse
var mouseDown = false;
var clickedInBounds = false;
var mousePosX = 0;
var mousePosY = 0;
function updateMouseVars(e) {
    mouseDown = e.buttons === undefined ? e.which === 1 : e.buttons === 1;

    let rect = canvas.getBoundingClientRect();
    mousePosX = e.clientX - rect.left;
    mousePosY = e.clientY - rect.top;
}
document.body.onmousedown = updateMouseVars;
document.body.onmousemove = updateMouseVars;
document.body.onmouseup = updateMouseVars;

// begin draw explosions when clicking canvas only
canvas.onmousedown = function(e) {
    clickedInBounds = true;
    return false;
};

// create star explosion
function explosion(posX, posY, force, range, minForce = minDepthRelForceScalar)
{
    for (let i = 0; i < stars.length; i++) {
        let coord = new Vector(posX, posY);
        coord.subtract(stars[i].position);

        let len = coord.length();
        coord.scale(-1 / len);

        len = Math.max(((range - len) / range) * force, 0);
        coord.scale(len);

        stars[i].addForce(coord, minForce);
    }
}

// update loop
window.requestAnimationFrame(updateStars);
let lastTime;
function updateStars(time)
{
    // get delta time
    if (lastTime === undefined)
        lastTime = time;
    
    let dt = time - lastTime;
    lastTime = time;

    // draw explosion
    if (mouseDown && clickedInBounds)
        explosion(mousePosX, mousePosY, forceDrawAmount * dt, forceDrawRange, minDepthDrawForceScalar)

    // release explosion
    if (clickedInBounds && !mouseDown)
    {
        clickedInBounds = false;
        explosion(mousePosX, mousePosY, forceRelAmount, forceRelRange, minDepthRelForceScalar)
    }

    // clear
    context.fillStyle = backgroundColor;
    context.fillRect(0, 0, canvas.width, canvas.height);

    context.fillStyle = starColor;

    // move all stars left
    for (let i = 0; i < stars.length; i++) {
        stars[i].offset(0, currentDeltaScroll * stars[i].moveFactor * scrollMoveAmount);
        stars[i].move(dt);
        stars[i].draw(context);
    }
    currentDeltaScroll = 0;

    window.requestAnimationFrame(updateStars);
};