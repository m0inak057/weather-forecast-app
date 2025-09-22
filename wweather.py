#!/usr/bin/env python3
"""
Legacy CLI Weather App
======================

This is the original command-line weather application.

🌐 NEW WEB VERSION AVAILABLE!
-----------------------------
We've created a modern web application with enhanced features:
- Beautiful responsive web interface
- 5-day weather forecasts
- Recent search history
- Mobile-friendly design
- Secure API key handling

To use the web version:
1. Run: vercel dev
2. Open: http://localhost:3000
3. Or deploy to: https://vercel.com

Files for web version:
- public/index.html (Frontend)
- api/weather.py (Backend API)
- vercel.json (Configuration)

🚀 Deploy with: vercel --prod
📖 See README.md for full instructions
"""

import requests

def get_weather(city_name, api_key):
    """Get current weather for a city (CLI version)"""
    base_url = "http://api.openweathermap.org/data/2.5/weather?"
    complete_url = f"{base_url}q={city_name}&appid={api_key}&units=metric"
    
    response = requests.get(complete_url)
    
    if response.status_code == 200:
        data = response.json()
        main = data['main']
        weather = data['weather'][0]
        sys = data['sys']
        
        print(f"📍 City: {data['name']}, {sys['country']}")
        print(f"🌡️ Temperature: {main['temp']}°C")
        print(f"😏 Feels Like: {main['feels_like']}°C")
        print(f"💧 Humidity: {main['humidity']}%")
        print(f"📈 Pressure: {main['pressure']} hPa")
        print(f"🌦️ Weather: {weather['description'].capitalize()}")
    
    else:
        print(" ❌ City Not Found or API request failed.")

def main():
    """Main CLI application"""
    print("🌤️ Weather App (CLI Version)")
    print("💡 Tip: Try the new web version with 'vercel dev'!")
    print("-" * 50)
    
    # WARNING: API key should be in environment variable for security
    # This is kept here for CLI compatibility only
    api_key = "4e4d6cf37036b14f7d2e6f19a068057c"
    city_name = input("Enter city name: ")
    get_weather(city_name, api_key)
    
if __name__ == "__main__":
    main()
