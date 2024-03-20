import { useRef, useEffect, useState } from "react";
import * as utils from "../utilities/other";

export const PlayBar = ({ time, audioElement, setTime }) => {
  const self = useRef(null);
  const wrapper = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  const displayTime = time?.start ? time?.start.toFixed(2) : 0;

  useEffect(() => {
    let request;
    (function drawMovingPlayBar() {
      if (self.current && audioElement.current) {
        self.current.style.left =
          utils.timeToPositionPercent(
            time.start,
            audioElement.current.duration
          ) + "%";
      }
      if (!audioElement.current.paused) {
        request = requestAnimationFrame(() => {
          drawMovingPlayBar();
        });
      }
    })();

    return () => {
      cancelAnimationFrame(request);
    };
  }, [time, audioElement]);

  const handleTimeIndicatorDrag = (e) => {
    if (isDragging) {
      let mousePosition;
      if (wrapper?.current) {
        mousePosition = utils.getMousePositionInPercent(e, wrapper.current);
      }
      if (audioElement?.current && mousePosition) {
        if (mousePosition < 0) {
          setTime({ ...time, start: 0 });
          return;
        }
        if (mousePosition > 100) {
          mousePosition = 100; // 100% - this will guarantee setting the start time to a maximum - the end of track
        }
        const newStartTime = utils.positionToTimePercent(
          mousePosition,
          audioElement.current.duration
        );
        setTime({ ...time, start: newStartTime });
      }
    }
  };

  return (
    <div className="play-bar" ref={wrapper}>
      <div className="play-bar__bar" ref={self}>
        <div
          className="time-indicator"
          onMouseDown={() => setIsDragging(true)}
          onMouseMove={(e) => handleTimeIndicatorDrag(e)}
          onMouseUp={() => setIsDragging(false)}
        >
          <div className="time-indicator__text">{displayTime}</div>
        </div>
      </div>
    </div>
  );
};
