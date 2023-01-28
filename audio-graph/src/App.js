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

  const prepareDownloadLinks = useCallback(
    function prepareDownloadLinks() {
      if (frames.length > 0) {
        const dataToDownload = frames.map((frame) => {
          const [sampleStart, sampleEnd] = frameToSample(
            frame,
            audioBuffer.sampleRate,
            audioBuffer.duration
          );
          return createAudioBlobForDownload(
            audioBuffer,
            sampleStart,
            sampleEnd
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
    [frames, audioBuffer, setLinks, filename]
  );

  useEffect(() => {
    let playInterval;
    if (isPlaying) {
      playInterval = setInterval(() => {
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
      clearInterval(playInterval);
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
    setStartTime(0);
  };
  const undoLastFrame = () => {
    const framesCopy = [...frames];
    framesCopy.pop();
    setFrames(framesCopy);
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

export default App;
