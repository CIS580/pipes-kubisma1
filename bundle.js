(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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

},{"./game":2,"./grid":3,"./image-coords-manager":4,"./queue-manager":5,"./segment":6}],2:[function(require,module,exports){
"use strict";

/**
 * @module exports the Game class
 */
module.exports = exports = Game;

/**
 * @constructor Game
 * Creates a new game object
 * @param {canvasDOMElement} screen canvas object to draw into
 * @param {function} updateFunction function to update the game
 * @param {function} renderFunction function to render the game
 */
function Game(screen, updateFunction, renderFunction) {
  this.update = updateFunction;
  this.render = renderFunction;

  // Set up buffers
  this.frontBuffer = screen;
  this.frontCtx = screen.getContext('2d');
  this.backBuffer = document.createElement('canvas');
  this.backBuffer.width = screen.width;
  this.backBuffer.height = screen.height;
  this.backCtx = this.backBuffer.getContext('2d');

  // Start the game loop
  this.oldTime = performance.now();
  this.paused = false;
}

/**
 * @function pause
 * Pause or unpause the game
 * @param {bool} pause true to pause, false to start
 */
Game.prototype.pause = function(flag) {
  this.paused = (flag == true);
}

/**
 * @function loop
 * The main game loop.
 * @param{time} the current time as a DOMHighResTimeStamp
 */
Game.prototype.loop = function(newTime) {
  var game = this;
  var elapsedTime = newTime - this.oldTime;
  this.oldTime = newTime;

  if(!this.paused){
    this.update(elapsedTime);
    this.render(elapsedTime, this.frontCtx);
  }

  // Flip the back buffer
  this.frontCtx.drawImage(this.backBuffer, 0, 0);
}

},{}],3:[function(require,module,exports){
"use strict";

module.exports = exports = Grid;

const SUB_GRID_SIZE = 3;
const CELL_SIZE = 15;
const EMPTY = undefined;
const SEGMENT = "S";
const WATER = "W";
const TIMEOUT = 60000;
const SECOND = 1000;
const MINUTE = 60 * SECOND;

/* Classes */
const Water = require('./water');


function Grid(canvasWidth, canvasHeight) {
  this.canvasWidth = canvasWidth;
  this.canvasHeight = canvasHeight;
  this.maxX = Math.floor(canvasWidth / CELL_SIZE); //81
  this.maxY = Math.floor(canvasHeight / CELL_SIZE); //45
  this.timer = TIMEOUT;
  this.water = new Water(this.maxX, this.maxY);

  this.grid = [];
  this.start = undefined;
  this.end = undefined;
  resetGrid.call(this);
}

function resetGrid() {
  for(var y = 0; y < this.maxY; y++) {
    this.grid[y] = [];
    for(var x = 0; x < this.maxY; x++) {
      this.grid[y][x] = EMPTY;
    }
  }
}

Grid.prototype.reset = function(level) {
  this.grid = [];
  this.start = undefined;
  this.end = undefined;
  this.timer = (level <= 10)? TIMEOUT - (level * 4500) : TIMEOUT - (11 * 4500);
  this.water.setNewTimeout(level);

  resetGrid.call(this);
}

Grid.prototype.getClickPosition = function(clickX, clickY) {
  var x = Math.floor(clickX / (CELL_SIZE * SUB_GRID_SIZE));
  var y = Math.floor(clickY / (CELL_SIZE * SUB_GRID_SIZE));

  return {x: x, y: y};
}

Grid.prototype.isValidClick = function(position, leftClick) {

  if (position.x * SUB_GRID_SIZE >= this.maxX || position.y * SUB_GRID_SIZE >= this.maxY) return false;

  var segment = this.grid[position.y * SUB_GRID_SIZE][position.x * SUB_GRID_SIZE];

  if (segment !== undefined && leftClick) return false;
  else if (segment !== undefined && !segment.rotatable) return false;
  else if (segment == undefined && !leftClick) return false;
  return true;

}

Grid.prototype.placeStartingSegment = function(segment) {
  var x = Math.floor((Math.random() * this.maxX) / SUB_GRID_SIZE);
  var y = Math.floor((Math.random() * this.maxY) / SUB_GRID_SIZE);
  this.placeSegment({x:x, y:y}, segment);
  this.start = {x: x * SUB_GRID_SIZE + 1, y: y * SUB_GRID_SIZE + 1};
  this.grid[this.start.y][this.start.x] = WATER;
  this.water.init(this.start);
  //console.log("Start ["+this.start.y+"]["+this.start.x+"]");
}

Grid.prototype.placeEndingSegment = function(segment) {
  var startX = Math.floor((this.start.x - 1) / SUB_GRID_SIZE);
  var startY = Math.floor((this.start.y - 1) / SUB_GRID_SIZE);
  var x, y;

  do {
    x = Math.floor((Math.random() * this.maxX) / SUB_GRID_SIZE);
    y = Math.floor((Math.random() * this.maxY) / SUB_GRID_SIZE);
  } while(Math.abs(startX - x) < 12 && Math.abs(startY - y) < 6);

  this.placeSegment({x:x, y:y}, segment);
  this.end= {x: x * SUB_GRID_SIZE + 1, y: y * SUB_GRID_SIZE + 1};
}

Grid.prototype.placeSegment = function(position, segment) {
  var x = position.x * SUB_GRID_SIZE;
  var y = position.y * SUB_GRID_SIZE;
  //console.log("Segment ["+y+"]["+x+"]");
  this.grid[y][x] = segment;

  var self = this;
  segment.subsegments.forEach(function(subsegment){
    self.grid[y + subsegment.y][x + subsegment.x] = SEGMENT;
  });
}

Grid.prototype.getSegment = function(position) {
  var segment = this.grid[position.y * SUB_GRID_SIZE][position.x * SUB_GRID_SIZE];
  if(segment == undefined) throw "Segment not found";

  for(var y = position.y * SUB_GRID_SIZE; y < (position.y + 1) * SUB_GRID_SIZE; y++) {
    for(var x = position.x * SUB_GRID_SIZE; x < (position.x + 1) * SUB_GRID_SIZE; x++) {
      this.grid[y][x] = EMPTY;
    }
  }

  return segment;
}

Grid.prototype.gameOver = function() {
  return this.timer == 0 && !this.water.isFlooding();
}

Grid.prototype.levelCompleted = function() {
  return this.grid[this.end.y][this.end.x] == WATER;
}

Grid.prototype.update = function(elapsedTime) {
  this.timer -= elapsedTime;

  if(this.timer <= 0) { // begin flooding
    this.timer = 0;
    this.water.flood(elapsedTime, this.grid);
  }
}

Grid.prototype.render = function(elapsedTime, ctx) {
  var properties;

  if(this.timer == 0) this.water.render(ctx, this.grid);

  for(var y = 0; y < this.maxY; y++) {
    for(var x = 0; x < this.maxX; x++) {
      if(this.grid[y][x] && y % SUB_GRID_SIZE == 0 && x % SUB_GRID_SIZE == 0) {
        properties = this.grid[y][x].imageProperties;
        ctx.drawImage(
          properties.image,
          properties.coords.x, properties.coords.y, properties.width, properties.height,
          x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE * SUB_GRID_SIZE, CELL_SIZE * SUB_GRID_SIZE
        );
      }
    }
  }

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 1em Georgia";
  ctx.fillText("S", this.start.x * CELL_SIZE + 2, this.start.y * CELL_SIZE + CELL_SIZE);
  ctx.fillText("E", this.end.x * CELL_SIZE + 2, this.end.y * CELL_SIZE + CELL_SIZE);

  if(this.timer == 0) {
    ctx.fillText("Flooding begins...", 10, this.canvasHeight - 10);
  }

}

},{"./water":7}],4:[function(require,module,exports){
"use strict;"

module.exports = exports = ImageCoordsManager;

const MAX_IMG = 4;
const IMAGE_SIZE = 32;
const START_END_IMG_INDEX = 3;

function ImageCoordsManager() {

  this.image = new Image();
  this.image.src = 'assets/pipes.png';

  this.images = [
    [{x: 0, y: 0}],
    [{x: 95, y: 31}, {x: 95, y: 62}],
    [{x: 31, y: 31}, {x: 63, y: 31}, {x: 63, y: 63}, {x: 31, y: 63}],
    [{x: 31, y: 95}, {x: 63, y: 95}, {x: 63, y: 127}, {x: 31, y: 127}]
  ];

}

function getImageFromSet(y) {

  var x = undefined;
  var imageCoordsSet = this.images[y];

  switch (y) {
    case 0:
      x = 0;
      break;
    case 1:
      x = Math.floor(Math.random() * 2);
      break;
    case 2:
    case 3:
      x = Math.floor(Math.random() * 4)
      break;
    default:
      throw "Undefined image coords index: " + y;
  }

  return {coords: imageCoordsSet[x], x: x, y:y};
}


ImageCoordsManager.prototype.getNextImage = function(random) {
  var image = {image: this.image};
  var y;

  if(random) y = Math.floor(Math.random() * MAX_IMG);
  else y = START_END_IMG_INDEX;

  var res = getImageFromSet.call(this, y);

  image.coords = res.coords;
  image.width = IMAGE_SIZE;
  image.height = IMAGE_SIZE;
  image.x = res.x;
  image.y = res.y;

  return image;
}


ImageCoordsManager.prototype.getNextCoords = function(prevX, prevY) {
  var imageCoordsSet = this.images[prevY];
  var x = undefined;

  switch (prevY) {
    case 0:
      x = 0;
      break;
    case 1:
      x = (prevX + 1) % imageCoordsSet.length;
      break;
    case 2:
    case 3:
      x = (prevX + 1) % imageCoordsSet.length;
      break;
    default:
      throw "Undefined image coords index: " + prevY;
  }

  return {coords: imageCoordsSet[x], x: x, y: prevY};
}

},{}],5:[function(require,module,exports){
"use strict;"

module.exports = exports = QueueManager;

const MAX_ARRAY_LENGTH = 4;

function QueueManager() {

  this.frontBuffer = document.getElementById('queue');
  this.frontCtx = this.frontBuffer.getContext('2d');
  this.backBuffer = document.createElement('canvas');
  this.backBuffer.width = this.frontBuffer.width;
  this.backBuffer.height = this.frontBuffer.height;
  this.backCtx = this.backBuffer.getContext('2d');

  this.queue = [];

}

QueueManager.prototype.pop = function() {
  if(this.queue.length == 0) throw "Queue underflow";
  return this.queue.shift();
}

QueueManager.prototype.push = function(elem) {
  if(this.queue.length > MAX_ARRAY_LENGTH) throw "Queue overflow";

  this.queue.push(elem);
}

QueueManager.prototype.clear = function() {
  this.queue = [];
}

QueueManager.prototype.render = function(elapsedTime) {

  this.backCtx.fillStyle = "#777777";
  this.backCtx.fillRect(0, 0, this.backBuffer.width, this.backBuffer.height);

  var self = this;
  this.queue.forEach(function(elem, index) {
    //console.log("x: " + elem.coords.x, + " y: " + elem.coords.y);
    self.backCtx.drawImage(
      elem.image,
      elem.coords.x, elem.coords.y, elem.width, elem.height,
      5, 55 * index, 45, 45
    );
  });

  this.frontCtx.drawImage(this.backBuffer, 0, 0);

}

},{}],6:[function(require,module,exports){
"use strict;"

module.exports = exports = Segment;

function Segment(imageProperties, rotatable = true) {
  this.imageProperties = imageProperties;
  this.rotatable = rotatable;
  this.subsegments = [];

  setSubsegments.call(this);
}

function setSubsegments() {
  switch (this.imageProperties.y) {
    case 0:
      this.subsegments = [{x:1, y:0}, {x:0, y:1}, {x:1, y:1}, {x:2, y:1}, {x:1, y: 2}];
      break;
    case 1:
      switch (this.imageProperties.x) {
        case 0:
          this.subsegments = [{x:0, y:1}, {x:1, y:1}, {x:2, y:1}];
          break;
        case 1:
          this.subsegments = [{x:1, y:0}, {x:1, y:1}, {x:1, y:2}];
          break;
        default:
          throw "Cannot set subsegments for object: " + this.imageProperties;
      }
      break;
    case 2:
      switch (this.imageProperties.x) {
        case 0:
          this.subsegments = [{x:1, y:1}, {x:2, y:1}, {x:1, y:2}];
          break;
        case 1:
          this.subsegments = [{x:0, y:1}, {x:1, y:1}, {x:1, y:2}];
          break;
        case 2:
          this.subsegments = [{x:1, y:0}, {x:0, y:1}, {x:1, y:1}];
          break;
        case 3:
          this.subsegments = [{x:1, y:0}, {x:1, y:1}, {x:2, y:1}];
          break;
        default:
          throw "Cannot set subsegments for object: " + this.imageProperties;
      }
      break;
    case 3:
      switch (this.imageProperties.x) {
        case 0:
          this.subsegments = [{x:0, y:1}, {x:1, y:1}, {x:2, y:1}, {x:1, y:2}];
          break;
        case 1:
          this.subsegments = [{x:1, y:0}, {x:0, y:1}, {x:1, y:1}, {x:1, y:2}];
          break;
        case 2:
          this.subsegments = [{x:1, y:0}, {x:0, y:1}, {x:1, y:1}, {x:2, y:1}];
          break;
        case 3:
          this.subsegments = [{x:1, y:0}, {x:1, y:1}, {x:2, y:1}, {x:1, y:2}];
          break;
        default:
          throw "Cannot set subsegments for object: " + this.imageProperties;
      }
  }
}

Segment.prototype.updateSubsegments = function() {
  setSubsegments.call(this);
}

},{}],7:[function(require,module,exports){
"use strict;"

module.exports = exports = Water;

const SUB_GRID_SIZE = 3;
const SEGMENT = "S";
const WATER = "W";
const TIMEOUT = 1000;
const TIMEOUT_DENOMINATOR = 10;
const CELL_SIZE = 15;

function Water(maxX, maxY) {
  this.maxX = maxX;
  this.maxY = maxY;
  this.timer = 0;
  this.water = [];
  this.timeout = TIMEOUT / TIMEOUT_DENOMINATOR;
}

Water.prototype.init = function(position) {
  this.water = [position];
}

Water.prototype.setNewTimeout = function(level) {
  this.timeout = TIMEOUT / (TIMEOUT_DENOMINATOR + level - 1);
}

Water.prototype.isFlooding = function() {
  return this.water.length != 0;
}

Water.prototype.flood = function(elapsedTime, grid) {
  var i = this.water.length;
  var position;

  this.timer += elapsedTime;

  if(this.timer >= this.timeout) {
    this.timer = 0;

    while(i--) {
      position = this.water[i];

      if(position.x > 0 && grid[position.y][position.x - 1] == SEGMENT)
        this.water.push({x: position.x - 1, y: position.y});

      if(position.x + 1 < this.maxX && grid[position.y][position.x + 1] == SEGMENT)
        this.water.push({x: position.x + 1, y: position.y});

      if(position.y > 0 && grid[position.y - 1][position.x] == SEGMENT)
        this.water.push({x: position.x, y: position.y - 1});

      if(position.y + 1 < this.maxY && grid[position.y + 1][position.x] == SEGMENT)
        this.water.push({x: position.x, y: position.y + 1});

      this.water.splice(i, 1);
      grid[position.y][position.x] = WATER;
      // Make a segment not rotatable
      grid[position.y - (position.y % SUB_GRID_SIZE)][position.x - (position.x % SUB_GRID_SIZE)].rotatable = false;
    }
  }
}

Water.prototype.render = function(ctx, grid) {
  for(var y = 0; y < this.maxY; y++) {
    for(var x = 0; x < this.maxX; x++) {
      if(grid[y][x] == WATER) {
        ctx.fillStyle = "#0000aa";
        ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
      }
    }
  }
}

},{}]},{},[1]);
