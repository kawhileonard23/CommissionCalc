import { requireAuth } from "./authGuard.js";
await requireAuth();

// 1. Grab stored commissionResults
const raw = sessionStorage.getItem('commissionResults') || '{}';
let results;
try {
  results = JSON.parse(raw);
} catch {
  document.getElementById('report').textContent = 'Error reading report data';
  throw new Error('Invalid JSON in sessionStorage.commissionResults');
}

// 2. Populate report container
const container = document.getElementById('report');
container.innerHTML = ''; // clear placeholder

const keys = Object.keys(results);
if (keys.length === 0) {
  container.textContent = 'No commission data available.';
} else {
  keys.forEach(owner => {
    const p = document.createElement('p');
    p.textContent = `${owner}: $${results[owner].toFixed(2)}`;
    container.appendChild(p);
  });
}
