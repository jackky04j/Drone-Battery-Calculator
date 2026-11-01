import {
  CELL_FULL_VOLTAGE,
  CELL_NOMINAL_VOLTAGE,
  C_RATING_SAFETY_MARGIN,
  DEFAULT_INPUTS,
  THRESHOLDS,
  USABLE_CAPACITY_FRACTION,
} from "../config.js";

export function fmt(n, dec = 0) {
  if (n === undefined || Number.isNaN(n)) return "—";
  return Number(n.toFixed(dec)).toLocaleString();
}

function numberOrZero(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function calculate(rawInputs = {}) {
  const inputs = { ...DEFAULT_INPUTS, ...rawInputs };
  const m = numberOrZero(inputs.motors);
  const esc = numberOrZero(inputs.esc);
  const thrust = numberOrZero(inputs.thrust);
  const hover = numberOrZero(inputs.hover);
  const cells = numberOrZero(inputs.cells);
  const cap = numberOrZero(inputs.cap);
  const crate = numberOrZero(inputs.crate);
  const bwt = numberOrZero(inputs.bwt);
  const dwt = numberOrZero(inputs.dwt);
  const payload = numberOrZero(inputs.payload);
  const irMc = numberOrZero(inputs.ir);

  const voltage = cells * CELL_NOMINAL_VOLTAGE;
  const capAh = cap / 1000;
  const peakCur = m * esc;
  const avgCur = m * esc * (hover / 100);
  const minC = capAh > 0 ? Math.ceil((peakCur / capAh) * C_RATING_SAFETY_MARGIN) : 0;
  const maxDeliver = crate * capAh;
  const headroom = maxDeliver - peakCur;
  const currentOk = maxDeliver >= peakCur;

  const avgCurMA = avgCur * 1000;
  const flightTime =
    cap > 0 && avgCurMA > 0 ? (cap / avgCurMA) * 60 * USABLE_CAPACITY_FRACTION : 0;

  const totalWt = dwt + bwt + payload;
  const totalThrust = m * thrust;
  const tw = totalWt > 0 ? totalThrust / totalWt : 0;

  const wh = voltage * capAh;
  const usableWh = wh * USABLE_CAPACITY_FRACTION;
  const peakPow = peakCur * voltage;
  const avgPow = avgCur * voltage;
  const whPerG = bwt > 0 ? wh / bwt : 0;

  const rTotal = (irMc * cells) / 1000;
  const sagTotal = avgCur * rTotal;
  const sagCell = cells > 0 ? sagTotal / cells : 0;
  const vLoad = voltage - sagTotal;
  const vCellLoad = cells > 0 ? vLoad / cells : 0;

  const batPct = totalWt > 0 ? (bwt / totalWt) * 100 : 0;
  const twOk = tw >= THRESHOLDS.thrustToWeight.ok;
  const twWarn = tw >= THRESHOLDS.thrustToWeight.warn && tw < THRESHOLDS.thrustToWeight.ok;
  const ftOk = flightTime >= THRESHOLDS.flightTimeMin.ok;
  const ftWarn =
    flightTime >= THRESHOLDS.flightTimeMin.warn && flightTime < THRESHOLDS.flightTimeMin.ok;
  const batOk =
    batPct >= THRESHOLDS.batteryPctOfAuw.okMin && batPct <= THRESHOLDS.batteryPctOfAuw.okMax;
  const batWarn =
    batPct > THRESHOLDS.batteryPctOfAuw.okMax && batPct <= THRESHOLDS.batteryPctOfAuw.warnMax;

  const metrics = [
    {
      label: "Peak current draw",
      val: fmt(peakCur),
      unit: "A",
      sub: `${m} × ${fmt(esc)} A ESC`,
      badge: currentOk ? "ok" : "bad",
      bt: currentOk ? "Battery can supply" : "Battery undersized",
      bar: maxDeliver > 0 ? Math.min((peakCur / maxDeliver) * 100, 100) : 100,
      bc: currentOk ? "#639922" : "#e24b4a",
    },
    {
      label: "Min C-rating needed",
      val: minC,
      unit: "C",
      sub: `with ${Math.round((C_RATING_SAFETY_MARGIN - 1) * 100)}% safety margin`,
      badge: crate >= minC ? "ok" : "bad",
      bt: crate >= minC ? `${crate}C sufficient` : `Need ${minC}C+`,
      bar: minC > 0 ? Math.min((crate / minC) * 100, 100) : 100,
      bc: crate >= minC ? "#639922" : "#e24b4a",
    },
    {
      label: "Max deliverable",
      val: fmt(maxDeliver, 1),
      unit: "A",
      sub: `${crate}C × ${capAh.toFixed(2)} Ah`,
      badge: currentOk ? "ok" : "bad",
      bt: currentOk
        ? `+${fmt(headroom, 1)} A headroom`
        : `${fmt(Math.abs(headroom), 1)} A short`,
      bar: peakCur > 0 ? Math.min((maxDeliver / peakCur) * 100, 100) : 100,
      bc: currentOk ? "#639922" : "#e24b4a",
    },
    {
      label: "Flight time (est.)",
      val: fmt(flightTime, 1),
      unit: "min",
      sub: `at ${hover}% throttle · ${Math.round(USABLE_CAPACITY_FRACTION * 100)}% cap`,
      badge: ftOk ? "ok" : ftWarn ? "warn" : "bad",
      bt: ftOk ? "Good" : ftWarn ? "Short" : "Too short",
      bar: Math.min((flightTime / 20) * 100, 100),
      bc: ftOk ? "#639922" : ftWarn ? "#ba7517" : "#e24b4a",
    },
    {
      label: "Thrust-to-weight",
      val: fmt(tw, 2),
      unit: ":1",
      sub: `${fmt(totalThrust)}g ÷ ${fmt(totalWt)}g`,
      badge: twOk ? "ok" : twWarn ? "warn" : "bad",
      bt: twOk ? "Good margin" : twWarn ? "Marginal" : "Cannot fly",
      bar: Math.min((tw / 5) * 100, 100),
      bc: twOk ? "#639922" : twWarn ? "#ba7517" : "#e24b4a",
    },
    {
      label: "Pack energy",
      val: fmt(wh, 1),
      unit: "Wh",
      sub: `${voltage.toFixed(1)}V × ${capAh.toFixed(2)} Ah`,
      badge: "info",
      bt: `${fmt(whPerG, 4)} Wh/g density`,
      bar: Math.min((wh / 200) * 100, 100),
      bc: "#185fa5",
    },
    {
      label: "Battery % of AUW",
      val: fmt(batPct, 1),
      unit: "%",
      sub: `${fmt(bwt)}g of ${fmt(totalWt)}g total`,
      badge: batOk ? "ok" : batWarn ? "warn" : "bad",
      bt: batOk ? "Healthy" : batWarn ? "Heavy pack" : batPct < 15 ? "Light pack" : "Too heavy",
      bar: Math.min((batPct / 50) * 100, 100),
      bc: batOk ? "#639922" : "#ba7517",
    },
    {
      label: "Voltage under load",
      val: fmt(vLoad, 2),
      unit: "V",
      sub: `${fmt(sagCell * 1000, 1)} mV sag/cell @ hover`,
      badge: sagCell < THRESHOLDS.sagPerCellV.ok ? "ok" : sagCell < THRESHOLDS.sagPerCellV.warn ? "warn" : "bad",
      bt:
        sagCell < THRESHOLDS.sagPerCellV.ok
          ? "Negligible sag"
          : sagCell < THRESHOLDS.sagPerCellV.warn
            ? "Moderate sag"
            : "High sag",
      bar: cells > 0 ? Math.min((vLoad / (cells * CELL_FULL_VOLTAGE)) * 100, 100) : 0,
      bc: sagCell < THRESHOLDS.sagPerCellV.ok ? "#639922" : sagCell < THRESHOLDS.sagPerCellV.warn ? "#ba7517" : "#e24b4a",
    },
    {
      label: "Peak power draw",
      val: fmt(peakPow),
      unit: "W",
      sub: `${fmt(peakCur)}A × ${voltage.toFixed(1)}V`,
      badge: "info",
      bt: `Avg hover: ${fmt(avgPow)} W`,
      bar: peakPow > 0 ? Math.min((avgPow / peakPow) * 100, 100) : 0,
      bc: "#185fa5",
    },
  ];

  const issues = [];
  if (!currentOk) {
    issues.push(
      `battery cannot supply peak current (${fmt(maxDeliver, 1)} A vs ${fmt(peakCur)} A required)`,
    );
  }
  if (!twOk && !twWarn) {
    issues.push(`T:W (${fmt(tw, 2)}:1) below ${THRESHOLDS.thrustToWeight.warn}:1 minimum — will not fly`);
  }
  if (!ftOk && !ftWarn) {
    issues.push(`flight time (${fmt(flightTime, 1)} min) critically short`);
  }
  if (sagCell >= THRESHOLDS.sagPerCellV.warn) {
    issues.push(
      `high voltage sag (${fmt(sagCell * 1000, 1)} mV/cell) — lower IR battery needed`,
    );
  }

  const rows = [
    ["Nominal pack voltage", `${cells}S × ${CELL_NOMINAL_VOLTAGE} V`, `${fmt(voltage, 1)} V`],
    ["Pack capacity (Ah)", `${cap} mAh ÷ 1000`, `${capAh.toFixed(3)} Ah`],
    ["Peak current draw", `${m} × ${fmt(esc)} A`, `${fmt(peakCur)} A`],
    ["Avg hover current", `${m} × ${fmt(esc)}A × ${hover}%`, `${fmt(avgCur, 1)} A`],
    ["Max deliverable current", `${crate}C × ${capAh.toFixed(3)} Ah`, `${fmt(maxDeliver, 1)} A`],
    ["Current headroom", `${fmt(maxDeliver, 1)} − ${fmt(peakCur)} A`, `${fmt(headroom, 1)} A`],
    [
      "Min C-rating (incl. 20% buf)",
      `(${fmt(peakCur)} ÷ ${capAh.toFixed(3)}) × ${C_RATING_SAFETY_MARGIN}`,
      `${minC}C`,
    ],
    [
      "Estimated flight time",
      `(${cap} ÷ ${fmt(avgCurMA, 0)}) × 60 × ${USABLE_CAPACITY_FRACTION}`,
      `${fmt(flightTime, 1)} min`,
    ],
    ["Total AUW", `${fmt(dwt)}+${fmt(bwt)}+${fmt(payload)} g`, `${fmt(totalWt)} g`],
    ["Total max thrust", `${m} × ${fmt(thrust)} g`, `${fmt(totalThrust)} g`],
    ["Thrust-to-weight", `${fmt(totalThrust)} ÷ ${fmt(totalWt)}`, `${fmt(tw, 3)} : 1`],
    ["Battery % of AUW", `${fmt(bwt)} ÷ ${fmt(totalWt)} × 100`, `${fmt(batPct, 1)} %`],
    ["Pack energy (Wh)", `${voltage.toFixed(1)}V × ${capAh.toFixed(3)} Ah`, `${fmt(wh, 2)} Wh`],
    [
      "Usable energy (80%)",
      `${fmt(wh, 2)} Wh × ${USABLE_CAPACITY_FRACTION}`,
      `${fmt(usableWh, 2)} Wh`,
    ],
    ["Energy density", `${fmt(wh, 2)} Wh ÷ ${fmt(bwt)} g`, `${fmt(whPerG, 4)} Wh/g`],
    ["Peak power draw", `${fmt(peakCur)}A × ${voltage.toFixed(1)} V`, `${fmt(peakPow)} W`],
    ["Avg hover power", `${fmt(avgCur, 1)}A × ${voltage.toFixed(1)} V`, `${fmt(avgPow, 1)} W`],
    ["Pack internal resistance", `${irMc} mΩ/cell × ${cells}S`, `${fmt(rTotal * 1000, 1)} mΩ`],
    ["Voltage sag (hover)", `${fmt(avgCur, 1)}A × ${fmt(rTotal * 1000, 1)} mΩ`, `${fmt(sagTotal, 3)} V`],
    ["Sag per cell", `${fmt(sagTotal, 3)} V ÷ ${cells} cells`, `${fmt(sagCell * 1000, 1)} mV/cell`],
    ["Voltage under hover load", `${voltage.toFixed(1)} − ${fmt(sagTotal, 3)} V`, `${fmt(vLoad, 2)} V`],
    [
      "Voltage per cell under load",
      `${fmt(vLoad, 2)} ÷ ${cells} cells`,
      `${fmt(vCellLoad, 3)} V/cell`,
    ],
  ];

  return {
    inputs: { motors: m, esc, thrust, hover, cells, cap, crate, bwt, dwt, payload, ir: irMc },
    derived: {
      voltage,
      capAh,
      peakCur,
      avgCur,
      minC,
      maxDeliver,
      headroom,
      currentOk,
      flightTime,
      totalWt,
      totalThrust,
      tw,
      wh,
      usableWh,
      peakPow,
      avgPow,
      whPerG,
      sagTotal,
      sagCell,
      vLoad,
      vCellLoad,
      batPct,
      twOk,
      twWarn,
      ftOk,
      ftWarn,
      batOk,
      batWarn,
    },
    metrics,
    issues,
    rows,
    pass: issues.length === 0,
  };
}
