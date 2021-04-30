import React, {forwardRef} from "react";
import classes from "./canvas.module.css";

export default forwardRef(function Canvas(props, ref) {
  const {onMouseMove} = props;
  const id = 'canvas';


  return (
    <canvas id={id} ref={ref} className={classes.canvas} onMouseMove={onMouseMove}/>

  )
})
