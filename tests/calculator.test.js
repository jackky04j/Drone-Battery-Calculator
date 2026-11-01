import assert from "node:assert/strict";
import test from "node:test";
import { DEFAULT_INPUTS } from "../src/config.js";
import { calculate } from "../src/phase1/calculator.js";

test("default hobby pack is current-limited and short on endurance", () => {
  const result = calculate(DEFAULT_INPUTS);
  const { derived } = result;

  assert.equal(derived.peakCur, 120);
  assert.equal(derived.maxDeliver, 66);
  assert.equal(derived.currentOk, false);
  assert.ok(derived.flightTime < 4);
  assert.ok(derived.tw > 2);
  assert.equal(result.pass, false);
  assert.ok(result.issues.some((issue) => issue.includes("peak current")));
  assert.ok(result.issues.some((issue) => issue.includes("flight time")));
});

test("a sized 6S pack passes current, T:W, sag, and endurance checks", () => {
  const result = calculate({
    motors: 4,
    esc: 25,
    thrust: 2000,
    hover: 40,
    cells: 6,
    cap: 10000,
    crate: 50,
    bwt: 1200,
    dwt: 1800,
    payload: 200,
    ir: 2,
  });

  assert.equal(result.derived.peakCur, 100);
  assert.equal(result.derived.maxDeliver, 500);
  assert.ok(result.derived.flightTime >= 8);
  assert.ok(result.derived.tw >= 2);
  assert.ok(result.derived.sagCell < 0.1);
  assert.equal(result.pass, true);
  assert.equal(result.issues.length, 0);
  assert.equal(result.metrics.length, 9);
  assert.equal(result.rows.length, 22);
});

test("low thrust flags a will-not-fly T:W ratio", () => {
  const result = calculate({
    motors: 4,
    esc: 20,
    thrust: 200,
    hover: 45,
    cells: 4,
    cap: 8000,
    crate: 40,
    bwt: 800,
    dwt: 2000,
    payload: 0,
    ir: 3,
  });

  assert.ok(result.derived.tw < 1.5);
  assert.ok(result.issues.some((issue) => issue.includes("T:W")));
});

test("high cell IR produces a sag warning", () => {
  const result = calculate({
    motors: 4,
    esc: 30,
    thrust: 1500,
    hover: 50,
    cells: 4,
    cap: 8000,
    crate: 50,
    bwt: 700,
    dwt: 1200,
    payload: 0,
    ir: 40,
  });

  assert.ok(result.derived.sagCell >= 0.3);
  assert.ok(result.issues.some((issue) => issue.includes("voltage sag")));
});
