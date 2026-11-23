import React, { useEffect, useState } from 'react';
import {
  BatteryCharging,
  BatteryFull,
  BatteryMedium,
  Clock,
  Power,
  Send,
  Sun,
  Usb,
  Zap,
} from 'lucide-react';
import { DockConfig, DockRgbMode, RgbConfig } from '../types/controller';
import { MachenikeDeviceSpec } from '../types/devices';
import { LiveGamepadState } from '../hooks/useGamepad';
import { getBatteryIndicatorColor, resolveDockRgbColor } from '../utils/rgbProtocol';

interface DockStationPanelProps {
  deviceSpec: MachenikeDeviceSpec;
  dock: DockConfig;
  controllerRgb: RgbConfig;
  gamepad: LiveGamepadState;
  onUpdateDock: (dock: DockConfig) => void;
  onConnectDock: () => void;
  onSendDockRgb: () => void;
  onToggleDocked: (docked: boolean) => void;
  onSetSimulatedBattery: (percent: number) => void;
}

const DOCK_MODES: Array<{ id: DockRgbMode; label: string }> = [
  { id: 'battery-indicator', label: 'Nível de Bateria' },
  { id: 'sync', label: 'Sincronizar Controle' },
  { id: 'static', label: 'Cor Estática' },
  { id: 'breathing', label: 'Respiração' },
  { id: 'rainbow', label: 'Arco-íris' },
  { id: 'off', label: 'Desligado' },
];

const SOURCE_LABELS: Record<NonNullable<LiveGamepadState['dockConnectionSource']>, string> = {
  'webhid-dock': 'Dock USB (WebHID Direto)',
  passthrough: 'Base via Dongle 2.4 GHz (Passthrough)',
  'ble-gatt': 'Telemetria via BLE GATT',
  virtual: 'Modo Bancada Interativa',
};

function formatMinutesRemaining(minutes: number): string {
  if (minutes <= 0) return '0 min';
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hrs === 0) return `${mins} min`;
  if (mins === 0) return `${hrs}h`;
  return `${hrs}h ${String(mins).padStart(2, '0')}min`;
}

export const DockStationPanel: React.FC<DockStationPanelProps> = ({
  deviceSpec,
  dock,
  controllerRgb,
  gamepad,
  onUpdateDock,
  onConnectDock,
  onSendDockRgb,
  onToggleDocked,
  onSetSimulatedBattery,
}) => {
  const [animPhase, setAnimPhase] = useState(0);

  useEffect(() => {
    if (dock.mode !== 'breathing' && dock.mode !== 'rainbow' && !gamepad.isCharging) return;
    let rafId = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const elapsed = (now - start) / 1000;
      setAnimPhase(elapsed);
      rafId = window.requestAnimationFrame(tick);
    };
    rafId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(rafId);
  }, [dock.mode, gamepad.isCharging]);

  if (!deviceSpec.hasChargingDock) return null;

  const batteryPct = Math.max(0, Math.min(100, Math.round(gamepad.batteryPercent ?? 68)));
  const remainingPct = Math.max(0, 100 - batteryPct);
  const isFull = batteryPct >= 100;
  const isCharging = gamepad.isDocked && !isFull;

  // Non-linear realistic Li-ion taper (last 15% slows down slightly)
  const estimatedMinutesToFull =
    remainingPct === 0
      ? 0
      : Math.max(
          1,
          Math.round(
            (remainingPct / 100) * deviceSpec.dockChargeTimeMin * (batteryPct >= 85 ? 1.18 : 1)
          )
        );

  const estimatedMahMissing = Math.round((remainingPct / 100) * deviceSpec.batteryCapacityMah);

  // Compute live visual LED color & intensity for the SVG charging dock
  const baseColor = resolveDockRgbColor(dock, controllerRgb, batteryPct);
  const speedFactor = 0.55 + dock.speed * 0.35;
  const liveLedColor =
    dock.mode === 'rainbow'
      ? `hsl(${Math.round((animPhase * 70 * speedFactor) % 360)}, 92%, 58%)`
      : baseColor;

  const ledOpacity =
    dock.mode === 'off'
      ? 0.08
      : dock.mode === 'breathing' || (isCharging && dock.showChargeProgressLed)
      ? Math.max(0.22, (0.55 + 0.45 * Math.sin(animPhase * Math.PI * speedFactor)) * (dock.brightness / 100))
      : Math.max(0.18, dock.brightness / 100);

  const batteryAccent = getBatteryIndicatorColor(batteryPct);

  const statusHeadline = !gamepad.isDocked
    ? 'Fora da Dock (Em Uso)'
    : isFull
    ? 'Carga Completa (100%)'
    : 'Carregando na Dock';

  const telemetrySourceLabel =
    gamepad.batterySource === 'hid'
      ? 'Leitura real via WebHID'
      : gamepad.batterySource === 'gatt'
      ? 'Leitura real via Bluetooth GATT'
      : 'Estimativa / Simulação de Bancada';

  return (
    <section className="bg-[#14171E] border border-white/[0.08] rounded-xl p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 pb-5 border-b border-white/[0.07]">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h2 className="text-base font-semibold text-[#F4F6F9]">
              {deviceSpec.dockName ?? 'Base de Carga Magnética RGB'}
            </h2>
            <span className="text-xs font-mono text-[#8B95A8]">
              {gamepad.dockDetected && gamepad.dockConnectionSource
                ? SOURCE_LABELS[gamepad.dockConnectionSource]
                : `Compatível com ${deviceSpec.shortName}`}
            </span>
          </div>
          <p className="text-xs text-[#8B95A8] mt-1">
            Monitoramento de carga até 100%, detecção magnética de acoplamento e controle de LEDs RGB da base.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onToggleDocked(!gamepad.isDocked)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors whitespace-nowrap cursor-pointer ${
              gamepad.isDocked
                ? 'bg-[#1D241E] border-[#22C55E]/40 text-[#86EFAC] hover:bg-[#232D24]'
                : 'bg-[#0C0E12] border-white/[0.1] text-[#D1D7E2] hover:bg-[#1B202B]'
            }`}
          >
            <Zap className={`w-3.5 h-3.5 ${gamepad.isDocked ? 'text-[#22C55E]' : 'text-[#F97316]'}`} />
            {gamepad.isDocked ? 'Retirar Controle da Dock' : 'Acoplar na Dock (Carregar)'}
          </button>

          <button
            type="button"
            onClick={onConnectDock}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#1E232E] hover:bg-[#272E3D] text-[#F4F6F9] border border-white/[0.08] transition-colors whitespace-nowrap cursor-pointer"
          >
            <Usb className="w-3.5 h-3.5 text-[#F97316]" />
            Reconhecer Dock (WebHID)
          </button>
        </div>
      </div>

      {/* Main 12-Col Workbench Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left: Live Charging Dock Hardware SVG + Battery Charge Progress */}
        <div className="lg:col-span-7 bg-[#0C0E12] border border-white/[0.07] rounded-xl p-5 flex flex-col justify-between gap-5">
          {/* Top Status Row */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              {isCharging ? (
                <BatteryCharging className="w-5 h-5 text-[#22C55E]" />
              ) : isFull ? (
                <BatteryFull className="w-5 h-5 text-[#22C55E]" />
              ) : (
                <BatteryMedium className="w-5 h-5 text-[#F97316]" />
              )}
              <div>
                <div className="text-sm font-semibold text-[#F4F6F9]">{statusHeadline}</div>
                <div className="text-[11px] text-[#7D879B] font-mono">
                  {telemetrySourceLabel} · {deviceSpec.batteryCapacityMah} mAh
                </div>
              </div>
            </div>

            <div className="text-right font-mono tabular-nums">
              <div className="text-2xl font-bold text-[#F4F6F9] leading-none">{batteryPct}%</div>
              <div className="text-[11px] text-[#8B95A8] mt-1">
                {isFull ? 'Bateria em 100%' : `Falta ${remainingPct}% para 100%`}
              </div>
            </div>
          </div>

          {/* Interactive SVG Magnetic Charging Dock */}
          <div className="flex items-center justify-center py-2">
            <svg
              viewBox="0 0 420 156"
              className="w-full max-w-[400px] h-auto select-none"
              role="img"
              aria-label={`Ilustração da ${deviceSpec.dockName ?? 'Base de Carga'} com ${batteryPct}% de carga`}
            >
              <defs>
                <linearGradient id="dockBodyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#232836" />
                  <stop offset="100%" stopColor="#141821" />
                </linearGradient>
                <linearGradient id="dockPadGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#2B3142" />
                  <stop offset="100%" stopColor="#181C26" />
                </linearGradient>
                <filter id="dockGlow" x="-30%" y="-60%" width="160%" height="260%">
                  <feGaussianBlur stdDeviation="8" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Ambient underglow on desk */}
              <ellipse
                cx="210"
                cy="134"
                rx="138"
                ry="12"
                fill={liveLedColor}
                opacity={ledOpacity * 0.45}
                filter="url(#dockGlow)"
              />

              {/* Seated Controller Silhouette (rises slightly when undocked) */}
              <g
                transform={gamepad.isDocked ? 'translate(0, 6)' : 'translate(0, -14)'}
                style={{ transition: 'transform 260ms ease' }}
              >
                <path
                  d="M142 54 C146 34, 166 26, 192 28 L228 28 C254 26, 274 34, 278 54 L286 80 C289 92, 278 100, 267 96 L248 84 L172 84 L153 96 C142 100, 131 92, 134 80 Z"
                  fill="url(#dockPadGrad)"
                  stroke={gamepad.isDocked ? '#384155' : '#2D3444'}
                  strokeWidth="1.5"
                />
                {/* Controller Center Status LED */}
                <circle
                  cx="210"
                  cy="54"
                  r="6"
                  fill="#0C0E12"
                  stroke={isCharging ? batteryAccent : controllerRgb.zones.centerRing}
                  strokeWidth="2"
                  opacity={gamepad.isDocked ? 1 : 0.65}
                />
                {/* Mini analog sticks */}
                <circle cx="176" cy="54" r="9" fill="#131720" stroke="#363E52" strokeWidth="1.2" />
                <circle cx="244" cy="62" r="9" fill="#131720" stroke="#363E52" strokeWidth="1.2" />
                {/* Magnetic charging contact cue */}
                {isCharging && (
                  <path
                    d="M212 36 L206 47 L211 47 L208 56 L216 44 L211 44 Z"
                    fill="#22C55E"
                    opacity={0.7 + 0.3 * Math.sin(animPhase * 4)}
                  />
                )}
              </g>

              {/* Magnetic Dock Cradle Chassis */}
              <path
                d="M112 96 L308 96 L330 124 C333 128, 330 133, 324 133 L96 133 C90 133, 87 128, 90 124 Z"
                fill="url(#dockBodyGrad)"
                stroke="#32394A"
                strokeWidth="1.5"
              />

              {/* Gold Magnetic Pogo Pins */}
              <rect x="197" y="92" width="4" height="5" rx="1" fill="#F59E0B" />
              <rect x="208" y="92" width="4" height="5" rx="1" fill="#F59E0B" />
              <rect x="219" y="92" width="4" height="5" rx="1" fill="#F59E0B" />

              {/* Front Charge Progress Segment Bar (when enabled) */}
              {dock.showChargeProgressLed && (
                <g>
                  <rect x="148" y="108" width="124" height="4" rx="2" fill="#0B0D11" />
                  <rect
                    x="148"
                    y="108"
                    width={Math.max(4, (124 * batteryPct) / 100)}
                    height="4"
                    rx="2"
                    fill={batteryAccent}
                    opacity={dock.mode === 'off' ? 0.3 : 0.95}
                  />
                </g>
              )}

              {/* Bottom 360 RGB Underglow Strip */}
              <rect
                x="98"
                y="128"
                width="224"
                height="4.5"
                rx="2.25"
                fill={liveLedColor}
                opacity={ledOpacity}
                filter={dock.mode !== 'off' ? 'url(#dockGlow)' : undefined}
              />

              {/* Caption inside cradle */}
              <text
                x="210"
                y="122"
                textAnchor="middle"
                fill="#7D879B"
                fontSize="8.5"
                fontFamily="JetBrains Mono, monospace"
                letterSpacing="1.4"
              >
                {gamepad.isDocked
                  ? isFull
                    ? 'CARGA COMPLETA · 100%'
                    : `CARREGANDO · FALTA ${remainingPct}%`
                  : 'BASE PRONTA · CONTROLE FORA DA DOCK'}
              </text>
            </svg>
          </div>

          {/* Charge Progress Bar (Current % vs Missing % to 100%) */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs font-mono tabular-nums">
              <span className="text-[#CBD3E1]">
                Carga atual: <strong className="text-[#F4F6F9]">{batteryPct}%</strong>
              </span>
              <span className="text-[#8B95A8]">
                {isFull ? (
                  <strong className="text-[#22C55E]">0% restante (100%)</strong>
                ) : (
                  <>
                    Falta <strong className="text-[#F97316]">{remainingPct}%</strong> para 100%
                  </>
                )}
              </span>
            </div>

            <div className="h-3 w-full rounded-full bg-[#171B24] border border-white/[0.06] overflow-hidden flex">
              <div
                className="h-full transition-all duration-300"
                style={{
                  width: `${batteryPct}%`,
                  backgroundColor: batteryAccent,
                }}
              />
              {remainingPct > 0 && (
                <div
                  className="h-full bg-[#F97316]/15 border-l border-white/20"
                  style={{ width: `${remainingPct}%` }}
                  title={`Falta ${remainingPct}% para completar 100%`}
                />
              )}
            </div>

            {/* 3-Column Precision Metrics */}
            <div className="grid grid-cols-3 gap-2.5 pt-2">
              <div className="p-2.5 rounded-lg bg-[#14171E] border border-white/[0.06]">
                <div className="text-[11px] text-[#7D879B]">Bateria Atual</div>
                <div className="text-sm font-mono font-semibold tabular-nums text-[#F4F6F9] mt-0.5">
                  {batteryPct}%
                </div>
              </div>
              <div className="p-2.5 rounded-lg bg-[#14171E] border border-white/[0.06]">
                <div className="text-[11px] text-[#7D879B]">Falta p/ 100%</div>
                <div className="text-sm font-mono font-semibold tabular-nums text-[#F97316] mt-0.5">
                  {remainingPct}% ({estimatedMahMissing} mAh)
                </div>
              </div>
              <div className="p-2.5 rounded-lg bg-[#14171E] border border-white/[0.06]">
                <div className="text-[11px] text-[#7D879B] flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Tempo p/ 100%
                </div>
                <div className="text-sm font-mono font-semibold tabular-nums text-[#F4F6F9] mt-0.5">
                  {isFull
                    ? 'Completo'
                    : gamepad.isDocked
                    ? `~${formatMinutesRemaining(estimatedMinutesToFull)}`
                    : `~${formatMinutesRemaining(estimatedMinutesToFull)} (na dock)`}
                </div>
              </div>
            </div>

            {/* Interactive Battery Calibration / Bench Slider when OS doesn't report HID/GATT battery */}
            {gamepad.batterySource === 'estimated' && (
              <div className="pt-3 border-t border-white/[0.06] space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
                  <span className="text-[#7D879B]">
                    Ajustar / simular carga na bancada (quando USB/X-Input não reporta %):
                  </span>
                  <div className="flex items-center gap-1">
                    {[20, 50, 75, 100].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => onSetSimulatedBattery(preset)}
                        className={`px-2 py-0.5 rounded font-mono text-[11px] border transition-colors cursor-pointer ${
                          batteryPct === preset
                            ? 'bg-[#222733] border-[#F97316] text-[#F97316]'
                            : 'bg-[#14171E] border-white/[0.08] text-[#9EA7B8] hover:text-[#F4F6F9]'
                        }`}
                      >
                        {preset}%
                      </button>
                    ))}
                  </div>
                </div>
                <input
                  type="range"
                  min={5}
                  max={100}
                  step={1}
                  value={batteryPct}
                  onChange={(e) => onSetSimulatedBattery(Number(e.target.value))}
                  aria-label="Simular porcentagem de bateria do controle"
                  className="w-full hw-slider"
                />
              </div>
            )}
          </div>
        </div>

        {/* Right: Dock RGB Lighting & Smart Power Controls */}
        <div className="lg:col-span-5 bg-[#0C0E12] border border-white/[0.07] rounded-xl p-5 flex flex-col justify-between gap-5">
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Sun className="w-4 h-4 text-[#F97316]" />
                <h3 className="text-sm font-semibold text-[#F4F6F9]">Iluminação RGB da Dock</h3>
              </div>
              <span
                className="w-4 h-4 rounded border border-white/20 shrink-0"
                style={{ backgroundColor: dock.mode === 'off' ? '#232834' : liveLedColor }}
                title={`Cor ativa da Dock: ${liveLedColor}`}
              />
            </div>

            {/* Dock RGB Mode Grid */}
            <div className="grid grid-cols-2 gap-2">
              {DOCK_MODES.map((m) => {
                const active = dock.mode === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => onUpdateDock({ ...dock, mode: m.id })}
                    className={`px-3 py-2 rounded-lg border text-left text-xs font-medium transition-colors cursor-pointer ${
                      active
                        ? 'bg-[#1F1A17] border-[#F97316] text-[#F97316]'
                        : 'bg-[#14171E] border-white/[0.08] text-[#CBD3E1] hover:border-white/20'
                    }`}
                  >
                    {m.label}
                  </button>
                );
              })}
            </div>

            {/* Brightness & Color Controls */}
            {dock.mode !== 'off' && (
              <div className="space-y-3 pt-2 border-t border-white/[0.06]">
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#8B95A8]">Brilho dos LEDs da Base</span>
                    <span className="font-mono tabular-nums text-[#F4F6F9]">{dock.brightness}%</span>
                  </div>
                  <input
                    type="range"
                    min={10}
                    max={100}
                    step={5}
                    value={dock.brightness}
                    onChange={(e) => onUpdateDock({ ...dock, brightness: Number(e.target.value) })}
                    className="w-full hw-slider"
                  />
                </div>

                {(dock.mode === 'static' || dock.mode === 'breathing') && (
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs text-[#8B95A8]">Cor da Base (RGB)</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-[#CBD3E1]">
                        {dock.color.toUpperCase()}
                      </span>
                      <input
                        type="color"
                        value={dock.color}
                        onChange={(e) => onUpdateDock({ ...dock, color: e.target.value })}
                        className="w-8 h-7 rounded border border-white/15 bg-transparent cursor-pointer"
                        aria-label="Selecionar cor RGB da dock"
                      />
                    </div>
                  </div>
                )}

                {dock.mode === 'battery-indicator' && (
                  <p className="text-[11px] text-[#7D879B] leading-relaxed">
                    Modo Indicador: <span className="text-[#EF4444]">Vermelho</span> (&lt;25%),{' '}
                    <span className="text-[#F59E0B]">Âmbar</span> (25–59%),{' '}
                    <span className="text-[#38BDF8]">Ciano</span> (60–94%) e{' '}
                    <span className="text-[#22C55E]">Verde</span> (95–100%).
                  </p>
                )}
              </div>
            )}

            {/* Smart Dock Switches */}
            <div className="space-y-3 pt-3 border-t border-white/[0.06]">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <Power className="w-3.5 h-3.5 text-[#8B95A8] shrink-0" />
                  <div className="min-w-0">
                    <div className="text-xs font-medium text-[#E2E8F0]">Auto-Wake ao Retirar</div>
                    <div className="text-[11px] text-[#7D879B]">
                      Liga e reconecta o controle ao levantar da base
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={dock.autoWakeOnLift}
                  onClick={() => onUpdateDock({ ...dock, autoWakeOnLift: !dock.autoWakeOnLift })}
                  className={`relative w-9 h-5 rounded-full transition-colors cursor-pointer shrink-0 ${
                    dock.autoWakeOnLift ? 'bg-[#F97316]' : 'bg-[#282E3B]'
                  }`}
                >
                  <span
                    className={`block w-3.5 h-3.5 rounded-full bg-white transition-transform ${
                      dock.autoWakeOnLift ? 'translate-x-4.5' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-xs font-medium text-[#E2E8F0]">Barra LED de Progresso</div>
                  <div className="text-[11px] text-[#7D879B]">
                    Exibe nível de carga frontal enquanto acoplado
                  </div>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={dock.showChargeProgressLed}
                  onClick={() =>
                    onUpdateDock({ ...dock, showChargeProgressLed: !dock.showChargeProgressLed })
                  }
                  className={`relative w-9 h-5 rounded-full transition-colors cursor-pointer shrink-0 ${
                    dock.showChargeProgressLed ? 'bg-[#F97316]' : 'bg-[#282E3B]'
                  }`}
                >
                  <span
                    className={`block w-3.5 h-3.5 rounded-full bg-white transition-transform ${
                      dock.showChargeProgressLed ? 'translate-x-4.5' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Transmit Dock RGB Button + Status */}
          <div className="space-y-2 pt-3 border-t border-white/[0.06]">
            <button
              type="button"
              onClick={onSendDockRgb}
              className="w-full inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-lg bg-[#F97316] hover:bg-[#EA6A0E] text-[#0C0E12] text-xs font-semibold transition-colors cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              Enviar RGB e Opções para a Dock
            </button>

            {gamepad.dockRgbSyncStatus && (
              <p
                className={`text-[11px] leading-relaxed ${
                  gamepad.dockRgbSyncStatus.sent ? 'text-[#22C55E]' : 'text-[#F59E0B]'
                }`}
              >
                {gamepad.dockRgbSyncStatus.detail}
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
