import "./App.css";
import Container from "react-bootstrap/Container";

import { useEffect, useState, useRef } from "react";

import { FramesContainer } from "./components/FramesContainer";
import { drawAudio } from "./utilities/drawWaveform";
import { positionToTime } from "./utilities/utilities";

window.AudioContext = window.AudioContext || window.webkitAudioContext;

const audioContext = new AudioContext();

function useStartTimeEndTime(frames, audioElement, waveformRef) {
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
            waveformRef.current,
            audioElement.current.duration
          )
        : audioElement.current
        ? audioElement.current.duration
        : 0
    );
    setStartTime(
      selectedFrame
        ? positionToTime(
            Math.min(selectedFrame.start, selectedFrame.end),
            waveformRef.current,
            audioElement.current.duration
          )
        : audioElement.current
        ? audioElement.current.duration
        : 0
    );
  }, [selectedFrame, audioElement]);
  return [startTime, endTime];
}

function App() {
  const [frames, setFrames] = useState([]);
  const [framesContainerState, setFramesContainerState] = useState({
    canDraw: false,
    canDelete: false,
  });
  const [isPlaying, setIsPlaying] = useState(false);
  const audioElement = useRef(null);
  const waveformRef = useRef(null);
  const [pauseInterval, setPauseInterval] = useState();
  const [startTime, endTime] = useStartTimeEndTime(
    frames,
    audioElement,
    waveformRef
  );

  // useEffect(() => {}, []);

  const initializeAudioElement = (event) => {
    var files = event.target.files;
    audioElement.current.setAttribute("src", URL.createObjectURL(files[0]));
  };
  const play = (e) => {
    setIsPlaying(true);
    audioElement.current.play();

    if (startTime && endTime) {
      audioElement.current.currentTime = startTime;
      setPauseInterval(
        setInterval(() => {
          console.log("interval set");
          if (audioElement.current.currentTime >= endTime) {
            audioElement.current.pause();
            clearInterval(pauseInterval);
            setIsPlaying(false);
            console.log("interval cleared");
          }
        }, 10)
      );
    }
  };
  const pause = (e) => {
    setIsPlaying(false);
    document.getElementById("audio").pause();
  };
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
