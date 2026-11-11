# Local AI Coding Assistant 🤖

A lightweight, locally running AI coding assistant built with **Python**, **Ollama**, and **Qwen3:4B**.

The project demonstrates how to run an open-source Large Language Model (LLM) locally and use it to analyse Python code, identify bugs, explain errors, and suggest improvements.

No cloud API or API key is required.

## Features

- Run an open-source LLM locally.
- Analyse Python source code.
- Identify potential bugs and explain their causes.
- Suggest corrected code and improvements.
- Interact with the model through a Python application.

## Technologies

| Technology | Purpose |
|---|---|
| Python | Main programming language |
| Ollama | Local LLM runtime |
| Qwen3:4B | Open-source language model |
| VS Code | Development environment |

## Requirements

- Ubuntu Linux (or another supported operating system)
- Python 3
- Ollama
- Approximately 3 GB of disk space for the model, plus additional space for dependencies

## Installation

### 1. Install Ollama

Install Ollama using:

```bash
curl -fsSL https://ollama.com/install.sh | sh
```

### 2. Download the model

```bash
ollama pull qwen3:4b
```

### 3. Clone the repository

```bash
git clone <YOUR_REPOSITORY_URL>
cd local_ai_coding_assistant
```

Alternatively, navigate to your existing project directory.

### 4. Create a virtual environment

```bash
python3 -m venv .code_assistant
source .code_assistant/bin/activate
```

### 5. Install dependencies

```bash
pip install ollama
```

## Usage

Make sure the Ollama service is running.

Check the installed models:

```bash
ollama list
```

Run the coding assistant:

```bash
python assistant.py buggy.py
```

The assistant will ask what you want to analyse.

For example:

```text
Find the bug, explain why it happens and provide a corrected version.
```

The model will analyse the contents of `buggy.py` and return its response.

## Example

Consider the following Python code:

```python
def calculate_average(numbers):
    return sum(numbers) / len(number)

print(calculate_average([2, 4, 6]))
```

There is a bug in the function: `number` is undefined. It should be `numbers`.

The coding assistant can identify this error, explain the resulting `NameError`, and suggest a correction.

## Hardware Considerations

This project runs the language model locally using CPU inference.

Performance depends on the available hardware, especially:

- CPU performance and number of cores
- Available RAM
- Model size and quantization
- Context window size

Larger language models generally require more computational resources.

## Project Goal

The goal is to explore locally running open-source LLMs and demonstrate how they can be integrated into everyday programming workflows.

This project is part of an exploration of local AI tools and AI-assisted software development.

## License

This project is intended for educational and experimental purposes.
