import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { NarrativeEvent } from '../../hooks/useApi';

interface EventParticleProps {
  event: NarrativeEvent;
  position: [number, number, number];
}

/** Floating octahedron with pulsing glow based on impact */
export default function EventParticle({ event, position }: EventParticleProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const color = event.sentiment > 0 ? '#22d3ee' : event.sentiment < -0.3 ? '#ef4444' : '#f97316';

  const size = 0.08 + event.impact * 0.15;

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (meshRef.current) {
      meshRef.current.rotation.y = t * 0.4;
      meshRef.current.rotation.x = t * 0.2;
      // Pulsing scale based on impact
      const pulse = 1 + Math.sin(t * 2 + position[0] * 3) * 0.12 * event.impact;
      meshRef.current.scale.setScalar(pulse);
    }
    if (glowRef.current) {
      const mat = glowRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.08 + Math.sin(t * 1.5 + position[2]) * 0.04 * event.impact;
    }
  });

  return (
    <group position={position}>
      {/* Core octahedron */}
      <mesh ref={meshRef}>
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
    </group>
  );
}
