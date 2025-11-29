// Simple demo app logic (no backend) to simulate wildlife reporting
const form = document.getElementById('sighting-form');
const sightingsListEl = document.getElementById('sightingsList');
const sightingsEmptyEl = document.getElementById('sightingsEmpty');
const alertsFeedEl = document.getElementById('alertsFeed');
const toastEl = document.getElementById('toast');

const searchInput = document.getElementById('searchInput');
const filterCategory = document.getElementById('filterCategory');
const filterRisk = document.getElementById('filterRisk');

let sightings = [];

function computeRisk(category, species) {
  const s = (species || '').toLowerCase();
  if (category === 'Mammal' && (s.includes('bear') || s.includes('coyote') || s.includes('wolf'))) {
    return 'High';
  }
  if (category === 'Mammal' || category === 'Reptile') {
    return 'Medium';
  }
  return 'Low';
}

function riskClass(risk) {
  if (risk === 'High') return 'risk-high';
  if (risk === 'Medium') return 'risk-medium';
  return 'risk-low';
}

function showToast(message) {
  if (!toastEl) return;
  toastEl.textContent = message;
  toastEl.classList.remove('hidden');
  requestAnimationFrame(() => {
    toastEl.classList.add('visible');
  });
  setTimeout(() => {
    toastEl.classList.remove('visible');
    setTimeout(() => toastEl.classList.add('hidden'), 200);
  }, 2600);
}

function addAlert(sighting) {
  const risk = sighting.riskLevel;
  const time = new Date(sighting.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const wrapper = document.createElement('div');
  wrapper.className = 'alert-item';

  const icon = document.createElement('div');
  icon.className = 'alert-icon';
  icon.textContent = risk === 'High' ? '⚠' : risk === 'Medium' ? '⚡' : '🕊';

  const body = document.createElement('div');
  body.className = 'alert-body';

  const main = document.createElement('div');
  main.textContent = `${sighting.species} at ${sighting.locationName} – risk ${risk}.`;

  const meta = document.createElement('div');
  meta.className = 'alert-meta';
  meta.textContent = `${time} • Logged by ${sighting.observerName || 'Anonymous'}`;

  body.appendChild(main);
  body.appendChild(meta);

  wrapper.appendChild(icon);
  wrapper.appendChild(body);

  alertsFeedEl.prepend(wrapper);
}

function renderSightings() {
  const query = (searchInput.value || '').trim().toLowerCase();
  const categoryFilter = filterCategory.value || 'All';
  const riskFilter = filterRisk.value || 'All';

  let filtered = sightings.slice().reverse(); // newest first

  if (query) {
    filtered = filtered.filter(s =>
      (s.species && s.species.toLowerCase().includes(query)) ||
      (s.locationName && s.locationName.toLowerCase().includes(query))
    );
  }

  if (categoryFilter !== 'All') {
    filtered = filtered.filter(s => s.category === categoryFilter);
  }

  if (riskFilter !== 'All') {
    filtered = filtered.filter(s => s.riskLevel === riskFilter);
  }

  sightingsListEl.innerHTML = '';

  if (!filtered.length) {
    sightingsEmptyEl.style.display = 'block';
    return;
  }

  sightingsEmptyEl.style.display = 'none';

  filtered.forEach(s => {
    const card = document.createElement('article');
    card.className = 'sighting-card';

    const avatar = document.createElement('div');
    avatar.className = 'sighting-avatar';
    avatar.textContent = (s.species || '?')[0]?.toUpperCase() || '?';

    const main = document.createElement('div');
    main.className = 'sighting-main';

    const speciesEl = document.createElement('h3');
    speciesEl.className = 'sighting-species';
    speciesEl.textContent = s.species || 'Unknown species';

    const locEl = document.createElement('p');
    locEl.className = 'sighting-location';
    const locPieces = [];
    if (s.locationName) locPieces.push(s.locationName);
    if (s.latitude && s.longitude) {
      locPieces.push(`${Number(s.latitude).toFixed(4)}, ${Number(s.longitude).toFixed(4)}`);
    }
    locEl.textContent = locPieces.join(' • ') || 'Location not specified';

    main.appendChild(speciesEl);
    main.appendChild(locEl);

    const riskPill = document.createElement('div');
    riskPill.className = `chip-pill ${riskClass(s.riskLevel)}`;
    riskPill.textContent = s.riskLevel || 'Low';

    const metaRow = document.createElement('div');
    metaRow.className = 'sighting-meta';

    const catChip = document.createElement('div');
    catChip.className = 'chip';
    catChip.textContent = s.category || 'Uncategorised';

    const dateChip = document.createElement('div');
    dateChip.className = 'chip';
    const date = new Date(s.dateObserved || s.createdAt);
    dateChip.textContent = date.toLocaleDateString();

    const observerChip = document.createElement('div');
    observerChip.className = 'chip';
    observerChip.textContent = s.observerName ? `Observer: ${s.observerName}` : 'Observer: Anonymous';

    metaRow.appendChild(catChip);
    metaRow.appendChild(dateChip);
    metaRow.appendChild(observerChip);

    card.appendChild(avatar);
    card.appendChild(main);
    card.appendChild(riskPill);
    card.appendChild(metaRow);

    sightingsListEl.appendChild(card);
  });
}

form.addEventListener('submit', (e) => {
  e.preventDefault();

  const formData = new FormData(form);
  const species = formData.get('species').toString().trim();
  const category = formData.get('category').toString();
  const locationName = formData.get('locationName').toString().trim();

  if (!species || !category || !locationName) {
    showToast('Please fill in the required fields: species, category, and location.');
    return;
  }

  const latitude = formData.get('latitude');
  const longitude = formData.get('longitude');
  const dateObserved = formData.get('dateObserved');
  const observerName = formData.get('observerName');
  const email = formData.get('email');
  const photoUrl = formData.get('photoUrl');
  const notes = formData.get('notes');

  const riskLevel = computeRisk(category, species);

  const sighting = {
    id: Date.now(),
    species,
    category,
    locationName,
    latitude: latitude ? Number(latitude) : null,
    longitude: longitude ? Number(longitude) : null,
    dateObserved: dateObserved || null,
    observerName: observerName ? observerName.toString().trim() : '',
    email: email ? email.toString().trim() : '',
    photoUrl: photoUrl ? photoUrl.toString().trim() : '',
    notes: notes ? notes.toString().trim() : '',
    riskLevel,
    createdAt: new Date().toISOString()
  };

  sightings.push(sighting);
  renderSightings();
  addAlert(sighting);
  form.reset();

  // set today's date after reset if user keeps logging
  const dateInput = document.getElementById('dateObserved');
  if (dateInput) {
    const today = new Date().toISOString().slice(0, 10);
    dateInput.value = today;
  }

  showToast(`Sighting logged. Calculated risk: ${riskLevel}.`);
});

document.getElementById('reset-btn').addEventListener('click', () => {
  setTimeout(renderSightings, 0);
});

[searchInput, filterCategory, filterRisk].forEach(el => {
  el.addEventListener('input', renderSightings);
  el.addEventListener('change', renderSightings);
});

// Seed with one example sighting for nicer initial state
(function seedExample() {
  const today = new Date().toISOString().slice(0, 10);
  const example = {
    id: Date.now() - 1,
    species: 'Red-tailed Hawk',
    category: 'Bird',
    locationName: 'Burlington Waterfront',
    latitude: 43.3256,
    longitude: -79.7990,
    dateObserved: today,
    observerName: 'Demo Observer',
    email: '',
    photoUrl: '',
    notes: 'Soaring above the shoreline, no public safety risk observed.',
    riskLevel: 'Low',
    createdAt: new Date().toISOString()
  };
  sightings.push(example);
  renderSightings();
  addAlert(example);
})();
