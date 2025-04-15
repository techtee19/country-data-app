"use strict";

const countriesContainer = document.querySelector(".countries");
const searchInput = document.querySelector(".search-input");
const btnSearch = document.querySelector(".search-btn");
const modal = document.querySelector(".modal");
const modalContent = document.querySelector(".modal-country-info");
const closeModalBtn = document.querySelector(".close-btn");

// Add a container for user location
const userLocationContainer = document.createElement("div");
userLocationContainer.className = "user-location";
countriesContainer.insertAdjacentElement("beforebegin", userLocationContainer);

const getJSON = function (url, errorMsg = "Something went wrong") {
  return fetch(url).then((response) => {
    if (!response.ok) throw new Error(`${errorMsg} (${response.status})`);
    return response.json();
  });
};

const renderCountry = function (data) {
  const population = (+data.population / 1000000).toFixed(1) + "M";
  const capital = data.capital?.[0] ?? "N/A";
  const flag = data.flags?.svg ?? "https://via.placeholder.com/150";
  const languages = data.languages
    ? Object.values(data.languages).join(", ")
    : "N/A";
  const currencies = data.currencies
    ? Object.values(data.currencies)
        .map((curr) => curr.name)
        .join(", ")
    : "N/A";
  // Get coordinates for the map
  const coordinates = data.latlng ?? [0, 0]; // [latitude, longitude]

  const card = document.createElement("div");
  card.className = "country";
  card.innerHTML = `
    <img class="country__img" src="${flag}" alt="${data.name.common} flag" />
    <div class="country__data">
      <h3 class="country__name">${data.name.common}</h3>
      <h4 class="country__region">${data.region}</h4>
    </div>
  `;

  card.addEventListener("click", () => {
    modalContent.innerHTML = `
    <div class = "country-info">
    <img class="country__img" src="${flag}" alt="${data.name.common} flag" />
    <div >
    <h2>${data.name.common} ${data.flag}</h2>
      <p><strong>Region:</strong> ${data.region}</p>
      <p><strong>🏛️:</strong> ${capital}</p>
      <p><strong>👫:</strong> ${population}</p>
      <p><strong>🗣️:</strong> ${languages}</p>
      <p><strong>💰:</strong> ${currencies}</p>
      </div>
      </div>
      <div id="map" style="height: 300px; margin-top: 20px;"></div>
    `;
    modal.classList.remove("hidden");

    // Initialize Leaflet map after modal content is set
    setTimeout(() => {
      const map = L.map("map").setView(coordinates, 5);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);
      L.marker(coordinates).addTo(map).bindPopup(data.name.common).openPopup();
    }, 0);
  });

  countriesContainer.appendChild(card);
  countriesContainer.style.opacity = 1;
};

const renderError = function (msg) {
  countriesContainer.innerHTML = `<p>${msg}</p>`;
};

const renderUserLocation = function (countryName) {
  userLocationContainer.innerHTML = `<p>Your location: <strong>${countryName}</strong></p>`;
};

// Get user's location and load countries
const getUserLocation = async function () {
  try {
    // Get user coordinates
    const position = await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject);
    });

    const { latitude, longitude } = position.coords;

    // Reverse geocode to get country
    const geoData = await getJSON(
      `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
      "Could not get your location"
    );

    const countryName = geoData.address?.country || "Unknown";
    renderUserLocation(countryName);

    // Load default countries after getting location
    loadFirst30Countries();
  } catch (err) {
    renderUserLocation("Unable to detect location");
    loadFirst30Countries(); // Proceed even if location fails
  }
};

let debounceTimeout;

searchInput.addEventListener("input", (e) => {
  const query = e.target.value.trim();

  if (query === "") {
    clearTimeout(debounceTimeout);
    getUserLocation(); // Reload user location and first 30 countries
    return;
  }

  if (query.length < 2) {
    countriesContainer.innerHTML = "";
    return;
  }

  clearTimeout(debounceTimeout);
  debounceTimeout = setTimeout(() => {
    searchCountries(query);
  }, 300);
});

const searchCountries = async function (query) {
  try {
    countriesContainer.innerHTML = "";
    const data = await getJSON(
      `https://restcountries.com/v3.1/name/${query}`,
      "Country not found"
    );

    const filtered = data.filter((country) =>
      country.name.common.toLowerCase().includes(query.toLowerCase())
    );

    if (filtered.length === 0)
      throw new Error("No countries matched your search.");

    filtered.forEach((country) => renderCountry(country));
  } catch (err) {
    renderError(`💥 ${err.message}`);
  }
};

const loadFirst30Countries = async function () {
  try {
    countriesContainer.innerHTML = "";
    const data = await getJSON("https://restcountries.com/v3.1/all");
    const first30 = data.slice(0, 30);
    first30.forEach((country) => renderCountry(country));
  } catch (err) {
    renderError(`💥 ${err.message}`);
  }
};

// Event listeners
btnSearch.addEventListener("click", () => {
  const query = searchInput.value.trim();
  if (query) searchCountries(query);
});

searchInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    const query = searchInput.value.trim();
    if (query) searchCountries(query);
  }
});

closeModalBtn.addEventListener("click", () => {
  modal.classList.add("hidden");
});

// Load user location and default countries on page load
getUserLocation();
