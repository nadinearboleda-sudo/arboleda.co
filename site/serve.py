#!/usr/bin/env python3
"""Local preview server with clean-URL support (mimics Netlify/Vercel).
Run:  python3 serve.py   then open http://localhost:8000
"""
import http.server
import os

class CleanURLHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Dev server: never let the browser cache JS/CSS between edits
        self.send_header('Cache-Control', 'no-store, must-revalidate')
        super().end_headers()

    def translate_path(self, path):
        p = super().translate_path(path)
        # /alchemy -> alchemy.html (if no extension and the .html file exists)
        if not os.path.exists(p) and not os.path.splitext(p)[1]:
            candidate = p.rstrip('/') + '.html'
            if os.path.exists(candidate):
                return candidate
        return p

if __name__ == '__main__':
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    print('Serving at http://localhost:8000  (Ctrl+C to stop)')
    http.server.ThreadingHTTPServer(('', 8000), CleanURLHandler).serve_forever()
