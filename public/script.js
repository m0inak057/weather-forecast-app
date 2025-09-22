/**
 * Weather Forecast App - JavaScript functionality
 * Handles API calls, UI interactions, and data management
 */

class WeatherApp {
    constructor() {
        this.currentWeatherType = 'current';
        this.recentCities = this.loadRecentCities();
        this.initializeElements();
        this.bindEvents();
        this.displayRecentCities();
        
        // Show welcome message on first load
        this.showWelcomeMessage();
    }

    initializeElements() {
        // Get DOM elements
        this.cityInput = document.getElementById('cityInput');
        this.searchBtn = document.getElementById('searchBtn');
        this.currentWeatherBtn = document.getElementById('currentWeatherBtn');
        this.forecastBtn = document.getElementById('forecastBtn');
        this.loadingSpinner = document.getElementById('loadingSpinner');
        this.errorMessage = document.getElementById('errorMessage');
        this.weatherResult = document.getElementById('weatherResult');
        this.recentSearches = document.getElementById('recentSearches');
        this.recentCities = document.getElementById('recentCities');
    }

    bindEvents() {
        // Search button and enter key
        this.searchBtn.addEventListener('click', () => this.searchWeather());
        this.cityInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.searchWeather();
        });
        
        // Weather type buttons
        this.currentWeatherBtn.addEventListener('click', () => {
            this.setWeatherType('current');
        });
        
        this.forecastBtn.addEventListener('click', () => {
            this.setWeatherType('forecast');
        });

        // Input validation and formatting
        this.cityInput.addEventListener('input', (e) => {
            this.validateInput(e.target);
        });

        // Auto-focus on city input when page loads
        this.cityInput.focus();
    }

    validateInput(input) {
        // Remove invalid characters and limit length
        input.value = input.value.replace(/[^a-zA-Z\s\-,.']/g, '');
        
        // Clear error when user starts typing
        if (input.value.length > 0) {
            this.hideError();
        }
    }

    setWeatherType(type) {
        this.currentWeatherType = type;
        
        // Update button states with smooth transition
        this.currentWeatherBtn.classList.toggle('active', type === 'current');
        this.forecastBtn.classList.toggle('active', type === 'forecast');
        
        // If there's already weather data displayed, refresh it with new type
        const currentCity = this.cityInput.value.trim();
        if (currentCity && this.weatherResult.style.display !== 'none') {
            this.searchWeather();
        }
    }

    async searchWeather() {
        const city = this.cityInput.value.trim();
        
        if (!city) {
            this.showError('Please enter a city name');
            this.cityInput.focus();
            return;
        }

        if (city.length < 2) {
            this.showError('City name must be at least 2 characters long');
            return;
        }

        this.showLoading();
        
        try {
            const response = await fetch(`/api/weather?city=${encodeURIComponent(city)}&type=${this.currentWeatherType}`);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.error) {
                this.showError(data.error);
            } else {
                this.displayWeather(data);
                this.addToRecentCities(city);
            }
        } catch (error) {
            console.error('Weather fetch error:', error);
            
            if (error.message.includes('Failed to fetch')) {
                this.showError('Network error. Please check your internet connection and try again.');
            } else if (error.message.includes('HTTP 404')) {
                this.showError(`City "${city}" not found. Please check the spelling and try again.`);
            } else if (error.message.includes('HTTP 429')) {
                this.showError('Too many requests. Please wait a moment and try again.');
            } else if (error.message.includes('HTTP 500')) {
                this.showError('Server error. Please try again later.');
            } else {
                this.showError('Something went wrong. Please try again.');
            }
        } finally {
            this.hideLoading();
        }
    }

    displayWeather(data) {
        this.hideError();
        
        if (data.type === 'current') {
            this.displayCurrentWeather(data);
        } else {
            this.displayForecast(data);
        }
        
        // Show weather result with smooth animation
        this.weatherResult.style.display = 'block';
        this.weatherResult.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    displayCurrentWeather(data) {
        const windSpeedKmh = (data.wind_speed * 3.6).toFixed(1); // Convert m/s to km/h
        const visibilityKm = data.visibility ? data.visibility.toFixed(1) : 'N/A';
        
        const html = `
            <div class="current-weather">
                <div class="city-info">
                    <h2><i class="fas fa-map-marker-alt"></i> ${data.city}, ${data.country}</h2>
                </div>
                
                <div class="weather-icon">
                    <img src="https://openweathermap.org/img/wn/${data.icon}@4x.png" 
                         alt="${data.description}" 
                         loading="lazy">
                </div>
                
                <div class="temperature">${Math.round(data.temperature)}°C</div>
                <div class="description">${data.description}</div>
                
                <div class="weather-details">
                    <div class="detail-card">
                        <i class="fas fa-thermometer-half"></i>
                        <div>Feels Like</div>
                        <div><strong>${Math.round(data.feels_like)}°C</strong></div>
                    </div>
                    
                    <div class="detail-card">
                        <i class="fas fa-tint"></i>
                        <div>Humidity</div>
                        <div><strong>${data.humidity}%</strong></div>
                    </div>
                    
                    <div class="detail-card">
                        <i class="fas fa-compress-arrows-alt"></i>
                        <div>Pressure</div>
                        <div><strong>${data.pressure} hPa</strong></div>
                    </div>
                    
                    <div class="detail-card">
                        <i class="fas fa-wind"></i>
                        <div>Wind Speed</div>
                        <div><strong>${windSpeedKmh} km/h</strong></div>
                    </div>
                    
                    <div class="detail-card">
                        <i class="fas fa-eye"></i>
                        <div>Visibility</div>
                        <div><strong>${visibilityKm} km</strong></div>
                    </div>
                    
                    <div class="detail-card">
                        <i class="fas fa-clock"></i>
                        <div>Last Updated</div>
                        <div><strong>${new Date().toLocaleTimeString()}</strong></div>
                    </div>
                </div>
            </div>
        `;
        
        this.weatherResult.innerHTML = html;
    }

    displayForecast(data) {
        const forecastCards = data.forecasts.map((forecast, index) => {
            const windSpeedKmh = (forecast.wind_speed * 3.6).toFixed(1);
            
            return `
                <div class="forecast-card" style="animation-delay: ${index * 0.1}s">
                    <div class="forecast-date">${this.formatDate(forecast.date)}</div>
                    <div class="weather-icon">
                        <img src="https://openweathermap.org/img/wn/${forecast.icon}@2x.png" 
                             alt="${forecast.description}"
                             loading="lazy">
                    </div>
                    <div class="forecast-temp">${Math.round(forecast.temperature)}°C</div>
                    <div class="forecast-desc">${forecast.description}</div>
                    <div style="margin-top: 10px; font-size: 0.9rem; color: #666;">
                        <div><i class="fas fa-thermometer-half"></i> Feels like ${Math.round(forecast.feels_like)}°C</div>
                        <div><i class="fas fa-tint"></i> ${forecast.humidity}% humidity</div>
                        <div><i class="fas fa-wind"></i> ${windSpeedKmh} km/h wind</div>
                        <div><i class="fas fa-compress-arrows-alt"></i> ${forecast.pressure} hPa</div>
                    </div>
                </div>
            `;
        }).join('');

        const html = `
            <div class="forecast-weather">
                <div class="city-info">
                    <h2><i class="fas fa-calendar-alt"></i> 5-Day Forecast for ${data.city}, ${data.country}</h2>
                </div>
                
                <div class="forecast-container">
                    ${forecastCards}
                </div>
                
                <div style="text-align: center; margin-top: 2rem; color: #666; font-size: 0.9rem;">
                    <i class="fas fa-info-circle"></i> Forecast data updates every 3 hours
                </div>
            </div>
        `;
        
        this.weatherResult.innerHTML = html;
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);
        
        // Check if it's today or tomorrow
        if (date.toDateString() === today.toDateString()) {
            return 'Today';
        } else if (date.toDateString() === tomorrow.toDateString()) {
            return 'Tomorrow';
        } else {
            return date.toLocaleDateString('en-US', { 
                weekday: 'short', 
                month: 'short', 
                day: 'numeric' 
            });
        }
    }

    // Recent cities functionality
    loadRecentCities() {
        try {
            const cities = localStorage.getItem('recentCities');
            return cities ? JSON.parse(cities) : [];
        } catch (error) {
            console.error('Error loading recent cities:', error);
            return [];
        }
    }

    saveRecentCities() {
        try {
            localStorage.setItem('recentCities', JSON.stringify(this.recentCities));
        } catch (error) {
            console.error('Error saving recent cities:', error);
        }
    }

    addToRecentCities(city) {
        const formattedCity = this.formatCityName(city);
        
        // Remove if already exists
        this.recentCities = this.recentCities.filter(c => c.toLowerCase() !== formattedCity.toLowerCase());
        
        // Add to beginning
        this.recentCities.unshift(formattedCity);
        
        // Keep only last 8 cities
        this.recentCities = this.recentCities.slice(0, 8);
        
        this.saveRecentCities();
        this.displayRecentCities();
    }

    displayRecentCities() {
        if (this.recentCities.length === 0) {
            this.recentSearches.style.display = 'none';
            return;
        }

        const citiesHtml = this.recentCities.map(city => `
            <span class="recent-city" onclick="weatherApp.searchRecentCity('${city}')">${city}</span>
        `).join('');

        this.recentCities.innerHTML = citiesHtml;
        this.recentSearches.style.display = 'block';
    }

    searchRecentCity(city) {
        this.cityInput.value = city;
        this.searchWeather();
    }

    formatCityName(city) {
        // Capitalize first letter of each word
        return city.split(' ')
                  .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                  .join(' ');
    }

    // UI state management
    showLoading() {
        this.loadingSpinner.style.display = 'block';
        this.weatherResult.style.display = 'none';
        this.hideError();
        this.searchBtn.disabled = true;
        this.searchBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    }

    hideLoading() {
        this.loadingSpinner.style.display = 'none';
        this.searchBtn.disabled = false;
        this.searchBtn.innerHTML = '<i class="fas fa-search"></i>';
    }

    showError(message) {
        this.errorMessage.textContent = message;
        this.errorMessage.style.display = 'block';
        this.weatherResult.style.display = 'none';
        
        // Auto-hide error after 5 seconds
        setTimeout(() => {
            this.hideError();
        }, 5000);
    }

    hideError() {
        this.errorMessage.style.display = 'none';
    }

    showWelcomeMessage() {
        // Show a subtle welcome hint if no recent cities
        if (this.recentCities.length === 0) {
            setTimeout(() => {
                if (this.cityInput.value === '') {
                    this.cityInput.placeholder = 'Try searching for your city... (e.g., London, New York, Tokyo)';
                }
            }, 2000);
        }
    }

    // Utility methods
    getLocationWeather() {
        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    // This could be enhanced to get weather by coordinates
                    // For now, we'll just focus the input
                    this.cityInput.focus();
                },
                (error) => {
                    console.log('Location access denied or unavailable');
                    this.cityInput.focus();
                }
            );
        }
    }
}

// Initialize the app when DOM is loaded
let weatherApp;

document.addEventListener('DOMContentLoaded', () => {
    weatherApp = new WeatherApp();
    
    // Add some keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Ctrl/Cmd + K to focus search
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            weatherApp.cityInput.focus();
            weatherApp.cityInput.select();
        }
        
        // Escape to clear search
        if (e.key === 'Escape') {
            weatherApp.cityInput.value = '';
            weatherApp.cityInput.focus();
            weatherApp.hideError();
        }
    });
});

// Handle online/offline status
window.addEventListener('online', () => {
    console.log('Connection restored');
});

window.addEventListener('offline', () => {
    weatherApp.showError('You are currently offline. Please check your internet connection.');
});