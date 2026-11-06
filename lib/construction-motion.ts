export type Point = { x: number; y: number };
export type PointerSample = Point & { time: number };
export type FollowState = { position: Point; velocity: Point };

export const clamp01 = (value: number) => Math.max(0, Math.min(1, value));
export const mix = (a: number, b: number, t: number) => a + (b - a) * t;
export const easeOut = (value: number) => 1 - Math.pow(1 - clamp01(value), 3);
// Minimum-jerk motion accelerates and brakes without a sharp change of velocity.
export const servoEase = (value: number) => {
  const t = clamp01(value);
  return t * t * t * (10 + t * (-15 + t * 6));
};

export function buildTiming(distance: number, shell: boolean) {
  const travel = Math.min(480, 180 + Math.max(0, distance) * .22);
  const press = travel + 48;
  const draw = press + (shell ? 320 : 270);
  return { travel, press, draw, end: draw + 140 };
}

export function followerTarget(pointer: Point, direction: Point, index: number, width: number, height: number): Point {
  const length = Math.hypot(direction.x, direction.y) || 1;
  const bx = -direction.x / length, by = -direction.y / length;
  const depths = [26, 41, 55, 70, 82, 98, 110, 124];
  const spreads = [-12, 17, -24, 26, -11, 31, -27, 9];
  const offsets = depths.map((depth, i) => ({ x: bx * depth - by * spreads[i], y: by * depth + bx * spreads[i] }));
  // Shift the whole loose formation continuously at edges; never flip its direction.
  const anchorX = Math.max(12 - Math.min(...offsets.map(p => p.x)), Math.min(width - 28 - Math.max(...offsets.map(p => p.x)), pointer.x));
  const anchorY = Math.max(12 - Math.min(...offsets.map(p => p.y)), Math.min(height - 30 - Math.max(...offsets.map(p => p.y)), pointer.y));
  return { x: anchorX + offsets[index].x, y: anchorY + offsets[index].y };
}

export function followStep(state: FollowState, target: Point, elapsed: number, index: number): FollowState {
  const dt = Math.max(0, elapsed);
  if (!dt) return state;
  const omega = 1 / (94 + index * 4);
  const decay = Math.exp(-omega * dt);
  const axis = (position: number, velocity: number, destination: number) => {
    const offset = position - destination;
    const change = velocity + omega * offset;
    return { position: destination + (offset + change * dt) * decay, velocity: (velocity - omega * change * dt) * decay };
  };
  const x = axis(state.position.x, state.velocity.x, target.x), y = axis(state.position.y, state.velocity.y, target.y);
  // Bound return speed after a distant build; preserve position and inertia on every frame.
  const distance = Math.hypot(x.position - state.position.x, y.position - state.position.y);
  const ratio = Math.min(1, 1.35 * dt / (distance || 1));
  const speed = Math.hypot(x.velocity, y.velocity);
  const velocityRatio = Math.min(1, 1.35 / (speed || 1));
  return {
    position: { x: mix(state.position.x, x.position, ratio), y: mix(state.position.y, y.position, ratio) },
    velocity: { x: x.velocity * velocityRatio, y: y.velocity * velocityRatio },
  };
}

export function steerDirection(current: Point, movement: Point, elapsed = 1000 / 60): Point {
  const from = Math.atan2(current.y, current.x), to = Math.atan2(movement.y, movement.x);
  const turn = Math.atan2(Math.sin(to - from), Math.cos(to - from));
  const angle = from + turn * (1 - Math.exp(-Math.max(0, elapsed) / 110));
  return { x: Math.cos(angle), y: Math.sin(angle) };
}

export function samplePointer(history: PointerSample[], time: number): Point {
  if (!history.length) return { x: 0, y: 0 };
  if (time <= history[0].time) return history[0];
  for (let i = history.length - 1; i > 0; i--) {
    const before = history[i - 1], after = history[i];
    if (time >= before.time) {
      const t = clamp01((time - before.time) / Math.max(1, after.time - before.time));
      return { x: mix(before.x, after.x, t), y: mix(before.y, after.y, t) };
    }
  }
  return history[history.length - 1];
}

export function dragAnchor(box: Point & { width: number }, copy: boolean): Point {
  return copy ? { x: box.x + Math.min(box.width * .32, 96), y: box.y + 18 } : { x: box.x, y: box.y };
}

export function departurePoint(origin: Point, velocity: Point, destination: Point, progress: number, duration: number): Point {
  const t = clamp01(progress), eased = servoEase(t);
  const carry = duration * t * Math.pow(1 - t, 3);
  return { x: mix(origin.x, destination.x, eased) + velocity.x * carry, y: mix(origin.y, destination.y, eased) + velocity.y * carry };
}

export function idleExitTarget(position: Point, index: number, width: number, height: number): Point {
  const offset = (Math.floor(index / 4) ? 1 : -1) * 36;
  const x = Math.max(24, Math.min(width - 24, position.x + offset));
  const y = Math.max(24, Math.min(height - 24, position.y + offset));
  switch (index % 4) {
    case 0: return { x: -48, y };
    case 1: return { x, y: -48 };
    case 2: return { x: width + 48, y };
    default: return { x, y: height + 48 };
  }
}
