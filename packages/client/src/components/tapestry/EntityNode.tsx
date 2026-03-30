import { useRef, useMemo } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import type { Entity } from '../../hooks/useApi';

export const entityTypeColors: Record<string, string> = {
  person: '#8b5cf6',
  company: '#22d3ee',
  institution: '#f97316',
  group: '#22c55e',
  concept: '#ec4899',
};

/** Particle halo orbiting an entity sphere */
function ParticleHalo({
  color,
  radius,
  count = 40,
}: {
  color: string;
  radius: number;
  count?: number;
}) {
  const ref = useRef<THREE.Points>(null);

  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const r = radius + (Math.random() - 0.5) * 0.15;
      pos[i * 3] = Math.cos(angle) * r;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 0.2;
      pos[i * 3 + 2] = Math.sin(angle) * r;
    }
    return pos;
  }, [count, radius]);

  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.y = state.clock.elapsedTime * 0.8;
      ref.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.3) * 0.15;
    }
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.03}
        color={color}
        transparent
        opacity={0.8}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        sizeAttenuation
      />
    </points>
  );
}

interface EntityNodeProps {
  entity: Entity;
  position: [number, number, number];
  onPointerOver?: (e: ThreeEvent<PointerEvent>) => void;
  onPointerOut?: () => void;
}

/** Entity sphere with glow, particle halo, and label */
export default function EntityNode({
  entity,
  position,
  onPointerOver,
  onPointerOut,
}: EntityNodeProps) {
  const groupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const color = entityTypeColors[entity.type] || '#8b5cf6';
  const baseRadius = entity.type === 'person' ? 0.3 : 0.4;

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    // Subtle breathing float
    const breathY = Math.sin(t * 0.5 + position[0]) * 0.15;
    // Gentle scale pulse
    const pulse = 1 + Math.sin(t * 0.8 + position[2] * 2) * 0.04;

    if (meshRef.current) {
      meshRef.current.position.y = position[1] + breathY;
      meshRef.current.scale.setScalar(pulse);
      const mat = meshRef.current.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = 0.5 + Math.sin(t * 1.2 + position[0]) * 0.15;
    }
    if (glowRef.current) {
      glowRef.current.position.y = position[1] + breathY;
      glowRef.current.scale.setScalar(pulse * 1.05);
      const mat = glowRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.06 + Math.sin(t * 1.5 + position[2]) * 0.03;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Core sphere */}
      <mesh
        ref={meshRef}
        position={position}
        onPointerOver={onPointerOver}
        onPointerOut={onPointerOut}
      >
        <sphereGeometry args={[baseRadius, 32, 32]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.5}
          transparent
          opacity={0.85}
          roughness={0.2}
          metalness={0.3}
        />
      </mesh>

      {/* Outer glow */}
      <mesh ref={glowRef} position={position}>
        <sphereGeometry args={[baseRadius * 1.8, 16, 16]} />
        <meshBasicMaterial color={color} transparent opacity={0.06} side={THREE.BackSide} />
      </mesh>

      {/* Particle halo */}
      <group position={position}>
        <ParticleHalo color={color} radius={baseRadius * 1.6} />
      </group>

      {/* Label */}
      <sprite
        position={[position[0], position[1] - baseRadius - 0.35, position[2]]}
        scale={[entity.name.length * 0.12, 0.25, 1]}
      >
        <spriteMaterial transparent opacity={0.7} depthWrite={false}>
          <canvasTexture
            attach="map"
            image={(() => {
              const canvas = document.createElement('canvas');
              canvas.width = 256;
              canvas.height = 64;
              const ctx = canvas.getContext('2d')!;
              ctx.font = '28px JetBrains Mono, monospace';
              ctx.fillStyle = '#e2e8f0';
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText(entity.name, 128, 32);
              return canvas;
            })()}
          />
        </spriteMaterial>
      </sprite>
    </group>
  );
}
