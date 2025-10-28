// find-ride.js - Render destinations and navigate to pickup-location with URL params

const destinations = [
  { id: 'maryheights', name: 'Mary Heights Campus', address: '1301 Cardinal Drive' },
  { id: 'main', name: 'Main Campus', address: '800 S Main St' },
  { id: 'library', name: 'University Library', address: '450 Academic Way' },
  { id: 'stadium', name: 'University Stadium', address: '1500 Sports Complex Dr' },
];

function renderDestinations() {
  const container = document.getElementById('destinations-list');
  if (!container) return;

  container.innerHTML = '';

  destinations.forEach(dest => {
    const card = document.createElement('div');
    card.className = 'destination-card ride-card p-4 cursor-pointer transition-all hover:border-primary hover:shadow-md';
    card.dataset.id = dest.id;

    card.innerHTML = `
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <svg class="w-6 h-6 text-primary" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
          </div>
          <div>
            <h3 class="font-semibold text-lg">${dest.name}</h3>
            <p class="text-sm text-muted-foreground">${dest.address}</p>
          </div>
        </div>
        <svg class="w-5 h-5 text-muted-foreground" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"></path></svg>
      </div>
    `;

    card.addEventListener('click', () => handleDestinationSelect(dest.id));

    container.appendChild(card);
  });
}

function handleDestinationSelect(destinationId) {
  const destination = destinations.find(d => d.id === destinationId);
  // temporary visual selection
  document.querySelectorAll('.destination-card').forEach(el => el.classList.remove('selected'));
  const el = document.querySelector(`.destination-card[data-id="${destinationId}"]`);
  if (el) el.classList.add('selected');

  // Navigate to pickup-location with params
  setTimeout(() => {
    const params = new URLSearchParams({
      destination: destinationId,
      name: destination?.name || '',
      address: destination?.address || ''
    });
    // Use relative path since this script runs from pages (e.g. pages/find-ride.html)
    window.location.href = `./pickup-location.html?${params.toString()}`;
  }, 240);
}

// Wire up back button
document.addEventListener('DOMContentLoaded', () => {
  renderDestinations();

  const backBtn = document.getElementById('back-btn');
  if (backBtn) backBtn.addEventListener('click', () => window.location.href = './index.html');
});
