# Machenike Hub — Controlador de Recursos, Drivers & Perfis

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
- **Iluminação RGB Multizona**: configure efeitos *Estático*, *Respiração*, *Arco-íris*, *Reativo*, *Pulso* ou *Desligado*, com controle de brilho, velocidade, direção e cores individuais por zona.
- **Vibração Háptica & Calibração Hall-Effect**: controle independente dos motores esquerdo (graves) e direito (agudos), criador de padrões rítmicos de vibração multipasso e vinculação a eventos do jogo (tiro, explosão, dano, colisão, habilidade). Calibre deadzones interna/externa, curva de resposta dos analógicos, Hair Trigger, taxa de polling (até 1000 Hz) e giroscópio.

---

## Como Utilizar (Passo a Passo)

### 1. Conectar seu Controle Machenike
1. Plugue o **Receptor 2.4 GHz (Dongle USB 2.0)** em uma porta USB da placa-mãe (ou conecte via **Cabo USB** / **Bluetooth**).
2. Ligue o controle e pressione qualquer botão (como `A` ou `Home`) para acordá-lo.
3. Na aba **Visão Geral**, o painel **Reconhecimento de Controles Machenike** exibirá o dispositivo detectado.
   - Se o dongle 2.4 GHz USB 2.0 se anunciar como controle X-Input genérico, selecione **Receptor 2.4 GHz** (ou **Cabo USB** se estiver no fio) no card de conexão ou no banner superior — sua escolha fica memorizada automaticamente para futuras sessões.
   - Para modelos sem identificação explícita no nome X-Input, confirme o modelo no seletor da barra lateral esquerda.

### 2. Testar Botões, Analógicos e Gatilhos
1. Ainda em **Visão Geral**, role até o painel **Teste de Input em Tempo Real**.
2. Pressione botões, gire os analógicos e aperte os gatilhos `LT` e `RT` no controle físico (ou clique nos controles virtuais) para inspecionar precisão, centralização e resposta instantânea.

### 3. Criar e Trocar Perfis de Jogo
1. Acesse **Perfis de Jogo** no menu lateral (ou na barra inferior no celular).
2. Clique em **Novo Perfil**, informe o nome, jogo e categoria, e escolha partir da configuração atual ou de fábrica.
3. Use a barra lateral para alternar rapidamente entre perfis e clique em **Salvar e Aplicar** no cabeçalho superior para gravar as alterações.

### 4. Remapear Botões e Ativar o Modo Turbina
1. Abra **Mapeamento & Turbina**.
2. Na aba **Remapeamento**, clique em um botão no diagrama (alterne entre *Frente* e *Traseira* para acessar `M1`/`M2`) e escolha o destino: *Controle*, *Macro*, *Teclado*, *Mouse* ou *Desativar*.
3. Na aba **Modo Turbina**, ative a chave do botão desejado, escolha o modo (*Segurar* ou *Automático*), ajuste a frequência de **1 a 30 Hz** e valide no botão **Testar Cadência**.

### 5. Gravar e Atribuir Macros
1. Entre em **Macros** e clique em **Nova Macro**.
2. Clique em **Gravar Sequência** e pressione a combinação de botões no controle ou teclado (ou use **Adicionar Passo** para edição manual em `ms`).
3. Em **Vincular Diretamente a um Botão / Paddle**, selecione o botão desejado (ex.: `M1`) e clique em **Atribuir**.

### 6. Ajustar Iluminação RGB, Vibração e Calibração
- Em **Iluminação RGB**, selecione o efeito, brilho, velocidade e clique em cada zona para definir cores personalizadas.
- Em **Vibração & Driver**, ajuste a força dos motores, crie padrões próprios no **Construtor de Padrões de Vibração**, associe eventos do jogo e calibre as zonas mortas e curvas Hall-Effect dos analógicos e gatilhos.

---

## Executáveis de Instalação (Computador e Celular)

O repositório já inclui **executáveis instaladores prontos** na pasta `installers/`, além de instalação direta como aplicativo offline (**PWA**) e compilação automática de binários via **GitHub Releases**.

### Computador (Windows, macOS e Linux)

| Sistema | Executável de Instalação no Repositório | O que faz |
| :--- | :--- | :--- |
| **Windows (10/11)** | [`installers/windows/Instalar-Machenike-Hub.bat`](./installers/windows/Instalar-Machenike-Hub.bat) | Duplo clique para compilar o instalador nativo **`.exe`** (Electron) ou criar atalho direto na Área de Trabalho. |
| **macOS** | [`installers/macos/Instalar-Machenike-Hub.command`](./installers/macos/Instalar-Machenike-Hub.command) | Duplo clique no Finder para compilar o pacote instalador **`.dmg`** na pasta `release/`. |
| **Linux** | [`installers/linux/instalar-machenike-hub.sh`](./installers/linux/instalar-machenike-hub.sh) | Gera executável portátil **`.AppImage`** ou instala lançador nativo **`.desktop`** no menu do sistema. |

> **Instalação rápida sem compilar (PC):** abra o app hospedado no GitHub Pages usando **Google Chrome** ou **Microsoft Edge** e clique no botão **Instalar App** no cabeçalho superior. O aplicativo abre em janela própria, funciona offline e mantém acesso completo a USB, Dongle 2.4 GHz e Bluetooth.

### Celular (Android e iPhone / iPad)

| Plataforma | Instalador / Método | Como instalar |
| :--- | :--- | :--- |
| **Android (APK via Windows)** | [`installers/android/Gerar-APK-Android.bat`](./installers/android/Gerar-APK-Android.bat) | Compila e gera `release/Machenike-Hub-Android.apk` pronto para transferir e instalar no celular. |
| **Android (APK via Linux/macOS)** | [`installers/android/gerar-apk-android.sh`](./installers/android/gerar-apk-android.sh) | Compila e gera `release/Machenike-Hub-Android.apk` via Capacitor + Gradle. |
| **Android (Direto no Chrome)** | Instalador PWA integrado no app | Abra no Chrome do celular e toque em **Instalar App** (ou *Menu ⋮ → Instalar aplicativo*). |
| **iPhone / iPad (iOS)** | Instalador PWA via Safari | Abra no Safari → toque em **Compartilhar** → **Adicionar à Tela de Início**. |

---

## Publicação Automática no GitHub (Pages + Releases `.exe` / `.dmg` / `.AppImage` / `.apk`)

1. Suba o repositório para sua conta no GitHub:

```bash
git init
git add .
git commit -m "feat: Machenike Hub completo (PC e Celular)"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/machenike-hub.git
git push -u origin main
```

2. **GitHub Pages (App Instalável PC e Celular em HTTPS)**:
   - No repositório, acesse **Settings → Pages → Build and deployment → Source: GitHub Actions**.
   - O workflow `.github/workflows/deploy-pages.yml` publicará automaticamente o aplicativo em `https://SEU_USUARIO.github.io/machenike-hub/`.

3. **GitHub Releases (Binários prontos para download sem precisar instalar Node/Java no PC do usuário)**:
   - Crie e envie uma tag de versão:

```bash
git tag v1.0.0
git push origin v1.0.0
```

   - O workflow `.github/workflows/build-executables.yml` compila automaticamente na nuvem e publica na aba **Releases** do seu GitHub:
     - Instalador Windows (`.exe`) e Executável Portátil (`.exe`)
     - Instalador macOS (`.dmg`)
     - Executável Linux (`.AppImage`)
     - Pacote Android (`.apk`)

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
