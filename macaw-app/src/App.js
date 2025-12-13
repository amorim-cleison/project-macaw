import './App.css';
import { Orchestrator } from 'macaw-orchestrator';
import { useEffect, useRef, useState, useCallback } from 'react';
import { POSE_CONNECTIONS, FACEMESH_TESSELATION, HAND_CONNECTIONS } from '@mediapipe/holistic';
import { Camera } from '@mediapipe/camera_utils';
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils';

function App() {
  const [isReady, setIsReady] = useState(false);

  const inputVideoRef = useRef();
  const canvasRef = useRef();
  const canvasCtxRef = useRef();
  const orchestratorRef = useRef();

  const onResults = useCallback((body, results) => {
    // Hide the spinner.
    if (!isReady) {
      setIsReady(true);
    }

    if (!canvasCtxRef.current || !canvasRef.current) return;

    canvasCtxRef.current.save();
    canvasCtxRef.current.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

    if (results.segmentationMask) {
      canvasCtxRef.current.drawImage(results.segmentationMask, 0, 0, canvasRef.current.width, canvasRef.current.height);

      // Only overwrite existing pixels.
      canvasCtxRef.current.globalCompositeOperation = 'source-in';
      canvasCtxRef.current.fillStyle = '#00FF00';
      canvasCtxRef.current.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);

      // Only overwrite missing pixels.
      canvasCtxRef.current.globalCompositeOperation = 'destination-atop';
      // canvasCtxRef.current.drawImage(results.image, 0, 0, canvasRef.current.width, canvasRef.current.height);
    } else {
      // canvasCtxRef.current.drawImage(results.image, 0, 0, canvasRef.current.width, canvasRef.current.height);
    }

    canvasCtxRef.current.globalCompositeOperation = 'source-over';
    drawConnectors(canvasCtxRef.current, results.poseLandmarks, POSE_CONNECTIONS, { color: '#00FF00', lineWidth: 4 });
    drawLandmarks(canvasCtxRef.current, results.poseLandmarks, { color: '#FF0000', lineWidth: 2 });
    drawConnectors(canvasCtxRef.current, results.faceLandmarks, FACEMESH_TESSELATION, { color: '#C0C0C070', lineWidth: 1 });
    drawConnectors(canvasCtxRef.current, results.leftHandLandmarks, HAND_CONNECTIONS, { color: '#CC0000', lineWidth: 5 });
    drawLandmarks(canvasCtxRef.current, results.leftHandLandmarks, { color: '#00FF00', lineWidth: 2 });
    drawConnectors(canvasCtxRef.current, results.rightHandLandmarks, HAND_CONNECTIONS, { color: '#00CC00', lineWidth: 5 });
    drawLandmarks(canvasCtxRef.current, results.rightHandLandmarks, { color: '#FF0000', lineWidth: 2 });

    canvasCtxRef.current.restore();
  }, [isReady]);

  const init = useCallback(() => {
    canvasCtxRef.current = canvasRef.current.getContext("2d");

    orchestratorRef.current = new Orchestrator()
    orchestratorRef.current.onResult(onResults);

    orchestratorRef.current.initialize().then(() => {
      const camera = new Camera(inputVideoRef.current, {
        onFrame: async () => {
          await orchestratorRef.current.processFrame(inputVideoRef.current);
        },
        width: 1280,
        height: 720
      });
      camera.start();
    });
  }, [onResults]);

  useEffect(() => {
    if (inputVideoRef.current) {
      init();
    }
  }, [init]);

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
