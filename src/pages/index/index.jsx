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


  throttle, TOP_LEFT, TOP_RIGHT, BOTTOM_LEFT, BOTTOM_RIGHT, drawRegulateRect, Rect, isNumInRange, EditRect
} from "../../function";


const {warn: w, log: l} = console;
export default function Index(props) {

  const outerRef = useRef(null)
  const canvasRef = useRef(null);

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

  const [screenShotRect, setScreenShotRect] = useState(null);

  const [editRectList, setEditRectList] = useState([]);

  const [actionStatus, actionEmitter] = useState({
    type: ACTION_TYPE.INIT, // todo
    moment: ACTION_MOMENT.BEFORE_START, // STARTED
    cursor: getCursor(),
  })


  useEffect(function (ev) {

    canvasRef.current.width *= SCALE;
    canvasRef.current.height *= SCALE;

  }, [canvasRef])

  useEffect(function (ev) {
    getImageInfo(URL.createObjectURL(file)).then(function (imageInfo) {

      // todo 这里太乱了，处理下
      actionEmitter({
        type: ACTION_TYPE.INIT,
        moment: ACTION_MOMENT.BEFORE_START,
        cursor: getCursor(),
        line: '',
      });
      setImageInfo({
        ...imageInfo,
        imageData: renderImageAndGetImageData(canvasRef.current, imageInfo)
      });

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


  function renderImageAndGetImageData(canvas, imageInfo) {
    if (!imageInfo) throw new Error('no image file obj');
    if (!canvas) throw new Error('no canvas');
    let {w, h, image} = imageInfo;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(image, 0, 0, w, h);
    return ctx.getImageData(0, 0, w, h);
  }


  function handleMouseDown(ev) {
    const {nativeEvent: {offsetX, offsetY}} = ev;
    const {type, moment} = actionStatus;
    if (type === ACTION_TYPE.SCREEN_SHOT) {

      if (moment === ACTION_MOMENT.BEFORE_START) {
        screenShotRect.setStartX(offsetX);
        screenShotRect.setStartY(offsetY);
        actionEmitter({
          type: ACTION_TYPE.SCREEN_SHOT,
          moment: ACTION_MOMENT.STARTED,
          cursor: getCursor(),
        })
      }
      if (moment === ACTION_MOMENT.END) { // 圈完截图区域。
        // 确定当前活动的边
        const line = screenShotRect.getCurActiveLine(offsetX, offsetY);
        if (line) w(line);
        const moment = line ? ACTION_MOMENT.REGULATING : ACTION_MOMENT.END;
        screenShotRect.setCurrentLine(line);
        actionEmitter({
          ...actionStatus,
          moment,
          cursor: getCursor(line)
        })
      }
    }

    if (type === ACTION_TYPE.EDITING_RECT) {
      if (moment === ACTION_MOMENT.BEFORE_START) {
        // 判断是否在screenShot范围内
        if (!isInScreenShotRect(offsetX, offsetY)) {
          return l('范围外');
        }

        actionEmitter({
          ...actionStatus,
          moment: ACTION_MOMENT.STARTED,
          cursor: getCursor(),
        })

        setEditRectList(
          [
            ...editRectList,
            new EditRect({
              startX: offsetX,
              startY: offsetY,
              canvas: canvasRef.current,
            })
          ]);
      }
      if (moment === ACTION_MOMENT.END) {
        // 判断是否在screenShot范围内
        if (!isNumInRange(offsetX, screenShotRect.getStartX(), screenShotRect.getEndX()) ||
          !isNumInRange(offsetY, screenShotRect.getStartY(), screenShotRect.getEndY())) {
          return l('范围外');
        }
        let line, curEditRect;
        for (let editRect of editRectList) {
          if ((line = editRect.getCurrentLine(offsetX, offsetY))) {
            curEditRect = editRect;
            break;
          }
        }
        if (!line) return;
        if (line) w(line);
        curEditRect.setCurrentLine(line);
        actionEmitter({
          ...actionStatus,
          moment: ACTION_MOMENT.STARTED,
          cursor: getCursor(line),
        })


      }


    }
  }

  function isInScreenShotRect(offsetX, offsetY) {
    return isNumInRange(offsetX, screenShotRect.getStartX(), screenShotRect.getEndX()) &&
      isNumInRange(offsetY, screenShotRect.getStartY(), screenShotRect.getEndY())
  }

  function handleMouseMove(ev) {
    const {nativeEvent: {offsetX, offsetY}} = ev;
    const {width, height} = canvasRef.current;
    const {type, moment} = actionStatus;

    if (type === ACTION_TYPE.PICK_COLOR) {

      calcCursorPosition(ev, imageInfo)
    }

    if (type === ACTION_TYPE.SCREEN_SHOT) {
      if ([ACTION_MOMENT.BEFORE_START].indexOf(moment) > -1) return;
      if (moment === ACTION_MOMENT.STARTED) {

        screenShotRect.mouseMoveDraw(offsetX, offsetY, imageInfo);
      }

      if (moment === ACTION_MOMENT.END) {
        const line = screenShotRect.getCurActiveLine(offsetX, offsetY);
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
        // 超出了边
        if (!isNumInRange(offsetX, 0, width) || !isNumInRange(offsetY, 0, height)) {
          // if (offsetX <= 0 || offsetY <= 0 || offsetX >= width || offsetY >= height) {
          let nEv = {};
          if (offsetX <= 0) nEv.offsetX = ABOUT_NUM;
          if (offsetY <= 0) nEv.offsetY = ABOUT_NUM;
          if (offsetX >= width) nEv.offsetX = width - ABOUT_NUM;
          if (offsetY >= height) nEv.offsetY = height - ABOUT_NUM;
          return handleMouseUp({...ev, nativeEvent: nEv});
        }
        screenShotRect.mouseMoveDraw(offsetX, offsetY, imageInfo);
      }

    }

    if (type === ACTION_TYPE.EDITING_RECT) {
      if ([ACTION_MOMENT.BEFORE_START].indexOf(moment) > -1) return;
      if (moment === ACTION_MOMENT.STARTED) {
        // 判断是否在screenShot范围内
        if (!isInScreenShotRect(offsetX, offsetY)) {
          return l('范围外');
        }
        const curEditRect = editRectList[editRectList.length - 1];
        if (!curEditRect) return l('no curEditRect');
        screenShotRect.draw(screenShotRect.getStartX(), screenShotRect.getStartY(), screenShotRect.getWidth(), screenShotRect.getHeight(), imageInfo, [
          curEditRect.mouseMoveDraw.bind(curEditRect, offsetX, offsetY, imageInfo),
        ])
      }
    }

  }

  function handleMouseUp(ev) {
    const {nativeEvent: {offsetX, offsetY}} = ev;
    let {type, moment} = actionStatus;
    if (type === ACTION_TYPE.SCREEN_SHOT) {

      if (moment === ACTION_MOMENT.END) return;

      if (moment === ACTION_MOMENT.STARTED) { // 首次定下截屏范围
        const [startX, startY] = [
          screenShotRect.getStartX(),
          screenShotRect.getStartY()
        ]
        drawRegulateRect(canvasRef.current, startX, startY, offsetX - startX, offsetY - startY, imageInfo);

        screenShotRect.setEndX(offsetX);
        screenShotRect.setEndY(offsetY);

        actionEmitter({
          ...actionStatus,
          moment: ACTION_MOMENT.END,
          line: '',
          cursor: getCursor()
        })
      }

      if (actionStatus.moment === ACTION_MOMENT.REGULATING) {

        const b = screenShotRect.mouseUpResetPos(offsetX, offsetY);
        if (!b) return;
        screenShotRect.mouseUpDraw(imageInfo);

        actionEmitter({
          type: ACTION_TYPE.SCREEN_SHOT,
          moment: ACTION_MOMENT.END,
          cursor: getCursor(),
          line: ''
        })
      }

    }
    if (type === ACTION_TYPE.EDITING_RECT) {
      if (!isInScreenShotRect(offsetX, offsetY)) {
        return l('范围外');
      }
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

  function handleClip() {
    if (!imageInfo) return Message.warning('请先选择图片');
    setScreenShotRect(new Rect({
      startX: 0,
      startY: 0,
      endX: 0,
      endY: 0,
      canvas: canvasRef.current
    }));

  }

  useEffect(function () {
    if (!screenShotRect) return;
    // 进入截屏模式
    actionEmitter({
      ...actionStatus,
      type: ACTION_TYPE.SCREEN_SHOT,
      moment: ACTION_MOMENT.BEFORE_START,
    })
  }, [screenShotRect])

  function handleCopy(ev) {
    if (!imageInfo) return Message.warning('请先选择图片');
    const temCanvas = document.createElement('canvas');
    outerRef.current.appendChild(temCanvas);

    // const {startX, startY, endX, endY} = actionStatus;

    temCanvas.width = screenShotRect.getWidth();
    temCanvas.height = screenShotRect.getHeight();
    const temCtx = temCanvas.getContext('2d');

    temCtx.drawImage(imageInfo.image,
      screenShotRect.getStartX(),
      screenShotRect.getStartY(),
      screenShotRect.getWidth(),
      screenShotRect.getHeight(),
      0,
      0,
      screenShotRect.getWidth(),
      screenShotRect.getHeight());

    temCanvas.toBlob(function (blob) {
      const url = URL.createObjectURL(blob);
      const downLink = document.createElement('a');
      downLink.href = url;
      downLink.download = 'test.jpg';
      downLink.click();
    }, 'image/jpeg', 1);
  }

  let operateBarStyle = {};
  if (actionStatus.moment === ACTION_MOMENT.END) {
    Object.assign(operateBarStyle, {
      display: 'block',
      x: screenShotRect.startX,
      y: screenShotRect.endY + screenShotRect?.canvas?.offsetTop
    })
  }


  function handleEditRect(ev) {
    actionEmitter({
      ...actionStatus,
      type: ACTION_TYPE.EDITING_RECT,
      moment: ACTION_MOMENT.BEFORE_START,
      cursor: getCursor(),
      line: '',
    })
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
      <h2>{actionStatus.type}</h2>
      <h2>{actionStatus.moment}</h2>
      {/*<h2>{JSON.stringify(operateBarStyle)}</h2>*/}
      <h3>{screenShotRect?.startX}</h3>
      <h3>{screenShotRect?.startY}</h3>
      <h3>{screenShotRect?.endX}</h3>
      <h3>{screenShotRect?.endY}</h3>
      {/*{actionStatus.type === ACTION_TYPE.PICK_COLOR ? <InfoCard position={position}/> : null}*/}
      {actionStatus.type === ACTION_TYPE.SCREEN_SHOT ?
        <OperateBar style={operateBarStyle}
                    onEditRect={handleEditRect}
                    onEditText={handleEditText}
        /> : null}
    </div>
  )
}
