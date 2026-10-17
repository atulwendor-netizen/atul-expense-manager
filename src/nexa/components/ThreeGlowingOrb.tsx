import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

interface ThreeGlowingOrbProps {
  reducedMotion?: boolean;
}

export const ThreeGlowingOrb: React.FC<ThreeGlowingOrbProps> = ({ reducedMotion = false }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hasWebGL, setHasWebGL] = useState(true);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Check WebGL availability
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) {
        setHasWebGL(false);
        return;
      }
    } catch {
      setHasWebGL(false);
      return;
    }

    let animationFrameId: number;
    const width = container.clientWidth || 500;
    const height = container.clientHeight || 500;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.z = 7;

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // 2. Core Glowing Group
    const coreGroup = new THREE.Group();
    scene.add(coreGroup);

    // Outer Wireframe Polyhedron
    const outerGeo = new THREE.IcosahedronGeometry(2.3, 2);
    const outerMat = new THREE.MeshStandardMaterial({
      color: 0x4f46e5,
      wireframe: true,
      emissive: 0x3b82f6,
      emissiveIntensity: 0.6,
      roughness: 0.2,
      metalness: 0.8,
    });
    const outerMesh = new THREE.Mesh(outerGeo, outerMat);
    coreGroup.add(outerMesh);

    // Inner Solid Glowing Sphere
    const innerGeo = new THREE.SphereGeometry(1.3, 32, 32);
    const innerMat = new THREE.MeshStandardMaterial({
      color: 0x06b6d4,
      emissive: 0x8b5cf6,
      emissiveIntensity: 0.9,
      roughness: 0.1,
      metalness: 0.5,
      transparent: true,
      opacity: 0.85,
    });
    const innerMesh = new THREE.Mesh(innerGeo, innerMat);
    coreGroup.add(innerMesh);

    // Orbiting Geometric Ring 1
    const ring1Geo = new THREE.TorusGeometry(2.8, 0.03, 16, 100);
    const ring1Mat = new THREE.MeshBasicMaterial({
      color: 0x60a5fa,
      transparent: true,
      opacity: 0.7,
    });
    const ring1 = new THREE.Mesh(ring1Geo, ring1Mat);
    ring1.rotation.x = Math.PI / 3;
    coreGroup.add(ring1);

    // Orbiting Geometric Ring 2
    const ring2Geo = new THREE.TorusGeometry(3.1, 0.02, 16, 100);
    const ring2Mat = new THREE.MeshBasicMaterial({
      color: 0xc084fc,
      transparent: true,
      opacity: 0.5,
    });
    const ring2 = new THREE.Mesh(ring2Geo, ring2Mat);
    ring2.rotation.y = Math.PI / 4;
    ring2.rotation.x = -Math.PI / 6;
    coreGroup.add(ring2);

    // Surrounding Particle Field
    const particleCount = 450;
    const particleGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    const color1 = new THREE.Color(0x38bdf8); // electric cyan
    const color2 = new THREE.Color(0xa855f7); // vivid purple

    for (let i = 0; i < particleCount; i++) {
      const radius = 2.5 + Math.random() * 2.5;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);

      const mixedColor = color1.clone().lerp(color2, Math.random());
      colors[i * 3] = mixedColor.r;
      colors[i * 3 + 1] = mixedColor.g;
      colors[i * 3 + 2] = mixedColor.b;
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const particleMat = new THREE.PointsMaterial({
      size: 0.05,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
    });

    const particles = new THREE.Points(particleGeo, particleMat);
    coreGroup.add(particles);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const blueLight = new THREE.PointLight(0x3b82f6, 3, 50);
    blueLight.position.set(5, 4, 5);
    scene.add(blueLight);

    const violetLight = new THREE.PointLight(0x8b5cf6, 3, 50);
    violetLight.position.set(-5, -4, 4);
    scene.add(violetLight);

    // Mouse Interaction
    let mouseX = 0;
    let mouseY = 0;
    let targetRotationX = 0;
    let targetRotationY = 0;

    const handleMouseMove = (event: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = event.clientX - rect.left - rect.width / 2;
      const y = event.clientY - rect.top - rect.height / 2;
      mouseX = (x / rect.width) * 2;
      mouseY = (y / rect.height) * 2;
    };

    window.addEventListener('mousemove', handleMouseMove);

    // Scroll-Linked Transformation
    let scrollY = 0;
    const handleScroll = () => {
      scrollY = window.scrollY;
    };
    window.addEventListener('scroll', handleScroll, { passive: true });

    // Handle Resize
    const handleResize = () => {
      if (!container) return;
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };

    window.addEventListener('resize', handleResize);

    // Animation Loop
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      const speedMultiplier = reducedMotion ? 0.2 : 1;

      // Base rotations
      outerMesh.rotation.x = elapsedTime * 0.15 * speedMultiplier;
      outerMesh.rotation.y = elapsedTime * 0.2 * speedMultiplier;

      innerMesh.rotation.y = -elapsedTime * 0.25 * speedMultiplier;

      ring1.rotation.z = elapsedTime * 0.3 * speedMultiplier;
      ring2.rotation.z = -elapsedTime * 0.25 * speedMultiplier;

      particles.rotation.y = elapsedTime * 0.05 * speedMultiplier;

      // Pulse inner core
      const pulse = 1 + Math.sin(elapsedTime * 2) * 0.05;
      innerMesh.scale.set(pulse, pulse, pulse);

      // Smooth mouse follow
      targetRotationY += (mouseX * 0.5 - targetRotationY) * 0.05;
      targetRotationX += (mouseY * 0.5 - targetRotationX) * 0.05;

      // Scroll linked rotation
      const scrollRotation = scrollY * 0.0015;

      coreGroup.rotation.y = targetRotationY + scrollRotation;
      coreGroup.rotation.x = targetRotationX;

      // Gentle scale based on scroll
      const scaleFromScroll = Math.max(0.75, 1 - scrollY * 0.0004);
      coreGroup.scale.set(scaleFromScroll, scaleFromScroll, scaleFromScroll);

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);

      if (container && renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }

      // Dispose memory
      outerGeo.dispose();
      outerMat.dispose();
      innerGeo.dispose();
      innerMat.dispose();
      ring1Geo.dispose();
      ring1Mat.dispose();
      ring2Geo.dispose();
      ring2Mat.dispose();
      particleGeo.dispose();
      particleMat.dispose();
      renderer.dispose();
    };
  }, [reducedMotion]);

  if (!hasWebGL) {
    // Fallback: Pure CSS 3D glowing sphere
    return (
      <div className="relative flex items-center justify-center w-full h-full min-h-[420px]">
        <div className="relative w-64 h-64 rounded-full bg-gradient-to-tr from-blue-600 via-indigo-500 to-violet-500 blur-xl opacity-70 animate-pulse-glow" />
        <div className="absolute w-48 h-48 rounded-full border-2 border-cyan-400/50 animate-spin" style={{ animationDuration: '12s' }} />
        <div className="absolute w-60 h-60 rounded-full border border-violet-400/40 animate-spin" style={{ animationDuration: '18s', animationDirection: 'reverse' }} />
        <div className="absolute w-36 h-36 rounded-full bg-gradient-to-br from-cyan-400/20 to-blue-600/40 backdrop-blur-md border border-white/20 shadow-2xl flex items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-blue-500/80 shadow-[0_0_40px_#3b82f6]" />
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full min-h-[380px] sm:min-h-[460px] lg:min-h-[540px] flex items-center justify-center pointer-events-auto cursor-grab active:cursor-grabbing select-none"
      aria-label="Interactive 3D Nexa Neural Core Orb"
    />
  );
};
