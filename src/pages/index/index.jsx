import React, {useState, useRef, useEffect} from "react";
import Outer from "../../components/outer/outer";
import FileInput from '../../components/fileInput/file-input';
import Canvas from '../../components/canvas/canvas';
import InfoCard from '../../components/infoCard/infoCard';
import canvas from "../../components/canvas/canvas";

export default function Index(props) {

  const outerRef = useRef(null)
  const canvasRef = useRef(null);


  const [imageData, setImageData] = useState({data: []});

  const [imageInfo, setImageInfo] = useState({});
  const [position, setPosition] = useState({x: 0, y: 0, colorArrayData: []})


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

  const [file, setFile] = useState(new File([], ''));

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

  function handleKeyDown(ev) {
    const {code} = ev;
    console.log(code)
    if (code === 'F1') {
      console.log(code)
      ev.preventDefault();
      ev.stopPropagation();
    }
  }

  document.documentElement.addEventListener('keyup', ev => {
  })

  return (
    <div>
      <Outer ref={outerRef}/>
      <FileInput handleInputChange={handleFileChange}/>
      <Canvas onMouseMove={handleMouseMove} ref={canvasRef}/>
      <InfoCard position={position}/>
    </div>
  )
}
