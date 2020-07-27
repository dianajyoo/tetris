const canvas = document.getElementById('canvas');
const context = canvas.getContext('2d');
const { width, height } = canvas;
const ROWS = 22;
const COLS = 16;
const LEFT_BOUND = 0;
const RIGHT_BOUND = COLS - 1;
const BOTTOM_BOUND = ROWS - 1;
const SCALE = 30;
const UNIT = 1;
const STEP = 1;
const COLORS = {
  background: '#fff',
  stroke: '#f7f7f7',
};
const BLOCKS = {
  I: [
    { col: 0, row: 0 },
    { col: 1, row: 0 },
    { col: 2, row: 0 },
    { col: 3, row: 0 },
  ],
  J: [
    { col: 1, row: 0 },
    { col: 1, row: 1 },
    { col: 1, row: 2 },
    { col: 0, row: 2 },
  ],
  O: [
    { col: 0, row: 0 },
    { col: 0, row: 1 },
    { col: 1, row: 0 },
    { col: 1, row: 1 },
  ],
  S: [
    { col: 0, row: 0 },
    { col: 1, row: 0 },
    { col: 1, row: 1 },
    { col: 2, row: 1 },
  ],
  T: [
    { col: 1, row: 0 },
    { col: 0, row: 1 },
    { col: 1, row: 1 },
    { col: 2, row: 1 },
  ],
};

// `currentBoard` is a 2d array with initial values of zero
let currentBoard;
let currentBlock;
let positions;
let offsetX = 0;
let offsetY = 0;
// Origin is position where we rotate around
let originX;
let originY;
let direction;
let timer;

context.scale(SCALE, SCALE);

function init() {
  console.log('Init');

  currentBlock = getNextBlock();
  positions = [...BLOCKS[currentBlock]];
  originX = positions[2].col;
  originY = positions[2].row;

  createBlock(positions);
}

/** Create a board with 22 rows and 16 cols */
function createBoard() {
  let matrix = [];

  for (let row = 0; row < ROWS; row += 1) {
    let newRow = [];
    for (let col = 0; col < COLS; col += 1) {
      newRow.push(0);
    }
    matrix.push(newRow);
  }

  currentBoard = matrix;
  drawGrid();

  /**
   * [ [0,0,0,0,0,0,0,0,0,0],
   *   [0,0,0,0,0,0,0,0,0,0],
   *   [0,0,0,0,0,0,0,0,0,0],
   *   ...
   * ]
   */
}

function recreateBoard() {
  let value;
  resetBoard();

  for (let row = 0; row < currentBoard.length; row += 1) {
    for (let col = 0; col < currentBoard[row].length; col += 1) {
      value = currentBoard[row][col];
      if (value === 1) {
        drawSquare(col, row, 'pink');
      }
    }
  }
}

function updateBoard() {
  let y;
  let x;

  positions.forEach((pos) => {
    y = pos.row + offsetY;
    x = pos.col + offsetX;
    currentBoard[y][x] = 1;
  });
}

function createBlock(positions) {
  positions.forEach((p) => {
    drawSquare(p.col + offsetX, p.row + offsetY, 'orange');
  });
}

function drawSquare(x, y, color) {
  context.fillStyle = color;
  // .fillRect(X,Y,W,H) where X and Y are square positions and W and H is width and height
  context.fillRect(x, y, UNIT, UNIT);
}

/** Clear by changing color to background */
function clearBlock(x, y) {
  // context.fillStyle = COLORS.background;
  context.fillStyle = 'cyan';
  context.strokeStyle = COLORS.stroke;
  context.fillRect(x, y, UNIT, UNIT);
  context.strokeRect(x, y, UNIT, UNIT);
}

/** Reset and clear entire board */
function resetBoard() {
  context.clearRect(0, 0, width, height);
  drawGrid();
}

function clearLine() {
  positions.forEach((pos) => {
    clearBlock(pos.col + offsetX, pos.row + offsetY);
  });
}

function moveDown() {
  clearLine();
  createBlock(positions.map((pos) => ({ col: pos.col, row: pos.row + 1 })));
}

function canDrop() {
  return positions.every((pos) => {
    return (
      pos.row + offsetY < BOTTOM_BOUND &&
      currentBoard[pos.row + offsetY][pos.col + offsetX] !== 1 &&
      currentBoard[pos.row + offsetY + 1][pos.col + offsetX] !== 1
    );
  });
}

/** Check if we can move block without colliding into walls */
function canMove() {
  // If col is less than 0 or greater than 15
  // or row is greater than 21, then block is out of bounds
  // and we return false
  let y;
  let x;

  return positions.every((pos) => {
    y = pos.row + offsetY;
    x = pos.col + offsetX;

    if (direction === 'left') {
      return x > LEFT_BOUND && y < BOTTOM_BOUND;
    }

    if (direction === 'right') {
      return x < RIGHT_BOUND && y < BOTTOM_BOUND;
    }

    if (direction === 'down') {
      return y < BOTTOM_BOUND;
    }
  });
}

function drop() {
  console.log('canDrop', canDrop());

  if (canDrop()) {
    moveDown();
    offsetY += 1;
  } else {
    console.log('Landed!');

    updateBoard();
    offsetX = 0;
    offsetY = 0;
    recreateBoard();
    init();
  }
}

function transform() {
  positions.forEach((pos) => {
    if (direction === 'left' || direction === 'right') {
      drawSquare(pos.col + offsetX, pos.row + offsetY, 'orange');
    }

    if (direction === 'up') {
      rotate(pos);
    }
  });
}

/** Rotate current block 90 deg */
function rotate(position) {
  // Rotating counterclockwise is (x, y) -> (y, -x)
  // We rotate around a point, which is (originX, originY)
  const x = position.col - originX;
  const y = position.row - originY;
  const rotatedX = y;
  const rotatedY = -x;

  position.col = originX + rotatedX;
  position.row = originY + rotatedY;

  drawSquare(
    originX + rotatedX + offsetX,
    originY + rotatedY + offsetY,
    'green'
  );
}

function moveBlock(e) {
  switch (e.keyCode) {
    case 37:
      direction = 'left';
      if (canMove()) {
        clearLine();
        offsetX -= 1;
        transform();
      }
      break;
    case 39:
      direction = 'right';
      if (canMove()) {
        clearLine();
        offsetX += 1;
        transform();
      }
      break;
    case 40:
      direction = 'down';
      if (canDrop()) {
        moveDown();
        offsetY += 1;
      } else {
        console.log('Landed!');
        console.log('offsetX, offsetY', offsetX, offsetY);

        updateBoard();
        offsetX = 0;
        offsetY = 0;
        recreateBoard();
        init();
      }
      break;
    case 38:
      direction = 'up';
      // if (canRotate()) {
      clearLine();
      transform();
      // }
      break;
    default:
      break;
  }
}

/** Return a random block from 5 options */
function getNextBlock() {
  const BLOCKS = ['I', 'J', 'O', 'S', 'T'];
  const index = Math.floor(Math.random() * BLOCKS.length);
  return BLOCKS[index];
}

function drawGrid() {
  context.beginPath();

  for (let x = 0; x <= width; x += STEP) {
    context.moveTo(x, 0);
    context.lineTo(x, height);
  }

  context.strokeStyle = COLORS.stroke;
  context.lineWidth = 0.2;
  context.stroke();

  context.beginPath();

  for (let y = 0; y <= height; y += STEP) {
    context.moveTo(0, y);
    context.lineTo(width, y);
  }

  context.strokeStyle = COLORS.stroke;
  context.lineWidth = 0.2;
  context.stroke();
}

function startGravity() {
  timer = setInterval(drop, 300);
}

function stopGravity() {
  clearInterval(timer);
}

document.addEventListener('DOMContentLoaded', () => {
  document.addEventListener('keydown', moveBlock);

  createBoard();
  init();
  // startGravity();
});
