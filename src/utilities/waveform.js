export const drawAudio = (event, audioContext, setAudioBuffer, callback) => {
  var files = event.target.files;
  files[0].arrayBuffer().then((arrayBuffer) => {
    let result = audioContext
      .decodeAudioData(arrayBuffer)
      .then((audioBuffer) => {
        setAudioBuffer(audioBuffer);
        draw(normalizeData(filterData(audioBuffer)));
        callback();
      });
    return result;
  });
};
/**
 * Filters the AudioBuffer retrieved from an external source
 * @param {AudioBuffer} audioBuffer the AudioBuffer from drawAudio()
 * @returns {Array} an array of floating point numbers
 */
const filterData = (audioBuffer) => {
  const rawData = audioBuffer.getChannelData(0); // We only need to work with one channel of data
  const samples = 10000; // Number of samples we want to have in our final data set
  const blockSize = Math.floor(rawData.length / samples); // the number of samples in each subdivision
  const filteredData = [];
  for (let i = 0; i < samples; i++) {
    let blockStart = blockSize * i; // the location of the first sample in the block
    let sum = 0;
    for (let j = 0; j < blockSize; j++) {
      sum = sum + Math.abs(rawData[blockStart + j]); // find the sum of all the samples in the block
    }
    filteredData.push(sum / blockSize); // divide the sum by the block size to get the average
  }
  return filteredData;
};
/**
 * Normalizes the audio data to make a cleaner illustration
 * @param {Array} filteredData the data from filterData()
 * @returns {Array} an normalized array of floating point numbers
 */
const normalizeData = (filteredData) => {
  let multiplier = Math.pow(Math.max(...filteredData), -1);
  return filteredData.map((n) => Math.pow(n * multiplier, 1));
};

/**
 * Draws the audio file into a canvas element.
 * @param {Array} normalizedData The filtered array returned from filterData()
 * @returns {Array} a normalized array of data
 */
const draw = (normalizedData) => {
  // set up the canvas
  const canvas = document.querySelector("#waveform");
  const dpr = 1; //window.devicePixelRatio || 1;
  const padding = 30;

  const border = getComputedStyle(canvas)
    .getPropertyValue("border-width")
    .split("px")[0];

  canvas.width = canvas.offsetWidth * dpr - border * 2;
  canvas.height = (canvas.offsetHeight + padding * 2) * dpr - border * 2;
  const ctx = canvas.getContext("2d");
  ctx.scale(dpr, dpr);
  ctx.translate(0, canvas.offsetHeight / 2 + padding); // set Y = 0 to be in the middle of the canvas

  // draw the line segments
  const width = canvas.offsetWidth / normalizedData.length;

  for (let i = 0; i < normalizedData.length; i++) {
    const x = width * i;
    let height = normalizedData[i] * canvas.offsetHeight - padding;
    if (height < 0) {
      height = 0;
    }
    // else if (height > canvas.offsetHeight * 0.9) {
    //   height = canvas.offsetHeight * 0.9;
    // }
    drawLineSegment(ctx, x, height, width, (i + 1) % 2);
  }
};

/**
 * A utility function for drawing our line segments
 * @param {AudioContext} ctx the audio context
 * @param {number} x  the x coordinate of the beginning of the line segment
 * @param {number} height the desired height of the line segment
 * @param {number} width the desired width of the line segment
 * @param {boolean} isEven whether or not the segmented is even-numbered
 */
const drawLineSegment = (ctx, x, height, width, isEven) => {
  ctx.lineWidth = 1; // how thick the line is
  ctx.fillStyle = "#ffffff"; // what color our line is
  let heightAdjusted = height > 1 ? height : 1; // This is for purpose of not having a visible breaks in the waveform (caused by too small rectangle). (height might be actually bigger then 1 here)
  ctx.beginPath();
  ctx.moveTo(x, 0);
  ctx.fillRect(x, -heightAdjusted, width, 2 * heightAdjusted);
  ctx.stroke();
};
