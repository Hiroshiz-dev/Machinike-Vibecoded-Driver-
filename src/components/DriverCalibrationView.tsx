import React, { useMemo, useState } from 'react';
import { Compass, Cpu, RotateCcw, Usb, Vibrate } from 'lucide-react';
import {
  AbxyLayout,
  ConnectionMode,
  ControllerProfile,
  DriverConfig,
  GyroActivation,
  GyroTarget,
  PollingRateHz,
  StickConfig,
  StickCurvePreset,
  TriggerConfig,
  VibrationPulseStep,
  evaluateStickCurve,
} from '../types/controller';
import { MachenikeDeviceSpec } from '../types/devices';
import { LiveGamepadState } from '../hooks/useGamepad';
import { VibrationStudio } from './VibrationStudio';

interface DriverCalibrationViewProps {
  deviceSpec: MachenikeDeviceSpec;
  profile: ControllerProfile;
  gamepad: LiveGamepadState;
  hidMessage: string | null;
  onUpdateDriver: (driver: DriverConfig) => void;
  onResetDriver: () => void;
  onSetVirtualStick: (side: 'left' | 'right', x: number, y: number) => void;
  onSetVirtualTrigger: (side: 'LT' | 'RT', value: number) => void;
  onTriggerRumble: (left: number, right: number, durationMs?: number) => void;
  onPlayVibrationPattern: (
    steps: VibrationPulseStep[],
    masterLeft: number,
    masterRight: number,
    eventScale?: number,
    onStepChange?: (idx: number | null) => void
  ) => Promise<void>;
  onStopVibrationPattern: () => void;
  onRequestHid: () => void;
  onRequestBluetooth: () => void;
}

const CURVE_OPTIONS: Array<{ id: StickCurvePreset; label: string }> = [
  { id: 'linear', label: 'Linear' },
  { id: 'precision', label: 'Precisão' },
  { id: 'aggressive', label: 'Agressivo' },
  { id: 'classic', label: 'Clássico' },
];

const StickCalibratorCard: React.FC<{
  title: string;
  side: 'left' | 'right';
  config: StickConfig;
  livePos: { x: number; y: number };
  onChange: (next: StickConfig) => void;
  onTestMove: (x: number, y: number) => void;
}> = ({ title, side, config, livePos, onChange, onTestMove }) => {
  const curvePath = useMemo(() => {
    const pts: string[] = [];
    for (let i = 0; i <= 24; i++) {
      const t = i / 24;
      const out = evaluateStickCurve(t, config.curve);
      const px = 14 + t * 112;
      const py = 126 - out * 112;
      pts.push(`${i === 0 ? 'M' : 'L'} ${px.toFixed(1)} ${py.toFixed(1)}`);
    }
    return pts.join(' ');
  }, [config.curve]);

  const handleRadarPointer = (e: React.PointerEvent<SVGSVGElement>) => {
    if (e.buttons !== 1 && e.type !== 'pointerdown') return;
    const rect = e.currentTarget.getBoundingClientRect();
    const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const ny = ((e.clientY - rect.top) / rect.height) * 2 - 1;
    const mag = Math.hypot(nx, ny);
    const scale = mag > 1 ? 1 / mag : 1;
    onTestMove(nx * scale, ny * scale);
  };

  const innerR = (config.innerDeadzone / 100) * 56;
  const outerR = (config.outerDeadzone / 100) * 56;
  const dotX = 70 + (config.invertX ? -livePos.x : livePos.x) * 56;
  const dotY = 70 + (config.invertY ? -livePos.y : livePos.y) * 56;
  const magnitude = Math.min(1, Math.hypot(livePos.x, livePos.y));

  return (
    <div className="bg-[#14171E] border border-white/[0.08] rounded-xl p-5 space-y-5">
      <div className="flex items-center justify-between gap-2 pb-3 border-b border-white/[0.07]">
        <div>
          <h2 className="text-sm font-semibold text-[#F4F6F9]">{title}</h2>
          <p className="text-xs font-mono tabular-nums text-[#8B95A8] mt-0.5">
            X: {livePos.x.toFixed(2)} · Y: {livePos.y.toFixed(2)} · Mag: {Math.round(magnitude * 100)}%
          </p>
        </div>
        <div className="inline-flex items-center p-0.5 bg-[#0C0E12] border border-white/[0.08] rounded-md">
          {(['circular', 'square'] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => onChange({ ...config, outerRingMode: mode })}
              className={`px-2.5 py-1 text-[11px] font-medium rounded transition-colors cursor-pointer ${
                config.outerRingMode === mode
                  ? 'bg-[#222733] text-[#F4F6F9]'
                  : 'text-[#8B95A8] hover:text-[#F4F6F9]'
              }`}
            >
              {mode === 'circular' ? 'Circular' : 'Quadrado'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-[#0C0E12] border border-white/[0.07] rounded-lg p-3 flex flex-col items-center">
          <span className="text-[11px] text-[#7D879B] mb-2">
            Arraste para testar ({side === 'left' ? 'LS' : 'RS'})
          </span>
          <svg
            viewBox="0 0 140 140"
            className="w-36 h-36 cursor-crosshair touch-none"
            onPointerDown={handleRadarPointer}
            onPointerMove={handleRadarPointer}
            onPointerUp={() => onTestMove(0, 0)}
            onPointerLeave={() => onTestMove(0, 0)}
          >
            {config.outerRingMode === 'square' ? (
              <rect
                x="14"
                y="14"
                width="112"
                height="112"
                rx="6"
                fill="#11141B"
                stroke="#2A3140"
                strokeWidth="1.2"
              />
            ) : (
              <circle cx="70" cy="70" r="56" fill="#11141B" stroke="#2A3140" strokeWidth="1.2" />
            )}
            <circle
              cx="70"
              cy="70"
              r={outerR}
              fill="none"
              stroke="#38BDF8"
              strokeOpacity="0.4"
              strokeDasharray="3 3"
              strokeWidth="1"
            />
            <circle
              cx="70"
              cy="70"
              r={innerR}
              fill="#F97316"
              fillOpacity="0.16"
              stroke="#F97316"
              strokeOpacity="0.65"
              strokeWidth="1"
            />
            <line x1="14" y1="70" x2="126" y2="70" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
            <line x1="70" y1="14" x2="70" y2="126" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
            <line x1="70" y1="70" x2={dotX} y2={dotY} stroke="#F97316" strokeWidth="1.6" />
            <circle cx={dotX} cy={dotY} r="5" fill="#F97316" stroke="#0C0E12" strokeWidth="1.5" />
          </svg>
        </div>

        <div className="bg-[#0C0E12] border border-white/[0.07] rounded-lg p-3 flex flex-col items-center">
          <span className="text-[11px] text-[#7D879B] mb-2">Curva de Resposta</span>
          <svg viewBox="0 0 140 140" className="w-36 h-36">
            <rect x="14" y="14" width="112" height="112" fill="#11141B" stroke="#262D3B" strokeWidth="1" />
            <line x1="14" y1="70" x2="126" y2="70" stroke="rgba(255,255,255,0.06)" />
            <line x1="70" y1="14" x2="70" y2="126" stroke="rgba(255,255,255,0.06)" />
            <line
              x1="14"
              y1="126"
              x2="126"
              y2="14"
              stroke="rgba(255,255,255,0.16)"
              strokeDasharray="3 3"
              strokeWidth="1"
            />
            <path d={curvePath} fill="none" stroke="#F97316" strokeWidth="2.2" strokeLinecap="round" />
            <circle
              cx={14 + magnitude * 112}
              cy={126 - evaluateStickCurve(magnitude, config.curve) * 112}
              r="4"
              fill="#38BDF8"
            />
          </svg>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-1 p-1 bg-[#0C0E12] border border-white/[0.08] rounded-lg">
        {CURVE_OPTIONS.map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange({ ...config, curve: opt.id })}
            className={`py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
              config.curve === opt.id
                ? 'bg-[#222733] text-[#F97316]'
                : 'text-[#8B95A8] hover:text-[#F4F6F9]'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#9EA7B8]">Zona Morta Interna (Hall-Effect Zero Drift)</span>
            <span className="font-mono tabular-nums text-[#F4F6F9]">{config.innerDeadzone}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={30}
            step={1}
            value={config.innerDeadzone}
            onChange={(e) => onChange({ ...config, innerDeadzone: Number(e.target.value) })}
            className="w-full hw-slider"
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#9EA7B8]">Limite Externo (Saturação)</span>
            <span className="font-mono tabular-nums text-[#F4F6F9]">{config.outerDeadzone}%</span>
          </div>
          <input
            type="range"
            min={70}
            max={100}
            step={1}
            value={config.outerDeadzone}
            onChange={(e) => onChange({ ...config, outerDeadzone: Number(e.target.value) })}
            className="w-full hw-slider"
          />
        </div>

        <div className="flex items-center gap-4 pt-1 text-xs text-[#9EA7B8]">
          <label className="inline-flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={config.invertX}
              onChange={(e) => onChange({ ...config, invertX: e.target.checked })}
              className="accent-[#F97316]"
            />
            Inverter Eixo X
          </label>
          <label className="inline-flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={config.invertY}
              onChange={(e) => onChange({ ...config, invertY: e.target.checked })}
              className="accent-[#F97316]"
            />
            Inverter Eixo Y
          </label>
        </div>
      </div>
    </div>
  );
};

const TriggerCalibratorCard: React.FC<{
  label: string;
  side: 'LT' | 'RT';
  config: TriggerConfig;
  liveValue: number;
  onChange: (next: TriggerConfig) => void;
  onTestTrigger: (val: number) => void;
}> = ({ label, side, config, liveValue, onChange, onTestTrigger }) => {
  const pct = Math.round(liveValue * 100);
  const actuated = config.hairTrigger
    ? pct >= Math.max(2, config.startDeadzone)
    : pct >= config.startDeadzone;

  return (
    <div className="bg-[#14171E] border border-white/[0.08] rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between gap-2 pb-3 border-b border-white/[0.07]">
        <div>
          <h3 className="text-sm font-semibold text-[#F4F6F9]">{label}</h3>
          <p className="text-xs font-mono tabular-nums text-[#8B95A8] mt-0.5">
            Curso atual: {pct}% · {actuated ? 'Acionado' : 'Em repouso'}
          </p>
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={config.hairTrigger}
          onClick={() => onChange({ ...config, hairTrigger: !config.hairTrigger })}
          className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            config.hairTrigger
              ? 'bg-[#F97316]/15 border-[#F97316] text-[#F97316]'
              : 'bg-[#0C0E12] border-white/[0.08] text-[#8B95A8] hover:text-[#F4F6F9]'
          }`}
        >
          Gatilho Rápido: {config.hairTrigger ? 'Ativo' : 'Desligado'}
        </button>
      </div>

      <div className="space-y-2">
        <div className="relative h-3 rounded bg-[#0C0E12] border border-white/[0.08] overflow-hidden">
          <div
            className="absolute inset-y-0 bg-[#F97316]/20"
            style={{
              left: `${config.startDeadzone}%`,
              width: `${Math.max(4, config.endDeadzone - config.startDeadzone)}%`,
            }}
          />
          <div
            className="absolute inset-y-0 left-0 bg-[#F97316] transition-[width] duration-75"
            style={{ width: `${config.hairTrigger && actuated ? 100 : pct}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-[11px] text-[#7D879B]">
          <span>Simular pressão do gatilho {side}</span>
          <input
            type="range"
            min={0}
            max={100}
            value={pct}
            onChange={(e) => onTestTrigger(Number(e.target.value) / 100)}
            onMouseUp={() => onTestTrigger(0)}
            onTouchEnd={() => onTestTrigger(0)}
            className="w-36 hw-slider"
            aria-label={`Simular gatilho ${side}`}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#9EA7B8]">Ponto de Ativação</span>
            <span className="font-mono tabular-nums text-[#F4F6F9]">{config.startDeadzone}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={45}
            value={config.startDeadzone}
            onChange={(e) => onChange({ ...config, startDeadzone: Number(e.target.value) })}
            className="w-full hw-slider"
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#9EA7B8]">Limite Máximo</span>
            <span className="font-mono tabular-nums text-[#F4F6F9]">{config.endDeadzone}%</span>
          </div>
          <input
            type="range"
            min={50}
            max={100}
            value={config.endDeadzone}
            onChange={(e) => onChange({ ...config, endDeadzone: Number(e.target.value) })}
            className="w-full hw-slider"
          />
        </div>
      </div>
    </div>
  );
};

export const DriverCalibrationView: React.FC<DriverCalibrationViewProps> = ({
  deviceSpec,
  profile,
  gamepad,
  hidMessage,
  onUpdateDriver,
  onResetDriver,
  onSetVirtualStick,
  onSetVirtualTrigger,
  onTriggerRumble,
  onPlayVibrationPattern,
  onStopVibrationPattern,
  onRequestHid,
  onRequestBluetooth,
}) => {
  const [subTab, setSubTab] = useState<'vibration' | 'sticks' | 'system'>('vibration');
  const { driver } = profile;

  return (
    <div className="space-y-6">
      {/* Header Row with Clean Sub-Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-[#F4F6F9]">
            Vibração Háptica, Analógicos Hall e Driver
          </h1>
          <p className="text-xs text-[#8B95A8] mt-0.5">
            Personalize padrões de vibração por evento, curvas Hall-Effect, polling de 1000 Hz e giroscópio 6 eixos.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center p-1 bg-[#14171E] border border-white/[0.08] rounded-lg">
            <button
              type="button"
              onClick={() => setSubTab('vibration')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                subTab === 'vibration'
                  ? 'bg-[#222733] text-[#F97316]'
                  : 'text-[#8B95A8] hover:text-[#F4F6F9]'
              }`}
            >
              <Vibrate className="w-3.5 h-3.5" />
              Vibração & Padrões
            </button>
            <button
              type="button"
              onClick={() => setSubTab('sticks')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                subTab === 'sticks'
                  ? 'bg-[#222733] text-[#F4F6F9]'
                  : 'text-[#8B95A8] hover:text-[#F4F6F9]'
              }`}
            >
              Analógicos & Gatilhos
            </button>
            <button
              type="button"
              onClick={() => setSubTab('system')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                subTab === 'system'
                  ? 'bg-[#222733] text-[#F4F6F9]'
                  : 'text-[#8B95A8] hover:text-[#F4F6F9]'
              }`}
            >
              Driver & Giroscópio
            </button>
          </div>

          <button
            type="button"
            onClick={onResetDriver}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-[#CBD3E1] hover:text-[#F97316] bg-[#14171E] border border-white/[0.08] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Padrão
          </button>
        </div>
      </div>

      {subTab === 'vibration' && (
        <VibrationStudio
          driver={driver}
          gamepad={gamepad}
          onUpdateDriver={onUpdateDriver}
          onTriggerRumble={onTriggerRumble}
          onPlayPattern={onPlayVibrationPattern}
          onStopPattern={onStopVibrationPattern}
        />
      )}

      {subTab === 'sticks' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <StickCalibratorCard
              title="Analógico Hall Esquerdo (LS)"
              side="left"
              config={driver.leftStick}
              livePos={gamepad.leftStick}
              onChange={(leftStick) => onUpdateDriver({ ...driver, leftStick })}
              onTestMove={(x, y) => onSetVirtualStick('left', x, y)}
            />
            <StickCalibratorCard
              title="Analógico Hall Direito (RS)"
              side="right"
              config={driver.rightStick}
              livePos={gamepad.rightStick}
              onChange={(rightStick) => onUpdateDriver({ ...driver, rightStick })}
              onTestMove={(x, y) => onSetVirtualStick('right', x, y)}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <TriggerCalibratorCard
              label="Gatilho Hall Esquerdo (LT)"
              side="LT"
              config={driver.leftTrigger}
              liveValue={gamepad.ltValue}
              onChange={(leftTrigger) => onUpdateDriver({ ...driver, leftTrigger })}
              onTestTrigger={(v) => onSetVirtualTrigger('LT', v)}
            />
            <TriggerCalibratorCard
              label="Gatilho Hall Direito (RT)"
              side="RT"
              config={driver.rightTrigger}
              liveValue={gamepad.rtValue}
              onChange={(rightTrigger) => onUpdateDriver({ ...driver, rightTrigger })}
              onTestTrigger={(v) => onSetVirtualTrigger('RT', v)}
            />
          </div>
        </div>
      )}

      {subTab === 'system' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Polling Rate, Connection Mode & Layout */}
          <section className="bg-[#14171E] border border-white/[0.08] rounded-xl p-5 space-y-5">
            <div className="flex items-center gap-2 pb-3 border-b border-white/[0.07]">
              <Cpu className="w-4 h-4 text-[#F97316]" />
              <h2 className="text-sm font-semibold text-[#F4F6F9]">Driver, Polling e Conexão</h2>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#9EA7B8]">Taxa de Atualização (Polling Rate)</span>
                <span className="font-mono tabular-nums text-[#F4F6F9]">
                  {(1000 / driver.pollingRate).toFixed(1)} ms
                </span>
              </div>
              <div className="grid grid-cols-4 gap-1 p-1 bg-[#0C0E12] border border-white/[0.08] rounded-lg">
                {([125, 250, 500, 1000] as PollingRateHz[]).map((hz) => (
                  <button
                    key={hz}
                    type="button"
                    onClick={() => onUpdateDriver({ ...driver, pollingRate: hz })}
                    className={`py-1.5 text-xs font-mono tabular-nums rounded-md transition-colors cursor-pointer ${
                      driver.pollingRate === hz
                        ? 'bg-[#222733] text-[#F97316] font-semibold'
                        : 'text-[#8B95A8] hover:text-[#F4F6F9]'
                    }`}
                  >
                    {hz}Hz
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs text-[#9EA7B8]">Modo de Conexão</label>
              <div className="grid grid-cols-3 gap-1 p-1 bg-[#0C0E12] border border-white/[0.08] rounded-lg">
                {(
                  [
                    { id: 'usb', label: 'USB-C' },
                    { id: 'dongle24g', label: '2.4 GHz' },
                    { id: 'bluetooth', label: 'Bluetooth' },
                  ] as Array<{ id: ConnectionMode; label: string }>
                ).map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => onUpdateDriver({ ...driver, connectionMode: m.id })}
                    className={`py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                      driver.connectionMode === m.id
                        ? 'bg-[#222733] text-[#F4F6F9]'
                        : 'text-[#8B95A8] hover:text-[#F4F6F9]'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs text-[#9EA7B8]">Layout Físico ABXY</label>
              <div className="grid grid-cols-2 gap-1 p-1 bg-[#0C0E12] border border-white/[0.08] rounded-lg">
                {(
                  [
                    { id: 'xbox', label: 'Xbox / PC (A-B-X-Y)' },
                    { id: 'switch', label: 'Switch (B-A-Y-X)' },
                  ] as Array<{ id: AbxyLayout; label: string }>
                ).map((lay) => (
                  <button
                    key={lay.id}
                    type="button"
                    onClick={() => onUpdateDriver({ ...driver, abxyLayout: lay.id })}
                    className={`py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                      driver.abxyLayout === lay.id
                        ? 'bg-[#222733] text-[#F4F6F9]'
                        : 'text-[#8B95A8] hover:text-[#F4F6F9]'
                    }`}
                  >
                    {lay.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/[0.07]">
              <label htmlFor="sleep-select" className="text-xs text-[#9EA7B8]">
                Suspensão Automática
              </label>
              <select
                id="sleep-select"
                value={driver.sleepMinutes}
                onChange={(e) => onUpdateDriver({ ...driver, sleepMinutes: Number(e.target.value) })}
                className="bg-[#0C0E12] border border-white/[0.08] rounded-md px-2.5 py-1.5 text-xs text-[#F4F6F9]"
              >
                <option value={5}>5 minutos</option>
                <option value={10}>10 minutos</option>
                <option value={30}>30 minutos</option>
                <option value={0}>Nunca desligar</option>
              </select>
            </div>

            <div className="pt-2 border-t border-white/[0.07] space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={onRequestHid}
                  className="inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg bg-[#0C0E12] hover:bg-[#191D26] border border-white/[0.08] text-xs font-medium text-[#CBD3E1] transition-colors cursor-pointer"
                >
                  <Usb className="w-3.5 h-3.5 text-[#F97316]" />
                  {gamepad.hidConnected ? 'USB / 2.4G Ativo' : 'Parear USB / 2.4G'}
                </button>
                <button
                  type="button"
                  onClick={onRequestBluetooth}
                  className="inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg bg-[#0C0E12] hover:bg-[#191D26] border border-white/[0.08] text-xs font-medium text-[#CBD3E1] transition-colors cursor-pointer"
                >
                  <span>{gamepad.btConnected ? 'Bluetooth Ativo' : 'Parear Bluetooth'}</span>
                </button>
              </div>
              {hidMessage && <p className="text-[11px] text-[#D97706]">{hidMessage}</p>}
            </div>
          </section>

          {/* 6-Axis Motion Sensor / Gyroscope */}
          <section className="bg-[#14171E] border border-white/[0.08] rounded-xl p-5 space-y-5">
            <div className="flex items-center justify-between gap-2 pb-3 border-b border-white/[0.07]">
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-[#F97316]" />
                <h2 className="text-sm font-semibold text-[#F4F6F9]">Giroscópio 6 Eixos (Motion Aim)</h2>
              </div>
              {!deviceSpec.hasGyro && (
                <span className="font-mono text-[11px] text-[#D97706]">Indisponível no {deviceSpec.shortName}</span>
              )}
            </div>

            {!deviceSpec.hasGyro && (
              <p className="text-xs text-[#8B95A8] leading-relaxed">
                O modelo <strong className="text-[#F4F6F9]">{deviceSpec.name}</strong> não possui sensor giroscópio nativo integrado. Selecione um modelo com giroscópio (G5 Pro, G5 Pro Max, G5 Pro V2 ou G6 Pro) para habilitar Motion Aim.
              </p>
            )}

            <div className={`space-y-2 ${!deviceSpec.hasGyro ? 'opacity-40 pointer-events-none' : ''}`}>
              <label className="block text-xs text-[#9EA7B8]">Mapeamento de Movimento</label>
              <div className="grid grid-cols-3 gap-1 p-1 bg-[#0C0E12] border border-white/[0.08] rounded-lg">
                {(
                  [
                    { id: 'off', label: 'Desligado' },
                    { id: 'rightStick', label: 'Analógico Dir.' },
                    { id: 'mouse', label: 'Mouse' },
                  ] as Array<{ id: GyroTarget; label: string }>
                ).map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => onUpdateDriver({ ...driver, gyroTarget: g.id })}
                    className={`py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                      driver.gyroTarget === g.id
                        ? 'bg-[#222733] text-[#F97316]'
                        : 'text-[#8B95A8] hover:text-[#F4F6F9]'
                    }`}
                  >
                    {g.label}
                  </button>
                ))}
              </div>
            </div>

            <div
              className={`space-y-4 ${
                driver.gyroTarget === 'off' ? 'opacity-45 pointer-events-none' : ''
              }`}
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#9EA7B8]">Sensibilidade do Sensor</span>
                  <span className="font-mono tabular-nums text-[#F4F6F9]">
                    {driver.gyroSensitivity}%
                  </span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={100}
                  step={1}
                  value={driver.gyroSensitivity}
                  onChange={(e) =>
                    onUpdateDriver({ ...driver, gyroSensitivity: Number(e.target.value) })
                  }
                  className="w-full hw-slider"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs text-[#9EA7B8]">Gatilho de Ativação</label>
                <div className="grid grid-cols-4 gap-1 p-1 bg-[#0C0E12] border border-white/[0.08] rounded-lg">
                  {(
                    [
                      { id: 'LT', label: 'LT (Mira)' },
                      { id: 'LB', label: 'LB' },
                      { id: 'M1', label: 'M1' },
                      { id: 'always', label: 'Sempre' },
                    ] as Array<{ id: GyroActivation; label: string }>
                  ).map((act) => (
                    <button
                      key={act.id}
                      type="button"
                      onClick={() => onUpdateDriver({ ...driver, gyroActivation: act.id })}
                      className={`py-1.5 text-[11px] font-medium rounded-md transition-colors cursor-pointer ${
                        driver.gyroActivation === act.id
                          ? 'bg-[#222733] text-[#F4F6F9]'
                          : 'text-[#8B95A8] hover:text-[#F4F6F9]'
                      }`}
                    >
                      {act.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
};
