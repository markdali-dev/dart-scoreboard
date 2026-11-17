"""Local web server for trying the app on this PC.

Run from this folder:   python serve.py
Then open:              http://localhost:8000

Why not just double-click index.html? Browsers block JavaScript modules and
offline support (service workers) on file:// pages. This also forces the
correct file types (Windows sometimes reports .js wrongly) and turns off
caching so edits show up on refresh.
"""

import http.server
import sys

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8000


class Handler(http.server.SimpleHTTPRequestHandler):
    extensions_map = {
        **http.server.SimpleHTTPRequestHandler.extensions_map,
        ".js": "text/javascript",
        ".mjs": "text/javascript",
        ".css": "text/css",
        ".html": "text/html",
        ".svg": "image/svg+xml",
        ".webmanifest": "application/manifest+json",
        ".json": "application/json",
        ".png": "image/png",
    }

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()


if __name__ == "__main__":
    # Bound to this PC only. Phone testing will use GitHub Pages later.
    with http.server.ThreadingHTTPServer(("127.0.0.1", PORT), Handler) as server:
        print(f"Dart Scoreboard running at http://localhost:{PORT}  (Ctrl+C to stop)")
        server.serve_forever()
