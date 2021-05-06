import React, {useState, useRef, useEffect} from "react";
import Outer from "../../components/outer/outer";
import FileInput from '../../components/fileInput/file-input';

import SvgScreenShot from '../../../assert/svgScreenShot.svg';
import SvgColorPicker from '../../../assert/svgColorPicker.svg';
import SvgDownload from '../../../assert/download.svg';
import Canvas from '../../components/canvas/canvas';
import InfoCard from '../../components/infoCard/infoCard';
import canvas from "../../components/canvas/canvas";
import classes from "./index.module.css";
import OperateMenu from "../../components/operateMenu/operateMenu";
import OperateBar from '../../components/operateBar/operateBar';

import '@alifd/next/dist/next.css';
import {Message, Button} from '@alifd/next';
import {Notification,} from '@alifd/next';

let {warn: w, log: l} = console;
if (import.meta.env.PROD) {
  w = function () {
  };
  l = function () {
  };
}

let duration = 4500;
const openNotification = (title, content) => {
  const args = {
    title,
    content,
    duration
  };
  Notification.open(args);
};


import {

  ACTION_TYPE,
  ACTION_MOMENT,

  ABOUT_NUM,
  SCALE,
  getCursor,


  throttle,
  Rect,
  isNumInRange,
  EditRect,
  getImageInfo,
  drawScene
} from "../../function";

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
    if (offsetX >= 1 && offsetY >= 1 && offsetX * offsetY <= w * h) {
      let start = (offsetY - 1) * 4 * w + (offsetX - 1) * 4;
      return [
        imageData.data[start],
        imageData.data[start + 1],
        imageData.data[start + 2],
        imageData.data[start + 3],
      ];
    }
  }, 0)

  const [screenShotRect, setScreenShotRect] = useState(null);

  // 绘制矩形数组
  const [editRectList, setEditRectList] = useState([]);

  const [editRectStyles, setEditRectStyles] = useState([1, '#000']);

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
    getImageInfo(URL.createObjectURL(file), outerRef.current).then(function (imageInfo) {
      // todo 这里太乱了，处理下
      actionEmitter({
        type: ACTION_TYPE.INIT,
        moment: ACTION_MOMENT.BEFORE_START,
        cursor: getCursor(),
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

  function isInScreenShotRect(offsetX, offsetY) {
    return isNumInRange(offsetX, screenShotRect.getStartX(), screenShotRect.getEndX()) &&
      isNumInRange(offsetY, screenShotRect.getStartY(), screenShotRect.getEndY())
  }

  const handleMouseDown = throttle(function (ev) {
    const {nativeEvent: {offsetX, offsetY}} = ev;
    const {type, moment} = actionStatus;
    if (type === ACTION_TYPE.PICK_COLOR) {
      copyText(position.colorArrayData.toString());
      return Message.success('复制成功');
    }
    if (type === ACTION_TYPE.SCREEN_SHOT) {

      if (moment === ACTION_MOMENT.BEFORE_START) {
        screenShotRect.setStartX(offsetX);
        screenShotRect.setStartY(offsetY);
        actionEmitter({
          type: ACTION_TYPE.SCREEN_SHOT,
          moment: ACTION_MOMENT.STARTED,
          cursor: getCursor(ACTION_TYPE.SCREEN_SHOT),
        })
      }
      if (moment === ACTION_MOMENT.END) { // 圈完截图区域。
        // 确定当前活动的边
        const line = screenShotRect.getCurActiveLine(offsetX, offsetY);
        if (line) w(line);
        const moment = line ? ACTION_MOMENT.REGULATING : ACTION_MOMENT.END;
        screenShotRect.setCurrentLine(line);
        actionEmitter({
          type: ACTION_TYPE.SCREEN_SHOT,
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
          type: ACTION_TYPE.EDITING_RECT,
          moment: ACTION_MOMENT.STARTED,
          cursor: getCursor(ACTION_TYPE.EDITING_RECT),
        })

        const editRect = new EditRect({
          startX: offsetX,
          startY: offsetY,
          canvas: canvasRef.current,
        })
        // 设置绘制矩形的样式
        const [lineWidth, strokeStyle] = editRectStyles;
        editRect.setLineWidth(lineWidth);
        editRect.setStrokeStyle(strokeStyle);
        setEditRectList(
          [
            ...editRectList,
            editRect,
          ]);
      }
      if (moment === ACTION_MOMENT.END) {
        // 判断是否在screenShot范围内
        if (!isInScreenShotRect(offsetX, offsetY)) {
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
          type: ACTION_TYPE.EDITING_RECT,
          moment: ACTION_MOMENT.STARTED,
          cursor: getCursor(line || ACTION_TYPE.EDITING_RECT),
        })


      }


    }
  }, 100);


  const handleMouseMove = throttle(function (ev) {
    const {nativeEvent: {offsetX, offsetY}, pageX, pageY} = ev;
    const {width, height} = canvasRef.current;
    const {type, moment} = actionStatus;

    if (type === ACTION_TYPE.PICK_COLOR) {
      const colorArrayData = calcCursorPosition(ev, imageInfo)
      setPosition({
        x: pageX + 15,
        y: pageY + 15,
        colorArrayData
      });
    }

    if (type === ACTION_TYPE.SCREEN_SHOT) {
      if ([ACTION_MOMENT.BEFORE_START].indexOf(moment) > -1) return;
      if (moment === ACTION_MOMENT.STARTED) {

        screenShotRect.mouseMoveDraw(offsetX, offsetY, imageInfo);
      }

      if (moment === ACTION_MOMENT.END) {
        // 获取当前激活的边
        const line = screenShotRect.getCurActiveLine(offsetX, offsetY);
        if (line) w(line)
        actionEmitter({
          type: ACTION_TYPE.SCREEN_SHOT,
          moment: ACTION_MOMENT.END,
          cursor: getCursor(line || ACTION_TYPE.SCREEN_SHOT)
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

        screenShotRect.draw(screenShotRect.getStartX(), screenShotRect.getStartY(), screenShotRect.getWidth(), screenShotRect.getHeight(), imageInfo,
          editRectList.slice(0, editRectList.length - 1).map(function (editRect) {
            return editRect.mouseUpDraw.bind(editRect, imageInfo);
          }).concat([curEditRect.mouseMoveDraw.bind(curEditRect, offsetX, offsetY, imageInfo),
          ])
        )
      }
    }

  }, 30)

  const handleMouseUp = throttle(function (ev) {
    const {nativeEvent: {offsetX, offsetY}} = ev;
    let {type, moment} = actionStatus;
    if (type === ACTION_TYPE.SCREEN_SHOT) {

      if (moment === ACTION_MOMENT.END) return;

      if (moment === ACTION_MOMENT.STARTED) { // 首次定下截屏范围

        screenShotRect.setEndX(offsetX);
        screenShotRect.setEndY(offsetY);
        screenShotRect.mouseUpDraw(imageInfo);
        actionEmitter({
          type: ACTION_TYPE.SCREEN_SHOT,
          moment: ACTION_MOMENT.END,
          cursor: getCursor(ACTION_TYPE.SCREEN_SHOT)
        })
      }

      if (actionStatus.moment === ACTION_MOMENT.REGULATING) {

        const b = screenShotRect.mouseUpResetPos(offsetX, offsetY);
        if (!b) return;
        screenShotRect.mouseUpDraw(imageInfo);

        actionEmitter({
          type: ACTION_TYPE.SCREEN_SHOT,
          moment: ACTION_MOMENT.END,
          cursor: getCursor(ACTION_TYPE.SCREEN_SHOT),
        })
      }

    }
    if (type === ACTION_TYPE.EDITING_RECT) {
      if (!isInScreenShotRect(offsetX, offsetY)) {
        return l('范围外');
      }
      const curEditRect = editRectList[editRectList.length - 1];
      if (!curEditRect) return l('no curEditRect');

      curEditRect.setEndX(offsetX);
      curEditRect.setEndY(offsetY);
      screenShotRect.draw(screenShotRect.getStartX(), screenShotRect.getStartY(), screenShotRect.getWidth(), screenShotRect.getHeight(), imageInfo,
        editRectList.map(function (editRect) {
          return editRect.mouseUpDraw.bind(editRect, imageInfo);
        })
      )

      actionEmitter({
        type: ACTION_TYPE.EDITING_RECT,
        moment: ACTION_MOMENT.BEFORE_START,
        cursor: getCursor(ACTION_TYPE.EDITING_RECT)
      })
    }
  }, 0);


  function handlePickColor(ev) {
    if (!imageInfo) return Message.warning('请先选择图片');
    actionEmitter({
      type: ACTION_TYPE.PICK_COLOR,
      moment: ACTION_MOMENT.BEFORE_START,
      cursor: getCursor(ACTION_TYPE.PICK_COLOR),
    })
    openNotification('提示', '点击要取色的地方即可取色');
  }

  function handleClip() {
    if (!imageInfo) return Message.warning('请先选择图片');
    actionEmitter({
      type: ACTION_TYPE.SCREEN_SHOT,
      moment: ACTION_MOMENT.BEFORE_START,
      cursor: getCursor(ACTION_TYPE.SCREEN_SHOT),
    })
    setScreenShotRect(new Rect({
      startX: 0,
      startY: 0,
      endX: 0,
      endY: 0,
      canvas: canvasRef.current
    }));
    setEditRectList([]);
    openNotification('提示', '绘制完成可按ctrl + c下载图片');
  }

  useEffect(function () {
    if (!screenShotRect) return;
    // 进入截屏模式
    actionEmitter({
      type: ACTION_TYPE.SCREEN_SHOT,
      moment: ACTION_MOMENT.BEFORE_START,
      cursor: getCursor(ACTION_TYPE.SCREEN_SHOT),
    })
  }, [screenShotRect])


  // 处理样式
  let operateBarStyle = {};
  const {type, moment} = actionStatus;
  // 显示编辑栏
  const operateBarVisibility = (type === ACTION_TYPE.SCREEN_SHOT && (
      [ACTION_MOMENT.BEFORE_START, ACTION_MOMENT.STARTED].indexOf(moment) === -1
    )) ||
    (
      type === ACTION_TYPE.EDITING_RECT
    )
  const isEditingRect = type === ACTION_TYPE.EDITING_RECT &&
    moment === ACTION_MOMENT.BEFORE_START;

  Object.assign(operateBarStyle, {
    display: operateBarVisibility ? 'block' : 'none',
    x: screenShotRect?.startX + screenShotRect?.canvas?.offsetLeft,
    y: screenShotRect?.endY + screenShotRect?.canvas?.offsetTop,
    isEditingRect,
  })

  function copyText(text, callback) { // text: 要复制的内容， callback: 回调
    let tag = document.createElement('input');
    tag.setAttribute('id', 'cp_hgz_input');
    tag.value = text;
    document.getElementsByTagName('body')[0].appendChild(tag);
    document.getElementById('cp_hgz_input').select();
    document.execCommand('copy');
    document.getElementById('cp_hgz_input').remove();
    if (callback) {
      callback(text)
    }
  }

  function handleCopy(ev) {
    if (!imageInfo) return Message.warning('请先选择图片');
    const {type} = actionStatus;
    if (type === ACTION_TYPE.INIT) {
      return Message.notice('请选定要截取的范围');
    }
    if (type === ACTION_TYPE.PICK_COLOR) {
      return Message.notice('请点击要取色的区域');
    }
    if (!screenShotRect) return;
    let temCanvas = document.createElement('canvas');
    outerRef.current.appendChild(temCanvas);

    temCanvas.width = screenShotRect.getWidth();
    temCanvas.height = screenShotRect.getHeight();
    const temCtx = temCanvas.getContext('2d');

    const baseStartX = screenShotRect.getStartX(),
      baseStartY = screenShotRect.getStartY();

    temCtx.drawImage(imageInfo.image,
      baseStartX,
      baseStartY,
      screenShotRect.getWidth(),
      screenShotRect.getHeight(),
      0,
      0,
      screenShotRect.getWidth(),
      screenShotRect.getHeight());
    if (editRectList.length) {
      editRectList.forEach(function (editRect) {
        temCtx.strokeStyle = editRect.getStrokeStyle();
        temCtx.lineWidth = editRect.getLineWidth();
        temCtx.strokeRect(
          editRect.getStartX() - baseStartX,
          editRect.getStartY() - baseStartY,
          editRect.getWidth(),
          editRect.getHeight());
      })
    }
    // todo 其他几个矩形
    temCanvas.toBlob(function (blob) {
      const url = URL.createObjectURL(blob);
      const downLink = document.createElement('a');
      downLink.href = url;
      downLink.download = 'test.jpg';
      downLink.click();
      URL.revokeObjectURL(url);
      temCanvas = null;
      return Message.success('复制成功')
    }, 'image/jpeg', 1);
  }

  function handleEditRect() {
    let {type, moment} = actionStatus;
    type = type === ACTION_TYPE.SCREEN_SHOT ? ACTION_TYPE.EDITING_RECT : ACTION_TYPE.SCREEN_SHOT;

    if (type === ACTION_TYPE.EDITING_RECT) {
      moment = moment === ACTION_MOMENT.BEFORE_START ? ACTION_MOMENT.END : ACTION_MOMENT.BEFORE_START;
    } else {
      moment = ACTION_MOMENT.END;
    }
    // 清空
    if (type === ACTION_TYPE.SCREEN_SHOT) setEditRectList([]);
    actionEmitter({
      type,
      moment,
      cursor: getCursor(type),
    })
  }

  function handleEditText(ev) {
    Message.notice('todo')
  }

  function handleCancel(ev) {
    ev.preventDefault();
    ev.stopPropagation();
    w('gg')
    actionEmitter({
      type: ACTION_TYPE.SCREEN_SHOT,
      moment: ACTION_MOMENT.BEFORE_START,
      cursor: getCursor('')
    });
    setEditRectList([]);
    drawScene(canvasRef.current, imageInfo);
  }

  function handleChangeLineWidth(lW) {
    w(lW)
    setEditRectStyles([lW, editRectStyles[1]]);
  }

  function handleChangeStrokeStyle(sS) {
    w(sS)
    setEditRectStyles([editRectStyles[0], sS]);
  }

  return (
    <div className={
      [
        classes.con,
      ].join(' ')
    }
         onCopy={handleCopy}
         onContextMenu={handleCancel}
    >
      <Outer ref={outerRef}/>
      <OperateMenu>
        <FileInput handleInputChange={handleFileChange}/>
        <Button className={classes.btn} onClick={handlePickColor}>
          <img src={SvgColorPicker} alt="icon"/>
          选择颜色
        </Button>
        <Button className={classes.btn} onClick={handleClip}>
          <img src={SvgScreenShot} alt="icon"/>
          图片裁剪
        </Button>
        <Button className={classes.btn} onClick={handleCopy}>
          <img src={SvgDownload} alt="icon"/>
          点击下载
        </Button>
      </OperateMenu>
      <div
      >
        <Canvas
          style={
            {cursor: actionStatus.cursor}
          }
          onMouseMove={handleMouseMove}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          ref={canvasRef}/>
      </div>
      {
        import.meta.env.PROD ? null :
          <>
            <h2>{JSON.stringify(operateBarStyle)}</h2>
            <h2>{actionStatus.type}</h2>
            <h2>{actionStatus.moment}</h2>
          </>
      }
      {/*<h2>{JSON.stringify(operateBarStyle)}</h2>*/}
      {/*<h3>{screenShotRect?.startX}</h3>*/}
      {/*<h3>{screenShotRect?.startY}</h3>*/}
      {/*<h3>{screenShotRect?.endX}</h3>*/}
      {/*<h3>{screenShotRect?.endY}</h3>*/}
      {actionStatus.type === ACTION_TYPE.PICK_COLOR ? <InfoCard position={position}/> : null}
      {actionStatus.type === ACTION_TYPE.SCREEN_SHOT || actionStatus.type === ACTION_TYPE.EDITING_RECT ?
        <OperateBar style={operateBarStyle}
                    onChangeLineWidth={handleChangeLineWidth}
                    onChangeStrokeStyle={handleChangeStrokeStyle}
                    onEditRect={handleEditRect}
                    onEditText={handleEditText}
        /> : null}
    </div>
  )
}
