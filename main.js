document.addEventListener("DOMContentLoaded", () => {
  const apiKey = "cbc77ac327834ad8ae2173258251305"; 
  const searchInput = document.getElementById("searchInput");
  const searchButton = document.getElementById("searchButton");
  const locationTitle = document.getElementById("locationTitle");
  const promptMessage = document.getElementById("prompt-message");
  const currentWeatherDiv = document.getElementById("current-weather");
  const daysList = document.getElementById("days-list");
  const hourlyTable = document.getElementById("hourly-table");
  const tbody = document.querySelector("#hourly-table tbody");

  // Function to fetch and display weather data
  async function fetchWeather(location) {
    const currentUrl = `https://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${location}`;
    const forecastUrl = `https://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${location}&days=6&hourly=1`;

    try {
      // Clear previous data
      currentWeatherDiv.textContent = "Loading...";
      daysList.innerHTML = "";
      hourlyTable.classList.remove("active");
      tbody.innerHTML = "";
      promptMessage.style.display = "none";
      document.querySelector(".current-weather").style.display = "block";

      // Fetch current weather
      const currentResponse = await fetch(currentUrl);
      if (!currentResponse.ok) throw new Error(`Enter Correct City!`);
      const currentData = await currentResponse.json();

      // Update location title
      locationTitle.textContent = `Weather in ${currentData.location.name}, ${currentData.location.country}`;

      // Display current weather
      if (currentData && currentData.current) {
        currentWeatherDiv.innerHTML = `
                            Current Temperature: ${currentData.current.temp_c}°C<br>
                            Condition: ${currentData.current.condition.text}<br>
                            <img src="https:${currentData.current.condition.icon}" alt="Weather Icon"><br>
                            Wind: ${currentData.current.wind_kph} km/h | Humidity: ${currentData.current.humidity}%
                        `;
      }
      // Fetch 7-day forecast
      const forecastResponse = await fetch(forecastUrl);
      if (!forecastResponse.ok)
        throw new Error(`HTTP error! status: ${forecastResponse.status}`);
      const forecastData = await forecastResponse.json();

      // Display days
      const forecastDays = forecastData.forecast.forecastday;
      const now = new Date();
      forecastDays.forEach((day, index) => {
        const dayDate = new Date(day.date);
        const isToday = dayDate.toDateString() === now.toDateString();
        const dayElement = document.createElement("div");
        dayElement.className = "day";
        dayElement.textContent = isToday
          ? "Today"
          : dayDate.toLocaleDateString("en-US", {
              weekday: "long",
              day: "numeric",
              month: "short",
            });
        dayElement.dataset.index = index;
        dayElement.addEventListener("click", () =>
          showHourlyForecast(forecastDays, index)
        );
        daysList.appendChild(dayElement);
      });

      // Show hourly forecast for today by default
      showHourlyForecast(forecastDays, 0);
    } catch (error) {
      console.error("Error fetching weather:", error);
      currentWeatherDiv.innerHTML = "";
      if (currentWeatherDiv)
        currentWeatherDiv.textContent = `Error: ${error.message}`;
      promptMessage.style.display = "block";
      promptMessage.textContent = `Error: ${error.message}`;
    }
  }

  // Function to show hourly forecast for a selected day
  function showHourlyForecast(forecastDays, dayIndex) {
    let hourly = forecastDays[dayIndex].hour;
    const now = new Date();
    const fiveHoursLater = new Date(now.getTime() + 5 * 60 * 60 * 1000);

    // Find the closest hour (past or future) to the current time
    const closestHour = hourly.reduce((closest, hour) => {
      const hourTime = new Date(hour.time);
      return Math.abs(hourTime - now) < Math.abs(new Date(closest.time) - now)
        ? hour
        : closest;
    }, hourly[0]);

    // Clear and hide other days' active state
    document
      .querySelectorAll(".day")
      .forEach((day) => day.classList.remove("active"));
    document
      .querySelector(`.day[data-index="${dayIndex}"]`)
      .classList.add("active");

    // Clear previous hourly data
    tbody.innerHTML = "";
    hourlyTable.classList.add("active");

    // Show next 5 hours starting from the closest hour
    const startIndex = hourly.indexOf(closestHour);
    const isToday = dayIndex === 0;
    let hoursAdded = 0;
    let currentIndex = startIndex;
    let currentHourly = hourly;
    let currentDayIndex = dayIndex;

    for (let i = 0; hoursAdded < 5; i++) {
      // If we've run out of hours in the current day and we're on "Today", switch to the next day's data
      if (
        isToday &&
        currentIndex >= currentHourly.length &&
        currentDayIndex + 1 < forecastDays.length
      ) {
        currentDayIndex++;
        currentHourly = forecastDays[currentDayIndex].hour;
        currentIndex = 0; // Start from the beginning of the next day's hours
      }

      // Break if no more data is available
      if (currentIndex >= currentHourly.length) {
        break;
      }

      const time = new Date(currentHourly[currentIndex].time);
      if (
        isToday ||
        (!isToday && time >= new Date(forecastDays[dayIndex].date))
      ) {
        const row = document.createElement("tr");
        row.innerHTML = `
                <td>${time.toLocaleTimeString("en-US", {
                  hour: "numeric",
                  minute: "2-digit",
                  hour12: true,
                })}</td>
                <td>${currentHourly[currentIndex].temp_c}°C</td>
                <td>
                    ${currentHourly[currentIndex].condition.text}
                    <img src="https:${
                      currentHourly[currentIndex].condition.icon
                    }" alt="Weather Icon" style="vertical-align: middle;">
                </td>
            `;
        tbody.appendChild(row);
        hoursAdded++;
      }
      currentIndex++;
    }
  }

  // Search on button click
  searchButton.addEventListener("click", () => {
    const location = searchInput.value.trim();
    if (location) {
      fetchWeather(location);
    }
  });

  // Search on Enter key press
  searchInput.addEventListener("keypress", (event) => {
    if (event.key === "Enter") {
      const location = searchInput.value.trim();
      if (location) {
        fetchWeather(location);
      }
    }
  });
});
