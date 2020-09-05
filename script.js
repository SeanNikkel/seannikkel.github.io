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

// create canvas
let canvas = document.createElement("canvas");
document.body.appendChild(canvas);
canvas.style.position = "fixed";
canvas.style.left = 0;
canvas.style.top = 0;
canvas.style.zIndex = -100;

var context = canvas.getContext("2d");


// functions
function lerp(start, end, t) {
    return (end - start) * t + start;
}

// classes
function Star(x, y, depth) {
    // Member variables
    this.x = x;
    this.y = y;
    this.depth = depth;
    this.moveFactor = lerp(starMoveMin, starMoveMax, this.depth);
    this.size = lerp(starSizeMin, starSizeMax, this.depth);

    // Member functions
    this.move = function(x, y) {
        this.x += x * this.moveFactor;
        this.y += y * this.moveFactor;

        // off screen, wrap around
        if (this.x < -this.size / 2)
        {
            this.x += canvas.width + this.size;
            this.y = Math.random() * canvas.height;
        }
    }
    this.draw = function(ctx) {
        ctx.fillRect(this.x - this.size / 2, this.y - this.size / 2, this.size, this.size);
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
    for (let i = 0; i < starCount; i++)
    {
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
    for (let i = 0; i < stars.length; i++)
    {
        stars[i].move(-dt, 0);
        stars[i].draw(context);
    }

    window.requestAnimationFrame(updateStars);
};