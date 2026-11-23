# Machenike Hub — Controlador de Recursos & Driver (PC + Celular)

Controlador multiplataforma para a linha de controles **Machenike** (**G5 Pro Max**, **G5 Pro V2**, **G6 Pro**, **G5 Pro**, **G3 V2 / G3S** e **G1 / G1 Pro**), executável como aplicativo instalável (**PWA Offline**) no computador e celular, além de empacotamento automatizado via **GitHub Actions** para **Windows (`.exe`)**, **macOS (`.dmg`)**, **Linux (`.AppImage`)** e **Android (`.apk`)**.

---

## Recursos Principais

- **Reconhecimento Automático de Hardware**: detecta controles Machenike conectados por **USB-C**, **Receptor 2.4 GHz** ou **Bluetooth** (via Web Gamepad API, WebHID e Web Bluetooth com leitura de bateria GATT).
- **Mapeamento de Botões & Modo Turbina (Rapid-Fire)**: remapeie todos os botões físicos e paddles traseiros/ombro (`M1`–`M4`), configure disparo rápido de **1 a 30 Hz** por botão em modo *Segurar* ou *Automático*.
- **Estúdio de Macros Temporizadas**: grave sequências ao vivo em milissegundos, edite passos manualmente, simule a execução e vincule a qualquer botão.
- **Iluminação RGB Multizona**: efeitos *Estático*, *Respiração*, *Arco-íris*, *Reativo* e *Pulso* adaptados ao layout de LEDs de cada modelo.
- **Vibração Háptica & Calibração Hall-Effect**: motores duplos independentes, criador de padrões rítmicos de vibração, eventos no jogo, curvas de analógicos, Hair Trigger e giroscópio 6 eixos.
- **Perfis de Jogo**: crie, edite, duplique, exclua, exporte e importe perfis completos em JSON.
- **Teste de Input em Tempo Real**: visualize botões pressionados, radares de analógicos, gatilhos lineares e log de eventos na *Visão Geral*.

---

## Como Executar no Computador e no Celular

### 1. Instalar Diretamente pelo Navegador (PWA — Windows, macOS, Linux, Android e iOS)

Ao hospedar o projeto no **GitHub Pages** (HTTPS automático):

- **Computador (Windows / macOS / Linux)**: abra no Google Chrome ou Microsoft Edge e clique em **Instalar App** no canto superior direito da interface (ou no ícone de instalação na barra de endereços). O aplicativo abre em janela própria, funciona offline e acessa USB-C, 2.4 GHz e Bluetooth.
- **Android**: abra no Google Chrome, toque em **Instalar App** (ou *Menu ⋮ → Instalar aplicativo*). Conecte o controle por **Bluetooth** ou cabo **USB-C OTG**.
- **iPhone / iPad (iOS)**: abra no Safari, toque em **Compartilhar → Adicionar à Tela de Início**.

---

### 2. Publicar no GitHub (GitHub Pages + Executáveis Automáticos)

1. Crie um repositório no GitHub (ex.: `machenike-hub`) e envie o código:

```bash
git init
git add .
git commit -m "feat: Machenike Hub multiplataforma"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/machenike-hub.git
git push -u origin main
```

2. Ative o **GitHub Pages** em `Settings → Pages → Build and deployment → Source: GitHub Actions`.
   - O workflow `.github/workflows/deploy-pages.yml` publicará automaticamente o app instalável em `https://SEU_USUARIO.github.io/machenike-hub/`.

3. Para gerar e publicar **executáveis nativos** (`.exe`, `.dmg`, `.AppImage` e `.apk`) automaticamente em **GitHub Releases**, crie uma tag de versão:

```bash
git tag v1.0.0
git push origin v1.0.0
```

O workflow `.github/workflows/build-executables.yml` compila e anexa automaticamente na Release:
- **Windows**: Instalador NSIS (`.exe`) e Executável Portátil (`.exe`)
- **macOS**: Imagem de disco (`.dmg`)
- **Linux**: Pacote portátil (`.AppImage`)
- **Android**: Pacote instalável (`.apk`)

---

## Desenvolvimento e Build Local

```bash
# Instalar dependências
npm install

# Rodar em modo desenvolvimento (porta 3000)
npm run dev

# Verificar tipos TypeScript
npm run lint

# Gerar build de produção web / PWA
npm run build

# Gerar executável desktop localmente (requer electron e electron-builder)
npm install --no-save electron electron-builder
npm run build:desktop
```

### Gerar APK Android Localmente (Capacitor)

```bash
npm install --no-save @capacitor/core @capacitor/cli @capacitor/android
VITE_BASE_PATH=./ npm run build
npx cap add android
npx cap sync android
cd android && ./gradlew assembleDebug
```

---

## Licença

Distribuído sob a licença **MIT**. Consulte o arquivo [LICENSE](./LICENSE) para mais detalhes.
