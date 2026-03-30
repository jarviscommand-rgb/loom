import { useRef, useMemo, useState, useCallback } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import type { NarrativeEvent } from '../../hooks/useApi';

interface EventParticleProps {
  event: NarrativeEvent;
  position: [number, number, number];
}

/**
 * Burst particle system that activates on hover.
 * Particles radiate outward from the event and fade.
 */
function HoverBurst({
  active,
  color,
  count = 24,
}: {
  active: boolean;
  color: string;
  count?: number;
}) {
  const ref = useRef<THREE.Points>(null);
  const startTimeRef = useRef(0);

  /** Velocity vectors for each particle (unit sphere, deterministic) */
  const velocities = useMemo(() => {
    const vel = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const phi = Math.acos(1 - (2 * (i + 0.5)) / count);
      const theta = Math.PI * (1 + Math.sqrt(5)) * i;
      vel[i * 3] = Math.sin(phi) * Math.cos(theta);
      vel[i * 3 + 1] = Math.sin(phi) * Math.sin(theta);
      vel[i * 3 + 2] = Math.cos(phi);
    }
    return vel;
  }, [count]);

  const positions = useMemo(() => new Float32Array(count * 3), [count]);

  useFrame((state) => {
    if (!ref.current) return;
    const mat = ref.current.material as THREE.PointsMaterial;

    if (active) {
      if (startTimeRef.current === 0) startTimeRef.current = state.clock.elapsedTime;
      const elapsed = state.clock.elapsedTime - startTimeRef.current;
      const progress = Math.min(elapsed * 1.5, 1); // 0→1 over ~0.67s
      const posAttr = ref.current.geometry.attributes.position;

      for (let i = 0; i < count; i++) {
        const spread = progress * 0.6;
        posAttr.array[i * 3] = velocities[i * 3] * spread;
        posAttr.array[i * 3 + 1] = velocities[i * 3 + 1] * spread;
        posAttr.array[i * 3 + 2] = velocities[i * 3 + 2] * spread;
      }
      posAttr.needsUpdate = true;
      mat.opacity = 0.9 * (1 - progress * 0.6);
      mat.size = 0.04 * (1 - progress * 0.3);
    } else {
      startTimeRef.current = 0;
      mat.opacity = 0;
    }
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.04}
        color={color}
        transparent
        opacity={0}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        sizeAttenuation
      />
    </points>
  );
}

/** Floating octahedron with pulsing glow based on impact, emits particles on hover */
export default function EventParticle({ event, position }: EventParticleProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const color = event.sentiment > 0 ? '#22d3ee' : event.sentiment < -0.3 ? '#ef4444' : '#f97316';

  const size = 0.08 + event.impact * 0.15;

  const handlePointerOver = useCallback((e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setHovered(true);
  }, []);

  const handlePointerOut = useCallback(() => {
    setHovered(false);
  }, []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (meshRef.current) {
      meshRef.current.rotation.y = t * 0.4;
      meshRef.current.rotation.x = t * 0.2;
      // Pulsing scale based on impact — amplified when hovered
      const hoverBoost = hovered ? 1.3 : 1;
      const pulse = (1 + Math.sin(t * 2 + position[0] * 3) * 0.12 * event.impact) * hoverBoost;
      meshRef.current.scale.setScalar(pulse);

      const mat = meshRef.current.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = hovered ? 1.2 + Math.sin(t * 3) * 0.3 : 0.6 + event.impact * 0.4;
    }
    if (glowRef.current) {
      const mat = glowRef.current.material as THREE.MeshBasicMaterial;
      const baseOp = hovered ? 0.18 : 0.08;
      mat.opacity = baseOp + Math.sin(t * 1.5 + position[2]) * 0.04 * event.impact;
    }
  });

  return (
    <group position={position}>
      {/* Core octahedron */}
      <mesh ref={meshRef} onPointerOver={handlePointerOver} onPointerOut={handlePointerOut}>
        <octahedronGeometry args={[size, 0]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.6 + event.impact * 0.4}
          transparent
          opacity={0.8}
          roughness={0.1}
          metalness={0.5}
        />
      </mesh>

      {/* Impact glow */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[size * 2.5, 12, 12]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.08}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Hover particle burst */}
      <HoverBurst active={hovered} color={color} />
    </group>
  );
}
