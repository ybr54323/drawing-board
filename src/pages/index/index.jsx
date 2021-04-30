import React, {useState, useRef, useEffect, useReducer} from "react";
import Outer from "../../components/outer/outer";
import FileInput from '../../components/fileInput/file-input';
import Canvas from '../../components/canvas/canvas';
import InfoCard from '../../components/infoCard/infoCard';
import canvas from "../../components/canvas/canvas";
import classes from "./index.module.css";
import ScreenShotLayer from '../../components/screenShotLayer/screenShotLayer'

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


  function throttle(fn, delay = 100) {
    let start = -Infinity;
    return function (...args) {
      const now = +Date.now();
      if (now - start >= delay) {
        start = now;
        return fn.apply(this, args);
      }
    }
  }

  function handleKeydown(ev) {


  }

  useEffect(function (ev) {
    window.addEventListener('keydown', handleKeydown)
  }, [])


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
    type: 'SCREEN_SHOT',
    moment: 'BEFORE_START',
    startX: 0,
    startY: 0,
    endX: 0,
    endY: 0
  })

  function handleClick(ev) {

  }

  function handleMouseDown(ev) {
    console.log('down', ev);
    const {nativeEvent: {offsetX, offsetY}} = ev;
    if (actionStatus.type === 'SCREEN_SHOT') {
      if (actionStatus.moment === 'BEFORE_START') {


        const ctx = canvasRef.current.getContext('2d');
        ctx.strokeRect(offsetX, offsetY, 1, 1);

        actionEmitter(function (prevStatus) {
          return {
            ...prevStatus,
            moment: 'STARTED',
            startX: ev.nativeEvent.offsetX,
            startY: ev.nativeEvent.offsetY
          }
        })
      }
    }

  }

  function handleMouseMove(ev) {
    const {nativeEvent: {offsetX, offsetY}} = ev;
    if (actionStatus.type === 'SCREEN_SHOT') {
      if (['BEFORE_START', 'END'].indexOf(actionStatus.moment) > -1) return;
      if (actionStatus.moment === 'STARTED') {

        const ctx = canvasRef.current.getContext('2d');
        ctx.clearRect();
        if (imageData.data.length && Object.keys(imageInfo).length) {
          ctx.drawImage(imageData, 0, 0, imageInfo.w, imageInfo.h)
        }

        ctx.strokeRect(offsetX, offsetY, actionStatus.endX - actionStatus.startX, actionStatus.endY - actionStatus.startY);

        actionEmitter(function (prevStatus) {
          return {
            ...prevStatus,
            endX: ev.nativeEvent.offsetX,
            endY: ev.nativeEvent.offsetY
          }
        })
      }

    }
  }

  function handleMouseUp(ev) {
    const {nativeEvent: {offsetX, offsetY}} = ev;
    if (actionStatus.type === 'SCREEN_SHOT') {
      if (actionStatus.moment === 'STARTED') {

        const ctx = canvasRef.current.getContext('2d');
        ctx.clearRect();
        if (imageData.data.length && Object.keys(imageInfo).length) {
          ctx.drawImage(imageData, 0, 0, imageInfo.w, imageInfo.h)
        }

        ctx.strokeRect(offsetX, offsetY, actionStatus.endX - actionStatus.startX, actionStatus.endY - actionStatus.startY);


        if (imageData.data.length) {
          console.log(
            canvasRef.current.getContext('2d').getImageData(actionStatus.startX, actionStatus.startY, actionStatus.endX - actionStatus.startX, actionStatus.endY - actionStatus.startY)
          )
        }

        actionEmitter(function (prevStatus) {
          return {
            ...prevStatus,
            moment: 'END',
            endX: ev.nativeEvent.offsetX,
            endY: ev.nativeEvent.offsetY
          }
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
    }>
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

      <InfoCard position={position}/>
    </div>
  )
}
