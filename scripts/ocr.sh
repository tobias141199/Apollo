#!/usr/bin/env bash
# OCR de um PDF escaneado → ocr/<nome>/page-NNN.txt (privado, no .gitignore)
# Uso: scripts/ocr.sh <arquivo.pdf> <nome> <idiomas> [primeira] [última]
#   ex.: scripts/ocr.sh livro.pdf gramatica por+grc
set -euo pipefail
if [ "${1:-}" = "--pagina" ]; then
  # modo interno: processa uma única página (chamado em paralelo pelo xargs)
  p=$(printf "%03d" "$2"); img="$OCR_OUT/img/page-$p"
  [ -s "$OCR_OUT/page-$p.txt" ] && exit 0
  [ -s "$img.png" ] || pdftoppm -r 300 -gray -png -singlefile -f "$2" -l "$2" "$OCR_PDF" "$img"
  OMP_THREAD_LIMIT=1 tesseract "$img.png" "$OCR_OUT/page-$p" --tessdata-dir "$OCR_ROOT/ocr/tessdata" -l "$OCR_LANGS" --psm 1 >/dev/null 2>&1
  exit 0
fi
pdf="$1"; name="$2"; langs="$3"
n=$(pdfinfo "$pdf" | awk '/^Pages:/{print $2}')
first="${4:-1}"; last="${5:-$n}"
root="$(cd "$(dirname "$0")/.." && pwd)"
export OCR_PDF="$pdf" OCR_OUT="$root/ocr/$name" OCR_ROOT="$root" OCR_LANGS="$langs"
mkdir -p "$OCR_OUT/img"
seq "$first" "$last" | xargs -P "$(sysctl -n hw.ncpu)" -n 1 "$0" --pagina || echo "aviso: alguma página falhou; rode de novo para completar"
echo "OK: $(ls "$OCR_OUT"/page-*.txt | wc -l) páginas em $OCR_OUT"
