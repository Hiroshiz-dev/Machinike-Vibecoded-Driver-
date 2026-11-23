#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
cd "$PROJECT_DIR"

echo "============================================================"
echo "        MACHENIKE HUB - INSTALADOR PARA LINUX (PC)"
echo "============================================================"
echo

if ! command -v node >/dev/null 2>&1; then
  echo "[ERRO] Node.js não encontrado. Instale Node.js 20+ em https://nodejs.org/"
  exit 1
fi

echo "[1/3] Instalando dependências..."
npm install

echo
echo "Escolha o modo de instalação:"
echo "  [1] Gerar executável portátil (.AppImage) via Electron (Recomendado)"
echo "  [2] Instalar lançador no Menu de Aplicativos (.desktop)"
read -r -p "Digite 1 ou 2 [1]: " MODO
MODO="${MODO:-1}"

if [ "$MODO" = "2" ]; then
  echo "[2/3] Compilando build de produção..."
  npm run build

  echo "[3/3] Criando lançador de aplicativo em ~/.local/share/applications/machenike-hub.desktop..."
  mkdir -p "$HOME/.local/share/applications" "$HOME/.local/bin"

  cat > "$HOME/.local/bin/machenike-hub" <<EOF
#!/usr/bin/env bash
cd "$PROJECT_DIR"
npx vite preview --port 3000 --host 127.0.0.1 >/dev/null 2>&1 &
SERVER_PID=\$!
sleep 2
if command -v google-chrome >/dev/null 2>&1; then
  google-chrome --app="http://127.0.0.1:3000"
elif command -v chromium >/dev/null 2>&1; then
  chromium --app="http://127.0.0.1:3000"
else
  xdg-open "http://127.0.0.1:3000"
fi
kill "\$SERVER_PID" >/dev/null 2>&1 || true
EOF
  chmod +x "$HOME/.local/bin/machenike-hub"

  cat > "$HOME/.local/share/applications/machenike-hub.desktop" <<EOF
[Desktop Entry]
Name=Machenike Hub
Comment=Controlador de Recursos, Driver, Macros e RGB para controles Machenike
Exec=$HOME/.local/bin/machenike-hub
Icon=$PROJECT_DIR/public/pwa-512x512.png
Terminal=false
Type=Application
Categories=Utility;Game;
EOF

  echo
  echo "Instalação concluída! Procure por 'Machenike Hub' no menu de aplicativos."
  exit 0
fi

echo "[2/3] Preparando Electron e electron-builder..."
npm install --no-save electron electron-builder

echo "[3/3] Compilando executável Linux (.AppImage) em release/..."
VITE_BASE_PATH=./ npm run build
npx electron-builder --config electron-builder.json --linux --publish never

echo
echo "Concluído! Executável .AppImage gerado na pasta: $PROJECT_DIR/release"
