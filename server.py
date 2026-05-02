#!/usr/bin/env python3
"""
Étude — local dev server with a YouTube extraction proxy.

Replaces `python -m http.server` for local dev. It does two things:

  1. GET on any path  → serves the static files (same as http.server)
  2. POST /api/yt-extract  body: {"url": "..."}
     Runs yt-dlp to extract the audio of the given YouTube URL as MP3
     and streams the result back. The web UI calls this and pipes the
     blob into the basic-pitch transcriber.

Requirements: yt-dlp + ffmpeg installed (e.g. `brew install yt-dlp ffmpeg`).

Run:
    python3 server.py            # port 8000
    python3 server.py 9000       # custom port
"""
import http.server
import json
import os
import shutil
import socketserver
import subprocess
import sys
import tempfile


PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
ROOT = os.path.dirname(os.path.abspath(__file__))


class EtudeHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()

    def do_POST(self):
        if self.path != '/api/yt-extract':
            self.send_error(404, 'Not found')
            return

        if not shutil.which('yt-dlp'):
            self.send_error(500, 'yt-dlp not installed (brew install yt-dlp)')
            return

        try:
            length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(length)
            data = json.loads(body or b'{}')
            url = (data.get('url') or '').strip()
        except Exception as e:
            self.send_error(400, f'Bad request: {e}')
            return

        if not url:
            self.send_error(400, 'Missing "url" field')
            return

        # Sanity check : only http(s) URLs.
        if not (url.startswith('http://') or url.startswith('https://')):
            self.send_error(400, 'URL must start with http(s)://')
            return

        with tempfile.TemporaryDirectory() as td:
            out_template = os.path.join(td, '%(title).80s.%(ext)s')
            cmd = [
                'yt-dlp',
                '-x', '--audio-format', 'mp3',
                '--no-playlist',
                '--no-warnings',
                '--restrict-filenames',
                '-o', out_template,
                url,
            ]
            print(f'[yt-extract] {url}')
            try:
                result = subprocess.run(
                    cmd, capture_output=True, text=True, timeout=240
                )
            except subprocess.TimeoutExpired:
                self.send_error(504, 'yt-dlp timeout (>4 min)')
                return

            if result.returncode != 0:
                msg = (result.stderr or result.stdout or '').strip()[-400:]
                print(f'[yt-extract] FAIL: {msg}')
                self.send_error(500, f'yt-dlp failed: {msg}')
                return

            mp3s = sorted(f for f in os.listdir(td) if f.lower().endswith('.mp3'))
            if not mp3s:
                self.send_error(500, 'No mp3 produced (check yt-dlp install)')
                return

            mp3_path = os.path.join(td, mp3s[0])
            with open(mp3_path, 'rb') as f:
                blob = f.read()

            print(f'[yt-extract] OK: {mp3s[0]} ({len(blob)//1024} KB)')

            self.send_response(200)
            self.send_header('Content-Type', 'audio/mpeg')
            self.send_header('Content-Length', str(len(blob)))
            self.send_header(
                'Content-Disposition',
                f'attachment; filename="{mp3s[0]}"',
            )
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(blob)


class ReusableServer(socketserver.ThreadingMixIn, http.server.HTTPServer):
    allow_reuse_address = True
    daemon_threads = True


if __name__ == '__main__':
    print(f'Étude — http://localhost:{PORT}')
    print('  GET  /                  → static files')
    print('  POST /api/yt-extract    body: {"url": "..."}  → mp3')
    print('Ctrl+C pour arrêter.\n')
    try:
        with ReusableServer(('', PORT), EtudeHandler) as httpd:
            httpd.serve_forever()
    except KeyboardInterrupt:
        print('\nbye')
