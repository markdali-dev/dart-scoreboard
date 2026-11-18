"""Local web server for trying the app.

On this PC only:            python serve.py
Then open:                  http://localhost:8000

On a phone on the same Wi-Fi:   python serve.py --lan
It prints an address like http://192.168.1.23:8000 to type into the phone's browser.
Windows may ask whether to allow Python through the firewall: allow it on
"Private networks" only. Stop with Ctrl+C when done; nothing is shared after that.

Why not just double-click index.html? Browsers block JavaScript modules and
offline support (service workers) on file:// pages. This also forces the
correct file types (Windows sometimes reports .js wrongly) and turns off
caching so edits show up on refresh.
"""

import http.server
import socket
import sys

args = [a for a in sys.argv[1:] if not a.startswith("--")]
LAN = "--lan" in sys.argv
PORT = int(args[0]) if args else 8000


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


def lan_address():
    """This PC's address on the home network (no data is sent anywhere)."""
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(("10.255.255.255", 1))  # picks the network card; sends nothing
        return s.getsockname()[0]
    except OSError:
        return "this-PC's-IP-address"
    finally:
        s.close()


if __name__ == "__main__":
    host = "0.0.0.0" if LAN else "127.0.0.1"
    with http.server.ThreadingHTTPServer((host, PORT), Handler) as server:
        print(f"Dart Scoreboard running at http://localhost:{PORT}  (Ctrl+C to stop)")
        if LAN:
            print(f"On your phone (same Wi-Fi), open:  http://{lan_address()}:{PORT}")
            print("Note: offline mode and home-screen install need https, so they only work after GitHub Pages.")
        server.serve_forever()
