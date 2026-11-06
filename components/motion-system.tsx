"use client";

import { AnimatePresence, motion, useReducedMotion, useScroll, useSpring, useTransform } from "framer-motion";
import { createContext, useContext, useEffect, useRef, useState, type HTMLAttributes, type ReactNode, type RefObject } from "react";
import { content as c } from "@/data/content";
import { ConstructionDirector } from "./construction-director";

const MotionContext = createContext({ reduced: true, ready: false, toggle: () => {} });
export function useMotionPreferences() { return useContext(MotionContext); }

export function MotionProvider({ children }: { children: ReactNode }) {
  const systemReduced = useReducedMotion();
  const [disabled, setDisabled] = useState(false);
  const [ready, setReady] = useState(false);
  useEffect(() => { setReady(true); }, []);
  const reduced = !ready || !!systemReduced || disabled;
  useEffect(() => {
    document.documentElement.dataset.motion = reduced ? "reduced" : "full";
    if (ready && reduced) document.documentElement.dataset.construction = "ready";
  }, [ready, reduced]);
  return <MotionContext.Provider value={{ reduced, ready, toggle: () => setDisabled(v => !v) }}>{children}<ConstructionDirector enabled={ready && !reduced}/></MotionContext.Provider>;
}

export function MotionToggle() {
  const { reduced, toggle } = useMotionPreferences();
  return <button className="motion-toggle" onClick={toggle} aria-pressed={!reduced}><span className={reduced ? "motion-indicator paused" : "motion-indicator"}/>{reduced ? c.ui.motionOff : c.ui.motionOn}</button>;
}

export function useDragReveal(ref: RefObject<HTMLElement | null>, content = true, delay = 0) {
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    element.dataset.buildScope = content ? "content" : "layout";
    // A shared director assigns work to eight cursors; wrappers never mask entire sections.
    window.dispatchEvent(new Event("portfolio:build-register"));
    return () => { delete element.dataset.buildScope; };
  }, [content, delay, ref]);
}

type RevealProps = Omit<HTMLAttributes<HTMLElement>, "content"> & {
  as?: "div" | "section" | "article";
  content?: boolean;
  delay?: number;
};

export function Reveal({ children, className = "", as: Tag = "div", content = true, delay = 0, ...props }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  useDragReveal(ref, content, delay);
  return <Tag {...props} ref={ref} className={`drag-reveal ${className}`} data-reveal-content={content || undefined}>{children}</Tag>;
}

export function SectionDivider() {
  const { reduced } = useMotionPreferences();
  return <svg className="section-divider" width="100%" height="2" aria-hidden="true"><motion.path d="M0 1H1400" stroke="currentColor" initial={{ pathLength: reduced ? 1 : 0 }} whileInView={{ pathLength: 1 }} viewport={{ once: true }} transition={{ duration: reduced ? 0 : 1.1, ease: "easeOut" }}/></svg>;
}

export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 160, damping: 30, restDelta: .001 });
  const { reduced } = useMotionPreferences();
  return <motion.div className="scroll-progress" style={{ scaleX: reduced ? scrollYProgress : progress }} aria-hidden="true"/>;
}

export function BackgroundGrid() {
  const { scrollY } = useScroll();
  const { reduced } = useMotionPreferences();
  const y = useTransform(scrollY, value => (value * .2) % 64);
  return <motion.div className="background-grid" style={{ y: reduced ? 0 : y }} aria-hidden="true"/>;
}

export function ParallaxLayer({ children, className = "" }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const { reduced } = useMotionPreferences();
  // A bounded half-speed mid-layer keeps tall cards within their readable layout.
  const y = useTransform(scrollYProgress, value => Math.max(-28, Math.min(28, (.5 - value) * 112 * .5)));
  const smoothY = useSpring(y, { stiffness: 100, damping: 28 });
  return <motion.div ref={ref} className={className} style={{ y: reduced ? 0 : smoothY }}>{children}</motion.div>;
}

export function GlitchText({ text }: { text: string }) {
  return <span className="glitch-text" data-text={text}>{text}</span>;
}

export function Loader() {
  const { reduced, ready } = useMotionPreferences();
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (!ready || reduced) { setShow(false); return; }
    try { if (sessionStorage.getItem("ali-portfolio-intro")) return; sessionStorage.setItem("ali-portfolio-intro", "seen"); } catch { /* Private browsing can disable storage; the intro remains skippable. */ }
    setShow(true);
    const timer = window.setTimeout(() => setShow(false), 2500);
    return () => window.clearTimeout(timer);
  }, [ready, reduced]);
  useEffect(() => {
    if (!show) return;
    const main = document.getElementById("main-content");
    const nav = document.querySelector<HTMLElement>(".sticky-nav");
    const rail = document.querySelector<HTMLElement>(".section-rail");
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.body.classList.add("intro-playing");
    if (main) main.inert = true;
    if (nav) nav.inert = true;
    if (rail) rail.inert = true;
    const dismiss = (e: KeyboardEvent) => { if (e.key === "Escape") setShow(false); };
    window.addEventListener("keydown", dismiss);
    return () => { document.body.style.overflow = previous; document.body.classList.remove("intro-playing"); if (main) main.inert = false; if (nav) nav.inert = window.scrollY <= 100; if (rail) rail.inert = false; window.removeEventListener("keydown", dismiss); };
  }, [show]);
  return <AnimatePresence>{show && <motion.div className="intro-loader" role="dialog" aria-modal="true" aria-label={c.loader.label} initial={{ opacity: 1 }} animate={{ opacity: [1, 1, 0], filter: ["blur(0px)", "blur(0px)", "blur(14px)"], scale: [1, 1, 1.05] }} transition={{ duration: 2.5, times: [0, .64, 1] }} exit={{ opacity: 0, transition: { duration: .15 } }}><div className="intro-scan"/><div className="intro-center"><p className="eyebrow">{c.loader.status}</p><GlitchText text={c.loader.title}/><div className="intro-track"><span/></div></div><button className="intro-skip" autoFocus onClick={()=>setShow(false)}>{c.loader.skip}<span aria-hidden="true">↗</span></button></motion.div>}</AnimatePresence>;
}
