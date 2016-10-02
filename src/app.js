"use strict";

const CELL_SIZE = 45;
const TIMEOUT = 2000;

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

canvas.onclick = function(event) {
  event.preventDefault();

  var clickPosition = grid.getClickPosition(event.offsetX, event.offsetY);
  if(!grid.isValidClick(clickPosition, true)) return;

  grid.placeSegment(clickPosition, new Segment(queueManager.pop()));
  queueManager.push(imageCoordsManager.getNextImage(true));
}

canvas.oncontextmenu = function(event) {
  event.preventDefault();

  var clickPosition = grid.getClickPosition(event.offsetX, event.offsetY);
  if(!grid.isValidClick(clickPosition, false)) return;

  var segment = grid.getSegment(clickPosition);
  var newProperties = imageCoordsManager.getNextCoords(segment.imageProperties.x, segment.imageProperties.y);

  segment.imageProperties.coords = newProperties.coords;
  segment.imageProperties.x = newProperties.x;
  segment.updateSubsegments();

  grid.placeSegment(clickPosition, segment);
}

var currentIndex, currentX, currentY;
canvas.onmousemove = function(event) {
  event.preventDefault();
  currentX = event.offsetX;
  currentY = event.offsetY;
  var x = Math.floor(currentX / CELL_SIZE);
  var y = Math.floor(currentY / CELL_SIZE);
  currentIndex = y * 27 + x;
}

function newLevel(level = 1) {

  if(level > 1) {
    setTimeout(function(){
      queueManager.clear();
    }, TIMEOUT);
  }

  grid.placeStartingSegment(new Segment(imageCoordsManager.getNextImage(false), false));
  grid.placeEndingSegment(new Segment(imageCoordsManager.getNextImage(false), false));

  queueManager.push(imageCoordsManager.getNextImage(true));
  queueManager.push(imageCoordsManager.getNextImage(true));
  queueManager.push(imageCoordsManager.getNextImage(true));
  queueManager.push(imageCoordsManager.getNextImage(true));

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
newLevel();
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

  // TODO: Advance the fluid
  //console.log(imageCoordsManager.getNextImage(true));
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

  // TODO: Render the board
  //ctx.drawImage(image, 0, 0, 31, 31, 0, 0, 63, 63);
  //ctx.drawImage(image, 96, 32, 31, 31, 64, 0, 63, 63);
  queueManager.render();
  grid.render(elapsedTime, ctx);

  var x = currentIndex % 27;
  var y = Math.floor(currentIndex / 27);
  ctx.fillStyle = "#ff000000";
  ctx.beginPath();
  ctx.arc(currentX, currentY, 3, 0, 2*Math.PI);
  ctx.rect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
  ctx.stroke();

}
