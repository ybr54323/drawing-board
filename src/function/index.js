export const TOP = 'TOP',
  BOTTOM = 'BOTTOM',
  LEFT = 'LEFT',
  RIGHT = 'RIGHT',
  TOP_LEFT = 'TOP_LEFT',
  TOP_RIGHT = 'TOP_RIGHT',
  BOTTOM_LEFT = 'BOTTOM_LEFT',
  BOTTOM_RIGHT = 'BOTTOM_RIGHT',

  SCREEN_SHOT_LINE_WIDTH = 4,
  SCREEN_SHOT_LINE_JOIN = 'round',


  ACTION_TYPE = {
    SCREEN_SHOT: 'SCREEN_SHOT',
    PICK_COLOR: 'PICK_COLOR',
  },
  ACTION_MOMENT = {
    BEFORE_START: 'BEFORE_START',
    STARTED: 'STARTED',
    END: 'END',
    REGULATE: 'REGULATE'
  },
  CANVAS_WIDTH = 300,
  CANVAS_HEIGHT = 150,
  ABOUT_NUM = 5;



export function drawRect(canvas, startX, startY, endX, endY, strokeStyle = 'rgba(0,0,0,1)') {
  if (!canvas instanceof HTMLCanvasElement) throw new Error('canvas error');
  const ctx = canvas.getContext('2d');
  ctx.save();
  ctx.lineWidth = SCREEN_SHOT_LINE_WIDTH;
  ctx.lineJoin = SCREEN_SHOT_LINE_JOIN;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.beginPath();
  ctx.setLineDash([5, 5]);
  ctx.strokeRect(startX, startY, endX, endY);
  ctx.restore();
}

export function getLine(startX, startY, endX, endY, offsetX, offsetY) {
  if (offsetX === endX && offsetY === startY) return TOP_RIGHT;
  if (offsetX === startX && offsetY === startY) return TOP_LEFT;
  if (offsetX === endX && offsetY === endY) return BOTTOM_RIGHT;
  if (offsetX === startX && offsetX === startY) return BOTTOM_LEFT;
  if (offsetY === startY && offsetX >= startX && offsetX <= endX) return TOP;
  if (offsetY === endY && offsetX >= startX && offsetX <= endX) return BOTTOM;
  if (offsetX === startX && offsetY >= startY && offsetY <= endY) return LEFT;
  if (offsetX === endX && offsetY >= startY && offsetY <= endY) return RIGHT;
  return null;
}

export function getCursor(linePositionStr) {
  if (!linePositionStr) return 'auto';
  if ([TOP_RIGHT, BOTTOM_LEFT].indexOf(linePositionStr) > -1) return 'nesw-resize';
  if ([TOP_LEFT, BOTTOM_RIGHT].indexOf(linePositionStr) > -1) return 'nwse-resize';
  if ([TOP, BOTTOM].indexOf(linePositionStr) > -1) return 'row-resize';
  if ([LEFT, RIGHT].indexOf(linePositionStr) > -1) return 'col-resize';
  return 'auto';
}

export function throttle(fn, delay = 100) {
  let start = -Infinity;
  return function (...args) {
    const now = +Date.now();
    if (now - start >= delay) {
      start = now;
      return fn.apply(this, args);
    }
  }
}