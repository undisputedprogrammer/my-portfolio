import assert from "node:assert/strict";
import test from "node:test";
import { buildTiming, departurePoint, dragAnchor, followerTarget, followStep, idleExitTarget, samplePointer, servoEase, steerDirection } from "../lib/construction-motion.ts";

test("long routes retain a smooth travel budget while short handoffs stay quicker", () => {
  for (const shell of [false, true]) {
    const near = buildTiming(20, shell), far = buildTiming(20000, shell);
    assert.ok(near.travel < far.travel);
    assert.ok(far.end < 1100);
    assert.ok(near.travel < near.press && near.press < near.draw && near.draw < near.end);
  }
});

test("the eight-unit formation turns inward at screen corners", () => {
  for (const [width, height] of [[375, 812], [1280, 800]]) {
    for (const pointer of [{ x: 0, y: 0 }, { x: width, y: 0 }, { x: 0, y: height }, { x: width, y: height }]) {
      const positions = Array.from({ length: 8 }, (_, i) => followerTarget(pointer, { x: .8, y: .6 }, i, width, height));
      for (const point of positions) {
        assert.ok(point.x >= 12 && point.x <= width - 28);
        assert.ok(point.y >= 12 && point.y <= height - 30);
      }
      assert.equal(new Set(positions.map(point => `${point.x.toFixed(1)},${point.y.toFixed(1)}`)).size, 8);
    }
  }
});

test("damped followers settle equally at 60Hz and 120Hz without overshooting", () => {
  const target = { x: 120, y: 80 };
  const simulate = hz => {
    let state = { position: { x: 0, y: 0 }, velocity: { x: 0, y: 0 } };
    for (let i = 0; i < hz * 2; i++) {
      state = followStep(state, target, 1000 / hz, 7);
      assert.ok(state.position.x <= target.x && state.position.y <= target.y);
    }
    return state.position;
  };
  const a = simulate(60), b = simulate(120);
  assert.ok(Math.hypot(a.x - target.x, a.y - target.y) < .001);
  assert.ok(Math.hypot(a.x - b.x, a.y - b.y) < .0001);
});


test("robotic routes accelerate and brake smoothly without reversing", () => {
  const samples = Array.from({ length: 101 }, (_, i) => servoEase(i / 100));
  assert.equal(samples[0], 0);
  assert.equal(samples[100], 1);
  for (let i = 1; i < samples.length; i++) assert.ok(samples[i] >= samples[i - 1]);
  assert.ok(samples[1] < .001);
  assert.ok(1 - samples[99] < .001);
});

test("an exact mouse reversal turns the formation instead of getting stuck", () => {
  let direction = { x: 1, y: 0 };
  for (let i = 0; i < 40; i++) direction = steerDirection(direction, { x: -20, y: 0 });
  assert.ok(direction.x < -.99);
  assert.ok(Math.abs(Math.hypot(direction.x, direction.y) - 1) < .00001);
});


test("returning from a distant build cannot teleport on its first follow frame", () => {
  const initial = { position: { x: 1100, y: 700 }, velocity: { x: 0, y: 0 } };
  const next = followStep(initial, { x: 80, y: 90 }, 1000 / 60, 0);
  assert.ok(Math.hypot(next.position.x - initial.position.x, next.position.y - initial.position.y) < 23);
});

test("a departure carries the follower's velocity and reaches the grab point at rest", () => {
  const origin = { x: 40, y: 70 }, velocity = { x: .4, y: -.2 }, destination = { x: 600, y: 320 };
  const duration = 400, dt = .001;
  assert.deepEqual(departurePoint(origin, velocity, destination, 0, duration), origin);
  const first = departurePoint(origin, velocity, destination, dt / duration, duration);
  assert.ok(Math.abs((first.x - origin.x) / dt - velocity.x) < .001);
  assert.ok(Math.abs((first.y - origin.y) / dt - velocity.y) < .001);
  assert.deepEqual(departurePoint(origin, velocity, destination, 1, duration), destination);
});

test("copy travel and copy dragging use the same grab point", () => {
  const source = { x: 100, y: 200, width: 500 };
  assert.deepEqual(dragAnchor(source, true), { x: 196, y: 218 });
  assert.deepEqual(dragAnchor(source, false), { x: 100, y: 200 });
});

test("idle followers sample staggered positions along the actual pointer path", () => {
  const history = [{ x: 0, y: 0, time: 0 }, { x: 100, y: 50, time: 100 }, { x: 200, y: 100, time: 200 }];
  assert.deepEqual(samplePointer(history, 120), { x: 120, y: 60 });
  const first = samplePointer(history, 200 - 30), last = samplePointer(history, 200 - 170);
  assert.ok(first.x > last.x);
  assert.deepEqual(samplePointer(history, 300), { x: 200, y: 100 });
});

test("moving across formation edge thresholds never flips followers across the pointer", () => {
  for (let index = 0; index < 8; index++) {
    let previous = followerTarget({ x: 0, y: 300 }, { x: 1, y: 0 }, index, 1280, 800);
    for (let x = 2; x <= 1280; x += 2) {
      const current = followerTarget({ x, y: 300 }, { x: 1, y: 0 }, index, 1280, 800);
      assert.ok(Math.hypot(current.x - previous.x, current.y - previous.y) <= 2.001);
      previous = current;
    }
  }
});

test("idle builders exit beyond all four viewport edges on desktop and mobile", () => {
  for (const [width, height] of [[375, 812], [1280, 800]]) {
    const destinations = Array.from({ length: 8 }, (_, index) => idleExitTarget({ x: width / 2, y: height / 2 }, index, width, height));
    assert.ok(destinations.some(point => point.x < -24));
    assert.ok(destinations.some(point => point.x > width + 24));
    assert.ok(destinations.some(point => point.y < -24));
    assert.ok(destinations.some(point => point.y > height + 24));
    for (const point of destinations) assert.ok(point.x < 0 || point.x > width || point.y < 0 || point.y > height);
    assert.equal(new Set(destinations.map(point => `${point.x},${point.y}`)).size, 8);
  }
});
