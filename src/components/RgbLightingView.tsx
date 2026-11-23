import React, { useEffect, useState } from 'react';
import { BatteryCharging, Bluetooth, Send, Sparkles, Sun, Usb, Zap } from 'lucide-react';
import {
  ControllerProfile,
  DockConfig,
  DockRgbMode,
  PhysicalButtonId,
  RgbConfig,
  RgbMode,
  RgbZoneColors,
} from '../types/controller';
import { MachenikeDeviceSpec } from '../types/devices';
import { LiveGamepadState } from '../hooks/useGamepad';
import { resolveDockRgbColor } from '../utils/rgbProtocol';
import { ControllerDiagram } from './ControllerDiagram';

interface RgbLightingViewProps {
  deviceSpec: MachenikeDeviceSpec;
  profile: ControllerProfile;
  gamepad: LiveGamepadState;
  onUpdateRgb: (rgb: RgbConfig) => void;
  onUpdateDock: (dock: DockConfig) => void;
  onPulseButton: (btn: PhysicalButtonId) => void;
  onApplyRgbToHardware: () => void;
  onApplyDockRgbToHardware: () => void;
  onConnectHid: () => void;
  onConnectDock: () => void;
  onConnectBluetooth: () => void;
}

const RGB_MODES: Array<{ id: RgbMode; title: string; subtitle: string }> = [
  { id: 'static', title: 'Estático', subtitle: 'Cor contínua de alta precisão' },
  { id: 'breathing', title: 'Respiração', subtitle: 'Transição suave de intensidade' },
  { id: 'rainbow', title: 'Onda Arco-íris', subtitle: 'Ciclo espectral nas três zonas' },
  { id: 'reactive', title: 'Reativo ao Input', subtitle: 'Brilha instantaneamente ao pressionar' },
  { id: 'pulse', title: 'Pulso Rítmico', subtitle: 'Disparo rápido com decaimento' },
  { id: 'off', title: 'Desligado', subtitle: 'Economia máxima de bateria' },
];

const HARDWARE_SWATCHES: Array<{ name: string; hex: string }> = [
  { name: 'Âmbar Machenike', hex: '#F97316' },
  { name: 'Ciano Gelo', hex: '#38BDF8' },
  { name: 'Branco Titânio', hex: '#F4F6F9' },
  { name: 'Carmesim', hex: '#EF4444' },
  { name: 'Esmeralda', hex: '#22C55E' },
  { name: 'Ouro Solar', hex: '#FACC15' },
  { name: 'Azul Cobalto', hex: '#3B82F6' },
  { name: 'Turquesa', hex: '#14B8A6' },
  { name: 'Coral', hex: '#FB7185' },
  { name: 'Índigo', hex: '#6366F1' },
];

type ZoneKey = keyof RgbZoneColors;

export const RgbLightingView: React.FC<RgbLightingViewProps> = ({
  deviceSpec,
  profile,
  gamepad,
  onUpdateRgb,
  onUpdateDock,
  onPulseButton,
  onApplyRgbToHardware,
  onApplyDockRgbToHardware,
  onConnectHid,
  onConnectDock,
  onConnectBluetooth,
}) => {
  const [activeZone, setActiveZone] = useState<ZoneKey>(
    deviceSpec.rgbZones === 1 ? 'centerRing' : 'leftStrip'
  );
  const [diagramView, setDiagramView] = useState<'front' | 'rear'>('front');
  const { rgb, dock } = profile;

  useEffect(() => {
    if (deviceSpec.rgbZones === 1) {
      setActiveZone('centerRing');
    }
  }, [deviceSpec.rgbZones]);

  const zoneLabels =
    deviceSpec.rgbStyle === 'rings'
      ? { left: 'Anel Analógico Esq.', center: 'Anel Central Home', right: 'Anel Analógico Dir.' }
      : { left: 'Faixa Esquerda', center: 'Anel Central Home', right: 'Faixa Direita' };

  const activeColor =
    rgb.syncZones || deviceSpec.rgbZones === 1
      ? deviceSpec.rgbZones === 1 && !rgb.syncZones
        ? rgb.zones.centerRing
        : rgb.zones.leftStrip
      : rgb.zones[activeZone];

  const [hexDraft, setHexDraft] = useState(activeColor.toUpperCase());

  useEffect(() => {
    setHexDraft(activeColor.toUpperCase());
  }, [activeColor]);

  const handleColorChange = (hex: string) => {
    const normalized = hex.startsWith('#') ? hex : `#${hex}`;
    if (rgb.syncZones || deviceSpec.rgbZones === 1) {
      onUpdateRgb({
        ...rgb,
        zones: { leftStrip: normalized, rightStrip: normalized, centerRing: normalized },
      });
    } else {
      onUpdateRgb({
        ...rgb,
        zones: { ...rgb.zones, [activeZone]: normalized },
      });
    }
  };

  const batteryPct = Math.max(0, Math.min(100, Math.round(gamepad.batteryPercent ?? 68)));
  const remainingPct = Math.max(0, 100 - batteryPct);
  const effectiveDockColor = resolveDockRgbColor(dock, rgb, batteryPct);

  const dockModeOptions: Array<{ id: DockRgbMode; title: string; subtitle: string }> = [
    { id: 'battery-indicator', title: 'Indicador de Bateria', subtitle: 'Cor varia conforme % de carga' },
    { id: 'sync', title: 'Sincronizado', subtitle: 'Espelha a cor ativa do controle' },
    { id: 'static', title: 'Estático', subtitle: 'Cor fixa na faixa da base' },
    { id: 'breathing', title: 'Respiração', subtitle: 'Pulso contínuo de brilho' },
    { id: 'rainbow', title: 'Arco-íris', subtitle: 'Ciclo RGB na base magnética' },
    { id: 'off', title: 'Desligado', subtitle: 'LEDs da base apagados' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch">
      {/* Live Multi-Zone RGB Preview Focal Anchor */}
      <section className="xl:col-span-7 bg-[#14171E] border border-white/[0.08] rounded-xl p-6 flex flex-col justify-between">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-white/[0.07]">
          <div>
            <h1 className="text-lg font-semibold text-[#F4F6F9]">
              Iluminação RGB · {deviceSpec.name}
            </h1>
            <p className="text-xs text-[#8B95A8] mt-0.5 font-mono tabular-nums">
              {deviceSpec.rgbZones === 1
                ? `Zona Única (LED Central): ${(rgb.syncZones ? rgb.zones.leftStrip : rgb.zones.centerRing).toUpperCase()}`
                : `${zoneLabels.left} ${rgb.zones.leftStrip.toUpperCase()} · ${zoneLabels.center} ${(rgb.syncZones ? rgb.zones.leftStrip : rgb.zones.centerRing).toUpperCase()} · ${zoneLabels.right} ${(rgb.syncZones ? rgb.zones.leftStrip : rgb.zones.rightStrip).toUpperCase()}`}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onPulseButton('A')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-[#1E232E] hover:bg-[#272E3D] text-[#F4F6F9] border border-white/[0.08] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5 text-[#F97316]" />
              Simular Flash Reativo
            </button>

            <div className="inline-flex items-center p-1 bg-[#0C0E12] border border-white/[0.08] rounded-lg">
              <button
                type="button"
                onClick={() => setDiagramView('front')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                  diagramView === 'front' ? 'bg-[#222733] text-[#F4F6F9]' : 'text-[#8B95A8]'
                }`}
              >
                Frente
              </button>
              <button
                type="button"
                onClick={() => setDiagramView('rear')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                  diagramView === 'rear' ? 'bg-[#222733] text-[#F4F6F9]' : 'text-[#8B95A8]'
                }`}
              >
                Traseira
              </button>
            </div>
          </div>
        </div>

        <div className="py-6 flex-1 flex items-center justify-center">
          <ControllerDiagram
            view={diagramView}
            deviceSpec={deviceSpec}
            rgb={rgb}
            abxyLayout={profile.driver.abxyLayout}
            bindings={profile.bindings}
            pressedButtons={gamepad.pressedButtons}
            leftStick={gamepad.leftStick}
            rightStick={gamepad.rightStick}
            ltValue={gamepad.ltValue}
            rtValue={gamepad.rtValue}
            lastEventTime={gamepad.lastEventTime}
            interactiveMode="test"
            onPressButton={(id, down) => {
              if (down) onPulseButton(id);
            }}
          />
        </div>

        {/* Zone Visual Summary Bar */}
        <div className={`pt-4 border-t border-white/[0.07] grid gap-3 ${deviceSpec.rgbZones === 1 ? 'grid-cols-1' : 'grid-cols-3'}`}>
          {(deviceSpec.rgbZones === 1
            ? [{ key: 'centerRing' as ZoneKey, label: 'LED Central (Zona Única)' }]
            : [
                { key: 'leftStrip' as ZoneKey, label: zoneLabels.left },
                { key: 'centerRing' as ZoneKey, label: zoneLabels.center },
                { key: 'rightStrip' as ZoneKey, label: zoneLabels.right },
              ]
          ).map((z) => {
            const swatch = rgb.syncZones ? rgb.zones.leftStrip : rgb.zones[z.key];
            const selected = !rgb.syncZones && activeZone === z.key;
            return (
              <button
                key={z.key}
                type="button"
                onClick={() => {
                  if (rgb.syncZones) {
                    onUpdateRgb({ ...rgb, syncZones: false });
                  }
                  setActiveZone(z.key);
                }}
                className={`p-3 rounded-lg border text-left transition-colors cursor-pointer ${
                  selected
                    ? 'bg-[#1D212C] border-[#F97316]'
                    : 'bg-[#0C0E12] border-white/[0.08] hover:border-white/20'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-[#E2E8F0] truncate">{z.label}</span>
                  <span
                    className="w-3.5 h-3.5 rounded-sm border border-white/20 shrink-0"
                    style={{ backgroundColor: rgb.mode === 'off' ? '#232834' : swatch }}
                  />
                </div>
                <div className="font-mono text-[11px] text-[#7D879B] mt-1">
                  {rgb.mode === 'off' ? 'Desligado' : swatch.toUpperCase()}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Right Lighting Engine Controls */}
      <aside className="xl:col-span-5 bg-[#14171E] border border-white/[0.08] rounded-xl p-6 space-y-6">
        {/* Effect Modes */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-[#F4F6F9]">Efeito de Iluminação</h2>
          <div className="grid grid-cols-2 gap-2">
            {RGB_MODES.map((m) => {
              const active = rgb.mode === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => onUpdateRgb({ ...rgb, mode: m.id })}
                  className={`p-3 rounded-lg border text-left transition-colors cursor-pointer ${
                    active
                      ? 'bg-[#1F1A17] border-[#F97316]'
                      : 'bg-[#0C0E12] border-white/[0.08] hover:border-white/20'
                  }`}
                >
                  <div className={`text-xs font-semibold ${active ? 'text-[#F97316]' : 'text-[#F4F6F9]'}`}>
                    {m.title}
                  </div>
                  <div className="text-[11px] text-[#7D879B] mt-0.5 leading-snug">{m.subtitle}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Brightness, Speed & Direction */}
        {rgb.mode !== 'off' && (
          <div className="space-y-4 pt-4 border-t border-white/[0.07]">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#9EA7B8]">Intensidade de Brilho</span>
                <span className="font-mono tabular-nums text-[#F4F6F9]">{rgb.brightness}%</span>
              </div>
              <input
                type="range"
                min={5}
                max={100}
                step={5}
                value={rgb.brightness}
                onChange={(e) => onUpdateRgb({ ...rgb, brightness: Number(e.target.value) })}
                className="w-full hw-slider"
              />
            </div>

            {rgb.mode !== 'static' && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#9EA7B8]">Velocidade da Animação</span>
                  <span className="font-mono tabular-nums text-[#F4F6F9]">Nível {rgb.speed} / 5</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={5}
                  step={1}
                  value={rgb.speed}
                  onChange={(e) => onUpdateRgb({ ...rgb, speed: Number(e.target.value) })}
                  className="w-full hw-slider"
                />
              </div>
            )}

            {rgb.mode === 'rainbow' && (
              <div className="space-y-2">
                <label className="block text-xs text-[#9EA7B8]">Direção do Fluxo</label>
                <div className="grid grid-cols-3 gap-1 p-1 bg-[#0C0E12] border border-white/[0.08] rounded-lg">
                  {(
                    [
                      { id: 'ltr', label: 'Esq → Dir' },
                      { id: 'center', label: 'Centro → Bordas' },
                      { id: 'rtl', label: 'Dir → Esq' },
                    ] as const
                  ).map((dir) => (
                    <button
                      key={dir.id}
                      type="button"
                      onClick={() => onUpdateRgb({ ...rgb, direction: dir.id })}
                      className={`py-1.5 px-2 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                        rgb.direction === dir.id
                          ? 'bg-[#222733] text-[#F97316]'
                          : 'text-[#8B95A8] hover:text-[#F4F6F9]'
                      }`}
                    >
                      {dir.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Color Configuration & Zone Sync */}
        {rgb.mode !== 'off' && rgb.mode !== 'rainbow' && (
          <div className="space-y-4 pt-4 border-t border-white/[0.07]">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-[#F4F6F9]">Sincronizar Zonas</div>
                <div className="text-xs text-[#8B95A8]">
                  Aplica a mesma cor às faixas laterais e ao anel central
                </div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={rgb.syncZones}
                onClick={() =>
                  onUpdateRgb({
                    ...rgb,
                    syncZones: !rgb.syncZones,
                    zones: !rgb.syncZones
                      ? {
                          leftStrip: rgb.zones.leftStrip,
                          rightStrip: rgb.zones.leftStrip,
                          centerRing: rgb.zones.leftStrip,
                        }
                      : rgb.zones,
                  })
                }
                className={`relative w-10 h-5 rounded-full transition-colors cursor-pointer shrink-0 ${
                  rgb.syncZones ? 'bg-[#F97316]' : 'bg-[#282E3B]'
                }`}
              >
                <span
                  className={`block w-3.5 h-3.5 rounded-full bg-white transition-transform ${
                    rgb.syncZones ? 'translate-x-5.5' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Color Picker + Hex Input */}
            <div className="flex items-center gap-3">
              <label className="relative flex items-center justify-center w-11 h-10 rounded-lg border border-white/15 overflow-hidden cursor-pointer shrink-0">
                <input
                  type="color"
                  value={activeColor}
                  onChange={(e) => handleColorChange(e.target.value)}
                  className="absolute inset-0 w-16 h-16 -top-2 -left-2 cursor-pointer"
                  aria-label="Selecionar cor personalizada"
                />
              </label>
              <div className="flex-1">
                <div className="text-[11px] text-[#8B95A8] mb-1">
                  {rgb.syncZones
                    ? 'Cor Global (Todas as Zonas)'
                    : activeZone === 'leftStrip'
                    ? 'Cor da Faixa Esquerda'
                    : activeZone === 'rightStrip'
                    ? 'Cor da Faixa Direita'
                    : 'Cor do Anel Central'}
                </div>
                <input
                  type="text"
                  value={hexDraft}
                  maxLength={7}
                  onChange={(e) => {
                    let raw = e.target.value.toUpperCase().replace(/[^#0-9A-F]/g, '');
                    if (!raw.startsWith('#')) {
                      raw = `#${raw.replace(/#/g, '')}`;
                    }
                    setHexDraft(raw.slice(0, 7));
                    if (/^#[0-9A-F]{6}$/.test(raw)) {
                      handleColorChange(raw);
                    }
                  }}
                  onBlur={() => setHexDraft(activeColor.toUpperCase())}
                  className="w-full bg-[#0C0E12] border border-white/[0.08] rounded-md px-2.5 py-1.5 font-mono text-xs text-[#F4F6F9] focus:outline-none focus:border-[#F97316]"
                />
              </div>
            </div>

            {/* Hardware Color Swatches */}
            <div className="grid grid-cols-5 gap-2">
              {HARDWARE_SWATCHES.map((sw) => {
                const selected = activeColor.toLowerCase() === sw.hex.toLowerCase();
                return (
                  <button
                    key={sw.hex}
                    type="button"
                    onClick={() => handleColorChange(sw.hex)}
                    title={sw.name}
                    className={`h-8 rounded-md border transition-transform cursor-pointer ${
                      selected
                        ? 'border-white scale-105 ring-1 ring-[#F97316]'
                        : 'border-white/15 hover:scale-105'
                    }`}
                    style={{ backgroundColor: sw.hex }}
                    aria-label={sw.name}
                  />
                );
              })}
            </div>

            {rgb.mode === 'reactive' && (
              <div className="pt-3 border-t border-white/[0.07] flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#F97316]" />
                  <div>
                    <div className="text-xs font-medium text-[#F4F6F9]">Cor do Flash ao Pressionar</div>
                    <div className="text-[11px] text-[#8B95A8]">Dispara nos LEDs a cada clique</div>
                  </div>
                </div>
                <input
                  type="color"
                  value={rgb.reactiveColor}
                  onChange={(e) => onUpdateRgb({ ...rgb, reactiveColor: e.target.value })}
                  className="w-9 h-8 rounded bg-transparent border border-white/15 cursor-pointer"
                  aria-label="Cor do flash reativo"
                />
              </div>
            )}
          </div>
        )}

        {/* Physical Hardware LED Sync Panel */}
        <div className="pt-4 border-t border-white/[0.07] space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <div className="text-xs font-semibold text-[#F4F6F9]">
                Envio de RGB para o Controle Físico
              </div>
              <div className="text-[11px] text-[#8B95A8] mt-0.5">
                {gamepad.hasWritableRgbChannel
                  ? `Canal de gravação ativo (${gamepad.hidConnected ? 'WebHID' : 'Bluetooth BLE GATT'})`
                  : 'Canal de gravação desconectado (modo X-Input só lê botões)'}
              </div>
            </div>
            <button
              type="button"
              onClick={onApplyRgbToHardware}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F97316] hover:bg-[#EA6A0E] text-[#0C0E12] text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              Enviar RGB
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={onConnectHid}
              className="inline-flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-lg bg-[#0C0E12] hover:bg-[#1A1F2B] border border-white/[0.08] text-[11px] font-medium text-[#E2E8F0] transition-colors cursor-pointer"
            >
              <Usb className="w-3.5 h-3.5 text-[#F97316]" />
              Vincular Canal HID
            </button>
            <button
              type="button"
              onClick={onConnectBluetooth}
              className="inline-flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-lg bg-[#0C0E12] hover:bg-[#1A1F2B] border border-white/[0.08] text-[11px] font-medium text-[#E2E8F0] transition-colors cursor-pointer"
            >
              <Bluetooth className="w-3.5 h-3.5 text-[#60A5FA]" />
              Vincular BLE (KeyLinker)
            </button>
          </div>

          {gamepad.rgbSyncStatus && (
            <p
              className={`text-[11px] leading-relaxed ${
                gamepad.rgbSyncStatus.sent ? 'text-[#22C55E]' : 'text-[#F59E0B]'
              }`}
            >
              {gamepad.rgbSyncStatus.detail}
            </p>
          )}

          <p className="text-[11px] text-[#7D879B] leading-relaxed">
            Dica: no Windows, o dongle 2.4 GHz em modo X-Input puro pode bloquear gravação HID pelo
            navegador. Para alterar os LEDs físicos em tempo real, vincule pelo canal{' '}
            <strong className="text-[#CBD3E1]">BLE (KeyLinker)</strong>, execute via app desktop
            Electron ou use o atalho físico <strong className="text-[#CBD3E1]">FN / Turbo + Direcional</strong> no controle.
          </p>
        </div>
      </aside>
    </div>

      {/* Dedicated Charging Dock RGB Controls (Shown Only on Dock-Capable Models) */}
      {deviceSpec.hasChargingDock && (
        <section className="bg-[#14171E] border border-white/[0.08] rounded-xl p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-white/[0.07]">
            <div className="flex items-center gap-3">
              <Sun className="w-5 h-5 text-[#F97316] shrink-0" />
              <div>
                <h2 className="text-base font-semibold text-[#F4F6F9]">
                  Iluminação RGB da Base · {deviceSpec.dockName ?? 'Dock de Carga'}
                </h2>
                <p className="text-xs text-[#8B95A8] mt-0.5 font-mono tabular-nums">
                  {gamepad.isDocked
                    ? batteryPct >= 100
                      ? 'Controle na Dock · Carga Completa (100%)'
                      : `Carregando na Dock · ${batteryPct}% (falta ${remainingPct}% para 100%)`
                    : `Controle fora da Dock · Bateria em ${batteryPct}% (falta ${remainingPct}% para 100%)`}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={onConnectDock}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0C0E12] hover:bg-[#1B202C] border border-white/[0.08] text-xs font-medium text-[#E2E8F0] transition-colors cursor-pointer"
              >
                <Usb className="w-3.5 h-3.5 text-[#F97316]" />
                Reconhecer Dock (WebHID)
              </button>
              <button
                type="button"
                onClick={onApplyDockRgbToHardware}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#F97316] hover:bg-[#EA6A0E] text-[#0C0E12] text-xs font-semibold transition-colors cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                Enviar RGB para Dock
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Mode Cards */}
            <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {dockModeOptions.map((m) => {
                const active = dock.mode === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => onUpdateDock({ ...dock, mode: m.id })}
                    className={`p-3 rounded-lg border text-left transition-colors cursor-pointer ${
                      active
                        ? 'bg-[#1F1A17] border-[#F97316]'
                        : 'bg-[#0C0E12] border-white/[0.08] hover:border-white/20'
                    }`}
                  >
                    <div
                      className={`text-xs font-semibold ${
                        active ? 'text-[#F97316]' : 'text-[#F4F6F9]'
                      }`}
                    >
                      {m.title}
                    </div>
                    <div className="text-[11px] text-[#7D879B] mt-0.5 leading-snug">
                      {m.subtitle}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Sliders, Swatches & Live Charge Color Readout */}
            <div className="lg:col-span-5 bg-[#0C0E12] border border-white/[0.07] rounded-xl p-4 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs text-[#CBD3E1]">
                  <BatteryCharging className="w-4 h-4 text-[#22C55E]" />
                  <span>Cor Efetiva na Base</span>
                </div>
                <div className="flex items-center gap-2 font-mono text-xs text-[#F4F6F9]">
                  <span
                    className="w-4 h-4 rounded border border-white/20"
                    style={{ backgroundColor: effectiveDockColor }}
                  />
                  <span>
                    {dock.mode === 'off'
                      ? 'DESLIGADO'
                      : dock.mode === 'rainbow'
                      ? 'ARCO-ÍRIS'
                      : effectiveDockColor.toUpperCase()}
                  </span>
                </div>
              </div>

              {dock.mode !== 'off' && (
                <>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#9EA7B8]">Brilho da Base</span>
                      <span className="font-mono tabular-nums text-[#F4F6F9]">
                        {dock.brightness}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min={10}
                      max={100}
                      step={5}
                      value={dock.brightness}
                      onChange={(e) =>
                        onUpdateDock({ ...dock, brightness: Number(e.target.value) })
                      }
                      className="w-full hw-slider"
                    />
                  </div>

                  {(dock.mode === 'breathing' || dock.mode === 'rainbow') && (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[#9EA7B8]">Velocidade do Efeito</span>
                        <span className="font-mono tabular-nums text-[#F4F6F9]">
                          Nível {dock.speed} / 5
                        </span>
                      </div>
                      <input
                        type="range"
                        min={1}
                        max={5}
                        step={1}
                        value={dock.speed}
                        onChange={(e) =>
                          onUpdateDock({ ...dock, speed: Number(e.target.value) })
                        }
                        className="w-full hw-slider"
                      />
                    </div>
                  )}

                  {(dock.mode === 'static' || dock.mode === 'breathing') && (
                    <div className="space-y-2.5 pt-2 border-t border-white/[0.06]">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs text-[#9EA7B8]">Cor Personalizada da Dock</span>
                        <input
                          type="color"
                          value={dock.color}
                          onChange={(e) => onUpdateDock({ ...dock, color: e.target.value })}
                          className="w-9 h-7 rounded bg-transparent border border-white/15 cursor-pointer"
                          aria-label="Cor personalizada da dock"
                        />
                      </div>
                      <div className="grid grid-cols-5 gap-1.5">
                        {HARDWARE_SWATCHES.slice(0, 5).map((sw) => (
                          <button
                            key={sw.hex}
                            type="button"
                            onClick={() => onUpdateDock({ ...dock, color: sw.hex })}
                            title={sw.name}
                            className={`h-7 rounded border cursor-pointer ${
                              dock.color.toLowerCase() === sw.hex.toLowerCase()
                                ? 'border-white ring-1 ring-[#F97316]'
                                : 'border-white/15'
                            }`}
                            style={{ backgroundColor: sw.hex }}
                            aria-label={`Cor da dock ${sw.name}`}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              {gamepad.dockRgbSyncStatus && (
                <p
                  className={`text-[11px] leading-relaxed pt-2 border-t border-white/[0.06] ${
                    gamepad.dockRgbSyncStatus.sent ? 'text-[#22C55E]' : 'text-[#F59E0B]'
                  }`}
                >
                  {gamepad.dockRgbSyncStatus.detail}
                </p>
              )}
            </div>
          </div>
        </section>
      )}
    </div>
  );
};
