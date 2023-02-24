import "./App.css";
import Container from "react-bootstrap/Container";

import { useEffect, useState, useRef, useCallback } from "react";

import { FramesContainer } from "./components/FramesContainer";
import { drawAudio } from "./utilities/drawWaveform";
import { positionToTimePercent, frameToSample } from "./utilities/utilities";
import { PlayBar } from "./components/PlayBar";
import { DownloadLinks } from "./components/DownloadLinks";
import { createAudioBlobForDownload } from "./utilities/prepareAudioForDownload";

window.AudioContext = window.AudioContext || window.webkitAudioContext;

const audioContext = new AudioContext();

function App() {
  // console.log("render start");
  const [frames, setFrames] = useState([]);
  const [mode, setMode] = useState("draw"); // draw / delete / adjust
  const [isPlaying, setIsPlaying] = useState(false);
  const audioElement = useRef(null);
  const [audioSource, setAudioSource] = useState(null);
  const waveformRef = useRef(null);
  const [time, setTime] = useState({
    start: 0,
    end: audioElement?.current?.duration,
  });
  const [filename, setFilename] = useState();
  const [audioBuffer, setAudioBuffer] = useState();
  const framesContainerRef = useRef();
  const selectedFrame = frames.find((f) => f.selected);
  const [links, setLinks] = useState([]);
  const [renderMode, setRenderMode] = useState({
    keep: true, // means the frames are to keep, if set to false, the frames are the part to delete
    concatenate: false, // means every frame will be in separate file
  });

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

  const initializeAudioElement = (event) => {
    console.log("initializing audio element");
    var files = event.target.files;
    setAudioSource(URL.createObjectURL(files[0]));
    console.log("audioSource set");
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
              setMode("draw");
            }}
            className={
              mode === "draw" ? "btn btn-primary" : "btn btn-secondary"
            }
          >
            Mark
          </button>

          <button
            id="adjust-btn"
            onClick={() => {
              setMode("adjust");
            }}
            className={
              mode === "adjust" ? "btn btn-primary" : "btn btn-secondary"
            }
          >
            Adjust
          </button>

          <button
            id="delete-btn"
            onClick={() => {
              setMode("delete");
            }}
            className={
              mode === "delete" ? "btn btn-primary" : "btn btn-secondary"
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
            mode={mode}
            frames={frames}
            setFrames={setFrames}
            setTime={setTime}
            audioElement={audioElement}
            selfRef={framesContainerRef}
          ></FramesContainer>
        </div>

        {/* currentTime is set to StartTime, because the StartTime updates to audio element current time when playing */}
        <PlayBar audioElement={audioElement} currentTime={time.start}></PlayBar>

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
              defaultValue={renderMode.keep ? "keep" : "delete"}
            >
              <option value="keep">Keep selected time</option>
              <option value="delete">Throw out selected time</option>
            </select>
            <select
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

function getFramesToRender(renderMode, frames) {
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

export default App;
