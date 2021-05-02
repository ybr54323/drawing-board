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

      <button className={classes.button} onClick={handleActiveInput}>
        <svg t="1619934189509" className="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg"
             p-id="1220" width="16" height="16">
          <path
            d="M824.888889 297.528889H551.253333l-113.777777-98.417778H199.111111a56.888889 56.888889 0 0 0-56.888889 56.888889v512a56.888889 56.888889 0 0 0 56.888889 56.888889h625.777778a56.888889 56.888889 0 0 0 56.888889-56.888889V354.417778a56.888889 56.888889 0 0 0-56.888889-56.888889zM416.426667 256L512 341.333333l15.928889 13.653334h296.96v192.284444h-625.777778V256z"
            p-id="1221" fill="#1296db"></path>
        </svg>
        选择文件
      </button>
      <input type="file" className={classes.input} ref={inputRef}
             onChange={handleInputChange}/>
    </div>
  )

}
