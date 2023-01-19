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

export function timeToPosition(time, container, audioDuration) {
  // return element coordinates at which a given time is
  const width = container.getBoundingClientRect().width;
  return (time / audioDuration) * width;
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
