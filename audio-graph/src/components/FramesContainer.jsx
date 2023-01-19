import { useState, useEffect, useRef } from "react";

import * as utils from "../utilities/utilities";

export const FramesContainer = ({ canDraw, canDelete, frames, setFrames }) => {
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [startDrawingPosition, setStartDrawingPosition] = useState(null);
  const self = useRef(null);

  const deleteFrame = (id) => {
    const framesCopy = [...frames];
    const i = framesCopy.findIndex((frame) => frame.id === id);
    framesCopy.splice(i, 1);
    setFrames(framesCopy);
  };

  const selectFrame = (id) => {
    const framesCopy = [...frames];
    const toSelect = framesCopy.find((frame) => frame.id === id);
    toSelect.selected = !toSelect.selected;

    framesCopy.forEach((frame) => {
      if (frame.id !== id) frame.selected = false;
    });

    setFrames(framesCopy);
  };

  const deselectAllFrames = (e) => {
    if (!canDelete) {
      const framesCopy = [...frames];
      framesCopy.forEach((f) => (f.selected = false));
      setFrames(framesCopy);
    }
  };

  const handleWaveFormMouseDown = (e) => {
    if (canDraw) {
      const waveformCanvas = document.getElementById("waveform");
      const startPosition = utils.getMousePositionInPercent(e, waveformCanvas);
      console.log("start position: ", startPosition);
      // we want to start drawing only if the click happened outside the frame
      if (!isWithinFrame(startPosition, frames)) {
        setIsMouseDown(true);
        setStartDrawingPosition(startPosition);
        const framesCopy = [...frames];
        framesCopy.push({
          start: 0,
          end: 0,
          id: frames.length,
          selected: false,
        });
        setFrames(framesCopy);
      }
    }
  };
  const handleWaveformMousMove = (event) => {
    if (canDraw) {
      if (isMouseDown) {
        const [maxLeftEnd, maxRightEnd] = getMaximalEndingPosition(
          startDrawingPosition,
          // only take the frames without the one being drawn now. (last one)
          frames.filter((f) => f.id !== frames[frames.length - 1].id)
        );

        const waveformCanvas = document.getElementById("waveform");
        const endPosition = utils.getMousePositionInPercent(
          event,
          waveformCanvas
        );
        const correctedEndPosition =
          endPosition < maxLeftEnd
            ? maxLeftEnd
            : endPosition > maxRightEnd
            ? maxRightEnd
            : endPosition;

        const framesCopy = [...frames];
        const lastFrame = framesCopy[framesCopy.length - 1];
        lastFrame.start = startDrawingPosition;
        lastFrame.end = correctedEndPosition;
        if (lastFrame.start) setFrames(framesCopy);
      }
    }
  };
  const handleOnMouseUp = (e) => {
    setIsMouseDown(false);
  };
  const handleContainerClick = (e) => {
    const frame = isWithinFrame(
      utils.getMousePositionInPercent(e, self.current),
      frames
    );
    if (frame) {
      selectFrame(frame.id);
    } else {
      deselectAllFrames();
    }
  };

  useEffect(() => {
    const removeSelectedFrame = (e) => {
      if (e.key === "Delete") {
        const selectedFrame = frames.find((f) => f.selected);
        if (selectedFrame) deleteFrame(selectedFrame.id);
      }
    };
    document.addEventListener("keydown", removeSelectedFrame);
    return () => {
      document.removeEventListener("keydown", removeSelectedFrame);
    };
  }, [frames]);

  return (
    <div
      id="framesContainer"
      className="frames"
      onMouseDown={handleWaveFormMouseDown}
      onMouseMove={handleWaveformMousMove}
      onMouseUp={handleOnMouseUp}
      ref={self}
      onClick={handleContainerClick}
    >
      {frames.map(({ start, end, id, selected }) => {
        return (
          <div
            key={id}
            className={"frame" + (selected ? " selected" : "")}
            style={
              start === 0 && end === 0 // makes sure we already moved the mouse, not just clicked it. Prevents a glitch.
                ? { display: "none" }
                : end > start
                ? { left: start + "%", width: end - start + "%" }
                : { left: end + "%", width: start - end + "%" }
            }
          ></div>
        );
      })}
    </div>
  );
};

const isWithinFrame = (position, frames) => {
  for (let i = 0; i < frames.length; i++) {
    if (position >= frames[i].start && position <= frames[i].end) {
      return frames[i];
    }
  }
  return false;
};

// given a frame start point, get maximal position on where the end of the frame can lay
// so that it doesn't overlap any of the already drawn frames
const getMaximalEndingPosition = (start, frames) => {
  // frame edges are basically either "starts" or "ends" of each frame on the
  // left/right of start. This is because we can't be sure whether the start or
  // end of each frame is on the right/left -> thus we don't mind the start or
  // ends and we just take all the "lines" (frame edges) that are on either left
  // or right of the start point.
  let framesEdgesOnTheLeft = [];
  let framesEdgesOnTheRight = [];

  frames.forEach((f) => {
    if (f.start > start) framesEdgesOnTheRight.push(f.start);
    if (f.end > start) framesEdgesOnTheRight.push(f.end);
    if (f.start < start) framesEdgesOnTheLeft.push(f.start);
    if (f.end < start) framesEdgesOnTheLeft.push(f.end);
  });

  const leftMax = Math.max(...framesEdgesOnTheLeft);
  const rightMax = Math.min(...framesEdgesOnTheRight);

  return [leftMax, rightMax];
};
