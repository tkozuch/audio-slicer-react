import "./App.css";
import Container from "react-bootstrap/Container";

import { useState } from "react";

import { FramesContainer } from "./components/FramesContainer";
import { drawAudio } from "./drawWaveform";

window.AudioContext = window.AudioContext || window.webkitAudioContext;

const audioContext = new AudioContext();

function App() {
  const [framesContainerState, setFramesContainerState] = useState({
    canDraw: false,
    canDelete: false,
  });

  return (
    <div className="App">
      <Container className="main">
        <div className="upper-row">
          <input
            type="file"
            id="upload"
            onChange={(event) => drawAudio(event, audioContext)}
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
          <FramesContainer {...framesContainerState}></FramesContainer>
        </div>

        {/* <Row className="info">
          <Col sm="2">
            {!isPlaying ? (
              <Button sm="2" id="playBtn" className="w-100">
                PLAY
              </Button>
            ) : (
              <Button sm="2" id="pauseBtn" className="w-100">
                PAUSE
              </Button>
            )}
          </Col>
          <Col sm="2">
            <Button id="stopBtn" className="w-100">
              STOP
            </Button>
          </Col>
          <Col sm="2" className="deleteBtn">
            <Button
              id="deleteBtn"
              className="w-100 btn-warning"
              disabled={!frameSelected}
            >
              DELETE
            </Button>
          </Col>
        </Row> */}
      </Container>
    </div>
  );
}

export default App;
