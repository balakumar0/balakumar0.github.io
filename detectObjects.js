const video = document.getElementById('webcam');
      const canvas = document.getElementById('canvas');
      const context = canvas.getContext('2d');

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
              canvas.width = video.videoWidth;
              canvas.height = video.videoHeight;
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
