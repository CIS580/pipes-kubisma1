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
