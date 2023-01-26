import { useState, useEffect, useRef } from "react";

import * as utils from "../utilities/utilities";

export const FramesContainer = ({
  canDraw,
  canDelete,
  frames,
  setFrames,
  setStartTime,
  audioElement,
}) => {
  console.log("render start");
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [startDrawingPosition, setStartDrawingPosition] = useState(null);
  const self = useRef(null);
  const minimalFrameWidth = 1; // in percent
  const [disableClick, setDisableClick] = useState(false);

  const deleteFrame = (id) => {
    console.log("delete frame event");
    const framesCopy = [...frames];
    const i = framesCopy.findIndex((frame) => frame.id === id);
    framesCopy.splice(i, 1);
    setFrames(framesCopy);
  };

  const selectFrame = (id) => {
    console.log("select frame event");
    const framesCopy = [...frames];
    const toSelect = framesCopy.find((frame) => frame.id === id);
    toSelect.selected = !toSelect.selected;

    framesCopy.forEach((frame) => {
      if (frame.id !== id) frame.selected = false;
    });

    console.log("frame selected: ", framesCopy);
    setFrames(framesCopy);
  };

  const deselectAllFrames = (e) => {
    console.log("deselect frames event");
    if (!canDelete) {
      const framesCopy = [...frames];
      framesCopy.forEach((f) => (f.selected = false));
      setFrames(framesCopy);
    }
  };

  const handleWaveFormMouseDown = (e) => {
    setDisableClick(false);
    console.log("mouse down event");
    if (canDraw) {
      const waveformCanvas = document.getElementById("waveform");
      const startPosition = utils.getMousePositionInPercent(e, waveformCanvas);
      console.log("start position: ", startPosition);
      // we want to start drawing only if the click happened outside the frame
      if (!isWithinFrame(startPosition, frames)) {
        setIsMouseDown(true);
        setStartDrawingPosition(startPosition);

        const workingFrame = frames.find((f) => f.working);
        if (!workingFrame) {
          const framesCopy = [...frames];
          framesCopy.push({
            start: 0,
            end: 0,
            selected: false,
            id: frames.length,
            working: true,
          });
          setFrames(framesCopy);
        }
      }
    }
  };
  const handleWaveformMousMove = (event) => {
    console.log("mouse move event");
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

        let correctedEndPosition = // correct by max left/right end
          endPosition < maxLeftEnd
            ? maxLeftEnd
            : endPosition > maxRightEnd
            ? maxRightEnd
            : endPosition;
        correctedEndPosition = // correct by minimal width
          Math.abs(correctedEndPosition - startDrawingPosition) >=
          minimalFrameWidth
            ? correctedEndPosition
            : correctedEndPosition > startDrawingPosition
            ? startDrawingPosition + minimalFrameWidth
            : startDrawingPosition - minimalFrameWidth;

        console.log(
          "start drawing pos, corrected end pos: ",
          startDrawingPosition,
          correctedEndPosition
        );

        let framesCopy = [...frames];
        const workingFrame = framesCopy.find((f) => f.working);
        workingFrame.start = Math.min(
          startDrawingPosition,
          correctedEndPosition
        );
        workingFrame.end = Math.max(startDrawingPosition, correctedEndPosition);

        setFrames(framesCopy);
        setDisableClick(true);
      }
    }
  };
  const handleOnMouseUp = (e) => {
    console.log("mouse up event");
    setIsMouseDown(false);
    let framesCopy = [...frames];
    const workingFrame = framesCopy.find((f) => f.working);
    if (workingFrame) {
      workingFrame.working = false;
      setFrames(framesCopy);
    }
    (function deleteAllTooShortFrames() {
      // cleaning
      framesCopy = framesCopy.filter(
        (f) => f.end - f.start >= minimalFrameWidth
      );
      setFrames(framesCopy);
    })();
  };
  const handleContainerClick = (e) => {
    console.log("click event");

    if (!disableClick) {
      const mousePosition = utils.getMousePositionInPercent(e, self.current);
      setStartTime(
        utils.positionToTimePercent(
          mousePosition,
          audioElement.current.duration
        )
      );
      const frame = isWithinFrame(mousePosition, frames);
      if (!frame) {
        deselectAllFrames();
      }
    }
  };

  useEffect(() => {
    console.log("delete frame useeffect");
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
  console.log("render end");
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
        return start !== 0 && end !== 0 ? (
          <div
            key={id}
            className={"frame" + (selected ? " selected" : "")}
            onClick={() => {
              console.log("frame clicked, id: ", id);
              selectFrame(id);
            }}
            style={{ left: start + "%", width: end - start + "%" }}
          ></div>
        ) : (
          ""
        );
      })}
    </div>
  );
};

const isWithinFrame = (position, frames) => {
  for (let i = 0; i < frames.length; i++) {
    if (
      (position >= frames[i].start && position <= frames[i].end) ||
      (position <= frames[i].start && position >= frames[i].end)
    ) {
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
