"use client";

import { motion, useInView, useMotionValue, useMotionValueEvent, useSpring, useTransform, type MotionValue } from "framer-motion";
import { createContext, useContext, useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { content as c } from "@/data/content";
import { useDragReveal, useMotionPreferences } from "./motion-system";

type Mouse = { x: MotionValue<number>; y: MotionValue<number>; tick: MotionValue<number>; fine: boolean; visible: boolean; target: RefObject<Element | null> };
const MouseContext = createContext<Mouse | null>(null);

export function MouseProvider({ children }: { children: ReactNode }) {
  const x = useMotionValue(-100), y = useMotionValue(-100);
  const tick = useMotionValue(0);
  const target = useRef<Element | null>(null);
  const [fine, setFine] = useState(false), [visible, setVisible] = useState(false);
  useEffect(() => {
    const media = window.matchMedia("(hover: hover) and (pointer: fine)");
    const update = () => setFine(media.matches);
    update(); media.addEventListener("change", update);
    const move = (event: PointerEvent) => {
      if (event.pointerType !== "mouse" || !media.matches) { setVisible(false); return; }
      target.current = event.target instanceof Element ? event.target : null;
      x.set(event.clientX); y.set(event.clientY); tick.set(tick.get() + 1); setVisible(true);
    };
    const hide = () => setVisible(false);
    window.addEventListener("pointermove", move, { passive: true });
    document.addEventListener("pointerleave", hide); window.addEventListener("blur", hide); window.addEventListener("keydown", hide);
    return () => { media.removeEventListener("change", update); window.removeEventListener("pointermove", move); document.removeEventListener("pointerleave", hide); window.removeEventListener("blur", hide); window.removeEventListener("keydown", hide); };
  }, [x, y, tick]);
  return <MouseContext.Provider value={{ x, y, tick, target, fine, visible }}>{children}</MouseContext.Provider>;
}

export function useMousePosition() {
  const mouse = useContext(MouseContext);
  if (!mouse) throw new Error("useMousePosition requires MouseProvider");
  return mouse;
}

export function CustomCursor() {
  const mouse = useMousePosition();
  const { reduced } = useMotionPreferences();
  const [kind, setKind] = useState<"default" | "click" | "scroll">("default");
  const ringX = useMotionValue(-100), ringY = useMotionValue(-100);
  const x = useSpring(ringX, { stiffness: 550, damping: 40 }), y = useSpring(ringY, { stiffness: 550, damping: 40 });
  const enabled = mouse.fine && mouse.visible && !reduced;
  useMotionValueEvent(mouse.tick, "change", () => {
    const clickable = mouse.target.current?.closest("a,button,[role=button]");
    const scrollable = mouse.target.current?.closest(".terminal-code");
    setKind(clickable ? "click" : scrollable ? "scroll" : "default");
    if (clickable?.matches(".button,button,.back-top")) {
      const rect = clickable.getBoundingClientRect(); ringX.set(rect.left + rect.width / 2); ringY.set(rect.top + rect.height / 2);
    } else { ringX.set(mouse.x.get()); ringY.set(mouse.y.get()); }
  });
  useEffect(() => {
    document.documentElement.classList.toggle("custom-cursor-active", enabled);
    return () => document.documentElement.classList.remove("custom-cursor-active");
  }, [enabled]);
  if (!enabled) return null;
  return <div className={`custom-cursor cursor-${kind}`} aria-hidden="true"><motion.div className="cursor-dot" style={{ x: mouse.x, y: mouse.y }}/><motion.div className="cursor-ring" style={{ x, y }} animate={{ width: kind === "click" ? 48 : 24, height: kind === "click" ? 48 : 24 }} transition={{ duration: .15 }}>{kind === "scroll" && <span>↕</span>}</motion.div></div>;
}

export function TiltCard({ children, className = "", revealDelay = 0 }: { children: ReactNode; className?: string; revealDelay?: number }) {
  const ref = useRef<HTMLElement>(null);
  useDragReveal(ref, true, revealDelay);
  const mouse = useMousePosition();
  const { reduced } = useMotionPreferences();
  const [hovered, setHovered] = useState(false);
  const px = useMotionValue(.5), py = useMotionValue(.5);
  const rotateX = useSpring(useTransform(py, [0, 1], [2, -2]), { stiffness: 110, damping: 26 });
  const rotateY = useSpring(useTransform(px, [0, 1], [-2, 2]), { stiffness: 110, damping: 26 });
  useMotionValueEvent(mouse.tick, "change", () => {
    if (!hovered || !mouse.fine || reduced || !ref.current) return;
    // Keep construction geometry stable while a cursor is working on this card.
    if (ref.current.dataset.buildState !== "complete" || ref.current.querySelector('[data-build-state="building"],[data-build-state="revealing"]')) return;
    const rect = ref.current.getBoundingClientRect();
    px.set(Math.max(0, Math.min(1, (mouse.x.get() - rect.left) / rect.width)));
    py.set(Math.max(0, Math.min(1, (mouse.y.get() - rect.top) / rect.height)));
  });
  return <motion.article ref={ref} className={`drag-reveal ${className}`} data-reveal-content onPointerEnter={()=>setHovered(true)} onPointerLeave={()=>{setHovered(false);px.set(.5);py.set(.5);}} style={{ transformPerspective: 1000, rotateX: reduced || !mouse.fine ? 0 : rotateX, rotateY: reduced || !mouse.fine ? 0 : rotateY, willChange: hovered && !reduced && mouse.fine ? "transform" : "auto" }}>{children}</motion.article>;
}

export function TerminalDemo() {
  const { reduced } = useMotionPreferences();
  const ref = useRef<HTMLDivElement>(null);
  useDragReveal(ref);
  const inView = useInView(ref, { amount: .2 });
  const [count, setCount] = useState(0), [run, setRun] = useState(0);
  const elapsed = useRef(0);
  useEffect(() => {
    if (!inView || reduced) return;
    let frame = 0, previous = 0;
    const tick = (now: number) => {
      if (!document.hidden) {
        if (previous) elapsed.current += Math.min(now - previous, 100);
        const next = Math.min(c.terminal.code.length, Math.floor(elapsed.current / 30));
        setCount(next);
        if (next >= c.terminal.code.length) return;
      }
      previous = now; frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [inView, reduced, run]);
  const complete = reduced || count >= c.terminal.code.length;
  const replay = () => { elapsed.current = 0; setCount(0); setRun(v=>v+1); };
  return <div data-reveal-content className={`drag-reveal terminal-window ${inView ? "terminal-in-view" : ""}`} ref={ref}><div className="terminal-top"><div className="window-dots"><i/><i/><i/></div><span>{c.terminal.filename}</span><span className="terminal-language">{c.terminal.languageBadge}</span></div><div className="terminal-code" tabIndex={0} aria-label={c.terminal.codeLabel}><pre className="terminal-ghost" aria-hidden="true"><code>{c.terminal.code}</code></pre><pre className="terminal-typed" aria-hidden="true"><code>{reduced ? c.terminal.code : c.terminal.code.slice(0,count)}<span className="terminal-caret">|</span></code></pre><pre className="sr-only"><code>{c.terminal.code}</code></pre></div><div className={`terminal-output ${complete ? "is-complete" : ""}`} aria-hidden={!complete}><span>›</span> {c.terminal.output}</div><div className="terminal-bottom"><span className="status-dot"/><span>{complete ? c.terminal.complete : c.terminal.typing}</span><button onClick={replay} disabled={reduced}>{c.terminal.replay}<span aria-hidden="true">↻</span></button></div></div>;
}

