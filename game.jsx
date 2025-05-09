// Goora - Tilt-based POV Racing Quiz Game
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF, PerspectiveCamera, Html } from '@react-three/drei';
import { Suspense, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Howl } from 'howler';

// Load car model
function Car({ position }) {
    try {
      const { scene } = useGLTF('/mclaren_mp46.glb');
      scene.scale.set(0.9, 0.9, 0.9);
      scene.position.copy(position);
      return <primitive object={scene} />;
    } catch (error) {
      console.error('Failed to load car model:', error);
      return null;
    }
  }
  
  function Environment() {
    try {
      const { scene } = useGLTF('/isometric_race_track_-_daily_render_-_27.glb');
      return <primitive object={scene} />;
    } catch (error) {
      console.error('Failed to load environment:', error);
      return null;
    }
  }
  

// Main Game Logic
function Game() {
  const carRef = useRef();
  const cameraRef = useRef();
  const [questionIndex, setQuestionIndex] = useState(0);
  const [timer, setTimer] = useState(8);
  const [gameOver, setGameOver] = useState(false);
  const [difficulty, setDifficulty] = useState(null);

  const questions = [
    { q: 'What does AI stand for?', options: ['Artificial Intelligence', 'Automated Input'], answer: 0 },
    { q: 'What is the digital divide?', options: ['A software bug', 'Gap in tech access'], answer: 1 },
    // Add more as needed
  ];

  const bgm = new Howl({ src: ['/bgm.mp3'], autoplay: true, loop: true, volume: 0.4 });
  const correctSound = new Howl({ src: ['/correct.wav'] });
  const wrongSound = new Howl({ src: ['/wrong.wav'] });

  // Tilt detection
  useEffect(() => {
    function handleTilt(event) {
      const tilt = event.gamma;
      if (carRef.current) {
        carRef.current.position.x += tilt * 0.1;
      }
    }
    window.addEventListener('deviceorientation', handleTilt);
    return () => window.removeEventListener('deviceorientation', handleTilt);
  }, []);

  // Camera follow
  useEffect(() => {
    const interval = setInterval(() => {
      if (carRef.current && cameraRef.current) {
        const carPos = carRef.current.position;
        cameraRef.current.position.lerp(new THREE.Vector3(carPos.x, carPos.y + 2, carPos.z + 5), 0.1);
        cameraRef.current.lookAt(carPos);
      }
    }, 16);
    return () => clearInterval(interval);
  }, []);

  // Question timer
  useEffect(() => {
    if (gameOver || !difficulty) return;
    const timerInterval = setInterval(() => {
      setTimer(prev => {
        if (prev === 1) {
          wrongSound.play();
          setGameOver(true);
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerInterval);
  }, [gameOver, difficulty]);

  function handleAnswer(index) {
    if (gameOver) return;
    const correct = questions[questionIndex].answer === index;
    if (correct) {
      correctSound.play();
      setQuestionIndex(prev => (prev + 1) % questions.length);
      setTimer(difficulty);
    } else {
      wrongSound.play();
      setGameOver(true);
    }
  }

  function startGame(diff) {
    setDifficulty(diff);
    setGameOver(false);
    setQuestionIndex(0);
    setTimer(diff);
  }

  return (
    <>
      <Canvas shadows>
        <PerspectiveCamera makeDefault position={[0, 2, 5]} ref={cameraRef} />
        <ambientLight intensity={1} />
        <Suspense fallback={null}>
          <Environment />
          <group ref={carRef}>
            <Car position={new THREE.Vector3(0, 0, 0)} />
          </group>
        </Suspense>
      </Canvas>

      <Html fullscreen>
  <div className="flex items-center justify-center h-screen w-screen bg-black/50 text-white z-50">
          {!difficulty ? (
            <>
              <h1 className="text-2xl font-bold mb-4">Welcome to Goora</h1>
              <p className="mb-4">Choose Difficulty:</p>
              <button onClick={() => startGame(8)} className="w-full bg-green-400 hover:bg-green-500 text-white py-2 px-4 rounded mb-2">Easy</button>
              <button onClick={() => startGame(5)} className="w-full bg-yellow-400 hover:bg-yellow-500 text-white py-2 px-4 rounded mb-2">Normal</button>
              <button onClick={() => startGame(3)} className="w-full bg-red-400 hover:bg-red-500 text-white py-2 px-4 rounded mb-2">Hard</button>
              <p className="mt-4 text-xs text-gray-500">Made by maryxkarina</p>
            </>
          ) : !gameOver ? (
            <>
              <h1 className="text-xl font-semibold mb-4">{questions[questionIndex].q}</h1>
              {questions[questionIndex].options.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => handleAnswer(i)}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded mb-2 transition-all duration-200"
                >
                  {opt}
                </button>
              ))}
              <p className="text-sm text-gray-600 mt-2">Time left: {timer}s</p>
            </>
          ) : (
            <>
              <h1 className="text-3xl font-bold text-red-600 mb-4">Game Over!</h1>
              <p className="mb-4">Try Again?</p>
              <button
                onClick={() => startGame(difficulty)}
                className="bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded transition-all duration-200"
              >
                Restart
              </button>
            </>
          )}
        </div>
      </Html>
    </>
  );
}

export default Game;
