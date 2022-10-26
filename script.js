'use strict';

class Location {
  date = new Date();
  id = (Date.now() + '').slice(-10);
  clicks = 0;

  constructor(coords, start, end, arrival) {
    this.coords = coords; // [lat, lng]
    this.start = start; // Start Time
    this.end = end; // End Time
    this.arrival = arrival; // Arrival Time (Parking)
  }

  _setDescription() {
    this.description = `${this.type[0].toUpperCase()}${this.type.slice(
      1
    )} Here`;
  }

  click() {
    this.clicks++;
  }
}

class Shoot extends Location {
  type = 'shoot';
  constructor(coords, start, end) {
    super(coords, start, end);
    this._setDescription();
  }
}
class Parking extends Location {
  type = 'parking';
  constructor(coords, arrival) {
    super(coords, arrival);
    this._setDescription();
  }
}

////////////////////////////////////////////////////////
// APPLICATION ARCHITECTURE
const form = document.querySelector('.form');
const containerLocations = document.querySelector('.locations');
const inputType = document.querySelector('.form__input--type');
const inputStart = document.querySelector('.form__input--start');
const inputEnd = document.querySelector('.form__input--end');
const inputArrival = document.querySelector('.form__input--arrival');

class App {
  #map;
  #mapZoomLevel = 13;
  #mapEvent;
  #locations = [];

  constructor() {
    this._getPosition();

    // Get data from local storage
    this._getLocalStoarge();

    // Attach event handlers
    form.addEventListener('submit', this._newLocation.bind(this));
    inputType.addEventListener('change', this._toggleEndField);
    inputType.addEventListener('change', this._toggleStartField);
    inputType.addEventListener('change', this._toggleArrivalField);
    containerLocations.addEventListener('click', this._moveToPopup.bind(this));
  }

  _getPosition() {
    if (navigator.geolocation)
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          alert('Could not get your position');
        }
      );
  }

  _loadMap(position) {
    const { latitude } = position.coords;
    const { longitude } = position.coords;

    const coords = [latitude, longitude];

    this.#map = L.map('map').setView(coords, this.#mapZoomLevel);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    // Handling clicks on map
    this.#map.on('click', this._showForm.bind(this));

    this.#locations.forEach(loc => {
      this._renderLocationMarker(loc);
    });
  }

  _showForm(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove('hidden');
    inputStart.value !== '' ? inputStart.focus() : inputArrival.focus();
  }

  _hideForm() {
    // Empty inputs
    inputStart.value = inputArrival.value = inputEnd.value = '';
    form.style.display = 'none';
    form.classList.add('hidden');
    setTimeout(() => (form.style.display = 'grid'), 1000);
  }

  _toggleEndField() {
    inputEnd.closest('.end').classList.toggle('form__row--hidden');
  }
  _toggleArrivalField() {
    inputArrival.closest('.arrival').classList.toggle('form__row--hidden');
  }
  _toggleStartField() {
    inputStart.closest('.start').classList.toggle('form__row--hidden');
  }

  _newLocation(e) {
    e.preventDefault();

    // Get data from form
    const type = inputType.value;
    const start = inputStart.value;
    const end = inputEnd.value;
    const arrival = inputArrival.value;
    const { lat, lng } = this.#mapEvent.latlng;
    let location;

    // If activity is Shoot, create Shoot object
    if (type === 'shoot') {
      location = new Shoot([lat, lng], start, end);
    }

    // If activity is Parking, create Parking object
    if (type === 'parking') {
      location = new Parking([lat, lng], arrival);
    }

    // Add new object to location array
    this.#locations.push(location);

    // Render location on map as marker
    this._renderLocationMarker(location);

    // Render location on list
    this._renderLocation(location);

    // Hide form + clear input fields
    this._hideForm();

    // Set local storage to all locations
    this._setLocalStorage();
  }

  // Display Marker
  _renderLocationMarker(location) {
    L.marker(location.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${location.type}-popup`,
        })
      )
      .setPopupContent(
        `${location.type === 'shoot' ? '📷' : '🅿️'} ${location.description}`
      )
      .openPopup();
  }

  _renderLocation(location) {
    let html = `
      <li class="location location--${location.type}" data-id="${location.id}">
        <h2 class="location__title">${location.description}</h2>
        `;
    if (location.type === 'shoot')
      html += `
      <div class="location__details">
          <span class="location__icon">🟢 </span>
          <span class="location__value">Start Time: <b>${location.start}</b></span>
        </div>
      <div class="location__details">
        <span class="location__icon">🛑 </span>
        <span class="location__value">End Time: <b>${location.end}</b></span>
      </div>
      </li>`;
    if (location.type === 'parking')
      html += `
      <div class="location__details">
      <span class="location__icon">🅿️ </span>
      <span class="location__value">Arrival Time: <b>${location.start}</b></span>
    </div>
      </li>`;

    form.insertAdjacentHTML('afterend', html);
  }
  _moveToPopup(e) {
    const locationEl = e.target.closest('.location');

    if (!locationEl) return;

    const location = this.#locations.find(
      loc => loc.id === locationEl.dataset.id
    );

    this.#map.setView(location.coords, this.#mapZoomLevel, {
      animate: true,
      pan: {
        duration: 1,
      },
    });
  }

  _setLocalStorage() {
    localStorage.setItem('locations', JSON.stringify(this.#locations));
  }

  // _removeLocalStorage() {

  // }

  _getLocalStoarge() {
    const data = JSON.parse(localStorage.getItem('locations'));

    if (!data) return;

    this.#locations = data;
    this.#locations.forEach(loc => {
      this._renderLocation(loc);
    });
  }

  reset() {
    localStorage.removeItem('locations');
    location.reload();
  }
}

const app = new App();
