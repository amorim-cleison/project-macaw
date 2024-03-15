import './App.css';
import { Orchestrator } from 'macaw-orchestrator';
import { useEffect, useRef, useState } from 'react';
import { POSE_CONNECTIONS, FACEMESH_TESSELATION, HAND_CONNECTIONS } from '@mediapipe/holistic';
import { Camera } from '@mediapipe/camera_utils';
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils';

function App() {
  const [isReady, setIsReady] = useState(false);

  const inputVideoRef = useRef();
  const canvasRef = useRef();
  let canvasCtx = undefined;
  let orchestrator = undefined;

  const init = () => {
    canvasCtx = canvasRef.current.getContext("2d");

    orchestrator = new Orchestrator()
    orchestrator.onResult(onResults);
    orchestrator.initialize();

    const camera = new Camera(inputVideoRef.current, {
      onFrame: async () => {
        await orchestrator.processFrame(inputVideoRef.current);
      },
      width: 1280,
      height: 720
    });
    camera.start();
  };


  function onResults(body, results) {
    // Hide the spinner.
    if (!isReady) {
      setIsReady(true);
    }

    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

    if (results.segmentationMask) {
      canvasCtx.drawImage(results.segmentationMask, 0, 0, canvasRef.current.width, canvasRef.current.height);

      // Only overwrite existing pixels.
      canvasCtx.globalCompositeOperation = 'source-in';
      canvasCtx.fillStyle = '#00FF00';
      canvasCtx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);

      // Only overwrite missing pixels.
      canvasCtx.globalCompositeOperation = 'destination-atop';
      // canvasCtx.drawImage(results.image, 0, 0, canvasRef.current.width, canvasRef.current.height);
    } else {
      // canvasCtx.drawImage(results.image, 0, 0, canvasRef.current.width, canvasRef.current.height);
    }

    canvasCtx.globalCompositeOperation = 'source-over';
    drawConnectors(canvasCtx, results.poseLandmarks, POSE_CONNECTIONS, { color: '#00FF00', lineWidth: 4 });
    drawLandmarks(canvasCtx, results.poseLandmarks, { color: '#FF0000', lineWidth: 2 });
    drawConnectors(canvasCtx, results.faceLandmarks, FACEMESH_TESSELATION, { color: '#C0C0C070', lineWidth: 1 });
    drawConnectors(canvasCtx, results.leftHandLandmarks, HAND_CONNECTIONS, { color: '#CC0000', lineWidth: 5 });
    drawLandmarks(canvasCtx, results.leftHandLandmarks, { color: '#00FF00', lineWidth: 2 });
    drawConnectors(canvasCtx, results.rightHandLandmarks, HAND_CONNECTIONS, { color: '#00CC00', lineWidth: 5 });
    drawLandmarks(canvasCtx, results.rightHandLandmarks, { color: '#FF0000', lineWidth: 2 });

    canvasCtx.restore();
  }

  useEffect(() => {
    if (inputVideoRef.current) {
      init();
    }
  }, [inputVideoRef.current]);

  return (
    <div className="App">
      <div className="container">
        <video className='input_video' ref={inputVideoRef} width={1280} height={720} />
        <canvas className='output_canvas' ref={canvasRef} width={1280} height={720} />
        {!isReady &&
          (
            <div className="loading">
              <div className="spinner"></div>
              <div className="message">
                Loading...
              </div>
            </div>
          )
        }
      </div>
    </div>
  );
}

export default App;
