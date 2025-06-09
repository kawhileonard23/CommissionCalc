import { requireAuth } from "./authGuard.js";
await requireAuth();

// 1. Grab stored commissionResults
const raw = sessionStorage.getItem('commissionResults') || '{}';
const unclaimedCompanies = sessionStorage.getItem('unclaimedCompanies');
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

// 3. Add unclaimed companies section if data exists
if (unclaimedCompanies) {
  let unclaimedArray;
  try {
    unclaimedArray = JSON.parse(unclaimedCompanies);
    if (Array.isArray(unclaimedArray) && unclaimedArray.length > 0) {
      // Create section header
      const unclaimedHeader = document.createElement('h2');
      unclaimedHeader.textContent = 'Unclaimed Companies';
      unclaimedHeader.className = 'unclaimed-header';
      container.appendChild(unclaimedHeader);
      
      // Create scrollable list container
      const unclaimedContainer = document.createElement('div');
      unclaimedContainer.className = 'unclaimed-list';
      
      // Add each company to the list
      unclaimedArray.forEach(company => {
        const companyItem = document.createElement('div');
        companyItem.className = 'unclaimed-item';
        companyItem.textContent = company;
        unclaimedContainer.appendChild(companyItem);
      });
      
      container.appendChild(unclaimedContainer);
    }
  } catch (e) {
    console.error('Error parsing unclaimedCompanies:', e);
  }
}