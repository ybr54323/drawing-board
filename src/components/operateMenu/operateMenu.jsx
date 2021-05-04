import React from "react";
import classes from "./operateMenu.module.css";

export default function OperateMenu(props) {
  const {style} = props;
  const child = props.children.length > 1 ? props.children : [props.children]
  return (
    <section
      className={classes.con}
      style={style}
    >
      {
        child.map(function (child, index) {
          return (
            <div key={index}>{child}</div>
          )
        })
      }

    </section>
  )
}