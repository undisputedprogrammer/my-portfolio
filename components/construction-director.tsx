"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import { buildTiming, clamp01 as clamp, departurePoint, dragAnchor, easeOut as ease, followerTarget, followStep, idleExitTarget, mix, samplePointer, servoEase as smooth, steerDirection, type Point, type PointerSample } from "@/lib/construction-motion";

const CREW = ["Compose", "Layout", "Media", "Detail", "Structure", "Style", "Connect", "Polish"];
const COLORS = ["#00F5FF", "#8BF5CE", "#C0B7FF", "#FFCA8A", "#7EC8FF", "#F0A8D5", "#B6E880", "#E6EDF3"];
const SHELLS = ".hero-screen,.project-card,.skill-group,.focus-item,.timeline-item,.profile-card,.terminal-window,.network-panel";
const SPLIT = ".project-content,.hero-actions,.hero-stats,.job-heading,.job-points,.terminal-steps,.contact-grid,.focus-item > div,footer";
type Box = Point & { width: number; height: number };
type BuildTask = {
  element: HTMLElement | SVGElement;
  shell: boolean;
  group: string;
  status: "pending" | "active" | "complete";
  parent?: BuildTask;
};
type Worker = {
  root: HTMLElement;
  pointer: HTMLElement;
  frame: HTMLElement;
  ghost: HTMLElement;
  label: HTMLElement;
  task?: BuildTask;
  position: Point;
  origin: Point;
  velocity: Point;
  departureVelocity: Point;
  source?: Box;
  started: number;
  finished: number;
  revealed: boolean;
  initialized: boolean;
  timing: ReturnType<typeof buildTiming>;
  exit?: { origin: Point; velocity: Point; target: Point; started: number; duration: number };
  exited: boolean;
};
const boxOf = (element: Element): Box => {
  const box = element.getBoundingClientRect();
  return { x: box.left + window.scrollX, y: box.top + window.scrollY, width: box.width, height: box.height };
};

/** One scheduler owns all eight cursors. DOM geometry is sampled again while scrolling. */
function runConstruction(layer: HTMLElement) {
  const tasks = new Map<Element, BuildTask>();
  const visible = new Set<Element>();
  const prototypes = new Map<string, BuildTask>();
  const animations = new Set<Animation>();
  let raf = 0;
  let stopped = false;
  let introReleased = false;
  let lastPointer: Point | undefined;
  let pointerDirection: Point = { x: 1, y: .25 };
  let desiredDirection = { ...pointerDirection };
  const pointerHistory: PointerSample[] = [];
  let pointerMovedAt = 0;
  let pointerInside = false;
  let previousScroll = { x: scrollX, y: scrollY };
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
  let lastFrame = 0;
  const workers: Worker[] = Array.from(layer.querySelectorAll<HTMLElement>(".builder-worker")).map(root => ({
    root, pointer: root.querySelector<HTMLElement>(".builder-pointer")!,
    frame: root.querySelector<HTMLElement>(".builder-selection")!,
    ghost: root.querySelector<HTMLElement>(".builder-ghost")!,
    label: root.querySelector<HTMLElement>(".builder-label")!,
    position: { x: 0, y: 0 }, origin: { x: 0, y: 0 },
    velocity: { x: 0, y: 0 }, departureVelocity: { x: 0, y: 0 },
    started: 0, finished: 0, revealed: false, initialized: false, exited: false, timing: buildTiming(0, false),
  }));
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (entry.isIntersecting) visible.add(entry.target);
      else visible.delete(entry.target);
    }
    wake();
  }, { rootMargin: "50px", threshold: 0 });

  function complete(task: BuildTask) {
    task.status = "complete";
    task.element.dataset.buildState = "complete";
    task.element.dataset.buildDone = "true";
    task.element.style.removeProperty("--build-clip-right");
    task.element.style.removeProperty("--build-clip-bottom");
    observer.unobserve(task.element);
    visible.delete(task.element);
    if (task.group) prototypes.set(task.group, task);
  }

  function add(element: Element, shell = false) {
    if (!(element instanceof HTMLElement || element instanceof SVGElement) || tasks.has(element)
      || element.closest("[hidden],.project-notes,.sr-only")
      || element.matches(".profile-corner,.profile-scanlines,.profile-sweep,.section-divider,.terminal-output,[data-reveal-static]")) return;
    const group = shell ? ["project-card", "skill-group", "focus-item", "timeline-item"].find(name => element.classList.contains(name)) || "" : "";
    const task: BuildTask = { element, shell, group, status: element.dataset.buildDone ? "complete" : "pending" };
    tasks.set(element, task);
    if (task.status === "complete") return;
    element.dataset.buildKind = shell ? "shell" : "content";
    element.dataset.buildState = "pending";
    element.style.setProperty("--build-clip-right", "100%");
    element.style.setProperty("--build-clip-bottom", "100%");
    observer.observe(element);
  }

  function collect(element: Element) {
    if (element.matches(".drag-reveal,[data-build-scope]")) return;
    if (element.matches(SPLIT)) {
      Array.from(element.children).forEach(collect);
    } else if (!element.querySelector(".drag-reveal,[data-build-scope]")) {
      add(element);
    }
  }

  function scan() {
    document.querySelectorAll<HTMLElement>("[data-build-scope]").forEach(scope => {
      if (scope.matches(SHELLS)) add(scope, true);
      if (scope.dataset.buildScope === "content") Array.from(scope.children).forEach(collect);
      // Frame-only layout wrappers still have a few independent pieces of content.
      if (scope.matches(".hero-screen")) {
        scope.querySelectorAll(":scope > .screen-topline,:scope > .screen-footer").forEach(element => add(element));
      }
    });
    document.querySelectorAll(".hero-diagram,.focus-list > .eyebrow").forEach(element => add(element));
    for (const task of tasks.values()) {
      let parent = task.element.parentElement;
      while (parent) {
        const ancestor = tasks.get(parent);
        if (ancestor?.shell) { task.parent = ancestor; break; }
        parent = parent.parentElement;
      }
    }
    wake();
  }

  function ripple(point: Point, color: string) {
    const ring = document.createElement("i");
    ring.className = "builder-click";
    ring.style.cssText = `left:${point.x - scrollX}px;top:${point.y - scrollY}px;border-color:${color}`;
    layer.appendChild(ring);
    const animation = ring.animate([
      { transform: "translate(-50%,-50%) scale(.5)", opacity: .6 },
      { transform: "translate(-50%,-50%) scale(1.8)", opacity: 0 },
    ], { duration: 280, easing: "cubic-bezier(.22,1,.36,1)" });
    animations.add(animation);
    animation.onfinish = () => { animations.delete(animation); ring.remove(); };
  }

  function hideGhost(worker: Worker) {
    // A non-copy release must never expose an unpositioned ghost at (0, 0).
    worker.ghost.hidden = true;
    worker.ghost.style.opacity = "0";
  }

  function park(worker: Worker, now: number) {
    worker.task = undefined;
    worker.finished = now;
    worker.frame.style.opacity = "0";
    hideGhost(worker);
    worker.root.dataset.phase = "idle";
  }

  function start(worker: Worker, task: BuildTask, now: number, index: number) {
    worker.exit = undefined;
    worker.exited = false;
    task.status = "active";
    const anchor = lastPointer ? { x: lastPointer.x + scrollX, y: lastPointer.y + scrollY } : { x: innerWidth * .52 + scrollX, y: innerHeight * .48 + scrollY };
    if (!worker.initialized) {
      const angle = index * Math.PI / 4;
      worker.position = { x: anchor.x + Math.cos(angle) * 24, y: anchor.y + Math.sin(angle) * 24 };
    }
    worker.initialized = true;
    worker.origin = { ...worker.position };
    worker.departureVelocity = { ...worker.velocity };
    worker.task = task;
    worker.started = now;
    worker.revealed = false;
    const prototype = task.group && prototypes.get(task.group);
    const source = prototype && prototype.element !== task.element ? boxOf(prototype.element) : undefined;
    worker.source = source && source.y + source.height > scrollY && source.y < scrollY + innerHeight ? source : undefined;
    const destination = dragAnchor(worker.source || boxOf(task.element), !!worker.source);
    worker.timing = buildTiming(Math.hypot(worker.origin.x - destination.x, worker.origin.y - destination.y), task.shell);
    task.element.dataset.buildMethod = worker.source ? "duplicate" : "draw";
    worker.root.dataset.phase = "travel";
    worker.root.style.opacity = "1";
    worker.label.textContent = CREW[index];
    hideGhost(worker);
    worker.frame.style.opacity = "0";
    task.element.dataset.buildState = "building";
  }

  function drawWorker(worker: Worker, box: Box, now: number, index: number, step: number) {
    const elapsed = now - worker.started;
    const { travel, press: clickEnd, draw: drawEnd, end } = worker.timing;
    const destination = worker.source || box;
    const grabPoint = dragAnchor(destination, !!worker.source);
    let point: Point;
    if (elapsed < travel) {
      point = departurePoint(worker.origin, worker.departureVelocity, grabPoint, elapsed / travel, travel);
    } else if (elapsed < clickEnd) {
      point = grabPoint;
      if (worker.root.dataset.phase === "travel") {
        worker.root.dataset.phase = "press";
        ripple(point, COLORS[index]);
      }
    } else if (elapsed < drawEnd) {
      const t = smooth((elapsed - clickEnd) / (drawEnd - clickEnd));
      if (worker.root.dataset.phase !== "drag") {
        worker.root.dataset.phase = "drag";
      }
      if (worker.source) {
        const x = mix(destination.x, box.x, t), y = mix(destination.y, box.y, t);
        const width = mix(destination.width, box.width, t), height = mix(destination.height, box.height, t);
        Object.assign(worker.ghost.style, { transform: `translate3d(${x - scrollX}px,${y - scrollY}px,0)`, width: `${width}px`, height: `${height}px`, opacity: `${Math.sin(Math.min(1, t * 2) * Math.PI / 2) * .5}` });
        worker.ghost.hidden = false;
        point = dragAnchor({ x, y, width }, true);
      } else {
        point = { x: box.x + box.width * t, y: box.y + box.height * t };
      }
      Object.assign(worker.frame.style, { transform: `translate3d(${box.x - scrollX}px,${box.y - scrollY}px,0)`, width: `${Math.max(1, box.width * (worker.source ? 1 : t))}px`, height: `${Math.max(1, box.height * (worker.source ? 1 : t))}px`, opacity: `${worker.source ? t * .8 : 1}` });
      // The drawing cursor owns the visible edge. A duplicate stays a ghost until drop.
      if (!worker.source) {
        worker.task!.element.style.setProperty("--build-clip-right", `${(1 - t) * 100}%`);
        worker.task!.element.style.setProperty("--build-clip-bottom", `${(1 - t) * 100}%`);
      }
      if (!worker.source && t > 0 && !worker.revealed) {
        worker.revealed = true;
        worker.task!.element.dataset.buildState = "revealing";
      }
    } else {
      const t = clamp((elapsed - drawEnd) / (end - drawEnd));
      point = worker.source ? { x: box.x + Math.min(box.width * .32, 96), y: box.y + 18 } : { x: box.x + box.width, y: box.y + box.height };
      if (worker.root.dataset.phase !== "release") {
        worker.task!.element.style.setProperty("--build-clip-right", "0%");
        worker.task!.element.style.setProperty("--build-clip-bottom", "0%");
        worker.revealed = true;
        worker.task!.element.dataset.buildState = "revealing";
        worker.root.dataset.phase = "release";
        ripple(point, COLORS[index]);
      }
      if (worker.source && t < .4) worker.ghost.style.opacity = `${(1 - t / .4) * .5}`;
      else hideGhost(worker);
      worker.frame.style.transform = `translate3d(${box.x - scrollX}px,${box.y - scrollY}px,0)`;
      worker.frame.style.opacity = `${Math.pow(1 - t, 2)}`;
      // Ease the hand away from the released selection before the next assignment.
      point.x += ease(t) * 3;
      point.y += ease(t) * 2;
    }
    worker.velocity = { x: (point.x - worker.position.x) / step, y: (point.y - worker.position.y) / step };
    worker.position = point;
    worker.pointer.style.transform = `translate3d(${point.x - scrollX}px,${point.y - scrollY}px,0)`;
    worker.pointer.dataset.side = point.x - scrollX > innerWidth - 150 ? "left" : "right";
    if (elapsed >= end) {
      complete(worker.task!);
      park(worker, now);
    }
  }

  function followPointer(worker: Worker, index: number, elapsed: number, now: number) {
    if (!pointerInside || !lastPointer || !finePointer.matches) return false;
    const delayedPointer = samplePointer(pointerHistory, now - (30 + index * 20));
    const target = followerTarget(delayedPointer, pointerDirection, index, innerWidth, innerHeight);
    const current = worker.initialized ? { x: worker.position.x - scrollX, y: worker.position.y - scrollY } : { ...lastPointer };
    const next = followStep({ position: current, velocity: worker.velocity }, target, elapsed, index);
    worker.initialized = true;
    worker.position = { x: next.position.x + scrollX, y: next.position.y + scrollY };
    worker.velocity = next.velocity;
    worker.root.dataset.phase = "follow";
    worker.root.style.opacity = `${.54 - Math.floor(index / 2) * .055}`;
    worker.pointer.style.transform = `translate3d(${next.position.x}px,${next.position.y}px,0)`;
    hideGhost(worker);
    worker.frame.style.opacity = "0";
    return Math.hypot(next.position.x - target.x, next.position.y - target.y) > .2 || Math.hypot(next.velocity.x, next.velocity.y) > .002;
  }

  function exitScreen(worker: Worker, index: number, now: number, step: number) {
    if (!worker.exit) {
      const origin = { x: worker.position.x - scrollX, y: worker.position.y - scrollY };
      const target = idleExitTarget(origin, index, innerWidth, innerHeight);
      worker.exit = { origin, target, velocity: { ...worker.velocity }, started: now, duration: Math.min(850, 450 + Math.hypot(target.x - origin.x, target.y - origin.y) * .16) };
    }
    const route = worker.exit;
    const progress = clamp((now - route.started) / route.duration);
    const point = departurePoint(route.origin, route.velocity, route.target, progress, route.duration);
    worker.velocity = { x: (point.x + scrollX - worker.position.x) / step, y: (point.y + scrollY - worker.position.y) / step };
    worker.position = { x: point.x + scrollX, y: point.y + scrollY };
    worker.pointer.style.transform = `translate3d(${point.x}px,${point.y}px,0)`;
    worker.root.dataset.phase = "exit";
    worker.root.style.opacity = `${.48 * (1 - smooth((progress - .65) / .35))}`;
    worker.frame.style.opacity = "0";
    hideGhost(worker);
    if (progress >= 1) {
      worker.root.dataset.phase = "hidden";
      worker.root.style.opacity = "0";
      worker.exit = undefined;
      worker.exited = true;
      worker.velocity = { x: 0, y: 0 };
    }
  }

  function tick(now: number) {
    raf = 0;
    if (stopped || document.hidden) return;
    if (document.body.classList.contains("intro-playing")) { raf = requestAnimationFrame(tick); return; }
    if (!introReleased) { introReleased = true; lastFrame = now; }
    // Freeze phase clocks while the tab is hidden instead of jumping animations on return.
    const gap = lastFrame ? now - lastFrame : 0;
    if (gap > 150) workers.forEach(worker => {
      if (worker.task) worker.started += gap - 16;
      if (worker.exit) worker.exit.started += gap - 16;
    });
    lastFrame = now;
    const step = Math.max(1, Math.min(gap || 1000 / 60, 40));
    if (pointerInside && lastPointer) {
      const earlier = samplePointer(pointerHistory, now - 60);
      const movement = { x: lastPointer.x - earlier.x, y: lastPointer.y - earlier.y };
      if (Math.hypot(movement.x, movement.y) > 3) desiredDirection = movement;
      pointerDirection = steerDirection(pointerDirection, desiredDirection, step);
      // Stationary samples keep the delayed path honest when the mouse stops or starts.
      pointerHistory.push({ ...lastPointer, time: now });
      while (pointerHistory.length > 2 && pointerHistory[1].time < now - 550) pointerHistory.shift();
    }
    // Read geometry in one batch before moving any overlays, avoiding layout thrashing.
    const geometry = new Map<Element, Box>();
    visible.forEach(element => geometry.set(element, boxOf(element)));
    workers.forEach(worker => { if (worker.task && !geometry.has(worker.task.element)) geometry.set(worker.task.element, boxOf(worker.task.element)); });
    const available = Array.from(visible).map(element => tasks.get(element)!).filter(task =>
      task.status === "pending" && (!task.parent || task.parent.status === "complete")
      && (!task.group || prototypes.has(task.group) || !Array.from(tasks.values()).some(other => other !== task && other.group === task.group && other.status !== "complete" && (visible.has(other.element) || other.status === "active") && !!(other.element.compareDocumentPosition(task.element) & Node.DOCUMENT_POSITION_FOLLOWING)))
      && geometry.get(task.element)!.width > 0
    ).sort((a, b) => geometry.get(a.element)!.y - geometry.get(b.element)!.y);
    workers.forEach((worker, index) => {
      if (worker.task?.status === "complete" || (worker.task && !worker.task.element.isConnected)) {
        park(worker, now);
      }
      if (!worker.task && available.length) {
        const origin = worker.initialized ? worker.position : { x: (lastPointer?.x ?? innerWidth * .52) + scrollX, y: (lastPointer?.y ?? innerHeight * .48) + scrollY };
        // Short handoffs with early attention to headlines and structural pieces.
        const score = (task: BuildTask) => {
          const box = geometry.get(task.element)!;
          const priority = task.element.matches("h1,h2,.hero-description,.profile-photo") ? -240 : task.shell ? -100 : 0;
          return Math.hypot(box.x - origin.x, box.y - origin.y) * .55 + Math.max(0, box.y - scrollY) * .15 + priority;
        };
        let nearest = 0;
        for (let i = 1; i < available.length; i++) if (score(available[i]) < score(available[nearest])) nearest = i;
        start(worker, available.splice(nearest, 1)[0], now, index);
      }
    });
    const boxes = workers.map(worker => worker.task ? geometry.get(worker.task.element) : undefined);
    const hasBuildWork = workers.some(worker => worker.task) || Array.from(visible).some(element =>
      tasks.get(element)?.status === "pending" && (geometry.get(element)?.width ?? 0) > 0
    );
    let followersMoving = false;
    workers.forEach((worker, index) => {
      if (worker.task && boxes[index]) {
        const box = boxes[index]!;
        if (box.y + box.height < scrollY - 120 || box.y > scrollY + innerHeight + 160) {
          // Resume this region when it is viewed again; scrolling away is not a build.
          worker.task.status = "pending";
          worker.task.element.dataset.buildState = "pending";
          worker.task.element.style.setProperty("--build-clip-right", "100%");
          worker.task.element.style.setProperty("--build-clip-bottom", "100%");
          visible.delete(worker.task.element);
          park(worker, now);
        } else drawWorker(worker, box, now, index, step);
      } else if (worker.initialized && !worker.exited && (worker.exit || now - (hasBuildWork ? Math.max(worker.finished, pointerMovedAt) : worker.finished) >= 650 + index * 35)) {
        exitScreen(worker, index, now, step);
      } else if (hasBuildWork && worker.initialized && !worker.exited && pointerInside && lastPointer && finePointer.matches) {
        followersMoving = followPointer(worker, index, step, now) || followersMoving;
      } else if (worker.initialized && !worker.exited) {
        worker.root.style.opacity = ".48";
      }
    });
    const delayedMovement = hasBuildWork && pointerInside && now < pointerMovedAt + 210;
    const angleDelta = Math.atan2(desiredDirection.y, desiredDirection.x) - Math.atan2(pointerDirection.y, pointerDirection.x);
    const turning = hasBuildWork && pointerInside && Math.abs(Math.atan2(Math.sin(angleDelta), Math.cos(angleDelta))) > .002;
    const idleExitsPending = workers.some(worker => worker.initialized && !worker.task && !worker.exited);
    if (followersMoving || delayedMovement || turning || idleExitsPending || workers.some(worker => worker.task) || available.length) wake();
  }

  function wake() { if (!raf && !stopped && !document.hidden) raf = requestAnimationFrame(tick); }
  const pointer = (event: PointerEvent) => {
    if (event.pointerType !== "mouse") return;
    const time = performance.now();
    if (!pointerInside || !pointerHistory.length) {
      pointerHistory.length = 0;
      pointerHistory.push({ x: event.clientX, y: event.clientY, time: time - 550 });
    } else if (lastPointer && time - pointerHistory[pointerHistory.length - 1].time > 32) {
      pointerHistory.push({ ...lastPointer, time: time - 1 });
    }
    lastPointer = { x: event.clientX, y: event.clientY };
    pointerHistory.push({ ...lastPointer, time });
    pointerMovedAt = time;
    pointerInside = true;
    // Only an assigned build may revive a parked worker or interrupt its exit.
    // Pointer movement updates the next route's origin without waking the idle crew.
    if (workers.some(worker => worker.task || (worker.initialized && !worker.exited))) wake();
  };
  const leave = () => {
    pointerInside = false;
    pointerHistory.length = 0;
    wake();
  };
  const scroll = () => {
    const dx = scrollX - previousScroll.x, dy = scrollY - previousScroll.y;
    workers.forEach(worker => { if (!worker.task) { worker.position.x += dx; worker.position.y += dy; } });
    previousScroll = { x: scrollX, y: scrollY };
    wake();
  };
  const focus = (event: FocusEvent) => {
    if (!(event.target instanceof Element)) return;
    for (const task of tasks.values()) if (task.element.contains(event.target)) complete(task);
    wake();
  };
  const resume = () => { if (!document.hidden) wake(); };
  const resize = () => { workers.forEach(worker => { worker.exit = undefined; }); wake(); };
  window.addEventListener("pointermove", pointer, { passive: true });
  window.addEventListener("blur", leave);
  document.addEventListener("pointerleave", leave);
  document.addEventListener("keydown", leave);
  window.addEventListener("portfolio:build-register", scan);
  window.addEventListener("resize", resize);
  window.addEventListener("scroll", scroll, { passive: true });
  document.addEventListener("focusin", focus);
  document.addEventListener("visibilitychange", resume);
  scan();
  // All targets are masked before the bootstrap gate opens, preventing a content flash.
  document.documentElement.dataset.construction = "ready";
  window.dispatchEvent(new Event("portfolio:build-ready"));
  return () => {
    stopped = true;
    cancelAnimationFrame(raf);
    observer.disconnect();
    animations.forEach(animation => { animation.cancel(); });
    layer.querySelectorAll(".builder-click").forEach(element => element.remove());
    tasks.forEach(complete);
    window.removeEventListener("pointermove", pointer);
    window.removeEventListener("blur", leave);
    document.removeEventListener("pointerleave", leave);
    document.removeEventListener("keydown", leave);
    window.removeEventListener("portfolio:build-register", scan);
    window.removeEventListener("resize", resize);
    window.removeEventListener("scroll", scroll);
    document.removeEventListener("focusin", focus);
    document.removeEventListener("visibilitychange", resume);
  };
}

export function ConstructionDirector({ enabled }: { enabled: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!enabled || !ref.current) return;
    if (typeof IntersectionObserver === "undefined" || typeof Element.prototype.animate !== "function") {
      document.documentElement.dataset.construction = "ready";
      return;
    }
    return runConstruction(ref.current);
  }, [enabled]);
  if (!enabled) return null;
  return <div ref={ref} className="construction-layer" aria-hidden="true">
    {CREW.map((name, index) => <div className="builder-worker" key={name} style={{ "--builder-color": COLORS[index] } as CSSProperties}>
      <div className="builder-selection"><i/><i/><i/><i/><span/></div>
      <div className="builder-ghost" hidden><i className="builder-copy-mark"/><div className="builder-ghost-art"/><b/><span/><span/><em/></div>
      <div className="builder-pointer"><svg width="23" height="28" viewBox="0 0 23 28"><path d="M2 2 20 16l-9 1-4 8Z" fill="currentColor" stroke="#0a1017" strokeWidth="1.5" strokeLinejoin="round"/></svg><span className="builder-label">{name}</span></div>
    </div>)}
  </div>;
}
