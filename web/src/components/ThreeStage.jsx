import React, {
  useEffect,
  useRef,
  useState,
  useImperativeHandle,
  forwardRef,
} from "react";
import {
  Scene,
  PerspectiveCamera,
  WebGLRenderer,
  PlaneGeometry,
  BoxGeometry,
  CylinderGeometry,
  TextureLoader,
  MeshStandardMaterial,
  MeshBasicMaterial,
  Mesh,
  AmbientLight,
  DirectionalLight,
  Color,
  Clock,
  CanvasTexture,
  RepeatWrapping,
  LinearFilter,
} from "three";

const ThreeStage = forwardRef(
  (
    {
      speed = 0.8,
      direction = 1,
      showFrame = true,
      numBoxes = 4,
      scale = 1.3,
      frameScale = 1.35,
      imageScale = 1,
      zoomOnPause = true,
      zoomSeconds = 0.35,
      pauseOnCenter = true,
      pauseSeconds = 1.2,
      centerThreshold = 0.05,
      confirmOnPause = true,
      visibleCount = 8,
      onItemPaused = null, // Callback when item is paused for approval
      onItemProcessed = null, // Callback when item is accepted/rejected
    } = {},
    ref
  ) => {
    const containerRef = useRef(null);
    const canvasRef = useRef(null);
    const speedRef = useRef(speed);
    const directionRef = useRef(direction);
    const [awaitingChoice, setAwaitingChoice] = useState(false);
    const resumeRef = useRef(() => {});
    const rejectRef = useRef(() => {});
    const itemsRef = useRef([]);
    const pausedItemRef = useRef(null);
    const trackStartRef = useRef(0);
    const trackLengthRef = useRef(0);
    const beltLengthRef = useRef(0);

    // Keep latest props in refs so animation loop reads fresh values without re-creating the scene
    useEffect(() => {
      speedRef.current = speed;
    }, [speed]);
    useEffect(() => {
      directionRef.current = direction;
    }, [direction]);

    // Expose methods to parent component
    useImperativeHandle(
      ref,
      () => ({
        acceptCurrentItem: () => {
          if (pausedItemRef.current && awaitingChoice) {
            console.log("🟢 Accepting current item via external control");
            const item = pausedItemRef.current;
            resumeRef.current();
            if (onItemProcessed) {
              onItemProcessed("accepted", item);
            }
          }
        },
        rejectCurrentItem: () => {
          if (pausedItemRef.current && awaitingChoice) {
            console.log("🔴 Rejecting current item via external control");
            const item = pausedItemRef.current;
            rejectRef.current();
            if (onItemProcessed) {
              onItemProcessed("rejected", item);
            }
          }
        },
        isAwaitingChoice: () => awaitingChoice,
        getCurrentItem: () => pausedItemRef.current,
      }),
      [awaitingChoice, onItemProcessed]
    );

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

      // Create a procedural, repeating texture for a conveyor belt look
      const createBeltTexture = () => {
        const canvas = document.createElement("canvas");
        canvas.width = 512;
        canvas.height = 64;
        const ctx = canvas.getContext("2d");
        if (!ctx) return new CanvasTexture(canvas);

        // Base belt color
        ctx.fillStyle = "#2f2f2f";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Subtle top and bottom highlights for depth
        const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
        grad.addColorStop(0, "rgba(255,255,255,0.06)");
        grad.addColorStop(0.5, "rgba(255,255,255,0)");
        grad.addColorStop(1, "rgba(0,0,0,0.12)");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw repeating slats/cleats
        const stripeWidth = 32;
        for (let x = 0; x < canvas.width; x += stripeWidth) {
          // Dark gap
          ctx.fillStyle = "#262626";
          ctx.fillRect(x, 0, stripeWidth, canvas.height);
          // Raised cleat in the middle
          ctx.fillStyle = "#3a3a3a";
          const cleatWidth = Math.floor(stripeWidth * 0.5);
          const cleatX = x + Math.floor((stripeWidth - cleatWidth) / 2);
          ctx.fillRect(cleatX, 6, cleatWidth, canvas.height - 12);
          // Small highlight on cleat
          ctx.fillStyle = "rgba(255,255,255,0.06)";
          ctx.fillRect(cleatX, 6, cleatWidth, 4);
        }

        const texture = new CanvasTexture(canvas);
        texture.wrapS = RepeatWrapping;
        texture.wrapT = RepeatWrapping;
        // Repeat many times horizontally to sell motion
        texture.repeat.set(8, 1);
        return texture;
      };

      const beltTexture = createBeltTexture();
      const beltLength = 3.2 * scale;
      const beltWidth = 0.8 * scale;
      const beltGeometry = new PlaneGeometry(beltLength, beltWidth);
      const beltMaterial = new MeshStandardMaterial({
        map: beltTexture,
        color: 0xffffff,
        roughness: 0.8,
        metalness: 0.05,
      });
      const belt = new Mesh(beltGeometry, beltMaterial);
      // Face camera (XY plane by default). Slight tilt for depth.
      belt.rotation.x = -0.15;
      scene.add(belt);

      // Optional frame: side rails and end rollers
      let railGeometry = null;
      let railMaterial = null;
      let leftRail = null;
      let rightRail = null;
      let rollerGeometry = null;
      let rollerMaterial = null;
      let frontRoller = null;
      let backRoller = null;

      if (showFrame) {
        // Side rails (thin beams along the belt length)
        const railThickness = 0.06 * scale * frameScale;
        railGeometry = new BoxGeometry(
          beltLength,
          railThickness,
          railThickness
        );
        railMaterial = new MeshStandardMaterial({
          color: 0x444444,
          roughness: 0.6,
          metalness: 0.4,
        });

        leftRail = new Mesh(railGeometry, railMaterial);
        const railZOffset = -0.05 * scale;
        leftRail.position.set(
          0,
          beltWidth / 2 + railThickness / 2,
          railZOffset
        );
        leftRail.rotation.x = -0.15;
        scene.add(leftRail);

        rightRail = new Mesh(railGeometry, railMaterial);
        rightRail.position.set(
          0,
          -beltWidth / 2 - railThickness / 2,
          railZOffset
        );
        rightRail.rotation.x = -0.15;
        scene.add(rightRail);

        // End rollers
        const rollerRadius = 0.06 * scale * frameScale;
        rollerGeometry = new CylinderGeometry(
          rollerRadius,
          rollerRadius,
          beltWidth,
          32
        );
        rollerMaterial = new MeshStandardMaterial({
          color: 0x666666,
          roughness: 0.25,
          metalness: 0.8,
        });

        frontRoller = new Mesh(rollerGeometry, rollerMaterial);
        frontRoller.position.set(beltLength / 2, 0, 0.02 * scale);
        frontRoller.rotation.x = -0.15; // match belt tilt
        scene.add(frontRoller);

        backRoller = new Mesh(rollerGeometry, rollerMaterial);
        backRoller.position.set(-beltLength / 2, 0, 0.02 * scale);
        backRoller.rotation.x = -0.15; // match belt tilt
        scene.add(backRoller);
      }

      // Items moving along the belt: use an image from public (images.jpeg). Fallback to boxes if load fails.
      const items = [];
      let boxGeometry = null;
      let boxMaterial = null;
      let imageGeometry = null;
      let imageMaterial = null;
      let imageTexture = null;

      const loader = new TextureLoader();
      const usableLength = beltLength * 0.9; // keep a margin from rollers
      // no fixed total; we stream textures based on manifest size

      const createImagePlane = () => {
        const basePlaneSize = 0.22 * scale * imageScale;
        if (!imageGeometry)
          imageGeometry = new PlaneGeometry(basePlaneSize, basePlaneSize);
        // start with a transparent placeholder so renderer never sees null material
        const placeholder = new MeshBasicMaterial({
          transparent: true,
          opacity: 0,
        });
        const mesh = new Mesh(imageGeometry, placeholder);
        mesh.rotation.x = -0.15;
        // Keep aspect after texture loads by scaling X in onLoad below
        return mesh;
      };

      // Cache and manifest driven image streaming
      const textureCache = new Map();
      let manifestUrls = [];
      const meshToUrl = new WeakMap();

      const setMeshTexture = (mesh, texture, url) => {
        if (
          !mesh.material ||
          !(mesh.material instanceof MeshStandardMaterial)
        ) {
          mesh.material = new MeshStandardMaterial({
            roughness: 1,
            metalness: 0,
          });
        }
        mesh.material.map = texture;
        mesh.material.transparent = true;
        mesh.material.opacity = 1;
        mesh.material.needsUpdate = true;
        const img = texture.image;
        const aspect = img && img.height ? img.width / img.height : 1;
        mesh.scale.set(aspect, 1, 1);
        if (url) meshToUrl.set(mesh, url);
      };

      const loadTexture = (url, onReady) => {
        if (textureCache.has(url)) {
          onReady(textureCache.get(url));
          return;
        }
        loader.load(
          url,
          (tex) => {
            tex.minFilter = LinearFilter;
            tex.magFilter = LinearFilter;
            tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
            textureCache.set(url, tex);
            onReady(tex);
          },
          undefined,
          () => onReady(null)
        );
      };

      const pickRandomUrl = (prevUrl) => {
        const n = manifestUrls.length;
        if (n === 0) return null;
        let idx = Math.floor(Math.random() * n);
        // Avoid immediate repeat when possible
        if (n > 1 && manifestUrls[idx] === prevUrl) {
          idx = (idx + 1 + Math.floor(Math.random() * (n - 1))) % n;
        }
        return manifestUrls[idx];
      };

      const assignNextTextureToMesh = (mesh) => {
        if (!manifestUrls.length) return;
        const prevUrl = meshToUrl.get(mesh);
        const url = pickRandomUrl(prevUrl);
        if (!url) return;
        loadTexture(url, (tex) => {
          if (tex) setMeshTexture(mesh, tex, url);
        });
      };

      const createItemsWithInitialTextures = () => {
        // number of concurrent visible items (bounded for perf)
        const count = Math.min(
          manifestUrls.length || visibleCount,
          visibleCount
        );
        for (let i = 0; i < Math.max(1, count); i++) {
          const plane = createImagePlane();
          const t = i / Math.max(1, count);
          const startX = -usableLength / 2 + t * usableLength;
          plane.position.set(startX, 0, 0.061 * scale);
          scene.add(plane);
          items.push(plane);
          assignNextTextureToMesh(plane);
        }
        itemsRef.current = items;
      };

      // Load manifest and initialize stream
      fetch("/valid/manifest.json")
        .then((res) => (res.ok ? res.json() : Promise.reject()))
        .then((urls) => {
          manifestUrls = Array.isArray(urls) ? urls.filter(Boolean) : [];
          if (!manifestUrls.length) throw new Error("empty");
          createItemsWithInitialTextures();
        })
        .catch(() => {
          // fallback to a single public image
          loadTexture("/images.jpeg", (tex) => {
            if (tex) {
              manifestUrls = ["/images.jpeg"];
              createItemsWithInitialTextures();
            } else {
              // Final fallback: boxes
              boxGeometry = new BoxGeometry(
                0.28 * scale,
                0.18 * scale,
                0.18 * scale
              );
              boxMaterial = new MeshStandardMaterial({
                color: 0xb9773b,
                roughness: 0.9,
                metalness: 0.05,
              });
              const totalBoxes = 6;
              for (let i = 0; i < totalBoxes; i++) {
                const box = new Mesh(boxGeometry, boxMaterial);
                const t = i / totalBoxes;
                const startX = -usableLength / 2 + t * usableLength;
                box.position.set(startX, 0, 0.06 * scale);
                box.rotation.x = -0.15;
                scene.add(box);
                items.push(box);
              }
              itemsRef.current = items;
            }
          });
        });

      // Fullscreen overlay (for zoom on pause)
      const overlayGeometry = new PlaneGeometry(1, 1);
      const overlayMaterial = new MeshBasicMaterial({
        transparent: true,
        opacity: 1,
        depthTest: false,
        depthWrite: false,
      });
      const overlayMesh = new Mesh(overlayGeometry, overlayMaterial);
      overlayMesh.visible = false;
      overlayMesh.renderOrder = 999;
      overlayMesh.position.set(0, 0, 0.5);
      scene.add(overlayMesh);

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
      let beltPhase = 0; // time-accumulated phase along the track for constant spacing
      let isPaused = false;
      let pauseUntilT = 0;
      const lastItemXs = new Map();
      let zoomProgress = 0;
      let zoomTarget = 0;
      const fadeTargets = new Map(); // mesh -> 0 (fade out) or 1 (fade in)
      beltLengthRef.current = beltLength;
      // Hook up external handlers for UI buttons
      resumeRef.current = () => {
        if (isDisposed) return;
        isPaused = false;
        pauseUntilT = 0;
        pausedItemRef.current = null;
        setAwaitingChoice(false);
        if (overlayMesh) {
          zoomTarget = 0;
          // Do not touch overlayMesh.visible directly to avoid null-visible timing issues
          zoomProgress = 0;
        }
      };
      rejectRef.current = () => {
        if (isDisposed) return;
        const mesh = pausedItemRef.current;
        if (mesh) {
          const arr = itemsRef.current;
          const idx = arr.indexOf(mesh);
          if (idx >= 0) {
            // start fade-out; keep moving until wrap
            if (mesh.material) {
              mesh.material.transparent = true;
              // ensure we start from 1 before fading to 0
              if (mesh.material.opacity === undefined)
                mesh.material.opacity = 1;
            }
            fadeTargets.set(mesh, 0);
          }
        }
        isPaused = false;
        pauseUntilT = 0;
        pausedItemRef.current = null;
        setAwaitingChoice(false);
        if (overlayMesh) {
          zoomTarget = 0;
          overlayMesh.visible = false;
          zoomProgress = 0;
        }
      };
      const render = () => {
        if (isDisposed) return;
        const delta = clock.getDelta();
        const nowT = clock.getElapsedTime();
        const currentSpeed = speedRef.current;
        const currentDir = Math.sign(directionRef.current || 1) || 1;
        const signedSpeed = currentSpeed * currentDir;

        // Scroll the belt texture to simulate motion (only when not paused)
        if (!isPaused && beltMaterial.map) {
          // Keep slat density similar as size changes
          beltMaterial.map.repeat.set(8 * scale, 1);
          beltMaterial.map.offset.x += delta * signedSpeed;
        }

        // Spin rollers to match belt direction (only when not paused)
        if (!isPaused && frontRoller && backRoller) {
          const rollerSpin = delta * signedSpeed * 4.0; // tuned factor for nice visual speed
          frontRoller.rotation.y += rollerSpin;
          backRoller.rotation.y += rollerSpin;
        }

        // Resume if pause time elapsed
        if (isPaused && nowT >= pauseUntilT) {
          isPaused = false;
          if (zoomOnPause) zoomTarget = 0;
        }

        // Move items with constant spacing using a single phase value
        const itemsArr = itemsRef.current;
        if (itemsArr.length > 0) {
          const margin = 0.2 * scale;
          const trackLength = beltLength + margin * 2;
          const trackStart = -beltLength / 2 - margin;

          // Advance only when not paused; track unwrapped phase for wrap detection
          if (!isPaused) {
            beltPhase = (beltPhase + delta * signedSpeed) % trackLength;
          }
          if (beltPhase < 0) beltPhase += trackLength;

          trackStartRef.current = trackStart;
          trackLengthRef.current = trackLength;
          beltLengthRef.current = beltLength;
          const spacing = trackLength / itemsArr.length;
          for (let i = 0; i < itemsArr.length; i++) {
            const mesh = itemsArr[i];
            const prevX = lastItemXs.has(mesh)
              ? lastItemXs.get(mesh)
              : mesh.position.x;
            let advance = (beltPhase + i * spacing) % trackLength;
            if (advance < 0) advance += trackLength;
            const currX = trackStart + advance;
            const wrappingPositive = currentDir > 0 && prevX > currX;
            const wrappingNegative = currentDir < 0 && prevX < currX;
            if (wrappingPositive || wrappingNegative) {
              assignNextTextureToMesh(mesh);
              // If was fading out, start fade-in now
              if (fadeTargets.has(mesh) && fadeTargets.get(mesh) === 0) {
                fadeTargets.set(mesh, 1);
              }
            }
            mesh.position.x = currX;

            // Visibility is kept true; invisibility is driven purely by opacity
          }

          // Detect center crossing and schedule pause
          if (!isPaused && pauseOnCenter) {
            for (let i = 0; i < itemsArr.length; i++) {
              const mesh = itemsArr[i];
              const prevX = lastItemXs.has(mesh)
                ? lastItemXs.get(mesh)
                : mesh.position.x;
              const currX = mesh.position.x;
              const crossed =
                (prevX < 0 && currX >= 0) || (prevX > 0 && currX <= 0);
              if (crossed && Math.abs(currX) <= centerThreshold) {
                isPaused = true;
                pausedItemRef.current = mesh;
                if (confirmOnPause) {
                  pauseUntilT = Number.POSITIVE_INFINITY;
                  setAwaitingChoice(true);

                  // Notify parent that an item is paused for approval
                  if (onItemPaused) {
                    onItemPaused(mesh);
                  }
                } else {
                  pauseUntilT = nowT + Math.max(0, pauseSeconds);
                }
                if (zoomOnPause) {
                  const tex =
                    mesh.material && mesh.material.map
                      ? mesh.material.map
                      : null;
                  if (tex) {
                    overlayMaterial.map = tex;
                    overlayMaterial.needsUpdate = true;
                  }
                  if (overlayMesh && typeof overlayMesh.visible === "boolean") {
                    overlayMesh.visible = true;
                  }
                  zoomTarget = 1;
                }
                break;
              }
            }
          }

          // Update last seen x positions
          for (let i = 0; i < itemsArr.length; i++) {
            lastItemXs.set(itemsArr[i], itemsArr[i].position.x);
          }
        }

        // Animate overlay zoom
        if (zoomOnPause && overlayMesh) {
          const step = delta / Math.max(0.001, zoomSeconds);
          if (zoomTarget > zoomProgress)
            zoomProgress = Math.min(1, zoomProgress + step);
          else if (zoomTarget < zoomProgress)
            zoomProgress = Math.max(0, zoomProgress - step);

          if (
            zoomProgress > 0.001 &&
            overlayMaterial &&
            overlayMaterial.map &&
            overlayMesh
          ) {
            if (typeof overlayMesh.visible === "boolean")
              overlayMesh.visible = true;
            const dist = Math.max(
              0.001,
              camera.position.z - overlayMesh.position.z
            );
            const vHeight = 2 * Math.tan((camera.fov * Math.PI) / 360) * dist;
            const vWidth = vHeight * camera.aspect;
            const img = overlayMaterial.map.image;
            const aspect = img && img.height ? img.width / img.height : 1;
            // Use contain (fit) sizing so nothing goes outside the frame
            let targetW = vWidth;
            let targetH = targetW / aspect;
            if (targetH > vHeight) {
              targetH = vHeight;
              targetW = vHeight * aspect;
            }
            overlayMesh.scale.set(
              targetW * zoomProgress,
              targetH * zoomProgress,
              1
            );
          } else if (overlayMesh) {
            overlayMesh.visible = false;
          }
        }

        // Animate fades for rejected/accepted items
        if (fadeTargets.size > 0) {
          for (const [mesh, target] of fadeTargets.entries()) {
            if (!mesh.material) continue;
            mesh.material.transparent = true;
            const currentOpacity =
              typeof mesh.material.opacity === "number"
                ? mesh.material.opacity
                : 1;
            const speed = 5.0; // ~200ms per phase
            const nextOpacity =
              currentOpacity + (target === 1 ? 1 : -1) * speed * delta;
            const clamped = Math.max(0, Math.min(1, nextOpacity));
            mesh.material.opacity = clamped;
            if (
              (target === 0 && clamped <= 0.01) ||
              (target === 1 && clamped >= 0.99)
            ) {
              fadeTargets.delete(mesh);
            }
          }
        }
        renderer.render(scene, camera);
        animationFrameId = requestAnimationFrame(render);
      };
      animationFrameId = requestAnimationFrame(render);

      return () => {
        isDisposed = true;
        cancelAnimationFrame(animationFrameId);
        window.removeEventListener("resize", handleResize);
        beltGeometry.dispose();
        if (beltMaterial.map) beltMaterial.map.dispose();
        beltMaterial.dispose();

        if (railGeometry) railGeometry.dispose();
        if (railMaterial) railMaterial.dispose();
        if (rollerGeometry) rollerGeometry.dispose();
        if (rollerMaterial) rollerMaterial.dispose();

        if (boxGeometry) boxGeometry.dispose();
        if (boxMaterial) boxMaterial.dispose();
        if (imageGeometry) imageGeometry.dispose();
        if (imageMaterial) imageMaterial.dispose();
        if (imageTexture) imageTexture.dispose();
        overlayGeometry.dispose();
        overlayMaterial.dispose();
        renderer.dispose();
      };
    }, [
      showFrame,
      numBoxes,
      scale,
      frameScale,
      imageScale,
      zoomOnPause,
      zoomSeconds,
      pauseOnCenter,
      pauseSeconds,
      centerThreshold,
      confirmOnPause,
      visibleCount,
      onItemPaused,
      onItemProcessed,
    ]);

    return (
      <div className="three-stage" ref={containerRef}>
        <canvas className="three-stage-canvas" ref={canvasRef} />
        {awaitingChoice && (
          <div className="three-stage-controls">
            <button
              className="btn-yes"
              onClick={() => {
                resumeRef.current();
                if (onItemProcessed) {
                  onItemProcessed("accepted", pausedItemRef.current);
                }
              }}>
              Sim
            </button>
            <button
              className="btn-no"
              onClick={() => {
                rejectRef.current();
                if (onItemProcessed) {
                  onItemProcessed("rejected", pausedItemRef.current);
                }
              }}>
              Não
            </button>
          </div>
        )}
      </div>
    );
  }
);

ThreeStage.displayName = "ThreeStage";

export default ThreeStage;
