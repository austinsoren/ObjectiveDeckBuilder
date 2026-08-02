#!/usr/bin/env python3
"""Crop BatApp phone chrome from character-card screenshots and deduplicate results.

Usage:
    python tools/import_character_screenshots.py INPUT_DIR OUTPUT_DIR

The detector looks for a large, full-width non-black card region surrounded by
black phone chrome. It preserves the full card region, writes WebP files, and
prints duplicate pixel hashes so repeated screenshots can be removed safely.
"""
from __future__ import annotations

import hashlib
import sys
from pathlib import Path
from PIL import Image
import numpy as np

SUPPORTED = {".png", ".jpg", ".jpeg", ".webp"}

def detect_card_bounds(image: Image.Image) -> tuple[int, int]:
    rgb = np.asarray(image.convert("RGB"), dtype=np.uint8)
    luminance = rgb.mean(axis=2)
    nonblack = (luminance > 8).mean(axis=1)

    def first_run(start: int, predicate, length: int) -> int:
        for y in range(start, len(nonblack) - length + 1):
            if all(predicate(value) for value in nonblack[y:y+length]):
                return y
        raise ValueError("Could not detect a stable card boundary")

    top = first_run(0, lambda value: value > 0.95, 10)
    bottom = first_run(top + 10, lambda value: value < 0.01, 20)
    return top, bottom

def pixel_hash(image: Image.Image) -> str:
    return hashlib.sha256(image.convert("RGB").tobytes()).hexdigest()

def main() -> int:
    if len(sys.argv) != 3:
        print("Usage: import_character_screenshots.py INPUT_DIR OUTPUT_DIR")
        return 2

    source = Path(sys.argv[1])
    output = Path(sys.argv[2])
    output.mkdir(parents=True, exist_ok=True)
    seen: dict[str, Path] = {}

    files = sorted(path for path in source.rglob("*") if path.suffix.lower() in SUPPORTED)
    if not files:
        print("No supported images found.")
        return 1

    for path in files:
        image = Image.open(path).convert("RGB")
        top, bottom = detect_card_bounds(image)
        cropped = image.crop((0, top, image.width, bottom))
        digest = pixel_hash(cropped)
        if digest in seen:
            print(f"DUPLICATE {path.name} == {seen[digest].name}")
            continue

        seen[digest] = path
        destination = output / f"{path.stem}.webp"
        cropped.save(destination, "WEBP", quality=95, method=6)
        print(f"WROTE {destination.name}: {image.size} -> {cropped.size} (rows {top}:{bottom})")

    return 0

if __name__ == "__main__":
    raise SystemExit(main())
