"""
PNP CRM — Automated FFmpeg Video Combining & Temp Folder Cleanup Engine
Assembles 41 scene clips from _temp_video_build/ into a single portfolio demo video,
places ONLY the final video into final_portfolio_video/, and purges the temp build directory.
"""

import os
import sys
import subprocess
import shutil

# Ensure UTF-8 output on Windows consoles
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
TEMP_DIR = os.path.join(ROOT_DIR, "_temp_video_build")
SCENES_DIR = os.path.join(TEMP_DIR, "scenes")
AUDIO_DIR = os.path.join(TEMP_DIR, "audio")
FINAL_DIR = os.path.join(ROOT_DIR, "final_portfolio_video")
OUTPUT_VIDEO = os.path.join(FINAL_DIR, "PNP_CRM_Portfolio_Demo_FullHD.mp4")

def init_workspace():
    """Initializes temp folder and final output folder structure."""
    os.makedirs(SCENES_DIR, exist_ok=True)
    os.makedirs(AUDIO_DIR, exist_ok=True)
    os.makedirs(FINAL_DIR, exist_ok=True)
    print("[+] Initialized folders:")
    print(f"    Temp Build Folder:   {TEMP_DIR}")
    print(f"    Final Output Folder: {FINAL_DIR}")

def check_scenes():
    """Scans and reports scene clips present in temp folder."""
    init_workspace()
    clips = sorted([f for f in os.listdir(SCENES_DIR) if f.endswith(".mp4") or f.endswith(".mov")])
    print(f"\n[*] Found {len(clips)} / 41 scene clips in {SCENES_DIR}")
    for idx, c in enumerate(clips, 1):
        size = os.path.getsize(os.path.join(SCENES_DIR, c))
        print(f"    [{idx:02d}] {c} ({size // 1024} KB)")
    return clips

def combine_videos(clips):
    """Combines all scene clips into the final video using FFmpeg concat."""
    if not clips:
        print("[!] No clips found in temp folder to combine.")
        print(f"    Please place generated scene clips into: {SCENES_DIR}")
        return False

    concat_list_file = os.path.join(TEMP_DIR, "concat_list.txt")
    with open(concat_list_file, "w", encoding="utf-8") as f:
        for c in clips:
            clip_path = os.path.join(SCENES_DIR, c).replace("\\", "/")
            f.write(f"file '{clip_path}'\n")

    print(f"\n[*] Generated concat list at: {concat_list_file}")
    print(f"[*] Compiling final combined video to:\n    {OUTPUT_VIDEO}...")

    cmd = [
        "ffmpeg", "-y",
        "-f", "concat",
        "-safe", "0",
        "-i", concat_list_file,
        "-c:v", "libx264",
        "-pix_fmt", "yuv420p",
        "-preset", "medium",
        "-crf", "18",
        "-c:a", "aac",
        "-b:a", "192k",
        OUTPUT_VIDEO
    ]

    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        print("[!] FFmpeg error during compilation:")
        print(result.stderr[-500:])
        return False

    print(f"\n[+] SUCCESS! Final video created:")
    print(f"    File: {OUTPUT_VIDEO}")
    print(f"    Size: {os.path.getsize(OUTPUT_VIDEO) // (1024 * 1024)} MB")
    return True

def purge_temp():
    """Purges the temporary build folder completely."""
    if os.path.exists(TEMP_DIR):
        print(f"\n[*] Purging temporary build directory: {TEMP_DIR}...")
        shutil.rmtree(TEMP_DIR)
        print("[+] Temporary directory cleanly removed.")
        print(f"[+] ONLY the final portfolio video remains in:\n    {FINAL_DIR}")

if __name__ == "__main__":
    action = sys.argv[1].lower() if len(sys.argv) > 1 else "run"

    if action == "init":
        init_workspace()
    elif action == "status":
        check_scenes()
    elif action == "purge":
        purge_temp()
    elif action == "run":
        init_workspace()
        clips = check_scenes()
        if clips:
            success = combine_videos(clips)
            if success:
                print("\n[+] Video combined successfully.")
                purge_temp()
        else:
            print("\n[!] Please place generated scene clips into:")
            print(f"    {SCENES_DIR}")
            print("    Then re-run: python scripts/combine_demo_video.py")
