import "./App.css";
import Container from "react-bootstrap/Container";

import { useEffect, useState, useRef, useCallback } from "react";

import { FramesContainer } from "./components/FramesContainer";
import { drawAudio } from "./utilities/drawWaveform";
import { positionToTimePercent, frameToSample } from "./utilities/utilities";
import { PlayBar } from "./components/PlayBar";
import { DownloadLinks } from "./components/DownloadLinks";
import { usePrevious } from "./utilities/hooks";
import { createAudioBlobForDownload } from "./utilities/prepareAudioForDownload";

window.AudioContext = window.AudioContext || window.webkitAudioContext;

const audioContext = new AudioContext();

function useStartTimeEndTime(frames, audioElement) {
  const [endTime, setEndTime] = useState(null);
  const [startTime, setStartTime] = useState(null);

  const selectedFrame = frames.length ? frames.find((f) => f.selected) : null;
  const previousFrames = usePrevious(selectedFrame);
  const selectedFrameChanged = previousFrames?.id !== selectedFrame?.id;

  useEffect(() => {
    // This condition prevents from PlayBar position (setStartTime(0)) going back to beginning when we are clicking through container, before going to the actual position. This is because we are setting frames to framesCopy on mouseDown in FramesContainer and thus the selectedFrame object changes even though it is "the same" (with the same id) object (is just because of objects comoparison - {} !== {})
    if (selectedFrameChanged) {
      setEndTime(
        selectedFrame
          ? positionToTimePercent(
              Math.max(selectedFrame.start, selectedFrame.end),
              audioElement.duration
            )
          : audioElement
          ? audioElement.duration
          : undefined
      );
      setStartTime(
        selectedFrame
          ? positionToTimePercent(
              Math.min(selectedFrame.start, selectedFrame.end),
              audioElement.duration
            )
          : audioElement
          ? 0
          : undefined
      );
    }
  }, [selectedFrame, audioElement, selectedFrameChanged]);

  return [startTime, setStartTime, endTime, setEndTime];
}

function App() {
  // console.log("render start");
  const [frames, setFrames] = useState([]);
  const [framesContainerState, setFramesContainerState] = useState({
    canDraw: true,
    canDelete: false,
  });
  const [isPlaying, setIsPlaying] = useState(false);
  const audioElement = useRef(null);
  const [audioSource, setAudioSource] = useState(null);
  const waveformRef = useRef(null);
  const [startTime, setStartTime, endTime, setEndTime] = useStartTimeEndTime(
    frames,
    audioElement.current
  );
  const [filename, setFilename] = useState();
  const [audioBuffer, setAudioBuffer] = useState();
  const framesContainerRef = useRef();
  const selectedFrame = frames.find((f) => f.selected);
  const [links, setLinks] = useState([]);
  const [mode, setMode] = useState({
    keep: true, // means the frames are to keep, if set to false, the frames are the part to delete
    concatenate: false, // means every frame will be in separate file
  });
  // const play = useCallback(
  //   (e) => {
  //     // if (startTime && endTime) {
  //     audioElement.current.currentTime = startTime;
  //     audioElement.current.play();
  //     setIsPlaying(true);
  //     // }
  //   },
  //   [setIsPlaying, startTime]
  // );
  // const pause = useCallback((e) => {
  //   setIsPlaying(false);
  //   audioElement.current.pause();
  // }, []);

  const prepareDownloadLinks = useCallback(
    function prepareDownloadLinks() {
      console.log("prepare download links");
      if (frames.length > 0) {
        const framesToRender = getFramesToRender(mode, frames);
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

        if (mode.concatenate) {
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
      } else {
        alert(
          "No clips drawn. Plis draw a clip that you want to slice - click and drag with cursor on the waveform, after selecting file."
        );
      }
    },
    [frames, audioBuffer, setLinks, filename, mode]
  );

  useEffect(() => {
    let playInterval;
    if (isPlaying) {
      console.log("is playing");
      playInterval = setInterval(() => {
        console.log("interval set");
        setStartTime(audioElement.current.currentTime);
        console.log();
        if (audioElement.current.currentTime >= endTime) {
          console.log("time passed");
          audioElement.current.pause();
          setIsPlaying(false);
          selectedFrame
            ? setStartTime(
                positionToTimePercent(
                  Math.min(selectedFrame.start, selectedFrame.end),
                  audioElement.current.duration
                )
              )
            : setStartTime(0);
        }
      }, 10);
    }

    return () => {
      console.log("interval UNset. ", startTime, endTime);
      clearInterval(playInterval);
    };
  }, [isPlaying, endTime, selectedFrame, setStartTime, startTime]);

  useEffect(() => {
    const frames = document.getElementsByClassName("frame");
    const cursor = framesContainerState.canDelete ? "no-drop" : "unset";

    if (frames.length) {
      new Array(...frames).forEach((frame) => (frame.style.cursor = cursor));
    }
  }, [framesContainerState]);

  const initializeAudioElement = (event) => {
    console.log("initializing audio element");
    var files = event.target.files;
    setAudioSource(URL.createObjectURL(files[0]));
    console.log("audioSource set");
  };
  useEffect(() => {
    const current = audioElement.current;
    const handleDurationChange = () => {
      setStartTime(0);
      setEndTime(current.duration);
      setFrames([]);
    };
    if (current) {
      current.addEventListener("durationchange", handleDurationChange);
    }
    return () => {
      current.removeEventListener("durationchange", handleDurationChange);
    };
  }, [audioSource, setStartTime, setEndTime]);
  const play = (e) => {
    // if (startTime && endTime) {
    audioElement.current.currentTime = startTime;
    audioElement.current.play();
    setIsPlaying(true);
    // }
  };
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
  }, [isPlaying]);
  const stop = (e) => {
    setIsPlaying(false);
    if (audioElement.current.currentTime) audioElement.current.currentTime = 0;
    setStartTime(0);
  };
  const undoLastFrame = () => {
    const framesCopy = [...frames];
    framesCopy.pop();
    setFrames(framesCopy);
  };
  const handleKeepThrowOutSelect = (e) => {
    const value = e.target.value;
    if (value === "keep") {
      setMode({ ...mode, keep: true });
    } else if (value === "delete") {
      setMode({ ...mode, keep: false });
    } else {
      throw new Error("this should not happen");
    }
  };
  const handleSingleMultipleSelect = (e) => {
    const value = e.target.value;
    if (value === "single") {
      setMode({ ...mode, concatenate: true });
    } else if (value === "multiple") {
      setMode({ ...mode, concatenate: false });
    } else {
      throw new Error("this should not happen");
    }
  };

  // console.log("render end");
  return (
    <div className="App">
      <audio id="audio" controls ref={audioElement} src={audioSource}></audio>
      <Container className="main">
        <div className="upper-row">
          <input
            type="file"
            id="upload"
            onChange={(event) => {
              initializeAudioElement(event);
              drawAudio(event, audioContext, setAudioBuffer);
              setFilename(event.target.files[0].name);
            }}
          />

          <button
            id="mark-btn"
            onClick={() => {
              setFramesContainerState({
                ...framesContainerState,
                canDraw: !framesContainerState.canDraw,
              });
            }}
            className={
              framesContainerState.canDraw
                ? "btn btn-primary"
                : "btn btn-secondary"
            }
          >
            Mark
          </button>

          <button
            id="delete-btn"
            onClick={() => {
              setFramesContainerState({
                ...framesContainerState,
                canDelete: !framesContainerState.canDelete,
              });
            }}
            className={
              framesContainerState.canDelete
                ? "btn btn-primary"
                : "btn btn-secondary"
            }
          >
            Delete
          </button>

          <button
            id="undo-btn"
            onClick={() => undoLastFrame()}
            className="btn btn-warning"
          >
            Undo
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
            {...framesContainerState}
            frames={frames}
            setFrames={setFrames}
            setStartTime={setStartTime}
            audioElement={audioElement}
            selfRef={framesContainerRef}
          ></FramesContainer>
        </div>

        {/* currentTime is set to StartTime, because the StartTime updates to audio element current time when playing */}
        <PlayBar audioElement={audioElement} currentTime={startTime}></PlayBar>

        <div className="down-buttons-wrapper">
          {!isPlaying ? (
            <button
              sm="2"
              id="playBtn"
              className="btn btn-success play-btn"
              onClick={(e) => {
                e.target.blur();
                play();
              }}
            >
              PLAY
            </button>
          ) : (
            <button
              sm="2"
              id="pauseBtn"
              className="btn btn-warning pause-btn"
              onClick={(e) => {
                e.target.blur();
                pause();
              }}
            >
              PAUSE
            </button>
          )}

          <button
            id="stopBtn"
            className="btn btn-danger stop-btn"
            onClick={() => {
              stop();
            }}
          >
            STOP
          </button>

          <div className="options-wrapper">
            <select
              className="options-select"
              onClick={handleKeepThrowOutSelect}
            >
              <option value="keep" selected={mode.keep}>
                Keep selected time
              </option>
              <option value="delete" selected={!mode.keep}>
                Throw out selected time
              </option>
            </select>
            <select
              className="options-select"
              onClick={handleSingleMultipleSelect}
            >
              <option value="single" selected={mode.concatenate}>
                Render to single file
              </option>
              <option value="multiple" selected={!mode.concatenate}>
                Render multiple files
              </option>
              Render to single file
            </select>
          </div>

          <button
            className="btn btn-primary slice-btn"
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
            SLICE
          </button>
        </div>

        <DownloadLinks links={links}></DownloadLinks>
      </Container>
    </div>
  );
}

function getFramesToRender(mode, frames) {
  const audioDuration = 100; // in percent

  if (frames.length === 0) {
    throw new Error(
      "This should not happen. You passed empty frames to render"
    );
  }
  let toRender = [];
  const sortedFrames = frames.sort((a, b) => a.start - b.start);
  console.log("sorted frames", sortedFrames);
  console.log("mode: ", mode);

  if (mode.keep) {
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

export default App;
