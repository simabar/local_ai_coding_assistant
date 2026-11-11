// ===== Bug Scanner — talks to server.py, which calls your assistant.py =====

// ---------- Example bugs (the chips above the editor) ----------
const PRESETS = {
  name: `def calculate_average(numbers):
    return sum(numbers) / len(number)

print(calculate_average([2, 4, 6]))`,

  zero: `def average_wait(times):
    return sum(times) / len(times)

print(average_wait([]))`,

  default: `def add_task(task, todo=[]):
    todo.append(task)
    return todo

print(add_task("write code"))
print(add_task("drink coffee"))  # why are there two tasks?`,
};

// Little messages to show while the (slow, CPU-only) model is working
const WAITING_LINES = [
  "Waking up the model…",
  "Reading your code line by line…",
  "Checking variable names…",
  "Thinking about edge cases…",
  "Writing the fix…",
  "Still thinking. A laptop CPU is not a datacenter. ☕",
];

// ---------- Grab the page elements ----------
const $ = (id) => document.getElementById(id);
const codeBox  = $("code");
const gutter   = $("gutter");
const editor   = $("editor");
const scanBtn  = $("scan-btn");
const timerEl  = $("timer");
const nodes    = document.querySelectorAll(".node");

// ---------- Editor: line numbers ----------
function updateGutter() {
  const lines = codeBox.value.split("\n").length;
  gutter.textContent = Array.from({ length: lines }, (_, i) => i + 1).join("\n");
}
codeBox.addEventListener("input", updateGutter);
codeBox.addEventListener("scroll", () => (gutter.scrollTop = codeBox.scrollTop));

// Let the Tab key insert 4 spaces instead of leaving the box
codeBox.addEventListener("keydown", (e) => {
  if (e.key === "Tab") {
    e.preventDefault();
    codeBox.setRangeText("    ", codeBox.selectionStart, codeBox.selectionEnd, "end");
    updateGutter();
  }
});

// ---------- Preset chips ----------
document.querySelectorAll(".chip").forEach((chip) => {
  chip.addEventListener("click", () => {
    document.querySelectorAll(".chip").forEach((c) => c.classList.remove("active"));
    chip.classList.add("active");
    codeBox.value = PRESETS[chip.dataset.preset];
    updateGutter();
  });
});

// Start with buggy.py loaded
document.querySelector('[data-preset="name"]').click();

// ---------- Is the assistant running? ----------
async function checkStatus() {
  const status = $("status");
  try {
    const res = await fetch("/api/status");
    const data = await res.json();
    $("model-chip").textContent = data.model;
    $("node-model").textContent = data.model;
    status.className = "status " + (data.ollama ? "online" : "offline");
    $("status-text").textContent = data.ollama
      ? "Assistant online"
      : "Bridge running, but Ollama is off";
  } catch {
    status.className = "status offline";
    $("status-text").textContent = "Start it with: python web/server.py";
  }
}
checkStatus();

// ---------- Pipeline animation (Browser → … → Qwen3) ----------
let pipelineTimer;
function runPipeline() {
  let step = 0;
  nodes.forEach((n) => n.classList.remove("lit", "done"));
  pipelineTimer = setInterval(() => {
    nodes.forEach((n, i) => n.classList.toggle("lit", i === step % nodes.length));
    step++;
  }, 450);
}
function stopPipeline(success) {
  clearInterval(pipelineTimer);
  nodes.forEach((n) => {
    n.classList.remove("lit");
    n.classList.toggle("done", success);
  });
}

// ---------- Show / hide parts of the diagnosis panel ----------
function show(state) {
  $("empty").classList.toggle("hidden", state !== "empty");
  $("thinking").classList.toggle("hidden", state !== "thinking");
  $("answer").classList.toggle("hidden", state !== "answer");
  if (state !== "answer") $("thoughts").classList.add("hidden");
}

// ---------- The main action: scan the code ----------
async function scan() {
  const code = codeBox.value.trim();
  if (!code) return;

  // 1. Put the page into "working" mode
  scanBtn.disabled = true;
  editor.classList.add("scanning");
  timerEl.classList.add("running");
  show("thinking");
  runPipeline();

  const started = performance.now();
  let lineIndex = 0;
  const clock = setInterval(() => {
    const seconds = (performance.now() - started) / 1000;
    timerEl.textContent = seconds.toFixed(1) + " s";
    if (seconds > (lineIndex + 1) * 6 && lineIndex < WAITING_LINES.length - 1) lineIndex++;
    $("thinking-text").textContent = WAITING_LINES[lineIndex];
  }, 100);

  // 2. Send the code to server.py → assistant.analyze_code()
  let ok = false;
  try {
    const res = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, question: $("question").value }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Something went wrong");
    showAnswer(data.answer);
    ok = true;
  } catch (err) {
    $("answer").className = "answer error";
    $("answer").textContent = "⚠ " + err.message +
      "\n\nIs Ollama running? Try `ollama ps` in a terminal.";
    show("answer");
  }

  // 3. Back to normal
  clearInterval(clock);
  stopPipeline(ok);
  scanBtn.disabled = false;
  editor.classList.remove("scanning");
  timerEl.classList.remove("running");
}

scanBtn.addEventListener("click", scan);
document.addEventListener("keydown", (e) => {
  if (e.ctrlKey && e.key === "Enter") scan();
});

// ---------- "Copy" buttons on the Run-it slide ----------
document.querySelectorAll(".copy").forEach((btn) => {
  btn.addEventListener("click", async () => {
    const command = btn.parentElement.querySelector("code").textContent;
    try {
      await navigator.clipboard.writeText(command);
      btn.textContent = "Copied!";
    } catch {
      btn.textContent = "Select & copy by hand";
    }
    btn.classList.add("copied");
    setTimeout(() => {
      btn.textContent = "Copy";
      btn.classList.remove("copied");
    }, 1500);
  });
});

// ---------- Turning the model's answer into HTML ----------
function showAnswer(text) {
  // Qwen3 often "thinks out loud" inside <think>…</think>. Split that off.
  const thinkMatch = text.match(/<think>([\s\S]*?)<\/think>/);
  const answer = text.replace(/<think>[\s\S]*?<\/think>/, "").trim();

  if (thinkMatch && thinkMatch[1].trim()) {
    $("thoughts-text").textContent = thinkMatch[1].trim();
    $("thoughts").classList.remove("hidden");
  }

  $("answer").className = "answer";
  $("answer").innerHTML = markdownToHtml(answer);
  show("answer");
}

// A tiny markdown renderer: code blocks, `code`, **bold**, headings, lists.
// We escape everything first so the model can never inject HTML into the page.
function escapeHtml(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function inline(s) {
  return s
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
}

function markdownToHtml(md) {
  const parts = escapeHtml(md).split(/```[a-zA-Z]*\n?/); // even = text, odd = code
  return parts.map((part, i) => {
    if (i % 2 === 1) return `<pre><code>${part.trimEnd()}</code></pre>`;

    // Give every heading its own block, even when text follows on the next line
    part = part.replace(/^(#{1,6}\s.*)$/gm, "\n$1\n");

    return part.split(/\n{2,}/).map((block) => {
      block = block.trim();
      if (!block) return "";
      if (/^#{1,6}\s/.test(block)) return `<h3>${inline(block.replace(/^#+\s*/, ""))}</h3>`;
      if (/^(\s*[-*]|\s*\d+\.)\s/.test(block)) {
        const items = block.split("\n").map((l) =>
          `<li>${inline(l.replace(/^\s*([-*]|\d+\.)\s*/, ""))}</li>`).join("");
        return `<ul>${items}</ul>`;
      }
      return `<p>${inline(block).replace(/\n/g, "<br>")}</p>`;
    }).join("");
  }).join("");
}
