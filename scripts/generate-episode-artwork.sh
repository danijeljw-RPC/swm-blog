#!/usr/bin/env bash

set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
project_root="$(cd "$script_dir/.." && pwd)"
output_dir="$project_root/public/images/episodes"

if [[ $# -lt 2 ]]; then
  printf 'Usage: %s TITLE SUBTITLE [--seed NUMBER] [--force]\n' "$(basename "$0")" >&2
  exit 64
fi

title=$1
subtitle=$2
shift 2

if [[ -z "${title//[[:space:]]/}" || -z "${subtitle//[[:space:]]/}" ]]; then
  printf 'Error: title and subtitle must not be empty.\n' >&2
  exit 64
fi

seed=""
force=0
while [[ $# -gt 0 ]]; do
  case "$1" in
    --seed)
      [[ $# -ge 2 ]] || { printf 'Error: --seed requires a value.\n' >&2; exit 64; }
      seed=$2
      shift 2
      ;;
    --force)
      force=1
      shift
      ;;
    *)
      printf 'Error: unknown option: %s\n' "$1" >&2
      exit 64
      ;;
  esac
done

if [[ -n "$seed" && ! "$seed" =~ ^-?[0-9]+$ ]]; then
  printf 'Error: --seed must be an integer.\n' >&2
  exit 64
fi

if [[ -z "$seed" ]]; then
  seed=$(printf '%s' "${RANDOM}${RANDOM}-$PPID-$$-$(date +%s)" | cksum | awk '{print $1}')
fi

variant_index=$(( (seed % 50 + 50) % 50 ))
variant_number=$((variant_index + 1))
motif_index=$((variant_index / 5))
ornament_index=$((variant_index % 5))

slugify() {
  printf '%s' "$1" \
    | tr '[:upper:]' '[:lower:]' \
    | sed -E 's/[[:space:]]+/-/g; s/[^a-z0-9-]//g; s/-+/-/g; s/^-+//; s/-+$//'
}

xml_escape() {
  printf '%s' "$1" \
    | sed 's/&/\&amp;/g; s/</\&lt;/g; s/>/\&gt;/g; s/"/\&quot;/g; s/'"'"'/\&apos;/g'
}

random_number() {
  local salt=$1
  local minimum=$2
  local range=$3
  local mixed=$(( (seed + salt * 1103515245 + 12345) & 2147483647 ))
  printf '%d' $((minimum + mixed % range))
}

render_star_field() {
  local index x y radius opacity
  printf '%s\n' '  <g fill="#D7CCB8" aria-hidden="true">'
  for index in $(seq 1 28); do
    x=$(random_number "$((1000 + index))" 105 1390)
    y=$(random_number "$((2000 + index))" 100 510)
    radius=$(random_number "$((3000 + index))" 1 3)
    opacity=$(random_number "$((4000 + index))" 35 55)
    printf '    <circle cx="%s" cy="%s" r="%s" opacity=".%s"/>\n' "$x" "$y" "$radius" "$opacity"
  done
  printf '%s\n' '  </g>'
}

render_motif() {
  printf '  <g data-motif="%s" fill="none" stroke="#A98853" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">\n' "$motif_index"
  case "$motif_index" in
    0)
      printf '%s\n' '    <ellipse cx="800" cy="370" rx="154" ry="218" stroke-width="4"/><ellipse cx="800" cy="370" rx="132" ry="195" opacity=".45"/><path d="M830 237a138 138 0 1 0 0 266a109 109 0 1 1 0-266Z" fill="#A98853" fill-opacity=".13"/><path d="M800 142v-34m-22 20 22-20 22 20M800 598v34m-22-20 22 20 22-20"/>'
      ;;
    1)
      printf '%s\n' '    <path d="M565 370q235-210 470 0-235 210-470 0Z" stroke-width="4"/><circle cx="800" cy="370" r="92" stroke-width="3"/><circle cx="800" cy="370" r="32" fill="#A98853" fill-opacity=".2"/><path d="M800 220v-72M690 242l-43-58M910 242l43-58M650 370h-76M950 370h76M690 498l-43 58M910 498l43 58M800 520v72" opacity=".65"/>'
      ;;
    2)
      printf '%s\n' '    <circle cx="800" cy="370" r="210" stroke-width="2"/><circle cx="800" cy="370" r="168" stroke-width="4"/><circle cx="800" cy="370" r="118" opacity=".65"/><path d="M800 202c116 64 116 272 0 336-116-64-116-272 0-336Zm-146 84c100-58 246 26 292 168-100 58-246-26-292-168Z" opacity=".7"/><circle cx="800" cy="370" r="18" fill="#A98853" fill-opacity=".28"/>'
      ;;
    3)
      printf '%s\n' '    <circle cx="730" cy="370" r="176" stroke-width="3"/><circle cx="870" cy="370" r="176" stroke-width="3"/><path d="M800 180 970 370 800 560 630 370Z" opacity=".55"/><circle cx="800" cy="370" r="58" fill="#A98853" fill-opacity=".12"/>'
      ;;
    4)
      printf '%s\n' '    <path d="M800 145 1040 555H560Z" stroke-width="4"/><path d="M800 205 970 495H630Z" opacity=".6"/><path d="m800 555-170-290h340Z" opacity=".55"/><circle cx="800" cy="370" r="92"/><circle cx="800" cy="370" r="16" fill="#A98853" fill-opacity=".3"/>'
      ;;
    5)
      printf '%s\n' '    <circle cx="800" cy="370" r="142" stroke-width="4"/><circle cx="800" cy="370" r="92" opacity=".55"/><circle cx="800" cy="370" r="26" fill="#A98853" fill-opacity=".25"/><path d="M800 132v64M800 544v64M562 370h64M974 370h64M632 202l45 45M923 493l45 45M968 202l-45 45M677 493l-45 45" stroke-width="3"/><path d="M800 228 923 441H677Z" opacity=".5"/>'
      ;;
    6)
      printf '%s\n' '    <ellipse cx="800" cy="370" rx="258" ry="104" transform="rotate(-18 800 370)" stroke-width="2" opacity=".5"/><ellipse cx="800" cy="370" rx="210" ry="75" transform="rotate(20 800 370)" opacity=".45"/><path d="M800 370c20-58 112-48 118 25 8 99-139 164-252 89-136-91-70-303 97-340 197-43 344 154 255 326" stroke-width="5"/><circle cx="800" cy="370" r="22" fill="#A98853" fill-opacity=".3"/>'
      ;;
    7)
      printf '%s\n' '    <path d="m800 122 86 188-86 266-86-266Z" stroke-width="4"/><path d="m714 310-104-94 32 264 158 96m86-266 104-94-32 264-158 96M642 480l72-170 86 266 86-266 72 170" opacity=".68"/><path d="m800 122-52 188 52 266 52-266Z" fill="#A98853" fill-opacity=".1"/>'
      ;;
    8)
      printf '%s\n' '    <path d="M585 370c0-132 150-181 215-62 65-119 215-70 215 62s-150 181-215 62c-65 119-215 70-215-62Z" stroke-width="4"/><path d="M680 176h240L680 564h240M680 176l240 388M920 176 680 564" opacity=".5"/><circle cx="800" cy="370" r="20" fill="#A98853" fill-opacity=".3"/>'
      ;;
    9)
      printf '%s\n' '    <ellipse cx="675" cy="370" rx="110" ry="190" stroke-width="4"/><ellipse cx="925" cy="370" rx="110" ry="190" stroke-width="4"/><ellipse cx="675" cy="370" rx="86" ry="164" opacity=".45"/><ellipse cx="925" cy="370" rx="86" ry="164" opacity=".45"/><path d="M800 250a120 120 0 1 0 0 240 92 92 0 1 1 0-240Z" fill="#A98853" fill-opacity=".14"/><path d="M785 370h30"/>'
      ;;
  esac
  printf '%s\n' '  </g>'
}

render_ornament() {
  printf '  <g data-ornament="%s" fill="none" stroke="#A98853" aria-hidden="true">\n' "$ornament_index"
  case "$ornament_index" in
    0)
      printf '%s\n' '    <path d="M310 175a28 28 0 1 0 0 56 22 22 0 1 1 0-56Zm118-5v66m118-66a33 33 0 1 0 0 66 27 27 0 1 1 0-66ZM1290 175a28 28 0 1 1 0 56 22 22 0 1 0 0-56Zm-118-5v66m-118-66a33 33 0 1 1 0 66 27 27 0 1 0 0-66Z" opacity=".72"/>'
      ;;
    1)
      printf '%s\n' '    <ellipse cx="800" cy="370" rx="360" ry="245" stroke-dasharray="3 13" opacity=".48"/><circle cx="448" cy="336" r="13" fill="#A98853" fill-opacity=".22"/><circle cx="1142" cy="432" r="20"/><path d="M1122 426q20-26 40 0"/><circle cx="550" cy="544" r="7" fill="#A98853"/>'
      ;;
    2)
      printf '%s\n' '    <path d="m214 158 116 88 76-120 88 92m612-62 102 96 116-126 70 100M208 550l98-78 112 115 92-74m580 40 90-92 126 116 80-82" opacity=".46"/><g fill="#A98853"><circle cx="214" cy="158" r="5"/><circle cx="330" cy="246" r="4"/><circle cx="406" cy="126" r="6"/><circle cx="1106" cy="156" r="5"/><circle cx="1208" cy="252" r="4"/><circle cx="1324" cy="126" r="6"/></g>'
      ;;
    3)
      printf '%s\n' '    <path d="M800 86v70M686 100l34 66M914 100l-34 66M580 142l68 54M1020 142l-68 54M800 584v70M686 640l34-66M914 640l-34-66M580 598l68-54M1020 598l-68-54" opacity=".65"/><path d="m800 74 6 14 14 6-14 6-6 14-6-14-14-6 14-6Z" fill="#A98853"/>'
      ;;
    4)
      printf '%s\n' '    <path d="M252 132v462M222 162h60M222 564h60M1348 132v462M1318 162h60M1318 564h60" opacity=".5"/><path d="m252 220 18 44-18 44-18-44Zm0 170 18 44-18 44-18-44Zm1096-170 18 44-18 44-18-44Zm0 170 18 44-18 44-18-44Z" fill="#A98853" fill-opacity=".12"/>'
      ;;
  esac
  printf '%s\n' '  </g>'
}

filename="$(slugify "$title-$subtitle").svg"
output_path="$output_dir/$filename"
png_path="${output_path%.svg}.png"

if [[ "$filename" == ".svg" ]]; then
  printf 'Error: title and subtitle must contain characters usable in a filename.\n' >&2
  exit 64
fi

if [[ $force -ne 1 && ( -e "$output_path" || -e "$png_path" ) ]]; then
  existing_path=$output_path
  [[ -e "$png_path" ]] && existing_path=$png_path
  printf 'Error: output already exists: %s (use --force to replace it)\n' "$existing_path" >&2
  exit 73
fi

title_xml=$(xml_escape "$title")
subtitle_xml=$(xml_escape "$subtitle")

title_font_size=58
title_letter_spacing=10
if [[ ${#title} -gt 32 ]]; then
  title_letter_spacing=6
  title_font_size=$(( (1240 / ${#title} - title_letter_spacing) * 2 ))
  [[ $title_font_size -lt 28 ]] && title_font_size=28
  [[ $title_font_size -gt 58 ]] && title_font_size=58
fi

subtitle_font_size=24
subtitle_letter_spacing=8
if [[ ${#subtitle} -gt 55 ]]; then
  subtitle_letter_spacing=4
  subtitle_font_size=$(( (1320 / ${#subtitle} - subtitle_letter_spacing) * 2 ))
  [[ $subtitle_font_size -lt 15 ]] && subtitle_font_size=15
  [[ $subtitle_font_size -gt 24 ]] && subtitle_font_size=24
fi

mkdir -p "$output_dir"

temp_svg=""
temp_png=""
cleanup_temporary_artwork() {
  [[ -z "$temp_svg" ]] || rm -f -- "$temp_svg"
  [[ -z "$temp_png" ]] || rm -f -- "$temp_png"
}
trap cleanup_temporary_artwork EXIT HUP INT TERM

temp_svg=$(mktemp "$output_dir/.episode-artwork-svg.XXXXXX")
temp_png=$(mktemp "$output_dir/.episode-artwork-png.XXXXXX")

{
  printf '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900" role="img" aria-labelledby="title description" data-variant="%s" data-seed="%s">\n' "$variant_number" "$seed"
  printf '  <title id="title">%s</title>\n' "$title_xml"
  printf '  <desc id="description">Metaphysical episode artwork for %s.</desc>\n' "$title_xml"
  printf '%s\n' '  <defs>'
  printf '%s\n' '    <radialGradient id="plum" cx="50%" cy="38%" r="74%"><stop offset="0" stop-color="#2b142d"/><stop offset="0.55" stop-color="#100b15"/><stop offset="1" stop-color="#07070b"/></radialGradient>'
  printf '%s\n' '    <filter id="soft"><feGaussianBlur stdDeviation="28"/></filter>'
  printf '%s\n' '  </defs>'
  printf '%s\n' '  <rect width="1600" height="900" fill="url(#plum)"/>'
  printf '%s\n' '  <g fill="#593057" opacity=".2" filter="url(#soft)"><ellipse cx="160" cy="480" rx="230" ry="410"/><ellipse cx="1440" cy="450" rx="220" ry="390"/></g>'
  printf '%s\n' '  <g fill="none" stroke="#A98853"><rect x="48" y="48" width="1504" height="804" stroke-width="2" opacity=".7"/><rect x="66" y="66" width="1468" height="768" stroke-width="1" opacity=".35"/></g>'
  render_star_field
  render_ornament
  render_motif
  printf '  <text data-role="heading" x="800" y="744" fill="#D7CCB8" font-family="Georgia,serif" font-size="%s" letter-spacing="%s" text-anchor="middle">%s</text>\n' "$title_font_size" "$title_letter_spacing" "$title_xml"
  printf '  <text data-role="subheading" x="800" y="800" fill="#A98853" font-family="Arial,sans-serif" font-size="%s" letter-spacing="%s" text-anchor="middle">%s</text>\n' "$subtitle_font_size" "$subtitle_letter_spacing" "$subtitle_xml"
  printf '%s\n' '</svg>'
} > "$temp_svg"

if ! (
  cd "$project_root"
  node --input-type=module - "$temp_svg" "$temp_png" <<'NODE'
import sharp from "sharp";

const [, , sourcePath, outputPath] = process.argv;
await sharp(sourcePath).png().toFile(outputPath);
NODE
); then
  printf 'Error: unable to render PNG. Run npm install and try again.\n' >&2
  exit 70
fi

mv -f -- "$temp_svg" "$output_path"
mv -f -- "$temp_png" "$png_path"
temp_svg=""
temp_png=""
trap - EXIT HUP INT TERM

printf 'Created %s\nCreated %s\n' "$output_path" "$png_path"
