import { useState } from "react";

import * as utils from "../utilities";
import { Frame } from "./Frame";

export const FramesContainer = () => {
  const [frames, setFrames] = useState([]);
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [startDrawingPosition, setStartDrawingPosition] = useState(null);

  const handleWaveFormMouseDown = (e) => {
    setIsMouseDown(true);
    const waveformCanvas = document.getElementById("waveform");
    setStartDrawingPosition(utils.getMousePosition(e, waveformCanvas));
    const framesCopy = [...frames];
    framesCopy.push({
      start: 0,
      end: 0,
      id: frames.length,
    });
    setFrames(framesCopy);
  };
  const handleWaveformMousMove = (event) => {
    if (isMouseDown) {
      const waveformCanvas = document.getElementById("waveform");
      const framesCopy = [...frames];
      const lastFrame = framesCopy[framesCopy.length - 1];
      lastFrame.start = startDrawingPosition;
      lastFrame.end = utils.getMousePosition(event, waveformCanvas);
      setFrames(framesCopy);
    }
  };
  const handleOnMouseUp = (e) => {
    setIsMouseDown(false);
  };

  return (
    <div
      className="frames"
      onMouseDown={handleWaveFormMouseDown}
      onMouseMove={handleWaveformMousMove}
      onMouseUp={handleOnMouseUp}
    >
      {frames.map(({ start, end, id }) => {
        return <Frame key={id} start={start} end={end} id={id}></Frame>;
      })}
    </div>
  );
};
