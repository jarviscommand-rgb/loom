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
    const margin = { top: 40, right: 30, bottom: 60, left: 30 };

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    svg.attr('width', width).attr('height', height);

    const entityMap = new Map(entities.map((e) => [e.id, e]));

    // Time scale
    const timeExtent = d3.extent(events, (e) => new Date(e.timestamp)) as [Date, Date];
    const xScale = d3
      .scaleTime()
      .domain(timeExtent)
      .range([margin.left, width - margin.right]);

    // Impact scale for y
    const yScale = d3
      .scaleLinear()
      .domain([0, 1])
      .range([height - margin.bottom, margin.top]);

    // Sentiment color
    const colorScale = (sentiment: number) => {
      if (sentiment > 0.3) return '#22d3ee';
      if (sentiment < -0.3) return '#ef4444';
      return '#f97316';
    };

    // Defs for glow
    const defs = svg.append('defs');
    const filter = defs.append('filter').attr('id', 'glow');
    filter
      .append('feGaussianBlur')
      .attr('stdDeviation', '3')
      .attr('result', 'coloredBlur');
    const merge = filter.append('feMerge');
    merge.append('feMergeNode').attr('in', 'coloredBlur');
    merge.append('feMergeNode').attr('in', 'SourceGraphic');

    // Grid lines
    const gridGroup = svg.append('g').attr('class', 'grid');
    const xTicks = xScale.ticks(6);
    xTicks.forEach((tick) => {
      gridGroup
        .append('line')
        .attr('x1', xScale(tick))
        .attr('x2', xScale(tick))
        .attr('y1', margin.top)
        .attr('y2', height - margin.bottom)
        .attr('stroke', '#1e1e2e')
        .attr('stroke-width', 1);
    });

    // Causal links
    const linkGroup = svg.append('g').attr('class', 'links');
    const eventMap = new Map(events.map((e) => [e.id, e]));

    events.forEach((event) => {
      event.causalPredecessors.forEach((predId) => {
        const pred = eventMap.get(predId);
        if (!pred) return;
        linkGroup
          .append('line')
          .attr('x1', xScale(new Date(pred.timestamp)))
          .attr('y1', yScale(pred.impact))
          .attr('x2', xScale(new Date(event.timestamp)))
          .attr('y2', yScale(event.impact))
          .attr('stroke', '#8b5cf6')
          .attr('stroke-width', 1)
          .attr('stroke-opacity', 0.3)
          .attr('stroke-dasharray', '4,4')
          .attr('class', 'narrative-thread');
      });
    });

    // Event dots
    const eventGroup = svg.append('g').attr('class', 'events');
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
      .style('max-width', '280px')
      .style('z-index', '100');

    eventGroup
      .selectAll('circle')
      .data(events)
      .enter()
      .append('circle')
      .attr('cx', (d) => xScale(new Date(d.timestamp)))
      .attr('cy', (d) => yScale(d.impact))
      .attr('r', (d) => 4 + d.impact * 10)
      .attr('fill', (d) => colorScale(d.sentiment))
      .attr('fill-opacity', 0.8)
      .attr('stroke', (d) => colorScale(d.sentiment))
      .attr('stroke-width', 2)
      .attr('filter', 'url(#glow)')
      .style('cursor', 'pointer')
      .on('mouseover', function (event, d) {
        d3.select(this).attr('r', 6 + d.impact * 12);
        const participants = d.participants
          .map((id) => entityMap.get(id)?.name || id)
          .join(', ');
        tooltip
          .style('opacity', 1)
          .html(
            `<div style="color: #8b5cf6; font-weight: 600; margin-bottom: 4px; font-family: 'Crimson Pro', serif; font-size: 14px;">${d.title}</div>
            <div style="color: #e2e8f0; margin-bottom: 6px;">${d.description}</div>
            <div style="color: #64748b; font-size: 10px;">
              <span>Characters: ${participants}</span><br/>
              <span>Impact: ${(d.impact * 100).toFixed(0)}%</span> ·
              <span>${new Date(d.timestamp).toLocaleDateString()}</span>
            </div>`
          )
          .style('left', `${event.offsetX + 15}px`)
          .style('top', `${event.offsetY - 10}px`);
      })
      .on('mouseout', function (_, d) {
        d3.select(this).attr('r', 4 + d.impact * 10);
        tooltip.style('opacity', 0);
      });

    // Event labels for high-impact events
    eventGroup
      .selectAll('text')
      .data(events.filter((e) => e.impact >= 0.7))
      .enter()
      .append('text')
      .attr('x', (d) => xScale(new Date(d.timestamp)))
      .attr('y', (d) => yScale(d.impact) - 12 - d.impact * 10)
      .attr('text-anchor', 'middle')
      .attr('fill', '#e2e8f0')
      .attr('font-size', '10px')
      .attr('font-family', "'Crimson Pro', serif")
      .text((d) => d.title);

    // X axis
    svg
      .append('g')
      .attr('transform', `translate(0, ${height - margin.bottom})`)
      .call(
        d3.axisBottom(xScale).ticks(6).tickFormat(d3.timeFormat('%b %d') as (d: Date | d3.NumberValue) => string)
      )
      .selectAll('text')
      .attr('fill', '#64748b')
      .attr('font-size', '10px');

    svg.selectAll('.domain').attr('stroke', '#1e1e2e');
    svg.selectAll('.tick line').attr('stroke', '#1e1e2e');

    // Y axis label
    svg
      .append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -(height / 2))
      .attr('y', 12)
      .attr('fill', '#64748b')
      .attr('font-size', '10px')
      .attr('text-anchor', 'middle')
      .text('Impact');

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
