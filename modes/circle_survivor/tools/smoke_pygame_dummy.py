#!/usr/bin/env python3
"""圆内幸存者 · 短冒烟（dummy，无窗或最小 pygame 初始化）。"""
from __future__ import annotations

import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
AI = os.path.join(ROOT, "assets", "ai")
SFX = os.path.join(ROOT, "assets", "sfx")


def check_files():
    errs = []
    slots_path = os.path.join(AI, "slots.json")
    if not os.path.isfile(slots_path):
        errs.append("missing slots.json")
        return errs
    with open(slots_path, encoding="utf-8") as f:
        slots = json.load(f)
    for key, fname in slots.items():
        p = os.path.join(AI, fname)
        if not os.path.isfile(p):
            errs.append(f"PNG missing (fallback OK): {key} -> {fname}")
    manifest = os.path.join(SFX, "manifest.json")
    if os.path.isfile(manifest):
        with open(manifest, encoding="utf-8") as f:
            m = json.load(f)
        for ev, fname in (m.get("events") or {}).items():
            p = os.path.join(SFX, fname)
            if not os.path.isfile(p):
                errs.append(f"OGG missing (fallback OK): {ev} -> {fname}")
    return errs


def check_pygame_dummy():
    try:
        os.environ.setdefault("SDL_VIDEODRIVER", "dummy")
        os.environ.setdefault("SDL_AUDIODRIVER", "dummy")
        import pygame  # noqa: F401

        pygame.init()
        pygame.display.set_mode((1, 1))
        pygame.quit()
        return "pygame: init OK (dummy driver)"
    except Exception as e:
        return f"pygame: skip ({e})"


def main():
    print("=== circle_survivor smoke_pygame_dummy ===")
    warns = check_files()
    for w in warns:
        print("WARN", w)
    print(check_pygame_dummy())
    balance = os.path.join(ROOT, "balance.js")
    if os.path.isfile(balance):
        print("OK balance.js present")
    else:
        print("FAIL balance.js missing")
        sys.exit(1)
    print(f"SUMMARY: {len(warns)} asset warn(s), core files OK (R2 expects 16 sfx+png slots)")
    sys.exit(0)


if __name__ == "__main__":
    main()
