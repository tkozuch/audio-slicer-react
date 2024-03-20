import { useEffect, useState } from "react";

import { ReactComponent as DownloadSvg } from "../img/download.svg";
import { ReactComponent as KeyboardSvg } from "../img/keyboard.svg";
import { ReactComponent as InfoSvg } from "../img/info.svg";

export const PopUpTemplate = ({ children }) => {
  return <div className="pop-up">{children}</div>;
};

export function DownloadLinksPopUp({ links, setPopUpsOpen }) {
  return (
    <div className="pop-up__download-links" id="download-links">
      <div className="title">
        <DownloadSvg />
        Download links:
      </div>
      <div className="body">
        <ul>
          {links.map((link, index) => {
            return (
              <li key={index}>
                <a
                  className="pop-up__download-links__link"
                  href={link.href}
                  download={`${link.name}__slice-${index}.wav`}
                >
                  {`${link.name}__slice-${index}.${link.extension}`}
                </a>
              </li>
            );
          })}
        </ul>
      </div>
      <div
        className="button pop-up__close-btn"
        onClick={() => setPopUpsOpen((p) => ({ ...p, links: false }))}
      >
        Close
      </div>
    </div>
  );
}

export function ShortcutsPopUp({ setPopUpsOpen }) {
  return (
    <div className="pop-up__shortcuts">
      <div className="title">
        <KeyboardSvg />
        Shortcuts:
      </div>
      <div className="body">
        <div className="shortcut">
          <span>SPACE</span>
          <span>CTRL / Command</span>
          <span>Delete</span>
          <span>Backspace</span>
          <span>Esc</span>
        </div>
        <div className="description">
          <span>play / pause</span>
          <span>change edit mode</span>
          <span>delete selected frame</span>
          <span>undo</span>
          <span>stop</span>
        </div>
      </div>
      <div
        className="button pop-up__close-btn"
        onClick={() => setPopUpsOpen((p) => ({ ...p, shortcuts: false }))}
      >
        Close
      </div>
    </div>
  );
}

export function LoadingPopUp({ setPopUpsOpen }) {
  const [time, setTime] = useState(0);
  const [infoOpen, setinfoOpen] = useState(false);

  useEffect(() => {
    let interval;

    interval = setInterval(() => {
      setTime(time + 1);
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  });

  useEffect(() => {
    if (time > 2) {
      setinfoOpen(true);
    }
  }, [time]);

  return (
    <div className="pop-up__loading">
      <div className="title">loading ...</div>
      <div className="body">{time} s</div>
      <div className="footer">
        <InfoSvg onClick={() => setinfoOpen(!infoOpen)} />

        <div className={"info-text" + (infoOpen ? "" : " non-visible")}>
          Approximate loading time is around 5 seconds for a 30min file.
        </div>

        <div
          className="button pop-up__close-btn"
          onClick={() => setPopUpsOpen((p) => ({ ...p, loading: false }))}
        >
          Cancel
        </div>
      </div>
    </div>
  );
}
