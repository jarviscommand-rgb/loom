import { useRef, useEffect } from 'react';
import * as d3 from 'd3';
import type { Entity, Tension } from '../hooks/useApi';

interface NetworkGraphProps {
  entities: Entity[];
  tensions: Tension[];
}

interface SimNode extends d3.SimulationNodeDatum {
  id: string;
  name: string;
  type: string;
  motivation: string;
  connectionCount: number;
}

interface SimLink extends d3.SimulationLinkDatum<SimNode> {
  tension: Tension;
}

const nodeColorMap: Record<string, string> = {
  person: '#8b5cf6',
  company: '#22d3ee',
  institution: '#f97316',
  group: '#22c55e',
  concept: '#ec4899',
};

const nodeIcons: Record<string, string> = {
  person: '●',
  company: '◆',
  institution: '■',
  group: '▲',
  concept: '✦',
};

export default function NetworkGraph({ entities, tensions }: NetworkGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || entities.length === 0) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    svg.attr('width', width).attr('height', height);

    // Count connections per entity
    const connectionCounts = new Map<string, number>();
    tensions.forEach((t) => {
      connectionCounts.set(t.parties[0], (connectionCounts.get(t.parties[0]) || 0) + 1);
      connectionCounts.set(t.parties[1], (connectionCounts.get(t.parties[1]) || 0) + 1);
    });

    const entityMap = new Map(entities.map((e) => [e.id, e]));

    // Build nodes & links
    const nodes: SimNode[] = entities.map((e) => ({
      id: e.id,
      name: e.name,
      type: e.type,
      motivation: e.motivation,
      connectionCount: connectionCounts.get(e.id) || 0,
    }));

    const links: SimLink[] = tensions
      .filter((t) => entityMap.has(t.parties[0]) && entityMap.has(t.parties[1]))
      .map((t) => ({
        source: t.parties[0],
        target: t.parties[1],
        tension: t,
      }));

    const tensionColor = (intensity: number) => {
      if (intensity > 0.8) return '#ef4444';
      if (intensity > 0.5) return '#f97316';
      return '#eab308';
    };

    // Defs
    const defs = svg.append('defs');

    // Glow filter
    const glowFilter = defs
      .append('filter')
      .attr('id', 'node-glow')
      .attr('x', '-50%')
      .attr('y', '-50%')
      .attr('width', '200%')
      .attr('height', '200%');
    glowFilter.append('feGaussianBlur').attr('stdDeviation', '6').attr('result', 'blur');
    const merge = glowFilter.append('feMerge');
    merge.append('feMergeNode').attr('in', 'blur');
    merge.append('feMergeNode').attr('in', 'SourceGraphic');

    // Link glow filter
    const linkGlow = defs
      .append('filter')
      .attr('id', 'link-glow')
      .attr('x', '-20%')
      .attr('y', '-20%')
      .attr('width', '140%')
      .attr('height', '140%');
    linkGlow.append('feGaussianBlur').attr('stdDeviation', '3').attr('result', 'blur');
    const linkMerge = linkGlow.append('feMerge');
    linkMerge.append('feMergeNode').attr('in', 'blur');
    linkMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    // Zoom behavior
    const g = svg.append('g');
    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 4])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });
    svg.call(zoom);

    // Simulation
    const maxConnections = Math.max(1, ...nodes.map((n) => n.connectionCount));
    const nodeRadius = (d: SimNode) => 10 + (d.connectionCount / maxConnections) * 16;

    const simulation = d3
      .forceSimulation(nodes)
      .force(
        'link',
        d3
          .forceLink<SimNode, SimLink>(links)
          .id((d) => d.id)
          .distance(140)
      )
      .force('charge', d3.forceManyBody().strength(-400))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force(
        'collision',
        d3.forceCollide((d) => nodeRadius(d as SimNode) + 15)
      );

    // Tooltip
    const tooltip = d3
      .select(container)
      .append('div')
      .attr('class', 'network-tooltip')
      .style('position', 'absolute')
      .style('pointer-events', 'none')
      .style('opacity', 0)
      .style('background', 'rgba(10, 10, 15, 0.95)')
      .style('border', '1px solid rgba(139, 92, 246, 0.3)')
      .style('border-radius', '10px')
      .style('padding', '12px 14px')
      .style('font-size', '12px')
      .style('max-width', '250px')
      .style('z-index', '100')
      .style('backdrop-filter', 'blur(8px)')
      .style('box-shadow', '0 8px 32px rgba(0,0,0,0.5)');

    // Curved links
    const linkGroup = g.append('g');
    const linkPaths = linkGroup
      .selectAll('path')
      .data(links)
      .enter()
      .append('path')
      .attr('fill', 'none')
      .attr('stroke', (d) => tensionColor(d.tension.intensity))
      .attr('stroke-width', (d) => 1 + d.tension.intensity * 3)
      .attr('stroke-opacity', 0.5)
      .attr('filter', 'url(#link-glow)')
      .attr('stroke-dasharray', (d) => (d.tension.status === 'critical' ? 'none' : '6,4'))
      .style('animation', 'dash 20s linear infinite');

    // Link hover highlight labels
    const linkLabelGroup = g.append('g');
    const linkLabels = linkLabelGroup
      .selectAll('text')
      .data(links)
      .enter()
      .append('text')
      .attr('fill', (d) => tensionColor(d.tension.intensity))
      .attr('font-size', '9px')
      .attr('text-anchor', 'middle')
      .attr('font-family', "'Crimson Pro', serif")
      .attr('font-style', 'italic')
      .attr('opacity', 0.6)
      .text((d) => d.tension.name);

    // Nodes
    const nodeGroup = g.append('g');
    const node = nodeGroup
      .selectAll('g')
      .data(nodes)
      .enter()
      .append('g')
      .style('cursor', 'pointer')
      .call(
        d3
          .drag<SVGGElement, SimNode>()
          .on('start', (event, d) => {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on('drag', (event, d) => {
            d.fx = event.x;
            d.fy = event.y;
          })
          .on('end', (event, d) => {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
          })
      );

    // Node outer glow ring
    node
      .append('circle')
      .attr('r', (d) => nodeRadius(d) + 8)
      .attr('fill', 'none')
      .attr('stroke', (d) => nodeColorMap[d.type] || '#8b5cf6')
      .attr('stroke-width', 1)
      .attr('stroke-opacity', 0.15);

    // Node circles
    node
      .append('circle')
      .attr('class', 'node-circle')
      .attr('r', nodeRadius)
      .attr('fill', (d) => nodeColorMap[d.type] || '#8b5cf6')
      .attr('fill-opacity', 0.15)
      .attr('stroke', (d) => nodeColorMap[d.type] || '#8b5cf6')
      .attr('stroke-width', 2)
      .attr('filter', 'url(#node-glow)');

    // Node type icons
    node
      .append('text')
      .attr('dy', 5)
      .attr('text-anchor', 'middle')
      .attr('fill', (d) => nodeColorMap[d.type] || '#8b5cf6')
      .attr('font-size', (d) => `${10 + (d.connectionCount / maxConnections) * 6}px`)
      .attr('font-weight', 'bold')
      .text((d) => d.name.charAt(0).toUpperCase());

    // Node labels
    node
      .append('text')
      .attr('dy', (d) => nodeRadius(d) + 14)
      .attr('text-anchor', 'middle')
      .attr('fill', '#e2e8f0')
      .attr('font-size', '11px')
      .attr('font-family', "'Crimson Pro', serif")
      .attr('font-weight', '600')
      .attr('opacity', 0.85)
      .text((d) => d.name);

    // Hover interactions
    node
      .on('mouseover', function (event, d) {
        // Highlight node
        d3.select(this)
          .select('.node-circle')
          .transition()
          .duration(200)
          .attr('fill-opacity', 0.35)
          .attr('stroke-width', 3);

        // Highlight connected links
        linkPaths
          .transition()
          .duration(200)
          .attr('stroke-opacity', (l) => {
            const src = (l.source as SimNode).id;
            const tgt = (l.target as SimNode).id;
            return src === d.id || tgt === d.id ? 0.9 : 0.1;
          });

        // Show tooltip
        tooltip.transition().duration(150).style('opacity', 1);
        tooltip
          .html(
            `<div style="color: ${nodeColorMap[d.type]}; font-weight: 600; font-family: 'Crimson Pro', serif; font-size: 14px; margin-bottom: 4px;">${d.name}</div>
          <div style="color: #64748b; font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 6px;">${d.type} · ${d.connectionCount} connections</div>
          <div style="color: #e2e8f0; font-style: italic; font-family: 'Crimson Pro', serif;">"${d.motivation}"</div>`
          )
          .style('left', `${event.offsetX + 15}px`)
          .style('top', `${event.offsetY - 10}px`);
      })
      .on('mouseout', function () {
        d3.select(this)
          .select('.node-circle')
          .transition()
          .duration(300)
          .attr('fill-opacity', 0.15)
          .attr('stroke-width', 2);

        linkPaths.transition().duration(300).attr('stroke-opacity', 0.5);

        tooltip.transition().duration(200).style('opacity', 0);
      });

    // Curved link path generator
    const linkPath = (d: SimLink) => {
      const src = d.source as SimNode;
      const tgt = d.target as SimNode;
      const dx = tgt.x! - src.x!;
      const dy = tgt.y! - src.y!;
      const dr = Math.sqrt(dx * dx + dy * dy) * 0.8;
      return `M${src.x},${src.y}A${dr},${dr} 0 0,1 ${tgt.x},${tgt.y}`;
    };

    // Tick
    simulation.on('tick', () => {
      linkPaths.attr('d', linkPath);

      linkLabels
        .attr('x', (d) => ((d.source as SimNode).x! + (d.target as SimNode).x!) / 2)
        .attr('y', (d) => ((d.source as SimNode).y! + (d.target as SimNode).y!) / 2 - 10);

      node.attr('transform', (d) => `translate(${d.x},${d.y})`);
    });

    return () => {
      simulation.stop();
      tooltip.remove();
    };
  }, [entities, tensions]);

  return (
    <div ref={containerRef} className="w-full h-full relative">
      {entities.length === 0 ? (
        <div className="flex items-center justify-center h-full text-loom-muted text-sm italic font-serif">
          No characters yet. Load a narrative to see relationships emerge...
        </div>
      ) : (
        <>
          <svg ref={svgRef} className="w-full h-full" />
          {/* Legend */}
          <div className="absolute bottom-3 left-3 flex gap-3 text-[10px] text-loom-muted bg-loom-bg/80 backdrop-blur-sm rounded-lg px-3 py-2 border border-loom-border/50">
            {Object.entries(nodeColorMap).map(([type, color]) => (
              <div key={type} className="flex items-center gap-1">
                <span style={{ color }} className="text-xs">
                  {nodeIcons[type]}
                </span>
                <span className="capitalize">{type}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
