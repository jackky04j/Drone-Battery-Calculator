import { PARAMS } from "../config.js";
import { calculate, fmt } from "../phase1/calculator.js";

function getInputs() {
  return Object.fromEntries(
    PARAMS.map((param) => {
      const box = document.getElementById(`n-${param.id}`);
      const value = parseFloat(box?.value ?? "");
      return [param.id, Number.isNaN(value) ? 0 : value];
    }),
  );
}

function render(result) {
  document.getElementById("metrics-grid").innerHTML = result.metrics
    .map(
      (metric) => `
    <div class="metric">
      <div class="mlabel">${metric.label}</div>
      <div><span class="mval">${metric.val}</span><span class="munit">${metric.unit}</span></div>
      <div class="msub">${metric.sub}</div>
      <div><span class="badge ${metric.badge}">${metric.bt}</span></div>
      <div class="bar-wrap"><div class="bar-fill" style="width:${metric.bar.toFixed(0)}%;background:${metric.bc}"></div></div>
    </div>`,
    )
    .join("");

  const vbox = document.getElementById("verdict-box");
  const title = document.getElementById("verdict-title");
  const body = document.getElementById("verdict-body");
  const { derived, issues } = result;

  if (issues.length === 0) {
    vbox.style.cssText =
      "border-color:#2a7a40;background:var(--greenlt);border-radius:var(--radius-lg);padding:16px 18px;margin-bottom:1.25rem;border-width:0.5px;border-style:solid";
    title.style.color = "var(--greendk)";
    title.textContent = "Battery selection looks good";
    body.innerHTML =
      `All checks pass. C-rating headroom: <strong>${fmt(derived.headroom, 1)} A</strong>. ` +
      `T:W: <strong>${fmt(derived.tw, 2)} : 1</strong>. ` +
      `Flight time: <strong>${fmt(derived.flightTime, 1)} min</strong>. ` +
      `Voltage under hover load: <strong>${fmt(derived.vLoad, 2)} V</strong> ` +
      `(${fmt(derived.sagCell * 1000, 1)} mV/cell sag).`;
  } else {
    vbox.style.cssText =
      "border-color:#b52828;background:var(--redlt);border-radius:var(--radius-lg);padding:16px 18px;margin-bottom:1.25rem;border-width:0.5px;border-style:solid";
    title.style.color = "var(--red)";
    title.textContent = "Issues found — adjust inputs";
    body.innerHTML = `Problems: <strong>${issues.join("&nbsp;·&nbsp;")}</strong>.`;
  }

  document.getElementById("breakdown-rows").innerHTML = result.rows
    .map(
      ([label, formula, value]) =>
        `<div class="brow"><span class="blabel">${label}</span><span class="bformula">${formula}</span><span class="bresult">${value}</span></div>`,
    )
    .join("");
}

export function recalc() {
  render(calculate(getInputs()));
}

PARAMS.forEach(({ id, sliderMin, sliderMax }) => {
  const slider = document.getElementById(`s-${id}`);
  const box = document.getElementById(`n-${id}`);
  if (!slider || !box) return;

  slider.addEventListener("input", () => {
    box.value = slider.value;
    box.classList.remove("over");
    recalc();
  });

  box.addEventListener("input", () => {
    const value = parseFloat(box.value);
    if (Number.isNaN(value)) return;
    const clamped = Math.min(sliderMax, Math.max(sliderMin, value));
    slider.value = clamped;
    box.classList.toggle("over", value < sliderMin || value > sliderMax);
    recalc();
  });

  box.addEventListener("blur", () => {
    if (box.value === "" || Number.isNaN(parseFloat(box.value))) {
      box.value = slider.value;
      box.classList.remove("over");
    }
  });
});

recalc();
