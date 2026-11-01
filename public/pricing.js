import { calculateEstimate } from './pricing-calculator.js?v=templates-2';
const form = document.querySelector('#estimate-form');
const money = value => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
function update() {
  const fields = new FormData(form);
  const estimate = calculateEstimate({ templates: fields.get('templates'), design: fields.get('design'), features: fields.getAll('feature'), hosting: fields.get('hosting') });
  document.querySelector('#template-count-output').textContent = `${estimate.templates} ${estimate.templates === 1 ? 'page template' : 'page templates'}`;
  document.querySelector('#estimate-lines').replaceChildren(...estimate.lines.map(line => {
    const item = document.createElement('li');
    const label = document.createElement('span'); label.textContent = line.label;
    const price = document.createElement('b'); price.textContent = money(line.price);
    item.append(label, price); return item;
  }));
  document.querySelector('#project-total').textContent = money(estimate.total);
  document.querySelector('#mobile-project-total').textContent = money(estimate.total);
  document.querySelector('#mobile-monthly-total').textContent = `+ ${money(estimate.monthly)}/month support`;
  document.querySelector('#monthly-total').textContent = `${money(estimate.monthly)} / month`;
  const body = ['Hi Herr Systems,', '', 'I’d like to discuss this sample estimate:', ...estimate.lines.map(line => `${line.label}: ${money(line.price)}`), '', `One-time sample estimate: ${money(estimate.total)}`, `Support: ${estimate.support} — ${money(estimate.monthly)}/month`, '', 'I understand these are sample prices, not a binding quote. Please help confirm the scope and final pricing.'].join('\n');
  document.querySelector('#request-estimate').href = `mailto:hello@herrsystems.com?subject=${encodeURIComponent('My project estimate')}&body=${encodeURIComponent(body)}`;
}
document.querySelector('#estimate-controls').disabled = false;
form.addEventListener('submit', event => event.preventDefault());
form.addEventListener('input', update);
form.addEventListener('change', update);
form.addEventListener('reset', () => setTimeout(update, 0));
update();
