import "./App.css";
import Container from "react-bootstrap/Container";

import { useEffect, useState, useRef } from "react";

import { FramesContainer } from "./components/FramesContainer";
import { drawAudio } from "./utilities/drawWaveform";
import { positionToTimePercent } from "./utilities/utilities";

window.AudioContext = window.AudioContext || window.webkitAudioContext;

const audioContext = new AudioContext();

function useStartTimeEndTime(frames, audioElement) {
  const [endTime, setEndTime] = useState(null);
  const [startTime, setStartTime] = useState(null);

  const selectedFrame = frames.length ? frames.find((f) => f.selected) : null;

  useEffect(() => {
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
  }, [selectedFrame, audioElement]);

  return [startTime, setStartTime, endTime, setEndTime];
}

function App() {
  console.log("render start");
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
  const selectedFrame = frames.find((f) => f.selected);

  useEffect(() => {
    let pauseInterval;
    if (isPlaying) {
      pauseInterval = setInterval(() => {
        // console.log("interval set. ", startTime, endTime);
        setStartTime(audioElement.current.currentTime);
        if (audioElement.current.currentTime >= endTime) {
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
      clearInterval(pauseInterval);
    };
  }, [isPlaying]);

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
  const stop = (e) => {
    setIsPlaying(false);
    if (audioElement.current.currentTime) audioElement.current.currentTime = 0;
  };

  console.log("render end");
  return (
    <div className="App">
      <audio
        id="audio"
        controls
        ref={audioElement}
        src={audioSource}
        // onLoad={(e) => handleAudioLoad(e)}
      ></audio>
      <Container className="main">
        <div className="upper-row">
          <input
            type="file"
            id="upload"
            onChange={(event) => {
              initializeAudioElement(event);
              drawAudio(event, audioContext);
            }}
          />

          <button
            id="mark-btn"
            onClick={() => {
              setFramesContainerState({
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
            audioElement={audioElement}
          ></FramesContainer>
        </div>

        {/*  */}
        <div className="down-buttons-wrapper">
          {!isPlaying ? (
            <button
              sm="2"
              id="playBtn"
              className="btn btn-success play-btn"
              onClick={play}
            >
              PLAY
            </button>
          ) : (
            <button
              sm="2"
              id="pauseBtn"
              className="btn btn-warning pause-btn"
              onClick={pause}
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
        </div>
      </Container>
    </div>
  );
}

export default App;
