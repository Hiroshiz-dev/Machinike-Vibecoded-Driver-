export type PhysicalButtonId =
  | 'A'
  | 'B'
  | 'X'
  | 'Y'
  | 'LB'
  | 'RB'
  | 'LT'
  | 'RT'
  | 'L3'
  | 'R3'
  | 'UP'
  | 'DOWN'
  | 'LEFT'
  | 'RIGHT'
  | 'VIEW'
  | 'MENU'
  | 'HOME'
  | 'M1'
  | 'M2'
  | 'M3'
  | 'M4';

export type BindingType = 'gamepad' | 'keyboard' | 'mouse' | 'macro' | 'disabled';
export type TurboMode = 'hold' | 'auto';

export interface ButtonBinding {
  type: BindingType;
  value: string; // e.g., 'A', 'Space', 'MouseLeft', macroId, or ''
  label: string; // Human-readable label shown in UI
  turboEnabled: boolean;
  turboRateHz: number; // 1 - 30 Hz (disparos por segundo)
  turboMode: TurboMode; // 'hold' = enquanto pressionado, 'auto' = disparo automático contínuo
}

export type MacroTriggerMode = 'once' | 'hold' | 'toggle';
export type MacroStepAction = 'tap' | 'press' | 'release';

export interface MacroStep {
  id: string;
  input: string; // Button ID or key name
  action: MacroStepAction;
  durationMs: number; // Hold duration for tap
  delayAfterMs: number; // Pause before next step
}

export interface MacroDefinition {
  id: string;
  name: string;
  description: string;
  triggerMode: MacroTriggerMode;
  steps: MacroStep[];
  createdAt: string;
}

export type RgbMode = 'static' | 'breathing' | 'rainbow' | 'reactive' | 'pulse' | 'off';

export interface RgbZoneColors {
  leftStrip: string;
  rightStrip: string;
  centerRing: string;
}

export interface RgbConfig {
  mode: RgbMode;
  brightness: number; // 0 - 100
  speed: number; // 1 - 5
  syncZones: boolean;
  zones: RgbZoneColors;
  reactiveColor: string;
  direction: 'ltr' | 'rtl' | 'center';
}

export type StickCurvePreset = 'linear' | 'precision' | 'aggressive' | 'classic';
export type OuterRingMode = 'circular' | 'square';

export interface StickConfig {
  innerDeadzone: number; // 0 - 30 %
  outerDeadzone: number; // 70 - 100 %
  curve: StickCurvePreset;
  outerRingMode: OuterRingMode;
  invertX: boolean;
  invertY: boolean;
}

export interface TriggerConfig {
  startDeadzone: number; // 0 - 50 %
  endDeadzone: number; // 50 - 100 %
  hairTrigger: boolean; // Instant digital actuation
}

export interface VibrationPulseStep {
  id: string;
  leftMotor: number; // 0 - 100 % (graves / peso)
  rightMotor: number; // 0 - 100 % (agudos / precisão)
  durationMs: number; // 30 - 1500 ms
  pauseMs: number; // 0 - 1000 ms
}

export interface VibrationPattern {
  id: string;
  name: string;
  description: string;
  isCustom: boolean;
  steps: VibrationPulseStep[];
}

export type GameVibrationEventId =
  | 'gunshot'
  | 'explosion'
  | 'damage'
  | 'collision'
  | 'ability';

export interface VibrationEventBinding {
  eventId: GameVibrationEventId;
  eventName: string;
  eventDescription: string;
  enabled: boolean;
  patternId: string;
  intensityScale: number; // 10 - 100 %
}

export type PollingRateHz = 125 | 250 | 500 | 1000;
export type ConnectionMode = 'usb' | 'dongle24g' | 'bluetooth';
export type AbxyLayout = 'xbox' | 'switch';
export type GyroTarget = 'off' | 'rightStick' | 'mouse';
export type GyroActivation = 'always' | 'LT' | 'LB' | 'M1';

export interface DriverConfig {
  pollingRate: PollingRateHz;
  connectionMode: ConnectionMode;
  abxyLayout: AbxyLayout;
  vibrationEnabled: boolean;
  vibrationLeft: number; // 0 - 100
  vibrationRight: number; // 0 - 100
  vibrationPatterns: VibrationPattern[];
  vibrationEvents: VibrationEventBinding[];
  gyroTarget: GyroTarget;
  gyroSensitivity: number; // 1 - 100
  gyroActivation: GyroActivation;
  sleepMinutes: number; // 0 = never, 5, 10, 30
  leftStick: StickConfig;
  rightStick: StickConfig;
  leftTrigger: TriggerConfig;
  rightTrigger: TriggerConfig;
}

export interface ControllerProfile {
  id: string;
  slot?: number; // Optional onboard slot indicator (1-4)
  name: string;
  gameTitle: string;
  category: string;
  bindings: Record<PhysicalButtonId, ButtonBinding>;
  macros: MacroDefinition[];
  rgb: RgbConfig;
  driver: DriverConfig;
  createdAt: string;
  updatedAt: string;
}

export interface PhysicalButtonMeta {
  id: PhysicalButtonId;
  name: string;
  shortLabel: string;
  group: 'Ação' | 'Ombros e Gatilhos' | 'Direcional' | 'Analógicos' | 'Sistema' | 'Paddles Traseiros';
  side: 'front' | 'rear';
  gamepadIndex?: number;
}

export const PHYSICAL_BUTTONS: PhysicalButtonMeta[] = [
  { id: 'A', name: 'Botão A', shortLabel: 'A', group: 'Ação', side: 'front', gamepadIndex: 0 },
  { id: 'B', name: 'Botão B', shortLabel: 'B', group: 'Ação', side: 'front', gamepadIndex: 1 },
  { id: 'X', name: 'Botão X', shortLabel: 'X', group: 'Ação', side: 'front', gamepadIndex: 2 },
  { id: 'Y', name: 'Botão Y', shortLabel: 'Y', group: 'Ação', side: 'front', gamepadIndex: 3 },
  { id: 'LB', name: 'Ombro Esquerdo (LB)', shortLabel: 'LB', group: 'Ombros e Gatilhos', side: 'front', gamepadIndex: 4 },
  { id: 'RB', name: 'Ombro Direito (RB)', shortLabel: 'RB', group: 'Ombros e Gatilhos', side: 'front', gamepadIndex: 5 },
  { id: 'LT', name: 'Gatilho Hall Esquerdo (LT)', shortLabel: 'LT', group: 'Ombros e Gatilhos', side: 'front', gamepadIndex: 6 },
  { id: 'RT', name: 'Gatilho Hall Direito (RT)', shortLabel: 'RT', group: 'Ombros e Gatilhos', side: 'front', gamepadIndex: 7 },
  { id: 'VIEW', name: 'Botão View / Back', shortLabel: 'VIEW', group: 'Sistema', side: 'front', gamepadIndex: 8 },
  { id: 'MENU', name: 'Botão Menu / Start', shortLabel: 'MENU', group: 'Sistema', side: 'front', gamepadIndex: 9 },
  { id: 'L3', name: 'Clique Analógico Esq. (L3)', shortLabel: 'L3', group: 'Analógicos', side: 'front', gamepadIndex: 10 },
  { id: 'R3', name: 'Clique Analógico Dir. (R3)', shortLabel: 'R3', group: 'Analógicos', side: 'front', gamepadIndex: 11 },
  { id: 'UP', name: 'Direcional Cima', shortLabel: 'D-Up', group: 'Direcional', side: 'front', gamepadIndex: 12 },
  { id: 'DOWN', name: 'Direcional Baixo', shortLabel: 'D-Dn', group: 'Direcional', side: 'front', gamepadIndex: 13 },
  { id: 'LEFT', name: 'Direcional Esquerda', shortLabel: 'D-Lt', group: 'Direcional', side: 'front', gamepadIndex: 14 },
  { id: 'RIGHT', name: 'Direcional Direita', shortLabel: 'D-Rt', group: 'Direcional', side: 'front', gamepadIndex: 15 },
  { id: 'HOME', name: 'Botão Machenike Home', shortLabel: 'HOME', group: 'Sistema', side: 'front', gamepadIndex: 16 },
  { id: 'M1', name: 'Paddle Traseiro Esq. (M1)', shortLabel: 'M1', group: 'Paddles Traseiros', side: 'rear' },
  { id: 'M2', name: 'Paddle Traseiro Dir. (M2)', shortLabel: 'M2', group: 'Paddles Traseiros', side: 'rear' },
  { id: 'M3', name: 'Ombro Extra Esq. (M3)', shortLabel: 'M3', group: 'Paddles Traseiros', side: 'front' },
  { id: 'M4', name: 'Ombro Extra Dir. (M4)', shortLabel: 'M4', group: 'Paddles Traseiros', side: 'front' },
];

const EXTRA_BUTTON_IDS = new Set<PhysicalButtonId>(['M1', 'M2', 'M3', 'M4']);

export function getButtonsForDevice(extraButtons: PhysicalButtonId[]): PhysicalButtonMeta[] {
  const allowedExtras = new Set<PhysicalButtonId>(extraButtons);
  return PHYSICAL_BUTTONS.filter(
    (b) => !EXTRA_BUTTON_IDS.has(b.id) || allowedExtras.has(b.id)
  );
}

export const KEYBOARD_PRESETS: Array<{ value: string; label: string }> = [
  { value: 'Space', label: 'Espaço' },
  { value: 'ShiftLeft', label: 'Shift Esq.' },
  { value: 'ControlLeft', label: 'Ctrl Esq.' },
  { value: 'KeyR', label: 'Tecla R' },
  { value: 'KeyE', label: 'Tecla E' },
  { value: 'KeyF', label: 'Tecla F' },
  { value: 'KeyQ', label: 'Tecla Q' },
  { value: 'KeyG', label: 'Tecla G' },
  { value: 'Tab', label: 'Tab' },
  { value: 'Escape', label: 'Esc' },
  { value: 'Digit1', label: 'Tecla 1' },
  { value: 'Digit2', label: 'Tecla 2' },
  { value: 'Digit3', label: 'Tecla 3' },
  { value: 'F12', label: 'Captura (F12)' },
];

export const MOUSE_PRESETS: Array<{ value: string; label: string }> = [
  { value: 'MouseLeft', label: 'Clique Esquerdo' },
  { value: 'MouseRight', label: 'Clique Direito' },
  { value: 'MouseMiddle', label: 'Clique do Meio' },
  { value: 'WheelUp', label: 'Rolar para Cima' },
  { value: 'WheelDown', label: 'Rolar para Baixo' },
  { value: 'DPI_Clutch', label: 'Sniper DPI (50%)' },
];

export function createDefaultVibrationPatterns(): VibrationPattern[] {
  return [
    {
      id: 'pat-recoil',
      name: 'Recuo de Disparo',
      description: 'Pulsos curtos e secos concentrados no motor de alta frequência para cadência de tiro.',
      isCustom: false,
      steps: [
        { id: 'vr1', leftMotor: 35, rightMotor: 85, durationMs: 65, pauseMs: 45 },
        { id: 'vr2', leftMotor: 30, rightMotor: 80, durationMs: 60, pauseMs: 45 },
        { id: 'vr3', leftMotor: 25, rightMotor: 75, durationMs: 55, pauseMs: 30 },
      ],
    },
    {
      id: 'pat-explosion',
      name: 'Onda de Explosão',
      description: 'Pico máximo no motor esquerdo de graves seguido por reverberação decrescente.',
      isCustom: false,
      steps: [
        { id: 've1', leftMotor: 100, rightMotor: 75, durationMs: 280, pauseMs: 40 },
        { id: 've2', leftMotor: 65, rightMotor: 50, durationMs: 220, pauseMs: 50 },
        { id: 've3', leftMotor: 30, rightMotor: 25, durationMs: 180, pauseMs: 0 },
      ],
    },
    {
      id: 'pat-damage',
      name: 'Impacto de Dano',
      description: 'Duplo golpe assimétrico para sinalizar acertos sofridos ou quebra de escudo.',
      isCustom: false,
      steps: [
        { id: 'vd1', leftMotor: 85, rightMotor: 30, durationMs: 110, pauseMs: 70 },
        { id: 'vd2', leftMotor: 40, rightMotor: 95, durationMs: 130, pauseMs: 0 },
      ],
    },
    {
      id: 'pat-rumble-strip',
      name: 'Zebra de Pista / Terreno',
      description: 'Vibração alternada contínua simulando irregularidade do asfalto ou motor em alta rotação.',
      isCustom: false,
      steps: [
        { id: 'vz1', leftMotor: 55, rightMotor: 20, durationMs: 80, pauseMs: 35 },
        { id: 'vz2', leftMotor: 20, rightMotor: 60, durationMs: 80, pauseMs: 35 },
        { id: 'vz3', leftMotor: 60, rightMotor: 25, durationMs: 80, pauseMs: 35 },
        { id: 'vz4', leftMotor: 25, rightMotor: 65, durationMs: 80, pauseMs: 0 },
      ],
    },
    {
      id: 'pat-ping',
      name: 'Pulso Tátil Sutil',
      description: 'Toque leve e preciso no motor direito para confirmar recarga ou habilidade disponível.',
      isCustom: false,
      steps: [
        { id: 'vp1', leftMotor: 0, rightMotor: 50, durationMs: 55, pauseMs: 65 },
        { id: 'vp2', leftMotor: 15, rightMotor: 70, durationMs: 65, pauseMs: 0 },
      ],
    },
  ];
}

export function createDefaultVibrationEvents(): VibrationEventBinding[] {
  return [
    {
      eventId: 'gunshot',
      eventName: 'Tiro e Recuo de Arma',
      eventDescription: 'Acionado ao disparar armas semiautomáticas ou rajadas no gatilho RT.',
      enabled: true,
      patternId: 'pat-recoil',
      intensityScale: 75,
    },
    {
      eventId: 'explosion',
      eventName: 'Explosão e Impacto Pesado',
      eventDescription: 'Resposta profunda de baixa frequência para granadas, quedas e golpes críticos.',
      enabled: true,
      patternId: 'pat-explosion',
      intensityScale: 95,
    },
    {
      eventId: 'damage',
      eventName: 'Dano Recebido / Escudo',
      eventDescription: 'Alerta háptico rápido quando o personagem sofre dano ou perda de armadura.',
      enabled: true,
      patternId: 'pat-damage',
      intensityScale: 85,
    },
    {
      eventId: 'collision',
      eventName: 'Colisão e Zebra de Pista',
      eventDescription: 'Textura tátil contínua para derrapagens, zebras e colisões laterais.',
      enabled: false,
      patternId: 'pat-rumble-strip',
      intensityScale: 80,
    },
    {
      eventId: 'ability',
      eventName: 'Habilidade Pronta / Recarga',
      eventDescription: 'Sinalização sutil no motor direito ao concluir recarga ou cooldown.',
      enabled: true,
      patternId: 'pat-ping',
      intensityScale: 60,
    },
  ];
}

export function createDefaultBindings(): Record<PhysicalButtonId, ButtonBinding> {
  const result = {} as Record<PhysicalButtonId, ButtonBinding>;
  for (const btn of PHYSICAL_BUTTONS) {
    if (btn.id === 'M1') {
      result[btn.id] = {
        type: 'gamepad',
        value: 'A',
        label: 'A (Pular)',
        turboEnabled: false,
        turboRateHz: 12,
        turboMode: 'hold',
      };
    } else if (btn.id === 'M2') {
      result[btn.id] = {
        type: 'gamepad',
        value: 'B',
        label: 'B (Agachar)',
        turboEnabled: false,
        turboRateHz: 12,
        turboMode: 'hold',
      };
    } else if (btn.id === 'M3') {
      result[btn.id] = {
        type: 'gamepad',
        value: 'X',
        label: 'X (Recarregar)',
        turboEnabled: false,
        turboRateHz: 12,
        turboMode: 'hold',
      };
    } else if (btn.id === 'M4') {
      result[btn.id] = {
        type: 'gamepad',
        value: 'Y',
        label: 'Y (Trocar Arma)',
        turboEnabled: false,
        turboRateHz: 12,
        turboMode: 'hold',
      };
    } else {
      result[btn.id] = {
        type: 'gamepad',
        value: btn.id,
        label: btn.shortLabel,
        turboEnabled: false,
        turboRateHz: 12,
        turboMode: 'hold',
      };
    }
  }
  return result;
}

export const INITIAL_MACROS: MacroDefinition[] = [
  {
    id: 'macro-slide-cancel',
    name: 'Slide Cancel FPS',
    description: 'Sequência rápida de agachar, cancelar deslize e levantar para movimentação competitiva.',
    triggerMode: 'once',
    createdAt: '2026-11-18',
    steps: [
      { id: 's1', input: 'B', action: 'tap', durationMs: 65, delayAfterMs: 45 },
      { id: 's2', input: 'B', action: 'tap', durationMs: 50, delayAfterMs: 35 },
      { id: 's3', input: 'A', action: 'tap', durationMs: 60, delayAfterMs: 20 },
    ],
  },
  {
    id: 'macro-drop-shot',
    name: 'Drop Shot + Mira',
    description: 'Aciona mira no gatilho esquerdo enquanto deita instantaneamente e inicia rajada.',
    triggerMode: 'hold',
    createdAt: '2026-11-19',
    steps: [
      { id: 'd1', input: 'LT', action: 'press', durationMs: 40, delayAfterMs: 15 },
      { id: 'd2', input: 'B', action: 'tap', durationMs: 260, delayAfterMs: 20 },
      { id: 'd3', input: 'RT', action: 'tap', durationMs: 180, delayAfterMs: 30 },
      { id: 'd4', input: 'LT', action: 'release', durationMs: 20, delayAfterMs: 10 },
    ],
  },
  {
    id: 'macro-hadouken',
    name: 'Combo Meia-Lua Direita',
    description: 'Execução precisa de comando direcional baixo, diagonal, frente e golpe médio.',
    triggerMode: 'once',
    createdAt: '2026-11-20',
    steps: [
      { id: 'h1', input: 'DOWN', action: 'press', durationMs: 30, delayAfterMs: 25 },
      { id: 'h2', input: 'RIGHT', action: 'press', durationMs: 30, delayAfterMs: 25 },
      { id: 'h3', input: 'DOWN', action: 'release', durationMs: 20, delayAfterMs: 20 },
      { id: 'h4', input: 'X', action: 'tap', durationMs: 55, delayAfterMs: 15 },
      { id: 'h5', input: 'RIGHT', action: 'release', durationMs: 20, delayAfterMs: 10 },
    ],
  },
  {
    id: 'macro-quick-heal',
    name: 'Cura Rápida + Esquiva',
    description: 'Ativa item de cura no D-Pad e executa rolamento defensivo logo após a animação.',
    triggerMode: 'once',
    createdAt: '2026-11-21',
    steps: [
      { id: 'q1', input: 'UP', action: 'tap', durationMs: 70, delayAfterMs: 140 },
      { id: 'q2', input: 'LB', action: 'tap', durationMs: 80, delayAfterMs: 40 },
      { id: 'q3', input: 'B', action: 'tap', durationMs: 90, delayAfterMs: 25 },
    ],
  },
];

export function createFactoryDriverConfig(): DriverConfig {
  return {
    pollingRate: 500,
    connectionMode: 'dongle24g',
    abxyLayout: 'xbox',
    vibrationEnabled: true,
    vibrationLeft: 65,
    vibrationRight: 65,
    vibrationPatterns: createDefaultVibrationPatterns(),
    vibrationEvents: createDefaultVibrationEvents(),
    gyroTarget: 'off',
    gyroSensitivity: 50,
    gyroActivation: 'LT',
    sleepMinutes: 10,
    leftStick: {
      innerDeadzone: 4,
      outerDeadzone: 100,
      curve: 'linear',
      outerRingMode: 'circular',
      invertX: false,
      invertY: false,
    },
    rightStick: {
      innerDeadzone: 4,
      outerDeadzone: 100,
      curve: 'linear',
      outerRingMode: 'circular',
      invertX: false,
      invertY: false,
    },
    leftTrigger: {
      startDeadzone: 2,
      endDeadzone: 100,
      hairTrigger: false,
    },
    rightTrigger: {
      startDeadzone: 2,
      endDeadzone: 100,
      hairTrigger: false,
    },
  };
}

export function createInitialProfiles(): ControllerProfile[] {
  const fpsBindings = createDefaultBindings();
  fpsBindings.M1 = {
    type: 'macro',
    value: 'macro-slide-cancel',
    label: 'Slide Cancel FPS',
    turboEnabled: false,
    turboRateHz: 12,
    turboMode: 'hold',
  };
  fpsBindings.M2 = {
    type: 'gamepad',
    value: 'A',
    label: 'A (Pular)',
    turboEnabled: false,
    turboRateHz: 12,
    turboMode: 'hold',
  };
  fpsBindings.RT = {
    ...fpsBindings.RT,
    turboEnabled: true,
    turboRateHz: 16,
    turboMode: 'hold',
  };

  const fightBindings = createDefaultBindings();
  fightBindings.M1 = {
    type: 'macro',
    value: 'macro-hadouken',
    label: 'Combo Meia-Lua Direita',
    turboEnabled: false,
    turboRateHz: 12,
    turboMode: 'hold',
  };
  fightBindings.M2 = {
    type: 'gamepad',
    value: 'RB',
    label: 'RB',
    turboEnabled: true,
    turboRateHz: 20,
    turboMode: 'hold',
  };
  fightBindings.X = {
    ...fightBindings.X,
    turboEnabled: true,
    turboRateHz: 14,
    turboMode: 'hold',
  };

  const raceBindings = createDefaultBindings();
  raceBindings.M1 = {
    type: 'gamepad',
    value: 'LB',
    label: 'Reduzir Marcha (LB)',
    turboEnabled: false,
    turboRateHz: 12,
    turboMode: 'hold',
  };
  raceBindings.M2 = {
    type: 'gamepad',
    value: 'RB',
    label: 'Subir Marcha (RB)',
    turboEnabled: false,
    turboRateHz: 12,
    turboMode: 'hold',
  };

  const raceEvents = createDefaultVibrationEvents().map((ev) =>
    ev.eventId === 'collision'
      ? { ...ev, enabled: true, intensityScale: 95 }
      : ev.eventId === 'gunshot'
      ? { ...ev, enabled: false }
      : ev
  );

  return [
    {
      id: 'profile-1',
      slot: 1,
      name: 'FPS Competitivo',
      gameTitle: 'Call of Duty / Apex Legends',
      category: 'Tiro em Primeira Pessoa',
      createdAt: '2026-11-18',
      updatedAt: '2026-11-22',
      bindings: fpsBindings,
      macros: [INITIAL_MACROS[0], INITIAL_MACROS[1]],
      rgb: {
        mode: 'reactive',
        brightness: 85,
        speed: 4,
        syncZones: false,
        zones: {
          leftStrip: '#F97316',
          rightStrip: '#F97316',
          centerRing: '#38BDF8',
        },
        reactiveColor: '#FFFFFF',
        direction: 'center',
      },
      driver: {
        ...createFactoryDriverConfig(),
        pollingRate: 1000,
        connectionMode: 'dongle24g',
        vibrationLeft: 45,
        vibrationRight: 60,
        gyroTarget: 'rightStick',
        gyroSensitivity: 42,
        gyroActivation: 'LT',
        leftStick: {
          innerDeadzone: 3,
          outerDeadzone: 98,
          curve: 'aggressive',
          outerRingMode: 'circular',
          invertX: false,
          invertY: false,
        },
        rightStick: {
          innerDeadzone: 2,
          outerDeadzone: 100,
          curve: 'precision',
          outerRingMode: 'circular',
          invertX: false,
          invertY: false,
        },
        leftTrigger: {
          startDeadzone: 2,
          endDeadzone: 45,
          hairTrigger: true,
        },
        rightTrigger: {
          startDeadzone: 2,
          endDeadzone: 40,
          hairTrigger: true,
        },
      },
    },
    {
      id: 'profile-2',
      slot: 2,
      name: 'Ação & Luta',
      gameTitle: 'Street Fighter 6 / Tekken 8',
      category: 'Jogos de Luta e Hack-and-Slash',
      createdAt: '2026-11-19',
      updatedAt: '2026-11-21',
      bindings: fightBindings,
      macros: [INITIAL_MACROS[2], INITIAL_MACROS[3]],
      rgb: {
        mode: 'breathing',
        brightness: 75,
        speed: 3,
        syncZones: true,
        zones: {
          leftStrip: '#EF4444',
          rightStrip: '#EF4444',
          centerRing: '#EF4444',
        },
        reactiveColor: '#FACC15',
        direction: 'ltr',
      },
      driver: {
        ...createFactoryDriverConfig(),
        pollingRate: 1000,
        connectionMode: 'usb',
        vibrationLeft: 75,
        vibrationRight: 80,
        sleepMinutes: 30,
        leftStick: {
          innerDeadzone: 5,
          outerDeadzone: 95,
          curve: 'linear',
          outerRingMode: 'square',
          invertX: false,
          invertY: false,
        },
        rightStick: {
          innerDeadzone: 5,
          outerDeadzone: 95,
          curve: 'linear',
          outerRingMode: 'circular',
          invertX: false,
          invertY: false,
        },
        leftTrigger: {
          startDeadzone: 5,
          endDeadzone: 85,
          hairTrigger: true,
        },
        rightTrigger: {
          startDeadzone: 5,
          endDeadzone: 85,
          hairTrigger: true,
        },
      },
    },
    {
      id: 'profile-3',
      slot: 3,
      name: 'Corrida & Simulação',
      gameTitle: 'Forza Motorsport / F1',
      category: 'Simuladores de Direção',
      createdAt: '2026-11-20',
      updatedAt: '2026-11-20',
      bindings: raceBindings,
      macros: [INITIAL_MACROS[3]],
      rgb: {
        mode: 'static',
        brightness: 70,
        speed: 2,
        syncZones: false,
        zones: {
          leftStrip: '#38BDF8',
          rightStrip: '#22C55E',
          centerRing: '#F4F6F9',
        },
        reactiveColor: '#38BDF8',
        direction: 'ltr',
      },
      driver: {
        ...createFactoryDriverConfig(),
        pollingRate: 500,
        connectionMode: 'dongle24g',
        vibrationLeft: 90,
        vibrationRight: 85,
        vibrationEvents: raceEvents,
        leftStick: {
          innerDeadzone: 1,
          outerDeadzone: 100,
          curve: 'precision',
          outerRingMode: 'circular',
          invertX: false,
          invertY: false,
        },
        rightStick: {
          innerDeadzone: 6,
          outerDeadzone: 100,
          curve: 'classic',
          outerRingMode: 'circular',
          invertX: false,
          invertY: false,
        },
        leftTrigger: {
          startDeadzone: 0,
          endDeadzone: 100,
          hairTrigger: false,
        },
        rightTrigger: {
          startDeadzone: 0,
          endDeadzone: 100,
          hairTrigger: false,
        },
      },
    },
    {
      id: 'profile-4',
      slot: 4,
      name: 'Padrão de Fábrica',
      gameTitle: 'Multiplataforma',
      category: 'Uso Geral',
      createdAt: '2026-11-18',
      updatedAt: '2026-11-18',
      bindings: createDefaultBindings(),
      macros: [],
      rgb: {
        mode: 'rainbow',
        brightness: 65,
        speed: 2,
        syncZones: true,
        zones: {
          leftStrip: '#38BDF8',
          rightStrip: '#38BDF8',
          centerRing: '#38BDF8',
        },
        reactiveColor: '#FFFFFF',
        direction: 'ltr',
      },
      driver: {
        ...createFactoryDriverConfig(),
        connectionMode: 'bluetooth',
      },
    },
  ];
}

export function evaluateStickCurve(input: number, preset: StickCurvePreset): number {
  const x = Math.max(0, Math.min(1, input));
  switch (preset) {
    case 'precision':
      return Math.pow(x, 1.85);
    case 'aggressive':
      return Math.pow(x, 0.62);
    case 'classic':
      return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
    case 'linear':
    default:
      return x;
  }
}
