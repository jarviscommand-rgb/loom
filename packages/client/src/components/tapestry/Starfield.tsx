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

/** Animated nebula cloud — large soft sphere with additive blending */
function NebulaCloud({
  position,
  color,
  radius,
  baseOpacity,
  pulseSpeed,
  rotationSpeed,
}: {
  position: [number, number, number];
  color: string;
  radius: number;
  baseOpacity: number;
  pulseSpeed: number;
  rotationSpeed: number;
}) {
  const ref = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (ref.current) {
      const t = state.clock.elapsedTime;
      ref.current.rotation.y = t * rotationSpeed;
      ref.current.rotation.z = Math.sin(t * rotationSpeed * 0.5) * 0.1;
      const mat = ref.current.material as THREE.MeshBasicMaterial;
      mat.opacity = baseOpacity + Math.sin(t * pulseSpeed) * baseOpacity * 0.4;
    }
  });

  return (
    <mesh ref={ref} position={position}>
      <sphereGeometry args={[radius, 16, 16]} />
      <meshBasicMaterial
        color={color}
        transparent
        opacity={baseOpacity}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        side={THREE.BackSide}
      />
    </mesh>
  );
}

/** Animated starfield with parallax depth, twinkling, and nebula clouds. */
export default function Starfield({ count = 800 }: { count?: number }) {
  const nearRef = useRef<THREE.Points>(null);
  const farRef = useRef<THREE.Points>(null);

  const nearPositions = useMemo(() => generateLayer(Math.floor(count * 0.4), 40, 0), [count]);
  const farPositions = useMemo(() => generateLayer(Math.floor(count * 0.6), 70, 1000), [count]);

  /** Per-star size variation for twinkling effect */
  const nearSizes = useMemo(() => {
    const sizes = new Float32Array(Math.floor(count * 0.4));
    for (let i = 0; i < sizes.length; i++) {
      sizes[i] = 0.04 + Math.sin(i * 2.39) * 0.02;
    }
    return sizes;
  }, [count]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    // Near layer rotates faster for parallax
    if (nearRef.current) {
      nearRef.current.rotation.y = t * 0.008;
      nearRef.current.rotation.x = Math.sin(t * 0.004) * 0.06;

      // Twinkle: modulate size attribute
      const sizes = nearRef.current.geometry.attributes.size;
      if (sizes) {
        for (let i = 0; i < nearSizes.length; i++) {
          sizes.array[i] = nearSizes[i] + Math.sin(t * 1.5 + i * 0.8) * 0.015;
        }
        sizes.needsUpdate = true;
      }
    }
    // Far layer rotates slower
    if (farRef.current) {
      farRef.current.rotation.y = t * 0.003;
      farRef.current.rotation.x = Math.sin(t * 0.002) * 0.03;
    }
  });

  return (
    <group>
      {/* Near stars — brighter, larger, faster parallax, twinkling */}
      <points ref={nearRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[nearPositions, 3]} />
          <bufferAttribute attach="attributes-size" args={[nearSizes, 1]} />
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

      {/* Nebula clouds — soft volumetric glow in the background */}
      <NebulaCloud
        position={[25, 8, -30]}
        color="#6d28d9"
        radius={12}
        baseOpacity={0.018}
        pulseSpeed={0.15}
        rotationSpeed={0.005}
      />
      <NebulaCloud
        position={[-20, -5, -25]}
        color="#1e40af"
        radius={10}
        baseOpacity={0.012}
        pulseSpeed={0.12}
        rotationSpeed={-0.004}
      />
      <NebulaCloud
        position={[0, 12, -35]}
        color="#7c3aed"
        radius={15}
        baseOpacity={0.015}
        pulseSpeed={0.1}
        rotationSpeed={0.003}
      />
      <NebulaCloud
        position={[-15, 10, 20]}
        color="#0e7490"
        radius={8}
        baseOpacity={0.01}
        pulseSpeed={0.18}
        rotationSpeed={-0.006}
      />
    </group>
  );
}
