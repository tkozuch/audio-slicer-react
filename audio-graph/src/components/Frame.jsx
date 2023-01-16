import { useState } from "react";

export const Frame = ({ start, end }) => {
  const [isSelected, setIsSelected] = useState(false);

  return (
    <div
      className={"frame" + (isSelected ? " selected" : "")}
      onClick={() => {
        setIsSelected(!isSelected);
      }}
      style={
        start !== 0 && end !== 0 // makes sure we already moved the mouse, not just clicked it. Prevents a glitch.
          ? end > start
            ? { left: start, width: end - start }
            : { left: end, width: start - end }
          : { display: "none" }
      }
    ></div>
  );
};
