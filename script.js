// Animation delay
let games = document.getElementsByClassName("project-container");
for (let i = 0; i < games.length; i++)
{
    games[i].style.animationDelay = String((i + 1) * 0.25) + "s";
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