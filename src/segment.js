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
