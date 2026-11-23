import React, { useMemo, useState } from 'react';
import {
  Copy,
  Play,
  Plus,
  Square,
  Trash2,
  Vibrate,
} from 'lucide-react';
import {
  DriverConfig,
  GameVibrationEventId,
  VibrationEventBinding,
  VibrationPattern,
  VibrationPulseStep,
} from '../types/controller';
import { LiveGamepadState } from '../hooks/useGamepad';

interface VibrationStudioProps {
  driver: DriverConfig;
  gamepad: LiveGamepadState;
  onUpdateDriver: (next: DriverConfig) => void;
  onTriggerRumble: (left: number, right: number, durationMs?: number) => void;
  onPlayPattern: (
    steps: VibrationPulseStep[],
    masterLeft: number,
    masterRight: number,
    eventScale?: number,
    onStepChange?: (idx: number | null) => void
  ) => Promise<void>;
  onStopPattern: () => void;
}

export const VibrationStudio: React.FC<VibrationStudioProps> = ({
  driver,
  gamepad,
  onUpdateDriver,
  onTriggerRumble,
  onPlayPattern,
  onStopPattern,
}) => {
  const [selectedPatternId, setSelectedPatternId] = useState<string>(
    driver.vibrationPatterns[0]?.id ?? ''
  );
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [activeStepIdx, setActiveStepIdx] = useState<number | null>(null);

  const selectedPattern = useMemo(
    () =>
      driver.vibrationPatterns.find((p) => p.id === selectedPatternId) ??
      driver.vibrationPatterns[0] ??
      null,
    [driver.vibrationPatterns, selectedPatternId]
  );

  const updatePattern = (updated: VibrationPattern) => {
    onUpdateDriver({
      ...driver,
      vibrationPatterns: driver.vibrationPatterns.map((p) =>
        p.id === updated.id ? updated : p
      ),
    });
  };

  const handleCreatePattern = () => {
    const id = `pat-custom-${Date.now()}`;
    const created: VibrationPattern = {
      id,
      name: `Padrão Personalizado ${driver.vibrationPatterns.length + 1}`,
      description: 'Sequência háptica personalizada de dois motores.',
      isCustom: true,
      steps: [
        { id: `st-${Date.now()}-1`, leftMotor: 75, rightMotor: 40, durationMs: 140, pauseMs: 60 },
        { id: `st-${Date.now()}-2`, leftMotor: 30, rightMotor: 85, durationMs: 110, pauseMs: 0 },
      ],
    };
    onUpdateDriver({
      ...driver,
      vibrationPatterns: [created, ...driver.vibrationPatterns],
    });
    setSelectedPatternId(id);
  };

  const handleDuplicatePattern = (pat: VibrationPattern) => {
    const id = `pat-custom-${Date.now()}`;
    const copy: VibrationPattern = {
      ...pat,
      id,
      name: `${pat.name} (Cópia)`,
      isCustom: true,
      steps: pat.steps.map((s, idx) => ({ ...s, id: `${id}-s${idx}` })),
    };
    onUpdateDriver({
      ...driver,
      vibrationPatterns: [copy, ...driver.vibrationPatterns],
    });
    setSelectedPatternId(id);
  };

  const handleDeletePattern = (id: string) => {
    const remaining = driver.vibrationPatterns.filter((p) => p.id !== id);
    if (remaining.length === 0) return;
    const fallbackId = remaining[0].id;
    onUpdateDriver({
      ...driver,
      vibrationPatterns: remaining,
      vibrationEvents: driver.vibrationEvents.map((ev) =>
        ev.patternId === id ? { ...ev, patternId: fallbackId } : ev
      ),
    });
    if (selectedPatternId === id) {
      setSelectedPatternId(fallbackId);
    }
  };

  const handleAddStep = () => {
    if (!selectedPattern) return;
    const nextStep: VibrationPulseStep = {
      id: `st-${Date.now()}`,
      leftMotor: 60,
      rightMotor: 60,
      durationMs: 120,
      pauseMs: 50,
    };
    updatePattern({
      ...selectedPattern,
      steps: [...selectedPattern.steps, nextStep],
    });
  };

  const handleUpdateStep = (stepId: string, patch: Partial<VibrationPulseStep>) => {
    if (!selectedPattern) return;
    updatePattern({
      ...selectedPattern,
      steps: selectedPattern.steps.map((s) => (s.id === stepId ? { ...s, ...patch } : s)),
    });
  };

  const handleRemoveStep = (stepId: string) => {
    if (!selectedPattern || selectedPattern.steps.length <= 1) return;
    updatePattern({
      ...selectedPattern,
      steps: selectedPattern.steps.filter((s) => s.id !== stepId),
    });
  };

  const handleUpdateEvent = (
    eventId: GameVibrationEventId,
    patch: Partial<VibrationEventBinding>
  ) => {
    onUpdateDriver({
      ...driver,
      vibrationEvents: driver.vibrationEvents.map((ev) =>
        ev.eventId === eventId ? { ...ev, ...patch } : ev
      ),
    });
  };

  const runPlayback = async (
    key: string,
    steps: VibrationPulseStep[],
    scalePct = 100
  ) => {
    if (!driver.vibrationEnabled) return;
    if (playingId === key) {
      onStopPattern();
      setPlayingId(null);
      setActiveStepIdx(null);
      return;
    }
    setPlayingId(key);
    await onPlayPattern(
      steps,
      driver.vibrationLeft,
      driver.vibrationRight,
      scalePct,
      (idx) => setActiveStepIdx(key.startsWith('pattern:') ? idx : null)
    );
    setPlayingId((curr) => (curr === key ? null : curr));
    setActiveStepIdx(null);
  };

  const totalPatternMs = selectedPattern
    ? selectedPattern.steps.reduce((sum, s) => sum + s.durationMs + s.pauseMs, 0)
    : 0;

  return (
    <div className="space-y-6">
      {/* Top Row: Master Dual-Motor Intensity & Live Telemetry Meter */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <section className="lg:col-span-7 bg-[#14171E] border border-white/[0.08] rounded-xl p-5 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/[0.07]">
            <div className="flex items-center gap-2">
              <Vibrate className="w-4 h-4 text-[#F97316]" />
              <div>
                <h2 className="text-sm font-semibold text-[#F4F6F9]">
                  Intensidade Mestre Dual-Motor
                </h2>
                <p className="text-xs text-[#8B95A8]">
                  Regula o ganho máximo dos motores assimétricos esquerdo (graves) e direito (agudos).
                </p>
              </div>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={driver.vibrationEnabled}
              onClick={() =>
                onUpdateDriver({ ...driver, vibrationEnabled: !driver.vibrationEnabled })
              }
              className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                driver.vibrationEnabled
                  ? 'bg-[#F97316]/15 border-[#F97316] text-[#F97316]'
                  : 'bg-[#0C0E12] border-white/[0.08] text-[#8B95A8]'
              }`}
            >
              Vibração: {driver.vibrationEnabled ? 'Ativada' : 'Silenciada'}
            </button>
          </div>

          <div
            className={`grid grid-cols-1 sm:grid-cols-2 gap-5 ${
              !driver.vibrationEnabled ? 'opacity-45 pointer-events-none' : ''
            }`}
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#9EA7B8]">Motor Esquerdo (Peso / Graves)</span>
                <span className="font-mono tabular-nums text-[#F4F6F9]">
                  {driver.vibrationLeft}%
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={driver.vibrationLeft}
                onChange={(e) =>
                  onUpdateDriver({ ...driver, vibrationLeft: Number(e.target.value) })
                }
                className="w-full hw-slider"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#9EA7B8]">Motor Direito (Precisão / Agudos)</span>
                <span className="font-mono tabular-nums text-[#F4F6F9]">
                  {driver.vibrationRight}%
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={driver.vibrationRight}
                onChange={(e) =>
                  onUpdateDriver({ ...driver, vibrationRight: Number(e.target.value) })
                }
                className="w-full hw-slider"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-2">
            <button
              type="button"
              disabled={!driver.vibrationEnabled}
              onClick={() => onTriggerRumble(driver.vibrationLeft, driver.vibrationRight, 420)}
              className="px-3.5 py-2 rounded-lg bg-[#1E232E] hover:bg-[#272E3D] border border-white/[0.08] text-xs font-semibold text-[#F4F6F9] disabled:opacity-40 transition-colors cursor-pointer"
            >
              Testar Ambos os Motores
            </button>
            <button
              type="button"
              disabled={!driver.vibrationEnabled}
              onClick={() => onTriggerRumble(driver.vibrationLeft, 0, 350)}
              className="px-3 py-2 rounded-lg bg-[#0C0E12] hover:bg-[#1A1F2A] border border-white/[0.08] text-xs font-medium text-[#CBD3E1] disabled:opacity-40 transition-colors cursor-pointer"
            >
              Só Motor Esquerdo
            </button>
            <button
              type="button"
              disabled={!driver.vibrationEnabled}
              onClick={() => onTriggerRumble(0, driver.vibrationRight, 350)}
              className="px-3 py-2 rounded-lg bg-[#0C0E12] hover:bg-[#1A1F2A] border border-white/[0.08] text-xs font-medium text-[#CBD3E1] disabled:opacity-40 transition-colors cursor-pointer"
            >
              Só Motor Direito
            </button>
          </div>
        </section>

        {/* Live Output Monitor */}
        <section className="lg:col-span-5 bg-[#14171E] border border-white/[0.08] rounded-xl p-5 flex flex-col justify-between gap-4">
          <div className="flex items-center justify-between border-b border-white/[0.07] pb-3">
            <h2 className="text-sm font-semibold text-[#F4F6F9]">Monitor Háptico em Tempo Real</h2>
            <span className="font-mono text-xs text-[#8B95A8]">
              {gamepad.rumbleActive ? 'Em Execução' : 'Em Repouso'}
            </span>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-mono tabular-nums">
                <span className="text-[#9EA7B8]">Saída Motor Esquerdo (Strong)</span>
                <span className="text-[#F97316]">{gamepad.activeMotorLevels.left}%</span>
              </div>
              <div className="h-3 rounded bg-[#0C0E12] border border-white/[0.08] overflow-hidden">
                <div
                  className="h-full bg-[#F97316] transition-[width] duration-75"
                  style={{ width: `${gamepad.activeMotorLevels.left}%` }}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-mono tabular-nums">
                <span className="text-[#9EA7B8]">Saída Motor Direito (Weak)</span>
                <span className="text-[#38BDF8]">{gamepad.activeMotorLevels.right}%</span>
              </div>
              <div className="h-3 rounded bg-[#0C0E12] border border-white/[0.08] overflow-hidden">
                <div
                  className="h-full bg-[#38BDF8] transition-[width] duration-75"
                  style={{ width: `${gamepad.activeMotorLevels.right}%` }}
                />
              </div>
            </div>
          </div>

          <p className="text-xs text-[#7D879B] leading-relaxed">
            Se um controle compatível estiver conectado via USB ou Bluetooth, os testes enviam pulsos reais via <span className="font-mono text-[#B2BAC9]">dual-rumble</span> simultaneamente ao monitor.
          </p>
        </section>
      </div>

      {/* In-Game Event Vibration Assignments */}
      <section className="bg-[#14171E] border border-white/[0.08] rounded-xl overflow-hidden">
        <div className="p-5 border-b border-white/[0.07] flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-[#F4F6F9]">
              Padrões de Vibração por Evento no Jogo
            </h2>
            <p className="text-xs text-[#8B95A8] mt-0.5">
              Associe padrões hápticos distintos e ajuste a força relativa para cada tipo de acontecimento durante a partida.
            </p>
          </div>
          <span className="font-mono text-xs tabular-nums text-[#8B95A8]">
            {driver.vibrationEvents.filter((e) => e.enabled).length} de {driver.vibrationEvents.length} eventos ativos
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/[0.07] text-xs font-medium text-[#7D879B]">
                <th className="py-3 px-5">Evento no Jogo</th>
                <th className="py-3 px-4">Estado</th>
                <th className="py-3 px-4">Padrão Selecionado</th>
                <th className="py-3 px-4 w-48">Escala de Intensidade</th>
                <th className="py-3 px-5 text-right">Testar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.05] text-xs">
              {driver.vibrationEvents.map((ev) => {
                const pat =
                  driver.vibrationPatterns.find((p) => p.id === ev.patternId) ??
                  driver.vibrationPatterns[0];
                const playKey = `event:${ev.eventId}`;
                const isPlayingEv = playingId === playKey;
                return (
                  <tr key={ev.eventId} className="hover:bg-[#171B24] transition-colors">
                    <td className="py-3 px-5">
                      <div className="text-sm font-medium text-[#F4F6F9]">{ev.eventName}</div>
                      <div className="text-xs text-[#7D879B] mt-0.5">{ev.eventDescription}</div>
                    </td>
                    <td className="py-3 px-4">
                      <button
                        type="button"
                        role="switch"
                        aria-checked={ev.enabled}
                        onClick={() => handleUpdateEvent(ev.eventId, { enabled: !ev.enabled })}
                        className={`relative w-9 h-5 rounded-full transition-colors cursor-pointer ${
                          ev.enabled ? 'bg-[#F97316]' : 'bg-[#282E3B]'
                        }`}
                        aria-label={`Alternar evento ${ev.eventName}`}
                      >
                        <span
                          className={`block w-3.5 h-3.5 rounded-full bg-white transition-transform ${
                            ev.enabled ? 'translate-x-4.5' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </td>
                    <td className="py-3 px-4">
                      <select
                        value={ev.patternId}
                        disabled={!ev.enabled}
                        onChange={(e) =>
                          handleUpdateEvent(ev.eventId, { patternId: e.target.value })
                        }
                        className="bg-[#0C0E12] border border-white/[0.08] rounded-md px-2.5 py-1.5 text-xs text-[#F4F6F9] disabled:opacity-45 focus:outline-none focus:border-[#F97316]"
                      >
                        {driver.vibrationPatterns.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <input
                          type="range"
                          min={10}
                          max={100}
                          step={5}
                          disabled={!ev.enabled}
                          value={ev.intensityScale}
                          onChange={(e) =>
                            handleUpdateEvent(ev.eventId, {
                              intensityScale: Number(e.target.value),
                            })
                          }
                          className="w-full hw-slider disabled:opacity-40"
                        />
                        <span className="font-mono tabular-nums text-[#E2E8F0] w-9 text-right">
                          {ev.intensityScale}%
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-5 text-right">
                      <button
                        type="button"
                        disabled={!driver.vibrationEnabled || !ev.enabled || !pat}
                        onClick={() => pat && runPlayback(playKey, pat.steps, ev.intensityScale)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border transition-colors whitespace-nowrap cursor-pointer disabled:opacity-35 ${
                          isPlayingEv
                            ? 'bg-[#F97316] border-[#F97316] text-[#0C0E12]'
                            : 'bg-[#0C0E12] border-white/[0.1] text-[#F4F6F9] hover:border-[#F97316]'
                        }`}
                      >
                        {isPlayingEv ? (
                          <>
                            <Square className="w-3 h-3 fill-current" />
                            Parar
                          </>
                        ) : (
                          <>
                            <Play className="w-3 h-3 fill-current text-[#F97316]" />
                            Testar
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Custom Vibration Pattern Studio */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Pattern Library List */}
        <aside className="xl:col-span-4 bg-[#14171E] border border-white/[0.08] rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold text-[#F4F6F9]">Biblioteca de Padrões</h2>
              <p className="text-xs text-[#8B95A8] font-mono tabular-nums mt-0.5">
                {driver.vibrationPatterns.length} padrões disponíveis
              </p>
            </div>
            <button
              type="button"
              onClick={handleCreatePattern}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F97316] hover:bg-[#EA6A0E] text-[#0C0E12] text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Novo Padrão
            </button>
          </div>

          <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
            {driver.vibrationPatterns.map((pat) => {
              const active = selectedPattern?.id === pat.id;
              const totalMs = pat.steps.reduce((acc, s) => acc + s.durationMs + s.pauseMs, 0);
              return (
                <div
                  key={pat.id}
                  onClick={() => setSelectedPatternId(pat.id)}
                  className={`p-3 rounded-lg border transition-colors cursor-pointer ${
                    active
                      ? 'bg-[#1D212C] border-[#F97316]'
                      : 'bg-[#0C0E12] border-white/[0.07] hover:border-white/20'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-[#F4F6F9] truncate">{pat.name}</div>
                      <div className="text-xs font-mono tabular-nums text-[#8B95A8] mt-0.5">
                        {pat.steps.length} pulsos · {totalMs} ms ·{' '}
                        {pat.isCustom ? 'Personalizado' : 'Fábrica'}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDuplicatePattern(pat);
                        }}
                        className="p-1 text-[#8B95A8] hover:text-[#F4F6F9] cursor-pointer"
                        title="Duplicar padrão"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      {driver.vibrationPatterns.length > 1 && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeletePattern(pat.id);
                          }}
                          className="p-1 text-[#8B95A8] hover:text-[#EF4444] cursor-pointer"
                          title="Excluir padrão"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </aside>

        {/* Pattern Pulse Editor */}
        <section className="xl:col-span-8 bg-[#14171E] border border-white/[0.08] rounded-xl p-5 space-y-5">
          {selectedPattern && (
            <>
              <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-white/[0.07]">
                <div className="flex-1 min-w-[220px] space-y-1.5">
                  <input
                    type="text"
                    value={selectedPattern.name}
                    onChange={(e) =>
                      updatePattern({ ...selectedPattern, name: e.target.value })
                    }
                    aria-label="Nome do padrão de vibração"
                    className="w-full bg-transparent font-display text-base font-semibold text-[#F4F6F9] focus:outline-none border-b border-transparent focus:border-[#F97316]"
                  />
                  <input
                    type="text"
                    value={selectedPattern.description}
                    onChange={(e) =>
                      updatePattern({ ...selectedPattern, description: e.target.value })
                    }
                    aria-label="Descrição do padrão de vibração"
                    className="w-full bg-transparent text-xs text-[#8B95A8] focus:outline-none border-b border-transparent focus:border-white/20"
                  />
                  <div className="text-xs font-mono tabular-nums text-[#7D879B]">
                    Duração total do ciclo: {totalPatternMs} ms · {selectedPattern.steps.length} etapas
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={!driver.vibrationEnabled}
                    onClick={() =>
                      runPlayback(`pattern:${selectedPattern.id}`, selectedPattern.steps, 100)
                    }
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#1E232E] hover:bg-[#272E3D] border border-white/[0.08] text-xs font-semibold text-[#F4F6F9] disabled:opacity-40 whitespace-nowrap cursor-pointer"
                  >
                    {playingId === `pattern:${selectedPattern.id}` ? (
                      <>
                        <Square className="w-3.5 h-3.5 fill-current text-[#F97316]" />
                        Parar Padrão
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 fill-current text-[#F97316]" />
                        Testar Padrão
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={handleAddStep}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#0C0E12] hover:bg-[#1C212C] border border-white/[0.08] text-xs font-medium text-[#E2E8F0] whitespace-nowrap cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 text-[#F97316]" />
                    Adicionar Pulso
                  </button>
                </div>
              </div>

              {/* Visual Pulse Waveform Preview */}
              <div className="bg-[#0C0E12] border border-white/[0.07] rounded-lg p-3">
                <div className="flex items-center justify-between text-[11px] text-[#7D879B] mb-2">
                  <span>Forma de Onda dos Pulsos</span>
                  <span>Laranja: Motor Esq. (Graves) · Azul: Motor Dir. (Agudos)</span>
                </div>
                <div className="h-20 flex items-end gap-1.5 overflow-x-auto pt-2">
                  {selectedPattern.steps.map((step, idx) => {
                    const isActive = activeStepIdx === idx;
                    return (
                      <React.Fragment key={step.id}>
                        <div
                          className={`flex items-end gap-1 h-full px-2 py-1 rounded border transition-colors ${
                            isActive
                              ? 'bg-[#F97316]/15 border-[#F97316]'
                              : 'bg-[#14171E] border-white/[0.06]'
                          }`}
                          style={{ minWidth: `${Math.max(44, Math.min(110, step.durationMs / 3))}px` }}
                        >
                          <div className="flex-1 h-full flex items-end">
                            <div
                              className="w-full rounded-xs bg-[#F97316] transition-[height] duration-150"
                              style={{ height: `${Math.max(4, step.leftMotor)}%` }}
                            />
                          </div>
                          <div className="flex-1 h-full flex items-end">
                            <div
                              className="w-full rounded-xs bg-[#38BDF8] transition-[height] duration-150"
                              style={{ height: `${Math.max(4, step.rightMotor)}%` }}
                            />
                          </div>
                        </div>
                        {step.pauseMs > 0 && (
                          <div
                            className="h-2 self-end rounded-xs bg-white/[0.06]"
                            style={{ minWidth: `${Math.max(10, Math.min(44, step.pauseMs / 6))}px` }}
                            title={`Pausa de ${step.pauseMs} ms`}
                          />
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>

              {/* Pulse Steps Table */}
              <div className="overflow-x-auto border border-white/[0.07] rounded-lg">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-white/[0.07] bg-[#0F1218] text-[#7D879B]">
                      <th className="py-2.5 px-3 w-10">#</th>
                      <th className="py-2.5 px-3">Motor Esq. (%)</th>
                      <th className="py-2.5 px-3">Motor Dir. (%)</th>
                      <th className="py-2.5 px-3 text-right">Duração (ms)</th>
                      <th className="py-2.5 px-3 text-right">Pausa (ms)</th>
                      <th className="py-2.5 px-3 text-right">Remover</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.05]">
                    {selectedPattern.steps.map((step, idx) => (
                      <tr
                        key={step.id}
                        className={activeStepIdx === idx ? 'bg-[#F97316]/15' : 'hover:bg-[#171B24]'}
                      >
                        <td className="py-2 px-3 font-mono tabular-nums text-[#8B95A8]">
                          {String(idx + 1).padStart(2, '0')}
                        </td>
                        <td className="py-2 px-3">
                          <div className="flex items-center gap-2">
                            <input
                              type="range"
                              min={0}
                              max={100}
                              step={5}
                              value={step.leftMotor}
                              onChange={(e) =>
                                handleUpdateStep(step.id, { leftMotor: Number(e.target.value) })
                              }
                              className="w-24 hw-slider"
                            />
                            <span className="font-mono tabular-nums text-[#F4F6F9] w-8">
                              {step.leftMotor}%
                            </span>
                          </div>
                        </td>
                        <td className="py-2 px-3">
                          <div className="flex items-center gap-2">
                            <input
                              type="range"
                              min={0}
                              max={100}
                              step={5}
                              value={step.rightMotor}
                              onChange={(e) =>
                                handleUpdateStep(step.id, { rightMotor: Number(e.target.value) })
                              }
                              className="w-24 hw-slider"
                            />
                            <span className="font-mono tabular-nums text-[#F4F6F9] w-8">
                              {step.rightMotor}%
                            </span>
                          </div>
                        </td>
                        <td className="py-2 px-3 text-right">
                          <input
                            type="number"
                            min={30}
                            max={1500}
                            step={10}
                            value={step.durationMs}
                            onChange={(e) =>
                              handleUpdateStep(step.id, {
                                durationMs: Math.max(30, Number(e.target.value) || 30),
                              })
                            }
                            className="w-20 text-right bg-[#0C0E12] border border-white/[0.08] rounded px-2 py-1 font-mono tabular-nums text-[#F4F6F9]"
                          />
                        </td>
                        <td className="py-2 px-3 text-right">
                          <input
                            type="number"
                            min={0}
                            max={1000}
                            step={10}
                            value={step.pauseMs}
                            onChange={(e) =>
                              handleUpdateStep(step.id, {
                                pauseMs: Math.max(0, Number(e.target.value) || 0),
                              })
                            }
                            className="w-20 text-right bg-[#0C0E12] border border-white/[0.08] rounded px-2 py-1 font-mono tabular-nums text-[#F4F6F9]"
                          />
                        </td>
                        <td className="py-2 px-3 text-right">
                          <button
                            type="button"
                            disabled={selectedPattern.steps.length <= 1}
                            onClick={() => handleRemoveStep(step.id)}
                            className="p-1 text-[#8B95A8] hover:text-[#EF4444] disabled:opacity-30 cursor-pointer"
                            title="Remover pulso"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
};
