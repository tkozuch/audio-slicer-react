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
  // console.log("current mouse position : ", mousePosition);
  // console.log("frames : ", frames);
  for (let i = 0; i < frames.length; i++) {
    if (
      mousePosition >= frames[i].start - margin &&
      mousePosition <= frames[i].start + margin
    ) {
      return [frames[i], "start"];
    } else if (
      mousePosition >= frames[i].end - margin &&
      mousePosition <= frames[i].end + margin
    ) {
      return [frames[i], "end"];
    }
  }
  return [false, false];
};
