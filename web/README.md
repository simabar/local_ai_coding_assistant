# Bug Scanner 🐞

A website for the Local AI Coding Assistant.
Paste Python code, press **Scan for bugs**, and the local model explains the bug and suggests a fix.

No cloud, no API key: everything runs on this laptop.

## How it works

```
Browser  →  server.py  →  assistant.py  →  Ollama (localhost:11434)  →  Qwen3
```

A browser can't run Python, so `server.py` acts as a small bridge.
It serves the page and calls `analyze_code()` from `assistant.py`, so the website and the command-line tool use the same model and system prompt.

| File | What it does |
|---|---|
| `index.html` | The page: scanner, how-it-works tiles, run instructions |
| `style.css` | The poster-style design |
| `script.js` | Sends the code to the bridge and shows the answer |
| `server.py` | Serves the page and calls `assistant.py` |

## Run it

From the project folder (the one with `assistant.py`):

```bash
ollama pull qwen3:4b
source .code_assistant/bin/activate
python web/server.py
```

Open http://localhost:5050.

`server.py` only needs Python's standard library and the `ollama` package you already installed.

## Check that it really uses Ollama

There is no demo mode: if Ollama doesn't answer, the page shows an error.

- **Server terminal:** each scan prints `→ analyzing … with qwen3:4b`.
- **Ollama log:** `journalctl -u ollama -f` shows `POST "/api/chat"` for each scan.
- **Model in memory:** `ollama ps` lists `qwen3:4b` running on `100% CPU`.
- **Switch it off:** `sudo systemctl stop ollama` turns the status light red and makes scans fail. Start it again with `sudo systemctl start ollama`.
- **Offline:** with Wi-Fi off, scans still work. Only the headline font falls back to a plainer one.

## Notes

- The timer on the page shows how long each answer takes, which is useful for benchmarking.
- The headline fonts (Anton, Fraunces) load from Google Fonts. Offline, the page uses fonts already on your laptop.
