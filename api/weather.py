import json
import requests
import os
from urllib.parse import parse_qs

def handler(request):
    """
    Vercel serverless function handler for weather API requests.
    Supports both current weather and 5-day forecast.
    """
    # Handle CORS
    headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
    }
    
    # Handle preflight requests
    if request.get('method') == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': headers,
            'body': ''
        }
    
    try:
        # Get API key from environment variable
        api_key = os.environ.get('OPENWEATHER_API_KEY')
        if not api_key:
            return {
                'statusCode': 500,
                'headers': headers,
                'body': json.dumps({'error': 'API key not configured'})
            }
        
        # Parse query parameters
        query = request.get('query', '')
        params = parse_qs(query)
        
        city = params.get('city', [''])[0]
        weather_type = params.get('type', ['current'])[0]
        
        if not city:
            return {
                'statusCode': 400,
                'headers': headers,
                'body': json.dumps({'error': 'City parameter is required'})
            }
        
        if weather_type == 'forecast':
            data = get_weather_forecast(city, api_key)
        else:
            data = get_current_weather(city, api_key)

        # If helper returned an error dict, propagate its status and message
        if isinstance(data, dict) and 'error' in data:
            return {
                'statusCode': int(data.get('status', 500)),
                'headers': headers,
                'body': json.dumps({'error': data['error']})
            }

        if data:
            return {
                'statusCode': 200,
                'headers': headers,
                'body': json.dumps(data)
            }
        else:
            return {
                'statusCode': 404,
                'headers': headers,
                'body': json.dumps({'error': 'City not found or API request failed'})
            }
            
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({'error': str(e)})
        }

def get_current_weather(city_name, api_key):
    """Get current weather data for a city."""
    base_url = "https://api.openweathermap.org/data/2.5/weather"
    params = {
        'q': city_name,
        'appid': api_key,
        'units': 'metric',
    }

    try:
        response = requests.get(base_url, params=params, timeout=10)

        if response.status_code == 200:
            data = response.json()
            main = data['main']
            weather = data['weather'][0]
            sys = data['sys']

            return {
                'type': 'current',
                'city': data['name'],
                'country': sys['country'],
                'temperature': main['temp'],
                'feels_like': main['feels_like'],
                'humidity': main['humidity'],
                'pressure': main['pressure'],
                'description': weather['description'].capitalize(),
                'icon': weather['icon'],
                'wind_speed': data.get('wind', {}).get('speed', 0),
                'visibility': data.get('visibility', 0) / 1000  # Convert to km
            }
        else:
            # Try to extract a helpful message from OpenWeather response
            try:
                err = response.json()
                message = err.get('message') or 'Upstream service error'
            except Exception:
                message = 'Upstream service error'

            # Map common upstream errors to meaningful HTTP statuses
            status = response.status_code
            if status == 401:
                message = 'Invalid or missing API key'
            elif status == 404:
                message = 'City not found'
            elif status == 429:
                message = 'Rate limit exceeded. Please try again later.'

            return {
                'error': message,
                'status': status
            }
    except requests.RequestException as e:
        # Network/timeout errors
        return {
            'error': f'Network error contacting weather service: {str(e)}',
            'status': 502
        }
    except KeyError as e:
        return {
            'error': f'Data parsing error: {str(e)}',
            'status': 502
        }

def get_weather_forecast(city_name, api_key):
    """Get 5-day weather forecast for a city."""
    base_url = "https://api.openweathermap.org/data/2.5/forecast"
    params = {
        'q': city_name,
        'appid': api_key,
        'units': 'metric',
    }

    try:
        response = requests.get(base_url, params=params, timeout=10)

        if response.status_code == 200:
            data = response.json()
            city = data['city']

            forecasts = []
            # Get forecast for next 5 days (every ~24 hours => every 8th item at 3-hour intervals)
            for i in range(0, min(40, len(data['list'])), 8):
                forecast = data['list'][i]
                main = forecast['main']
                weather = forecast['weather'][0]

                forecasts.append({
                    'date': forecast['dt_txt'].split(' ')[0],
                    'temperature': main['temp'],
                    'feels_like': main['feels_like'],
                    'humidity': main['humidity'],
                    'pressure': main['pressure'],
                    'description': weather['description'].capitalize(),
                    'icon': weather['icon'],
                    'wind_speed': forecast.get('wind', {}).get('speed', 0)
                })

            return {
                'type': 'forecast',
                'city': city['name'],
                'country': city['country'],
                'forecasts': forecasts
            }
        else:
            # Try to extract a helpful message from OpenWeather response
            try:
                err = response.json()
                message = err.get('message') or 'Upstream service error'
            except Exception:
                message = 'Upstream service error'

            status = response.status_code
            if status == 401:
                message = 'Invalid or missing API key'
            elif status == 404:
                message = 'City not found'
            elif status == 429:
                message = 'Rate limit exceeded. Please try again later.'

            return {
                'error': message,
                'status': status
            }
    except requests.RequestException as e:
        return {
            'error': f'Network error contacting weather service: {str(e)}',
            'status': 502
        }
    except KeyError as e:
        return {
            'error': f'Data parsing error: {str(e)}',
            'status': 502
        }
