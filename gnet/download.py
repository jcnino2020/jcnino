import shutil
import os

assets_dir = "/Users/jcnino/Documents/jcnino/gnet/assets"

try:
    shutil.copy(
        os.path.join(assets_dir, "package-251016-caf1d10728.png"),
        os.path.join(assets_dir, "slide-240926-def85de167.png")
    )
    shutil.copy(
        os.path.join(assets_dir, "marker_green.png"),
        os.path.join(assets_dir, "marker_red.png")
    )
    shutil.copy(
        os.path.join(assets_dir, "marker_green.png"),
        os.path.join(assets_dir, "marker_blue.png")
    )
    print("Local fallback assets copied successfully!")
except Exception as e:
    print(f"Error copying assets: {e}")
