import React, {useState} from "react";
import classes from "./operateBar.module.css";

export default function Operate(props) {
  const {
    style: {
      x, y, display,
      isEditingRect = false,
      isEditingText = false,
      isAddingMosaic = false,
    },
    onEditRect,
    onEditText,
    onAddMosaic,
    onChangeLineWidth = function () {
    },
    onChangeStrokeStyle = function () {
    }
  } = props;

  const style = {
    transform: 'translate3d(0,0,0)',
    top: y + 'px',
    left: x + 'px',
    display
  }

  function handleChangeStyle(ev) {
    const i = ev.target.tabIndex;
    console.log(i)
    if (i > -1 && i < 3) {
      onChangeLineWidth(i + 1);
    } else {
      const color = i === 3 ? 'red' : i === 4 ? 'green' : 'blue';
      onChangeStrokeStyle(color)
    }
    setActiveIndex(i);
  }

  const [activeIndex, setActiveIndex] = useState(-1);

  return (
    <div className={classes.con} style={style}>
      <section>
        <div onClick={onEditRect} className={classes.btn}>
          {isEditingRect}
          <svg t="1619955875785" className="icon" viewBox="0 0 1024 1024" version="1.1"
               xmlns="http://www.w3.org/2000/svg"
               p-id="3605" width="16" height="16">
            <path
              d="M746.666667 341.333333v341.333334h-469.333334V341.333333h469.333334m68.266666-85.333333H209.066667a17.066667 17.066667 0 0 0-17.066667 17.066667v477.866666a17.066667 17.066667 0 0 0 17.066667 17.066667h605.866666a17.066667 17.066667 0 0 0 17.066667-17.066667V273.066667a17.066667 17.066667 0 0 0-17.066667-17.066667z"
              p-id="3606" fill={isEditingRect ? '#1296db' : '#fff'}/>
          </svg>
        </div>
        <div onClick={onEditText} className={classes.btn}>
          <svg t="1619955335199" className="icon" viewBox="0 0 1024 1024" version="1.1"
               xmlns="http://www.w3.org/2000/svg"
               p-id="3406" width="16" height="16">
            <path
              d="M213.333333 209.92v128h85.333334v-42.666667h170.666666v433.493334H384.853333v85.333333h256v-85.333333H554.666667V295.253333h170.666666v42.666667h85.333334v-128H213.333333z"
              p-id="3407" fill={isEditingText ? '#1296db' : '#fff'}/>
          </svg>
        </div>
        <div onClick={onAddMosaic} className={classes.btn}>
          <svg t="1620384304329" className="icon" viewBox="0 0 1024 1024" version="1.1"
               xmlns="http://www.w3.org/2000/svg" p-id="1559" width="16" height="16">
            <path d="M512 212h300v300H512zM212 512h300v300H212z" fill="#1296db" p-id="1560"/>
            <path
              d="M812 992H212a180 180 0 0 1-180-180V212a180 180 0 0 1 180-180h600a180 180 0 0 1 180 180v600a180 180 0 0 1-180 180zM212 152a60 60 0 0 0-60 60v600a60 60 0 0 0 60 60h600a60 60 0 0 0 60-60V212a60 60 0 0 0-60-60z"
              fill={isAddingMosaic ? '#1296db' : '#fff'} p-id="1561"/>
          </svg>
        </div>
      </section>
      {
        isEditingRect ?
          <section onClick={handleChangeStyle}>
            {
              [classes.thin, classes.medium, classes.large, classes.r, classes.g, classes.b].map(function (className, index) {
                return <div tabIndex={index}
                            key={index}
                            className={[classes.btn, className, activeIndex === index ? classes.btnActive : null].join(' ')}/>
              })
            }
          </section> : null
      }

    </div>

  )
}
