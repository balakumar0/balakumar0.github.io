const video = document.getElementById('webcam');
const canvas = document.getElementById('canvas');
const context = canvas.getContext('2d');

// Get the dimensions of the window
let windowWidth = window.innerWidth;
let windowHeight = window.innerHeight;

navigator.mediaDevices.enumerateDevices().then(devices => {
  var deviceId = devices.filter(device => device.kind == 'videoinput');
  deviceId = deviceId[deviceId.length - 1].deviceId;

  navigator.mediaDevices
    .getUserMedia({
      video: {
        deviceId: deviceId,
        facingMode: 'environment',
      },
    })
    .then(stream => {
      video.srcObject = stream;
      video.onloadedmetadata = () => {
        // Calculate the aspect ratio of the video
        let videoAspectRatio = video.videoWidth / video.videoHeight;

        // Calculate the dimensions of the video and canvas
        // The video will fill the width or height of the window, whichever is smaller
        if (windowWidth / windowHeight < videoAspectRatio) {
          canvas.width = windowWidth;
          canvas.height = windowWidth / videoAspectRatio;
        } else {
          canvas.width = windowHeight * videoAspectRatio;
          canvas.height = windowHeight;
        }

        video.width = canvas.width;
        video.height = canvas.height;

        video.play();
        detectFromVideoFrame(video);
      };
    });
});

const modelPromise = cocoSsd.load();

async function detectFromVideoFrame(video) {
  const model = await modelPromise;
  const predictions = await model.detect(video);

  // Clear previous drawings before new predictions are drawn
  context.clearRect(0, 0, canvas.width, canvas.height);

  context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
  predictions.forEach(prediction => {
    context.beginPath();
    context.rect(...prediction.bbox);
    context.lineWidth = 2;
    context.strokeStyle = 'yellow';
    context.fillStyle = 'yellow';
    context.stroke();
    context.fillText(
      `${prediction.class} (${Math.round(prediction.score * 100)}%)`,
      prediction.bbox[0],
      prediction.bbox[1] > 10 ? prediction.bbox[1] - 5 : 10,
    );
  });

  requestAnimationFrame(() => detectFromVideoFrame(video));
}
