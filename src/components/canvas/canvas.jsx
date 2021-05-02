import React, {forwardRef, useState} from "react";
import classes from "./canvas.module.css";

export default forwardRef(function Canvas(props, ref) {

  const {
    style,
    onMouseMove,
    onMouseDown,
    onMouseUp
  } = props;
  const id = 'canvas';

  return (
    <canvas id={id} ref={ref} className={classes.canvas}
            onMouseMove={onMouseMove}
            onMouseDown={onMouseDown}
            onMouseUp={onMouseUp}
            style={style}
    />

  )
})
