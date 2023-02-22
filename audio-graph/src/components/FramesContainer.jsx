import { useState, useEffect } from "react";

import * as utils from "../utilities/utilities";

export const FramesContainer = ({
  mode,
  frames,
  setFrames,
  setTime,
  audioElement,
  selfRef,
}) => {
  // console.log("render container start");
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [startDrawingPosition, setStartDrawingPosition] = useState(null);
  const minimalFrameWidth = 1; // in percent
  const [disableClick, setDisableClick] = useState(false);
  const [lastMouseActionTime, setLastMouseActionTime] = useState({
    mouseMove: null,
    mouseDown: null,
  });

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
    console.log("frame selected: ", toSelect);
    setFrames(framesCopy);
    setTime({
      start: utils.positionToTimePercent(
        toSelect.start,
        audioElement?.current?.duration
      ), // toSelect is the currently selected frame
      end: utils.positionToTimePercent(
        toSelect.end,
        audioElement?.current?.duration
      ),
    });
  };

  const deselectAllFrames = (e) => {
    console.log("deselect frames event");
    if (mode !== "delete") {
      const framesCopy = [...frames];
      framesCopy.forEach((f) => (f.selected = false));
      setFrames(framesCopy);
    }
  };

  const handleWaveFormMouseDown = (e) => {
    setDisableClick(false);
    console.log("mouse down event");
    if (mode === "draw") {
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
      setLastMouseActionTime({ ...lastMouseActionTime, mouseDown: Date.now() });
    }
  };
  const handleWaveformMousMove = (event) => {
    console.log("mouse move event");
    if (mode === "draw") {
      // prevent accidentaly drawing a frame while clicking through the container quickly
      const isNotAShortClick =
        lastMouseActionTime.mouseMove - lastMouseActionTime.mouseDown > 100;
      if (isMouseDown && isNotAShortClick) {
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
      setLastMouseActionTime({
        ...lastMouseActionTime,
        mouseMove: Date.now(),
      });
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
    const mousePosition = utils.getMousePositionInPercent(e, selfRef.current);
    const frame = isWithinFrame(mousePosition, frames);
    if (!disableClick && !frame) {
      // if is in frame, then start time will be set in frame click handler
      const time = utils.positionToTimePercent(
        mousePosition,
        audioElement.current.duration
      );
      console.log("setting startTime: ", time);
      setLastMouseActionTime(mousePosition);
      setTime({ start: time, end: audioElement.current.duration });
      audioElement.current.currentTime = time;

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
  // console.log("render container end");
  return (
    <div
      id="framesContainer"
      className="frames"
      onMouseDown={handleWaveFormMouseDown}
      onMouseMove={handleWaveformMousMove}
      onMouseUp={handleOnMouseUp}
      ref={selfRef}
      onClick={handleContainerClick}
      style={{ userSelect: "none" }}
    >
      {frames.map(({ start, end, id, selected }) => {
        return start !== 0 && end !== 0 ? (
          <div
            key={id}
            className={"frame" + (selected ? " selected" : "")}
            onClick={() => {
              console.log("frame clicked, id: ", id);
              mode === "delete" ? deleteFrame(id) : selectFrame(id);
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
