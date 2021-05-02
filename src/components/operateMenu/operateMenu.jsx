import React from "react";
import classes from "./operateMenu.module.css";

export function OperateMenu(props) {
  const {style} = props;
  const child = props.children.length > 1 ? props.children : [props.children]
  return (
    <section
      className={classes.con}
      style={style}
    >
      <ul>
        {
          child.map(function (child, index) {
            return (
              <div key={index}>{child}</div>
            )
          })
        }
      </ul>

    </section>
  )
}