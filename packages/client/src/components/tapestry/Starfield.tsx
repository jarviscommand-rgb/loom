import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/** Generate star positions for a layer. */
function generateLayer(count: number, spread: number, seed: number) {
  const pos = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    // Use a seeded-style deterministic spread
    const a = (i + seed) * 2.39996;
    const b = (i + seed) * 3.14159;
    pos[i * 3] = (Math.sin(a) * 0.5 + Math.cos(b * 0.7) * 0.5) * spread;
    pos[i * 3 + 1] = (Math.cos(a * 1.3) * 0.5 + Math.sin(b * 0.5) * 0.5) * spread * 0.6;
    pos[i * 3 + 2] = (Math.sin(b) * 0.5 + Math.cos(a * 0.9) * 0.5) * spread;
  }
  return pos;
}

/** Animated starfield with parallax depth — two layers at different distances. */
export default function Starfield({ count = 800 }: { count?: number }) {
  const nearRef = useRef<THREE.Points>(null);
  const farRef = useRef<THREE.Points>(null);

  const nearPositions = useMemo(() => generateLayer(Math.floor(count * 0.4), 40, 0), [count]);
  const farPositions = useMemo(() => generateLayer(Math.floor(count * 0.6), 70, 1000), [count]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    // Near layer rotates faster for parallax
    if (nearRef.current) {
      nearRef.current.rotation.y = t * 0.008;
      nearRef.current.rotation.x = Math.sin(t * 0.004) * 0.06;
    }
    // Far layer rotates slower
    if (farRef.current) {
      farRef.current.rotation.y = t * 0.003;
      farRef.current.rotation.x = Math.sin(t * 0.002) * 0.03;
    }
  });

  return (
    <group>
      {/* Near stars — brighter, larger, faster parallax */}
      <points ref={nearRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[nearPositions, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.05}
          color="#8b5cf6"
          transparent
          opacity={0.7}
          sizeAttenuation
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>

      {/* Far stars — dimmer, smaller, slower parallax */}
      <points ref={farRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[farPositions, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.025}
          color="#6366f1"
          transparent
          opacity={0.35}
          sizeAttenuation
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
    </group>
  );
}
