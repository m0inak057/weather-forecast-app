#!/usr/bin/env python3
"""
Local development server for Weather Forecast App
Loads environment variables from .env file and serves the API locally
"""

import os
import sys
from http.server import HTTPServer, SimpleHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
import json
import threading

# Add the current directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Load environment variables from .env file
try:
    with open('.env', 'r') as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                key, value = line.split('=', 1)
                os.environ[key.strip()] = value.strip()
    print("✅ Environment variables loaded from .env file")
except FileNotFoundError:
    print("⚠️  .env file not found. Please create one with your OPENWEATHER_API_KEY")
    sys.exit(1)

# Import after setting environment variables
from api.weather import handler

class WeatherHandler(SimpleHTTPRequestHandler):
    def do_GET(self):
        parsed_path = urlparse(self.path)
        
        if parsed_path.path.startswith('/api/weather'):
            # Handle API request
            self.handle_api_request(parsed_path)
        else:
            # Serve static files
            if parsed_path.path == '/':
                self.path = '/public/index.html'
            elif not parsed_path.path.startswith('/public/'):
                self.path = '/public' + parsed_path.path
            
            super().do_GET()
    
    def handle_api_request(self, parsed_path):
        try:
            # Create request object for the handler
            request = {
                'method': 'GET',
                'query': parsed_path.query
            }
            
            # Call the weather handler
            response = handler(request)
            
            # Send response
            self.send_response(response['statusCode'])
            
            # Send headers
            for key, value in response['headers'].items():
                self.send_header(key, value)
            self.end_headers()
            
            # Send body
            if response['body']:
                self.wfile.write(response['body'].encode('utf-8'))
                
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            error_response = json.dumps({'error': str(e)})
            self.wfile.write(error_response.encode('utf-8'))

def run_server(port=8000):
    server_address = ('', port)
    httpd = HTTPServer(server_address, WeatherHandler)
    
    print(f"🌤️  Weather Forecast App running on http://localhost:{port}")
    print("📂 Serving files from ./public/")
    print("🔑 API endpoint: /api/weather")
    print("\n🛑 Press Ctrl+C to stop the server\n")
    
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n👋 Server stopped.")
        httpd.server_close()

if __name__ == '__main__':
    # Check if API key is set
    if not os.environ.get('OPENWEATHER_API_KEY'):
        print("❌ OPENWEATHER_API_KEY not found in environment variables")
        print("Please add your API key to the .env file")
        sys.exit(1)
    
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
    run_server(port)