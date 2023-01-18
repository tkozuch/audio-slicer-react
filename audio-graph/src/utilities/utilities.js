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
