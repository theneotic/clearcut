#!/usr/bin/env python3
"""Remove an image background and write a transparent PNG result."""

import sys
from pathlib import Path

from PIL import Image, ImageOps
from rembg import new_session, remove


_session = None


def get_session():
    global _session
    if _session is None:
        _session = new_session("u2netp")
    return _session


def main() -> int:
    if len(sys.argv) != 3:
        print("Usage: remove_background.py <input> <output>", file=sys.stderr)
        return 2

    input_path = Path(sys.argv[1])
    output_path = Path(sys.argv[2])

    try:
        with Image.open(input_path) as source:
            normalized = ImageOps.exif_transpose(source).convert("RGBA")
            # u2netp is the compact rembg model, suitable for a request-bound web runtime.
            result = remove(normalized, session=get_session()).convert("RGBA")
            result.save(output_path, format="PNG", optimize=True)
    except Exception as error:
        print(f"Background removal failed: {error}", file=sys.stderr)
        return 1

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
