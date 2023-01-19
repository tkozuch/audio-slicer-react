import "./App.css";
import Container from "react-bootstrap/Container";

import { useEffect, useState, useRef } from "react";

import { FramesContainer } from "./components/FramesContainer";
import { drawAudio } from "./utilities/drawWaveform";
import { positionToTime } from "./utilities/utilities";

window.AudioContext = window.AudioContext || window.webkitAudioContext;

const audioContext = new AudioContext();

function useStartTimeEndTime(frames, audioElement, waveformElement) {
  const [selectedFrame, setSelectedFrame] = useState(null);
  const [endTime, setEndTime] = useState(null);
  const [startTime, setStartTime] = useState(null);

  useEffect(() => {
    setSelectedFrame(frames.length ? frames.find((f) => f.selected) : null);
  }, [frames]);

  useEffect(() => {
    setEndTime(
      selectedFrame
        ? positionToTime(
            Math.max(selectedFrame.start, selectedFrame.end),
            waveformElement,
            audioElement.duration
          )
        : audioElement
        ? audioElement.duration
        : undefined
    );
    setStartTime(
      selectedFrame
        ? positionToTime(
            Math.min(selectedFrame.start, selectedFrame.end),
            waveformElement,
            audioElement.duration
          )
        : audioElement
        ? 0
        : undefined
    );
  }, [selectedFrame, audioElement, waveformElement]);
  console.log("start time, end time", startTime, endTime);
  return [startTime, setStartTime, endTime];
}

function App() {
  console.log("render start");
  const [frames, setFrames] = useState([]);
  const [framesContainerState, setFramesContainerState] = useState({
    canDraw: false,
    canDelete: false,
  });
  const [isPlaying, setIsPlaying] = useState(false);
  const audioElement = useRef(null);
  const waveformRef = useRef(null);
  const [startTime, setStartTime, endTime] = useStartTimeEndTime(
    frames,
    audioElement.current,
    waveformRef.current
  );

  useEffect(() => {
    let pauseInterval;
    if (isPlaying) {
      pauseInterval = setInterval(() => {
        console.log("interval set");
        setStartTime(audioElement.current.currentTime);
        if (audioElement.current.currentTime >= endTime) {
          audioElement.current.pause();
          setIsPlaying(false);
          setStartTime(0);
        }
      }, 10);
    }

    return () => {
      console.log("interval cleared: ", isPlaying);
      clearInterval(pauseInterval);
    };
  }, [isPlaying]);

  const initializeAudioElement = (event) => {
    var files = event.target.files;
    audioElement.current.setAttribute("src", URL.createObjectURL(files[0]));
  };
  const play = (e) => {
    console.log("play clicked");
    setIsPlaying(true);
    // if (startTime && endTime) {
    audioElement.current.currentTime = startTime;
    audioElement.current.play();
    // }
  };
  const pause = (e) => {
    console.log("pause clicked");
    setIsPlaying(false);
    document.getElementById("audio").pause();
  };

  console.log("render end");
  return (
    <div className="App">
      <audio id="audio" controls ref={audioElement}></audio>
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
              const frames = document.getElementsByClassName("frame");
              if (frames.length) {
                new Array(...frames).forEach(
                  (frame) => (frame.style.cursor = "no-drop")
                );
              }
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
          ></FramesContainer>
        </div>

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

          <button id="stopBtn" className="btn btn-danger stop-btn">
            STOP
          </button>
        </div>
      </Container>
    </div>
  );
}

export default App;
