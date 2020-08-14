// Animation delay

// skip if using back/forward buttons
let skip = window.performance && window.performance.navigation.type === window.performance.navigation.TYPE_BACK_FORWARD;
let games = document.getElementsByClassName("project-container");
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

// create container element
let starContainer = document.createElement("div");
document.body.appendChild(starContainer);

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
    this.moveFactor = lerp(0.005, 0.05, this.depth);

    // Member functions
    this.move = function(x, y) {
        this.x += x * this.moveFactor;
        this.y += y * this.moveFactor;

        if (this.x < -3)
            this.x += window.innerWidth + 6;

        this.element.style.left = String(this.x) + "px";
        this.element.style.top = String(this.y) + "px";
    }
    this.destroy = function() {
        this.element.remove();
    }

    // Element init
    this.element = document.createElement("div");
    this.element.style.position = "fixed";
    this.element.style.left = String(this.x) + "px";
    this.element.style.top = String(this.y) + "px";
    this.element.style.width = String(lerp(2, 6, this.depth)) + "px";
    this.element.style.height = this.element.style.width;
    this.element.style.backgroundColor = "rgb(48,48,48)";
    this.element.style.zIndex = -100;
    starContainer.appendChild(this.element);
}

// init
let stars = [];
function init() {
    // clear current stars
    for (let i = 0; i < stars.length; i++)
    {
        stars[i].destroy();
    }

    let starCount = Math.min((window.innerWidth * window.innerHeight) / 8000, 500);
    for (let i = 0; i < starCount; i++)
    {
        stars.push(new Star(Math.random() * window.innerWidth, Math.random() * window.innerHeight, Math.random() ** 3));
    }
}
init();

// call init again after resize has stopped for 50ms
let waitFunction;
window.addEventListener("resize", function() { 
    clearTimeout(waitFunction); 
    waitFunction = setTimeout(init, 50); 
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

    // Move all stars left
    for (let i = 0; i < stars.length; i++)
    {
        stars[i].move(-dt, 0);
    }

    window.requestAnimationFrame(updateStars);
};