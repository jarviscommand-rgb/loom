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

/** Importance-driven particle system orbiting an entity */
function ParticleHalo({
  color,
  radius,
  count = 40,
  speed = 0.8,
}: {
  color: string;
  radius: number;
  count?: number;
  speed?: number;
}) {
  const ref = useRef<THREE.Points>(null);

  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const r = radius + (Math.sin(i * 2.39) * 0.5 - 0.25) * 0.2;
      pos[i * 3] = Math.cos(angle) * r;
      pos[i * 3 + 1] = (Math.sin(i * 1.73) * 0.5 - 0.25) * 0.25;
      pos[i * 3 + 2] = Math.sin(angle) * r;
    }
    return pos;
  }, [count, radius]);

  useFrame((state) => {
    if (ref.current) {
      const t = state.clock.elapsedTime;
      ref.current.rotation.y = t * speed;
      ref.current.rotation.x = Math.sin(t * 0.3) * 0.2;
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

/** Secondary ring of sparse particles for high-importance entities */
function ImportanceRing({
  color,
  radius,
  count,
}: {
  color: string;
  radius: number;
  count: number;
}) {
  const ref = useRef<THREE.Points>(null);

  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const r = radius + Math.sin(i * 3.7) * 0.08;
      pos[i * 3] = Math.cos(angle) * r;
      pos[i * 3 + 1] = Math.sin(i * 2.1) * 0.35;
      pos[i * 3 + 2] = Math.sin(angle) * r;
    }
    return pos;
  }, [count, radius]);

  useFrame((state) => {
    if (ref.current) {
      const t = state.clock.elapsedTime;
      ref.current.rotation.y = -t * 0.4;
      ref.current.rotation.z = Math.sin(t * 0.2) * 0.1;
    }
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.02}
        color={color}
        transparent
        opacity={0.5}
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
  connectionCount?: number;
  onPointerOver?: (e: ThreeEvent<PointerEvent>) => void;
  onPointerOut?: () => void;
}

/** Entity sphere with importance-driven glow, particle halos, and label */
export default function EntityNode({
  entity,
  position,
  connectionCount = 0,
  onPointerOver,
  onPointerOut,
}: EntityNodeProps) {
  const groupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const color = entityTypeColors[entity.type] || '#8b5cf6';

  /** Importance factor: 0-1 scale based on connections (caps at 6+) */
  const importance = Math.min(connectionCount / 6, 1);

  /** Scale radius by importance: base 0.25-0.3, up to +40% for highly connected */
  const typeRadius = entity.type === 'person' ? 0.28 : 0.35;
  const baseRadius = typeRadius + importance * typeRadius * 0.4;

  /** Particle count scales with importance */
  const haloCount = 30 + Math.floor(importance * 40);

  /** Glow sphere radius proportional to importance */
  const glowScale = 1.8 + importance * 0.8;

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const breathSpeed = 0.5 + importance * 0.3;
    const breathAmp = 0.12 + importance * 0.1;
    const breathY = Math.sin(t * breathSpeed + position[0]) * breathAmp;

    // Dual-frequency pulse: slow breathing + fast heartbeat for high importance
    const slowPulse = Math.sin(t * 0.8 + position[2] * 2) * (0.03 + importance * 0.04);
    const fastPulse = importance > 0.5 ? Math.sin(t * 3 + position[0]) * 0.02 * importance : 0;
    const pulse = 1 + slowPulse + fastPulse;

    if (meshRef.current) {
      meshRef.current.position.y = position[1] + breathY;
      meshRef.current.scale.setScalar(pulse);
      const mat = meshRef.current.material as THREE.MeshStandardMaterial;
      // More dramatic emissive for high-importance entities
      mat.emissiveIntensity =
        0.5 + importance * 0.5 + Math.sin(t * 1.2 + position[0]) * (0.15 + importance * 0.15);
    }
    if (glowRef.current) {
      glowRef.current.position.y = position[1] + breathY;
      glowRef.current.scale.setScalar(pulse * 1.08);
      const mat = glowRef.current.material as THREE.MeshBasicMaterial;
      // Stronger glow pulse for high-importance entities
      mat.opacity =
        0.06 + importance * 0.1 + Math.sin(t * 1.5 + position[2]) * (0.03 + importance * 0.04);
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
          emissiveIntensity={0.5 + importance * 0.3}
          transparent
          opacity={0.85}
          roughness={0.2}
          metalness={0.3}
        />
      </mesh>

      {/* Outer glow — radius proportional to importance */}
      <mesh ref={glowRef} position={position}>
        <sphereGeometry args={[baseRadius * glowScale, 16, 16]} />
        <meshBasicMaterial color={color} transparent opacity={0.06} side={THREE.BackSide} />
      </mesh>

      {/* Primary particle halo */}
      <group position={position}>
        <ParticleHalo
          color={color}
          radius={baseRadius * 1.6}
          count={haloCount}
          speed={0.6 + importance * 0.4}
        />
      </group>

      {/* Secondary importance ring — only for entities with 2+ connections */}
      {connectionCount >= 2 && (
        <group position={position}>
          <ImportanceRing
            color={color}
            radius={baseRadius * 2.4}
            count={15 + Math.floor(importance * 25)}
          />
        </group>
      )}

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
