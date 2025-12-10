(function(){
  'use strict';

  function loadSelectedRide(){
    try{
      const selected = JSON.parse(sessionStorage.getItem('selectedRide'));
      return selected || null;
    }catch(e){ return null; }
  }

  function el(id){ return document.getElementById(id); }

  function renderDriver(selected){
    if(!selected || !selected.driver){
      // no data, go back to start
      alert('No ride information available.');
      window.location.href = '../pages/select-pickup.html';
      return;
    }
    const d = selected.driver;
    el('driver-name').textContent = (d.firstName || '') + ' ' + (d.lastName || '');
    el('driver-vehicle').textContent = (selected.vehicle && selected.vehicle.model) ? selected.vehicle.model : (selected.vehicle && selected.vehicle.licensePlate ? selected.vehicle.licensePlate : 'Vehicle');
    el('driver-capacity').textContent = (selected.vehicle && selected.vehicle.availableSeats ? selected.vehicle.availableSeats : '') + (selected.vehicle && selected.vehicle.totalCapacity ? ('/' + selected.vehicle.totalCapacity) : '');
    // avatar: use initials if available
    const initials = ((d.firstName||'').charAt(0) + (d.lastName||'').charAt(0)).toUpperCase();
    el('driver-avatar').textContent = initials || '👤';
  }

  // star widget
  function setupStars(){
    const starEls = Array.from(document.querySelectorAll('.star'));
    let current = 0;

    function setRating(n){
      current = n;
      starEls.forEach(s => {
        const v = parseInt(s.getAttribute('data-value'),10);
        if(v <= n) { s.classList.add('filled'); s.textContent = '★'; }
        else { s.classList.remove('filled'); s.textContent = '☆'; }
      });
    }

    starEls.forEach(s => {
      s.addEventListener('click', function(){ setRating(parseInt(this.getAttribute('data-value'),10)); });
      s.addEventListener('mouseover', function(){ const v = parseInt(this.getAttribute('data-value'),10); setRating(v); });
      s.addEventListener('mouseout', function(){ setRating(current); });
    });

    return { getRating: () => current, setRating };
  }

  function saveRating(payload){
    try{
      // keep an array of ratings in localStorage
      const key = 'driverRatings';
      const raw = localStorage.getItem(key);
      const arr = raw ? JSON.parse(raw) : [];
      arr.push(payload);
      localStorage.setItem(key, JSON.stringify(arr));
      // also keep latest in session for quick access
      sessionStorage.setItem('driverRating', JSON.stringify(payload));
    }catch(e){ console.warn('Could not save rating', e); }
  }

  function init(){
    const selected = loadSelectedRide();
    renderDriver(selected);
    const starWidget = setupStars();

    el('skip-btn').addEventListener('click', function(){
      // go to landing or history
      window.location.href = '../pages/index.html';
    });

    el('submit-btn').addEventListener('click', function(){
      const rating = starWidget.getRating();
      const comments = el('comments').value.trim();
      if(!rating){
        if(!confirm('You did not select a star rating. Do you want to submit without a rating?')) return;
      }

      const payload = {
        timestamp: new Date().toISOString(),
        rating: rating || 0,
        comments: comments || null,
        driver: selected.driver || null,
        vehicle: selected.vehicle || null,
        trip: { pickup: sessionStorage.getItem('pickupLocation') || null, dropoff: sessionStorage.getItem('dropoffLocation') || null },
      };

      saveRating(payload);
      // show a small thank you and redirect to home or history
      alert('Thanks for your feedback.');
      window.location.href = '../pages/index.html';
    });
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();

})();
