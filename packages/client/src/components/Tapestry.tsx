import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text } from '@react-three/drei';
import * as THREE from 'three';
import type { Entity, NarrativeEvent, Tension } from '../hooks/useApi';

interface TapestryProps {
  entities: Entity[];
  events: NarrativeEvent[];
  tensions: Tension[];
}

const entityTypeColors: Record<string, string> = {
  person: '#8b5cf6',
  company: '#22d3ee',
  institution: '#f97316',
  group: '#22c55e',
  concept: '#ec4899',
};

function EntitySphere({
  entity,
  position,
}: {
  entity: Entity;
  position: [number, number, number];
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const color = entityTypeColors[entity.type] || '#8b5cf6';

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.position.y =
        position[1] + Math.sin(state.clock.elapsedTime * 0.5 + position[0]) * 0.15;
    }
  });

  return (
    <group>
      <mesh ref={meshRef} position={position}>
        <sphereGeometry args={[entity.type === 'person' ? 0.3 : 0.4, 32, 32]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.3}
          transparent
          opacity={0.8}
        />
      </mesh>
      {/* Glow */}
      <mesh position={position}>
        <sphereGeometry args={[entity.type === 'person' ? 0.5 : 0.6, 16, 16]} />
        <meshBasicMaterial color={color} transparent opacity={0.05} />
      </mesh>
      <Text
        position={[position[0], position[1] - 0.6, position[2]]}
        fontSize={0.18}
        color="#e2e8f0"
        anchorX="center"
        anchorY="middle"
        font="https://fonts.gstatic.com/s/jetbrainsmono/v18/tDbY2o-flEEny0FZhsfKu5WU4zr3E_BX0PnT8RD8yKxjPVmUsaaDhw.woff2"
      >
        {entity.name}
      </Text>
    </group>
  );
}

function TensionThread({
  from,
  to,
  intensity,
  status,
}: {
  from: [number, number, number];
  to: [number, number, number];
  intensity: number;
  status: string;
}) {
  const curve = useMemo(() => {
    const mid: [number, number, number] = [
      (from[0] + to[0]) / 2,
      (from[1] + to[1]) / 2 + 1,
      (from[2] + to[2]) / 2,
    ];
    return new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(...from),
      new THREE.Vector3(...mid),
      new THREE.Vector3(...to)
    );
  }, [from, to]);

  const geometry = useMemo(() => {
    const points = curve.getPoints(50);
    return new THREE.BufferGeometry().setFromPoints(points);
  }, [curve]);

  const color =
    status === 'critical'
      ? '#ef4444'
      : status === 'escalating'
        ? '#f97316'
        : '#eab308';

  const lineRef = useRef<THREE.Line>(null);

  useFrame((state) => {
    if (lineRef.current) {
      const mat = lineRef.current.material as THREE.LineBasicMaterial;
      mat.opacity = 0.3 + Math.sin(state.clock.elapsedTime * 2) * 0.2 * intensity;
    }
  });

  return (
    <primitive object={new THREE.Line(geometry, new THREE.LineBasicMaterial({
      color,
      transparent: true,
      opacity: 0.5,
    }))} ref={lineRef} />
  );
}

function EventParticle({
  event,
  position,
}: {
  event: NarrativeEvent;
  position: [number, number, number];
}) {
  const ref = useRef<THREE.Mesh>(null);
  const color = event.sentiment > 0 ? '#22d3ee' : event.sentiment < -0.3 ? '#ef4444' : '#f97316';

  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.y = state.clock.elapsedTime * 0.3;
      ref.current.scale.setScalar(
        0.8 + Math.sin(state.clock.elapsedTime + position[0] * 3) * 0.1
      );
    }
  });

  return (
    <mesh ref={ref} position={position}>
      <octahedronGeometry args={[0.08 + event.impact * 0.12, 0]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.5}
        transparent
        opacity={0.7}
      />
    </mesh>
  );
}

function TimeRiver() {
  const ref = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (ref.current) {
      const mat = ref.current.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = 0.05 + Math.sin(state.clock.elapsedTime * 0.5) * 0.03;
    }
  });

  return (
    <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]}>
      <planeGeometry args={[20, 20, 32, 32]} />
      <meshStandardMaterial
        color="#0a0a1a"
        emissive="#8b5cf6"
        emissiveIntensity={0.05}
        transparent
        opacity={0.3}
        wireframe
      />
    </mesh>
  );
}

function Scene({ entities, events, tensions }: TapestryProps) {
  const entityPositions = useMemo(() => {
    const positions = new Map<string, [number, number, number]>();
    const count = entities.length;
    entities.forEach((entity, i) => {
      const angle = (i / count) * Math.PI * 2;
      const radius = 3 + (i % 2) * 1.5;
      positions.set(entity.id, [
        Math.cos(angle) * radius,
        0,
        Math.sin(angle) * radius,
      ]);
    });
    return positions;
  }, [entities]);

  const eventPositions = useMemo(() => {
    if (events.length === 0) return [];
    const sorted = [...events].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    const timeRange = [
      new Date(sorted[0].timestamp).getTime(),
      new Date(sorted[sorted.length - 1].timestamp).getTime(),
    ];
    const span = timeRange[1] - timeRange[0] || 1;

    return sorted.map((event) => {
      const t = (new Date(event.timestamp).getTime() - timeRange[0]) / span;
      const x = -8 + t * 16;
      const y = -1 + event.impact * 2;
      const z = (Math.random() - 0.5) * 2;
      return { event, position: [x, y, z] as [number, number, number] };
    });
  }, [events]);

  return (
    <>
      <ambientLight intensity={0.2} />
      <pointLight position={[10, 10, 10]} intensity={0.5} color="#8b5cf6" />
      <pointLight position={[-10, -5, -10]} intensity={0.3} color="#22d3ee" />

      <TimeRiver />

      {entities.map((entity) => {
        const pos = entityPositions.get(entity.id);
        if (!pos) return null;
        return <EntitySphere key={entity.id} entity={entity} position={pos} />;
      })}

      {tensions.map((tension) => {
        const from = entityPositions.get(tension.parties[0]);
        const to = entityPositions.get(tension.parties[1]);
        if (!from || !to) return null;
        return (
          <TensionThread
            key={tension.id}
            from={from}
            to={to}
            intensity={tension.intensity}
            status={tension.status}
          />
        );
      })}

      {eventPositions.map(({ event, position }) => (
        <EventParticle key={event.id} event={event} position={position} />
      ))}

      <OrbitControls
        enablePan
        enableZoom
        enableRotate
        autoRotate
        autoRotateSpeed={0.3}
        maxPolarAngle={Math.PI / 1.5}
        minPolarAngle={Math.PI / 4}
      />
    </>
  );
}

export default function Tapestry({ entities, events, tensions }: TapestryProps) {
  if (entities.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-loom-muted text-sm italic font-serif">
        The tapestry awaits its first threads...
      </div>
    );
  }

  return (
    <Canvas
      camera={{ position: [0, 5, 10], fov: 60 }}
      style={{ background: '#0a0a0f' }}
    >
      <Scene entities={entities} events={events} tensions={tensions} />
    </Canvas>
  );
}
