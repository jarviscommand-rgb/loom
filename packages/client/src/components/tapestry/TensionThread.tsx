import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface TensionThreadProps {
  from: [number, number, number];
  to: [number, number, number];
  intensity: number;
  status: string;
}

/** Animated glowing tension curve with flowing energy particles */
export default function TensionThread({ from, to, intensity, status }: TensionThreadProps) {
  const tubeRef = useRef<THREE.Mesh>(null);
  const particlesRef = useRef<THREE.Points>(null);

  /** Color-code tension threads by severity:
   *  green → yellow → orange → red → pulsing red for critical */
  const color =
    status === 'critical'
      ? '#ef4444'
      : status === 'escalating'
        ? '#f97316'
        : status === 'simmering'
          ? '#eab308'
          : status === 'resolving'
            ? '#22c55e'
            : '#6b7280';

  const { curve, tubeGeometry } = useMemo(() => {
    const mid: [number, number, number] = [
      (from[0] + to[0]) / 2,
      (from[1] + to[1]) / 2 + 1.5 + intensity * 0.5,
      (from[2] + to[2]) / 2,
    ];
    const c = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(...from),
      new THREE.Vector3(...mid),
      new THREE.Vector3(...to)
    );
    const tube = new THREE.TubeGeometry(c, 64, 0.015 + intensity * 0.02, 8, false);
    return { curve: c, tubeGeometry: tube };
  }, [from, to, intensity]);

  /** Energy particles flowing along the curve */
  const particleCount = 20 + Math.floor(intensity * 30);
  const particlePositions = useMemo(() => {
    return new Float32Array(particleCount * 3);
  }, [particleCount]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;

    // Pulse the tube
    if (tubeRef.current) {
      const mat = tubeRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.3 + Math.sin(t * 2 + intensity * 5) * 0.15 * intensity;
    }

    // Animate particles along curve
    if (particlesRef.current) {
      const positions = particlesRef.current.geometry.attributes.position;
      for (let i = 0; i < particleCount; i++) {
        const frac = (i / particleCount + t * (0.15 + intensity * 0.1)) % 1;
        const point = curve.getPoint(frac);
        const offset = Math.sin(t * 3 + i * 2) * 0.05;
        positions.array[i * 3] = point.x + offset;
        positions.array[i * 3 + 1] = point.y + offset;
        positions.array[i * 3 + 2] = point.z;
      }
      positions.needsUpdate = true;
    }
  });

  return (
    <group>
      {/* Glowing tube */}
      <mesh ref={tubeRef} geometry={tubeGeometry}>
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.4}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Outer glow tube */}
      <mesh geometry={new THREE.TubeGeometry(curve, 64, 0.06 + intensity * 0.04, 8, false)}>
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.06}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Energy particles */}
      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[particlePositions, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.04}
          color={color}
          transparent
          opacity={0.9}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          sizeAttenuation
        />
      </points>
    </group>
  );
}
