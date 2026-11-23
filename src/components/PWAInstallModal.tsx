import React, { useState } from 'react';
import {
  Check,
  Copy,
  Download,
  Github,
  Monitor,
  Smartphone,
  Terminal,
  X,
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

type InstallTab = 'desktop' | 'mobile' | 'github';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, isMobile, install } = usePWAInstall();
  const [modalOpen, setModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<InstallTab>(isMobile ? 'mobile' : 'desktop');
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);

  const handlePrimaryClick = async () => {
    if (isInstallable) {
      const accepted = await install();
      if (!accepted) {
        setActiveTab(isMobile ? 'mobile' : 'desktop');
        setModalOpen(true);
      }
      return;
    }
    setActiveTab(isMobile ? 'mobile' : 'desktop');
    setModalOpen(true);
  };

  const handleCopy = (id: string, text: string) => {
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).catch(() => {});
    }
    setCopiedCmd(id);
    window.setTimeout(() => setCopiedCmd(null), 2000);
  };

  // Hide the standalone install button if already running as an installed app,
  // unless user opens it via sidebar; keep compact GitHub/Executáveis trigger available.
  return (
    <>
      {!isInstalled && (
        <button
          type="button"
          onClick={handlePrimaryClick}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold bg-[#181D27] hover:bg-[#222938] text-[#F4F6F9] border border-white/[0.1] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Download className="w-3.5 h-3.5 text-[#F97316]" />
          <span className="hidden sm:inline">
            {isInstallable ? 'Instalar App' : 'App PC / Celular'}
          </span>
          <span className="sm:hidden">Instalar</span>
        </button>
      )}

      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"
          onClick={() => setModalOpen(false)}
        >
          <div
            className="w-full max-w-xl bg-[#14171E] border border-white/[0.1] rounded-xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-white/[0.08] flex items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-display font-semibold text-[#F4F6F9]">
                  Executar no Computador, Celular e GitHub
                </h2>
                <p className="text-xs text-[#8B95A8] mt-0.5">
                  Instale como aplicativo nativo offline (PWA) ou gere executáveis via GitHub Actions.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1.5 text-[#8B95A8] hover:text-white rounded-md cursor-pointer"
                aria-label="Fechar janela de instalação"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Platform Tabs */}
            <div className="px-6 pt-4">
              <div className="grid grid-cols-3 gap-1 p-1 bg-[#0C0E12] border border-white/[0.08] rounded-lg">
                <button
                  type="button"
                  onClick={() => setActiveTab('desktop')}
                  className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                    activeTab === 'desktop'
                      ? 'bg-[#222733] text-[#F97316]'
                      : 'text-[#8B95A8] hover:text-[#F4F6F9]'
                  }`}
                >
                  <Monitor className="w-3.5 h-3.5" />
                  <span>Computador</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('mobile')}
                  className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                    activeTab === 'mobile'
                      ? 'bg-[#222733] text-[#F97316]'
                      : 'text-[#8B95A8] hover:text-[#F4F6F9]'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Celular</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('github')}
                  className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                    activeTab === 'github'
                      ? 'bg-[#222733] text-[#F97316]'
                      : 'text-[#8B95A8] hover:text-[#F4F6F9]'
                  }`}
                >
                  <Github className="w-3.5 h-3.5" />
                  <span>GitHub & Build</span>
                </button>
              </div>
            </div>

            {/* Tab Content */}
            <div className="p-6 space-y-4 text-xs text-[#C6CEDB]">
              {activeTab === 'desktop' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-lg bg-[#0C0E12] border border-white/[0.08] space-y-2.5">
                    <div className="text-sm font-semibold text-[#F4F6F9]">
                      Windows, macOS e Linux — App Instalável (Chrome / Edge)
                    </div>
                    <p className="text-[#8B95A8] leading-relaxed">
                      Executa em janela própria sem barra do navegador, funciona offline e mantém
                      suporte completo a <strong className="text-[#E2E8F0]">USB-C (WebHID)</strong>,{' '}
                      <strong className="text-[#E2E8F0]">Receptor 2.4 GHz</strong> e{' '}
                      <strong className="text-[#E2E8F0]">Bluetooth</strong>.
                    </p>
                    {isInstallable ? (
                      <button
                        type="button"
                        onClick={async () => {
                          await install();
                          setModalOpen(false);
                        }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#F97316] hover:bg-[#EA6A0E] text-[#0C0E12] font-semibold transition-colors cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Instalar Agora no Computador
                      </button>
                    ) : (
                      <ol className="list-decimal list-inside space-y-1.5 text-[#CBD3E1]">
                        <li>
                          Abra a URL publicada (GitHub Pages ou servidor local) no{' '}
                          <strong className="text-white">Google Chrome</strong> ou{' '}
                          <strong className="text-white">Microsoft Edge</strong>.
                        </li>
                        <li>
                          Clique no ícone de <strong className="text-white">Instalar aplicativo</strong>{' '}
                          na barra de endereços ou em Menu &gt; Salvar e compartilhar &gt; Instalar.
                        </li>
                        <li>
                          Um atalho nativo será criado na Área de Trabalho e no Menu Iniciar / Launchpad.
                        </li>
                      </ol>
                    )}
                  </div>

                  <div className="p-4 rounded-lg bg-[#0C0E12] border border-white/[0.08] space-y-3">
                    <div className="text-sm font-semibold text-[#F4F6F9]">
                      Executáveis de Instalação para Computador (.BAT / .COMMAND / .SH / .EXE)
                    </div>
                    <p className="text-[#8B95A8] leading-relaxed">
                      Baixe o instalador correspondente ao seu sistema (também disponível na pasta{' '}
                      <code className="font-mono text-[#E2E8F0]">installers/</code> do repositório
                      GitHub) para gerar o executável nativo <strong className="text-[#E2E8F0]">.EXE</strong>,{' '}
                      <strong className="text-[#E2E8F0]">.DMG</strong> ou{' '}
                      <strong className="text-[#E2E8F0]">.AppImage</strong> com suporte a USB,
                      Dongle 2.4 GHz e Bluetooth:
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <a
                        href={`${import.meta.env.BASE_URL}installers/windows/Instalar-Machenike-Hub.bat`}
                        download="Instalar-Machenike-Hub.bat"
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[#1A1F2B] hover:bg-[#232A3A] border border-white/[0.1] text-[#F4F6F9] font-medium transition-colors"
                      >
                        <Download className="w-3.5 h-3.5 text-[#F97316]" />
                        Windows (.bat)
                      </a>
                      <a
                        href={`${import.meta.env.BASE_URL}installers/macos/Instalar-Machenike-Hub.command`}
                        download="Instalar-Machenike-Hub.command"
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[#1A1F2B] hover:bg-[#232A3A] border border-white/[0.1] text-[#F4F6F9] font-medium transition-colors"
                      >
                        <Download className="w-3.5 h-3.5 text-[#F97316]" />
                        macOS (.command)
                      </a>
                      <a
                        href={`${import.meta.env.BASE_URL}installers/linux/instalar-machenike-hub.sh`}
                        download="instalar-machenike-hub.sh"
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[#1A1F2B] hover:bg-[#232A3A] border border-white/[0.1] text-[#F4F6F9] font-medium transition-colors"
                      >
                        <Download className="w-3.5 h-3.5 text-[#F97316]" />
                        Linux (.sh)
                      </a>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'mobile' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-lg bg-[#0C0E12] border border-white/[0.08] space-y-2.5">
                    <div className="text-sm font-semibold text-[#F4F6F9]">
                      Android (Instalação Direta PWA ou APK Nativo)
                    </div>
                    {isInstallable && !isIOS ? (
                      <button
                        type="button"
                        onClick={async () => {
                          await install();
                          setModalOpen(false);
                        }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#F97316] hover:bg-[#EA6A0E] text-[#0C0E12] font-semibold transition-colors cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Instalar no Android
                      </button>
                    ) : (
                      <ol className="list-decimal list-inside space-y-1.5 text-[#CBD3E1]">
                        <li>
                          Abra o app no <strong className="text-white">Google Chrome</strong> no
                          celular.
                        </li>
                        <li>
                          Toque no menu <strong className="text-white">⋮</strong> e selecione{' '}
                          <strong className="text-white">Instalar aplicativo</strong> ou{' '}
                          <strong className="text-white">Adicionar à tela inicial</strong>.
                        </li>
                        <li>
                          Conecte seu controle Machenike via <strong className="text-white">Bluetooth</strong>{' '}
                          ou cabo <strong className="text-white">USB-C OTG</strong>.
                        </li>
                      </ol>
                    )}
                    <p className="text-[11px] text-[#7D879B] leading-relaxed pt-1">
                      O arquivo <strong className="text-[#CBD3E1]">Machenike-Hub-Android.apk</strong>{' '}
                      é compilado e publicado automaticamente em{' '}
                      <code className="font-mono text-[#E2E8F0]">releases/Machenike-Hub-Android.apk</code>{' '}
                      e na aba <strong className="text-[#CBD3E1]">Releases</strong> ao subir o
                      repositório no GitHub.
                    </p>
                  </div>

                  <div className="p-4 rounded-lg bg-[#0C0E12] border border-white/[0.08] space-y-2">
                    <div className="text-sm font-semibold text-[#F4F6F9]">
                      iPhone e iPad (iOS Safari)
                    </div>
                    <ol className="list-decimal list-inside space-y-1.5 text-[#CBD3E1]">
                      <li>
                        Abra o link publicado no navegador <strong className="text-white">Safari</strong>.
                      </li>
                      <li>
                        Toque no botão <strong className="text-white">Compartilhar</strong> na barra
                        inferior.
                      </li>
                      <li>
                        Role e toque em{' '}
                        <strong className="text-white">Adicionar à Tela de Início</strong> para
                        executar em tela cheia como app nativo.
                      </li>
                    </ol>
                  </div>
                </div>
              )}

              {activeTab === 'github' && (
                <div className="space-y-3.5">
                  <div className="p-4 rounded-lg bg-[#0C0E12] border border-white/[0.08] space-y-2.5">
                    <div className="flex items-center gap-2 text-sm font-semibold text-[#F4F6F9]">
                      <Terminal className="w-4 h-4 text-[#F97316]" />
                      Publicar no GitHub (Pages + Releases Automáticas)
                    </div>
                    <p className="text-[#8B95A8] leading-relaxed">
                      O repositório já possui workflows configurados em{' '}
                      <code className="font-mono text-[#E2E8F0]">.github/workflows/</code>:
                    </p>
                    <ul className="space-y-1 text-[#CBD3E1] list-disc list-inside">
                      <li>
                        <code className="font-mono text-[#F97316]">deploy-pages.yml</code> — publica
                        automaticamente o PWA HTTPS no GitHub Pages a cada push na branch{' '}
                        <code className="font-mono">main</code>.
                      </li>
                      <li>
                        <code className="font-mono text-[#F97316]">build-executables.yml</code> —
                        gera executáveis Windows (<code className="font-mono">.exe</code>), macOS (
                        <code className="font-mono">.dmg</code>), Linux (
                        <code className="font-mono">.AppImage</code>) e Android (
                        <code className="font-mono">.apk</code>) ao publicar uma tag{' '}
                        <code className="font-mono">v*</code>.
                      </li>
                    </ul>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[11px] text-[#8B95A8]">
                      <span>Comandos para subir no seu GitHub e disparar a release</span>
                      <button
                        type="button"
                        onClick={() =>
                          handleCopy(
                            'git',
                            'git init && git add . && git commit -m "feat: Machenike Hub PC & Mobile" && git branch -M main && git remote add origin https://github.com/SEU_USUARIO/machenike-hub.git && git push -u origin main && git tag v1.0.0 && git push origin v1.0.0'
                          )
                        }
                        className="inline-flex items-center gap-1 text-[#F97316] hover:underline cursor-pointer"
                      >
                        {copiedCmd === 'git' ? (
                          <>
                            <Check className="w-3 h-3" /> Copiado
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" /> Copiar comandos
                          </>
                        )}
                      </button>
                    </div>
                    <pre className="p-3 rounded-lg bg-[#090B0E] border border-white/[0.08] font-mono text-[11px] text-[#CBD3E1] overflow-x-auto leading-relaxed">
{`git init
git add .
git commit -m "feat: Machenike Hub PC & Mobile"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/machenike-hub.git
git push -u origin main

# Gerar executáveis (.exe, .dmg, .AppImage e .apk) no GitHub Releases:
git tag v1.0.0
git push origin v1.0.0`}
                    </pre>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-3.5 border-t border-white/[0.08] bg-[#101319] flex items-center justify-between gap-3">
              <span className="text-[11px] text-[#7D879B]">
                Compatível com Chrome, Edge, Android, iOS Safari, Windows, macOS e Linux.
              </span>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="px-3.5 py-1.5 rounded-lg bg-[#222733] hover:bg-[#2C3344] text-xs font-medium text-[#F4F6F9] transition-colors cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
