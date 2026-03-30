import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/** Holographic flowing grid floor representing the time dimension */
export default function TimeRiver() {
  const gridRef = useRef<THREE.Mesh>(null);
  const scanRef = useRef<THREE.Mesh>(null);

  // Custom shader for animated grid lines
  const gridMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: new THREE.Color('#8b5cf6') },
      },
      vertexShader: `
        varying vec2 vUv;
        varying float vY;
        void main() {
          vUv = uv;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          vY = position.y;
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform vec3 uColor;
        varying vec2 vUv;

        void main() {
          // Grid lines
          vec2 grid = abs(fract(vUv * 20.0 - vec2(0.0, uTime * 0.05)) - 0.5);
          float line = min(grid.x, grid.y);
          float gridAlpha = 1.0 - smoothstep(0.0, 0.04, line);

          // Distance fade from center
          float dist = length(vUv - 0.5) * 2.0;
          float fade = 1.0 - smoothstep(0.3, 1.0, dist);

          // Scan line effect
          float scan = smoothstep(0.98, 1.0, sin(vUv.y * 40.0 - uTime * 0.5) * 0.5 + 0.5);

          float alpha = (gridAlpha * 0.15 + scan * 0.05) * fade;
          gl_FragColor = vec4(uColor, alpha);
        }
      `,
    });
  }, []);

  useFrame((state) => {
    gridMaterial.uniforms.uTime.value = state.clock.elapsedTime;

    // Subtle scan line moving across the floor
    if (scanRef.current) {
      const t = state.clock.elapsedTime;
      scanRef.current.position.z = Math.sin(t * 0.2) * 8;
      const mat = scanRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.03 + Math.sin(t * 0.5) * 0.02;
    }
  });

  return (
    <group>
      {/* Main grid floor */}
      <mesh
        ref={gridRef}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -2, 0]}
        material={gridMaterial}
      >
        <planeGeometry args={[30, 30, 1, 1]} />
      </mesh>

      {/* Scan line */}
      <mesh ref={scanRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.98, 0]}>
        <planeGeometry args={[30, 0.3]} />
        <meshBasicMaterial
          color="#22d3ee"
          transparent
          opacity={0.04}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}
