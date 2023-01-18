import "./App.css";
import Container from "react-bootstrap/Container";

import { useEffect, useState } from "react";

import { FramesContainer } from "./components/FramesContainer";
import { drawAudio } from "./utilities/drawWaveform";

window.AudioContext = window.AudioContext || window.webkitAudioContext;

const audioContext = new AudioContext();

function App() {
  const [frames, setFrames] = useState([]);
  const [framesContainerState, setFramesContainerState] = useState({
    canDraw: false,
    canDelete: false,
  });
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {}, []);

  const initializeAudioElement = (event) => {
    var files = event.target.files;
    document
      .getElementById("audio")
      .setAttribute("src", URL.createObjectURL(files[0]));
  };
  const play = (e) => {
    setIsPlaying(true);
    document.getElementById("audio").play();
  };
  const pause = (e) => {
    setIsPlaying(false);
    document.getElementById("audio").pause();
  };

  return (
    <div className="App">
      <audio id="audio" controls></audio>
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
          <canvas id="waveform" width="1000" height="200"></canvas>
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
