import React, {useState, useRef, useEffect, useReducer} from "react";
import Outer from "../../components/outer/outer";
import FileInput from '../../components/fileInput/file-input';
import Canvas from '../../components/canvas/canvas';
import InfoCard from '../../components/infoCard/infoCard';
import canvas from "../../components/canvas/canvas";
import classes from "./index.module.css";


import {
  TOP,
  BOTTOM,
  LEFT,
  RIGHT,

  ACTION_TYPE,
  ACTION_MOMENT,

  CANVAS_WIDTH,
  CANVAS_HEIGHT,
ABOUT_NUM,

  drawRect, getCursor, getLine,

  throttle, TOP_LEFT, TOP_RIGHT, BOTTOM_LEFT, BOTTOM_RIGHT
} from "../../function";


const SCREEN_SHOT_LINE_STYLE = 'rgba(0,0,255,0.5)',
  OPACITY_LINE_STYLE = 'rgba(0,0,0,0)',
  NORMAL = 'rgba(0,0,0,1)';

const {warn: w, log: l} = console;
export default function Index(props) {

  const outerRef = useRef(null)
  const canvasRef = useRef(null);


  const [imageData, setImageData] = useState({data: []});

  const [imageInfo, setImageInfo] = useState({});
  const [position, setPosition] = useState({x: 0, y: 0, colorArrayData: []})

  const [file, setFile] = useState(new File([], ''));

  const calcCursorPosition = throttle(function (ev, imgData) {
    const {nativeEvent: {offsetX, offsetY}, pageX, pageY} = ev;
    const {width, height} = imageData;
    let colorArrayData = [];
    if (imgData.data.length && offsetX >= 1 && offsetY >= 1 && offsetX * offsetY <= width * height) {
      let start = (offsetY - 1) * 4 * width + (offsetX - 1) * 4
      console.warn(
        imgData.data[start],
        imgData.data[start + 1],
        imgData.data[start + 2],
        imgData.data[start + 3],
      )
      colorArrayData = [
        imgData.data[start],
        imgData.data[start + 1],
        imgData.data[start + 2],
        imgData.data[start + 3],
      ]
      setPosition({
        x: pageX + 15,
        y: pageY + 15,
        colorArrayData
      });
    }
  }, 0)


  useEffect(function (ev) {
    getImageInfo(URL.createObjectURL(file)).then(function (imageInfo) {
      console.log(imageInfo)
      setImageInfo(imageInfo);
      renderImage(canvasRef.current, imageInfo);

    }).catch(function (err) {

    })

  }, [file])


  function handleFileChange(ev) {
    if (ev.target.files.length === 0) return;
    const [file] = ev.target.files;
    setFile(file);
  }

  function getImageInfo(blobUrl) {
    return new Promise(((resolve, reject) => {
      if (!blobUrl) reject()
      const image = new Image();
      image.src = blobUrl
      outerRef.current.appendChild(image);
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

  function createCanvas(id = 'canvas') {
    const canvas = document.createElement('canvas');
    canvas.setAttribute('id', id);
    return canvas;
  }

  function renderImage(canvas, imageInfo) {
    let {w, h, image,} = imageInfo;
    if (!image) throw new Error('no image file obj');

    if (!w || !h) {
      w = 300;
      h = 150;
    }
    if (!canvas) {
      canvas = createCanvas();
    }
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(image, 0, 0, w, h);
    // todo
    const imgData = ctx.getImageData(0, 0, w, h);
    setImageData(
      imgData
    );

  }

  function handleMouseMove(ev) {
    calcCursorPosition(ev, imageData)
  }


  const [actionStatus, actionEmitter] = useState({
    type: 'SCREEN_SHOT', // todo
    moment: ACTION_MOMENT.BEFORE_START, // STARTED
    startX: 0,
    startY: 0,
    endX: 0,
    endY: 0,
    cursor: getCursor(),
    line: '', // top bottom left right
  })

  function handleClick(ev) {

  }

  function handleMouseDown(ev) {
    const {nativeEvent: {offsetX, offsetY}} = ev;
    const {type, startX, startY, moment} = actionStatus;
    if (type === ACTION_TYPE.SCREEN_SHOT) {
      if (moment === ACTION_MOMENT.BEFORE_START) {

        // const ctx = canvasRef.current.getContext('2d');
        // ctx.strokeRect(offsetX, offsetY, 1, 1);

        actionEmitter(
          {
            ...actionStatus,
            moment: ACTION_MOMENT.STARTED,
            startX: ev.nativeEvent.offsetX,
            startY: ev.nativeEvent.offsetY
          }
        )
      }
      if (moment === ACTION_MOMENT.END) {
        const {endX, endY} = actionStatus;
        if (!endX || !endY && endX !== 0 && endY !== 0) throw new Error('END状态下应该要有endX,endY');

        // 判断是哪条边
        const line = getLine(startX, startY, endX, endY, offsetX, offsetY);
        if (line) w(line);
        const moment = line ? ACTION_MOMENT.REGULATE : ACTION_MOMENT.END;
        actionEmitter({
          ...actionStatus,
          moment,
          cursor: getCursor(line),
          line
        })
      }
    }

  }

  function handleMouseMove(ev) {
    const {nativeEvent: {offsetX, offsetY}} = ev;
    const {width, height} = canvasRef.current;


    const {type, startX, startY, moment, line} = actionStatus;
    if (type === ACTION_TYPE.SCREEN_SHOT) {
      if ([ACTION_MOMENT.BEFORE_START].indexOf(moment) > -1) return;
      if (moment === ACTION_MOMENT.STARTED) {

        drawRect(canvasRef.current, startX, startY, offsetX - startX, offsetY - startY);

        actionEmitter(
          {
            ...actionStatus,
            endX: offsetX,
            endY: offsetY
          }
        )
      }
    }

    if (actionStatus.moment === ACTION_MOMENT.END) {
      const {endX, endY} = actionStatus;


      const line = getLine(startX, startY, endX, endY, offsetX, offsetY);
      if (line) w(line)
      actionEmitter({
        ...actionStatus,
        cursor: getCursor(line)
      })
    }

    if (actionStatus.moment === ACTION_MOMENT.REGULATE) {
      // 这个状态下才会有endX, endY
      const {endX, endY} = actionStatus;
      if (!endX || !endY && endX !== 0 && endY !== 0) throw new Error('当前不是REGULATE');


      if (offsetX <= 0 || offsetY <= 0 || offsetX >= width || offsetY >= height) {
        let nEv = {};
        if (offsetX <= 0) nEv.offsetX = ABOUT_NUM;
        if (offsetY <= 0) nEv.offsetY = ABOUT_NUM;
        if (offsetX >= width) nEv.offsetX = width - ABOUT_NUM;
        if (offsetY >= height) nEv.offsetY = height - ABOUT_NUM;
        return handleMouseUp({...ev, nativeEvent: nEv});
      }

      if (line === TOP) {
        drawRect(canvasRef.current, startX, offsetY, endX - startX, endY - offsetY);
      }
      if (line === BOTTOM) {
        drawRect(canvasRef.current, startX, startY, endX - startX, offsetY - startY);
      }
      if (line === LEFT) {
        drawRect(canvasRef.current, offsetX, startY, endX - offsetX, endY - startY);
      }
      if (line === RIGHT) {
        drawRect(canvasRef.current, startX, startY, offsetX - startX, endY - startY);
      }

      if (line === TOP_LEFT) drawRect(
        canvasRef.current, offsetX, offsetY, endX - offsetX, endY - offsetY
      );

      if (line === TOP_RIGHT) drawRect(
        canvasRef.current, startX, offsetY, offsetX - startX, endY - offsetY
      )
      if (line === BOTTOM_LEFT) drawRect(
        canvasRef.current, offsetX, startY, endX - offsetX, offsetY - startY
      )
      if (line === BOTTOM_RIGHT) drawRect(
        canvasRef.current, startX, startY, offsetX - startX, offsetY - startY
      )


    }

  }

  function handleMouseUp(ev) {
    const {nativeEvent: {offsetX, offsetY}} = ev;
    let {type, startX, startY, moment} = actionStatus;
    if (type === ACTION_TYPE.SCREEN_SHOT) {
      if (moment === ACTION_MOMENT.STARTED) {

        const ctx = canvasRef.current.getContext('2d');
        ctx.clearRect(0, 0, imageInfo.w || CANVAS_WIDTH, imageInfo.h || CANVAS_HEIGHT);
        if (imageData.data.length && Object.keys(imageInfo).length) {
          ctx.drawImage(imageData, 0, 0, imageInfo.w, imageInfo.h)
        }

        ctx.strokeRect(startX, startY, offsetX - startX, offsetY - startY);

        if (imageData.data.length) {
          l(
            canvasRef.current.getContext('2d').getImageData(actionStatus.startX, actionStatus.startY, actionStatus.endX - actionStatus.startX, actionStatus.endY - actionStatus.startY)
          )
        }

        actionEmitter(function (prevStatus) {
          return {
            ...prevStatus,
            moment: ACTION_MOMENT.END,
            endX: offsetX,
            endY: offsetY,
            line: '',
            cursor: getCursor()
          }
        })

      }
      if (actionStatus.moment === ACTION_MOMENT.REGULATE) {
        let {endX, endY} = actionStatus;
        if (!endX || !endY && endX !== 0 && endY !== 0) throw new Error('当前不是REGULATE');
        const {line} = actionStatus;
        if (!line) return;

        // todo...
        // top: sY 变
        if (line === TOP) {
          if (offsetY > endY) { // 上下边互换 todo >=
            [startY, endY] = [endY, offsetY];
          } else {
            startY = offsetY;
          }
        }
        // bottom：eY 变
        else if (line === BOTTOM) {
          if (offsetY < startY) { // 上下边互换
            [startY, endY] = [offsetY, startY];
          } else {
            endY = offsetY;
          }
        }
        // left: sX 变
        else if (line === LEFT) {
          if (offsetX > endX) {
            [startX, endX] = [endX, offsetX];
          } else {
            startX = offsetX;
          }
        }
        // right eX 变
        else if (line === RIGHT) {
          if (offsetX < startX) {
            [startX, endX] = [offsetX, startX];
          } else {
            endX = offsetX;
          }
        }

        else if (line === TOP_LEFT) {
          // if ()
        }

        actionEmitter({
          type: ACTION_TYPE.SCREEN_SHOT,
          moment: ACTION_MOMENT.END,
          startX,
          startY,
          endX,
          endY,
          cursor: getCursor(),
          line: ''
        })

      }

    }
  }

  let layerStyle = null;

  if (actionStatus.type === 'SCREEN_SHOT') {
    layerStyle = {
      top: actionStatus.startY,
      left: actionStatus.startX,
      width: `${Math.abs(actionStatus.endX - actionStatus.startX)}px`,
      height: `${Math.abs(actionStatus.endY - actionStatus.startY)}px`,
      border: '1px solid blue'
    }
  }

  return (
    <div className={
      [
        classes.mainCon,
      ].join(' ')
    }
         style={{
           cursor: actionStatus.cursor
         }}
    >
      <Outer ref={outerRef}/>
      <FileInput handleInputChange={handleFileChange}/>
      <div className={classes.sceneCon}>
        <Canvas onClick={handleClick}

                onMouseMove={handleMouseMove}
                onMouseDown={handleMouseDown}
                onMouseUp={handleMouseUp}
                ref={canvasRef}/>
        {/*{actionStatus.type === 'SCREEN_SHOT' ? (*/}
        {/*  <div*/}
        {/*    style={layerStyle}*/}
        {/*    className={classes.screenShotLayer}/>*/}
        {/*) : null}*/}
      </div>
      <h2>{actionStatus.moment}</h2>
      <p>{actionStatus.startX}</p>
      <p>{actionStatus.startY}</p>
      <p>{actionStatus.endX}</p>
      <p>{actionStatus.endY}</p>
      <InfoCard position={position}/>
    </div>
  )
}
