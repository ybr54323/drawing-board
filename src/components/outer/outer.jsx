import React, {forwardRef} from "react";
import classes from "./outer.module.css";
export default forwardRef(function Outer(props, ref) {
  return (
    <div className={classes.outerCon} ref={ref}>
      ref
    </div>
  )
})
