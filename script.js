"use strict";

const btn = document.querySelector(".btn-country");
const btnSearch = document.querySelector(".search-btn");
const searchInput = document.querySelector(".search-input");
const countriesContainer = document.querySelector(".countries");

const renderCountry = function (data, className = "") {
  // Safely access properties with fallbacks
  const population = (+data.population / 1000000).toFixed(1) + "M";
  const capital = data.capital?.[0] ?? "N/A";
  const flag = data.flags?.svg ?? "https://via.placeholder.com/150";

  // Handle languages (convert object to array and join)
  const languages = data.languages
    ? Object.values(data.languages).join(", ")
    : "N/A";

  // Handle currencies (get names and join if multiple)
  const currencies = data.currencies
    ? Object.values(data.currencies)
        .map((curr) => curr.name)
        .join(", ")
    : "N/A";

  const html = `
        <article class="country ${className}">
          <img class="country__img" src="${flag}" alt="${data.name.common} flag" />
          <div class="country__data">
            <h3 class="country__name">${data.name.common}</h3>
            <h4 class="country__region">${data.region}</h4>
            <p class="country__row"><span>🏛️</span>Capital: ${capital}</p>
            <p class="country__row"><span>👫</span>Population: ${population}</p>
            <p class="country__row"><span>🗣️</span>${languages}</p>
            <p class="country__row"><span>💰</span>${currencies}</p>
          </div>
        </article>
      `;

  countriesContainer.insertAdjacentHTML("beforeend", html);
  countriesContainer.style.opacity = 1;
};

const getJSON = function (url, errorMsg = "Something went wrong") {
  return fetch(url).then((response) => {
    if (!response.ok) throw new Error(`${errorMsg} ${response.status}`);
    return response.json();
  });
};

const renderError = function (msg) {
  countriesContainer.insertAdjacentText("beforeend", msg);
  countriesContainer.style.opacity = 1;
};

const searchCountries = async function (query) {
  try {
    countriesContainer.innerHTML = ""; // Clear previous results
    if (!query) throw new Error("Please enter a country name");

    const data = await getJSON(
      `https://restcountries.com/v3.1/name/${query}`,
      "Country not found"
    );
    console.log(data);

    data.forEach((country) => renderCountry(country));
  } catch (err) {
    renderError(`💥 ${err.message}`);
  }
};

// Event listeners for search
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

const loadDefault = async () => {
  try {
    const data = await getJSON(
      `https://restcountries.com/v3.1/name/nigeria`,
      "Could not load default country"
    );
    renderCountry(data[0]);
  } catch (err) {
    renderError(`💥 ${err.message}`);
  }
};

loadDefault();
