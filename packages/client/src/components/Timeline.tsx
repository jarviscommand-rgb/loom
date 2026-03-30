import { useRef, useEffect, useState, useCallback } from 'react';
import * as d3 from 'd3';
import { ZoomIn, ZoomOut } from 'lucide-react';
import type { NarrativeEvent, Entity } from '../hooks/useApi';

interface TimelineProps {
  events: NarrativeEvent[];
  entities: Entity[];
}

/**
 * Build a map of event → all causal ancestors and descendants for chain highlighting.
 */
function buildCausalChains(events: NarrativeEvent[]) {
  const ancestors = new Map<string, Set<string>>();
  const descendants = new Map<string, Set<string>>();

  for (const e of events) {
    if (!ancestors.has(e.id)) ancestors.set(e.id, new Set());
    if (!descendants.has(e.id)) descendants.set(e.id, new Set());
    for (const predId of e.causalPredecessors) {
      ancestors.get(e.id)!.add(predId);
      if (!descendants.has(predId)) descendants.set(predId, new Set());
      descendants.get(predId)!.add(e.id);
    }
  }

  /** Get full chain (ancestors + descendants) for an event */
  return (eventId: string): Set<string> => {
    const chain = new Set<string>();
    // Walk ancestors
    const walkUp = (id: string) => {
      for (const anc of ancestors.get(id) || []) {
        if (!chain.has(anc)) {
          chain.add(anc);
          walkUp(anc);
        }
      }
    };
    // Walk descendants
    const walkDown = (id: string) => {
      for (const desc of descendants.get(id) || []) {
        if (!chain.has(desc)) {
          chain.add(desc);
          walkDown(desc);
        }
      }
    };
    chain.add(eventId);
    walkUp(eventId);
    walkDown(eventId);
    return chain;
  };
}

export default function Timeline({ events, entities }: TimelineProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoomLevel, setZoomLevel] = useState(1);

  const handleZoomIn = useCallback(() => setZoomLevel((z) => Math.min(z + 0.25, 3)), []);
  const handleZoomOut = useCallback(() => setZoomLevel((z) => Math.max(z - 0.25, 0.5)), []);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || events.length === 0) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;
    const margin = { top: 40, right: 40, bottom: 70, left: 50 };

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    svg.attr('width', width).attr('height', height);

    const entityMap = new Map(entities.map((e) => [e.id, e]));
    const getCausalChain = buildCausalChains(events);

    // Scales — apply zoom to time range
    const timeExtent = d3.extent(events, (e) => new Date(e.timestamp)) as [Date, Date];
    const timeMid = new Date((timeExtent[0].getTime() + timeExtent[1].getTime()) / 2);
    const halfRange = (timeExtent[1].getTime() - timeExtent[0].getTime()) / 2;
    const zoomedStart = new Date(timeMid.getTime() - halfRange / zoomLevel);
    const zoomedEnd = new Date(timeMid.getTime() + halfRange / zoomLevel);

    const xScale = d3
      .scaleTime()
      .domain([zoomedStart, zoomedEnd])
      .range([margin.left, width - margin.right]);

    const yScale = d3
      .scaleLinear()
      .domain([0, 1])
      .range([height - margin.bottom, margin.top]);

    const colorScale = (sentiment: number) => {
      if (sentiment > 0.3) return '#22d3ee';
      if (sentiment < -0.3) return '#ef4444';
      return '#f97316';
    };

    // Defs
    const defs = svg.append('defs');

    // Glow filter
    const filter = defs
      .append('filter')
      .attr('id', 'event-glow')
      .attr('x', '-50%')
      .attr('y', '-50%')
      .attr('width', '200%')
      .attr('height', '200%');
    filter.append('feGaussianBlur').attr('stdDeviation', '4').attr('result', 'coloredBlur');
    const merge = filter.append('feMerge');
    merge.append('feMergeNode').attr('in', 'coloredBlur');
    merge.append('feMergeNode').attr('in', 'SourceGraphic');

    // High-impact glow
    const hiGlow = defs
      .append('filter')
      .attr('id', 'hi-glow')
      .attr('x', '-100%')
      .attr('y', '-100%')
      .attr('width', '300%')
      .attr('height', '300%');
    hiGlow.append('feGaussianBlur').attr('stdDeviation', '8').attr('result', 'blur');
    const hiMerge = hiGlow.append('feMerge');
    hiMerge.append('feMergeNode').attr('in', 'blur');
    hiMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    // Causal chain highlight glow
    const chainGlow = defs
      .append('filter')
      .attr('id', 'chain-glow')
      .attr('x', '-50%')
      .attr('y', '-50%')
      .attr('width', '200%')
      .attr('height', '200%');
    chainGlow.append('feGaussianBlur').attr('stdDeviation', '6').attr('result', 'blur');
    const chainMerge = chainGlow.append('feMerge');
    chainMerge.append('feMergeNode').attr('in', 'blur');
    chainMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    // Clip path
    defs
      .append('clipPath')
      .attr('id', 'clip')
      .append('rect')
      .attr('x', margin.left)
      .attr('y', margin.top)
      .attr('width', width - margin.left - margin.right)
      .attr('height', height - margin.top - margin.bottom);

    const mainGroup = svg.append('g').attr('clip-path', 'url(#clip)');

    // Grid lines (subtle)
    const gridGroup = mainGroup.append('g').attr('class', 'grid');
    const xTicks = xScale.ticks(8);
    xTicks.forEach((tick) => {
      gridGroup
        .append('line')
        .attr('x1', xScale(tick))
        .attr('x2', xScale(tick))
        .attr('y1', margin.top)
        .attr('y2', height - margin.bottom)
        .attr('stroke', '#1e1e2e')
        .attr('stroke-width', 1)
        .attr('stroke-opacity', 0.5);
    });

    // Horizontal grid lines
    const yTicks = yScale.ticks(5);
    yTicks.forEach((tick) => {
      gridGroup
        .append('line')
        .attr('x1', margin.left)
        .attr('x2', width - margin.right)
        .attr('y1', yScale(tick))
        .attr('y2', yScale(tick))
        .attr('stroke', '#1e1e2e')
        .attr('stroke-width', 1)
        .attr('stroke-opacity', 0.3);
    });

    // Causal links — animated dashed curves
    const linkGroup = mainGroup.append('g').attr('class', 'links');
    const eventMap = new Map(events.map((e) => [e.id, e]));

    events.forEach((event) => {
      event.causalPredecessors.forEach((predId) => {
        const pred = eventMap.get(predId);
        if (!pred) return;
        const x1 = xScale(new Date(pred.timestamp));
        const y1 = yScale(pred.impact);
        const x2 = xScale(new Date(event.timestamp));
        const y2 = yScale(event.impact);
        const mx = (x1 + x2) / 2;
        const my = Math.min(y1, y2) - 30;

        linkGroup
          .append('path')
          .attr('d', `M${x1},${y1} Q${mx},${my} ${x2},${y2}`)
          .attr('fill', 'none')
          .attr('stroke', '#8b5cf6')
          .attr('stroke-width', 1.5)
          .attr('stroke-opacity', 0.25)
          .attr('stroke-dasharray', '5,4')
          .attr('data-from', predId)
          .attr('data-to', event.id)
          .style('animation', 'dash 15s linear infinite')
          .style('transition', 'stroke-opacity 0.3s ease, stroke-width 0.3s ease');
      });
    });

    // Tooltip
    const tooltip = d3
      .select(container)
      .append('div')
      .style('position', 'absolute')
      .style('pointer-events', 'none')
      .style('opacity', 0)
      .style('background', 'rgba(10, 10, 20, 0.85)')
      .style('border', '1px solid rgba(255, 255, 255, 0.08)')
      .style('border-radius', '12px')
      .style('padding', '12px 14px')
      .style('font-size', '12px')
      .style('max-width', '280px')
      .style('z-index', '100')
      .style('backdrop-filter', 'blur(16px) saturate(1.5)')
      .style('-webkit-backdrop-filter', 'blur(16px) saturate(1.5)')
      .style('box-shadow', '0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)')
      .style('transition', 'opacity 0.15s ease');

    // Event dots — enter with animation
    const eventGroup = mainGroup.append('g').attr('class', 'events');

    // Glow circles for high-impact events — impact-based glow intensity
    eventGroup
      .selectAll('.glow-circle')
      .data(events.filter((e) => e.impact >= 0.5))
      .enter()
      .append('circle')
      .attr('class', 'glow-circle')
      .attr('cx', (d) => xScale(new Date(d.timestamp)))
      .attr('cy', (d) => yScale(d.impact))
      .attr('r', 0)
      .attr('fill', (d) => colorScale(d.sentiment))
      .attr('fill-opacity', (d) => 0.04 + d.impact * 0.08)
      .attr('filter', 'url(#hi-glow)')
      .attr('data-event-id', (d) => d.id)
      .transition()
      .duration(800)
      .delay((_, i) => i * 100)
      .attr('r', (d) => 10 + d.impact * 22);

    // Main event dots
    eventGroup
      .selectAll('.event-dot')
      .data(events)
      .enter()
      .append('circle')
      .attr('class', 'event-dot')
      .attr('cx', (d) => xScale(new Date(d.timestamp)))
      .attr('cy', (d) => yScale(d.impact))
      .attr('r', 0)
      .attr('fill', (d) => colorScale(d.sentiment))
      .attr('fill-opacity', 0.85)
      .attr('stroke', (d) => colorScale(d.sentiment))
      .attr('stroke-width', 1.5)
      .attr('stroke-opacity', 0.5)
      .attr('filter', 'url(#event-glow)')
      .attr('data-event-id', (d) => d.id)
      .style('cursor', 'pointer')
      .style('transition', 'filter 0.3s ease')
      .transition()
      .duration(600)
      .delay((_, i) => i * 60)
      .ease(d3.easeBackOut)
      .attr('r', (d) => 4 + d.impact * 10);

    // Re-select for interactivity (after transition)
    eventGroup
      .selectAll<SVGCircleElement, NarrativeEvent>('.event-dot')
      .on('mouseover', function (event, d) {
        // Expand hovered dot
        d3.select(this)
          .transition()
          .duration(150)
          .attr('r', 6 + d.impact * 14)
          .attr('fill-opacity', 1)
          .attr('stroke-width', 3);

        // Highlight causal chain
        const chain = getCausalChain(d.id);

        // Dim all dots not in chain
        eventGroup
          .selectAll<SVGCircleElement, NarrativeEvent>('.event-dot')
          .transition()
          .duration(200)
          .attr('fill-opacity', (ev) => (chain.has(ev.id) ? 1 : 0.15))
          .attr('stroke-opacity', (ev) => (chain.has(ev.id) ? 0.8 : 0.1));

        // Highlight chain dots with glow
        eventGroup
          .selectAll<SVGCircleElement, NarrativeEvent>('.event-dot')
          .filter((ev) => chain.has(ev.id) && ev.id !== d.id)
          .attr('filter', 'url(#chain-glow)');

        // Dim glow circles not in chain
        eventGroup
          .selectAll<SVGCircleElement, NarrativeEvent>('.glow-circle')
          .transition()
          .duration(200)
          .attr('fill-opacity', (ev) => (chain.has(ev.id) ? 0.12 : 0.02));

        // Highlight causal links in chain
        linkGroup
          .selectAll('path')
          .transition()
          .duration(200)
          .attr('stroke-opacity', function () {
            const from = d3.select(this).attr('data-from');
            const to = d3.select(this).attr('data-to');
            return chain.has(from) && chain.has(to) ? 0.7 : 0.05;
          })
          .attr('stroke-width', function () {
            const from = d3.select(this).attr('data-from');
            const to = d3.select(this).attr('data-to');
            return chain.has(from) && chain.has(to) ? 2.5 : 1;
          });

        const participants = d.participants.map((id) => entityMap.get(id)?.name || id).join(', ');
        tooltip
          .style('opacity', 1)
          .html(
            `<div style="color: #8b5cf6; font-weight: 600; margin-bottom: 4px; font-family: 'Crimson Pro', serif; font-size: 14px;">${d.title}</div>
            <div style="color: #e2e8f0; margin-bottom: 6px; font-family: 'Crimson Pro', serif; line-height: 1.4;">${d.description}</div>
            <div style="display: flex; gap: 8px; color: #64748b; font-size: 10px; font-family: 'JetBrains Mono', monospace;">
              <span style="color: ${colorScale(d.sentiment)};">Impact ${(d.impact * 100).toFixed(0)}%</span>
              <span>·</span>
              <span>${new Date(d.timestamp).toLocaleDateString()}</span>
            </div>
            ${participants ? `<div style="color: #64748b; font-size: 10px; margin-top: 4px;">Characters: ${participants}</div>` : ''}
            ${d.causalPredecessors.length > 0 ? `<div style="color: #8b5cf6; font-size: 9px; margin-top: 4px; opacity: 0.7;">⚡ ${chain.size - 1} event${chain.size > 2 ? 's' : ''} in causal chain</div>` : ''}`
          )
          .style('left', `${event.offsetX + 15}px`)
          .style('top', `${event.offsetY - 10}px`);
      })
      .on('mouseout', function (_, d) {
        d3.select(this)
          .transition()
          .duration(300)
          .attr('r', 4 + d.impact * 10)
          .attr('fill-opacity', 0.85)
          .attr('stroke-width', 1.5);

        // Reset all dots
        eventGroup
          .selectAll<SVGCircleElement, NarrativeEvent>('.event-dot')
          .transition()
          .duration(300)
          .attr('fill-opacity', 0.85)
          .attr('stroke-opacity', 0.5)
          .attr('filter', 'url(#event-glow)');

        // Reset glow circles
        eventGroup
          .selectAll<SVGCircleElement, NarrativeEvent>('.glow-circle')
          .transition()
          .duration(300)
          .attr('fill-opacity', (ev) => 0.04 + ev.impact * 0.08);

        // Reset causal links
        linkGroup
          .selectAll('path')
          .transition()
          .duration(300)
          .attr('stroke-opacity', 0.25)
          .attr('stroke-width', 1.5);

        tooltip.style('opacity', 0);
      });

    // Labels for high-impact events
    eventGroup
      .selectAll('.event-label')
      .data(events.filter((e) => e.impact >= 0.7))
      .enter()
      .append('text')
      .attr('class', 'event-label')
      .attr('x', (d) => xScale(new Date(d.timestamp)))
      .attr('y', (d) => yScale(d.impact) - 14 - d.impact * 10)
      .attr('text-anchor', 'middle')
      .attr('fill', '#e2e8f0')
      .attr('font-size', '10px')
      .attr('font-family', "'Crimson Pro', serif")
      .attr('font-weight', '600')
      .attr('opacity', 0)
      .text((d) => d.title)
      .transition()
      .duration(500)
      .delay((_, i) => 400 + i * 100)
      .attr('opacity', 0.8);

    // X axis
    const xAxis = svg
      .append('g')
      .attr('transform', `translate(0, ${height - margin.bottom})`)
      .call(
        d3
          .axisBottom(xScale)
          .ticks(8)
          .tickFormat(d3.timeFormat('%b %d') as (d: Date | d3.NumberValue) => string)
      );

    xAxis
      .selectAll('text')
      .attr('fill', '#64748b')
      .attr('font-size', '10px')
      .attr('font-family', "'JetBrains Mono', monospace");

    xAxis.selectAll('.domain').attr('stroke', '#1e1e2e');
    xAxis.selectAll('.tick line').attr('stroke', '#1e1e2e');

    // Y axis
    const yAxis = svg
      .append('g')
      .attr('transform', `translate(${margin.left}, 0)`)
      .call(
        d3
          .axisLeft(yScale)
          .ticks(5)
          .tickFormat((d) => `${(+d * 100).toFixed(0)}%`)
      );

    yAxis
      .selectAll('text')
      .attr('fill', '#64748b')
      .attr('font-size', '9px')
      .attr('font-family', "'JetBrains Mono', monospace");

    yAxis.selectAll('.domain').attr('stroke', '#1e1e2e');
    yAxis.selectAll('.tick line').attr('stroke', '#1e1e2e');

    // Y axis label
    svg
      .append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -(height / 2))
      .attr('y', 14)
      .attr('fill', '#64748b')
      .attr('font-size', '10px')
      .attr('font-family', "'JetBrains Mono', monospace")
      .attr('text-anchor', 'middle')
      .text('Impact');

    // Sentiment legend
    const legend = svg
      .append('g')
      .attr('transform', `translate(${width - margin.right - 140}, ${margin.top - 10})`);

    [
      { label: 'Positive', color: '#22d3ee' },
      { label: 'Negative', color: '#ef4444' },
      { label: 'Neutral', color: '#f97316' },
    ].forEach((item, i) => {
      const g = legend.append('g').attr('transform', `translate(${i * 50}, 0)`);
      g.append('circle').attr('r', 3).attr('fill', item.color).attr('cy', 0);
      g.append('text')
        .attr('x', 7)
        .attr('y', 3)
        .attr('fill', '#64748b')
        .attr('font-size', '8px')
        .attr('font-family', "'JetBrains Mono', monospace")
        .text(item.label);
    });

    return () => {
      tooltip.remove();
    };
  }, [events, entities, zoomLevel]);

  return (
    <div ref={containerRef} className="w-full h-full relative">
      {events.length === 0 ? (
        <div className="flex items-center justify-center h-full text-loom-muted text-sm italic font-serif">
          No events yet. Load a narrative to see the timeline unfold...
        </div>
      ) : (
        <>
          <svg ref={svgRef} className="w-full h-full" />
          {/* Zoom controls */}
          <div className="absolute bottom-3 right-3 flex items-center gap-1 bg-loom-surface/80 backdrop-blur-sm rounded-lg border border-loom-border/50 p-0.5">
            <button
              onClick={handleZoomOut}
              className="p-1.5 text-loom-muted hover:text-loom-text hover:bg-white/5 rounded transition-colors duration-200"
              title="Zoom out"
            >
              <ZoomOut size={14} />
            </button>
            <span className="text-[10px] text-loom-muted font-mono w-8 text-center">
              {zoomLevel.toFixed(1)}x
            </span>
            <button
              onClick={handleZoomIn}
              className="p-1.5 text-loom-muted hover:text-loom-text hover:bg-white/5 rounded transition-colors duration-200"
              title="Zoom in"
            >
              <ZoomIn size={14} />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
