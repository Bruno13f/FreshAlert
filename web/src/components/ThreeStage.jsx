import React, { useEffect, useRef } from "react";
import {
  Scene,
  PerspectiveCamera,
  WebGLRenderer,
  BoxGeometry,
  MeshStandardMaterial,
  Mesh,
  AmbientLight,
  DirectionalLight,
  Color,
  Clock,
} from "three";

const ThreeStage = () => {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const renderer = new WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
    });
    renderer.setClearColor(new Color(0x000000), 0);

    const scene = new Scene();
    const camera = new PerspectiveCamera(60, 1, 0.1, 100);
    camera.position.set(0, 0, 3);

    const ambientLight = new AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    const directionalLight = new DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(2, 4, 3);
    scene.add(directionalLight);

    const geometry = new BoxGeometry(1, 1, 1);
    const material = new MeshStandardMaterial({
      color: 0x61dafb,
      roughness: 0.4,
      metalness: 0.1,
    });
    const cube = new Mesh(geometry, material);
    scene.add(cube);

    const handleResize = () => {
      const rect = container.getBoundingClientRect();
      const width = Math.max(1, Math.floor(rect.width));
      const height = Math.max(1, Math.floor(rect.height));
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      renderer.setPixelRatio(dpr);
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    const clock = new Clock();
    let animationFrameId = 0;
    let isDisposed = false;
    const render = () => {
      if (isDisposed) return;
      const delta = clock.getDelta();
      cube.rotation.x += delta * 0.6;
      cube.rotation.y += delta * 0.8;
      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(render);
    };
    animationFrameId = requestAnimationFrame(render);

    return () => {
      isDisposed = true;
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div className="three-stage" ref={containerRef}>
      <canvas className="three-stage-canvas" ref={canvasRef} />
    </div>
  );
};

export default ThreeStage;
