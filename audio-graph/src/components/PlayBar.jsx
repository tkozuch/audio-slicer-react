import { useRef, useEffect } from "react";
import * as utils from "../utilities/utilities";

export const PlayBar = ({ currentTime, audioElement }) => {
  const self = useRef(null);

  const displayTime = currentTime ? currentTime.toFixed(2) : 0;

  useEffect(() => {
    let request;
    console.log("current time", currentTime);
    (function drawMovingPlayBar() {
      if (self.current && audioElement.current) {
        self.current.style.left =
          utils.timeToPositionPercent(
            currentTime,
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
  }, [currentTime, audioElement]);

  return (
    <div className="play-bar">
      <div className="play-bar__bar" ref={self}>
        <div className="time-indicator">{displayTime}</div>
      </div>
    </div>
  );
};
