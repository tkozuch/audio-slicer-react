export function isTouchDevice() {
  return (
    "ontouchstart" in window ||
    navigator.maxTouchPoints > 0 ||
    navigator.msMaxTouchPoints > 0
  );
}

export function getMousePosition(event, element) {
  return isTouchDevice()
    ? event.touches[0].clientX - element.getBoundingClientRect().left
    : event.clientX - element.getBoundingClientRect().left;
}

export function getMousePositionInPercent(event, element) {
  if (!element) {
    throw new Error("Trying to get mouse position in an undefined element.");
  }
  const px = getMousePosition(event, element);
  return (px / element.getBoundingClientRect().width) * 100;
}

export function timeToPosition(time, container, audioDuration) {
  // return element coordinates at which a given time is
  const width = container.getBoundingClientRect().width;
  return (time / audioDuration) * width;
}

export function timeToPositionPercent(time, audioDuration) {
  return (time / audioDuration) * 100;
}

export function positionToTime(Xcoordinate, containingElement, audioDuration) {
  console.log(
    "x con, el1, duration: ",
    Xcoordinate,
    containingElement,
    audioDuration
  );
  return (
    (Xcoordinate / containingElement.getBoundingClientRect().width) *
    audioDuration
  );
}

export function positionToTimePercent(Xcoordinate, audioDuration) {
  if (!audioDuration) {
    throw new Error(
      "Trying to parse position to time, with unknown or 0 time duration."
    );
  }
  return (Xcoordinate / 100) * audioDuration;
}

const frameToDuration = (frameStart, frameEnd, audioDuration) => {
  console.log(
    "frame start, frameEnd, containerWidth: ",
    frameStart,
    frameEnd,
    audioDuration
  );
  const timeStart = (frameStart / 100) * audioDuration;
  const timeEnd = (frameEnd / 100) * audioDuration;
  console.log("frame to duration", timeStart, timeEnd);
  return [timeStart, timeEnd];
};

export const frameToSample = (frame, sampleRate, bufferDuration) => {
  console.log("frame : ", frame);
  console.log(
    "frame to duration : ",
    frameToDuration(frame.start, frame.end, bufferDuration)
  );
  const [timeStart, timeEnd] = frameToDuration(
    frame.start,
    frame.end,
    bufferDuration
  );
  return [timeStart * sampleRate, timeEnd * sampleRate];
};

export const isWithinFrame = (mousePosition, frames, margin) => {
  if (margin === undefined || margin === null) {
    margin = 0;
  }

  for (let i = 0; i < frames.length; i++) {
    if (
      mousePosition >= frames[i].start - margin &&
      mousePosition <= frames[i].end + margin
    ) {
      return frames[i];
    }
  }
  return false;
};

export const getNearbyFrameSide = (mousePosition, frames, margin) => {
  if (margin === undefined || margin === null) {
    margin = 0;
  }

  const frameCandidates = []; // for the purpose if there are 2 frames nearby, and the mouse position is within margin range for both of them

  for (let i = 0; i < frames.length; i++) {
    if (
      mousePosition >= frames[i].start - margin &&
      mousePosition <= frames[i].start + margin
    ) {
      frameCandidates.push({ frame: frames[i], side: "start" });
    } else if (
      mousePosition >= frames[i].end - margin &&
      mousePosition <= frames[i].end + margin
    ) {
      frameCandidates.push({ frame: frames[i], side: "end" });
    }
  }

  if (frameCandidates.length === 2) {
    // here at most can be 2 frames because only 2 frames can neighbour, considering frames can't overlap each other
    const frameNeighbouringWithStart = frameCandidates.find(
      (f) => f.side === "start"
    );
    const frameNeighbouringWithEnd = frameCandidates.find(
      (f) => f.side === "end"
    );

    if (!(frameNeighbouringWithStart && frameNeighbouringWithEnd)) {
      throw new Error("Both frames are neighbouring with the same side.");
    }

    const startFrame = frameNeighbouringWithStart.frame;
    const endFrame = frameNeighbouringWithEnd.frame;

    return Math.abs(mousePosition - startFrame.start) <=
      Math.abs(mousePosition - endFrame.end)
      ? [startFrame, "start"]
      : [endFrame, "end"];
  } else if (frameCandidates.length === 1) {
    return [frameCandidates[0].frame, frameCandidates[0].side];
  } else {
    return [false, false];
  }
};

export const getFramesOnLeftSide = (frame, frames) => {
  return frames.filter((f) => f.end <= frame.start);
};

export const getFramesOnRightSide = (frame, frames) => {
  return frames.filter((f) => f.start >= frame.end);
};

export function getFramesToRender(renderMode, frames) {
  const audioDuration = 100; // in percent

  if (frames.length === 0) {
    throw new Error(
      "This should not happen. You passed empty frames to render"
    );
  }
  let toRender = [];
  const sortedFrames = frames.sort((a, b) => a.start - b.start);
  console.log("sorted frames", sortedFrames);
  console.log("mode: ", renderMode);

  if (renderMode.keep) {
    console.log("mode keep");
    toRender = toRender.concat(sortedFrames);
  }

  // mode "throw out" (throw out the marked frames)
  else {
    console.log("in else", sortedFrames.length);
    // i <= sortedFrames.length and not i < sF.length -> on purpose, because after
    // last frame there can still be place till the end - a fragment to render.
    for (var i = 0; i <= sortedFrames.length; i++) {
      console.log("in loop frame");
      if (i === 0) {
        let start = 0;
        let end = sortedFrames[i].start;
        console.log(`i = ${i}: `, start, end);
        // first frame didn't start at "start" (0s)
        if (start !== end) {
          toRender.push({
            start,
            end,
          });
        }
      }

      // is not last frame
      else if (i !== sortedFrames.length) {
        let start = sortedFrames[i - 1].end; // end of previous frame
        let end = sortedFrames[i].start;
        // in case two frames are adjacent
        console.log(`i = ${i}: `, start, end);
        if (start !== end) {
          toRender.push({
            start,
            end,
          });
        }
      } else {
        let start = sortedFrames[i - 1].end;
        let end = audioDuration;
        // last frame didn't end at the waveform end
        console.log(`i = ${i}: `, start, end);
        if (start !== end) {
          toRender.push({
            start,
            end,
          });
        }
      }
    }
  }
  console.log("to render ", toRender);
  return toRender;
}
