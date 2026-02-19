
import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { EvolutionGraph, ConceptNode } from '../types';

interface Props {
  data: EvolutionGraph;
  onNodeClick: (node: ConceptNode) => void;
}

export const EvolutionMap: React.FC<Props> = ({ data, onNodeClick }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || data.nodes.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = svgRef.current.clientWidth;
    const height = 600;

    const simulation = d3.forceSimulation<any>(data.nodes)
      .force("link", d3.forceLink<any, any>(data.edges).id(d => d.id).distance(150))
      .force("charge", d3.forceManyBody().strength(-500))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("x", d3.forceX<any>(d => {
          // Sort by year on X axis
          const minYear = Math.min(...data.nodes.map(n => n.year));
          const maxYear = Math.max(...data.nodes.map(n => n.year));
          const range = maxYear - minYear || 1;
          return ((d.year - minYear) / range) * (width - 200) + 100;
      }).strength(1));

    // Arrow markers
    svg.append("defs").append("marker")
      .attr("id", "arrow")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 25)
      .attr("refY", 0)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path")
      .attr("fill", "#64748b")
      .attr("d", "M0,-5L10,0L0,5");

    const link = svg.append("g")
      .attr("stroke", "#475569")
      .attr("stroke-opacity", 0.6)
      .selectAll("line")
      .data(data.edges)
      .join("line")
      .attr("stroke-width", 2)
      .attr("marker-end", "url(#arrow)");

    const node = svg.append("g")
      .selectAll("g")
      .data(data.nodes)
      .join("g")
      .attr("class", "cursor-pointer")
      .on("click", (event, d) => onNodeClick(d))
      .call(d3.drag<any, any>()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended));

    node.append("circle")
      .attr("r", 12)
      .attr("fill", d => {
        switch(d.category) {
          case 'algorithm': return '#3b82f6';
          case 'optimization': return '#10b981';
          case 'architecture': return '#f59e0b';
          default: return '#8b5cf6';
        }
      })
      .attr("stroke", "#1e293b")
      .attr("stroke-width", 2);

    node.append("text")
      .attr("dy", 25)
      .attr("text-anchor", "middle")
      .attr("fill", "#f1f5f9")
      .attr("class", "text-xs font-medium select-none")
      .text(d => d.name);

    node.append("text")
        .attr("dy", -18)
        .attr("text-anchor", "middle")
        .attr("fill", "#94a3b8")
        .attr("class", "text-[10px] select-none")
        .text(d => d.year);

    simulation.on("tick", () => {
      link
        .attr("x1", d => d.source.x)
        .attr("y1", d => d.source.y)
        .attr("x2", d => d.target.x)
        .attr("y2", d => d.target.y);

      node.attr("transform", d => `translate(${d.x},${d.y})`);
    });

    function dragstarted(event: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }

    function dragged(event: any) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }

    function dragended(event: any) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }

    return () => simulation.stop();
  }, [data, onNodeClick]);

  return (
    <div className="w-full h-[600px] bg-slate-800/50 rounded-xl border border-slate-700 relative overflow-hidden">
      <div className="absolute top-4 left-4 flex gap-4 text-[10px] uppercase tracking-wider text-slate-400">
          <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-500"></div> Algorithm</div>
          <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> Optimization</div>
          <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-amber-500"></div> Architecture</div>
      </div>
      <svg ref={svgRef} className="w-full h-full" />
    </div>
  );
};
