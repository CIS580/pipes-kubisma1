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
