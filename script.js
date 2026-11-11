const files = {
  assistant: `import sys
from pathlib import Path
from ollama import chat

MODEL = "qwen3:1.7b"

def analyze_code(code, question):
    response = chat(
        model=MODEL,
        messages=[
            {
                "role": "system",
                "content": """You are an experienced Python developer. Analyze
the provided code carefully. Find bugs, explain why they happen
and suggest improvements. Do not invent errors."""
            },
            {
                "role": "user",
                "content": f"Here is my Python code:\\n{code}\\nMy question:\\n{question}"
            }
        ]
    )
    return response.message.content

def main():
    if len(sys.argv) != 2:
        print("Usage: python assistant.py <python_file>")
        return
    file_path = Path(sys.argv[1])
    if not file_path.is_file():
        print("File not found!")
        return
    code = file_path.read_text(encoding="utf-8")
    question = input("What should I analyze? ")
    print("\\nAnalyzing your code...\\n")
    print(analyze_code(code, question))

if __name__ == "__main__":
    main()`,
  buggy: `def calculate_average(numbers):
    return sum(numbers) / len(number)

print(calculate_average([2, 4, 6]))`
};

const presets = {
  buggy: files.buggy,
  zero: `def get_Wait_Time(tasks):
    return sum(tasks) / len(tasks)

print(get_Wait_Time([]))`
};

// Navigation Tabs
document.querySelectorAll(".tab-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById(`tab-${btn.dataset.tab}`).classList.add("active");
  });
});

// Architecture Interactive Stack
document.querySelectorAll(".arch-node").forEach(node => {
  node.addEventListener("click", () => {
    document.querySelectorAll(".arch-node").forEach(n => n.classList.remove("active"));
    node.classList.add("active");
    document.getElementById("arch-detail").textContent = node.dataset.info;
  });
});

// Code File Switcher
const codeDisplay = document.getElementById("file-code-display");
codeDisplay.textContent = files.assistant;

document.querySelectorAll(".file-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".file-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    codeDisplay.textContent = files[btn.dataset.file];
  });
});

// Workbench Presets
const codeInput = document.getElementById("code-input");
codeInput.value = presets.buggy;

document.querySelectorAll(".preset-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    codeInput.value = presets[btn.dataset.preset];
  });
});

// Check if Local Ollama is reachable
let ollamaOnline = false;
async function checkOllamaStatus() {
  const dot = document.getElementById("ollama-dot");
  const title = document.getElementById("ollama-status-title");
  const sub = document.getElementById("ollama-status-sub");
  try {
    const res = await fetch("http://localhost:11434/api/tags");
    if (res.ok) {
      ollamaOnline = true;
      dot.classList.add("online");
      title.textContent = "Local Ollama Active (127.0.0.1:11434)";
      sub.textContent = "Connected to local Qwen3 1.7B engine";
      return;
    }
  } catch (e) {
    ollamaOnline = false;
  }
  title.textContent = "Presentation Demo Mode";
  sub.textContent = "Using recorded Qwen3 1.7B response (local server offline)";
}
checkOllamaStatus();

// Run Analysis
document.getElementById("run-btn").addEventListener("click", async () => {
  const outputBox = document.getElementById("ai-output");
  const code = codeInput.value;
  const question = document.getElementById("prompt-input").value;
  outputBox.textContent = "Analyzing code with Qwen3 1.7B...\n";

  if (ollamaOnline) {
    try {
      const res = await fetch("http://localhost:11434/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "qwen3:1.7b",
          stream: false,
          messages: [
            {
              role: "system",
              content: "You are an experienced Python developer. Analyze the provided code carefully. Find bugs, explain why they happen and suggest improvements. Do not invent errors."
            },
            {
              role: "user",
              content: `Here is my Python code:\n${code}\nMy question:\n${question}`
            }
          ]
        })
      });
      const data = await res.json();
      outputBox.textContent = data.message.content;
      return;
    } catch (err) {
      outputBox.textContent = "Local connection interrupted. Showing recorded Qwen3 1.7B analysis:\n\n";
    }
  }

  // Fallback simulation for GitHub Pages / offline demo
  setTimeout(() => {
    if (code.includes("len(number)")) {
      outputBox.textContent = `[Qwen3 1.7B Local Analysis]\n\n1. Bug Identified:\nInside calculate_average(numbers), the return line uses 'len(number)' instead of 'len(numbers)'.\n\n2. Why It Happens:\nThe function parameter is named 'numbers' (plural), so 'number' is undefined in this scope, raising a NameError at runtime.\n\n3. Corrected Version:\ndef calculate_average(numbers):\n    if not numbers:\n        return 0\n    return sum(numbers) / len(numbers)\n\nprint(calculate_average([2, 4, 6]))  # Output: 4.0`;
    } else {
      outputBox.textContent = `[Qwen3 1.7B Local Analysis]\n\n1. Bug Identified:\nPassing an empty list [] causes 'len(tasks)' to evaluate to 0, raising a ZeroDivisionError.\n\n2. Corrected Version:\ndef get_wait_time(tasks):\n    if not tasks:\n        return 0.0\n    return sum(tasks) / len(tasks)`;
    }
  }, 600);
});
