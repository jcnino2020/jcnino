import os
import subprocess
import shutil

def main():
    resolutions = [480, 800, 1200, 1600, 2048]
    src_file = "images/Video Thumbnails/VI-08.jpg"
    
    # Check if source file exists
    if not os.path.exists(src_file):
        print(f"Error: Source file '{src_file}' not found.")
        return

    # Find cwebp path
    cwebp_path = shutil.which("cwebp")
    if not cwebp_path:
        # Check standard Homebrew path on Apple Silicon
        homebrew_cwebp = "/opt/homebrew/bin/cwebp"
        if os.path.exists(homebrew_cwebp):
            cwebp_path = homebrew_cwebp
        else:
            print("Error: 'cwebp' command not found. Please install WebP tools (e.g., 'brew install webp').")
            return

    print(f"Using cwebp: {cwebp_path}")
    print(f"Optimizing '{src_file}' to resolutions: {resolutions}")

    for res in resolutions:
        dest_dir = f"images/optimized/{res}/Video Thumbnails"
        os.makedirs(dest_dir, exist_ok=True)
        dest_file = f"{dest_dir}/VI-08-{res}.webp"
        
        # Scale preserving aspect ratio (height=0)
        cmd = [cwebp_path, "-q", "85", "-resize", str(res), "0", src_file, "-o", dest_file]
        print(f"-> Generating {dest_file}...")
        
        result = subprocess.run(cmd, capture_output=True, text=True)
        if result.returncode != 0:
            print(f"   Error: {result.stderr.strip()}")
        else:
            print(f"   Done: {os.path.getsize(dest_file)} bytes")

if __name__ == "__main__":
    main()
