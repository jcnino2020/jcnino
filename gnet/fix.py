import os
import glob

def fix_files():
    # Copy .download files to new names without .download
    for filepath in glob.glob("assets/*.download"):
        new_filepath = filepath.replace(".download", "")
        try:
            with open(filepath, "rb") as fin:
                data = fin.read()
            with open(new_filepath, "wb") as fout:
                fout.write(data)
            print(f"Copied {filepath} to {new_filepath}")
        except Exception as e:
            print(f"Failed to copy {filepath}: {e}")

    # Update references in all HTML/CSS/JS files
    for root, dirs, files in os.walk("."):
        for file in files:
            if file.endswith((".html", ".css", ".js")) and file != "fix.py":
                filepath = os.path.join(root, file)
                try:
                    with open(filepath, "r", encoding="utf-8") as f:
                        content = f.read()
                    if ".download" in content:
                        new_content = content.replace(".download", "")
                        with open(filepath, "w", encoding="utf-8") as f:
                            f.write(new_content)
                        print(f"Updated references in {filepath}")
                except Exception as e:
                    print(f"Error updating {filepath}: {e}")

if __name__ == "__main__":
    fix_files()
