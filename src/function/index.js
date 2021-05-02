export const
  // 当前激活操作的边
  TOP = 'TOP',
  BOTTOM = 'BOTTOM',
  LEFT = 'LEFT',
  RIGHT = 'RIGHT',
  TOP_LEFT = 'TOP_LEFT',
  TOP_RIGHT = 'TOP_RIGHT',
  BOTTOM_LEFT = 'BOTTOM_LEFT',
  BOTTOM_RIGHT = 'BOTTOM_RIGHT',

  SCREEN_SHOT_LINE_WIDTH = 2,
  SCREEN_SHOT_LINE_JOIN = 'round',

  ACTION_TYPE = {
    INIT: 'INIT', // 空白状态
    SCREEN_SHOT: 'SCREEN_SHOT', // 截屏
    PICK_COLOR: 'PICK_COLOR', // 色吸管

  },
  ACTION_MOMENT = { // 生命周期
    BEFORE_START: 'BEFORE_START', // 未开始
    STARTED: 'STARTED', // 进行中
    END: 'END', // 结束
    REGULATE: 'REGULATE' // 调整范围
  },
  CANVAS_WIDTH = 300, // canvas width
  CANVAS_HEIGHT = 150, // canvas height
  ABOUT_NUM = 5, // 命中半径

  SCALE = 2, // canvas 放大比例
  REGULATE_STROKE_STYLE = 'rgba(18,150,219,1)'


export function drawRect(canvas, startX, startY, width, height, strokeStyle = 'rgba(0,0,0,1)') {
  if (!canvas instanceof HTMLCanvasElement) throw new Error('canvas error');
  const ctx = canvas.getContext('2d');
  ctx.save();
  ctx.lineWidth = SCREEN_SHOT_LINE_WIDTH;
  ctx.lineJoin = SCREEN_SHOT_LINE_JOIN;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.beginPath();
  ctx.setLineDash([5, 5]);
  ctx.strokeRect(startX, startY, width, height);
  ctx.restore();
}

export function drawRegulateRect(canvas, startX, startY, width, height, imageInfo) {
  if (!imageInfo) throw new Error('need imageInfo obj');
  const ctx = canvas.getContext('2d');
  ctx.save();
  ctx.strokeStyle = REGULATE_STROKE_STYLE;
  ctx.lineWidth = SCREEN_SHOT_LINE_WIDTH;
  ctx.lineJoin = SCREEN_SHOT_LINE_JOIN;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(imageInfo.image, 0, 0, canvas.width, canvas.height);


  ctx.beginPath();
  ctx.setLineDash([3, 3]);
  ctx.strokeRect(startX, startY, width, height);
  ctx.restore();
}

export function getLine(startX, startY, endX, endY, offsetX, offsetY) {
  // 让前4个状态更容易被触发
  if (isNumInSquare(offsetX, endX, ABOUT_NUM) &&
    isNumInSquare(offsetY, startY, ABOUT_NUM)
  ) return TOP_RIGHT;
  // if (offsetX === endX && offsetY === startY) return TOP_RIGHT;
  if (isNumInSquare(offsetX, startX, ABOUT_NUM) &&
    isNumInSquare(offsetY, startY, ABOUT_NUM)
  ) return TOP_LEFT
  if (isNumInSquare(offsetX, endX, ABOUT_NUM) &&
    isNumInSquare(offsetY, endY, ABOUT_NUM)
  ) return BOTTOM_RIGHT;
  if (isNumInSquare(offsetX, startX, ABOUT_NUM) &&
    isNumInSquare(offsetY, endY, ABOUT_NUM)
  ) return BOTTOM_LEFT;
  // if (offsetX === startX && offsetY === startY) return TOP_LEFT;
  // if (offsetX === endX && offsetY === endY) return BOTTOM_RIGHT;
  // if (offsetX === startX && offsetX === startY) return BOTTOM_LEFT;


  if (isNumInSquare(offsetY, startY, ABOUT_NUM) && isNumInRange(offsetX, startX, endX)) return TOP;
  // if (offsetY === startY && offsetX >= startX && offsetX <= endX) return TOP;
  if (isNumInSquare(offsetY, endY, ABOUT_NUM) && isNumInRange(offsetX, startX, endX)) return BOTTOM;
  // if (offsetY === endY && offsetX >= startX && offsetX <= endX) return BOTTOM;
  if (isNumInSquare(offsetX, startX, ABOUT_NUM) && isNumInRange(offsetY, startY, endY)) return LEFT;
  // if (offsetX === startX && offsetY >= startY && offsetY <= endY) return LEFT;
  if (isNumInSquare(offsetX, endX, ABOUT_NUM) && isNumInRange(offsetY, startY, endY)) return RIGHT;
  // if (offsetX === endX && offsetY >= startY && offsetY <= endY) return RIGHT;
  return null;
}

export function getCursor(linePositionStr) {
  if (!linePositionStr) return 'grabbing';
  if ([TOP_RIGHT, BOTTOM_LEFT].indexOf(linePositionStr) > -1) return 'nesw-resize';
  if ([TOP_LEFT, BOTTOM_RIGHT].indexOf(linePositionStr) > -1) return 'nwse-resize';
  if ([TOP, BOTTOM].indexOf(linePositionStr) > -1) return 'row-resize';
  if ([LEFT, RIGHT].indexOf(linePositionStr) > -1) return 'col-resize';
  return 'grabbing';
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

// 正方形范围
export function isNumInSquare(src, tar, about) {
  return src >= tar - about && src <= tar + about;
}

export function isNumInRange(src, min, max) {
  min = Math.min(min, max);
  max = Math.max(min, max);
  return src >= min && src <= max;
}