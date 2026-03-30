import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface TensionThreadProps {
  from: [number, number, number];
  to: [number, number, number];
  intensity: number;
  status: string;
}

/**
 * Compute thread color driven primarily by tension status, with intensity
 * controlling saturation/brightness. Status sets the dominant hue:
 *   simmering → amber, escalating → orange, critical → red, resolving → green
 */
function getThreadColor(intensity: number, status: string): THREE.Color {
  // Status-driven primary colors
  const statusColors: Record<string, string> = {
    simmering: '#f59e0b', // amber
    escalating: '#f97316', // orange
    critical: '#ef4444', // red
    resolving: '#22c55e', // green
    resolved: '#22c55e', // green
  };

  const statusHex = statusColors[status];
  if (statusHex) {
    // Status sets the base color; intensity brightens it
    const base = new THREE.Color(statusHex);
    // Brighten proportionally to intensity for a vivid energy look
    const bright = base.clone().lerp(new THREE.Color('#ffffff'), intensity * 0.15);
    return bright;
  }

  // Fallback: intensity-driven gradient blue → amber → red
  const cool = new THREE.Color('#3b82f6');
  const warm = new THREE.Color('#f59e0b');
  const hot = new THREE.Color('#ef4444');

  if (intensity < 0.5) {
    return cool.clone().lerp(warm, intensity * 2);
  }
  return warm.clone().lerp(hot, (intensity - 0.5) * 2);
}

/** Animated glowing tension curve with intensity-driven color and flowing energy */
export default function TensionThread({ from, to, intensity, status }: TensionThreadProps) {
  const tubeRef = useRef<THREE.Mesh>(null);
  const particlesRef = useRef<THREE.Points>(null);

  const color = useMemo(() => getThreadColor(intensity, status), [intensity, status]);

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
    const tube = new THREE.TubeGeometry(c, 64, 0.015 + intensity * 0.025, 8, false);
    return { curve: c, tubeGeometry: tube };
  }, [from, to, intensity]);

  /** Energy particles flowing along the curve — more for high intensity */
  const particleCount = 20 + Math.floor(intensity * 35);
  const particlePositions = useMemo(() => {
    return new Float32Array(particleCount * 3);
  }, [particleCount]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;

    // Pulse the tube opacity — more aggressive for high intensity
    if (tubeRef.current) {
      const mat = tubeRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.3 + intensity * 0.15 + Math.sin(t * 2 + intensity * 5) * 0.15 * intensity;
    }

    // Animate particles along curve — electricity-like jitter
    if (particlesRef.current) {
      const positions = particlesRef.current.geometry.attributes.position;
      const speed = 0.15 + intensity * 0.2;
      for (let i = 0; i < particleCount; i++) {
        const frac = (i / particleCount + t * speed) % 1;
        const point = curve.getPoint(frac);
        // Electric jitter: lateral offset oscillates rapidly, scaled by intensity
        const jitterFreq = 6 + intensity * 8;
        const jitterAmp = 0.03 + intensity * 0.06;
        const offsetX = Math.sin(t * jitterFreq + i * 3.7) * jitterAmp;
        const offsetY = Math.cos(t * jitterFreq * 0.7 + i * 2.3) * jitterAmp;
        positions.array[i * 3] = point.x + offsetX;
        positions.array[i * 3 + 1] = point.y + offsetY;
        positions.array[i * 3 + 2] = point.z + Math.sin(t * 4 + i) * jitterAmp * 0.5;
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
      <mesh geometry={new THREE.TubeGeometry(curve, 64, 0.06 + intensity * 0.05, 8, false)}>
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
