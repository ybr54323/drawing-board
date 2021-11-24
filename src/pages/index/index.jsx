import React, {useState, useRef, useEffect, useCallback} from "react";
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
import {Message, Button, Notification} from '@alifd/next';

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
  drawScene, EditText, copyText, Mosaic, MOSAIC_WIDTH
} from "../../function";

export default function Index() {
  const outerRef = useRef(null)
  const canvasRef = useRef(null);
  const [imageInfo, setImageInfo] = useState(null);
  const [position, setPosition] = useState({x: 0, y: 0, colorArrayData: []})


  const [file, setFile] = useState(new File([], ''));


  const calcCursorPosition = throttle(function (ev, imageInfo) {
    const {nativeEvent: {offsetX, offsetY}} = ev;
    const {w, h, imageData} = imageInfo;
    if (!imageData) return [];
    if (offsetX >= 1 && offsetY >= 1 && offsetX * offsetY <= w * h) {
      const start = (offsetY - 1) * 4 * w + (offsetX - 1) * 4;
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
  // 绘制文本数组
  const [editTextList, setEditTextList] = useState([]);

  // mosaic
  const [mosaicList, setMosaicList] = useState([]);

  const [editRectStyles, setEditRectStyles] = useState([1, '#000']);

  const [actionStatus, actionEmitter] = useState({
    type: ACTION_TYPE.INIT,
    moment: ACTION_MOMENT.INIT,
    cursor: getCursor(),
  })


  useEffect(function () {
    canvasRef.current.width *= SCALE;
    canvasRef.current.height *= SCALE;
  }, [canvasRef])

  useEffect(function () {
    if (!file) return
    getImageInfo(URL.createObjectURL(file)).then(function (imageInfo) {
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
      return Message.warning('加载图片失败，请刷新重试');
    })
  }, [file])

  // 选择图片
  function handleFileChange(ev) {
    if (ev.target.files.length === 0) return;
    const [file] = ev.target.files;
    setFile(file);
  }

  // 往canvas渲染图片并且借助canvas的api(getImageData)返回图片data
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
      if ([ACTION_MOMENT.BEFORE_START, ACTION_MOMENT.INIT].indexOf(moment) > -1) {
        const line = screenShotRect.getCurActiveLine(offsetX, offsetY);
        if (!line) {
          screenShotRect.setStartX(offsetX);
          screenShotRect.setStartY(offsetY);
          actionEmitter({
            type: ACTION_TYPE.SCREEN_SHOT,
            moment: ACTION_MOMENT.STARTED,
            cursor: getCursor(ACTION_TYPE.SCREEN_SHOT),
          })
        } else {
          w(line);
          screenShotRect.setCurrentLine(line);
          actionEmitter({
            type: ACTION_TYPE.SCREEN_SHOT,
            moment: ACTION_MOMENT.REGULATING,
            cursor: getCursor(line)
          })
        }
      }
    }

    if (type === ACTION_TYPE.EDIT_RECT) {
      if (moment === ACTION_MOMENT.BEFORE_START) {
        // 判断是否在screenShot范围内
        if (!isInScreenShotRect(offsetX, offsetY)) {
          return l('范围外');
        }

        actionEmitter({
          type: ACTION_TYPE.EDIT_RECT,
          moment: ACTION_MOMENT.STARTED,
          cursor: getCursor(ACTION_TYPE.EDIT_RECT),
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
    }

    if (type === ACTION_TYPE.EDIT_TEXT) {
      // 判断是否在screenShot范围内
      if (!isInScreenShotRect(offsetX, offsetY)) {
        return l('范围外');
      }
      if (moment === ACTION_MOMENT.STARTED) {
        // 清空输入缓冲
        const editText = editTextList[editTextList.length - 1];
        editText.draw();
      }

      const editText = new EditText({
        startX: offsetX,
        startY: offsetY,
        canvas: canvasRef.current
      });

      actionEmitter({
        type: ACTION_TYPE.EDIT_TEXT,
        moment: ACTION_MOMENT.STARTED,
        cursor: getCursor(ACTION_TYPE.EDIT_TEXT)
      })
      setEditTextList([
        ...editTextList,
        editText
      ]);

    }
    if (type === ACTION_TYPE.ADD_MOSAIC) {
      // 判断是否在screenShot范围内
      if (!isInScreenShotRect(offsetX, offsetY)) {
        return l('范围外');
      }
      const mosaic = new Mosaic({
        startX: offsetX,
        startY: offsetY,
        canvas: canvasRef.current
      });
      mosaic.draw(mosaic.canvas, MOSAIC_WIDTH * 2);
      setMosaicList([...mosaicList, mosaic]);
      actionEmitter({
        type: ACTION_TYPE.ADD_MOSAIC,
        moment: ACTION_MOMENT.STARTED,
        cursor: getCursor(ACTION_TYPE.ADD_MOSAIC)
      })
    }
  }, 0);


  const handleMouseMove = throttle(function (ev) {
    const {nativeEvent: {offsetX, offsetY}, pageX, pageY} = ev;
    const {width, height} = canvasRef.current;
    const {type, moment} = actionStatus;

    if (type === ACTION_TYPE.PICK_COLOR) {
      const colorArrayData = calcCursorPosition(ev, imageInfo) || []
      setPosition({
        x: pageX + 15,
        y: pageY + 15,
        colorArrayData
      });
    }

    if (type === ACTION_TYPE.SCREEN_SHOT) {
      if (moment === ACTION_MOMENT.BEFORE_START) {

        if (!isInScreenShotRect(offsetX, offsetY)) {
          if (actionStatus.cursor !== 'crosshair') {
            return actionEmitter({
              type: ACTION_TYPE.SCREEN_SHOT,
              moment: ACTION_MOMENT.BEFORE_START,
              cursor: getCursor(ACTION_TYPE.SCREEN_SHOT)
            });
          }
        }
        // 获取当前激活的边
        const line = screenShotRect.getCurActiveLine(offsetX, offsetY);
        if (line) {
          w(line);
          actionEmitter({
            type: ACTION_TYPE.SCREEN_SHOT,
            moment: ACTION_MOMENT.BEFORE_START,
            cursor: getCursor(line || ACTION_TYPE.SCREEN_SHOT)
          })
        }
      }
      if (moment === ACTION_MOMENT.STARTED) {
        screenShotRect.mouseMoveDraw(offsetX, offsetY, imageInfo);
      }


      if (moment === ACTION_MOMENT.REGULATING) {

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
    if (type === ACTION_TYPE.EDIT_RECT) {
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
          }).concat(
            [curEditRect.mouseMoveDraw.bind(curEditRect, offsetX, offsetY, imageInfo)]
          ).concat(
            editTextList.map(function (editText) {
              return editText.draw.bind(editText);
            })
          ).concat(
            mosaicList.map(function (mosaic) {
              return mosaic.draw.bind(mosaic, mosaic.canvas, MOSAIC_WIDTH * 2)
            })
          )
        )
      }
    }
  }, 0)

  const handleMouseUp = throttle(function (ev) {
    const {nativeEvent: {offsetX, offsetY}} = ev;
    let {type, moment} = actionStatus;
    if (type === ACTION_TYPE.SCREEN_SHOT) {


      if (moment === ACTION_MOMENT.STARTED) { // 首次定下截屏范围

        screenShotRect.setEndX(offsetX);
        screenShotRect.setEndY(offsetY);
        screenShotRect.mouseUpDraw(imageInfo);
        actionEmitter({
          type: ACTION_TYPE.SCREEN_SHOT,
          moment: ACTION_MOMENT.BEFORE_START,
          cursor: getCursor(ACTION_TYPE.SCREEN_SHOT)
        })
      }

      if (actionStatus.moment === ACTION_MOMENT.REGULATING) {

        const line = screenShotRect.mouseUpResetPos(offsetX, offsetY);
        if (!line) return;
        screenShotRect.mouseUpDraw(imageInfo);
        actionEmitter({
          type: ACTION_TYPE.SCREEN_SHOT,
          moment: ACTION_MOMENT.BEFORE_START,
          cursor: getCursor(ACTION_TYPE.SCREEN_SHOT),
        })
      }

    }
    if (type === ACTION_TYPE.EDIT_RECT) {
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
        }).concat(
          editTextList.map(function (editText) {
            return editText.draw.bind(editText);
          }).concat(
            mosaicList.map(function (mosaic) {
              return mosaic.draw.bind(mosaic, mosaic.canvas, MOSAIC_WIDTH * 2)
            })
          )
        )
      )

      actionEmitter({
        type: ACTION_TYPE.EDIT_RECT,
        moment: ACTION_MOMENT.BEFORE_START,
        cursor: getCursor(ACTION_TYPE.EDIT_RECT)
      })
    }
    if (type === ACTION_TYPE.EDIT_TEXT) {
    }
    if (type === ACTION_TYPE.ADD_MOSAIC) {
      // 判断是否在screenShot范围内
      if (!isInScreenShotRect(offsetX, offsetY)) {
        return l('范围外');
      }
      if (moment === ACTION_MOMENT.STARTED) {

        actionEmitter({
          type: ACTION_TYPE.ADD_MOSAIC,
          moment: ACTION_MOMENT.BEFORE_START,
          cursor: getCursor(ACTION_TYPE.ADD_MOSAIC)
        })
      }
    }
  }, 0);


  function handlePickColor() {
    if (!imageInfo) return Message.warning('请先选择图片');
    drawScene(canvasRef.current, imageInfo);
    actionEmitter({
      type: ACTION_TYPE.PICK_COLOR,
      moment: ACTION_MOMENT.BEFORE_START,
      cursor: getCursor(ACTION_TYPE.PICK_COLOR),
    })
    setEditTextList([]);
    setEditRectList([]);
    openNotification('提示', '点击要取色的地方即可取色');
  }

  function handleClip() {
    if (!imageInfo) return Message.warning('请先选择图片');

    drawScene(canvasRef.current, imageInfo);
    setScreenShotRect(new Rect({
      startX: 0,
      startY: 0,
      endX: 0,
      endY: 0,
      canvas: canvasRef.current
    }));
    setEditTextList([]);
    setEditRectList([]);
    actionEmitter({
      type: ACTION_TYPE.SCREEN_SHOT,
      moment: ACTION_MOMENT.INIT,
      cursor: getCursor(ACTION_TYPE.SCREEN_SHOT),
    })
    openNotification('提示', '绘制完成可按ctrl + c下载图片');
  }


  // 处理样式
  const operateBarStyle = {};
  const {type, moment} = actionStatus;
  // 显示编辑栏
  const operateBarVisibility = [
      ACTION_TYPE.SCREEN_SHOT,
      ACTION_TYPE.EDIT_TEXT,
      ACTION_TYPE.EDIT_RECT,
      ACTION_TYPE.ADD_MOSAIC,
    ].indexOf(type) > -1 && [ACTION_MOMENT.INIT].indexOf(moment) === -1,
    isEditingRect = type === ACTION_TYPE.EDIT_RECT,
    isEditingText = type === ACTION_TYPE.EDIT_TEXT;

  screenShotRect && Object.assign(operateBarStyle, {
    display: operateBarVisibility ? 'block' : 'none',
    x: screenShotRect.getStartX() + screenShotRect.canvas.offsetLeft,
    y: screenShotRect.getEndY() + screenShotRect.canvas.offsetTop,
    isEditingRect,
    isEditingText,
  })

  // 文本输入框样式
  const editTextInputStyle = {
      position: 'absolute',
      transform: 'translate3d(0,0,0)',
      backgroundColor: 'transparent',
    },
    len = editTextList.length,
    editTextInputVisibility = (type === ACTION_TYPE.EDIT_TEXT) && (moment === ACTION_MOMENT.STARTED);

  len && Object.assign(editTextInputStyle, {
    display: editTextInputVisibility ? 'block' : 'none',
    left: editTextList[len - 1].getStartX() + screenShotRect.canvas.offsetLeft,
    top: editTextList[len - 1].getStartY() + screenShotRect.canvas.offsetTop,
  })

  function handleAppendWatermark() {
    if (!imageInfo) return Message.warning('请先选择图片');

    const {type} = actionStatus;
    const ctx = canvasRef.current.getContext('2d');
    const {width, height} = canvasRef.current;

    if (type === ACTION_TYPE.WATERMARK) {
      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(imageInfo.image, 0, 0, width, height);
    }
    const text = prompt('请输入水印文字');
    if (!text) return Message.warning('要输入文字');


    for (let i = -2 * width; i < width; i += ~~(2 * text.length * 15)) {
      for (let j = 0; j < 2 * height; j += ~~(height / 4)) {
        ctx.rotate((-45 * Math.PI) / 180); // 水印初始偏转角度
        ctx.font = "20px microsoft songti";
        ctx.fillStyle = "rgba(0,0,0,0.2)";
        ctx.fillText(text, i, j);
        ctx.rotate((45 * Math.PI) / 180); // 把水印偏转角度调整为原来的，不然他会一直转
      }
    }

    actionEmitter({
      type: ACTION_TYPE.WATERMARK,
      moment: ACTION_MOMENT.INIT,
      cursor: getCursor()
    });

  }

  function handleCopy() {
    if (!imageInfo) return Message.warning('请先选择图片');
    const {type} = actionStatus;
    if (type === ACTION_TYPE.INIT) {
      return Message.notice('请选定要截取的范围');
    }
    if (type === ACTION_TYPE.PICK_COLOR) {
      return Message.notice('请点击要取色的区域');
    }
    if (type === ACTION_TYPE.WATERMARK) {
      canvasRef.current.toBlob(download, 'image/jpeg', 1);
      return Message.success('复制成功');
    }
    if (!screenShotRect) return;
    let temCanvas = document.createElement('canvas');
    outerRef.current.appendChild(temCanvas);
    temCanvas.width = screenShotRect.getWidth();
    temCanvas.height = screenShotRect.getHeight();
    const temCtx = temCanvas.getContext('2d');
    // 现有的图形数据转移
    const imageData = canvasRef.current.getContext('2d').getImageData(
      screenShotRect.getStartX(),
      screenShotRect.getStartY(),
      screenShotRect.getWidth(),
      screenShotRect.getHeight()
    )
    temCtx.putImageData(imageData, 0, 0);
    temCanvas.toBlob(download, 'image/jpeg', 1);
    Message.success('复制成功');
  }

  const download = useCallback(blob => {
    const url = URL.createObjectURL(blob);
    const downLink = document.createElement('a');
    downLink.href = url;
    downLink.download = 'test.jpg';
    downLink.click();
    URL.revokeObjectURL(url);
  }, []);


  function handleEditRect() {
    actionEmitter({
      type: ACTION_TYPE.EDIT_RECT,
      moment: ACTION_MOMENT.BEFORE_START,
      cursor: getCursor(ACTION_TYPE.EDIT_RECT),
    })
  }

  function handleEditText() {
    actionEmitter({
      type: ACTION_TYPE.EDIT_TEXT,
      moment: ACTION_MOMENT.BEFORE_START,
      cursor: getCursor(ACTION_TYPE.EDIT_TEXT),
    })
  }

  function handleCancel(ev) {
    ev.preventDefault();
    ev.stopPropagation();
    actionEmitter({
      type: ACTION_TYPE.SCREEN_SHOT,
      moment: ACTION_MOMENT.BEFORE_START,
      cursor: getCursor(ACTION_TYPE.SCREEN_SHOT)
    });
    setEditRectList([]);
    setEditTextList([]);
    drawScene(canvasRef.current, imageInfo);
  }

  function handleChangeLineWidth(lW) {
    setEditRectStyles([lW, editRectStyles[1]]);
  }

  function handleChangeStrokeStyle(sS) {
    setEditRectStyles([editRectStyles[0], sS]);
  }


  function handleEditTextChange(ev) {
    if (!editTextList.length) return;
    const editText = editTextList[editTextList.length - 1];
    editText.setText(ev.target.value);
  }

  function handleAddMosaic() {
    actionEmitter({
      type: ACTION_TYPE.ADD_MOSAIC,
      moment: ACTION_MOMENT.BEFORE_START,
      cursor: getCursor(ACTION_TYPE.ADD_MOSAIC),
    })
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
        {/* 选择图片 */}
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
        <Button className={classes.btn} onClick={handleAppendWatermark}>
          添加水印
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


        <OperateBar style={operateBarStyle}
                    onChangeLineWidth={handleChangeLineWidth}
                    onChangeStrokeStyle={handleChangeStrokeStyle}
                    onEditRect={handleEditRect}
                    onEditText={handleEditText}
                    onAddMosaic={handleAddMosaic}
        />

      </div>
      {
        import.meta.env.PROD ? null :
          <>
            <h2>{JSON.stringify(operateBarStyle)}</h2>
            <h2>{actionStatus.type}</h2>
            <h2>{actionStatus.moment}</h2>
            <h2>{JSON.stringify(editTextInputStyle)}</h2>
          </>
      }
      {/*<h2>{JSON.stringify(operateBarStyle)}</h2>*/}
      {/*<h3>{screenShotRect?.startX}</h3>*/}
      {/*<h3>{screenShotRect?.startY}</h3>*/}
      {/*<h3>{screenShotRect?.endX}</h3>*/}
      {/*<h3>{screenShotRect?.endY}</h3>*/}
      {actionStatus.type === ACTION_TYPE.PICK_COLOR ? <InfoCard position={position}/> : null}

      {
        type === ACTION_TYPE.EDIT_TEXT ?
          <input
            className={classes.editText}
            onChange={handleEditTextChange}
            style={editTextInputStyle}
          /> : null
      }

    </div>
  )
}
