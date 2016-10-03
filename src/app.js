"use strict";

const CELL_SIZE = 45;
const TIMEOUT = 5000;

/* Classes */
const Game = require('./game');
const ImageCoordsManager = require('./image-coords-manager');
const QueueManager = require('./queue-manager');
const Grid = require('./grid');
const Segment = require('./segment');

/* Global variables */
var canvas = document.getElementById('screen');
var game = new Game(canvas, update, render);
var imageCoordsManager = new ImageCoordsManager();
var queueManager = new QueueManager();
var grid = new Grid(canvas.width, canvas.height);

var level = 1;
var score = 0;
var currentIndex;
var currentX;
var currentY;

/* Audio */
var select = new Audio();
select.src = './assets/music/select.wav';
var invalid = new Audio();
invalid.src = './assets/music/invalid.wav';
var levelup = new Audio();
levelup.src = './assets/music/levelup.wav';
var gameover = new Audio();
gameover.src = './assets/music/gameover.wav';
var background = new Audio();
background.src = './assets/music/background.wav';
background.loop = true;
background.play();

canvas.onclick = function(event) {
  event.preventDefault();

  if(game.paused) return invalid.play();

  var clickPosition = grid.getClickPosition(event.offsetX, event.offsetY);
  if(!grid.isValidClick(clickPosition, true)) return invalid.play();

  select.play();

  grid.placeSegment(clickPosition, new Segment(queueManager.pop()));
  queueManager.push(imageCoordsManager.getNextImage(true));
}

canvas.oncontextmenu = function(event) {
  event.preventDefault();

  if(game.paused) return invalid.play();

  var clickPosition = grid.getClickPosition(event.offsetX, event.offsetY);
  if(!grid.isValidClick(clickPosition, false)) return invalid.play();

  select.play();

  var segment = grid.getSegment(clickPosition);
  var newProperties = imageCoordsManager.getNextCoords(segment.imageProperties.x, segment.imageProperties.y);

  segment.imageProperties.coords = newProperties.coords;
  segment.imageProperties.x = newProperties.x;
  segment.updateSubsegments();

  grid.placeSegment(clickPosition, segment);
}


canvas.onmousemove = function(event) {
  event.preventDefault();
  currentX = event.offsetX;
  currentY = event.offsetY;
  var x = Math.floor(currentX / CELL_SIZE);
  var y = Math.floor(currentY / CELL_SIZE);
  currentIndex = y * 27 + x;
}

function newLevel(lvl) {

  if(lvl > 1) {
    score += Math.floor(1000 * Math.sqrt(lvl));
    queueManager.clear();
    grid.reset(lvl);
  }

  grid.placeStartingSegment(new Segment(imageCoordsManager.getNextImage(false), false));
  grid.placeEndingSegment(new Segment(imageCoordsManager.getNextImage(false), false));

  queueManager.push(imageCoordsManager.getNextImage(true));
  queueManager.push(imageCoordsManager.getNextImage(true));
  queueManager.push(imageCoordsManager.getNextImage(true));
  queueManager.push(imageCoordsManager.getNextImage(true));

}

function checkGameStatus(ctx) {

  if(grid.levelCompleted()){
    ctx.fillStyle = "#fff";
    ctx.font = "bold 2.5em Georgia";
    ctx.fillText("Level completed! ", 420, 340);

    levelup.play();

    game.pause(true);
    setTimeout(function() {
      game.pause(false);
      newLevel(++level);
    }, TIMEOUT);
  } else if (grid.gameOver()) {
    ctx.fillStyle = "#fff";
    ctx.font = "bold 2.5em Georgia";
    ctx.fillText("Game over! ", 470, 340);

    gameover.play();

    game.pause(true);
  }

}

/**
 * @function masterLoop
 * Advances the game in sync with the refresh rate of the screen
 * @param {DOMHighResTimeStamp} timestamp the current time
 */
var masterLoop = function(timestamp) {
  game.loop(timestamp);
  window.requestAnimationFrame(masterLoop);
}
newLevel(level);
masterLoop(performance.now());


/**
 * @function update
 * Updates the game state, moving
 * game objects and handling interactions
 * between them.
 * @param {DOMHighResTimeStamp} elapsedTime indicates
 * the number of milliseconds passed since the last frame.
 */
function update(elapsedTime) {
  grid.update(elapsedTime);
}

/**
  * @function render
  * Renders the current game state into a back buffer.
  * @param {DOMHighResTimeStamp} elapsedTime indicates
  * the number of milliseconds passed since the last frame.
  * @param {CanvasRenderingContext2D} ctx the context to render to
  */
function render(elapsedTime, ctx) {
  ctx.fillStyle = "#777777";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  queueManager.render();
  grid.render(elapsedTime, ctx);

  checkGameStatus(ctx);

  ctx.fillStyle = "#fff";
  ctx.font = "bold 1em Georgia";
  ctx.fillText("Level: " + level, 10, 20);
  ctx.fillText("Score: " + score, 10, 40);

  var x = currentIndex % 27;
  var y = Math.floor(currentIndex / 27);
  ctx.fillStyle = "#ff000000";
  ctx.beginPath();
  ctx.rect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
  ctx.stroke();

}
