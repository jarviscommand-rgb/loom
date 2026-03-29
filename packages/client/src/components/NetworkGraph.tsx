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
}

interface SimLink extends d3.SimulationLinkDatum<SimNode> {
  tension: Tension;
}

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

    // Defs
    const defs = svg.append('defs');
    const glowFilter = defs.append('filter').attr('id', 'node-glow');
    glowFilter.append('feGaussianBlur').attr('stdDeviation', '4').attr('result', 'blur');
    const merge = glowFilter.append('feMerge');
    merge.append('feMergeNode').attr('in', 'blur');
    merge.append('feMergeNode').attr('in', 'SourceGraphic');

    const entityMap = new Map(entities.map((e) => [e.id, e]));

    // Build nodes & links
    const nodes: SimNode[] = entities.map((e) => ({
      id: e.id,
      name: e.name,
      type: e.type,
      motivation: e.motivation,
    }));

    const links: SimLink[] = tensions
      .filter((t) => entityMap.has(t.parties[0]) && entityMap.has(t.parties[1]))
      .map((t) => ({
        source: t.parties[0],
        target: t.parties[1],
        tension: t,
      }));

    const nodeColorMap: Record<string, string> = {
      person: '#8b5cf6',
      company: '#22d3ee',
      institution: '#f97316',
      group: '#22c55e',
      concept: '#ec4899',
    };

    const tensionColor = (intensity: number) => {
      if (intensity > 0.8) return '#ef4444';
      if (intensity > 0.5) return '#f97316';
      return '#eab308';
    };

    // Simulation
    const simulation = d3
      .forceSimulation(nodes)
      .force(
        'link',
        d3
          .forceLink<SimNode, SimLink>(links)
          .id((d) => d.id)
          .distance(120)
      )
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide(40));

    // Tooltip
    const tooltip = d3
      .select(container)
      .append('div')
      .style('position', 'absolute')
      .style('pointer-events', 'none')
      .style('opacity', 0)
      .style('background', 'rgba(18, 18, 26, 0.95)')
      .style('border', '1px solid #1e1e2e')
      .style('border-radius', '8px')
      .style('padding', '12px')
      .style('font-size', '12px')
      .style('max-width', '250px')
      .style('z-index', '100');

    // Links
    const link = svg
      .append('g')
      .selectAll('line')
      .data(links)
      .enter()
      .append('line')
      .attr('stroke', (d) => tensionColor(d.tension.intensity))
      .attr('stroke-width', (d) => 1 + d.tension.intensity * 4)
      .attr('stroke-opacity', 0.6)
      .attr('class', (d) => (d.tension.status === 'critical' ? 'tension-glow' : ''));

    // Tension labels on links
    const linkLabels = svg
      .append('g')
      .selectAll('text')
      .data(links)
      .enter()
      .append('text')
      .attr('fill', (d) => tensionColor(d.tension.intensity))
      .attr('font-size', '9px')
      .attr('text-anchor', 'middle')
      .attr('font-family', "'Crimson Pro', serif")
      .attr('font-style', 'italic')
      .text((d) => d.tension.name);

    // Nodes
    const node = svg
      .append('g')
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

    // Node circles
    node
      .append('circle')
      .attr('r', (d) => (d.type === 'person' ? 14 : 18))
      .attr('fill', (d) => nodeColorMap[d.type] || '#8b5cf6')
      .attr('fill-opacity', 0.2)
      .attr('stroke', (d) => nodeColorMap[d.type] || '#8b5cf6')
      .attr('stroke-width', 2)
      .attr('filter', 'url(#node-glow)');

    // Node labels
    node
      .append('text')
      .attr('dy', (d) => (d.type === 'person' ? 28 : 32))
      .attr('text-anchor', 'middle')
      .attr('fill', '#e2e8f0')
      .attr('font-size', '11px')
      .attr('font-family', "'Crimson Pro', serif")
      .attr('font-weight', '600')
      .text((d) => d.name);

    // Node type icons (first letter)
    node
      .append('text')
      .attr('dy', 4)
      .attr('text-anchor', 'middle')
      .attr('fill', (d) => nodeColorMap[d.type] || '#8b5cf6')
      .attr('font-size', '12px')
      .attr('font-weight', 'bold')
      .text((d) => d.name.charAt(0).toUpperCase());

    // Hover
    node
      .on('mouseover', function (event, d) {
        d3.select(this).select('circle').attr('fill-opacity', 0.4);
        tooltip
          .style('opacity', 1)
          .html(
            `<div style="color: ${nodeColorMap[d.type]}; font-weight: 600; font-family: 'Crimson Pro', serif; font-size: 14px; margin-bottom: 4px;">${d.name}</div>
            <div style="color: #64748b; font-size: 10px; text-transform: uppercase; margin-bottom: 6px;">${d.type}</div>
            <div style="color: #e2e8f0; font-style: italic;">"${d.motivation}"</div>`
          )
          .style('left', `${event.offsetX + 15}px`)
          .style('top', `${event.offsetY - 10}px`);
      })
      .on('mouseout', function () {
        d3.select(this).select('circle').attr('fill-opacity', 0.2);
        tooltip.style('opacity', 0);
      });

    // Tick
    simulation.on('tick', () => {
      link
        .attr('x1', (d) => (d.source as SimNode).x!)
        .attr('y1', (d) => (d.source as SimNode).y!)
        .attr('x2', (d) => (d.target as SimNode).x!)
        .attr('y2', (d) => (d.target as SimNode).y!);

      linkLabels
        .attr('x', (d) => ((d.source as SimNode).x! + (d.target as SimNode).x!) / 2)
        .attr('y', (d) => ((d.source as SimNode).y! + (d.target as SimNode).y!) / 2 - 8);

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
        <svg ref={svgRef} className="w-full h-full" />
      )}
    </div>
  );
}
