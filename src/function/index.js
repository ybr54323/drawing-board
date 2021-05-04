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
    EDITING_RECT: 'EDITING_RECT', // 编辑状态
  },
  ACTION_MOMENT = { // 生命周期
    BEFORE_START: 'BEFORE_START', // 未开始
    STARTED: 'STARTED', // 进行中
    END: 'END', // 结束
    REGULATING: 'REGULATING', // 调整中

  },
  CANVAS_WIDTH = 300, // canvas width
  CANVAS_HEIGHT = 150, // canvas height
  ABOUT_NUM = 5, // 命中半径

  SCALE = 2, // canvas 放大比例
  REGULATE_STROKE_STYLE = 'rgba(18,150,219,1)'


export function drawScene(canvas, imageInfo) {
  if (!canvas instanceof HTMLCanvasElement) throw new Error('canvas error');
  const ctx = canvas.getContext('2d');
  ctx.drawImage(imageInfo.image, 0, 0, canvas.width, canvas.height);

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

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  for (let i = 0; i < imageData.data.length; i += 4) {
    imageData.data[i] *= 0.5;
    imageData.data[i + 1] *= 0.5;
    imageData.data[i + 2] *= 0.5;
  }
  ctx.putImageData(imageData, 0, 0);


  ctx.beginPath();
  ctx.drawImage(imageInfo.image, startX, startY, width, height, startX, startY, width, height);
  // todo 8个点
  const midX = width / 2 + startX,
    midY = height / 2 + startY,
    endX = width + startX,
    endY = height + startY;

  [
    [startX, startY],
    [midX, startY],
    [endX, startY],
    [endX, midY],
    [endX, endY],
    [midX, endY],
    [startX, endY],
    [startX, midY]
  ].forEach(function ([x, y]) {
    drawCircle(canvas, x, y);
  })

  ctx.restore();
}

export function getLine(startX, startY, endX, endY, offsetX, offsetY) {
  // 让前4个状态更容易被触发
  if (isNumInSquare(offsetX, endX, ABOUT_NUM) &&
    isNumInSquare(offsetY, startY, ABOUT_NUM)
  ) return TOP_RIGHT;
  if (isNumInSquare(offsetX, startX, ABOUT_NUM) &&
    isNumInSquare(offsetY, startY, ABOUT_NUM)
  ) return TOP_LEFT
  if (isNumInSquare(offsetX, endX, ABOUT_NUM) &&
    isNumInSquare(offsetY, endY, ABOUT_NUM)
  ) return BOTTOM_RIGHT;
  if (isNumInSquare(offsetX, startX, ABOUT_NUM) &&
    isNumInSquare(offsetY, endY, ABOUT_NUM)
  ) return BOTTOM_LEFT;


  if (isNumInSquare(offsetY, startY, ABOUT_NUM) && isNumInRange(offsetX, startX, endX)) return TOP;
  if (isNumInSquare(offsetY, endY, ABOUT_NUM) && isNumInRange(offsetX, startX, endX)) return BOTTOM;
  if (isNumInSquare(offsetX, startX, ABOUT_NUM) && isNumInRange(offsetY, startY, endY)) return LEFT;
  if (isNumInSquare(offsetX, endX, ABOUT_NUM) && isNumInRange(offsetY, startY, endY)) return RIGHT;
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

export function drawCircle(canvas, x, y, r, fillStyle = 'white') {
  if (!canvas) throw new Error('need imageInfo obj');
  const ctx = canvas.getContext('2d');
  ctx.beginPath();
  ctx.arc(x, y, ABOUT_NUM, 0, Math.PI * 2);
  ctx.closePath();
  ctx.fillStyle = fillStyle;
  ctx.fill();
}
export function getImageInfo(blobUrl, conNode) {
  return new Promise(((resolve, reject) => {
    if (!blobUrl) reject()
    const image = new Image();
    image.src = blobUrl
    conNode.appendChild(image);
    image.onload = function (ev) {
      resolve({
        w: this.width,
        h: this.height,
        image: this,
        event: ev,
      })
    }
    image.onerror = reject;
  }))
}


export class Rect {
  constructor({

                startX,
                startY,
                endX,
                endY,
                canvas,
              }) {
    Object.assign(this, {
      startX,
      startY,
      endX,
      endY,
      canvas,
      ctx: canvas.getContext('2d'),
      line: ''
    })
    // this.startX = startX;
    // this.startY = startY
    // this.endX = endX;
    // this.endY = endY;
    // this.canvas = canvas;
    // this.ctx = canvas.getContext('2d');
    // this.line = '';

  }

  setStartX(startX) {
    this.startX = startX;
  }

  setStartY(startY) {
    this.startY = startY;
  }


  setEndX(endX) {
    this.endX = endX;
  }

  setEndY(endY) {
    this.endY = endY;
  }

  getStartX() {
    if (this.startX === +this.startX) return this.startX;
    throw new Error('need startX');
  }

  getStartY() {
    if (this.startY === +this.startY) return this.startY;
    throw new Error('need startY');
  }

  getEndX() {
    if (this.endX === +this.endX) return this.endX;
    throw new Error('need endX');
  }

  getEndY() {
    if (this.endY === +this.endY) return this.endY;
    throw new Error('need endY');
  }

  getWidth() {
    // if (this.endX < this.startX) throw new Error('endX can\'t less than startX');
    return this.endX - this.startX;
  }

  getHeight() {
    // if (this.endY < this.startY) throw new Error('endY can\'t less than startY');
    return this.endY - this.startY;
  }

  setCurrentLine(line) {
    this.line = line;
  }

  getCurrentLine() {
    return this.line;
  }

  // todo 有问题
  // 可以通过这个方法判断当前激活的rect
  getCurActiveLine(offsetX, offsetY) {
    if (isNumInSquare(offsetX, this.endX, ABOUT_NUM) &&
      isNumInSquare(offsetY, this.startY, ABOUT_NUM)
    ) return TOP_RIGHT;
    if (isNumInSquare(offsetX, this.startX, ABOUT_NUM) &&
      isNumInSquare(offsetY, this.startY, ABOUT_NUM)
    ) return TOP_LEFT
    if (isNumInSquare(offsetX, this.endX, ABOUT_NUM) &&
      isNumInSquare(offsetY, this.endY, ABOUT_NUM)
    ) return BOTTOM_RIGHT;
    if (isNumInSquare(offsetX, this.startX, ABOUT_NUM) &&
      isNumInSquare(offsetY, this.endY, ABOUT_NUM)
    ) return BOTTOM_LEFT;

    if (isNumInSquare(offsetY, this.startY, ABOUT_NUM) && isNumInRange(offsetX, this.startX, this.endX)) return TOP;
    if (isNumInSquare(offsetY, this.endY, ABOUT_NUM) && isNumInRange(offsetX, this.startX, this.endX)) return BOTTOM;
    if (isNumInSquare(offsetX, this.startX, ABOUT_NUM) && isNumInRange(offsetY, this.startY, this.endY)) return LEFT;
    if (isNumInSquare(offsetX, this.endX, ABOUT_NUM) && isNumInRange(offsetY, this.startY, this.endY)) return RIGHT;
    return null;
  }

  // 根据oX,oY，和当前能取到的line，来重新定位s，e坐标, 判断是否需要和已经重设了.
  mouseUpResetPos(offsetX, offsetY) {
    const line = this.line;
    if (!line) return null;

    if (line === TOP) this.resetTop(offsetY);
    if (line === BOTTOM) this.resetBottom(offsetY);
    if (line === LEFT) this.resetLeft(offsetX);
    if (line === RIGHT) this.resetRight(offsetX);
    if (line === TOP_LEFT) this.resetTopLeft(offsetX, offsetY);
    if (line === TOP_RIGHT) this.resetTopRight(offsetX, offsetY);
    if (line === BOTTOM_LEFT) this.resetBottomLeft(offsetX, offsetY);
    if (line === BOTTOM_RIGHT) this.resetBottomRight(offsetX, offsetY);

    return true;
  }

  resetTop(offsetY) {
    if (offsetY > this.endY) {
      [this.startY, this.endY] = [this.endY, offsetY];
    } else {
      this.startY = offsetY;
    }
  }

  resetBottom(offsetY) {
    if (offsetY < this.startY) { // 上下边互换
      [this.startY, this.endY] = [offsetY, this.startY];
    } else {
      this.endY = offsetY;
    }
  }

  resetLeft(offsetX) {
    if (offsetX > this.endX) {
      [this.startX, this.endX] = [this.endX, offsetX];
    } else {
      this.startX = offsetX;
    }
  }

  resetRight(offsetX) {
    if (offsetX < this.getStartX()) {
      [this.startX, this.endX] = [offsetX, this.startX];
    } else {
      this.endX = offsetX;
    }
  }

  resetTopLeft(offsetX, offsetY) {
    if (offsetX > this.endX && offsetY > this.endY) {
      [this.startX, this.startY, this.endX, this.endY] = [this.endX, this.endY, offsetX, offsetY];
    }
      // else if (offsetX > this.endX) {
      //   [this.startX, this.startY, this.endX, this.endY] = [this.endX, offsetY, offsetX, this.endY];
    // }

    else {
      [this.startX, this.startY] = [offsetX, offsetY];
    }
  }

  resetTopRight(offsetX, offsetY) {
    if (offsetX < this.startX && offsetY > this.endY) {
      [this.startX, this.startY, this.endX, this.endY] = [offsetX, this.endY, this.startX, offsetY];
    }
      // else if (offsetX < this.startX) {
      //   [this.startX, this.startY, this.endX, this.endY] = [offsetX, offsetY, this.startX, this.endY];
    // }
    else {

      [this.endX, this.startY] = [offsetX, offsetY];
    }
  }

  resetBottomLeft(offsetX, offsetY) {

    if (offsetX > this.endX && offsetY < this.startY) {
      [this.startX, this.startY, this.endX, this.endY] = [this.endX, offsetY, offsetX, this.startY];
    } else {
      [this.startX, this.endY] = [offsetX, offsetY]
    }
  }

  resetBottomRight(offsetX, offsetY) {
    if (offsetX < this.startX && offsetY < this.startY) {
      [this.startX, this.startY, this.endX, this.endY] = [offsetX, offsetY, this.startX, this.startY];
    } else {
      [this.endX, this.endY] = [offsetX, offsetY]
    }
  }

  // screen shot draw
  draw(startX, startY, width, height, imageInfo, drawCbArr = []) {
    const {canvas} = this;
    const ctx = canvas.getContext('2d');
    ctx.save();
    ctx.strokeStyle = REGULATE_STROKE_STYLE;
    ctx.lineWidth = SCREEN_SHOT_LINE_WIDTH;
    ctx.lineJoin = SCREEN_SHOT_LINE_JOIN;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(imageInfo.image, 0, 0, canvas.width, canvas.height);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < imageData.data.length; i += 4) {
      imageData.data[i] *= 0.5;
      imageData.data[i + 1] *= 0.5;
      imageData.data[i + 2] *= 0.5;
    }
    ctx.putImageData(imageData, 0, 0);
    ctx.drawImage(imageInfo.image, startX, startY, width, height, startX, startY, width, height);
    drawCbArr.forEach(function (cb) {
      cb()
    });
    ctx.restore();
  }

  mouseUpDraw(imageInfo) {
    const {startX, startY, canvas} = this;
    const width = this.getWidth(),
      height = this.getHeight();
    this.draw(startX, startY, width, height, imageInfo);
    // todo 8个点
    const midX = width / 2 + startX,
      midY = height / 2 + startY,
      endX = width + startX,
      endY = height + startY;

    [
      [startX, startY],
      [midX, startY],
      [endX, startY],
      [endX, midY],
      [endX, endY],
      [midX, endY],
      [startX, endY],
      [startX, midY]
    ].forEach(function ([x, y]) {
      drawCircle(canvas, x, y);
    })
  }


  mouseMoveDraw(offsetX, offsetY, imageInfo) {
    const {startX, startY, endX, endY} = this;
    const line = this.getCurrentLine();
    // 调整前
    if (!line) {
      this.draw(startX, startY, offsetX - startX, offsetY - startY, imageInfo);
      return;
    }
    // 调整中
    switch (line) {
      case TOP:
        this.draw(startX, offsetY, endX - startX, endY - offsetY, imageInfo);
        break;
      case BOTTOM:
        this.draw(startX, startY, endX - startX, offsetY - startY, imageInfo);
        break;
      case LEFT:
        this.draw(offsetX, startY, endX - offsetX, endY - startY, imageInfo);
        break;
      case RIGHT:
        this.draw(startX, startY, offsetX - startX, endY - startY, imageInfo);
        break;
      case TOP_LEFT:
        this.draw(offsetX, offsetY, endX - offsetX, endY - offsetY, imageInfo);
        break;
      case TOP_RIGHT:
        this.draw(startX, offsetY, offsetX - startX, endY - offsetY, imageInfo)
        break;
      case BOTTOM_LEFT:
        this.draw(offsetX, startY, endX - offsetX, offsetY - startY, imageInfo)
        break;
      case BOTTOM_RIGHT:
        this.draw(startX, startY, offsetX - startX, offsetY - startY, imageInfo)
        break;
    }
  }
}

export class EditRect extends Rect {
  constructor(props) {
    super(props);
    const {strokeStyle = '#000'} = props;
    this.strokeStyle = strokeStyle;
  }

  setStrokeStyle(style) {
    this.strokeStyle = style;
  }

  getStrokeStyle() {
    return this.strokeStyle;
  }

  mouseUpDraw(imageInfo) {
    this.draw(this.startX, this.startY, this.getWidth(), this.getHeight(), imageInfo);
  }

  draw(startX, startY, width, height, imageInfo) {
    console.warn(startX, startY, width, height, imageInfo)
    const {canvas} = this;
    const ctx = canvas.getContext('2d');
    ctx.save();
    ctx.strokeStyle = this.getStrokeStyle();
    ctx.lineWidth = 1;
    ctx.lineJoin = SCREEN_SHOT_LINE_JOIN;
    ctx.strokeRect(startX, startY, width, height);
    ctx.restore();
  }

}

class ScreenShotRect extends Rect {
  constructor(props) {
    super(props);
  }


}