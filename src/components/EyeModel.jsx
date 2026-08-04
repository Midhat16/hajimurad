"use client";

import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { MeshTransmissionMaterial } from "@react-three/drei";
import * as THREE from "three";

export default function EyeModel({ mouse }) {
  const groupRef = useRef();
  const outerRef = useRef();
  const innerRef = useRef();
  const pupilRef = useRef();

  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime();
    
    // Ensure smooth frame rate independent interpolation
    const lerpFactor = 1 - Math.exp(-6 * delta);

    // Floating bobbing motion on the group
    if (groupRef.current) {
      groupRef.current.position.y = Math.sin(t * 1.5) * 0.12;
    }

    // Map mouse coordinates to larger, more responsive rotation targets
    const targetX = mouse.x * 0.8;
    const targetY = mouse.y * 0.6;
    
    // Auto-spin on the Y axis
    const autoRotateY = t * 0.15;

    if (outerRef.current) {
      outerRef.current.rotation.y = THREE.MathUtils.lerp(
        outerRef.current.rotation.y,
        autoRotateY + targetX,
        lerpFactor
      );
      outerRef.current.rotation.x = THREE.MathUtils.lerp(
        outerRef.current.rotation.x,
        targetY,
        lerpFactor
      );
    }

    if (innerRef.current) {
      // Inner iris has a deeper reaction for parallax 3D effect
      innerRef.current.rotation.y = THREE.MathUtils.lerp(
        innerRef.current.rotation.y,
        autoRotateY + targetX * 1.3,
        lerpFactor
      );
      innerRef.current.rotation.x = THREE.MathUtils.lerp(
        innerRef.current.rotation.x,
        targetY * 1.3,
        lerpFactor
      );
    }
  });

  return (
    <group ref={groupRef} scale={[1.7, 1.7, 1.7]}>
      {/* Outer Refractive Glass Shell (Cornea / Eye Surface) - Optimized segments */}
      <mesh ref={outerRef}>
        <sphereGeometry args={[1.3, 32, 32]} />
        <MeshTransmissionMaterial
          backside
          samples={4}
          thickness={0.5}
          chromaticAberration={0.06}
          anisotropy={0.15}
          roughness={0.05}
          clearcoat={1.0}
          clearcoatRoughness={0.05}
          transmission={0.96}
          ior={1.3}
          color="#f0f9ff"
        />
      </mesh>

      {/* Inner Iris Structure */}
      <group ref={innerRef}>
        {/* Iris Base Plate */}
        <mesh position={[0, 0, 0.15]}>
          <ringGeometry args={[0.25, 0.95, 32]} />
          <meshStandardMaterial
            color="#2B1F1A"
            roughness={0.15}
            metalness={0.2}
            side={THREE.DoubleSide}
          />
        </mesh>
        
        {/* Decorative Inner Ring (Sage Green Emissive Glow) */}
        <mesh position={[0, 0, 0.17]}>
          <torusGeometry args={[0.6, 0.08, 8, 32]} />
          <meshStandardMaterial
            color="#C4232C"
            emissive="#C4232C"
            emissiveIntensity={0.45}
            roughness={0.2}
          />
        </mesh>

        {/* Small Highlight Torus */}
        <mesh position={[0, 0, 0.18]}>
          <torusGeometry args={[0.4, 0.04, 6, 24]} />
          <meshStandardMaterial
            color="#ffffff"
            opacity={0.35}
            transparent
            roughness={0.1}
          />
        </mesh>

        {/* Pupil (Absorbs light) */}
        <mesh ref={pupilRef} position={[0, 0, 0.2]}>
          <sphereGeometry args={[0.3, 16, 16]} />
          <meshStandardMaterial
            color="#1a1310"
            roughness={0.02}
            metalness={0.95}
          />
        </mesh>
      </group>
    </group>
  );
}
