import React, { useEffect, useRef, useState } from 'react';
import { Activity, RotateCcw } from 'lucide-react';
import {
  ControllerProfile,
  PhysicalButtonId,
  getButtonsForDevice,
} from '../types/controller';
import { MachenikeDeviceSpec } from '../types/devices';
import { LiveGamepadState } from '../hooks/useGamepad';

interface InputTesterPanelProps {
  deviceSpec: MachenikeDeviceSpec;
  profile: ControllerProfile;
  gamepad: LiveGamepadState;
  onPressVirtualButton: (id: PhysicalButtonId, down: boolean) => void;
  onSetVirtualStick: (side: 'left' | 'right', x: number, y: number) => void;
  onSetVirtualTrigger: (side: 'LT' | 'RT', value: number) => void;
}

interface InputLogEntry {
  id: number;
  time: string;
  input: string;
  mappedAction: string;
  detail: string;
}

const MiniStickRadar: React.FC<{
  label: string;
  code: 'LS' | 'RS';
  pos: { x: number; y: number };
  deadzonePct: number;
  pressed: boolean;
  onMove: (x: number, y: number) => void;
}> = ({ label, code, pos, deadzonePct, pressed, onMove }) => {
  const mag = Math.min(1, Math.hypot(pos.x, pos.y));
  const active = mag > Math.max(0.05, deadzonePct / 100);
  const angleDeg = active
    ? Math.round(((Math.atan2(-pos.y, pos.x) * 180) / Math.PI + 360) % 360)
    : 0;

  const innerR = (deadzonePct / 100) * 44;
  const dotX = 56 + pos.x * 44;
  const dotY = 56 + pos.y * 44;

  const handlePointer = (e: React.PointerEvent<SVGSVGElement>) => {
    if (e.buttons !== 1 && e.type !== 'pointerdown') return;
    const rect = e.currentTarget.getBoundingClientRect();
    const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const ny = ((e.clientY - rect.top) / rect.height) * 2 - 1;
    const m = Math.hypot(nx, ny);
    const scale = m > 1 ? 1 / m : 1;
    onMove(nx * scale, ny * scale);
  };

  return (
    <div
      className={`bg-[#0C0E12] border rounded-lg p-3.5 transition-colors ${
        active || pressed ? 'border-[#F97316]' : 'border-white/[0.08]'
      }`}
    >
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <span className="text-xs font-medium text-[#E2E8F0]">{label}</span>
        <span
          className={`font-mono text-[11px] tabular-nums ${
            active || pressed ? 'text-[#F97316]' : 'text-[#6E788C]'
          }`}
        >
          {pressed ? `${code} Clique` : active ? `${Math.round(mag * 100)}%` : 'Centro'}
        </span>
      </div>

      <div className="flex items-center gap-3.5">
        <svg
          viewBox="0 0 112 112"
          className="w-28 h-28 shrink-0 cursor-crosshair touch-none"
          onPointerDown={handlePointer}
          onPointerMove={handlePointer}
          onPointerUp={() => onMove(0, 0)}
          onPointerLeave={() => onMove(0, 0)}
          role="img"
          aria-label={`Radar ao vivo do ${label}`}
        >
          <circle
            cx="56"
            cy="56"
            r="44"
            fill="#131720"
            stroke={active ? '#F97316' : '#2C3344'}
            strokeWidth="1.2"
          />
          <circle
            cx="56"
            cy="56"
            r={Math.max(3, innerR)}
            fill="#F97316"
            fillOpacity="0.14"
            stroke="#F97316"
            strokeOpacity="0.45"
            strokeWidth="1"
          />
          <line x1="12" y1="56" x2="100" y2="56" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
          <line x1="56" y1="12" x2="56" y2="100" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
          <line
            x1="56"
            y1="56"
            x2={dotX}
            y2={dotY}
            stroke={active ? '#F97316' : '#38BDF8'}
            strokeWidth="1.8"
          />
          <circle
            cx={dotX}
            cy={dotY}
            r={pressed ? 6.5 : 5}
            fill={active || pressed ? '#F97316' : '#94A3B8'}
            stroke="#0C0E12"
            strokeWidth="1.5"
          />
        </svg>

        <div className="flex-1 min-w-0 space-y-1.5 font-mono text-[11px] tabular-nums">
          <div className="flex items-center justify-between text-[#8B95A8]">
            <span>Eixo X</span>
            <span className="text-[#F4F6F9]">{pos.x >= 0 ? `+${pos.x.toFixed(2)}` : pos.x.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between text-[#8B95A8]">
            <span>Eixo Y</span>
            <span className="text-[#F4F6F9]">{pos.y >= 0 ? `+${pos.y.toFixed(2)}` : pos.y.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between text-[#8B95A8]">
            <span>Ângulo</span>
            <span className="text-[#F4F6F9]">{active ? `${angleDeg}°` : '—'}</span>
          </div>
          <div className="flex items-center justify-between text-[#8B95A8]">
            <span>Zona Morta</span>
            <span className="text-[#CBD3E1]">{deadzonePct}%</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export const InputTesterPanel: React.FC<InputTesterPanelProps> = ({
  deviceSpec,
  profile,
  gamepad,
  onPressVirtualButton,
  onSetVirtualStick,
  onSetVirtualTrigger,
}) => {
  const deviceButtons = getButtonsForDevice(deviceSpec.extraButtons);
  const [history, setHistory] = useState<InputLogEntry[]>([]);
  const [testedCount, setTestedCount] = useState<Set<string>>(new Set());
  const prevPressedRef = useRef<Set<PhysicalButtonId>>(new Set());
  const prevStickActiveRef = useRef<{ ls: boolean; rs: boolean }>({ ls: false, rs: false });
  const logIdRef = useRef(1);

  const appendLog = (input: string, mappedAction: string, detail: string) => {
    const now = new Date();
    const time = `${String(now.getMinutes()).padStart(2, '0')}:${String(
      now.getSeconds()
    ).padStart(2, '0')}.${String(now.getMilliseconds()).padStart(3, '0')}`;
    setHistory((prev) => [
      { id: logIdRef.current++, time, input, mappedAction, detail },
      ...prev.slice(0, 11),
    ]);
  };

  // Detect real-time button press transitions
  useEffect(() => {
    const prev = prevPressedRef.current;
    const curr = gamepad.pressedButtons;

    curr.forEach((btn) => {
      if (!prev.has(btn)) {
        const bind = profile.bindings[btn];
        setTestedCount((set) => {
          const next = new Set(set);
          next.add(btn);
          return next;
        });
        appendLog(
          btn,
          bind ? bind.label : btn,
          bind?.turboEnabled ? `Pressionado · Turbina ${bind.turboRateHz} Hz` : 'Pressionado'
        );
      }
    });

    prevPressedRef.current = new Set(curr);
  }, [gamepad.pressedButtons, profile.bindings]);

  // Detect stick deflection transitions
  useEffect(() => {
    const lsMag = Math.hypot(gamepad.leftStick.x, gamepad.leftStick.y);
    const rsMag = Math.hypot(gamepad.rightStick.x, gamepad.rightStick.y);
    const lsActive = lsMag > Math.max(0.18, profile.driver.leftStick.innerDeadzone / 100);
    const rsActive = rsMag > Math.max(0.18, profile.driver.rightStick.innerDeadzone / 100);

    if (lsActive && !prevStickActiveRef.current.ls) {
      setTestedCount((set) => new Set(set).add('LS'));
      appendLog(
        'LS',
        'Analógico Esquerdo',
        `X ${gamepad.leftStick.x.toFixed(2)} · Y ${gamepad.leftStick.y.toFixed(2)}`
      );
    }
    if (rsActive && !prevStickActiveRef.current.rs) {
      setTestedCount((set) => new Set(set).add('RS'));
      appendLog(
        'RS',
        'Analógico Direito',
        `X ${gamepad.rightStick.x.toFixed(2)} · Y ${gamepad.rightStick.y.toFixed(2)}`
      );
    }

    prevStickActiveRef.current = { ls: lsActive, rs: rsActive };
  }, [
    gamepad.leftStick,
    gamepad.rightStick,
    profile.driver.leftStick.innerDeadzone,
    profile.driver.rightStick.innerDeadzone,
  ]);

  const activeList: string[] = [...gamepad.pressedButtons];
  if (Math.hypot(gamepad.leftStick.x, gamepad.leftStick.y) > 0.12) activeList.push('LS');
  if (Math.hypot(gamepad.rightStick.x, gamepad.rightStick.y) > 0.12) activeList.push('RS');
  if (gamepad.ltValue > 0.08 && !gamepad.pressedButtons.has('LT')) activeList.push('LT');
  if (gamepad.rtValue > 0.08 && !gamepad.pressedButtons.has('RT')) activeList.push('RT');

  const ltPct = Math.round(gamepad.ltValue * 100);
  const rtPct = Math.round(gamepad.rtValue * 100);

  return (
    <section className="bg-[#14171E] border border-white/[0.08] rounded-xl p-6 space-y-6">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-white/[0.07]">
        <div className="flex items-center gap-2.5">
          <Activity className="w-4 h-4 text-[#F97316]" />
          <div>
            <h2 className="text-base font-semibold text-[#F4F6F9]">
              Teste de Input em Tempo Real
            </h2>
            <p className="text-xs text-[#8B95A8] mt-0.5 font-mono tabular-nums">
              {gamepad.connected
                ? 'Leitura direta do controle conectado'
                : 'Pressione no controle físico ou clique/arraste abaixo para testar'}{' '}
              · Entradas testadas: {testedCount.size} / {deviceButtons.length + 2}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-xs font-mono tabular-nums">
            <span className="text-[#7D879B] mr-2">Pressionado agora:</span>
            <span className={activeList.length > 0 ? 'text-[#F97316] font-semibold' : 'text-[#8B95A8]'}>
              {activeList.length > 0 ? activeList.join(' + ') : 'Nenhum'}
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              setHistory([]);
              setTestedCount(new Set());
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0C0E12] hover:bg-[#1C212C] border border-white/[0.08] text-xs font-medium text-[#CBD3E1] transition-colors whitespace-nowrap cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Limpar Teste
          </button>
        </div>
      </div>

      {/* Main Grid: Sticks & Triggers + Button Matrix + Live Event Feed */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Left: Live Dual Analog Sticks + Linear Hall Triggers */}
        <div className="xl:col-span-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-4">
            <MiniStickRadar
              label="Analógico Esquerdo (LS)"
              code="LS"
              pos={gamepad.leftStick}
              deadzonePct={profile.driver.leftStick.innerDeadzone}
              pressed={gamepad.pressedButtons.has('L3')}
              onMove={(x, y) => onSetVirtualStick('left', x, y)}
            />
            <MiniStickRadar
              label="Analógico Direito (RS)"
              code="RS"
              pos={gamepad.rightStick}
              deadzonePct={profile.driver.rightStick.innerDeadzone}
              pressed={gamepad.pressedButtons.has('R3')}
              onMove={(x, y) => onSetVirtualStick('right', x, y)}
            />
          </div>

          {/* Linear Hall Triggers Bar */}
          <div className="bg-[#0C0E12] border border-white/[0.08] rounded-lg p-3.5 space-y-3">
            <div className="text-xs font-medium text-[#E2E8F0]">Gatilhos Hall Lineares (LT / RT)</div>
            {(
              [
                { side: 'LT' as const, pct: ltPct, hair: profile.driver.leftTrigger.hairTrigger },
                { side: 'RT' as const, pct: rtPct, hair: profile.driver.rightTrigger.hairTrigger },
              ] as const
            ).map((tr) => (
              <div key={tr.side} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-mono tabular-nums">
                  <span className={tr.pct > 5 ? 'text-[#F97316] font-semibold' : 'text-[#8B95A8]'}>
                    {tr.side} {tr.hair ? '· Gatilho Rápido' : ''}
                  </span>
                  <span className="text-[#F4F6F9]">{tr.pct}%</span>
                </div>
                <div className="relative h-2.5 rounded bg-[#151923] overflow-hidden">
                  <div
                    className="absolute inset-y-0 left-0 bg-[#F97316] transition-[width] duration-75"
                    style={{ width: `${tr.pct}%` }}
                  />
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={tr.pct}
                  onChange={(e) => onSetVirtualTrigger(tr.side, Number(e.target.value) / 100)}
                  onMouseUp={() => onSetVirtualTrigger(tr.side, 0)}
                  onTouchEnd={() => onSetVirtualTrigger(tr.side, 0)}
                  aria-label={`Testar pressão do gatilho ${tr.side}`}
                  className="w-full hw-slider"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Center/Right: All 19 Buttons Real-Time Matrix + Recent Input Feed */}
        <div className="xl:col-span-7 flex flex-col justify-between gap-5">
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-[#E2E8F0]">
                Matriz de Botões ({deviceButtons.length} Entradas · {deviceSpec.shortName})
              </span>
              <span className="text-[#7D879B]">
                Laranja: pressionado · Borda azul: já verificado nesta sessão
              </span>
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
              {deviceButtons.map((btn) => {
                const pressed = gamepad.pressedButtons.has(btn.id);
                const verified = testedCount.has(btn.id);
                const bind = profile.bindings[btn.id];
                return (
                  <button
                    key={btn.id}
                    type="button"
                    onMouseDown={() => onPressVirtualButton(btn.id, true)}
                    onMouseUp={() => onPressVirtualButton(btn.id, false)}
                    onMouseLeave={() => {
                      if (pressed) onPressVirtualButton(btn.id, false);
                    }}
                    onTouchStart={(e) => {
                      e.preventDefault();
                      onPressVirtualButton(btn.id, true);
                    }}
                    onTouchEnd={() => onPressVirtualButton(btn.id, false)}
                    className={`p-2.5 rounded-lg border text-left transition-colors select-none cursor-pointer ${
                      pressed
                        ? 'bg-[#F97316] border-[#F97316] text-[#0C0E12]'
                        : verified
                        ? 'bg-[#141A24] border-[#38BDF8]/50 text-[#F4F6F9] hover:border-[#F97316]'
                        : 'bg-[#0C0E12] border-white/[0.08] text-[#CBD3E1] hover:border-white/25'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-mono text-xs font-semibold">{btn.shortLabel}</span>
                      {bind?.turboEnabled && (
                        <span
                          className={`font-mono text-[10px] ${
                            pressed ? 'text-[#0C0E12]' : 'text-[#F97316]'
                          }`}
                        >
                          {bind.turboRateHz}Hz
                        </span>
                      )}
                    </div>
                    <div
                      className={`text-[10px] truncate mt-1 ${
                        pressed ? 'text-[#0C0E12]/80 font-medium' : 'text-[#7D879B]'
                      }`}
                    >
                      {bind ? bind.label : btn.shortLabel}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Live Chronological Event Log */}
          <div className="bg-[#0C0E12] border border-white/[0.08] rounded-lg overflow-hidden">
            <div className="px-3.5 py-2 border-b border-white/[0.07] flex items-center justify-between text-xs">
              <span className="font-medium text-[#CBD3E1]">Registro de Acionamentos Recentes</span>
              <span className="font-mono text-[11px] tabular-nums text-[#7D879B]">
                {history.length} eventos
              </span>
            </div>

            {history.length === 0 ? (
              <div className="px-4 py-5 text-xs text-[#7D879B] text-center">
                Pressione qualquer botão ou mova os analógicos no controle físico ou na matriz acima para registrar os inputs em tempo real.
              </div>
            ) : (
              <div className="divide-y divide-white/[0.05] max-h-[168px] overflow-y-auto">
                {history.map((entry) => (
                  <div
                    key={entry.id}
                    className="px-3.5 py-2 flex items-center justify-between gap-3 text-xs font-mono tabular-nums"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-[#6E788C] shrink-0">{entry.time}</span>
                      <span className="text-[#F97316] font-semibold w-10 shrink-0">
                        {entry.input}
                      </span>
                      <span className="text-[#E2E8F0] font-sans truncate">
                        {entry.mappedAction}
                      </span>
                    </div>
                    <span className="text-[#8B95A8] text-[11px] whitespace-nowrap shrink-0">
                      {entry.detail}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
