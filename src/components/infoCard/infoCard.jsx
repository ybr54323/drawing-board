import React from "react";
import classes from "./infocard.module.css";

export default function InfoCard(props) {
  const {
    position: {x, y, colorArrayData},

  } = props;
  const style = {
    transform: 'translate3d(0,0,0)',
    top: y + 'px',
    left: x + 'px',
  }
  const colorStr = colorArrayData.slice(0, 4).reduce(function (str, num) {
    return str + num.toString(16);
  }, '')

  let colorChunkStyle = {};
  if (colorStr) {
    colorChunkStyle.backgroundColor = `rgba(${colorArrayData})`;
  }
  return (
    <div
      className={classes.infoCardCon}
      style={style}
    >
      {
        colorStr
      }
      <span className={classes.colorChunk}
            style={colorChunkStyle}
      />
    </div>
  )


}
