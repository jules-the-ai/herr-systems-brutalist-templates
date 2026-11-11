import assert from "node:assert/strict";
import {
  calculateEstimate,
  HOURLY_RATE,
} from "../public/pricing-calculator.js";
assert.equal(HOURLY_RATE, 70);
const services = ["web", "hosting", "agentic", "consulting", "contract"];
for (let mask = 0; mask < 32; mask++) {
  const selected = services.filter((_, i) => mask & (1 << i));
  const estimate = calculateEstimate({
    services: selected,
    templates: 8,
    features: ["cms", "cms", "agentIntegration", "not-real"],
    hosting: "managed",
    consultingHours: 3,
    contractHours: 4,
  });
  assert.deepEqual(estimate.services, selected);
  assert.equal(
    estimate.total,
    estimate.lines.reduce((sum, line) => sum + line.price, 0),
  );
  assert.equal(estimate.monthly, selected.includes("hosting") ? 70 : 0);
  assert.equal(
    estimate.lines.filter((line) => line.label === "Editable content / blog")
      .length,
    selected.includes("web") ? 1 : 0,
  );
  assert.equal(
    estimate.lines.filter((line) => line.label === "Additional tool connection")
      .length,
    selected.includes("agentic") ? 1 : 0,
  );
  assert.equal("templates" in estimate.options, selected.includes("web"));
  assert.equal(
    "consultingHours" in estimate.options,
    selected.includes("consulting"),
  );
  assert.equal(
    "contractHours" in estimate.options,
    selected.includes("contract"),
  );
}
for (const bad of [null, undefined, NaN, {}, Infinity, -1000, "  ", "script"]) {
  const value = calculateEstimate({
    services: ["web", "consulting"],
    templates: bad,
    consultingHours: bad,
  });
  assert.ok(value.options.templates >= 1 && value.options.templates <= 20);
  assert.ok(
    value.options.consultingHours >= 1 && value.options.consultingHours <= 160,
  );
}
console.log(
  "Pricing model: 32 service combinations, deduplication, scope isolation, monthly separation, and bounds passed.",
);
