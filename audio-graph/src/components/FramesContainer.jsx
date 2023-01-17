import { useState } from "react";

import * as utils from "../utilities";

export const FramesContainer = ({ canDraw, canDelete }) => {
  const [frames, setFrames] = useState([]);
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [startDrawingPosition, setStartDrawingPosition] = useState(null);

  const selectFrame = (id) => {
    const framesCopy = [...frames];
    framesCopy.forEach((frame) => {
      frame.selected = false;
    });
    const toSelect = framesCopy.find((frame) => frame.id === id);
    toSelect.selected = true;
    setFrames(framesCopy);
  };

  const handleWaveFormMouseDown = (e) => {
    if (canDraw) {
      setIsMouseDown(true);
      const waveformCanvas = document.getElementById("waveform");
      setStartDrawingPosition(utils.getMousePosition(e, waveformCanvas));
      const framesCopy = [...frames];
      framesCopy.push({
        start: 0,
        end: 0,
        id: frames.length,
        selected: false,
      });
      setFrames(framesCopy);
    }
  };
  const handleWaveformMousMove = (event) => {
    if (canDraw) {
      if (isMouseDown) {
        const waveformCanvas = document.getElementById("waveform");
        const framesCopy = [...frames];
        const lastFrame = framesCopy[framesCopy.length - 1];
        lastFrame.start = startDrawingPosition;
        lastFrame.end = utils.getMousePosition(event, waveformCanvas);
        setFrames(framesCopy);
      }
    }
  };
  const handleOnMouseUp = (e) => {
    setIsMouseDown(false);
  };

  const deleteFrame = (id) => {
    const framesCopy = [...frames];
    const i = framesCopy.findIndex((frame) => frame.id === id);
    framesCopy.splice(i, 1);
    setFrames(framesCopy);
  };

  return (
    <div
      id="framesContainer"
      className="frames"
      onMouseDown={handleWaveFormMouseDown}
      onMouseMove={handleWaveformMousMove}
      onMouseUp={handleOnMouseUp}
    >
      {frames.map(({ start, end, id, selected }) => {
        return (
          <div
            className={"frame" + (selected ? " selected" : "")}
            onClick={
              canDelete
                ? () => deleteFrame(id)
                : canDraw
                ? () => {}
                : () => selectFrame(id)
            }
            style={
              start === 0 && end === 0 // makes sure we already moved the mouse, not just clicked it. Prevents a glitch.
                ? { display: "none" }
                : end > start
                ? { left: start, width: end - start }
                : { left: end, width: start - end }
            }
          ></div>
        );
      })}
    </div>
  );
};
