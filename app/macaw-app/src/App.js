import './App.css';
// import { Orchestrator } from 'macaw-orchestrator';
import { useEffect, useRef, useState } from 'react';
// import { POSE_CONNECTIONS, FACEMESH_TESSELATION, HAND_CONNECTIONS } from '@mediapipe/holistic';
// import { Camera } from '@mediapipe/camera_utils';
// import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils';;
import { HandLandmarker, FilesetResolver, DrawingUtils  } from '@mediapipe/tasks-vision';

const modelAssetPath = 'https://storage.googleapis.com/mediapipe-assets/hand_landmarker.task';
const VIDEO_WIDTH = 640;
const VIDEO_HEIGHT = 480;

function App() {
  const [isReady, setIsReady] = useState(false);

  // References to DOM elements:
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Persistent variables:
  const handLandmarkerRef = useRef(null); // O objeto principal do MediaPipe
  const drawingUtilsRef = useRef(null); // Utilitário de desenho
  let lastVideoTime = -1; // Para controle do frame

  // State for feedback:
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  let canvasCtx = undefined;
  let orchestrator = undefined;

  /**
   * 1. Inicializa o MediaPipe HandLandmarker e a webcam.
   * Executa apenas uma vez após a montagem do componente.
   */
  useEffect(() => {
    let animationFrameId; // ID para requestAnimationFrame


    const initializeMediaPipe = async () => {
      try {
        setLoading(true);
        setError(null);

        // 1.1 Carregar o Resolvers (WASM)
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
        );

        // 1.2 Criar o HandLandmarker
        const handLandmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: modelAssetPath,
            delegate: "GPU" // Tentativa de usar aceleração via GPU
          },
          runningMode: "VIDEO", // Modo para processamento em tempo real
          numHands: 2 // Detectar até 2 mãos
        });

        handLandmarkerRef.current = handLandmarker;
        console.log("MediaPipe HandLandmarker inicializado com sucesso.");

        // 1.3 Inicializar o DrawingUtils após configurar o canvas
        const canvas = canvasRef.current;
        if (canvas) {
          const canvasCtx = canvas.getContext('2d');
          // Inicializa o utilitário de desenho com o contexto 2D do Canvas
          drawingUtilsRef.current = new DrawingUtils(canvasCtx);
        }

        // 1.3 Iniciar o acesso à webcam
        await startWebcam();
        setLoading(false);

        // Iniciar o loop de detecção após a inicialização
        if (videoRef.current && handLandmarkerRef.current) {
          detectHands();
        }

      } catch (err) {
        console.error("Erro ao inicializar MediaPipe ou Webcam:", err);
        setError("Não foi possível carregar o modelo ou acessar a câmera. Verifique as permissões.");
        setLoading(false);
      }
    };

    const startWebcam = async () => {
      if (!videoRef.current) return;

      // Obter stream de mídia da webcam
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      videoRef.current.srcObject = stream;

      // O vídeo só pode ser processado após o evento 'loadeddata'
      return new Promise(resolve => {
        videoRef.current.onloadeddata = () => {
          videoRef.current.play();
          resolve();
        };
      });
    };

    // 1.4 Chamar a função principal de inicialização
    initializeMediaPipe();

    // 1.5 Função de limpeza ao desmontar o componente
    return () => {
      // Interromper o loop de animação
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      // Interromper o stream da câmera
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = videoRef.current.srcObject.getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, []); // Array de dependências vazio para executar apenas na montagem

  /**
   * 2. Loop principal de detecção (usa requestAnimationFrame para otimização).
   */
  const detectHands = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const handLandmarker = handLandmarkerRef.current;
    const drawingUtils = drawingUtilsRef.current;

    if (!video || !canvas || !handLandmarker || !drawingUtils) {
      // Se algum recurso não estiver pronto, apenas agende a próxima tentativa.
      requestAnimationFrame(detectHands);
      return;
    }

    // Configurar o canvas para desenhar
    canvas.width = VIDEO_WIDTH;
    canvas.height = VIDEO_HEIGHT;

    const canvasCtx = canvas.getContext('2d');

    // Limpar o canvas a cada frame (necessário antes de desenhar)
    canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
    canvasCtx.save();

    // Flipar o canvas para simular um espelho (opcional)
    // canvasCtx.scale(-1, 1);
    // canvasCtx.translate(-canvas.width, 0);

    // 2.1 Desenhar o frame de vídeo atual no canvas
    // O MediaPipe pode fazer isso internamente, mas desenhar explicitamente permite 
    // melhor controle e sobreposição de resultados.
    canvasCtx.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvasCtx.restore(); // Voltar para as configurações normais após o flip

    // 2.2 Processar o vídeo com o MediaPipe
    if (video.currentTime !== lastVideoTime) {
      const startTimeMs = performance.now();
      // O modo VIDEO é síncrono, detectando a mão no frame atual
      const results = handLandmarker.detectForVideo(video, startTimeMs);
      lastVideoTime = video.currentTime;

      // 2.3 Desenhar os resultados no canvas
      if (results.landmarks && results.landmarks.length > 0) {
        for (const landmarks of results.landmarks) {
          // Desenha as conexões (o esqueleto)
          drawingUtils.drawConnectors(
            landmarks,
            HandLandmarker.HAND_CONNECTIONS, // Conexões padrão da mão
            { color: "#00FF00", lineWidth: 5 }
          );
          // Desenha os pontos de referência (landmarks)
          drawingUtils.drawLandmarks(landmarks, { color: "#FF0000", lineWidth: 2 });
        }
      }
    }

    // 2.4 Agendar a próxima execução
    requestAnimationFrame(detectHands);
  };

  // const init = () => {
  //   canvasCtx = canvasRef.current.getContext("2d");

  //   orchestrator = new Orchestrator()
  //   orchestrator.onResult(onResults);

  //   orchestrator.initialize().then(() => {
  //     const camera = new Camera(inputVideoRef.current, {
  //       onFrame: async () => {
  //         await orchestrator.processFrame(inputVideoRef.current);
  //       },
  //       width: 1280,
  //       height: 720
  //     });
  //     camera.start();
  //   });
  // };

  // function onResults(body, results) {
  //   // Hide the spinner.
  //   if (!isReady) {
  //     setIsReady(true);
  //   }

  //   canvasCtx.save();
  //   canvasCtx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

  //   if (results.segmentationMask) {
  //     canvasCtx.drawImage(results.segmentationMask, 0, 0, canvasRef.current.width, canvasRef.current.height);

  //     // Only overwrite existing pixels.
  //     canvasCtx.globalCompositeOperation = 'source-in';
  //     canvasCtx.fillStyle = '#00FF00';
  //     canvasCtx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);

  //     // Only overwrite missing pixels.
  //     canvasCtx.globalCompositeOperation = 'destination-atop';
  //     // canvasCtx.drawImage(results.image, 0, 0, canvasRef.current.width, canvasRef.current.height);
  //   } else {
  //     // canvasCtx.drawImage(results.image, 0, 0, canvasRef.current.width, canvasRef.current.height);
  //   }

  //   canvasCtx.globalCompositeOperation = 'source-over';
  //   drawConnectors(canvasCtx, results.poseLandmarks, POSE_CONNECTIONS, { color: '#00FF00', lineWidth: 4 });
  //   drawLandmarks(canvasCtx, results.poseLandmarks, { color: '#FF0000', lineWidth: 2 });
  //   drawConnectors(canvasCtx, results.faceLandmarks, FACEMESH_TESSELATION, { color: '#C0C0C070', lineWidth: 1 });
  //   drawConnectors(canvasCtx, results.leftHandLandmarks, HAND_CONNECTIONS, { color: '#CC0000', lineWidth: 5 });
  //   drawLandmarks(canvasCtx, results.leftHandLandmarks, { color: '#00FF00', lineWidth: 2 });
  //   drawConnectors(canvasCtx, results.rightHandLandmarks, HAND_CONNECTIONS, { color: '#00CC00', lineWidth: 5 });
  //   drawLandmarks(canvasCtx, results.rightHandLandmarks, { color: '#FF0000', lineWidth: 2 });

  //   canvasCtx.restore();
  // }

  // useEffect(() => {
  //   if (inputVideoRef.current) {
  //     init();
  //   }
  // }, [inputVideoRef.current]);

  return (
    <div className="App" style={{ textAlign: 'center', padding: '20px' }}>
      <h1>👋 MediaPipe Hand Detection no React</h1>
      <p>Este aplicativo demonstra a detecção de mãos em tempo real usando a biblioteca `tasks-vision` do MediaPipe.</p>

      {error && <p style={{ color: 'red', fontWeight: 'bold' }}>ERRO: {error}</p>}

      {loading && !error && <p>Carregando modelo e iniciando webcam...</p>}

      <div style={{ position: 'relative', width: VIDEO_WIDTH, margin: '20px auto' }}></div>

      {/* <div className="container"> */}
      {/* Elemento de vídeo oculto - Recebe o stream da câmera */}
      <video
        ref={videoRef}
        style={{
          display: 'none',
          width: VIDEO_WIDTH,
          height: VIDEO_HEIGHT
        }}
        autoPlay
        playsInline
        muted
      />

      {/* Canvas - Onde o vídeo e os resultados são desenhados */}
      <canvas
        ref={canvasRef}
        style={{
          border: '2px solid #333',
          // Espelhar o canvas para coincidir com o movimento da câmera (opcional)
          transform: 'scaleX(-1)',
        }}
        width={VIDEO_WIDTH}
        height={VIDEO_HEIGHT}
      />
      {/* <canvas 
        className='output_canvas' 
        ref={canvasRef} 
        width={1280} 
        height={720} /> */}

      {!loading && !error && <p>Mova suas mãos na frente da câmera para ver os landmarks.</p>}

      {/* {!isReady &&
        (
          <div className="loading">
            <div className="spinner"></div>
            <div className="message">
              Loading...
            </div>
          </div>
        )
        } */}
    </div>
  );
}

export default App;
