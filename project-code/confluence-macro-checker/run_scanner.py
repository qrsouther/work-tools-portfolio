#!/usr/bin/env python3
"""
Simple HTTP server to run the Confluence Scanner HTML page.
This avoids cross-origin restrictions that occur when opening HTML files directly.
"""

import http.server
import socketserver
import webbrowser
import os

PORT = 8000

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Add CORS headers
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

# Change to the directory containing this script
os.chdir(os.path.dirname(os.path.abspath(__file__)))

print("=" * 60)
print("Confluence Blueprint Macro Scanner")
print("=" * 60)
print(f"\nStarting server on http://localhost:{PORT}")
print("\nThe scanner page will open in your browser automatically.")
print("Make sure you're logged into Confluence in your browser first!")
print("\nPress Ctrl+C to stop the server when done.\n")
print("=" * 60)

# Open browser
webbrowser.open(f'http://localhost:{PORT}/confluence-scanner.html')

# Start server
with socketserver.TCPServer(("", PORT), MyHTTPRequestHandler) as httpd:
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n\n✓ Server stopped. Goodbye!")
