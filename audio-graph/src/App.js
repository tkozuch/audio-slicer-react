import "./App.css";
import Container from "react-bootstrap/Container";

import { useState, useEffect } from "react";

import * as utils from "./utilities";
import { FramesContainer } from "./components/FramesContainer";

function App() {
  return (
    <div className="App">
      <Container className="main">
        <input type="file" id="upload" />

        <div className="canvasWrapper">
          <FramesContainer></FramesContainer>
          <canvas id="waveform" width="1000" height="200"></canvas>
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
