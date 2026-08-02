#!/usr/bin/env python3
"""Scan Batman character screenshot ZIP archives, crop images, and merge duplicate cards.

This tool is designed for archived BatApp screenshot exports where the same
character may appear in multiple crew ZIPs. It:
  1. extracts each ZIP into a temp workspace,
  2. crops the black phone chrome from each screenshot,
  3. computes a pixel hash for deduplication,
  4. groups duplicate cards and unions their crew memberships.

It intentionally keeps metadata light because reliable stats transcription still
needs either OCR review or manual entry.
"""
from __future__ import annotations

import hashlib, json, re, shutil, sys, tempfile, zipfile
from pathlib import Path
from PIL import Image
import numpy as np

SUPPORTED = {'.png', '.jpg', '.jpeg', '.webp'}

CREW_ALIASES = {
    'Bat Family': 'Batman',
    'Batman': 'Batman',
    'Bird of Prey': 'Birds of Prey',
    'Birds_Of_Prey': 'Birds of Prey',
    'Crime Family': 'Crime Family',
    'Crime_Family': 'Crime Family',
    'Freeze': 'Mr. Freeze',
    'Raz Al Ghoul': "Ra's al Ghul",
    'Ras_Al_Ghoul_N_Friends': "Ra's al Ghul",
    'Who Laughs': 'Batman Who Laughs',
    'Who_Laughs': 'Batman Who Laughs',
    'Suicide Squad': 'Suicide Squad',
    'Suicide_Squad': 'Suicide Squad',
    'The Cult': 'The Cult',
    'The_Cult': 'The Cult',
    'Two Face': 'Two Face',
    'TwoFace': 'Two Face',
}

def slug(value: str) -> str:
    return re.sub(r'[^a-z0-9]+', '-', value.lower()).strip('-')


def detect_card_bounds(image: Image.Image) -> tuple[int, int]:
    rgb = np.asarray(image.convert('RGB'), dtype=np.uint8)
    luminance = rgb.mean(axis=2)
    nonblack = (luminance > 8).mean(axis=1)

    def first_run(start: int, predicate, length: int) -> int:
        for y in range(start, len(nonblack) - length + 1):
            if all(predicate(value) for value in nonblack[y:y + length]):
                return y
        raise ValueError('Could not detect a stable card boundary')

    top = first_run(0, lambda value: value > 0.95, 10)
    bottom = first_run(top + 10, lambda value: value < 0.01, 20)
    return top, bottom


def pixel_hash(image: Image.Image) -> str:
    return hashlib.sha256(image.convert('RGB').tobytes()).hexdigest()


def normalize_crew(name: str) -> str:
    base = Path(name).stem.replace('_', ' ')
    return CREW_ALIASES.get(Path(name).stem, CREW_ALIASES.get(base, base))


def main(zip_dir: str, output_dir: str) -> int:
    zip_root = Path(zip_dir)
    out = Path(output_dir)
    img_root = out / 'characters'
    thumb_root = out / 'character-thumbs'
    out.mkdir(parents=True, exist_ok=True)
    img_root.mkdir(parents=True, exist_ok=True)
    thumb_root.mkdir(parents=True, exist_ok=True)

    manifests = []
    seen = {}
    cards = []

    zip_files = sorted(zip_root.glob('*.zip'))
    if not zip_files:
        print('No zip files found.', file=sys.stderr)
        return 1

    with tempfile.TemporaryDirectory() as temp_dir:
        temp_dir = Path(temp_dir)
        for zip_path in zip_files:
            crew = normalize_crew(zip_path.stem)
            extract_dir = temp_dir / zip_path.stem
            extract_dir.mkdir(parents=True, exist_ok=True)
            with zipfile.ZipFile(zip_path) as archive:
                archive.extractall(extract_dir)

            for source in sorted([p for p in extract_dir.rglob('*') if p.suffix.lower() in SUPPORTED]):
                image = Image.open(source).convert('RGB')
                top, bottom = detect_card_bounds(image)
                cropped = image.crop((0, top, image.width, bottom))
                digest = pixel_hash(cropped)
                if digest in seen:
                    cards[seen[digest]]['crews'] = sorted(set(cards[seen[digest]]['crews'] + [crew]))
                    cards[seen[digest]]['duplicateSources'].append(f'{zip_path.name}:{source.name}')
                    continue

                filename = slug(f'{crew}-{source.stem}') + '.webp'
                img_dir = img_root / slug(crew)
                th_dir = thumb_root / slug(crew)
                img_dir.mkdir(parents=True, exist_ok=True)
                th_dir.mkdir(parents=True, exist_ok=True)
                image_path = img_dir / filename
                thumb_path = th_dir / filename
                cropped.save(image_path, 'WEBP', quality=95, method=6)
                thumb = cropped.copy()
                thumb.thumbnail((360, 512))
                thumb.save(thumb_path, 'WEBP', quality=90, method=6)

                record = {
                    'id': slug(f'{crew}-{source.stem}'),
                    'name': source.stem.replace('_', ' ').replace('-', ' '),
                    'alias': 'Unknown',
                    'crew': crew,
                    'crews': [crew],
                    'baseSizeMm': None,
                    'reputation': None,
                    'funding': None,
                    'stats': {},
                    'traits': [],
                    'weaponRules': [],
                    'image': str(image_path.relative_to(out)).replace('\\', '/'),
                    'thumbnail': str(thumb_path.relative_to(out)).replace('\\', '/'),
                    'sourceFiles': [source.name],
                    'duplicateSources': [],
                    'source': 'BatApp screenshot archive',
                    'metadataStatus': 'image-only-import'
                }
                seen[digest] = len(cards)
                cards.append(record)
                manifests.append({'crew': crew, 'zip': zip_path.name, 'source': source.name, 'id': record['id']})

    (out / 'character-data.json').write_text(json.dumps(cards, indent=2))
    (out / 'character-data.js').write_text('window.BATMAN_CHARACTER_DATA = ' + json.dumps(cards, indent=2) + ';\n')
    (out / 'import-manifest.json').write_text(json.dumps(manifests, indent=2))
    print(f'Imported {len(cards)} unique cards from {len(zip_files)} ZIP archives.')
    return 0


if __name__ == '__main__':
    if len(sys.argv) != 3:
        raise SystemExit('Usage: import_archive_memberships.py ZIP_DIR OUTPUT_DIR')
    raise SystemExit(main(sys.argv[1], sys.argv[2]))
