import "./App.css";

import Container from "react-bootstrap/Container";
import { ReactComponent as InfoSvg } from "./img/info.svg";
import { ReactComponent as PlaySvg } from "./img/play.svg";
import { ReactComponent as StopSvg } from "./img/stop.svg";
import { ReactComponent as UndoSvg } from "./img/undo.svg";
import { ReactComponent as SliceSvg } from "./img/slice.svg";
import { ReactComponent as PauseSvg } from "./img/pause.svg";
import { ReactComponent as ChooseFileSvg } from "./img/choose_file.svg";

import { useEffect, useState, useRef, useCallback } from "react";

import { FramesContainer } from "./components/FramesContainer";
import { drawAudio } from "./utilities/waveform";
import { positionToTimePercent, frameToSample } from "./utilities/utilities";
import { PlayBar } from "./components/PlayBar";
import { createAudioBlobForDownload } from "./utilities/audioDownload";
import { getFramesToRender } from "./utilities/utilities";
import {
  PopUpTemplate,
  ShortcutsPopUp,
  DownloadLinksPopUp,
  LoadingPopUp,
} from "./components/PopUps";

window.AudioContext = window.AudioContext || window.webkitAudioContext;

const audioContext = new AudioContext();

function App() {
  console.log("render start");
  const modes = ["draw", "adjust", "delete"];

  const [frames, setFrames] = useState([]);
  const [mode, setMode] = useState(modes[0]);
  console.log("render start: ", mode);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioElement = useRef(null);
  const [audioSource, setAudioSource] = useState(null);
  const waveformRef = useRef(null);
  const [time, setTime] = useState({
    start: 0,
    end: audioElement?.current?.duration,
  });
  const [filename, setFilename] = useState();
  const fileWasChosen = Boolean(filename);
  const [audioBuffer, setAudioBuffer] = useState();
  const framesContainerRef = useRef();
  const selectedFrame = frames.find((f) => f.selected);
  const [links, setLinks] = useState([]);
  const [renderMode, setRenderMode] = useState({
    keep: true, // means the frames are to keep, if set to false, the frames are the part to delete and all the rest should be rendered
    concatenate: false, // means every frame will be in separate file
  });
  const [popUpsOpen, setPopUpsOpen] = useState({
    shortcuts: false,
    links: false,
    loading: false,
  });
  const popUpIsOpen = Object.values(popUpsOpen).some((v) => v);

  const prepareDownloadLinks = useCallback(
    function prepareDownloadLinks() {
      console.log("prepare download links");
      if (frames.length > 0) {
        const framesToRender = getFramesToRender(renderMode, frames);
        console.log("frames to render, ", framesToRender);
        const framesToRenderInSamples = framesToRender.map((frame) => {
          const [sampleStart, sampleEnd] = frameToSample(
            frame,
            audioBuffer.sampleRate,
            audioBuffer.duration
          );
          return {
            start: sampleStart,
            end: sampleEnd,
          };
        });
        console.log("in samples: ", framesToRenderInSamples);

        let framesChannelData = framesToRenderInSamples.map((frame) => {
          const [leftData, rightData] = [
            audioBuffer.getChannelData(0).slice(frame.start, frame.end),
            audioBuffer.getChannelData(1).slice(frame.start, frame.end),
          ];
          return {
            leftChannel: leftData,
            rightChannel: rightData,
          };
        });
        console.log("frames channel data, ", framesChannelData);

        if (renderMode.concatenate) {
          framesChannelData = framesChannelData.reduce(
            (prevVal, currentValue) => {
              console.log("prev value: ", prevVal);
              console.log("current val: ", currentValue);
              const leftChannel = new Float32Array([
                ...prevVal.leftChannel,
                ...currentValue.leftChannel,
              ]);
              const rightChannel = new Float32Array([
                ...prevVal.rightChannel,
                ...currentValue.rightChannel,
              ]);
              const framesData = {
                leftChannel,
                rightChannel,
              };
              console.log("frames data: ", framesData);

              return framesData;
            },

            {
              leftChannel: [],
              rightChannel: [],
            }
          );
          framesChannelData = [framesChannelData];
        }
        console.log("framesChannelData", framesChannelData);

        const dataToDownload = framesChannelData.map((frame) => {
          return createAudioBlobForDownload(
            frame.leftChannel,
            frame.rightChannel
          );
        });
        const links = [];
        let [name, extension] = filename.split(".");
        dataToDownload.forEach((data) => {
          const link = {
            href: URL.createObjectURL(data),
            name: name,
            extension: extension,
          };
          links.push(link);
        });
        setLinks(links);
        setPopUpsOpen((popups) => ({ ...popups, links: true }));
      } else {
        alert(
          "No clips drawn. Plis draw a clip that you want to slice - click and drag with cursor on the waveform, after selecting file."
        );
      }
    },
    [frames, audioBuffer, setLinks, filename, renderMode]
  );

  useEffect(() => {
    let playInterval;
    if (isPlaying) {
      console.log("is playing");
      playInterval = setInterval(() => {
        // console.log("interval set");
        setTime({ ...time, start: audioElement.current.currentTime });
        // console.log("start time: ", audioElement.current.currentTime);
        console.log("(play interval), time.end: ", time.end);
        if (audioElement.current.currentTime >= time.end) {
          console.log("time passed");
          audioElement.current.pause();
          setIsPlaying(false);
          selectedFrame
            ? setTime({
                ...time,
                start: positionToTimePercent(
                  Math.min(selectedFrame.start, selectedFrame.end),
                  audioElement.current.duration
                ),
              })
            : setTime({ ...time, start: 0 });
        }
      }, 10);
    }

    return () => {
      // console.log("interval UNset. ", time);
      clearInterval(playInterval);
    };
  }, [isPlaying, selectedFrame, time, time.end, setTime]);

  useEffect(() => {
    const frames = document.getElementsByClassName("frame");
    const cursor = mode === "delete" ? "no-drop" : "default";

    if (frames.length) {
      new Array(...frames).forEach((frame) => (frame.style.cursor = cursor));
    }
  }, [mode]);

  const initializeAudio = (event) => {
    var files = event.target.files;
    setAudioSource(URL.createObjectURL(files[0]));
  };
  useEffect(() => {
    const current = audioElement.current;
    const handleDurationChange = () => {
      console.log("setting end time to duration");
      setTime({ start: 0, end: current.duration });
      setFrames([]);
    };
    if (current) {
      current.addEventListener("durationchange", handleDurationChange);
    }
    return () => {
      current.removeEventListener("durationchange", handleDurationChange);
    };
  }, [audioSource, setTime]);
  const play = useCallback(
    (e) => {
      audioElement.current.currentTime = time.start;
      audioElement.current.play();
      setIsPlaying(true);
    },
    [time.start]
  );
  const pause = (e) => {
    setIsPlaying(false);
    document.getElementById("audio").pause();
  };

  useEffect(() => {
    const playWithSpace = (e) => {
      if (e.key === " ") {
        if (isPlaying) {
          pause();
        } else {
          play();
        }
      }
    };
    document.addEventListener("keydown", playWithSpace);
    return () => {
      document.removeEventListener("keydown", playWithSpace);
    };
  }, [isPlaying, time.start]);

  useEffect(() => {
    const changeMode = (e) => {
      if (e.key === "Control") {
        const currentMode = modes.findIndex((m) => m === mode);
        if (currentMode > -1) {
          setMode(modes[(currentMode + 1) % modes.length]); // change mode to next
        } else {
          throw new Error("Unknown mode");
        }
      }
    };
    document.addEventListener("keydown", changeMode);
    return () => {
      document.removeEventListener("keydown", changeMode);
    };
  });

  const stop = (e) => {
    setIsPlaying(false);
    if (audioElement.current.currentTime) audioElement.current.currentTime = 0;
    setTime({ ...time, start: 0 });
  };
  const undoLastFrame = () => {
    const framesCopy = [...frames];
    framesCopy.pop();
    setFrames(framesCopy);
  };
  const handleKeepThrowOutSelect = (e) => {
    const value = e.target.value;
    if (value === "keep") {
      setRenderMode({ ...renderMode, keep: true });
    } else if (value === "delete") {
      setRenderMode({ ...renderMode, keep: false });
    } else {
      throw new Error("this should not happen");
    }
  };
  const handleSingleMultipleSelect = (e) => {
    const value = e.target.value;
    if (value === "single") {
      setRenderMode({ ...renderMode, concatenate: true });
    } else if (value === "multiple") {
      setRenderMode({ ...renderMode, concatenate: false });
    } else {
      throw new Error("this should not happen");
    }
  };
  const handleFileChange = (event) => {
    setPopUpsOpen((p) => ({ ...p, loading: true }));
    const promise = new Promise((resolve, reject) => {
      initializeAudio(event);
      drawAudio(event, audioContext, setAudioBuffer, resolve);
    });
    promise.then((v) => {
      setFilename(event.target.files[0].name);
      setPopUpsOpen((p) => ({ ...p, loading: false }));
    });
  };

  // console.log("render end");
  return (
    <div className="App">
      {popUpIsOpen && (
        <div className="overlay">
          <PopUpTemplate>
            {(popUpsOpen.links && (
              <DownloadLinksPopUp
                links={links}
                setPopUpsOpen={setPopUpsOpen}
              ></DownloadLinksPopUp>
            )) ||
              (popUpsOpen.shortcuts && (
                <ShortcutsPopUp setPopUpsOpen={setPopUpsOpen}></ShortcutsPopUp>
              )) ||
              (popUpsOpen.loading && (
                <LoadingPopUp setPopUpsOpen={setPopUpsOpen}></LoadingPopUp>
              ))}
          </PopUpTemplate>
        </div>
      )}
      <audio id="audio" controls ref={audioElement} src={audioSource}></audio>

      <Container className="main">
        <div className="upper-row">
          <label className="file-label">
            <input type="file" id="upload" onChange={handleFileChange} />
            <div className="button button-important">Choose file</div>
            {filename && <span className="file-name">{filename}</span>}
          </label>

          <div className="mode-btn-wrapper">
            <button
              id="mark-btn"
              onClick={() => {
                setMode("draw");
              }}
              className={
                "button mode-btn" + (mode === "draw" ? " selected" : "")
              }
            >
              Mark
            </button>
            {/* Show only when the mark or adjust are not selected */}
            <div
              className="mode-btn__divider"
              style={{ visibility: mode !== "delete" ? "hidden" : "visible" }}
            />
            <button
              id="adjust-btn"
              onClick={() => {
                setMode("adjust");
              }}
              className={
                "button mode-btn" + (mode === "adjust" ? " selected" : "")
              }
            >
              Adjust
            </button>
            {/* Show only when the delete or adjust are not selected */}
            <div
              className="mode-btn__divider"
              style={{ visibility: mode !== "draw" ? "hidden" : "visible" }}
            />
            <button
              id="delete-btn"
              onClick={() => {
                setMode("delete");
              }}
              className={
                "button mode-btn" + (mode === "delete" ? " selected" : "")
              }
            >
              Delete
            </button>
          </div>
          <button
            className="info-btn"
            onClick={() => setPopUpsOpen((s) => ({ ...s, shortcuts: true }))}
          >
            <InfoSvg />
          </button>
        </div>

        <div className="canvasWrapper">
          <canvas
            id="waveform"
            width="1000"
            height="200"
            ref={waveformRef}
          ></canvas>
          <FramesContainer
            mode={mode}
            frames={frames}
            setFrames={setFrames}
            setTime={setTime}
            audioElement={audioElement}
            selfRef={framesContainerRef}
            renderMode={renderMode}
          ></FramesContainer>
          {!fileWasChosen && (
            <label className="file-label choose-file-prompt">
              <input
                type="file"
                id="upload"
                className="large-file-input"
                onChange={handleFileChange}
              />
              Choose file
              <ChooseFileSvg />
            </label>
          )}
        </div>

        {/* currentTime is set to StartTime, because the StartTime updates to audio element current time when playing */}
        <PlayBar
          audioElement={audioElement}
          time={time}
          setTime={setTime}
        ></PlayBar>

        <div className="down-buttons-wrapper">
          {!isPlaying ? (
            <button
              sm="2"
              id="playBtn"
              className="button icon-btn"
              onClick={(e) => {
                e.target.blur();
                play();
              }}
            >
              <PlaySvg />
            </button>
          ) : (
            <button
              sm="2"
              id="pauseBtn"
              className="button icon-btn"
              onClick={(e) => {
                e.target.blur();
                pause();
              }}
            >
              <PauseSvg />
            </button>
          )}
          <button
            id="stopBtn"
            className="button icon-btn"
            onClick={() => {
              stop();
            }}
          >
            <StopSvg />
          </button>
          <button
            id="undo-btn"
            onClick={() => undoLastFrame()}
            className="button icon-btn"
          >
            <UndoSvg />
          </button>

          <div className="options-wrapper">
            <label htmlFor="time-mode">Time mode: </label>
            <select
              id="time-mode"
              className="options-select"
              onClick={handleKeepThrowOutSelect}
              defaultValue={renderMode.keep ? "keep" : "delete"}
            >
              <option value="keep">Keep selected time</option>
              <option value="delete">Throw out selected time</option>
            </select>
          </div>
          <div className="options-wrapper">
            <label htmlFor="render-mode">Render mode: </label>
            <select
              id="render-mode"
              className="options-select"
              onClick={handleSingleMultipleSelect}
              defaultValue={!renderMode.concatenate ? "multiple" : "single"}
            >
              <option value="single">Render to single file</option>
              <option value="multiple">Render multiple files</option>
              Render to single file
            </select>
          </div>
          <button
            className="button button-important slice-btn"
            onClick={() =>
              prepareDownloadLinks(
                frames,
                audioBuffer,
                filename,
                framesContainerRef?.current?.getBoundingClientRect().width,
                setLinks
              )
            }
          >
            SLICE <SliceSvg />
          </button>
        </div>
      </Container>
    </div>
  );
}

export default App;
