import { useState, useMemo, useCallback } from 'react';
import { Canvas, type ThreeEvent } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';
import type { Entity, NarrativeEvent, Tension } from '../hooks/useApi';
import Starfield from './tapestry/Starfield';
import EntityNode, { entityTypeColors } from './tapestry/EntityNode';
import TensionThread from './tapestry/TensionThread';
import EventParticle from './tapestry/EventParticle';
import TimeRiver from './tapestry/TimeRiver';

interface TapestryProps {
  entities: Entity[];
  events: NarrativeEvent[];
  tensions: Tension[];
}

interface HoverInfo {
  name: string;
  type: string;
  motivation: string;
  x: number;
  y: number;
}

function Scene({
  entities,
  events,
  tensions,
  onHover,
  onHoverEnd,
}: TapestryProps & {
  onHover: (info: HoverInfo) => void;
  onHoverEnd: () => void;
}) {
  const entityPositions = useMemo(() => {
    const positions = new Map<string, [number, number, number]>();
    const count = entities.length;
    entities.forEach((entity, i) => {
      const angle = (i / count) * Math.PI * 2;
      const radius = 3 + (i % 2) * 1.5;
      positions.set(entity.id, [Math.cos(angle) * radius, 0, Math.sin(angle) * radius]);
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

    return sorted.map((event, idx) => {
      const t = (new Date(event.timestamp).getTime() - timeRange[0]) / span;
      const x = -8 + t * 16;
      const y = -1 + event.impact * 2;
      // Deterministic spread instead of random
      const z = Math.sin(idx * 2.39) * 1.5;
      return { event, position: [x, y, z] as [number, number, number] };
    });
  }, [events]);

  const handleEntityHover = useCallback(
    (entity: Entity) => (e: ThreeEvent<PointerEvent>) => {
      onHover({
        name: entity.name,
        type: entity.type,
        motivation: entity.motivation,
        x: e.nativeEvent.clientX,
        y: e.nativeEvent.clientY,
      });
    },
    [onHover]
  );

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.15} />
      <pointLight position={[10, 10, 10]} intensity={0.6} color="#8b5cf6" />
      <pointLight position={[-10, -5, -10]} intensity={0.4} color="#22d3ee" />
      <pointLight position={[0, 8, 0]} intensity={0.2} color="#f97316" />

      {/* Fog for depth */}
      <fog attach="fog" args={['#0a0a0f', 15, 35]} />

      {/* Background elements */}
      <Starfield />
      <TimeRiver />

      {/* Entities */}
      {entities.map((entity) => {
        const pos = entityPositions.get(entity.id);
        if (!pos) return null;
        return (
          <EntityNode
            key={entity.id}
            entity={entity}
            position={pos}
            onPointerOver={handleEntityHover(entity)}
            onPointerOut={onHoverEnd}
          />
        );
      })}

      {/* Tension threads */}
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

      {/* Events */}
      {eventPositions.map(({ event, position }) => (
        <EventParticle key={event.id} event={event} position={position} />
      ))}

      {/* Postprocessing */}
      <EffectComposer>
        <Bloom luminanceThreshold={0.2} luminanceSmoothing={0.9} intensity={1.2} mipmapBlur />
        <Vignette offset={0.3} darkness={0.7} />
      </EffectComposer>

      {/* Controls */}
      <OrbitControls
        enablePan
        enableZoom
        enableRotate
        autoRotate
        autoRotateSpeed={0.3}
        maxPolarAngle={Math.PI / 1.5}
        minPolarAngle={Math.PI / 4}
        enableDamping
        dampingFactor={0.05}
        maxDistance={25}
        minDistance={4}
      />
    </>
  );
}

export default function Tapestry({ entities, events, tensions }: TapestryProps) {
  const [hover, setHover] = useState<HoverInfo | null>(null);

  const handleHover = useCallback((info: HoverInfo) => setHover(info), []);
  const handleHoverEnd = useCallback(() => setHover(null), []);

  if (entities.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-loom-muted text-sm italic font-serif">
        The tapestry awaits its first threads...
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <Canvas
        camera={{ position: [0, 5, 10], fov: 60 }}
        style={{ background: '#0a0a0f' }}
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.2 }}
      >
        <Scene
          entities={entities}
          events={events}
          tensions={tensions}
          onHover={handleHover}
          onHoverEnd={handleHoverEnd}
        />
      </Canvas>

      {/* HTML hover tooltip overlay */}
      {hover && (
        <div
          className="pointer-events-none fixed z-50 px-3 py-2 rounded-lg border border-loom-border bg-loom-surface/95 backdrop-blur-md shadow-xl shadow-black/50 max-w-[200px]"
          style={{ left: hover.x + 12, top: hover.y - 10 }}
        >
          <div
            className="font-serif font-semibold text-sm mb-0.5"
            style={{ color: entityTypeColors[hover.type] || '#8b5cf6' }}
          >
            {hover.name}
          </div>
          <div className="text-[10px] text-loom-muted uppercase tracking-wider mb-1">
            {hover.type}
          </div>
          <div className="text-xs text-loom-text italic font-serif">
            &ldquo;{hover.motivation}&rdquo;
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-3 left-3 flex gap-3 text-[10px] text-loom-muted">
        {Object.entries(entityTypeColors).map(([type, color]) => (
          <div key={type} className="flex items-center gap-1">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: color, boxShadow: `0 0 4px ${color}` }}
            />
            <span className="capitalize">{type}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
