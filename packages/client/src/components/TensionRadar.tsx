import { useState, useEffect } from 'react';
import { api, type PressurePoint, type Tension, type Entity } from '../hooks/useApi';
import { AlertTriangle, Activity, Zap } from 'lucide-react';

interface TensionRadarProps {
  tensions: Tension[];
  entities: Entity[];
}

export default function TensionRadar({ tensions, entities }: TensionRadarProps) {
  const [pressurePoints, setPressurePoints] = useState<PressurePoint[]>([]);
  const [loading, setLoading] = useState(false);

  const entityMap = new Map(entities.map((e) => [e.id, e]));

  useEffect(() => {
    if (tensions.length === 0) {
      setPressurePoints([]);
      return;
    }
    setLoading(true);
    api
      .getPressurePoints()
      .then(setPressurePoints)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [tensions]);

  const getUrgencyColor = (score: number) => {
    if (score > 0.7) return 'text-red-400 border-red-500/30 bg-red-500/10';
    if (score > 0.4) return 'text-orange-400 border-orange-500/30 bg-orange-500/10';
    return 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10';
  };

  const getUrgencyIcon = (score: number) => {
    if (score > 0.7) return <Zap size={14} className="text-red-400" />;
    if (score > 0.4) return <AlertTriangle size={14} className="text-orange-400" />;
    return <Activity size={14} className="text-yellow-400" />;
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      simmering: 'Simmering',
      escalating: 'Escalating',
      critical: 'CRITICAL',
      resolving: 'Resolving',
      resolved: 'Resolved',
    };
    return labels[status] || status;
  };

  const getTension = (id: string) => tensions.find((t) => t.id === id);

  return (
    <div className="h-full overflow-y-auto p-4 space-y-3">
      {tensions.length === 0 ? (
        <div className="flex items-center justify-center h-full text-loom-muted text-sm italic font-serif">
          No tensions detected. Load a narrative to reveal the pressure points...
        </div>
      ) : loading ? (
        <div className="flex items-center justify-center h-full text-loom-muted text-sm">
          Scanning for narrative tensions...
        </div>
      ) : (
        <>
          <div className="text-xs text-loom-muted uppercase tracking-wider mb-2">
            {pressurePoints.length} Pressure Points Detected
          </div>
          {pressurePoints.map((pp) => {
            const tension = getTension(pp.tensionId);
            if (!tension) return null;
            const party1 = entityMap.get(tension.parties[0])?.name || tension.parties[0];
            const party2 = entityMap.get(tension.parties[1])?.name || tension.parties[1];

            return (
              <div
                key={pp.tensionId}
                className={`border rounded-lg p-3 ${getUrgencyColor(pp.score)} transition-all`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getUrgencyIcon(pp.score)}
                    <span className="font-serif font-semibold text-sm">{pp.tensionName}</span>
                  </div>
                  <span className="text-xs font-mono opacity-70">
                    {(pp.score * 100).toFixed(0)}%
                  </span>
                </div>

                <div className="flex items-center gap-2 mb-2 text-xs">
                  <span className="px-1.5 py-0.5 rounded bg-loom-bg/50">{party1}</span>
                  <span className="text-loom-muted">vs</span>
                  <span className="px-1.5 py-0.5 rounded bg-loom-bg/50">{party2}</span>
                </div>

                <div className="text-xs opacity-80 font-serif italic mb-2">
                  {tension.description}
                </div>

                <div className="flex gap-3 text-[10px] opacity-60">
                  <span>Duration: {pp.factors.duration.toFixed(2)}</span>
                  <span>Escalation: {pp.factors.escalation.toFixed(2)}</span>
                  <span>Convergence: {pp.factors.convergence.toFixed(2)}</span>
                </div>

                <div className="mt-2 flex items-center gap-2 text-[10px]">
                  <span
                    className={`px-1.5 py-0.5 rounded ${
                      tension.status === 'critical'
                        ? 'bg-red-500/30 text-red-300'
                        : tension.status === 'escalating'
                          ? 'bg-orange-500/30 text-orange-300'
                          : 'bg-yellow-500/30 text-yellow-300'
                    }`}
                  >
                    {getStatusLabel(tension.status)}
                  </span>
                  <span className="text-loom-muted">{tension.duration} days</span>
                </div>
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}
