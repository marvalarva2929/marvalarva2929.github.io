#!/usr/bin/env python3
"""Dev server: serves the site and saves in-page edits/comments to dev/notes.json.
Run from the repo root:  python3 dev/server.py   then open http://localhost:8000
"""
import json, os
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
NOTES = os.path.join(ROOT, "dev", "notes.json")

def load():
    return json.load(open(NOTES)) if os.path.exists(NOTES) else []

class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *a, **k):
        super().__init__(*a, directory=ROOT, **k)

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def do_GET(self):
        if self.path == "/__notes":
            return self.reply(load())
        super().do_GET()

    def do_POST(self):
        if self.path != "/__notes":
            return self.send_error(404)
        note = json.loads(self.rfile.read(int(self.headers["Content-Length"])))
        notes = load()
        note["id"] = max([n["id"] for n in notes], default=0) + 1
        note["status"] = "open"
        notes.append(note)
        json.dump(notes, open(NOTES, "w"), indent=2, ensure_ascii=False)
        self.reply(note)

    def reply(self, data):
        body = json.dumps(data).encode()
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(body)

print("Serving on http://localhost:8000  (notes → dev/notes.json)")
ThreadingHTTPServer(("127.0.0.1", 8000), Handler).serve_forever()
