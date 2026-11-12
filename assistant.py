import sys 
from pathlib import Path 
from ollama import chat

MODEL = "qwen3:4b"
def analyze_code(code, question):
    stream = chat(
        model=MODEL,
        stream=True,
        think=True,
        messages=[
            {
                "role": "system",
                "content": """ 
               You are an experienced Python developer. Analyze the provided code carefully. Find bugs, explain why they happen and suggest improvements. Do not invent errors."""
            },
            {
                "role": "user",
                "content": f"""
                Here is my Python code:

                {code}

                My question:
                {question}
                """
            }
        ]
    )

    in_thinking = False

    for chunk in stream:
        thinking_piece = getattr(chunk.message, "thinking", None)
        content_piece = chunk.message.content

        if thinking_piece:
            if not in_thinking:
                print("--- AI Thinking Process ---")
                in_thinking = True
            print(thinking_piece, end="", flush=True)

        elif content_piece:
            if in_thinking:
                print("\n\n--- Final Answer ---")
                in_thinking = False
            print(content_piece, end="", flush=True)

    print()


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

    print("\nAnalyzing your code...\n")

    answer = analyze_code(code, question)

    print(answer)


if __name__ == "__main__":
    main()
