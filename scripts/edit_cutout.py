#!/usr/bin/env python3
"""Apply non-destructive crop framing and an optional drop shadow to a transparent PNG."""

import sys
from pathlib import Path

from PIL import Image, ImageFilter


def clamp(value: float, low: float, high: float) -> float:
    return max(low, min(high, value))


def main() -> int:
    if len(sys.argv) != 14:
        print("Usage: edit_cutout.py <input> <output> <zoom> <x> <y> <shadow> <opacity> <blur> <offset_y> <background> <export_size> <format> <quality>", file=sys.stderr)
        return 2

    input_path = Path(sys.argv[1])
    output_path = Path(sys.argv[2])

    try:
        zoom = clamp(float(sys.argv[3]), 1.0, 1.8)
        position_x = clamp(float(sys.argv[4]), -100.0, 100.0)
        position_y = clamp(float(sys.argv[5]), -100.0, 100.0)
        shadow_enabled = sys.argv[6] == "1"
        shadow_opacity = clamp(float(sys.argv[7]), 0.0, 100.0) / 100.0
        shadow_blur = clamp(float(sys.argv[8]), 0.0, 48.0)
        shadow_offset_y = clamp(float(sys.argv[9]), -40.0, 64.0)
        background_color = sys.argv[10]
        export_size = sys.argv[11]
        export_format = sys.argv[12].lower()
        export_quality = round(clamp(float(sys.argv[13]), 40.0, 100.0))

        with Image.open(input_path) as source:
            image = source.convert("RGBA")
            width, height = image.size
            scaled = image.resize((round(width * zoom), round(height * zoom)), Image.Resampling.LANCZOS)
            overflow_x = max(0, scaled.width - width)
            overflow_y = max(0, scaled.height - height)
            left = round((position_x + 100.0) / 200.0 * overflow_x)
            top = round((position_y + 100.0) / 200.0 * overflow_y)
            cropped = scaled.crop((left, top, left + width, top + height))

            result = cropped
            if shadow_enabled and shadow_opacity > 0:
                margin = max(24, round(max(width, height) * 0.045))
                canvas = Image.new("RGBA", (width + margin * 2, height + margin * 2), (0, 0, 0, 0))
                alpha = cropped.getchannel("A")
                shadow_alpha = alpha.filter(ImageFilter.GaussianBlur(shadow_blur))
                shadow_alpha = shadow_alpha.point(lambda value: round(value * shadow_opacity))
                shadow = Image.new("RGBA", cropped.size, (17, 28, 27, 0))
                shadow.putalpha(shadow_alpha)
                canvas.alpha_composite(shadow, (margin, margin + round(shadow_offset_y)))
                canvas.alpha_composite(cropped, (margin, margin))
                result = canvas

            size_presets = {
                "original": None,
                "social-square": (1080, 1080),
                "social-portrait": (1080, 1350),
                "story": (1080, 1920),
                "product-square": (1600, 1600),
                "product-landscape": (2000, 1333),
            }
            target_size = size_presets.get(export_size)
            if export_size not in size_presets:
                raise ValueError("Unsupported export size preset")

            output_size = target_size or result.size
            canvas_color = background_color if background_color != "transparent" else (0, 0, 0, 0)
            output = Image.new("RGBA", output_size, canvas_color)
            if target_size:
                scale = min(target_size[0] / result.width, target_size[1] / result.height)
                resized = result.resize((round(result.width * scale), round(result.height * scale)), Image.Resampling.LANCZOS)
                position = ((target_size[0] - resized.width) // 2, (target_size[1] - resized.height) // 2)
                output.alpha_composite(resized, position)
            else:
                output.alpha_composite(result)

            format_options = {
                "png": ("PNG", "image/png"),
                "jpeg": ("JPEG", "image/jpeg"),
                "webp": ("WEBP", "image/webp"),
            }
            if export_format not in format_options:
                raise ValueError("Unsupported export format")
            pillow_format, _ = format_options[export_format]

            if export_format == "png":
                output.save(output_path, format=pillow_format, optimize=True)
            else:
                # JPEG cannot retain alpha; composite transparency onto white unless a background preset was selected.
                if export_format == "jpeg" and background_color == "transparent":
                    matte = Image.new("RGBA", output.size, "#ffffff")
                    matte.alpha_composite(output)
                    output = matte
                if export_format == "webp":
                    output.convert("RGB").save(output_path, format=pillow_format, quality=export_quality, method=6)
                else:
                    output.convert("RGB").save(output_path, format=pillow_format, quality=export_quality, optimize=True)
    except Exception as error:
        print(f"Image adjustment failed: {error}", file=sys.stderr)
        return 1

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
