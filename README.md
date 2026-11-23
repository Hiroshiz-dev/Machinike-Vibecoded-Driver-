# Machenike Hub — Controlador de Recursos, Drivers & Perfis

### Acesso Imediato pelo Navegador (PC e Celular)

Qualquer pessoa pode abrir e utilizar o **Machenike Hub** agora mesmo pelo navegador (sem precisar instalar nada, ou instalando em 1 clique como aplicativo offline PWA):

> **Link Público Online:** [https://ais-pre-5rynuauy3fg3fc6c3betgo-399234863864.us-west1.run.app](https://ais-pre-5rynuauy3fg3fc6c3betgo-399234863864.us-west1.run.app)

---

## Sobre o Projeto

O **Machenike Hub** é um software multiplataforma (computador e celular) criado para gerenciar, personalizar e calibrar controles da linha **Machenike**. Ele reúne em uma única interface escura de alta precisão o reconhecimento de hardware via **Receptor 2.4 GHz (Dongle USB 2.0)**, **Cabo USB (Com Fio)** e **Bluetooth**, além de remapeamento completo de botões, modo turbina (disparo rápido), estúdio de macros temporizadas, iluminação RGB multizona, vibração háptica customizável, calibração Hall-Effect e gerenciamento de perfis por jogo.

---

## Controles Compatíveis

O software identifica o controle conectado e adapta automaticamente botões extras, zonas RGB e giroscópio conforme o modelo:

| Modelo | Botões Extras | Iluminação RGB | Giroscópio 6 Eixos | Conexões |
| :--- | :--- | :--- | :---: | :--- |
| **Machenike G5 Pro Max** | `M1`, `M2` (Traseiros) | 3 zonas (Faixas laterais + Central) | Sim | Dongle 2.4 GHz · Cabo USB · Bluetooth |
| **Machenike G5 Pro V2** | `M1`, `M2`, `M3`, `M4` | 3 zonas (Faixas laterais + Central) | Sim | Dongle 2.4 GHz · Cabo USB · Bluetooth |
| **Machenike G6 Pro** | `M1`, `M2`, `M3`, `M4` | 3 zonas (Anéis nos analógicos + Central) | Sim | Dongle 2.4 GHz · Cabo USB · Bluetooth |
| **Machenike G5 Pro** | `M1`, `M2` (Traseiros) | 3 zonas (Faixas laterais + Central) | Sim | Dongle 2.4 GHz · Cabo USB · Bluetooth |
| **Machenike G3 V2 / G3S** | `M1`, `M2` (Traseiros) | 1 zona (LED Central) | Não | Dongle 2.4 GHz · Cabo USB · Bluetooth |
| **Machenike G1 / G1 Pro** | Padrão (17 botões) | 1 zona (LED Central) | Não | Dongle 2.4 GHz · Cabo USB · Bluetooth |

---

## Principais Funções

- **Reconhecimento Inteligente de Conexão (Dongle 2.4 GHz USB 2.0, Cabo USB e Bluetooth)**: detecta controles via Web Gamepad API, WebHID e Web Bluetooth (com leitura do nível de bateria via GATT). Como receptores **2.4 GHz USB 2.0** conectados diretamente na placa-mãe são enumerados pelo sistema no mesmo barramento USB de um cabo com fio, o app reconhece o padrão 2.4 GHz e salva sua preferência exata por dispositivo.
- **Visão Geral & Teste de Input em Tempo Real**: diagrama interativo frontal e traseiro do controle + painel de diagnóstico ao vivo que ilumina cada botão pressionado, exibe radares dos analógicos esquerdo/direito, barras lineares dos gatilhos `LT`/`RT` e histórico cronológico de comandos.
- **Perfis de Jogo**: crie, edite, carregue, duplique e exclua perfis dedicados por jogo. Cada perfil armazena mapeamentos, configurações de turbina, macros próprias, iluminação RGB e parâmetros de vibração/driver. Suporta backup via exportação e importação em `.json`.
- **Mapeamento de Botões & Modo Turbina (Disparo Rápido)**: remapeie qualquer botão físico (incluindo `M1`–`M4`) para outro botão do controle, tecla de teclado, clique de mouse, macro ou desativado. Ative o **Modo Turbina** por botão com taxa ajustável de **1 a 30 Hz** em modo *Segurar* ou *Automático*, com testador de cadência em tempo real.
- **Estúdio de Macros**: grave sequências ao vivo pressionando botões no controle físico, teclado ou botões virtuais com captura real de intervalos em milissegundos (`ms`). Edite duração, atraso, ordem dos passos, modo de disparo (*Uma vez*, *Segurar* ou *Alternar*) e simule a execução antes de vincular a um botão.
- **Iluminação RGB Multizona + Envio ao Hardware**: configure efeitos *Estático*, *Respiração*, *Arco-íris*, *Reativo*, *Pulso* ou *Desligado*, brilho, velocidade, direção e cores individuais ou sincronizadas, com envio via **WebHID** (coleção vendor gravável) e **Bluetooth BLE GATT (KeyLinker)**.
- **Vibração Háptica & Calibração Hall-Effect**: controle independente dos motores esquerdo (graves) e direito (agudos), criador de padrões rítmicos de vibração multipasso e vinculação a eventos do jogo (tiro, explosão, dano, colisão, habilidade). Calibre deadzones interna/externa, curva de resposta dos analógicos, Hair Trigger, taxa de polling (até 1000 Hz) e giroscópio.

---

## Como Utilizar (Passo a Passo)

### 1. Conectar seu Controle Machenike
1. Plugue o **Receptor 2.4 GHz (Dongle USB 2.0)** em uma porta USB da placa-mãe (ou conecte via **Cabo USB** / **Bluetooth**).
2. Ligue o controle e pressione qualquer botão (como `A` ou `Home`) para acordá-lo.
3. Na aba **Visão Geral**, o painel **Reconhecimento de Controles Machenike** exibirá o dispositivo detectado.
   - Se o dongle 2.4 GHz USB 2.0 se anunciar como controle X-Input genérico, confirme **Dongle 2.4 GHz (USB 2.0)** no banner superior ou no card de conexão — sua escolha fica salva automaticamente para futuras sessões.
   - Confirme o modelo no seletor da barra lateral esquerda caso o controle não informe o nome exato no modo X-Input.

### 2. Testar Botões, Analógicos e Gatilhos
1. Ainda em **Visão Geral**, role até o painel **Teste de Input em Tempo Real**.
2. Pressione botões, gire os analógicos e aperte `LT` / `RT` para verificar precisão, centralização e log instantâneo de comandos.

### 3. Criar e Trocar Perfis de Jogo
1. Acesse **Perfis de Jogo**, clique em **Novo Perfil**, informe nome, jogo e categoria, e escolha partir da configuração atual ou de fábrica.
2. Alterne rapidamente entre perfis na barra lateral e clique em **Salvar e Aplicar** no cabeçalho superior.

### 4. Remapear Botões, Modo Turbina e Macros
- Em **Mapeamento & Turbina**, clique em qualquer botão do diagrama (*Frente* / *Traseira*) para remapear para Controle, Macro, Teclado, Mouse ou Desativado; na aba **Modo Turbina**, configure disparo rápido de **1 a 30 Hz** por botão.
- Em **Macros**, clique em **Nova Macro** → **Gravar Sequência** para registrar combinações com intervalos reais em `ms` e vincule diretamente a qualquer botão ou paddle.

### 5. Personalizar RGB, Vibração e Calibração
- Em **Iluminação RGB**, escolha o efeito, cor (por paleta ou código Hex) e clique em **Vincular Canal HID** ou **Vincular BLE (KeyLinker)** seguido de **Enviar RGB** para transmitir aos LEDs físicos.
- Em **Vibração & Driver**, ajuste a intensidade dos motores duplos, crie padrões customizados de vibração por evento e calibre deadzones e curvas Hall-Effect.

---

## Instalação no Celular (Android APK & iOS) e Computador

### Celular Android (`.APK`)
- **Download do APK no repositório:** [`releases/Machenike-Hub-Android.apk`](./releases/Machenike-Hub-Android.apk) *(compilado e atualizado automaticamente na pasta `releases/` e na aba **Releases** pelo workflow `.github/workflows/build-android-apk.yml` assim que o repositório é enviado para o GitHub)*.
- **Instalação imediata pelo navegador (sem esperar build):** abra [https://ais-pre-5rynuauy3fg3fc6c3betgo-399234863864.us-west1.run.app](https://ais-pre-5rynuauy3fg3fc6c3betgo-399234863864.us-west1.run.app) no **Google Chrome** do celular e toque em **Instalar App** (ou *Menu ⋮ → Instalar aplicativo*).

### iPhone e iPad (iOS)
- Abra [https://ais-pre-5rynuauy3fg3fc6c3betgo-399234863864.us-west1.run.app](https://ais-pre-5rynuauy3fg3fc6c3betgo-399234863864.us-west1.run.app) no **Safari** → toque em **Compartilhar** → **Adicionar à Tela de Início**.

### Computador (Windows, macOS e Linux)

| Sistema | Executável de Instalação no Repositório | O que faz |
| :--- | :--- | :--- |
| **Windows (10/11)** | [`installers/windows/Instalar-Machenike-Hub.bat`](./installers/windows/Instalar-Machenike-Hub.bat) | Compila o executável nativo **`.exe`** (Electron) ou cria atalho direto na Área de Trabalho. |
| **macOS** | [`installers/macos/Instalar-Machenike-Hub.command`](./installers/macos/Instalar-Machenike-Hub.command) | Duplo clique no Finder para gerar o pacote instalador **`.dmg`**. |
| **Linux** | [`installers/linux/instalar-machenike-hub.sh`](./installers/linux/instalar-machenike-hub.sh) | Gera executável portátil **`.AppImage`** ou instala lançador **`.desktop`** no menu do sistema. |

> **Instalação rápida no PC pelo navegador:** acesse [https://ais-pre-5rynuauy3fg3fc6c3betgo-399234863864.us-west1.run.app](https://ais-pre-5rynuauy3fg3fc6c3betgo-399234863864.us-west1.run.app) no Chrome ou Edge e clique em **Instalar App** no canto superior direito.

---

## Automação no GitHub (APK Automático, Pages & Releases)

Ao enviar este repositório para o GitHub na branch `main`:

1. **Android `.APK` automático** (`.github/workflows/build-android-apk.yml`): compila automaticamente o `Machenike-Hub-Android.apk` assinado na nuvem do GitHub, salva em `releases/Machenike-Hub-Android.apk` dentro do repositório e publica na aba **Releases**.
2. **GitHub Pages** (`.github/workflows/deploy-pages.yml`): publique em *Settings → Pages → Source: GitHub Actions* para ter uma URL HTTPS própria no GitHub.
3. **Executáveis Desktop + Android em Release** (`.github/workflows/build-executables.yml`): execute em *Actions → Build & Publish GitHub Release → Run workflow* ou crie uma tag `v1.0.0` para anexar `.exe`, `.dmg`, `.AppImage` e `.apk` na Release.

---

## Desenvolvimento Local

```bash
npm install      # Instalar dependências
npm run dev      # Iniciar servidor local em http://localhost:3000
npm run lint     # Validar tipos TypeScript
npm run build    # Gerar build de produção (dist/)
```

---

## Licença

Distribuído sob a licença **MIT**. Consulte [`LICENSE`](./LICENSE) para mais informações.
