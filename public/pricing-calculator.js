// Sample fixed-scope prices in USD; confirmed hourly rate is separate.
export const HOURLY_RATE = 70;
export const FEATURES = Object.freeze({
  ecommerce: { label: 'Ecommerce', price: 700 },
  ai: { label: 'AI Automation', price: 420 },
  cms: { label: 'Editable content / blog', price: 210 },
  booking: { label: 'Online booking', price: 210 },
  integration: { label: 'Business integration', price: 140 },
  development: { label: 'Custom development', price: 280 },
  consulting: { label: 'Technical consulting', price: 140 },
});
export const HOSTING = Object.freeze({ none: { label: 'Self-managed hosting', price: 0 }, hosting: { label: 'Hosting & backups', price: 35 }, managed: { label: 'Hosting & routine maintenance', price: 70 } });
export function calculateEstimate({ pages = 5, design = 'standard', features = [], hosting = 'none' } = {}) {
  pages = Number(pages);
  pages = Number.isFinite(pages) ? Math.min(20, Math.max(1, Math.round(pages))) : 5;
  const lines = [{ label: `Website · ${pages} ${pages === 1 ? 'page' : 'pages'}`, price: 280 + (pages - 1) * 70 }];
  if (design === 'custom') lines.push({ label: 'Custom visual direction', price: 350 });
  for (const key of new Set(features)) if (Object.hasOwn(FEATURES, key)) lines.push(FEATURES[key]);
  const support = Object.hasOwn(HOSTING, hosting) ? HOSTING[hosting] : HOSTING.none;
  return { pages, lines, total: lines.reduce((sum, line) => sum + line.price, 0), monthly: support.price, support: support.label };
}
