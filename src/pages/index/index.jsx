import React, {useState, useRef, useEffect} from "react";
import Outer from "../../components/outer/outer";
import FileInput from '../../components/fileInput/file-input';

import SvgScreenShot from '../../../assert/svgScreenShot.svg';
import SvgColorPicker from '../../../assert/svgColorPicker.svg';
import Canvas from '../../components/canvas/canvas';
import InfoCard from '../../components/infoCard/infoCard';
import canvas from "../../components/canvas/canvas";
import classes from "./index.module.css";
import OperateMenu from "../../components/operateMenu/operateMenu";
import OperateBar from '../../components/operateBar/operateBar';

import '@alifd/next/dist/next.css';
import {Message, Button} from '@alifd/next';

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
  SCALE,
  drawRect, getCursor, getLine,


  throttle, TOP_LEFT, TOP_RIGHT, BOTTOM_LEFT, BOTTOM_RIGHT, drawRegulateRect
} from "../../function";
import {act} from "react-dom/test-utils";


const {warn: w, log: l} = console;
export default function Index(props) {

  const outerRef = useRef(null)
  const canvasRef = useRef(null);

  // const [imageData, setImageData] = useState({data: []});

  const [imageInfo, setImageInfo] = useState(null);
  const [position, setPosition] = useState({x: 0, y: 0, colorArrayData: []})

  const [opBarStyle, setOpBarStyle] = useState(null);

  const [file, setFile] = useState(new File([], ''));


  const calcCursorPosition = throttle(function (ev, imageInfo) {
    const {nativeEvent: {offsetX, offsetY}, pageX, pageY} = ev;
    const {w, h, imageData} = imageInfo;
    if (!imageData) return Message.warning('need imageData');
    let colorArrayData = [];
    if (offsetX >= 1 && offsetY >= 1 && offsetX * offsetY <= w * h) {
      let start = (offsetY - 1) * 4 * w + (offsetX - 1) * 4;
      // w(
      //   imgData.data[start],
      //   imgData.data[start + 1],
      //   imgData.data[start + 2],
      //   imgData.data[start + 3],
      // )
      colorArrayData = [
        imageData.data[start],
        imageData.data[start + 1],
        imageData.data[start + 2],
        imageData.data[start + 3],
      ]
      setPosition({
        x: pageX + 15,
        y: pageY + 15,
        colorArrayData
      });
    }
  }, 0)
  const [actionStatus, actionEmitter] = useState({
    type: ACTION_TYPE.INIT, // todo
    moment: ACTION_MOMENT.BEFORE_START, // STARTED
    startX: 0,
    startY: 0,
    endX: 0,
    endY: 0,
    cursor: getCursor(),
    line: '', // top bottom left right
  })
  useEffect(function (ev) {


    canvasRef.current.width *= SCALE;
    canvasRef.current.height *= SCALE;

  }, [canvasRef])

  useEffect(function (ev) {
    getImageInfo(URL.createObjectURL(file)).then(function (imageInfo) {
      console.log(imageInfo)

      // todo 这里太乱了，处理下
      setImageInfo(imageInfo);
      actionEmitter({
        type: ACTION_TYPE.SCREEN_SHOT, // todo
        moment: ACTION_MOMENT.BEFORE_START, // STARTED
        startX: 0,
        startY: 0,
        endX: 0,
        endY: 0,
        cursor: getCursor(),
        line: '', // top bottom left right
      });
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
    if (!imageInfo) throw  new Error('no image file obj');
    let {w, h, image,} = imageInfo;

    if (!w || !h) {
      w = canvas.width;
      h = canvas.height;
    }
    if (!canvas) {
      canvas = createCanvas();
    }
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(image, 0, 0, w, h);
    // todo
    const imageData = ctx.getImageData(0, 0, w, h);
    setImageInfo({
        ...imageInfo,
        imageData
      }
    );

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
        const moment = line ? ACTION_MOMENT.REGULATING : ACTION_MOMENT.END;
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

    if (type === ACTION_TYPE.PICK_COLOR) {
      calcCursorPosition(ev, imageInfo)
    }

    if (type === ACTION_TYPE.SCREEN_SHOT) {
      if ([ACTION_MOMENT.BEFORE_START].indexOf(moment) > -1) return;
      if (moment === ACTION_MOMENT.STARTED) {

        drawRegulateRect(canvasRef.current, startX, startY, offsetX - startX, offsetY - startY, imageInfo);

        actionEmitter(
          {
            ...actionStatus,
            endX: offsetX,
            endY: offsetY
          }
        )
      }
      if (moment === ACTION_MOMENT.END) {
        const {endX, endY} = actionStatus;

        const line = getLine(startX, startY, endX, endY, offsetX, offsetY);
        if (line) w(line)
        actionEmitter({
          ...actionStatus,
          cursor: getCursor(line)
        })
      }

      if (moment === ACTION_MOMENT.REGULATING) {

        setOpBarStyle({
          ...opBarStyle,
          display: 'none',
        })

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
          drawRegulateRect(canvasRef.current, startX, offsetY, endX - startX, endY - offsetY, imageInfo);
        }
        if (line === BOTTOM) {
          drawRegulateRect(canvasRef.current, startX, startY, endX - startX, offsetY - startY, imageInfo);
        }
        if (line === LEFT) {
          drawRegulateRect(canvasRef.current, offsetX, startY, endX - offsetX, endY - startY, imageInfo);
        }
        if (line === RIGHT) {
          drawRegulateRect(canvasRef.current, startX, startY, offsetX - startX, endY - startY, imageInfo);
        }

        if (line === TOP_LEFT) drawRegulateRect(
          canvasRef.current, offsetX, offsetY, endX - offsetX, endY - offsetY, imageInfo
        );

        if (line === TOP_RIGHT) drawRegulateRect(
          canvasRef.current, startX, offsetY, offsetX - startX, endY - offsetY, imageInfo
        )
        if (line === BOTTOM_LEFT) drawRegulateRect(
          canvasRef.current, offsetX, startY, endX - offsetX, offsetY - startY, imageInfo
        )
        if (line === BOTTOM_RIGHT) drawRegulateRect(
          canvasRef.current, startX, startY, offsetX - startX, offsetY - startY, imageInfo
        )


      }

    }


  }

  function handleMouseUp(ev) {
    const {nativeEvent: {offsetX, offsetY}, pageX, pageY} = ev;
    let {type, startX, startY, moment, endX, endY} = actionStatus;
    if (type === ACTION_TYPE.SCREEN_SHOT) {

      if (moment === ACTION_MOMENT.END) return;

      if (moment === ACTION_MOMENT.STARTED) {
        drawRegulateRect(canvasRef.current, startX, startY, offsetX - startX, offsetY - startY, imageInfo);
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

      if (actionStatus.moment === ACTION_MOMENT.REGULATING) {
        let {endX, endY} = actionStatus;
        if (!endX || !endY && endX !== 0 && endY !== 0) throw new Error('当前不是REGULATE');
        const {line} = actionStatus;
        if (!line) return;

        if (line === TOP) {
          if (offsetY > endY) {
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
        } else if (line === TOP_LEFT) {
          if (offsetX > endX && offsetY > endY) { // todo 是否需要并集？
            [startX, startY, endX, endY] = [endX, endY, offsetX, offsetY];
          } else {
            [startX, startY] = [offsetX, offsetY];
          }
        } else if (line === TOP_RIGHT) {
          if (offsetX < startX && offsetY > endY) {
            [startX, startY, endX, endY] = [offsetX, endY, startX, offsetY];
          } else {
            [endX, startY] = [offsetX, offsetY];
          }
        } else if (line === BOTTOM_LEFT) {
          if (offsetX > endX && offsetY < startY) {
            [startX, startY, endX, endY] = [endX, offsetY, offsetX, startY];
          } else {
            [startX, endY] = [offsetX, offsetY]
          }
        } else if (line === BOTTOM_RIGHT) {
          if (offsetX < startX && offsetY < startY) {
            [startX, startY, endX, endY] = [offsetX, offsetY, startX, startY];
          } else {
            [endX, endY] = [offsetX, offsetY]
          }
        }

        drawRegulateRect(canvasRef.current, startX, startY, endX - startX, endY - startY, imageInfo)


        w(imageInfo.imageData);
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

  function handlePickColor(ev) {
    if (!imageInfo) return Message.warning('请先选择图片');
    actionEmitter({
      ...actionStatus,
      type: ACTION_TYPE.PICK_COLOR,
      moment: ACTION_MOMENT.BEFORE_START
    })
  }

  function handleClip(ev) {
    if (!imageInfo) return Message.warning('请先选择图片');
    actionEmitter({
      ...actionStatus,
      type: ACTION_TYPE.SCREEN_SHOT,
      moment: ACTION_MOMENT.BEFORE_START
    })
  }

  function handleCopy(ev) {
    if (!imageInfo) return Message.warning('请先选择图片');
    const temCanvas = document.createElement('canvas');
    outerRef.current.appendChild(temCanvas);

    const {startX, startY, endX, endY} = actionStatus;

    temCanvas.width = endX - startX;
    temCanvas.height = endY - startY;
    const temCtx = temCanvas.getContext('2d');

    temCtx.drawImage(imageInfo.image, startX, startY, endX - startX, endY - startY, 0, 0, endX - startX, endY - startY);

    temCanvas.toBlob(function (blob) {
      const url = URL.createObjectURL(blob);
      const downLink = document.createElement('a');
      downLink.href = url;
      downLink.download = 'test.jpg';
      downLink.click();
    }, 'image/jpeg', 1);
  }

  let operateBarStyle = {};
  Object.assign(operateBarStyle, {
    display: 'block',
    x: actionStatus.startX,
    y: actionStatus.endY + canvasRef.current?.offsetTop
  })

  function handleEditRect(ev) {

  }

  function handleEditText(ev) {

  }

  return (
    <div className={
      [
        classes.con,
      ].join(' ')
    }
         onCopy={handleCopy}
    >
      <Outer ref={outerRef}/>
      <OperateMenu>
        <FileInput handleInputChange={handleFileChange}/>

        <button onClick={handlePickColor}>
          <img src={SvgColorPicker} alt="icon"/>
          选择颜色
        </button>
        <button onClick={handleClip}>
          <img src={SvgScreenShot} alt="icon"/>
          图片裁剪
        </button>
      </OperateMenu>
      <div className={classes.sceneCon}
      >
        <Canvas
          style={{
            cursor: actionStatus.cursor
          }}
          onMouseMove={handleMouseMove}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          ref={canvasRef}/>
      </div>
      <h2>{actionStatus.moment}</h2>
      <h2>{JSON.stringify(operateBarStyle)}</h2>
      <p>{actionStatus.startX}</p>
      <p>{actionStatus.startY}</p>
      <p>{actionStatus.endX}</p>
      <p>{actionStatus.endY}</p>
      {actionStatus.type === ACTION_TYPE.PICK_COLOR ? <InfoCard position={position}/> : null}
      {actionStatus.type === ACTION_TYPE.SCREEN_SHOT ?
        <OperateBar style={operateBarStyle}
                    onEditRect={handleEditRect}
                    onEditText={handleEditText}
        /> : null}
    </div>
  )
}
