import React from "react";
import "../style/index.scss";
import "./helper.js";

function VideoContainer() {
  return (
    <>
      <div className="container">
        <video className="input_video"></video>
        <canvas
          className="output_canvas"
          width="1280px"
          height="720px"
        ></canvas>
        <div className="landmark-grid-container"></div>
      </div>
    </>
  );
}

export default VideoContainer;
