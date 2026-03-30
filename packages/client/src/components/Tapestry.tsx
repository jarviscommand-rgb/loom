import { useState, useMemo, useCallback, useRef } from 'react';
import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette, DepthOfField } from '@react-three/postprocessing';
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

/** Subtle mouse-following spotlight that adds depth when hovering the scene */
function MouseSpotlight() {
  const lightRef = useRef<THREE.PointLight>(null);
  const { camera, pointer } = useThree();

  useFrame(() => {
    if (lightRef.current) {
      // Project mouse into 3D space a few units in front of camera
      const vec = new THREE.Vector3(pointer.x, pointer.y, 0.5).unproject(camera);
      const dir = vec.sub(camera.position).normalize();
      const target = camera.position.clone().add(dir.multiplyScalar(8));
      // Smooth follow
      lightRef.current.position.lerp(target, 0.08);
    }
  });

  return <pointLight ref={lightRef} color="#c4b5fd" intensity={0.25} distance={12} decay={2} />;
}

/**
 * Smooth camera animator — lerps camera toward a target entity position
 * when focusTarget is set, then eases back to orbit on clear.
 */
function CameraAnimator({ focusTarget }: { focusTarget: [number, number, number] | null }) {
  const { camera } = useThree();
  const targetPos = useRef(new THREE.Vector3(0, 5, 10));
  const isAnimating = useRef(false);

  useFrame(() => {
    if (focusTarget) {
      // Compute a close-up offset from the entity
      const entityPos = new THREE.Vector3(...focusTarget);
      const desired = entityPos.clone().add(new THREE.Vector3(1.5, 1.5, 3));
      targetPos.current.copy(desired);
      isAnimating.current = true;
    } else if (isAnimating.current) {
      // Ease back to default orbit position
      targetPos.current.set(0, 5, 10);
      // Once close enough, stop animating
      if (camera.position.distanceTo(targetPos.current) < 0.1) {
        isAnimating.current = false;
      }
    }

    if (isAnimating.current) {
      camera.position.lerp(targetPos.current, 0.04);
    }
  });

  return null;
}

function Scene({
  entities,
  events,
  tensions,
  onHover,
  onHoverEnd,
  focusTarget,
}: TapestryProps & {
  onHover: (info: HoverInfo) => void;
  onHoverEnd: () => void;
  focusTarget: [number, number, number] | null;
}) {
  /** Map entity ID → number of connections (tensions) */
  const connectionCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const tension of tensions) {
      for (const party of tension.parties) {
        counts.set(party, (counts.get(party) || 0) + 1);
      }
    }
    return counts;
  }, [tensions]);

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
      <MouseSpotlight />

      {/* Camera focus animator */}
      <CameraAnimator focusTarget={focusTarget} />

      {/* Fog for depth */}
      <fog attach="fog" args={['#0a0a0f', 15, 40]} />

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
            connectionCount={connectionCounts.get(entity.id) || 0}
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

      {/* Postprocessing — bloom + depth of field + vignette */}
      <EffectComposer>
        <Bloom luminanceThreshold={0.2} luminanceSmoothing={0.9} intensity={1.2} mipmapBlur />
        <DepthOfField
          focusDistance={0}
          focalLength={focusTarget ? 0.05 : 0.02}
          bokehScale={focusTarget ? 4 : 1.5}
        />
        <Vignette offset={0.3} darkness={0.7} />
      </EffectComposer>

      {/* Controls — smooth idle auto-orbit */}
      <OrbitControls
        enablePan
        enableZoom
        enableRotate
        autoRotate
        autoRotateSpeed={0.15}
        maxPolarAngle={Math.PI / 1.5}
        minPolarAngle={Math.PI / 4}
        enableDamping
        dampingFactor={0.04}
        maxDistance={25}
        minDistance={4}
      />
    </>
  );
}

export default function Tapestry({ entities, events, tensions }: TapestryProps) {
  const [hover, setHover] = useState<HoverInfo | null>(null);
  const [focusTarget, setFocusTarget] = useState<[number, number, number] | null>(null);

  const handleHover = useCallback((info: HoverInfo) => setHover(info), []);
  const handleHoverEnd = useCallback(() => setHover(null), []);

  /** Click on canvas background clears focus */
  const handleCanvasClick = useCallback(() => {
    setFocusTarget(null);
  }, []);

  /** Click on an entity to focus camera on it */
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

  const handleEntityClick = useCallback(
    (entityId: string) => {
      const pos = entityPositions.get(entityId);
      if (pos) {
        setFocusTarget((prev) => {
          // Toggle off if clicking same entity
          if (prev && prev[0] === pos[0] && prev[2] === pos[2]) return null;
          return pos;
        });
      }
    },
    [entityPositions]
  );

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
        onPointerMissed={handleCanvasClick}
      >
        <Scene
          entities={entities}
          events={events}
          tensions={tensions}
          onHover={handleHover}
          onHoverEnd={handleHoverEnd}
          focusTarget={focusTarget}
        />
      </Canvas>

      {/* Glass-morphism hover tooltip overlay */}
      {hover && (
        <div
          className="pointer-events-none fixed z-50 px-4 py-3 rounded-xl max-w-[220px]"
          style={{
            left: hover.x + 14,
            top: hover.y - 12,
            background: 'rgba(10, 10, 20, 0.7)',
            backdropFilter: 'blur(16px) saturate(1.5)',
            WebkitBackdropFilter: 'blur(16px) saturate(1.5)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            boxShadow:
              '0 8px 32px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(139, 92, 246, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
          }}
        >
          <div
            className="font-serif font-semibold text-sm mb-0.5"
            style={{ color: entityTypeColors[hover.type] || '#8b5cf6' }}
          >
            {hover.name}
          </div>
          <div className="text-[10px] text-loom-muted uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{
                backgroundColor: entityTypeColors[hover.type] || '#8b5cf6',
                boxShadow: `0 0 6px ${entityTypeColors[hover.type] || '#8b5cf6'}`,
              }}
            />
            {hover.type}
          </div>
          <div className="text-xs text-loom-text/80 italic font-serif leading-relaxed">
            &ldquo;{hover.motivation}&rdquo;
          </div>
        </div>
      )}

      {/* Entity click hint */}
      {focusTarget && (
        <div className="absolute top-3 right-3 text-[10px] text-loom-muted/60 bg-black/30 backdrop-blur-sm rounded-md px-2 py-1">
          Click empty space to reset view
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-3 left-3 flex gap-3 text-[10px] text-loom-muted">
        {Object.entries(entityTypeColors).map(([type, color]) => (
          <button
            key={type}
            className="flex items-center gap-1 hover:text-loom-text transition-colors duration-200 cursor-pointer"
            onClick={() => {
              const entity = entities.find((e) => e.type === type);
              if (entity) handleEntityClick(entity.id);
            }}
          >
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: color, boxShadow: `0 0 4px ${color}` }}
            />
            <span className="capitalize">{type}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
