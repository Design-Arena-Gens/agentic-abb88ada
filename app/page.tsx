'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';

// Particle templates
type ParticleTemplate = 'heart' | 'flower' | 'saturn' | 'firework' | 'spiral' | 'sphere' | 'star' | 'butterfly';

interface GestureState {
  gesture: string;
  handPosition: { x: number; y: number } | null;
  spread: number;
  isDetecting: boolean;
}

// Generate particle positions for different templates
function generateTemplatePositions(template: ParticleTemplate, count: number): THREE.Vector3[] {
  const positions: THREE.Vector3[] = [];
  
  switch (template) {
    case 'heart':
      for (let i = 0; i < count; i++) {
        const t = (i / count) * Math.PI * 2;
        const x = 16 * Math.pow(Math.sin(t), 3);
        const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
        const z = (Math.random() - 0.5) * 5;
        positions.push(new THREE.Vector3(x * 0.15, y * 0.15, z * 0.3));
      }
      break;
      
    case 'flower':
      for (let i = 0; i < count; i++) {
        const t = (i / count) * Math.PI * 2 * 6;
        const r = 2 + Math.cos(5 * t);
        const x = r * Math.cos(t);
        const y = r * Math.sin(t);
        const z = (Math.random() - 0.5) * 2;
        positions.push(new THREE.Vector3(x, y, z));
      }
      break;
      
    case 'saturn':
      const ringParticles = Math.floor(count * 0.6);
      const sphereParticles = count - ringParticles;
      
      // Ring
      for (let i = 0; i < ringParticles; i++) {
        const angle = (i / ringParticles) * Math.PI * 2;
        const radius = 3 + (Math.random() - 0.5) * 0.5;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        const y = (Math.random() - 0.5) * 0.2;
        positions.push(new THREE.Vector3(x, y, z));
      }
      
      // Planet sphere
      for (let i = 0; i < sphereParticles; i++) {
        const phi = Math.acos(-1 + (2 * i) / sphereParticles);
        const theta = Math.sqrt(sphereParticles * Math.PI) * phi;
        const x = 1.5 * Math.cos(theta) * Math.sin(phi);
        const y = 1.5 * Math.sin(theta) * Math.sin(phi);
        const z = 1.5 * Math.cos(phi);
        positions.push(new THREE.Vector3(x, y, z));
      }
      break;
      
    case 'firework':
      for (let i = 0; i < count; i++) {
        const phi = Math.acos(-1 + (2 * i) / count);
        const theta = Math.sqrt(count * Math.PI) * phi;
        const radius = 2 + Math.random() * 2;
        const x = radius * Math.cos(theta) * Math.sin(phi);
        const y = radius * Math.sin(theta) * Math.sin(phi);
        const z = radius * Math.cos(phi);
        positions.push(new THREE.Vector3(x, y, z));
      }
      break;
      
    case 'spiral':
      for (let i = 0; i < count; i++) {
        const t = (i / count) * Math.PI * 8;
        const radius = t * 0.15;
        const x = Math.cos(t) * radius;
        const z = Math.sin(t) * radius;
        const y = t * 0.2 - 3;
        positions.push(new THREE.Vector3(x, y, z));
      }
      break;
      
    case 'sphere':
      for (let i = 0; i < count; i++) {
        const phi = Math.acos(-1 + (2 * i) / count);
        const theta = Math.sqrt(count * Math.PI) * phi;
        const radius = 2.5;
        const x = radius * Math.cos(theta) * Math.sin(phi);
        const y = radius * Math.sin(theta) * Math.sin(phi);
        const z = radius * Math.cos(phi);
        positions.push(new THREE.Vector3(x, y, z));
      }
      break;
      
    case 'star':
      for (let i = 0; i < count; i++) {
        const t = (i / count) * Math.PI * 2;
        const r = 2 + (i % 2 === 0 ? 1 : -0.5);
        const x = Math.cos(t * 5) * r;
        const y = Math.sin(t * 5) * r;
        const z = (Math.random() - 0.5) * 2;
        positions.push(new THREE.Vector3(x, y, z));
      }
      break;
      
    case 'butterfly':
      for (let i = 0; i < count; i++) {
        const t = (i / count) * Math.PI * 12;
        const r = Math.exp(Math.cos(t)) - 2 * Math.cos(4 * t) - Math.pow(Math.sin(t / 12), 5);
        const x = Math.sin(t) * r * 1.2;
        const y = Math.cos(t) * r * 1.2;
        const z = (Math.random() - 0.5) * 1.5;
        positions.push(new THREE.Vector3(x, y, z));
      }
      break;
  }
  
  return positions;
}

// Color palettes
const colorPalettes = {
  rainbow: [0xff0000, 0xff7f00, 0xffff00, 0x00ff00, 0x0000ff, 0x8b00ff],
  sunset: [0xff6b6b, 0xfeca57, 0xff9ff3, 0xf368e0],
  ocean: [0x00d2d3, 0x54a0ff, 0x5f27cd, 0x341f97],
  forest: [0x00b894, 0x55efc4, 0x81ecec, 0x00cec9],
  fire: [0xff4757, 0xff6348, 0xffa502, 0xfffa65],
  neon: [0x00ff87, 0x60efff, 0xff00c3, 0xfff200],
};

export default function Home() {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [loading, setLoading] = useState(true);
  const [currentTemplate, setCurrentTemplate] = useState<ParticleTemplate>('sphere');
  const [currentPalette, setCurrentPalette] = useState<keyof typeof colorPalettes>('rainbow');
  const [gestureState, setGestureState] = useState<GestureState>({
    gesture: 'none',
    handPosition: null,
    spread: 1,
    isDetecting: false,
  });
  
  // Refs for Three.js objects
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const particlesRef = useRef<THREE.Points | null>(null);
  const targetPositionsRef = useRef<THREE.Vector3[]>([]);
  const currentPositionsRef = useRef<Float32Array | null>(null);
  const velocitiesRef = useRef<Float32Array | null>(null);
  const animationFrameRef = useRef<number>(0);
  const gestureRef = useRef<GestureState>(gestureState);
  const explosionRef = useRef<number>(0);
  const timeRef = useRef<number>(0);
  
  const PARTICLE_COUNT = 3000;
  
  // Update ref when state changes
  useEffect(() => {
    gestureRef.current = gestureState;
  }, [gestureState]);
  
  // Initialize Three.js scene
  const initThreeJS = useCallback(() => {
    if (!containerRef.current) return;
    
    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000011);
    scene.fog = new THREE.FogExp2(0x000011, 0.05);
    sceneRef.current = scene;
    
    // Camera
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.z = 8;
    cameraRef.current = camera;
    
    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;
    
    // Initialize particles
    initParticles(scene);
    
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    
    // Handle resize
    const handleResize = () => {
      if (!cameraRef.current || !rendererRef.current) return;
      cameraRef.current.aspect = window.innerWidth / window.innerHeight;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
    };
  }, []);
  
  // Initialize particles
  const initParticles = (scene: THREE.Scene) => {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const colors = new Float32Array(PARTICLE_COUNT * 3);
    const sizes = new Float32Array(PARTICLE_COUNT);
    
    velocitiesRef.current = new Float32Array(PARTICLE_COUNT * 3);
    
    // Generate initial positions
    const templatePositions = generateTemplatePositions('sphere', PARTICLE_COUNT);
    targetPositionsRef.current = templatePositions;
    
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const pos = templatePositions[i] || new THREE.Vector3(
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 10
      );
      
      positions[i * 3] = pos.x;
      positions[i * 3 + 1] = pos.y;
      positions[i * 3 + 2] = pos.z;
      
      // Initial colors
      const color = new THREE.Color();
      color.setHSL(i / PARTICLE_COUNT, 0.8, 0.6);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
      
      sizes[i] = Math.random() * 0.1 + 0.05;
      
      // Random initial velocities
      velocitiesRef.current[i * 3] = (Math.random() - 0.5) * 0.01;
      velocitiesRef.current[i * 3 + 1] = (Math.random() - 0.5) * 0.01;
      velocitiesRef.current[i * 3 + 2] = (Math.random() - 0.5) * 0.01;
    }
    
    currentPositionsRef.current = positions;
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    
    // Shader material for better looking particles
    const material = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        pointTexture: { value: createParticleTexture() },
      },
      vertexShader: `
        attribute float size;
        varying vec3 vColor;
        varying float vSize;
        uniform float time;
        
        void main() {
          vColor = color;
          vSize = size;
          
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * (300.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform sampler2D pointTexture;
        varying vec3 vColor;
        varying float vSize;
        
        void main() {
          vec2 uv = gl_PointCoord - vec2(0.5);
          float dist = length(uv);
          
          if (dist > 0.5) discard;
          
          float alpha = 1.0 - smoothstep(0.3, 0.5, dist);
          float glow = exp(-dist * 3.0) * 0.5;
          
          vec3 finalColor = vColor + glow;
          gl_FragColor = vec4(finalColor, alpha);
        }
      `,
      blending: THREE.AdditiveBlending,
      depthTest: false,
      transparent: true,
      vertexColors: true,
    });
    
    const particles = new THREE.Points(geometry, material);
    scene.add(particles);
    particlesRef.current = particles;
  };
  
  // Create particle texture
  const createParticleTexture = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;
    
    const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.8)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 64, 64);
    
    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  };
  
  // Update particle colors based on palette
  const updateColors = useCallback((palette: keyof typeof colorPalettes, time: number) => {
    if (!particlesRef.current) return;
    
    const colors = particlesRef.current.geometry.attributes.color;
    const paletteColors = colorPalettes[palette];
    
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const colorIndex = Math.floor((i / PARTICLE_COUNT + time * 0.1) * paletteColors.length) % paletteColors.length;
      const nextIndex = (colorIndex + 1) % paletteColors.length;
      const t = ((i / PARTICLE_COUNT + time * 0.1) * paletteColors.length) % 1;
      
      const color1 = new THREE.Color(paletteColors[colorIndex]);
      const color2 = new THREE.Color(paletteColors[nextIndex]);
      const color = color1.lerp(color2, t);
      
      colors.array[i * 3] = color.r;
      colors.array[i * 3 + 1] = color.g;
      colors.array[i * 3 + 2] = color.b;
    }
    
    colors.needsUpdate = true;
  }, []);
  
  // Change template
  const changeTemplate = useCallback((template: ParticleTemplate) => {
    setCurrentTemplate(template);
    targetPositionsRef.current = generateTemplatePositions(template, PARTICLE_COUNT);
    
    // Trigger a small explosion effect on template change
    explosionRef.current = 0.5;
  }, []);
  
  // Animation loop
  const animate = useCallback(() => {
    animationFrameRef.current = requestAnimationFrame(animate);
    timeRef.current += 0.016;
    
    if (!particlesRef.current || !cameraRef.current || !rendererRef.current || !sceneRef.current) return;
    
    const positions = particlesRef.current.geometry.attributes.position;
    const sizes = particlesRef.current.geometry.attributes.size;
    const gesture = gestureRef.current;
    const time = timeRef.current;
    
    // Update particle positions
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const target = targetPositionsRef.current[i];
      if (!target) continue;
      
      let px = positions.array[i * 3];
      let py = positions.array[i * 3 + 1];
      let pz = positions.array[i * 3 + 2];
      
      // Apply spread based on gesture
      const spreadFactor = gesture.spread;
      const targetX = target.x * spreadFactor;
      const targetY = target.y * spreadFactor;
      const targetZ = target.z * spreadFactor;
      
      // Move towards hand position if detected
      let offsetX = 0;
      let offsetY = 0;
      
      if (gesture.handPosition) {
        offsetX = (gesture.handPosition.x - 0.5) * 6;
        offsetY = (0.5 - gesture.handPosition.y) * 6;
      }
      
      // Explosion effect
      if (explosionRef.current > 0) {
        const explosionForce = explosionRef.current * 0.5;
        velocitiesRef.current![i * 3] += (Math.random() - 0.5) * explosionForce;
        velocitiesRef.current![i * 3 + 1] += (Math.random() - 0.5) * explosionForce;
        velocitiesRef.current![i * 3 + 2] += (Math.random() - 0.5) * explosionForce;
      }
      
      // Add some noise for organic movement
      const noise = Math.sin(time * 2 + i * 0.1) * 0.02;
      
      // Spring physics towards target
      const springStrength = 0.03;
      const damping = 0.92;
      
      velocitiesRef.current![i * 3] += (targetX + offsetX - px) * springStrength + noise;
      velocitiesRef.current![i * 3 + 1] += (targetY + offsetY - py) * springStrength + noise;
      velocitiesRef.current![i * 3 + 2] += (targetZ - pz) * springStrength;
      
      // Apply damping
      velocitiesRef.current![i * 3] *= damping;
      velocitiesRef.current![i * 3 + 1] *= damping;
      velocitiesRef.current![i * 3 + 2] *= damping;
      
      // Update positions
      px += velocitiesRef.current![i * 3];
      py += velocitiesRef.current![i * 3 + 1];
      pz += velocitiesRef.current![i * 3 + 2];
      
      positions.array[i * 3] = px;
      positions.array[i * 3 + 1] = py;
      positions.array[i * 3 + 2] = pz;
      
      // Animate sizes based on gesture
      const baseSize = 0.08;
      const sizeVariation = gesture.gesture === 'pinch' ? 0.15 : 0.05;
      sizes.array[i] = baseSize + Math.sin(time * 3 + i * 0.05) * sizeVariation;
    }
    
    positions.needsUpdate = true;
    sizes.needsUpdate = true;
    
    // Decay explosion
    explosionRef.current *= 0.95;
    if (explosionRef.current < 0.01) explosionRef.current = 0;
    
    // Update colors
    updateColors(currentPalette, time);
    
    // Rotate scene slightly
    particlesRef.current.rotation.y = Math.sin(time * 0.2) * 0.3;
    particlesRef.current.rotation.x = Math.sin(time * 0.15) * 0.1;
    
    // Update shader uniforms
    (particlesRef.current.material as THREE.ShaderMaterial).uniforms.time.value = time;
    
    rendererRef.current.render(sceneRef.current, cameraRef.current);
  }, [currentPalette, updateColors]);
  
  // Initialize hand tracking
  const initHandTracking = useCallback(async () => {
    if (!videoRef.current) return;
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 640, height: 480 }
      });
      
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      
      // Dynamically import MediaPipe Hands
      const { Hands } = await import('@mediapipe/hands');
      const { Camera } = await import('@mediapipe/camera_utils');
      
      const hands = new Hands({
        locateFile: (file) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
        }
      });
      
      hands.setOptions({
        maxNumHands: 1,
        modelComplexity: 1,
        minDetectionConfidence: 0.7,
        minTrackingConfidence: 0.5
      });
      
      hands.onResults((results) => {
        if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
          const landmarks = results.multiHandLandmarks[0];
          
          // Get palm center (average of wrist and middle finger base)
          const palmX = (landmarks[0].x + landmarks[9].x) / 2;
          const palmY = (landmarks[0].y + landmarks[9].y) / 2;
          
          // Calculate finger spread (distance from thumb tip to pinky tip)
          const thumbTip = landmarks[4];
          const pinkyTip = landmarks[20];
          const indexTip = landmarks[8];
          const spread = Math.sqrt(
            Math.pow(thumbTip.x - pinkyTip.x, 2) +
            Math.pow(thumbTip.y - pinkyTip.y, 2)
          );
          
          // Detect gestures
          let gesture = 'open';
          
          // Check for closed fist (all fingertips below their respective PIP joints)
          const fingertips = [landmarks[8], landmarks[12], landmarks[16], landmarks[20]];
          const pips = [landmarks[6], landmarks[10], landmarks[14], landmarks[18]];
          const fingersClosed = fingertips.every((tip, i) => tip.y > pips[i].y);
          
          if (fingersClosed) {
            gesture = 'fist';
          }
          
          // Check for pinch (thumb and index close together)
          const pinchDist = Math.sqrt(
            Math.pow(thumbTip.x - indexTip.x, 2) +
            Math.pow(thumbTip.y - indexTip.y, 2)
          );
          
          if (pinchDist < 0.08) {
            gesture = 'pinch';
          }
          
          // Check for peace sign (index and middle up, others down)
          const indexUp = landmarks[8].y < landmarks[6].y;
          const middleUp = landmarks[12].y < landmarks[10].y;
          const ringDown = landmarks[16].y > landmarks[14].y;
          const pinkyDown = landmarks[20].y > landmarks[18].y;
          
          if (indexUp && middleUp && ringDown && pinkyDown) {
            gesture = 'peace';
          }
          
          // Map spread to expansion factor (1.0 - 3.0)
          const spreadFactor = 1.0 + spread * 5;
          
          setGestureState({
            gesture,
            handPosition: { x: palmX, y: palmY },
            spread: gesture === 'fist' ? 0.3 : spreadFactor,
            isDetecting: true,
          });
        } else {
          setGestureState(prev => ({
            ...prev,
            handPosition: null,
            isDetecting: false,
          }));
        }
      });
      
      const camera = new Camera(videoRef.current, {
        onFrame: async () => {
          if (videoRef.current) {
            await hands.send({ image: videoRef.current });
          }
        },
        width: 640,
        height: 480
      });
      
      camera.start();
      setLoading(false);
      
    } catch (error) {
      console.error('Error initializing hand tracking:', error);
      setLoading(false);
      // Continue without hand tracking
    }
  }, []);
  
  // Keyboard controls for templates
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      const templates: ParticleTemplate[] = ['heart', 'flower', 'saturn', 'firework', 'spiral', 'sphere', 'star', 'butterfly'];
      const num = parseInt(e.key);
      if (num >= 1 && num <= 8) {
        changeTemplate(templates[num - 1]);
      }
      
      // Color palette shortcuts
      const palettes = Object.keys(colorPalettes) as (keyof typeof colorPalettes)[];
      if (e.key === 'c') {
        const currentIndex = palettes.indexOf(currentPalette);
        const nextIndex = (currentIndex + 1) % palettes.length;
        setCurrentPalette(palettes[nextIndex]);
      }
      
      // Space for explosion
      if (e.key === ' ') {
        explosionRef.current = 1;
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [changeTemplate, currentPalette]);
  
  // Initialize everything
  useEffect(() => {
    initThreeJS();
    initHandTracking();
    animate();
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [initThreeJS, initHandTracking, animate]);
  
  const templates: { name: string; value: ParticleTemplate; emoji: string }[] = [
    { name: 'Heart', value: 'heart', emoji: '❤️' },
    { name: 'Flower', value: 'flower', emoji: '🌸' },
    { name: 'Saturn', value: 'saturn', emoji: '🪐' },
    { name: 'Firework', value: 'firework', emoji: '🎆' },
    { name: 'Spiral', value: 'spiral', emoji: '🌀' },
    { name: 'Sphere', value: 'sphere', emoji: '🔮' },
    { name: 'Star', value: 'star', emoji: '⭐' },
    { name: 'Butterfly', value: 'butterfly', emoji: '🦋' },
  ];
  
  const paletteColors = {
    rainbow: 'linear-gradient(90deg, red, orange, yellow, green, blue, violet)',
    sunset: 'linear-gradient(90deg, #ff6b6b, #feca57, #ff9ff3)',
    ocean: 'linear-gradient(90deg, #00d2d3, #54a0ff, #5f27cd)',
    forest: 'linear-gradient(90deg, #00b894, #55efc4, #00cec9)',
    fire: 'linear-gradient(90deg, #ff4757, #ff6348, #ffa502)',
    neon: 'linear-gradient(90deg, #00ff87, #60efff, #ff00c3)',
  };
  
  return (
    <>
      {loading && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
          <div className="loading-text">Initializing particle system & camera...</div>
        </div>
      )}
      
      <div id="canvas-container" ref={containerRef}></div>
      
      <div id="video-container">
        <video ref={videoRef} id="webcam" playsInline autoPlay muted></video>
      </div>
      
      <div id="controls">
        <h2>🌟 Particle Templates</h2>
        <div className="template-buttons">
          {templates.map((t) => (
            <button
              key={t.value}
              className={`template-btn ${currentTemplate === t.value ? 'active' : ''}`}
              onClick={() => changeTemplate(t.value)}
            >
              {t.emoji} {t.name}
            </button>
          ))}
        </div>
        
        <div className="color-picker-container">
          <h3>🎨 Color Palette</h3>
          <div className="color-presets">
            {(Object.keys(colorPalettes) as (keyof typeof colorPalettes)[]).map((palette) => (
              <div
                key={palette}
                className={`color-preset ${currentPalette === palette ? 'active' : ''}`}
                style={{ background: paletteColors[palette] }}
                onClick={() => setCurrentPalette(palette)}
                title={palette}
              />
            ))}
          </div>
        </div>
        
        <div className="gesture-info">
          <h3>✋ Gesture Controls</h3>
          <div className="gesture-item">
            <span className="gesture-icon">👋</span>
            <span>Open hand: Expand particles</span>
          </div>
          <div className="gesture-item">
            <span className="gesture-icon">✊</span>
            <span>Fist: Contract particles</span>
          </div>
          <div className="gesture-item">
            <span className="gesture-icon">🤏</span>
            <span>Pinch: Pulse effect</span>
          </div>
          <div className="gesture-item">
            <span className="gesture-icon">✌️</span>
            <span>Peace: Wave pattern</span>
          </div>
          <div className="gesture-item">
            <span className="gesture-icon">⌨️</span>
            <span>Space: Explosion!</span>
          </div>
        </div>
      </div>
      
      <div id="status">
        <span className={`status-indicator ${gestureState.isDetecting ? 'detecting' : 'waiting'}`}></span>
        {gestureState.isDetecting 
          ? `Detecting: ${gestureState.gesture.toUpperCase()}`
          : 'Waiting for hand...'}
      </div>
      
      <div id="current-gesture" className={gestureState.isDetecting ? 'visible' : ''}>
        {gestureState.gesture === 'fist' && '✊'}
        {gestureState.gesture === 'open' && '👋'}
        {gestureState.gesture === 'pinch' && '🤏'}
        {gestureState.gesture === 'peace' && '✌️'}
      </div>
    </>
  );
}
