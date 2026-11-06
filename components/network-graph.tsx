"use client";

import { useRef, useState } from "react";
import { useInView } from "framer-motion";
import { content as c } from "@/data/content";
import { useDragReveal, useMotionPreferences } from "./motion-system";

const connections = [[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,0],[0,3],[3,5],[3,6]];

export function NetworkGraph() {
  const [selected, setSelected] = useState(3);
  const [hovered, setHovered] = useState<number | null>(null);
  const { reduced } = useMotionPreferences();
  const ref = useRef<HTMLDivElement>(null);
  useDragReveal(ref);
  const visible = useInView(ref, { amount: .1 });
  const active = hovered ?? selected;
  const layer = c.skills.layers[active];
  return <div ref={ref} data-reveal-content className={`drag-reveal network-panel ${reduced || !visible ? "network-static" : ""}`}>
    <div className="network-top"><span className="status-dot"/><span>{c.skills.graphHint}</span><span>07</span></div>
    <div className="network-canvas">
      <svg viewBox="0 0 700 510" role="group" aria-label={c.skills.graphLabel}>
        <defs><pattern id="network-grid" width="35" height="35" patternUnits="userSpaceOnUse"><path d="M35 0H0V35" fill="none" stroke="var(--accent)" opacity=".07"/></pattern><radialGradient id="network-halo"><stop stopColor="var(--accent)" stopOpacity=".08"/><stop offset="1" stopColor="var(--accent)" stopOpacity="0"/></radialGradient></defs>
        <rect width="700" height="510" fill="url(#network-grid)"/>
        <circle cx="350" cy="245" r="210" fill="url(#network-halo)"/>
        <circle cx="350" cy="245" r="165" fill="none" stroke="var(--accent)" opacity=".08"/>
        {connections.map(([from,to],i)=>{
          const a=c.skills.layers[from],b=c.skills.layers[to];
          const path=`M${a.x} ${a.y} Q${(a.x+b.x)/2+(i%2 ? 25:-25)} ${(a.y+b.y)/2-24} ${b.x} ${b.y}`;
          return <g key={`${from}-${to}`} aria-hidden="true"><path d={path} stroke="#293f48" fill="none"/><path className="network-flow" d={path} fill="none" stroke={from===active || to===active ? "var(--accent)" : "#526376"} strokeDasharray="4 20" strokeWidth="1.3" style={{ animationDelay: `${i*-.3}s` }}/></g>;
        })}
        {c.skills.layers.map((node,i)=><g key={node.id} role="button" tabIndex={0} aria-label={`${node.label}: ${node.tech}`} aria-pressed={selected===i} className={`network-node ${active===i ? "node-active" : ""}`} onMouseEnter={()=>setHovered(i)} onMouseLeave={()=>setHovered(null)} onFocus={()=>setHovered(i)} onBlur={()=>setHovered(null)} onClick={()=>setSelected(i)} onKeyDown={event=>{if(event.key==="Enter"||event.key===" "){event.preventDefault();setSelected(i);}}}>
          <title>{node.tech}</title><circle cx={node.x} cy={node.y} r="26" fill="transparent"/><circle className="node-ring" cx={node.x} cy={node.y} r="19" fill="#0e151b" stroke={i===4 ? "color-mix(in srgb, var(--accent-2) 31.373%, transparent)" : "color-mix(in srgb, var(--accent) 25.098%, transparent)"}/><circle className="node-pulse" cx={node.x} cy={node.y} r="6" fill={i===4 ? "var(--accent-2)" : "var(--accent)"} style={{ transformOrigin: `${node.x}px ${node.y}px`, animationDelay: `${i*.17}s` }}/><text x={node.x} y={node.y-30} textAnchor="middle" className="node-index">{String(i+1).padStart(2,"0")}</text><text x={node.x} y={node.y+39} textAnchor="middle" className="node-label">{node.label}</text>
        </g>)}
      </svg>
      {hovered!==null && <div className="network-tooltip" role="tooltip" style={{ left: `${Math.max(23,Math.min(77,layer.x/7))}%`, top: `${Math.max(2,layer.y/5.1-17)}%` }}>{layer.tech}</div>}
    </div>
    <div className="network-index">{c.skills.layers.map((node,i)=><button key={node.id} onClick={()=>setSelected(i)} aria-pressed={selected===i} className={selected===i ? "active" : ""}>{String(i+1).padStart(2,"0")}<span>{node.label}</span></button>)}</div>
    <div className="network-detail" aria-live="polite" aria-atomic="true"><div><span className="eyebrow">{c.skills.selectedLabel}</span><strong>{layer.label}</strong></div><p>{layer.tech}<span>{layer.detail}</span></p></div>
  </div>;
}
