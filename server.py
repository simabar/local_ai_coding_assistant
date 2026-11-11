"""
The bridge between the website and assistant.py.

A browser can't run Python, so this tiny server does it for the page:

    GET  /             -> serves index.html, style.css, script.js
    GET  /api/status   -> is Ollama running? which model?
    POST /api/analyze  -> calls analyze_code() from assistant.py

Run it from the project folder:   python web/server.py
Then open:                        http://localhost:5050

Only the Python standard library is used (plus the ollama package you
already installed for assistant.py).
"""

import json
import sys
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

WEB_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(WEB_DIR.parent))      # so we can import assistant.py

import ollama                                # noqa: E402
from assistant import MODEL, analyze_code    # noqa: E402

PORT = 5050


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(WEB_DIR), **kwargs)

    def send_json(self, data, status=200):
        body = json.dumps(data).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        if self.path == "/api/status":
            try:
                ollama.list()
                online = True
            except Exception:
                online = False
            return self.send_json({"ollama": online, "model": MODEL})
        if self.path.endswith(".py"):        # don't serve this file's source
            return self.send_error(404)
        super().do_GET()

    def do_POST(self):
        if self.path != "/api/analyze":
            return self.send_error(404)
        try:
            length = int(self.headers.get("Content-Length", 0))
            data = json.loads(self.rfile.read(length))
            code = data.get("code", "").strip()
            question = data.get("question", "").strip() or "Find the bug."
            if not code:
                return self.send_json({"error": "No code received."}, 400)

            print(f"→ analyzing {len(code)} characters with {MODEL} …")
            answer = analyze_code(code, question)   # <- your assistant.py
            self.send_json({"answer": answer})
        except Exception as error:
            self.send_json({"error": str(error)}, 500)


if __name__ == "__main__":
    print(f"Bug Scanner running on http://localhost:{PORT}  (Ctrl+C to stop)")
    ThreadingHTTPServer(("127.0.0.1", PORT), Handler).serve_forever()
