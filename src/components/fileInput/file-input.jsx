import React, {useRef} from "react";
import classes from "./fileinput.module.css";

export default function FileInput(props) {
  const inputRef = useRef({});

  const {handleInputChange} = props;

  function handleActiveInput() {
    inputRef.current.click();
  }

  return (
    <div>
      <button className={classes.button} onClick={handleActiveInput}>选择文件</button>
      <input type="file" className={classes.input} ref={inputRef}
             onChange={handleInputChange}/>
    </div>
  )

}
