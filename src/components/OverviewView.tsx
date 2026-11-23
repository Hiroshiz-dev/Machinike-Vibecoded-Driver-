import React, { useState } from 'react';
import {
  ArrowRight,
  Bluetooth,
  Cpu,
  FolderKanban,
  Gamepad2,
  Layers,
  Radio,
  RotateCw,
  Sliders,
  Sun,
  Usb,
  Vibrate,
} from 'lucide-react';
import {
  ConnectionMode,
  ControllerProfile,
  PhysicalButtonId,
  getButtonsForDevice,
} from '../types/controller';
import { MachenikeDeviceSpec, MachenikeModelId } from '../types/devices';
import { LiveGamepadState } from '../hooks/useGamepad';
import { ControllerDiagram } from './ControllerDiagram';
import { InputTesterPanel } from './InputTesterPanel';
import { DeviceConnectionCard } from './DeviceConnectionCard';

export type ActiveSection = 'overview' | 'profiles' | 'mapping' | 'macros' | 'rgb' | 'driver';

interface OverviewViewProps {
  deviceSpec: MachenikeDeviceSpec;
  profile: ControllerProfile;
  profiles: ControllerProfile[];
  gamepad: LiveGamepadState;
  connectionMessage: string | null;
  onSelectModel: (modelId: MachenikeModelId) => void;
  onSelectTransport: (mode: ConnectionMode) => void;
  onSelectProfile: (id: string) => void;
  onNavigate: (section: ActiveSection) => void;
  onPressVirtualButton: (id: PhysicalButtonId, down: boolean) => void;
  onSetVirtualStick: (side: 'left' | 'right', x: number, y: number) => void;
  onSetVirtualTrigger: (side: 'LT' | 'RT', value: number) => void;
  onTriggerRumble: (left: number, right: number) => void;
  onConnectUsb: () => void;
  onConnect24G: () => void;
  onConnectBluetooth: () => void;
  onScanDevices: () => void;
}

const RGB_MODE_LABELS: Record<string, string> = {
  static: 'Estático',
  breathing: 'Respiração',
  rainbow: 'Onda Arco-íris',
  reactive: 'Reativo ao Input',
  pulse: 'Pulso Suave',
  off: 'Desligado',
};

const CONNECTION_LABELS: Record<ConnectionMode, string> = {
  usb: 'Cabo USB (Com Fio)',
  dongle24g: 'Dongle 2.4 GHz (USB 2.0)',
  bluetooth: 'Bluetooth',
};

export const OverviewView: React.FC<OverviewViewProps> = ({
  deviceSpec,
  profile,
  profiles,
  gamepad,
  connectionMessage,
  onSelectModel,
  onSelectTransport,
  onSelectProfile,
  onNavigate,
  onPressVirtualButton,
  onSetVirtualStick,
  onSetVirtualTrigger,
  onTriggerRumble,
  onConnectUsb,
  onConnect24G,
  onConnectBluetooth,
  onScanDevices,
}) => {
  const [diagramView, setDiagramView] = useState<'front' | 'rear'>('front');

  const deviceButtons = getButtonsForDevice(deviceSpec.extraButtons);

  const turboButtonsCount = deviceButtons.filter(
    (btn) => profile.bindings[btn.id]?.turboEnabled
  ).length;

  const customMappedCount = deviceButtons.filter((btn) => {
    const b = profile.bindings[btn.id];
    if (!b) return false;
    if (b.type !== 'gamepad' || b.turboEnabled) return true;
    if (!['M1', 'M2', 'M3', 'M4'].includes(btn.id) && b.value !== btn.id) return true;
    return false;
  }).length;

  const activeMacroCount = deviceButtons.filter(
    (btn) => profile.bindings[btn.id]?.type === 'macro'
  ).length;

  const activeVibrationEvents = profile.driver.vibrationEvents.filter((e) => e.enabled).length;

  const activeTransport = profile.driver.connectionMode;
  const TransportIcon =
    activeTransport === 'bluetooth'
      ? Bluetooth
      : activeTransport === 'dongle24g'
      ? Radio
      : Usb;

  const extraSummary =
    deviceSpec.extraButtons.length > 0
      ? deviceSpec.extraButtons
          .slice(0, 2)
          .map((id) => `${id}: ${profile.bindings[id]?.label ?? id}`)
          .join(' / ')
      : 'Sem botões extras';

  return (
    <div className="space-y-8">
      {/* Main Hero Workbench Split */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch">
        {/* Dominant Focal Anchor: Interactive Machenike Hardware Canvas */}
        <section className="xl:col-span-8 bg-[#14171E] border border-white/[0.08] rounded-xl p-6 flex flex-col justify-between">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-white/[0.07]">
            <div>
              <h1 className="text-xl font-semibold text-[#F4F6F9] tracking-tight">
                {deviceSpec.name}
              </h1>
              <p className="text-xs text-[#8B95A8] mt-1 font-mono tabular-nums">
                {CONNECTION_LABELS[activeTransport]} · {profile.driver.pollingRate} Hz ·{' '}
                {deviceSpec.stickTech} ·{' '}
                {gamepad.connected || gamepad.hidConnected || gamepad.btConnected
                  ? 'Hardware Conectado'
                  : 'Bancada Interativa'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="inline-flex items-center p-1 bg-[#0C0E12] border border-white/[0.08] rounded-lg">
                <button
                  type="button"
                  onClick={() => setDiagramView('front')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    diagramView === 'front'
                      ? 'bg-[#222733] text-[#F4F6F9]'
                      : 'text-[#8B95A8] hover:text-[#F4F6F9]'
                  }`}
                >
                  Vista Frontal
                </button>
                <button
                  type="button"
                  onClick={() => setDiagramView('rear')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    diagramView === 'rear'
                      ? 'bg-[#222733] text-[#F4F6F9]'
                      : 'text-[#8B95A8] hover:text-[#F4F6F9]'
                  }`}
                >
                  {deviceSpec.extraButtons.includes('M1') ? 'Traseira (M1 / M2)' : 'Vista Traseira'}
                </button>
              </div>
              <button
                type="button"
                onClick={() => setDiagramView((v) => (v === 'front' ? 'rear' : 'front'))}
                className="p-2 text-[#8B95A8] hover:text-[#F4F6F9] bg-[#0C0E12] border border-white/[0.08] rounded-lg transition-colors cursor-pointer"
                title="Alternar vista frontal e traseira"
              >
                <RotateCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="py-4 flex-1 flex items-center justify-center">
            <ControllerDiagram
              view={diagramView}
              deviceSpec={deviceSpec}
              rgb={profile.rgb}
              abxyLayout={profile.driver.abxyLayout}
              bindings={profile.bindings}
              pressedButtons={gamepad.pressedButtons}
              leftStick={gamepad.leftStick}
              rightStick={gamepad.rightStick}
              ltValue={gamepad.ltValue}
              rtValue={gamepad.rtValue}
              lastEventTime={gamepad.lastEventTime}
              rumbleActive={gamepad.rumbleActive}
              interactiveMode="test"
              onPressButton={onPressVirtualButton}
              showBindingTags
            />
          </div>

          <div className="pt-4 border-t border-white/[0.07] flex flex-wrap items-center justify-between gap-4 text-xs text-[#8B95A8]">
            <span>{deviceSpec.tagline}</span>
            <div className="flex items-center gap-4 font-mono tabular-nums text-[#C9D1E0]">
              <span>
                LS ({gamepad.leftStick.x.toFixed(2)}, {gamepad.leftStick.y.toFixed(2)})
              </span>
              <span aria-hidden="true" className="text-[#4B5567]">/</span>
              <span>
                RS ({gamepad.rightStick.x.toFixed(2)}, {gamepad.rightStick.y.toFixed(2)})
              </span>
              <span aria-hidden="true" className="text-[#4B5567]">/</span>
              <span>
                Ativos:{' '}
                {gamepad.pressedButtons.size > 0
                  ? [...gamepad.pressedButtons].join(', ')
                  : 'Nenhum'}
              </span>
            </div>
          </div>
        </section>

        {/* Right Side: Hardware Connection & Active Profile Summary */}
        <aside className="xl:col-span-4 bg-[#14171E] border border-white/[0.08] rounded-xl p-6 flex flex-col justify-between gap-6">
          <div className="space-y-5">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-base font-semibold text-[#F4F6F9]">Driver e Perfil Ativo</h2>
              <span className="text-xs font-mono text-[#F97316] truncate max-w-[140px]">
                {profile.name}
              </span>
            </div>

            <div className="space-y-3 text-sm border-y border-white/[0.07] py-4">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[#8B95A8]">Modelo Ativo</span>
                <span className="text-[#F4F6F9] font-medium truncate max-w-[195px]">
                  {deviceSpec.name}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-[#8B95A8]">Interface</span>
                <span className="inline-flex items-center gap-1.5 font-mono text-xs text-[#F4F6F9]">
                  <TransportIcon className="w-3.5 h-3.5 text-[#F97316]" />
                  {CONNECTION_LABELS[activeTransport]}
                  {gamepad.batteryPercent !== null ? ` · ${gamepad.batteryPercent}%` : ''}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-[#8B95A8]">Modo Turbina</span>
                <span className="font-mono tabular-nums text-[#F4F6F9]">
                  {turboButtonsCount} {turboButtonsCount === 1 ? 'botão' : 'botões'} ativos
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-[#8B95A8]">Vibração Háptica</span>
                <span className="font-mono tabular-nums text-[#F4F6F9]">
                  {profile.driver.vibrationEnabled
                    ? `${profile.driver.vibrationLeft}% / ${profile.driver.vibrationRight}% · ${activeVibrationEvents} eventos`
                    : 'Silenciada'}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-[#8B95A8]">Botões Extras</span>
                <span className="font-mono text-xs text-[#38BDF8] truncate max-w-[190px]">
                  {extraSummary}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-2.5">
              <button
                type="button"
                onClick={onScanDevices}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg bg-[#1E232E] hover:bg-[#262D3B] text-[#F4F6F9] border border-white/[0.08] transition-colors cursor-pointer"
              >
                <TransportIcon className="w-4 h-4 text-[#F97316]" />
                Detectar Controle (USB / 2.4G / BT)
              </button>
              <button
                type="button"
                onClick={() =>
                  onTriggerRumble(profile.driver.vibrationLeft, profile.driver.vibrationRight)
                }
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg bg-[#0C0E12] hover:bg-[#1A1F29] text-[#D1D7E2] border border-white/[0.08] transition-colors cursor-pointer"
              >
                <Vibrate className="w-4 h-4 text-[#8B95A8]" />
                Testar Vibração Dual-Motor ({profile.driver.vibrationLeft}% /{' '}
                {profile.driver.vibrationRight}%)
              </button>
            </div>
          </div>

          {/* Quick Module Links */}
          <div className="pt-4 border-t border-white/[0.07] space-y-1">
            <p className="text-xs font-medium text-[#8B95A8] mb-2">Acesso Rápido</p>
            {[
              {
                section: 'profiles' as ActiveSection,
                label: 'Perfis de Jogo',
                meta: `${profiles.length} perfis salvos`,
                icon: FolderKanban,
              },
              {
                section: 'mapping' as ActiveSection,
                label: 'Mapeamento e Modo Turbina',
                meta: `${customMappedCount} remapeados · ${turboButtonsCount} turbina`,
                icon: Gamepad2,
              },
              {
                section: 'macros' as ActiveSection,
                label: 'Estúdio de Macros do Perfil',
                meta: `${profile.macros.length} macros · ${activeMacroCount} vinculadas`,
                icon: Layers,
              },
              {
                section: 'rgb' as ActiveSection,
                label: 'Iluminação RGB',
                meta: `${RGB_MODE_LABELS[profile.rgb.mode]} · ${deviceSpec.rgbZones} ${
                  deviceSpec.rgbZones === 1 ? 'zona' : 'zonas'
                }`,
                icon: Sun,
              },
              {
                section: 'driver' as ActiveSection,
                label: 'Vibração por Evento e Driver',
                meta: `${activeVibrationEvents} eventos · ${profile.driver.pollingRate} Hz`,
                icon: Sliders,
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.section}
                  type="button"
                  onClick={() => onNavigate(item.section)}
                  className="w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg hover:bg-[#1D222D] text-left transition-colors group cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon className="w-4 h-4 text-[#8B95A8] group-hover:text-[#F97316] shrink-0 transition-colors" />
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-[#E5E9F0] truncate">
                        {item.label}
                      </div>
                      <div className="text-xs text-[#7B8598] font-mono tabular-nums">
                        {item.meta}
                      </div>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-[#5A6376] group-hover:text-[#F4F6F9] shrink-0 transition-colors" />
                </button>
              );
            })}
          </div>
        </aside>
      </div>

      {/* Multi-Transport Auto-Recognition & Machenike Model Hub */}
      <DeviceConnectionCard
        activeDevice={deviceSpec}
        activeTransport={activeTransport}
        gamepad={gamepad}
        connectionMessage={connectionMessage}
        onSelectModel={onSelectModel}
        onSelectTransport={onSelectTransport}
        onConnectUsb={onConnectUsb}
        onConnect24G={onConnect24G}
        onConnectBluetooth={onConnectBluetooth}
        onScanDevices={onScanDevices}
      />

      {/* Real-Time Visual Input Tester (Buttons, Analog Sticks, Triggers & Event Feed) */}
      <InputTesterPanel
        deviceSpec={deviceSpec}
        profile={profile}
        gamepad={gamepad}
        onPressVirtualButton={onPressVirtualButton}
        onSetVirtualStick={onSetVirtualStick}
        onSetVirtualTrigger={onSetVirtualTrigger}
      />

      {/* Saved Game Profiles Quick Switcher Row */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-[#F4F6F9]">Perfis de Jogo Salvos</h2>
            <p className="text-xs text-[#8B95A8] mt-0.5">
              Troque rapidamente entre seus perfis configurados ou abra o gerenciador para criar, editar e excluir perfis.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-xs text-[#8B95A8] font-mono tabular-nums">
              <Cpu className="w-3.5 h-3.5" />
              <span>{profiles.length} perfis</span>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('profiles')}
              className="text-xs font-medium text-[#F97316] hover:underline whitespace-nowrap cursor-pointer"
            >
              Gerenciar Perfis
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {profiles.slice(0, 8).map((p, index) => {
            const isActive = p.id === profile.id;
            const turboCount = deviceButtons.filter(
              (b) => p.bindings[b.id]?.turboEnabled
            ).length;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => onSelectProfile(p.id)}
                className={`text-left p-4 rounded-xl border transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-[#1A1F2A] border-[#F97316]'
                    : 'bg-[#14171E] border-white/[0.08] hover:border-white/20'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="font-mono text-xs text-[#8B95A8] tabular-nums">
                    Perfil {String(index + 1).padStart(2, '0')}
                  </span>
                  <span
                    className={`text-xs font-medium ${
                      isActive ? 'text-[#F97316]' : 'text-[#6D778B]'
                    }`}
                  >
                    {isActive ? 'Ativo' : 'Carregar'}
                  </span>
                </div>
                <div className="text-sm font-semibold text-[#F4F6F9] truncate">{p.name}</div>
                <div className="text-xs text-[#8B95A8] mt-1 truncate">{p.gameTitle}</div>
                <div className="mt-3 pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs font-mono tabular-nums text-[#9EA7B8]">
                  <span>{turboCount} turbina</span>
                  <span>{p.macros.length} macros</span>
                  <span>{RGB_MODE_LABELS[p.rgb.mode]}</span>
                </div>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
};
