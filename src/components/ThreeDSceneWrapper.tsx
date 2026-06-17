import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { motion } from 'motion/react';

export const ThreeDSceneWrapper: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    let width = container.clientWidth || window.innerWidth;
    let height = container.clientHeight || window.innerHeight;

    // 1. Scene Setup
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x040814, 0.012);

    // 2. Camera Setup for Deep Digital Depth
    const camera = new THREE.PerspectiveCamera(52, width / height, 0.1, 1000);
    camera.position.z = 25;

    // 3. WebGL Renderer with performance parameters
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // 4. Studio Gradient Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const pinkLight = new THREE.DirectionalLight(0xec4899, 1.8);
    pinkLight.position.set(15, 20, 10);
    scene.add(pinkLight);

    const cyanLight = new THREE.DirectionalLight(0x06b6d4, 1.5);
    cyanLight.position.set(-15, -10, 15);
    scene.add(cyanLight);

    // 5. Build Master Plexus System (Irregular points + Connecting segments)
    const plexusGroup = new THREE.Group();
    scene.add(plexusGroup);

    const nodeCount = 38;
    const nodes: Array<{
      position: THREE.Vector3;
      velocity: THREE.Vector3;
      mesh: THREE.Mesh;
      color: THREE.Color;
    }> = [];

    const nodeGeometry = new THREE.SphereGeometry(0.12, 8, 8);

    const colorPalette = [
      new THREE.Color(0x06b6d4), // Cyan
      new THREE.Color(0xec4899), // Hot Pink
      new THREE.Color(0x6366f1), // Electric Indigo
      new THREE.Color(0xa855f7), // Bright Purple
    ];

    for (let i = 0; i < nodeCount; i++) {
      // Form an elegant floating cluster in 3D dimensions
      const pos = new THREE.Vector3(
        (Math.random() - 0.5) * 44,
        (Math.random() - 0.5) * 26,
        (Math.random() - 0.5) * 22
      );

      // Irregular, distinct, slow floating velocity vectors
      const vel = new THREE.Vector3(
        (Math.random() - 0.5) * 0.03,
        (Math.random() - 0.5) * 0.03,
        (Math.random() - 0.5) * 0.03
      );

      const chosenColor = colorPalette[Math.floor(Math.random() * colorPalette.length)];
      
      const nodeMaterial = new THREE.MeshBasicMaterial({
        color: chosenColor,
        transparent: true,
        opacity: 0.8,
      });

      const mesh = new THREE.Mesh(nodeGeometry, nodeMaterial);
      mesh.position.copy(pos);
      plexusGroup.add(mesh);

      nodes.push({
        position: pos,
        velocity: vel,
        mesh,
        color: chosenColor,
      });
    }

    // Allocate dynamic lines buffer segments - reduced limit for clean minimalist aesthetic
    const lineMaxConnections = 45;
    const linePositions = new Float32Array(lineMaxConnections * 2 * 3);
    const lineColors = new Float32Array(lineMaxConnections * 2 * 3);

    const lineGeometry = new THREE.BufferGeometry();
    lineGeometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
    lineGeometry.setAttribute('color', new THREE.BufferAttribute(lineColors, 3));

    const lineMaterial = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      linewidth: 1.2,
      blending: THREE.AdditiveBlending,
    });

    const plexusLines = new THREE.LineSegments(lineGeometry, lineMaterial);
    plexusGroup.add(plexusLines);

    // 6. Background Dust Layer
    const dustCount = 80;
    const dustGeometry = new THREE.BufferGeometry();
    const dustPositions = new Float32Array(dustCount * 3);
    const dustColors = new Float32Array(dustCount * 3);

    for (let i = 0; i < dustCount * 3; i += 3) {
      dustPositions[i] = (Math.random() - 0.5) * 80;
      dustPositions[i + 1] = (Math.random() - 0.5) * 55;
      dustPositions[i + 2] = (Math.random() - 0.5) * 40;

      const cl = colorPalette[Math.floor(Math.random() * colorPalette.length)];
      dustColors[i] = cl.r;
      dustColors[i + 1] = cl.g;
      dustColors[i + 2] = cl.b;
    }

    dustGeometry.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));
    dustGeometry.setAttribute('color', new THREE.BufferAttribute(dustColors, 3));

    const dustMaterial = new THREE.PointsMaterial({
      size: 0.24,
      vertexColors: true,
      transparent: true,
      opacity: 0.55,
      sizeAttenuation: true,
    });

    const dustCloud = new THREE.Points(dustGeometry, dustMaterial);
    scene.add(dustCloud);

    // 7. Ground Floor Grid
    const floorGridGeo = new THREE.PlaneGeometry(80, 80, 32, 32);
    const floorGridMat = new THREE.MeshBasicMaterial({
      color: 0x6366f1,
      wireframe: true,
      transparent: true,
      opacity: 0.12,
    });
    const floorGrid = new THREE.Mesh(floorGridGeo, floorGridMat);
    floorGrid.rotation.x = -Math.PI / 2.15;
    floorGrid.position.set(0, -9.5, -5);
    scene.add(floorGrid);

    const positionAttribute = floorGridGeo.attributes.position;
    const vertexCount = positionAttribute.count;
    const originalZ = new Float32Array(vertexCount);
    for (let i = 0; i < vertexCount; i++) {
      originalZ[i] = positionAttribute.getZ(i);
    }

    // 8. Interactive Mouse Movement Handler
    const handleMouseMove = (event: MouseEvent) => {
      mouseRef.current.targetX = (event.clientX / window.innerWidth) * 2 - 1;
      mouseRef.current.targetY = -(event.clientY / window.innerHeight) * 2 + 1;
    };

    window.addEventListener('mousemove', handleMouseMove);

    // 9. Animation Tick Frame
    let animationFrameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Irregular node position translation & collision mapping
      for (let i = 0; i < nodeCount; i++) {
        const node = nodes[i];
        
        // Gentle wavy motion compound mapped into velocity
        const driftX = Math.sin(elapsedTime * 0.45 + i) * 0.003;
        const driftY = Math.cos(elapsedTime * 0.35 + i) * 0.003;

        node.position.x += node.velocity.x + driftX;
        node.position.y += node.velocity.y + driftY;
        node.position.z += node.velocity.z;

        // Space boundaries rebound check
        if (Math.abs(node.position.x) > 23) { node.velocity.x *= -1; node.position.x = Math.sign(node.position.x) * 23; }
        if (Math.abs(node.position.y) > 14) { node.velocity.y *= -1; node.position.y = Math.sign(node.position.y) * 14; }
        if (Math.abs(node.position.z) > 12) { node.velocity.z *= -1; node.position.z = Math.sign(node.position.z) * 12; }

        node.mesh.position.copy(node.position);
      }

      // Live link connection recalculation
      let lineIndex = 0;
      const posAttr = plexusLines.geometry.getAttribute('position') as THREE.BufferAttribute;
      const colAttr = plexusLines.geometry.getAttribute('color') as THREE.BufferAttribute;

      posAttr.array.fill(0);
      colAttr.array.fill(0);

      const maxDistance = 6.2;

      for (let i = 0; i < nodeCount && lineIndex < lineMaxConnections; i++) {
        const nodeA = nodes[i];
        for (let j = i + 1; j < nodeCount && lineIndex < lineMaxConnections; j++) {
          const nodeB = nodes[j];
          const dist = nodeA.position.distanceTo(nodeB.position);

          if (dist < maxDistance) {
            const idxOffset = lineIndex * 2;
            const linkWeight = (1.0 - (dist / maxDistance));
            const opacity = linkWeight * 0.72;

            posAttr.setXYZ(idxOffset, nodeA.position.x, nodeA.position.y, nodeA.position.z);
            posAttr.setXYZ(idxOffset + 1, nodeB.position.x, nodeB.position.y, nodeB.position.z);

            const colorA = nodeA.color;
            const colorB = nodeB.color;

            colAttr.setXYZ(idxOffset, colorA.r * opacity, colorA.g * opacity, colorA.b * opacity);
            colAttr.setXYZ(idxOffset + 1, colorB.r * opacity, colorB.g * opacity, colorB.b * opacity);

            lineIndex++;
          }
        }
      }

      posAttr.needsUpdate = true;
      colAttr.needsUpdate = true;

      // Slowly rotate background dust
      dustCloud.rotation.y = elapsedTime * 0.012;
      dustCloud.rotation.x = -elapsedTime * 0.005;

      // Harmonic fluid wavy floor grid
      for (let i = 0; i < vertexCount; i++) {
        const x = positionAttribute.getX(i);
        const y = positionAttribute.getY(i);
        const heightPhase = originalZ[i] + 
                             Math.sin(x * 0.12 + elapsedTime * 1.0) * 1.2 + 
                             Math.cos(y * 0.15 + elapsedTime * 0.8) * 0.8;
        positionAttribute.setZ(i, heightPhase);
      }
      floorGridGeo.computeVertexNormals();
      positionAttribute.needsUpdate = true;

      // Smooth modern cursor parallax response
      mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.045;
      mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.045;

      plexusGroup.rotation.y = mouseRef.current.x * 0.35 + elapsedTime * 0.008;
      plexusGroup.rotation.x = mouseRef.current.y * 0.22;

      renderer.render(scene, camera);
    };

    animate();

    // 10. Window resize logic
    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        width = entry.contentRect.width || container.clientWidth;
        height = entry.contentRect.height || container.clientHeight || window.innerHeight;

        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
      }
    });

    resizeObserver.observe(container);

    // 11. Cleanup Lifecycle deallocation
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handleMouseMove);
      resizeObserver.disconnect();

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }

      nodeGeometry.dispose();
      nodes.forEach((n) => {
        if (Array.isArray(n.mesh.material)) {
          n.mesh.material.forEach((m) => m.dispose());
        } else {
          n.mesh.material.dispose();
        }
      });

      lineGeometry.dispose();
      lineMaterial.dispose();

      dustGeometry.dispose();
      dustMaterial.dispose();

      floorGridGeo.dispose();
      floorGridMat.dispose();

      renderer.dispose();
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.8, ease: 'easeOut' }}
      className="absolute top-0 left-0 w-full h-[740px] md:h-[860px] overflow-hidden pointer-events-none select-none z-0 [mask-image:linear-gradient(to_bottom,rgba(255,255,255,1)_72%,rgba(255,255,255,0)_100%)] [webkit-mask-image:linear-gradient(to_bottom,rgba(255,255,255,1)_72%,rgba(255,255,255,0)_100%)]"
    >
      <div ref={containerRef} className="w-full h-full opacity-[0.9] dark:opacity-[0.85]" />
    </motion.div>
  );
};
