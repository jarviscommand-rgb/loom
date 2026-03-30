import { useRef, useEffect } from 'react';
import * as d3 from 'd3';
import type { NarrativeEvent, Entity } from '../hooks/useApi';

interface TimelineProps {
  events: NarrativeEvent[];
  entities: Entity[];
}

export default function Timeline({ events, entities }: TimelineProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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

    // Scales
    const timeExtent = d3.extent(events, (e) => new Date(e.timestamp)) as [Date, Date];
    const xScale = d3
      .scaleTime()
      .domain(timeExtent)
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

    // Clip path for brush
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
          .style('animation', 'dash 15s linear infinite');
      });
    });

    // Tooltip
    const tooltip = d3
      .select(container)
      .append('div')
      .style('position', 'absolute')
      .style('pointer-events', 'none')
      .style('opacity', 0)
      .style('background', 'rgba(10, 10, 15, 0.95)')
      .style('border', '1px solid rgba(139, 92, 246, 0.3)')
      .style('border-radius', '10px')
      .style('padding', '12px 14px')
      .style('font-size', '12px')
      .style('max-width', '280px')
      .style('z-index', '100')
      .style('backdrop-filter', 'blur(8px)')
      .style('box-shadow', '0 8px 32px rgba(0,0,0,0.5)')
      .style('transition', 'opacity 0.15s ease');

    // Event dots — enter with animation
    const eventGroup = mainGroup.append('g').attr('class', 'events');

    // Glow circles for high-impact events
    eventGroup
      .selectAll('.glow-circle')
      .data(events.filter((e) => e.impact >= 0.7))
      .enter()
      .append('circle')
      .attr('cx', (d) => xScale(new Date(d.timestamp)))
      .attr('cy', (d) => yScale(d.impact))
      .attr('r', 0)
      .attr('fill', (d) => colorScale(d.sentiment))
      .attr('fill-opacity', 0.08)
      .attr('filter', 'url(#hi-glow)')
      .transition()
      .duration(800)
      .delay((_, i) => i * 100)
      .attr('r', (d) => 12 + d.impact * 20);

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
      .style('cursor', 'pointer')
      .transition()
      .duration(600)
      .delay((_, i) => i * 60)
      .ease(d3.easeBackOut)
      .attr('r', (d) => 4 + d.impact * 10);

    // Re-select for interactivity (after transition)
    eventGroup
      .selectAll<SVGCircleElement, NarrativeEvent>('.event-dot')
      .on('mouseover', function (event, d) {
        d3.select(this)
          .transition()
          .duration(150)
          .attr('r', 6 + d.impact * 14)
          .attr('fill-opacity', 1)
          .attr('stroke-width', 3);

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
            ${participants ? `<div style="color: #64748b; font-size: 10px; margin-top: 4px;">Characters: ${participants}</div>` : ''}`
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
  }, [events, entities]);

  return (
    <div ref={containerRef} className="w-full h-full relative">
      {events.length === 0 ? (
        <div className="flex items-center justify-center h-full text-loom-muted text-sm italic font-serif">
          No events yet. Load a narrative to see the timeline unfold...
        </div>
      ) : (
        <svg ref={svgRef} className="w-full h-full" />
      )}
    </div>
  );
}
