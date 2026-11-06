"use client";

import dynamic from "next/dynamic";
import { Component, useEffect, useRef, useState, type ReactNode } from "react";
import { useMotionPreferences } from "./motion-system";

const WireframeScene = dynamic(() => import("./wireframe-scene"), { ssr: false });

class SceneBoundary extends Component<{ children: ReactNode; onError: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onError(); }
  render() { return this.state.failed ? null : this.props.children; }
}

export function SceneLoader({ onReady }: { onReady: (ready: boolean) => void }) {
  const { reduced, ready } = useMotionPreferences();
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false), [tabVisible, setTabVisible] = useState(true);
  const [load, setLoad] = useState(false), [mobile, setMobile] = useState(false);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: .05 });
    observer.observe(element);
    const visibility = () => setTabVisible(!document.hidden);
    const media = window.matchMedia("(max-width: 767px)");
    const resize = () => setMobile(media.matches);
    resize(); visibility(); media.addEventListener("change", resize); document.addEventListener("visibilitychange", visibility);
    return () => { observer.disconnect(); media.removeEventListener("change", resize); document.removeEventListener("visibilitychange", visibility); };
  }, []);
  useEffect(() => {
    if (reduced) { onReady(false); return; }
    if (!ready || !visible || load) return;
    // Keep the full Three.js bundle out of the initial render and intro sequence.
    const timer = window.setTimeout(() => setLoad(true), 2800);
    return () => window.clearTimeout(timer);
  }, [ready, reduced, visible, load, onReady]);
  return <div className="scene-layer" ref={ref} aria-hidden="true" data-rendering={load && !reduced && visible && tabVisible ? "running" : "paused"}>{load && !reduced && <SceneBoundary onError={()=>onReady(false)}><WireframeScene active={visible && tabVisible} mobile={mobile} onReady={onReady}/></SceneBoundary>}</div>;
}
