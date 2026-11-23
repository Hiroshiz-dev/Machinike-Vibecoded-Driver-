import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Circle,
  Copy,
  Play,
  Plus,
  Search,
  Square,
  Trash2,
} from 'lucide-react';
import {
  ControllerProfile,
  MacroDefinition,
  MacroStep,
  MacroStepAction,
  MacroTriggerMode,
  PhysicalButtonId,
  getButtonsForDevice,
} from '../types/controller';
import { MachenikeDeviceSpec } from '../types/devices';

interface MacroStudioViewProps {
  deviceSpec: MachenikeDeviceSpec;
  macros: MacroDefinition[];
  profile: ControllerProfile;
  onCreateMacro: (macro: MacroDefinition) => void;
  onUpdateMacro: (macro: MacroDefinition) => void;
  onDeleteMacro: (macroId: string) => void;
  onAssignMacroToButton: (buttonId: PhysicalButtonId, macro: MacroDefinition) => void;
  onSimulateButton: (buttonId: PhysicalButtonId, durationMs: number) => void;
  lastGamepadPress: { button: PhysicalButtonId; timestamp: number } | null;
}

const INPUT_OPTIONS: PhysicalButtonId[] = [
  'A',
  'B',
  'X',
  'Y',
  'LB',
  'RB',
  'LT',
  'RT',
  'UP',
  'DOWN',
  'LEFT',
  'RIGHT',
  'L3',
  'R3',
  'VIEW',
  'MENU',
];

const TRIGGER_MODE_LABELS: Record<MacroTriggerMode, { label: string; desc: string }> = {
  once: { label: 'Executar uma vez', desc: 'Roda a sequência completa a cada clique.' },
  hold: { label: 'Enquanto pressionado', desc: 'Repete continuamente enquanto segurar o botão.' },
  toggle: { label: 'Alternar (Liga/Desliga)', desc: 'Um clique inicia o loop, outro clique interrompe.' },
};

const ACTION_LABELS: Record<MacroStepAction, string> = {
  tap: 'Toque (Pressionar + Soltar)',
  press: 'Manter Pressionado',
  release: 'Soltar Botão',
};

export const MacroStudioView: React.FC<MacroStudioViewProps> = ({
  deviceSpec,
  macros,
  profile,
  onCreateMacro,
  onUpdateMacro,
  onDeleteMacro,
  onAssignMacroToButton,
  onSimulateButton,
  lastGamepadPress,
}) => {
  const deviceButtons = useMemo(
    () => getButtonsForDevice(deviceSpec.extraButtons),
    [deviceSpec.extraButtons]
  );

  const [selectedMacroId, setSelectedMacroId] = useState<string>(macros[0]?.id ?? '');
  const [search, setSearch] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeStepIndex, setActiveStepIndex] = useState<number | null>(null);
  const [assignTarget, setAssignTarget] = useState<PhysicalButtonId>(
    deviceSpec.extraButtons[0] ?? 'A'
  );
  const [assignNotice, setAssignNotice] = useState<string | null>(null);

  const lastRecordTimeRef = useRef<number>(0);
  const playbackCancelRef = useRef<boolean>(false);

  const selectedMacro = useMemo(
    () => macros.find((m) => m.id === selectedMacroId) ?? macros[0] ?? null,
    [macros, selectedMacroId]
  );

  useEffect(() => {
    if (!selectedMacro && macros.length > 0) {
      setSelectedMacroId(macros[0].id);
    }
  }, [macros, selectedMacro]);

  useEffect(() => {
    if (!deviceButtons.some((b) => b.id === assignTarget)) {
      setAssignTarget(deviceSpec.extraButtons[0] ?? 'A');
    }
  }, [deviceButtons, assignTarget, deviceSpec.extraButtons]);

  // Capture physical gamepad presses during live macro recording
  useEffect(() => {
    if (!isRecording || !selectedMacro || !lastGamepadPress) return;
    const now = performance.now();
    const delta =
      lastRecordTimeRef.current > 0
        ? Math.max(15, Math.min(2000, Math.round(now - lastRecordTimeRef.current)))
        : 40;
    lastRecordTimeRef.current = now;

    const newStep: MacroStep = {
      id: `step-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      input: lastGamepadPress.button,
      action: 'tap',
      durationMs: 60,
      delayAfterMs: delta,
    };

    onUpdateMacro({
      ...selectedMacro,
      steps: [...selectedMacro.steps, newStep],
    });
  }, [lastGamepadPress]);

  // Capture keyboard keys during live macro recording
  useEffect(() => {
    if (!isRecording || !selectedMacro) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsRecording(false);
        return;
      }
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;
      e.preventDefault();
      const now = performance.now();
      const delta =
        lastRecordTimeRef.current > 0
          ? Math.max(15, Math.min(2000, Math.round(now - lastRecordTimeRef.current)))
          : 40;
      lastRecordTimeRef.current = now;

      const label = e.key === ' ' ? 'Space' : e.key.length === 1 ? e.key.toUpperCase() : e.key;
      const newStep: MacroStep = {
        id: `step-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        input: label,
        action: 'tap',
        durationMs: 55,
        delayAfterMs: delta,
      };
      onUpdateMacro({
        ...selectedMacro,
        steps: [...selectedMacro.steps, newStep],
      });
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isRecording, selectedMacro, onUpdateMacro]);

  const handleRecordClickButton = (btn: PhysicalButtonId) => {
    if (!selectedMacro) return;
    const now = performance.now();
    const delta =
      lastRecordTimeRef.current > 0
        ? Math.max(20, Math.min(1500, Math.round(now - lastRecordTimeRef.current)))
        : 45;
    lastRecordTimeRef.current = now;

    onSimulateButton(btn, 100);
    onUpdateMacro({
      ...selectedMacro,
      steps: [
        ...selectedMacro.steps,
        {
          id: `step-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          input: btn,
          action: 'tap',
          durationMs: 60,
          delayAfterMs: delta,
        },
      ],
    });
  };

  const handleCreateNew = () => {
    const id = `macro-${Date.now()}`;
    const created: MacroDefinition = {
      id,
      name: `Nova Macro ${macros.length + 1}`,
      description: 'Sequência personalizada de comandos temporizados.',
      triggerMode: 'once',
      createdAt: new Date().toISOString().slice(0, 10),
      steps: [
        { id: `s-${Date.now()}-1`, input: 'A', action: 'tap', durationMs: 60, delayAfterMs: 40 },
      ],
    };
    onCreateMacro(created);
    setSelectedMacroId(id);
    setIsRecording(false);
  };

  const handleDuplicate = (macro: MacroDefinition) => {
    const id = `macro-${Date.now()}`;
    const copy: MacroDefinition = {
      ...macro,
      id,
      name: `${macro.name} (Cópia)`,
      createdAt: new Date().toISOString().slice(0, 10),
      steps: macro.steps.map((s, idx) => ({ ...s, id: `${id}-s${idx}` })),
    };
    onCreateMacro(copy);
    setSelectedMacroId(id);
  };

  const handleAddStep = () => {
    if (!selectedMacro) return;
    const step: MacroStep = {
      id: `step-${Date.now()}`,
      input: 'A',
      action: 'tap',
      durationMs: 60,
      delayAfterMs: 40,
    };
    onUpdateMacro({
      ...selectedMacro,
      steps: [...selectedMacro.steps, step],
    });
  };

  const handleUpdateStep = (stepId: string, patch: Partial<MacroStep>) => {
    if (!selectedMacro) return;
    onUpdateMacro({
      ...selectedMacro,
      steps: selectedMacro.steps.map((s) => (s.id === stepId ? { ...s, ...patch } : s)),
    });
  };

  const handleDeleteStep = (stepId: string) => {
    if (!selectedMacro) return;
    onUpdateMacro({
      ...selectedMacro,
      steps: selectedMacro.steps.filter((s) => s.id !== stepId),
    });
  };

  const handleMoveStep = (index: number, direction: -1 | 1) => {
    if (!selectedMacro) return;
    const target = index + direction;
    if (target < 0 || target >= selectedMacro.steps.length) return;
    const next = [...selectedMacro.steps];
    const [removed] = next.splice(index, 1);
    next.splice(target, 0, removed);
    onUpdateMacro({ ...selectedMacro, steps: next });
  };

  const handlePlaySimulation = async () => {
    if (!selectedMacro || selectedMacro.steps.length === 0) return;
    if (isPlaying) {
      playbackCancelRef.current = true;
      setIsPlaying(false);
      setActiveStepIndex(null);
      return;
    }

    playbackCancelRef.current = false;
    setIsPlaying(true);

    for (let i = 0; i < selectedMacro.steps.length; i++) {
      if (playbackCancelRef.current) break;
      const step = selectedMacro.steps[i];
      setActiveStepIndex(i);

      if (INPUT_OPTIONS.includes(step.input as PhysicalButtonId)) {
        onSimulateButton(step.input as PhysicalButtonId, Math.max(80, step.durationMs));
      }

      const waitMs = Math.max(60, step.durationMs + step.delayAfterMs);
      await new Promise((resolve) => window.setTimeout(resolve, waitMs));
    }

    setIsPlaying(false);
    setActiveStepIndex(null);
  };

  const handleAssign = () => {
    if (!selectedMacro) return;
    onAssignMacroToButton(assignTarget, selectedMacro);
    setAssignNotice(`Macro "${selectedMacro.name}" vinculada ao botão ${assignTarget}.`);
    window.setTimeout(() => setAssignNotice(null), 3200);
  };

  const filteredMacros = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return macros;
    return macros.filter(
      (m) => m.name.toLowerCase().includes(q) || m.description.toLowerCase().includes(q)
    );
  }, [macros, search]);

  const totalDurationMs = selectedMacro
    ? selectedMacro.steps.reduce((acc, s) => acc + s.durationMs + s.delayAfterMs, 0)
    : 0;

  const assignedButtonsForSelected = useMemo(() => {
    if (!selectedMacro) return [];
    return deviceButtons
      .filter(
        (b) =>
          profile.bindings[b.id]?.type === 'macro' &&
          profile.bindings[b.id]?.value === selectedMacro.id
      )
      .map((b) => b.shortLabel);
  }, [deviceButtons, profile.bindings, selectedMacro]);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
      {/* Left Library Column */}
      <aside className="xl:col-span-4 bg-[#14171E] border border-white/[0.08] rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h1 className="text-base font-semibold text-[#F4F6F9]">Biblioteca de Macros</h1>
            <p className="text-xs text-[#8B95A8] mt-0.5 font-mono tabular-nums">
              {macros.length} sequências salvas
            </p>
          </div>
          <button
            type="button"
            onClick={handleCreateNew}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F97316] hover:bg-[#EA6A0E] text-[#0C0E12] text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Nova Macro
          </button>
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 text-[#7B8598] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar macro..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-[#0C0E12] border border-white/[0.08] rounded-lg text-[#F4F6F9] placeholder-[#6B7487] focus:outline-none focus:border-[#F97316]"
          />
        </div>

        <div className="space-y-2 max-h-[540px] overflow-y-auto pr-1">
          {filteredMacros.length === 0 ? (
            <div className="p-6 text-center text-xs text-[#8B95A8] border border-dashed border-white/[0.1] rounded-lg">
              Nenhuma macro encontrada para "{search}".
            </div>
          ) : (
            filteredMacros.map((macro) => {
              const active = selectedMacro?.id === macro.id;
              const ms = macro.steps.reduce((a, s) => a + s.durationMs + s.delayAfterMs, 0);
              return (
                <div
                  key={macro.id}
                  onClick={() => {
                    setSelectedMacroId(macro.id);
                    setIsRecording(false);
                  }}
                  className={`p-3.5 rounded-lg border transition-colors cursor-pointer ${
                    active
                      ? 'bg-[#1D212C] border-[#F97316]'
                      : 'bg-[#0C0E12] border-white/[0.07] hover:border-white/20'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-[#F4F6F9] truncate">{macro.name}</div>
                      <div className="text-xs text-[#8B95A8] font-mono tabular-nums mt-0.5">
                        {macro.steps.length} passos · {ms} ms · {TRIGGER_MODE_LABELS[macro.triggerMode].label}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDuplicate(macro);
                        }}
                        className="p-1.5 text-[#8B95A8] hover:text-[#F4F6F9] rounded-md transition-colors cursor-pointer"
                        title="Duplicar macro"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteMacro(macro.id);
                        }}
                        className="p-1.5 text-[#8B95A8] hover:text-[#EF4444] rounded-md transition-colors cursor-pointer"
                        title="Excluir macro"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </aside>

      {/* Main Editor Column */}
      <section className="xl:col-span-8 bg-[#14171E] border border-white/[0.08] rounded-xl p-6 space-y-6">
        {!selectedMacro ? (
          <div className="py-16 text-center space-y-3">
            <p className="text-sm text-[#9EA7B8]">Nenhuma macro selecionada.</p>
            <button
              type="button"
              onClick={handleCreateNew}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-[#F97316] text-[#0C0E12] cursor-pointer"
            >
              Criar Primeira Macro
            </button>
          </div>
        ) : (
          <>
            {/* Header & Metadata Editing */}
            <div className="flex flex-wrap items-start justify-between gap-4 pb-5 border-b border-white/[0.07]">
              <div className="flex-1 min-w-[240px] space-y-2">
                <input
                  type="text"
                  value={selectedMacro.name}
                  onChange={(e) => onUpdateMacro({ ...selectedMacro, name: e.target.value })}
                  aria-label="Nome da macro"
                  className="w-full bg-transparent text-xl font-display font-semibold text-[#F4F6F9] focus:outline-none border-b border-transparent focus:border-[#F97316] pb-0.5"
                />
                <input
                  type="text"
                  value={selectedMacro.description}
                  onChange={(e) => onUpdateMacro({ ...selectedMacro, description: e.target.value })}
                  aria-label="Descrição da macro"
                  className="w-full bg-transparent text-xs text-[#8B95A8] focus:outline-none border-b border-transparent focus:border-white/20 pb-0.5"
                />
                <div className="text-xs font-mono tabular-nums text-[#7D879B]">
                  Duração total: {totalDurationMs} ms · Passos: {selectedMacro.steps.length} ·{' '}
                  Vinculada em:{' '}
                  {assignedButtonsForSelected.length > 0
                    ? assignedButtonsForSelected.join(', ')
                    : 'Nenhum botão'}
                </div>
              </div>

              {/* Action Controls: Live Record & Playback */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    lastRecordTimeRef.current = 0;
                    setIsRecording((r) => !r);
                  }}
                  className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    isRecording
                      ? 'bg-[#DC2626] border-[#DC2626] text-white'
                      : 'bg-[#0C0E12] border-white/[0.12] text-[#F4F6F9] hover:border-[#DC2626]'
                  }`}
                >
                  {isRecording ? (
                    <>
                      <Square className="w-3.5 h-3.5 fill-current" />
                      Parar Gravação
                    </>
                  ) : (
                    <>
                      <Circle className="w-3.5 h-3.5 fill-[#EF4444] text-[#EF4444]" />
                      Gravar Sequência
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handlePlaySimulation}
                  disabled={selectedMacro.steps.length === 0}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold bg-[#1E232E] hover:bg-[#272E3D] text-[#F4F6F9] border border-white/[0.08] disabled:opacity-40 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  {isPlaying ? (
                    <>
                      <Square className="w-3.5 h-3.5 fill-current text-[#F97316]" />
                      Parar Teste
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-current text-[#F97316]" />
                      Simular Macro
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Live Recording Pad (visible while recording) */}
            {isRecording && (
              <div className="p-4 rounded-xl bg-[#1A1315] border border-[#DC2626]/40 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-xs font-medium text-[#FCA5A5]">
                    Gravação ativa — pressione botões no controle físico, teclas no teclado ou clique nos botões abaixo para registrar com intervalos reais em ms.
                  </div>
                  <span className="text-xs font-mono text-[#FCA5A5]">ESC para finalizar</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {INPUT_OPTIONS.map((btn) => (
                    <button
                      key={btn}
                      type="button"
                      onClick={() => handleRecordClickButton(btn)}
                      className="px-2.5 py-1.5 rounded-md bg-[#0C0E12] hover:bg-[#F97316] hover:text-[#0C0E12] border border-white/[0.1] font-mono text-xs text-[#E2E8F0] transition-colors cursor-pointer"
                    >
                      {btn}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Execution Mode + Quick Assign Bar */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-xs font-medium text-[#9EA7B8]">Modo de Execução</label>
                <div className="grid grid-cols-3 gap-1 p-1 bg-[#0C0E12] border border-white/[0.08] rounded-lg">
                  {(['once', 'hold', 'toggle'] as MacroTriggerMode[]).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => onUpdateMacro({ ...selectedMacro, triggerMode: mode })}
                      className={`py-2 px-2 rounded-md text-xs font-medium transition-colors truncate cursor-pointer ${
                        selectedMacro.triggerMode === mode
                          ? 'bg-[#222733] text-[#F97316]'
                          : 'text-[#8B95A8] hover:text-[#F4F6F9]'
                      }`}
                    >
                      {mode === 'once' ? 'Uma vez' : mode === 'hold' ? 'Segurar' : 'Alternar'}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-[#7D879B]">
                  {TRIGGER_MODE_LABELS[selectedMacro.triggerMode].desc}
                </p>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-medium text-[#9EA7B8]">
                  Vincular Diretamente a um Botão / Paddle
                </label>
                <div className="flex items-center gap-2">
                  <select
                    value={assignTarget}
                    onChange={(e) => setAssignTarget(e.target.value as PhysicalButtonId)}
                    className="flex-1 bg-[#0C0E12] border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-[#F4F6F9] focus:outline-none focus:border-[#F97316]"
                  >
                    {deviceButtons.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.shortLabel} — {b.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={handleAssign}
                    className="px-3.5 py-2 rounded-lg bg-[#222733] hover:bg-[#F97316] hover:text-[#0C0E12] text-xs font-semibold text-[#F4F6F9] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    Atribuir
                  </button>
                </div>
                {assignNotice && <p className="text-xs text-[#22C55E]">{assignNotice}</p>}
              </div>
            </div>

            {/* Step-by-Step Timing Table */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-[#F4F6F9]">Linha do Tempo de Comandos</h2>
                <button
                  type="button"
                  onClick={handleAddStep}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0C0E12] hover:bg-[#1E232E] border border-white/[0.08] text-xs font-medium text-[#E2E8F0] transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-[#F97316]" />
                  Adicionar Passo
                </button>
              </div>

              {selectedMacro.steps.length === 0 ? (
                <div className="p-8 text-center rounded-lg bg-[#0C0E12] border border-white/[0.07] text-xs text-[#8B95A8]">
                  Nenhum passo registrado. Clique em "Gravar Sequência" ou "Adicionar Passo".
                </div>
              ) : (
                <div className="overflow-x-auto border border-white/[0.07] rounded-lg">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-white/[0.07] bg-[#0F1218] text-xs font-medium text-[#7D879B]">
                        <th className="py-2.5 px-3 w-10">#</th>
                        <th className="py-2.5 px-3">Comando</th>
                        <th className="py-2.5 px-3">Evento</th>
                        <th className="py-2.5 px-3 text-right">Duração (ms)</th>
                        <th className="py-2.5 px-3 text-right">Atraso após (ms)</th>
                        <th className="py-2.5 px-3 text-right">Ordem</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.05] text-xs">
                      {selectedMacro.steps.map((step, index) => {
                        const playingNow = activeStepIndex === index;
                        return (
                          <tr
                            key={step.id}
                            className={`transition-colors ${
                              playingNow ? 'bg-[#F97316]/15' : 'hover:bg-[#181C25]'
                            }`}
                          >
                            <td className="py-2 px-3 font-mono tabular-nums text-[#8B95A8]">
                              {String(index + 1).padStart(2, '0')}
                            </td>
                            <td className="py-2 px-3">
                              <select
                                value={
                                  INPUT_OPTIONS.includes(step.input as PhysicalButtonId)
                                    ? step.input
                                    : '__custom__'
                                }
                                onChange={(e) => {
                                  if (e.target.value !== '__custom__') {
                                    handleUpdateStep(step.id, { input: e.target.value });
                                  }
                                }}
                                className="bg-[#0C0E12] border border-white/[0.08] rounded-md px-2 py-1 font-mono text-xs text-[#F4F6F9] focus:outline-none focus:border-[#F97316]"
                              >
                                {!INPUT_OPTIONS.includes(step.input as PhysicalButtonId) && (
                                  <option value="__custom__">{step.input}</option>
                                )}
                                {INPUT_OPTIONS.map((opt) => (
                                  <option key={opt} value={opt}>
                                    {opt}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="py-2 px-3">
                              <select
                                value={step.action}
                                onChange={(e) =>
                                  handleUpdateStep(step.id, {
                                    action: e.target.value as MacroStepAction,
                                  })
                                }
                                className="bg-[#0C0E12] border border-white/[0.08] rounded-md px-2 py-1 text-xs text-[#D1D7E2] focus:outline-none focus:border-[#F97316]"
                              >
                                {(['tap', 'press', 'release'] as MacroStepAction[]).map((act) => (
                                  <option key={act} value={act}>
                                    {ACTION_LABELS[act]}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="py-2 px-3 text-right">
                              <input
                                type="number"
                                min={10}
                                max={5000}
                                step={5}
                                value={step.durationMs}
                                onChange={(e) =>
                                  handleUpdateStep(step.id, {
                                    durationMs: Math.max(10, Number(e.target.value) || 10),
                                  })
                                }
                                className="w-20 text-right bg-[#0C0E12] border border-white/[0.08] rounded-md px-2 py-1 font-mono tabular-nums text-[#F4F6F9] focus:outline-none focus:border-[#F97316]"
                              />
                            </td>
                            <td className="py-2 px-3 text-right">
                              <input
                                type="number"
                                min={0}
                                max={5000}
                                step={5}
                                value={step.delayAfterMs}
                                onChange={(e) =>
                                  handleUpdateStep(step.id, {
                                    delayAfterMs: Math.max(0, Number(e.target.value) || 0),
                                  })
                                }
                                className="w-20 text-right bg-[#0C0E12] border border-white/[0.08] rounded-md px-2 py-1 font-mono tabular-nums text-[#F4F6F9] focus:outline-none focus:border-[#F97316]"
                              />
                            </td>
                            <td className="py-2 px-3 text-right">
                              <div className="inline-flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleMoveStep(index, -1)}
                                  disabled={index === 0}
                                  className="p-1 text-[#8B95A8] hover:text-[#F4F6F9] disabled:opacity-30 cursor-pointer"
                                  title="Mover para cima"
                                >
                                  <ArrowUp className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleMoveStep(index, 1)}
                                  disabled={index === selectedMacro.steps.length - 1}
                                  className="p-1 text-[#8B95A8] hover:text-[#F4F6F9] disabled:opacity-30 cursor-pointer"
                                  title="Mover para baixo"
                                >
                                  <ArrowDown className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteStep(step.id)}
                                  className="p-1 text-[#8B95A8] hover:text-[#EF4444] cursor-pointer"
                                  title="Remover passo"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </section>
    </div>
  );
};
