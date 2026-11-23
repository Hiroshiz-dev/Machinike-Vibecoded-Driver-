import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Gamepad2,
  Keyboard,
  Layers,
  MousePointer,
  RotateCcw,
  Search,
  Slash,
  Zap,
} from 'lucide-react';
import {
  BindingType,
  ButtonBinding,
  ControllerProfile,
  KEYBOARD_PRESETS,
  MOUSE_PRESETS,
  MacroDefinition,
  PHYSICAL_BUTTONS,
  PhysicalButtonId,
  TurboMode,
  getButtonsForDevice,
} from '../types/controller';
import { MachenikeDeviceSpec } from '../types/devices';
import { LiveGamepadState } from '../hooks/useGamepad';
import { ControllerDiagram } from './ControllerDiagram';

interface ButtonMapperViewProps {
  deviceSpec: MachenikeDeviceSpec;
  profile: ControllerProfile;
  macros: MacroDefinition[];
  gamepad: LiveGamepadState;
  onUpdateBinding: (buttonId: PhysicalButtonId, binding: ButtonBinding) => void;
  onResetAllBindings: () => void;
  onPulseButton: (buttonId: PhysicalButtonId, durationMs?: number) => void;
  onGoToMacros: () => void;
}

const BINDING_TYPE_TABS: Array<{
  id: BindingType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: 'gamepad', label: 'Controle', icon: Gamepad2 },
  { id: 'macro', label: 'Macro', icon: Layers },
  { id: 'keyboard', label: 'Teclado', icon: Keyboard },
  { id: 'mouse', label: 'Mouse', icon: MousePointer },
  { id: 'disabled', label: 'Desativar', icon: Slash },
];

export const ButtonMapperView: React.FC<ButtonMapperViewProps> = ({
  deviceSpec,
  profile,
  macros,
  gamepad,
  onUpdateBinding,
  onResetAllBindings,
  onPulseButton,
  onGoToMacros,
}) => {
  const [subTab, setSubTab] = useState<'mapper' | 'turbo'>('mapper');
  const [selectedId, setSelectedId] = useState<PhysicalButtonId>('RT');
  const [diagramView, setDiagramView] = useState<'front' | 'rear'>('front');
  const [capturingKey, setCapturingKey] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [groupFilter, setGroupFilter] = useState<string>('Todos');

  // Live Turbo rapid-fire tester state
  const [testingTurboBtn, setTestingTurboBtn] = useState<PhysicalButtonId | null>(null);
  const [turboPulseCount, setTurboPulseCount] = useState(0);
  const [turboFlash, setTurboFlash] = useState(false);
  const turboIntervalRef = useRef<number | null>(null);

  const deviceButtons = useMemo(
    () => getButtonsForDevice(deviceSpec.extraButtons),
    [deviceSpec.extraButtons]
  );

  const turboEligibleButtons = useMemo(
    () => deviceButtons.filter((b) => b.id !== 'HOME' && b.id !== 'VIEW' && b.id !== 'MENU'),
    [deviceButtons]
  );

  const selectedMeta = useMemo(
    () => deviceButtons.find((b) => b.id === selectedId) ?? deviceButtons[0],
    [deviceButtons, selectedId]
  );
  const currentBinding = profile.bindings[selectedMeta.id];

  useEffect(() => {
    if (!deviceButtons.some((b) => b.id === selectedId)) {
      setSelectedId(deviceButtons[0]?.id ?? 'A');
      setDiagramView('front');
    }
    if (groupFilter === 'Paddles Traseiros' && deviceSpec.extraButtons.length === 0) {
      setGroupFilter('Todos');
    }
  }, [deviceButtons, selectedId, groupFilter, deviceSpec.extraButtons.length]);

  const activeTurboButtons = useMemo(
    () => turboEligibleButtons.filter((b) => profile.bindings[b.id]?.turboEnabled),
    [turboEligibleButtons, profile.bindings]
  );

  // Stop turbo test cleanly when unmounting or changing target
  useEffect(() => {
    if (!testingTurboBtn) {
      if (turboIntervalRef.current !== null) {
        window.clearInterval(turboIntervalRef.current);
        turboIntervalRef.current = null;
      }
      setTurboFlash(false);
      return;
    }

    const bind = profile.bindings[testingTurboBtn];
    const hz = Math.max(1, Math.min(30, bind?.turboRateHz ?? 12));
    const intervalMs = Math.round(1000 / hz);

    const fireOnce = () => {
      setTurboPulseCount((c) => c + 1);
      setTurboFlash(true);
      onPulseButton(testingTurboBtn, Math.min(60, Math.floor(intervalMs * 0.45)));
      window.setTimeout(() => setTurboFlash(false), Math.min(55, Math.floor(intervalMs * 0.4)));
    };

    fireOnce();
    turboIntervalRef.current = window.setInterval(fireOnce, intervalMs);

    return () => {
      if (turboIntervalRef.current !== null) {
        window.clearInterval(turboIntervalRef.current);
        turboIntervalRef.current = null;
      }
    };
  }, [testingTurboBtn, profile.bindings, onPulseButton]);

  const handleSelectButton = (id: PhysicalButtonId) => {
    setSelectedId(id);
    setCapturingKey(false);
    const meta = PHYSICAL_BUTTONS.find((b) => b.id === id);
    if (meta) {
      setDiagramView(meta.side);
    }
  };

  // Real keyboard key capture listener
  useEffect(() => {
    if (!capturingKey) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const keyLabel =
        e.key === ' ' ? 'Espaço' : e.key.length === 1 ? `Tecla ${e.key.toUpperCase()}` : e.key;
      onUpdateBinding(selectedId, {
        ...currentBinding,
        type: 'keyboard',
        value: e.code,
        label: keyLabel,
      });
      setCapturingKey(false);
    };
    window.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => window.removeEventListener('keydown', handleKeyDown, { capture: true });
  }, [capturingKey, selectedId, currentBinding, onUpdateBinding]);

  const handleTypeSwitch = (type: BindingType) => {
    setCapturingKey(false);
    if (type === 'disabled') {
      onUpdateBinding(selectedId, {
        type: 'disabled',
        value: '',
        label: 'Desativado',
        turboEnabled: false,
        turboRateHz: currentBinding.turboRateHz,
        turboMode: currentBinding.turboMode ?? 'hold',
      });
      return;
    }
    if (type === 'gamepad') {
      const fallback =
        selectedId === 'M1'
          ? 'A'
          : selectedId === 'M2'
          ? 'B'
          : selectedId === 'M3'
          ? 'X'
          : selectedId === 'M4'
          ? 'Y'
          : selectedId;
      onUpdateBinding(selectedId, {
        ...currentBinding,
        type: 'gamepad',
        value: fallback,
        label: fallback,
      });
      return;
    }
    if (type === 'keyboard') {
      onUpdateBinding(selectedId, {
        ...currentBinding,
        type: 'keyboard',
        value: 'Space',
        label: 'Espaço',
      });
      return;
    }
    if (type === 'mouse') {
      onUpdateBinding(selectedId, {
        ...currentBinding,
        type: 'mouse',
        value: 'MouseLeft',
        label: 'Clique Esquerdo',
      });
      return;
    }
    if (type === 'macro') {
      const first = macros[0];
      if (first) {
        onUpdateBinding(selectedId, {
          ...currentBinding,
          type: 'macro',
          value: first.id,
          label: first.name,
          turboEnabled: false,
        });
      }
    }
  };

  const resetSingleButton = () => {
    const defaultVal =
      selectedId === 'M1'
        ? 'A'
        : selectedId === 'M2'
        ? 'B'
        : selectedId === 'M3'
        ? 'X'
        : selectedId === 'M4'
        ? 'Y'
        : selectedId;
    onUpdateBinding(selectedId, {
      type: 'gamepad',
      value: defaultVal,
      label:
        selectedId === 'M1'
          ? 'A (Pular)'
          : selectedId === 'M2'
          ? 'B (Agachar)'
          : selectedId === 'M3'
          ? 'X (Recarregar)'
          : selectedId === 'M4'
          ? 'Y (Trocar Arma)'
          : selectedMeta.shortLabel,
      turboEnabled: false,
      turboRateHz: 12,
      turboMode: 'hold',
    });
  };

  const handleDisableAllTurbo = () => {
    setTestingTurboBtn(null);
    for (const btn of turboEligibleButtons) {
      const b = profile.bindings[btn.id];
      if (b?.turboEnabled) {
        onUpdateBinding(btn.id, { ...b, turboEnabled: false });
      }
    }
  };

  const groups = [
    'Todos',
    ...(deviceSpec.extraButtons.length > 0 ? ['Paddles Traseiros'] : []),
    'Ação',
    'Ombros e Gatilhos',
    'Direcional',
    'Analógicos',
    'Sistema',
  ];

  const filteredButtons = useMemo(() => {
    return deviceButtons.filter((btn) => {
      const matchesGroup = groupFilter === 'Todos' || btn.group === groupFilter;
      const binding = profile.bindings[btn.id];
      const q = searchQuery.trim().toLowerCase();
      const matchesQuery =
        !q ||
        btn.name.toLowerCase().includes(q) ||
        btn.id.toLowerCase().includes(q) ||
        binding.label.toLowerCase().includes(q);
      return matchesGroup && matchesQuery;
    });
  }, [deviceButtons, groupFilter, searchQuery, profile.bindings]);

  return (
    <div className="space-y-6">
      {/* Mode Switcher Bar: Button Mapper vs. Dedicated Turbo / Rapid-Fire Matrix */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-[#F4F6F9]">
            Mapeamento e Modo Turbina · {deviceSpec.name}
          </h1>
          <p className="text-xs text-[#8B95A8] mt-0.5 font-mono tabular-nums">
            {deviceButtons.length} entradas configuráveis · {activeTurboButtons.length} botões com disparo rápido ativo
          </p>
        </div>

        <div className="inline-flex items-center p-1 bg-[#14171E] border border-white/[0.08] rounded-lg">
          <button
            type="button"
            onClick={() => {
              setTestingTurboBtn(null);
              setSubTab('mapper');
            }}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              subTab === 'mapper'
                ? 'bg-[#222733] text-[#F4F6F9]'
                : 'text-[#8B95A8] hover:text-[#F4F6F9]'
            }`}
          >
            Mapeamento Interativo
          </button>
          <button
            type="button"
            onClick={() => setSubTab('turbo')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              subTab === 'turbo'
                ? 'bg-[#222733] text-[#F97316]'
                : 'text-[#8B95A8] hover:text-[#F4F6F9]'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            Modo Turbina ({activeTurboButtons.length})
          </button>
        </div>
      </div>

      {subTab === 'turbo' ? (
        /* DEDICATED TURBO / RAPID-FIRE CONTROL CENTER */
        <div className="space-y-6">
          {/* Live Rapid-Fire Cadence Bench */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <section className="lg:col-span-7 bg-[#14171E] border border-white/[0.08] rounded-xl p-5 flex flex-col justify-between gap-4">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/[0.07]">
                <div>
                  <h2 className="text-sm font-semibold text-[#F4F6F9]">
                    Painel de Disparo Rápido (Turbina)
                  </h2>
                  <p className="text-xs text-[#8B95A8] mt-0.5">
                    Ative o disparo rápido em botões individuais e ajuste a frequência exata de 1 a 30 disparos/s.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleDisableAllTurbo}
                  disabled={activeTurboButtons.length === 0}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0C0E12] hover:bg-[#1C212C] border border-white/[0.08] text-xs font-medium text-[#CBD3E1] disabled:opacity-40 transition-colors whitespace-nowrap cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Desativar Todos
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div className="bg-[#0C0E12] border border-white/[0.07] rounded-lg p-3">
                  <div className="text-[#7D879B]">Botões em Turbina</div>
                  <div className="font-mono text-base font-semibold tabular-nums text-[#F97316] mt-1">
                    {activeTurboButtons.length} / {turboEligibleButtons.length}
                  </div>
                </div>
                <div className="bg-[#0C0E12] border border-white/[0.07] rounded-lg p-3">
                  <div className="text-[#7D879B]">Taxa Máxima Configurada</div>
                  <div className="font-mono text-base font-semibold tabular-nums text-[#F4F6F9] mt-1">
                    {activeTurboButtons.length > 0
                      ? `${Math.max(
                          ...activeTurboButtons.map((b) => profile.bindings[b.id].turboRateHz)
                        )} Hz`
                      : '—'}
                  </div>
                </div>
                <div className="bg-[#0C0E12] border border-white/[0.07] rounded-lg p-3">
                  <div className="text-[#7D879B]">Pulsos no Teste Atual</div>
                  <div className="font-mono text-base font-semibold tabular-nums text-[#38BDF8] mt-1">
                    {turboPulseCount} disparos
                  </div>
                </div>
              </div>
            </section>

            {/* Interactive Cadence Visualizer */}
            <section className="lg:col-span-5 bg-[#14171E] border border-white/[0.08] rounded-xl p-5 flex flex-col justify-between gap-4">
              <div className="flex items-center justify-between border-b border-white/[0.07] pb-3">
                <h2 className="text-sm font-semibold text-[#F4F6F9]">Bancada de Teste de Cadência</h2>
                <span className="font-mono text-xs text-[#8B95A8] tabular-nums">
                  {testingTurboBtn
                    ? `${testingTurboBtn} · ${profile.bindings[testingTurboBtn].turboRateHz} Hz`
                    : 'Pronto'}
                </span>
              </div>

              <div className="flex items-center gap-4">
                <div
                  className={`w-14 h-14 rounded-lg border flex items-center justify-center font-mono text-sm font-semibold transition-colors shrink-0 ${
                    turboFlash
                      ? 'bg-[#F97316] border-[#F97316] text-[#0C0E12]'
                      : 'bg-[#0C0E12] border-white/[0.1] text-[#8B95A8]'
                  }`}
                >
                  {testingTurboBtn ?? 'OFF'}
                </div>
                <div className="text-xs text-[#9EA7B8] leading-relaxed">
                  {testingTurboBtn
                    ? `Disparando ${testingTurboBtn} a cada ${Math.round(
                        1000 / profile.bindings[testingTurboBtn].turboRateHz
                      )} ms (${profile.bindings[testingTurboBtn].turboRateHz} cliques/s).`
                    : 'Segure ou clique em "Testar" em qualquer botão com Turbina ativa abaixo para visualizar a cadência real.'}
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-2 border-t border-white/[0.07]">
                <span className="text-[#7D879B]">
                  Modos suportados: Segurar (dispara ao manter pressionado) ou Auto (disparo contínuo).
                </span>
                {turboPulseCount > 0 && (
                  <button
                    type="button"
                    onClick={() => setTurboPulseCount(0)}
                    className="text-xs text-[#F97316] hover:underline whitespace-nowrap ml-3 cursor-pointer"
                  >
                    Zerar contador
                  </button>
                )}
              </div>
            </section>
          </div>

          {/* Per-Button Turbo Assignment Matrix */}
          <section className="bg-[#14171E] border border-white/[0.08] rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/[0.07] text-xs font-medium text-[#7D879B]">
                    <th className="py-3 px-5">Botão</th>
                    <th className="py-3 px-4">Turbina</th>
                    <th className="py-3 px-4">Comportamento</th>
                    <th className="py-3 px-4 w-72">Taxa de Disparo (1 – 30 Hz)</th>
                    <th className="py-3 px-4 text-right">Intervalo</th>
                    <th className="py-3 px-5 text-right">Teste ao Vivo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.05] text-xs">
                  {turboEligibleButtons.map((btn) => {
                    const bind = profile.bindings[btn.id];
                    const blockedByType = bind.type === 'disabled' || bind.type === 'macro';
                    const isTesting = testingTurboBtn === btn.id;
                    const mode: TurboMode = bind.turboMode ?? 'hold';
                    return (
                      <tr
                        key={btn.id}
                        className={`transition-colors ${
                          bind.turboEnabled ? 'bg-[#191D27]' : 'hover:bg-[#171B24]'
                        }`}
                      >
                        <td className="py-3 px-5">
                          <span className="font-mono text-xs font-semibold text-[#F97316] mr-2">
                            {btn.shortLabel}
                          </span>
                          <span className="text-sm text-[#F4F6F9] font-medium">{btn.name}</span>
                          {blockedByType && (
                            <span className="ml-2 text-[11px] text-[#7D879B]">
                              ({bind.type === 'macro' ? 'Macro vinculada' : 'Desativado'})
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <button
                            type="button"
                            role="switch"
                            aria-checked={bind.turboEnabled}
                            disabled={blockedByType}
                            onClick={() => {
                              if (isTesting && bind.turboEnabled) setTestingTurboBtn(null);
                              onUpdateBinding(btn.id, {
                                ...bind,
                                turboEnabled: !bind.turboEnabled,
                                turboMode: mode,
                              });
                            }}
                            className={`relative w-9 h-5 rounded-full transition-colors cursor-pointer disabled:opacity-35 ${
                              bind.turboEnabled ? 'bg-[#F97316]' : 'bg-[#282E3B]'
                            }`}
                            aria-label={`Ativar turbina no botão ${btn.name}`}
                          >
                            <span
                              className={`block w-3.5 h-3.5 rounded-full bg-white transition-transform ${
                                bind.turboEnabled ? 'translate-x-4.5' : 'translate-x-1'
                              }`}
                            />
                          </button>
                        </td>
                        <td className="py-3 px-4">
                          <div className="inline-flex items-center p-0.5 bg-[#0C0E12] border border-white/[0.08] rounded-md">
                            {(['hold', 'auto'] as TurboMode[]).map((m) => (
                              <button
                                key={m}
                                type="button"
                                disabled={!bind.turboEnabled}
                                onClick={() =>
                                  onUpdateBinding(btn.id, { ...bind, turboMode: m })
                                }
                                className={`px-2.5 py-1 text-[11px] font-medium rounded transition-colors cursor-pointer disabled:opacity-40 ${
                                  mode === m
                                    ? 'bg-[#222733] text-[#F4F6F9]'
                                    : 'text-[#8B95A8] hover:text-[#F4F6F9]'
                                }`}
                              >
                                {m === 'hold' ? 'Segurar' : 'Auto'}
                              </button>
                            ))}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <input
                              type="range"
                              min={1}
                              max={30}
                              step={1}
                              disabled={!bind.turboEnabled}
                              value={bind.turboRateHz}
                              onChange={(e) =>
                                onUpdateBinding(btn.id, {
                                  ...bind,
                                  turboRateHz: Number(e.target.value),
                                })
                              }
                              className="w-full hw-slider disabled:opacity-35"
                              aria-label={`Taxa de disparo do botão ${btn.shortLabel}`}
                            />
                            <span className="font-mono tabular-nums text-[#F4F6F9] w-14 text-right shrink-0">
                              {bind.turboRateHz} Hz
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right font-mono tabular-nums text-[#8B95A8]">
                          {bind.turboEnabled ? `${Math.round(1000 / bind.turboRateHz)} ms` : '—'}
                        </td>
                        <td className="py-3 px-5 text-right">
                          <button
                            type="button"
                            disabled={!bind.turboEnabled}
                            onMouseDown={() => {
                              if (mode === 'hold') setTestingTurboBtn(btn.id);
                            }}
                            onMouseUp={() => {
                              if (mode === 'hold') setTestingTurboBtn(null);
                            }}
                            onMouseLeave={() => {
                              if (mode === 'hold' && isTesting) setTestingTurboBtn(null);
                            }}
                            onClick={() => {
                              if (mode === 'auto') {
                                setTestingTurboBtn(isTesting ? null : btn.id);
                              }
                            }}
                            className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors whitespace-nowrap cursor-pointer disabled:opacity-30 ${
                              isTesting
                                ? 'bg-[#F97316] border-[#F97316] text-[#0C0E12]'
                                : 'bg-[#0C0E12] border-white/[0.1] text-[#E2E8F0] hover:border-[#F97316]'
                            }`}
                          >
                            {isTesting
                              ? mode === 'auto'
                                ? 'Parar Auto'
                                : 'Disparando...'
                              : mode === 'auto'
                              ? 'Alternar Auto'
                              : 'Segurar Teste'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      ) : (
        /* INTERACTIVE DIAGRAM MAPPER + BUTTON INSPECTOR */
        <>
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch">
            {/* Controller Visual Canvas */}
            <section className="xl:col-span-7 bg-[#14171E] border border-white/[0.08] rounded-xl p-6 flex flex-col justify-between">
              <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-white/[0.07]">
                <div>
                  <h2 className="text-base font-semibold text-[#F4F6F9]">
                    Diagrama Interativo do Controle
                  </h2>
                  <p className="text-xs text-[#8B95A8] mt-0.5">
                    Selecione um botão ou paddle traseiro para alterar sua função ou taxa de disparo rápido.
                  </p>
                </div>
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
                    Frente ({deviceSpec.extraButtons.includes('M3') ? '19 botões' : '17 botões'})
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
              </div>

              <div className="py-4 flex-1 flex items-center justify-center">
                <ControllerDiagram
                  view={diagramView}
                  deviceSpec={deviceSpec}
                  rgb={profile.rgb}
                  abxyLayout={profile.driver.abxyLayout}
                  bindings={profile.bindings}
                  selectedButton={selectedMeta.id}
                  pressedButtons={gamepad.pressedButtons}
                  leftStick={gamepad.leftStick}
                  rightStick={gamepad.rightStick}
                  ltValue={gamepad.ltValue}
                  rtValue={gamepad.rtValue}
                  lastEventTime={gamepad.lastEventTime}
                  interactiveMode="select"
                  onSelectButton={handleSelectButton}
                  showBindingTags
                />
              </div>

              <div className="pt-4 border-t border-white/[0.07] flex flex-wrap items-center justify-between gap-3 text-xs text-[#8B95A8]">
                <span>
                  Contorno laranja: selecionado · Contorno azul: remapeado · Ponto laranja nos botões: Turbina ativa.
                </span>
                <button
                  type="button"
                  onClick={onResetAllBindings}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-[#CBD3E1] hover:text-[#F97316] transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Restaurar todos
                </button>
              </div>
            </section>

            {/* Right Inspector Panel */}
            <aside className="xl:col-span-5 bg-[#14171E] border border-white/[0.08] rounded-xl p-6 flex flex-col justify-between gap-5">
              <div className="space-y-5">
                <div className="flex items-start justify-between gap-3 pb-4 border-b border-white/[0.07]">
                  <div>
                    <div className="text-xs font-mono text-[#8B95A8]">
                      {selectedMeta.group} · Entrada Física {selectedMeta.id}
                    </div>
                    <h2 className="text-lg font-semibold text-[#F4F6F9] mt-0.5">
                      {selectedMeta.name}
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={resetSingleButton}
                    className="px-2.5 py-1.5 text-xs font-medium text-[#9EA7B8] hover:text-[#F4F6F9] bg-[#0C0E12] border border-white/[0.08] rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    Padrão
                  </button>
                </div>

                {/* Active Binding Type Segmented Selector */}
                <div className="space-y-2">
                  <label className="block text-xs font-medium text-[#9EA7B8]">Tipo de Ação</label>
                  <div className="grid grid-cols-5 gap-1 p-1 bg-[#0C0E12] border border-white/[0.08] rounded-lg">
                    {BINDING_TYPE_TABS.map((tab) => {
                      const Icon = tab.icon;
                      const active = currentBinding.type === tab.id;
                      return (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => handleTypeSwitch(tab.id)}
                          className={`flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                            active
                              ? 'bg-[#222733] text-[#F97316]'
                              : 'text-[#8B95A8] hover:text-[#F4F6F9]'
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                          <span className="truncate max-w-full">{tab.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Dynamic Action Picker */}
                <div className="space-y-3">
                  {currentBinding.type === 'gamepad' && (
                    <div>
                      <label className="block text-xs font-medium text-[#9EA7B8] mb-2">
                        Emular Botão do Controle
                      </label>
                      <div className="grid grid-cols-4 gap-2">
                        {PHYSICAL_BUTTONS.filter((b) => b.id !== 'M1' && b.id !== 'M2').map(
                          (btn) => {
                            const active = currentBinding.value === btn.id;
                            return (
                              <button
                                key={btn.id}
                                type="button"
                                onClick={() =>
                                  onUpdateBinding(selectedId, {
                                    ...currentBinding,
                                    type: 'gamepad',
                                    value: btn.id,
                                    label: btn.shortLabel,
                                  })
                                }
                                className={`py-2 px-2 rounded-lg text-xs font-mono font-medium border transition-colors cursor-pointer ${
                                  active
                                    ? 'bg-[#F97316] text-[#0C0E12] border-[#F97316] font-semibold'
                                    : 'bg-[#0C0E12] text-[#D1D7E2] border-white/[0.08] hover:border-white/25'
                                }`}
                              >
                                {btn.shortLabel}
                              </button>
                            );
                          }
                        )}
                      </div>
                    </div>
                  )}

                  {currentBinding.type === 'macro' && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-medium text-[#9EA7B8]">
                          Selecionar Macro do Perfil
                        </label>
                        <button
                          type="button"
                          onClick={onGoToMacros}
                          className="text-xs font-medium text-[#F97316] hover:underline cursor-pointer"
                        >
                          Abrir Editor de Macros
                        </button>
                      </div>
                      {macros.length === 0 ? (
                        <div className="p-4 rounded-lg bg-[#0C0E12] border border-white/[0.08] text-xs text-[#8B95A8]">
                          Nenhuma macro cadastrada neste perfil. Crie uma sequência no Estúdio de Macros para vinculá-la aqui.
                        </div>
                      ) : (
                        <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                          {macros.map((m) => {
                            const active = currentBinding.value === m.id;
                            const totalMs = m.steps.reduce(
                              (acc, s) => acc + s.durationMs + s.delayAfterMs,
                              0
                            );
                            return (
                              <button
                                key={m.id}
                                type="button"
                                onClick={() =>
                                  onUpdateBinding(selectedId, {
                                    ...currentBinding,
                                    type: 'macro',
                                    value: m.id,
                                    label: m.name,
                                    turboEnabled: false,
                                  })
                                }
                                className={`w-full text-left p-3 rounded-lg border transition-colors cursor-pointer ${
                                  active
                                    ? 'bg-[#1F1A17] border-[#F97316]'
                                    : 'bg-[#0C0E12] border-white/[0.08] hover:border-white/20'
                                }`}
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-sm font-medium text-[#F4F6F9]">
                                    {m.name}
                                  </span>
                                  <span className="font-mono text-xs text-[#8B95A8] tabular-nums">
                                    {m.steps.length} passos · {totalMs} ms
                                  </span>
                                </div>
                                <p className="text-xs text-[#7D879B] mt-1 line-clamp-1">
                                  {m.description}
                                </p>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {currentBinding.type === 'keyboard' && (
                    <div className="space-y-3">
                      <button
                        type="button"
                        onClick={() => setCapturingKey((v) => !v)}
                        className={`w-full py-3 px-4 rounded-lg border text-sm font-medium transition-colors cursor-pointer ${
                          capturingKey
                            ? 'bg-[#F97316]/15 border-[#F97316] text-[#F97316]'
                            : 'bg-[#0C0E12] border-white/[0.12] text-[#F4F6F9] hover:border-white/25'
                        }`}
                      >
                        {capturingKey
                          ? 'Pressione qualquer tecla no seu teclado agora...'
                          : `Capturar Tecla Livre (Atual: ${currentBinding.label})`}
                      </button>

                      <div>
                        <span className="block text-xs text-[#8B95A8] mb-2">Atalhos Frequentes</span>
                        <div className="grid grid-cols-3 gap-2">
                          {KEYBOARD_PRESETS.map((k) => {
                            const active = currentBinding.value === k.value;
                            return (
                              <button
                                key={k.value}
                                type="button"
                                onClick={() =>
                                  onUpdateBinding(selectedId, {
                                    ...currentBinding,
                                    type: 'keyboard',
                                    value: k.value,
                                    label: k.label,
                                  })
                                }
                                className={`py-1.5 px-2 rounded-md text-xs font-medium border transition-colors cursor-pointer truncate ${
                                  active
                                    ? 'bg-[#F97316] text-[#0C0E12] border-[#F97316]'
                                    : 'bg-[#0C0E12] text-[#CBD3E1] border-white/[0.08] hover:border-white/20'
                                }`}
                              >
                                {k.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {currentBinding.type === 'mouse' && (
                    <div className="grid grid-cols-2 gap-2">
                      {MOUSE_PRESETS.map((m) => {
                        const active = currentBinding.value === m.value;
                        return (
                          <button
                            key={m.value}
                            type="button"
                            onClick={() =>
                              onUpdateBinding(selectedId, {
                                ...currentBinding,
                                type: 'mouse',
                                value: m.value,
                                label: m.label,
                              })
                            }
                            className={`py-2.5 px-3 rounded-lg text-xs font-medium border transition-colors text-left cursor-pointer ${
                              active
                                ? 'bg-[#F97316] text-[#0C0E12] border-[#F97316]'
                                : 'bg-[#0C0E12] text-[#D1D7E2] border-white/[0.08] hover:border-white/20'
                            }`}
                          >
                            {m.label}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {currentBinding.type === 'disabled' && (
                    <div className="p-4 rounded-lg bg-[#0C0E12] border border-white/[0.08] text-xs text-[#9EA7B8] leading-relaxed">
                      O botão físico <strong className="text-[#F4F6F9]">{selectedMeta.name}</strong>{' '}
                      será ignorado pelo driver neste perfil para evitar acionamentos acidentais.
                    </div>
                  )}
                </div>
              </div>

              {/* Per-Button Turbo / Rapid-Fire Section */}
              {currentBinding.type !== 'disabled' && currentBinding.type !== 'macro' && (
                <div className="pt-4 border-t border-white/[0.07] space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-[#F97316]" />
                      <div>
                        <div className="text-sm font-medium text-[#F4F6F9]">
                          Modo Turbina (Disparo Rápido)
                        </div>
                        <div className="text-xs text-[#8B95A8]">
                          Disparo contínuo ajustável para {selectedMeta.shortLabel}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={currentBinding.turboEnabled}
                      onClick={() =>
                        onUpdateBinding(selectedId, {
                          ...currentBinding,
                          turboEnabled: !currentBinding.turboEnabled,
                          turboMode: currentBinding.turboMode ?? 'hold',
                        })
                      }
                      className={`relative w-10 h-5 rounded-full transition-colors cursor-pointer shrink-0 ${
                        currentBinding.turboEnabled ? 'bg-[#F97316]' : 'bg-[#282E3B]'
                      }`}
                    >
                      <span
                        className={`block w-3.5 h-3.5 rounded-full bg-white transition-transform ${
                          currentBinding.turboEnabled ? 'translate-x-5.5' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  {currentBinding.turboEnabled && (
                    <div className="space-y-3 pt-1">
                      <div className="grid grid-cols-2 gap-1 p-1 bg-[#0C0E12] border border-white/[0.08] rounded-lg">
                        {(['hold', 'auto'] as TurboMode[]).map((mode) => (
                          <button
                            key={mode}
                            type="button"
                            onClick={() =>
                              onUpdateBinding(selectedId, { ...currentBinding, turboMode: mode })
                            }
                            className={`py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                              (currentBinding.turboMode ?? 'hold') === mode
                                ? 'bg-[#222733] text-[#F97316]'
                                : 'text-[#8B95A8] hover:text-[#F4F6F9]'
                            }`}
                          >
                            {mode === 'hold' ? 'Segurar para Disparar' : 'Disparo Automático'}
                          </button>
                        ))}
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-[#8B95A8]">Taxa de Disparo</span>
                          <span className="font-mono tabular-nums text-[#F4F6F9]">
                            {currentBinding.turboRateHz} disparos/s (
                            {Math.round(1000 / currentBinding.turboRateHz)} ms)
                          </span>
                        </div>
                        <input
                          type="range"
                          min={1}
                          max={30}
                          step={1}
                          value={currentBinding.turboRateHz}
                          onChange={(e) =>
                            onUpdateBinding(selectedId, {
                              ...currentBinding,
                              turboRateHz: Number(e.target.value),
                            })
                          }
                          className="w-full hw-slider"
                        />
                      </div>

                      <button
                        type="button"
                        onMouseDown={() => setTestingTurboBtn(selectedId)}
                        onMouseUp={() => setTestingTurboBtn(null)}
                        onMouseLeave={() => {
                          if (testingTurboBtn === selectedId) setTestingTurboBtn(null);
                        }}
                        className={`w-full py-2 px-3 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                          testingTurboBtn === selectedId
                            ? 'bg-[#F97316] border-[#F97316] text-[#0C0E12]'
                            : 'bg-[#0C0E12] border-white/[0.1] text-[#F4F6F9] hover:border-[#F97316]'
                        }`}
                      >
                        {testingTurboBtn === selectedId
                          ? `Disparando ${selectedMeta.shortLabel} a ${currentBinding.turboRateHz} Hz (${turboPulseCount} pulsos)`
                          : `Segure para Testar Disparo Rápido (${currentBinding.turboRateHz} Hz)`}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </aside>
          </div>

          {/* Full Tabular Mapping Overview */}
          <section className="bg-[#14171E] border border-white/[0.08] rounded-xl overflow-hidden">
            <div className="p-5 border-b border-white/[0.07] flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-1 p-1 bg-[#0C0E12] border border-white/[0.08] rounded-lg">
                {groups.map((grp) => (
                  <button
                    key={grp}
                    type="button"
                    onClick={() => setGroupFilter(grp)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      groupFilter === grp
                        ? 'bg-[#222733] text-[#F4F6F9]'
                        : 'text-[#8B95A8] hover:text-[#F4F6F9]'
                    }`}
                  >
                    {grp}
                  </button>
                ))}
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-[#7B8598] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filtrar botão ou ação..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#0C0E12] border border-white/[0.08] rounded-lg text-[#F4F6F9] placeholder-[#6B7487] focus:outline-none focus:border-[#F97316]"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/[0.07] text-xs font-medium text-[#7D879B]">
                    <th className="py-3 px-5">Entrada Física</th>
                    <th className="py-3 px-4">Grupo</th>
                    <th className="py-3 px-4">Tipo</th>
                    <th className="py-3 px-4">Ação Atribuída</th>
                    <th className="py-3 px-4 text-right">Turbina</th>
                    <th className="py-3 px-5 text-right">Configurar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.05] text-sm">
                  {filteredButtons.map((btn) => {
                    const binding = profile.bindings[btn.id];
                    const isRowSelected = selectedId === btn.id;
                    const typeLabel: Record<BindingType, string> = {
                      gamepad: 'Controle',
                      keyboard: 'Teclado',
                      mouse: 'Mouse',
                      macro: 'Macro',
                      disabled: 'Desativado',
                    };
                    return (
                      <tr
                        key={btn.id}
                        onClick={() => handleSelectButton(btn.id)}
                        className={`transition-colors cursor-pointer ${
                          isRowSelected ? 'bg-[#1D212C]' : 'hover:bg-[#181C25]'
                        }`}
                      >
                        <td className="py-2.5 px-5 font-medium text-[#F4F6F9]">
                          <span className="font-mono text-xs text-[#F97316] mr-2.5">
                            {btn.shortLabel}
                          </span>
                          <span>{btn.name}</span>
                        </td>
                        <td className="py-2.5 px-4 text-xs text-[#8B95A8]">{btn.group}</td>
                        <td className="py-2.5 px-4 text-xs text-[#B2BAC9]">
                          {typeLabel[binding.type]}
                        </td>
                        <td className="py-2.5 px-4 font-mono text-xs text-[#E2E8F0]">
                          {binding.label}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono text-xs tabular-nums">
                          {binding.turboEnabled ? (
                            <span className="text-[#F97316]">
                              {binding.turboRateHz} Hz ·{' '}
                              {(binding.turboMode ?? 'hold') === 'auto' ? 'Auto' : 'Segurar'}
                            </span>
                          ) : (
                            <span className="text-[#656F82]">—</span>
                          )}
                        </td>
                        <td className="py-2.5 px-5 text-right">
                          <span className="text-xs font-medium text-[#F97316]">
                            {isRowSelected ? 'Editando' : 'Editar'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
};
