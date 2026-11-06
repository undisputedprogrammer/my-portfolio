"use client";

import { useState } from "react";
import { content as c } from "@/data/content";
import { SceneLoader } from "./scene-loader";

export function HeroDiagram() {
  const [sceneReady, setSceneReady] = useState(false);
  return (
    <div className={`hero-diagram ${sceneReady ? "scene-ready" : ""}`} aria-hidden="true">
      <SceneLoader onReady={setSceneReady} />
      <div className="diagram-orbit orbit-outer" />
      <div className="diagram-orbit orbit-inner" />
      <div className="diagram-crosshair" />
      <svg className="core-wireframe" viewBox="0 0 320 320">
        <defs><linearGradient id="cube-stroke" x1="0" y1="0" x2="1" y2="1"><stop stopColor="var(--accent)" /><stop offset="1" stopColor="var(--accent-2)" /></linearGradient></defs>
        <g fill="none" stroke="url(#cube-stroke)" strokeWidth="1">
          <path d="m160 50 96 55v110l-96 55-96-55V105Zm0 0v110m96-55-96 55-96-55m96 55v110m-96-55 96-55 96 55M64 105l192 110M256 105 64 215" />
          <path d="m160 94 58 33v66l-58 33-58-33v-66Zm0 0v66m58-33-58 33-58-33m58 33v66" opacity=".45" />
        </g>
        <g fill="var(--accent)">{[[160,50],[256,105],[256,215],[160,270],[64,215],[64,105],[160,160]].map(([x,y]) => <circle key={`${x}-${y}`} cx={x} cy={y} r="3" />)}</g>
      </svg>
      {c.hero.orbitLabels.map((label,i) => <span key={label} className={`diagram-tag diagram-tag-${i}`}>{label}</span>)}
      <div className="diagram-caption"><span className="status-dot" />{c.hero.systemLabel}<small>{c.hero.systemSub}</small></div>
    </div>
  );
}
