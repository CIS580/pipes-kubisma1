"use strict";

module.exports = exports = Grid;

const SUB_GRID_SIZE = 3;
const CELL_SIZE = 15;
const EMPTY = undefined;
const SEGMENT = "S";
const WATER = "W";

function Grid(canvasWidth, canvasHeight) {
  this.maxX = Math.floor(canvasWidth / CELL_SIZE); //81
  this.maxY = Math.floor(canvasHeight / CELL_SIZE); //45

  this.grid = [];
  this.start = undefined;
  this.end = undefined;
  this.reset();
}

Grid.prototype.reset = function() {
  this.grid = [];

  for(var y = 0; y < this.maxY; y++) {
    this.grid[y] = [];
    for(var x = 0; x < this.maxY; x++) {
      this.grid[y][x] = EMPTY;
    }
  }
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

Grid.prototype.update = function(elapsedTime) {

}

Grid.prototype.render = function(elapsedTime, ctx) {
  var properties;
  for(var y = 0; y < this.maxY; y += 3) {
    for(var x = 0; x < this.maxX; x += 3) {
      if(this.grid[y][x]) {
        properties = this.grid[y][x].imageProperties;
        ctx.drawImage(
          properties.image,
          properties.coords.x, properties.coords.y, properties.width, properties. height,
          x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE * SUB_GRID_SIZE, CELL_SIZE * SUB_GRID_SIZE
        );
      }
    }
  }
}
