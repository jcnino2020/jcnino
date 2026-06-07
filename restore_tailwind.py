import subprocess
import os

try:
    result = subprocess.run(["git", "show", "f8bda1c:assets/tailwind.css"], capture_output=True, text=True, check=True)
    with open("assets/tailwind.css", "w") as f:
        f.write(result.stdout)
    print("Successfully restored assets/tailwind.css from git history!")
except Exception as e:
    print(f"Error restoring tailwind.css: {e}")
