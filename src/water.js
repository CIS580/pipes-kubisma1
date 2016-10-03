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
