import React, { useEffect, useMemo, useState } from 'react';
import {
  AbxyLayout,
  ButtonBinding,
  PhysicalButtonId,
  RgbConfig,
} from '../types/controller';
import { MachenikeDeviceSpec } from '../types/devices';

interface ControllerDiagramProps {
  view: 'front' | 'rear';
  deviceSpec: MachenikeDeviceSpec;
  rgb: RgbConfig;
  abxyLayout: AbxyLayout;
  bindings: Record<PhysicalButtonId, ButtonBinding>;
  selectedButton?: PhysicalButtonId | null;
  pressedButtons: Set<PhysicalButtonId>;
  leftStick: { x: number; y: number };
  rightStick: { x: number; y: number };
  ltValue: number;
  rtValue: number;
  lastEventTime: number;
  rumbleActive?: boolean;
  interactiveMode?: 'select' | 'test';
  onSelectButton?: (id: PhysicalButtonId) => void;
  onPressButton?: (id: PhysicalButtonId, down: boolean) => void;
  showBindingTags?: boolean;
  className?: string;
}

function hslToHex(h: number, s: number, l: number): string {
  const hue = ((h % 360) + 360) % 360;
  const sat = s / 100;
  const light = l / 100;
  const c = (1 - Math.abs(2 * light - 1)) * sat;
  const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
  const m = light - c / 2;
  let r = 0;
  let g = 0;
  let b = 0;
  if (hue < 60) {
    r = c;
    g = x;
  } else if (hue < 120) {
    r = x;
    g = c;
  } else if (hue < 180) {
    g = c;
    b = x;
  } else if (hue < 240) {
    g = x;
    b = c;
  } else if (hue < 300) {
    r = x;
    b = c;
  } else {
    r = c;
    b = x;
  }
  const toHex = (v: number) =>
    Math.round((v + m) * 255)
      .toString(16)
      .padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export const ControllerDiagram: React.FC<ControllerDiagramProps> = ({
  view,
  deviceSpec,
  rgb,
  abxyLayout,
  bindings,
  selectedButton,
  pressedButtons,
  leftStick,
  rightStick,
  ltValue,
  rtValue,
  lastEventTime,
  rumbleActive = false,
  interactiveMode = 'select',
  onSelectButton,
  onPressButton,
  showBindingTags = false,
  className = '',
}) => {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (rgb.mode === 'static' || rgb.mode === 'off') return;
    let raf = 0;
    const loop = (now: number) => {
      setTick(now);
      raf = window.requestAnimationFrame(loop);
    };
    raf = window.requestAnimationFrame(loop);
    return () => window.cancelAnimationFrame(raf);
  }, [rgb.mode]);

  const computedRgb = useMemo(() => {
    const baseOpacity = rgb.mode === 'off' ? 0 : Math.max(0.08, rgb.brightness / 100);
    const leftBase = rgb.zones.leftStrip;
    const rightBase = rgb.syncZones ? rgb.zones.leftStrip : rgb.zones.rightStrip;
    const centerBase = rgb.syncZones ? rgb.zones.leftStrip : rgb.zones.centerRing;

    if (rgb.mode === 'off') {
      return { left: '#232834', right: '#232834', center: '#232834', opacity: 0 };
    }
    if (rgb.mode === 'static') {
      return { left: leftBase, right: rightBase, center: centerBase, opacity: baseOpacity };
    }

    const speedFactor = 0.4 + rgb.speed * 0.45;
    const sec = tick / 1000;

    if (rgb.mode === 'breathing') {
      const wave = 0.25 + 0.75 * ((Math.sin(sec * speedFactor * 2.1) + 1) / 2);
      return {
        left: leftBase,
        right: rightBase,
        center: centerBase,
        opacity: baseOpacity * wave,
      };
    }

    if (rgb.mode === 'pulse') {
      const phase = (sec * speedFactor * 1.4) % 1;
      const intensity = phase < 0.25 ? 1 - phase * 2 : 0.2;
      return {
        left: leftBase,
        right: rightBase,
        center: centerBase,
        opacity: baseOpacity * intensity,
      };
    }

    if (rgb.mode === 'rainbow') {
      const baseHue = (sec * speedFactor * 65) % 360;
      const offsetL = rgb.direction === 'rtl' ? 90 : rgb.direction === 'center' ? 50 : 0;
      const offsetC = rgb.direction === 'center' ? 0 : 45;
      const offsetR = rgb.direction === 'rtl' ? 0 : rgb.direction === 'center' ? 50 : 90;
      return {
        left: hslToHex(baseHue + offsetL, 90, 58),
        center: hslToHex(baseHue + offsetC, 90, 58),
        right: hslToHex(baseHue + offsetR, 90, 58),
        opacity: baseOpacity,
      };
    }

    const elapsed = Math.max(0, tick - lastEventTime);
    const hasPressed = pressedButtons.size > 0;
    const decay = hasPressed ? 1 : Math.max(0, 1 - elapsed / 650);
    if (decay > 0.05) {
      return {
        left: decay > 0.55 ? rgb.reactiveColor : leftBase,
        right: decay > 0.55 ? rgb.reactiveColor : rightBase,
        center: decay > 0.55 ? rgb.reactiveColor : centerBase,
        opacity: Math.min(1, baseOpacity * (0.35 + decay * 0.65)),
      };
    }
    return {
      left: leftBase,
      right: rightBase,
      center: centerBase,
      opacity: baseOpacity * 0.35,
    };
  }, [rgb, tick, lastEventTime, pressedButtons]);

  const handleInteraction = (id: PhysicalButtonId) => ({
    onClick: () => {
      onSelectButton?.(id);
    },
    onMouseDown: () => {
      if (interactiveMode === 'test') {
        onPressButton?.(id, true);
      }
    },
    onMouseUp: () => {
      if (interactiveMode === 'test') {
        onPressButton?.(id, false);
      }
    },
    onMouseLeave: () => {
      if (interactiveMode === 'test' && pressedButtons.has(id)) {
        onPressButton?.(id, false);
      }
    },
  });

  const isSelected = (id: PhysicalButtonId) => selectedButton === id;
  const isPressed = (id: PhysicalButtonId) => pressedButtons.has(id);

  const isCustomMapped = (id: PhysicalButtonId) => {
    const b = bindings[id];
    if (!b) return false;
    if (b.type === 'macro' || b.type === 'keyboard' || b.type === 'mouse' || b.type === 'disabled')
      return true;
    if (b.turboEnabled) return true;
    if (!['M1', 'M2', 'M3', 'M4'].includes(id) && b.value !== id) return true;
    return false;
  };

  const btnStroke = (id: PhysicalButtonId) => {
    if (isPressed(id)) return '#F97316';
    if (isSelected(id)) return '#F97316';
    if (isCustomMapped(id)) return '#38BDF8';
    return '#363D4E';
  };

  const btnFill = (id: PhysicalButtonId, base = '#1A1E27') => {
    if (isPressed(id)) return '#F97316';
    if (isSelected(id)) return '#2A221D';
    return base;
  };

  const abxyLabels =
    abxyLayout === 'switch'
      ? { A: 'B', B: 'A', X: 'Y', Y: 'X' }
      : { A: 'A', B: 'B', X: 'X', Y: 'Y' };

  const lxOffset = leftStick.x * 16;
  const lyOffset = leftStick.y * 16;
  const rxOffset = rightStick.x * 16;
  const ryOffset = rightStick.y * 16;

  const hasM1M2 = deviceSpec.extraButtons.includes('M1') && deviceSpec.extraButtons.includes('M2');
  const hasM3M4 = deviceSpec.extraButtons.includes('M3') && deviceSpec.extraButtons.includes('M4');

  return (
    <div
      className={`relative select-none flex items-center justify-center ${className}`}
      style={{
        transform: rumbleActive ? 'translate3d(1.5px, -1px, 0)' : 'translate3d(0, 0, 0)',
        transition: rumbleActive ? 'none' : 'transform 120ms ease',
      }}
    >
      <svg
        viewBox="0 0 640 420"
        className="w-full max-w-[600px] h-auto overflow-visible"
        role="img"
        aria-label={
          view === 'front'
            ? `Diagrama interativo frontal do controle ${deviceSpec.name}`
            : `Diagrama interativo traseiro do controle ${deviceSpec.name}`
        }
      >
        <defs>
          <linearGradient id="chassisBody" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#252A36" />
            <stop offset="45%" stopColor="#171B24" />
            <stop offset="100%" stopColor="#10131A" />
          </linearGradient>
          <linearGradient id="faceplateGlass" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2C3240" stopOpacity="0.55" />
            <stop offset="50%" stopColor="#181C25" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#12151C" stopOpacity="0.92" />
          </linearGradient>
          <linearGradient id="metallicShoulder" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#3B4354" />
            <stop offset="100%" stopColor="#1F2430" />
          </linearGradient>
          <filter id="rgbGlow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="5.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="softShadow" x="-15%" y="-15%" width="130%" height="130%">
            <feDropShadow dx="0" dy="14" stdDeviation="14" floodColor="#000000" floodOpacity="0.65" />
          </filter>
        </defs>

        {view === 'front' ? (
          <g filter="url(#softShadow)">
            {/* Top Triggers LT & RT */}
            <g className="cursor-pointer" {...handleInteraction('LT')}>
              <path
                d="M148 76 C158 50 202 44 226 52 L222 80 L144 88 Z"
                fill={ltValue > 0.08 || isPressed('LT') ? '#F97316' : '#1E232E'}
                stroke={btnStroke('LT')}
                strokeWidth={isSelected('LT') ? 2.2 : 1.3}
              />
              <text
                x="184"
                y="67"
                textAnchor="middle"
                className="font-mono text-[10px] font-semibold fill-[#D7DCE6] pointer-events-none"
              >
                LT {ltValue > 0.05 ? `${Math.round(ltValue * 100)}%` : ''}
              </text>
            </g>

            <g className="cursor-pointer" {...handleInteraction('RT')}>
              <path
                d="M492 76 C482 50 438 44 414 52 L418 80 L496 88 Z"
                fill={rtValue > 0.08 || isPressed('RT') ? '#F97316' : '#1E232E'}
                stroke={btnStroke('RT')}
                strokeWidth={isSelected('RT') ? 2.2 : 1.3}
              />
              <text
                x="456"
                y="67"
                textAnchor="middle"
                className="font-mono text-[10px] font-semibold fill-[#D7DCE6] pointer-events-none"
              >
                RT {rtValue > 0.05 ? `${Math.round(rtValue * 100)}%` : ''}
              </text>
            </g>

            {/* Extra Top Shoulder Buttons M3 & M4 (G5 Pro V2 & G6 Pro) */}
            {hasM3M4 && (
              <>
                <g className="cursor-pointer" {...handleInteraction('M3')}>
                  <rect
                    x="236"
                    y="64"
                    width="44"
                    height="20"
                    rx="5"
                    fill={btnFill('M3', '#232936')}
                    stroke={btnStroke('M3')}
                    strokeWidth={isSelected('M3') ? 2.2 : 1.4}
                  />
                  <text
                    x="258"
                    y="78"
                    textAnchor="middle"
                    className="font-mono text-[10px] font-semibold fill-[#F1F3F7] pointer-events-none"
                  >
                    M3
                  </text>
                </g>

                <g className="cursor-pointer" {...handleInteraction('M4')}>
                  <rect
                    x="360"
                    y="64"
                    width="44"
                    height="20"
                    rx="5"
                    fill={btnFill('M4', '#232936')}
                    stroke={btnStroke('M4')}
                    strokeWidth={isSelected('M4') ? 2.2 : 1.4}
                  />
                  <text
                    x="382"
                    y="78"
                    textAnchor="middle"
                    className="font-mono text-[10px] font-semibold fill-[#F1F3F7] pointer-events-none"
                  >
                    M4
                  </text>
                </g>
              </>
            )}

            {/* Top Bumpers LB & RB */}
            <g className="cursor-pointer" {...handleInteraction('LB')}>
              <path
                d="M126 102 C142 74 198 68 238 78 L234 98 C196 92 152 98 130 116 Z"
                fill={isPressed('LB') ? '#F97316' : 'url(#metallicShoulder)'}
                stroke={btnStroke('LB')}
                strokeWidth={isSelected('LB') ? 2.2 : 1.4}
              />
              <text
                x="184"
                y="91"
                textAnchor="middle"
                className="font-mono text-[10px] font-semibold fill-[#F1F3F7] pointer-events-none"
              >
                LB
              </text>
            </g>

            <g className="cursor-pointer" {...handleInteraction('RB')}>
              <path
                d="M514 102 C498 74 442 68 402 78 L406 98 C444 92 488 98 510 116 Z"
                fill={isPressed('RB') ? '#F97316' : 'url(#metallicShoulder)'}
                stroke={btnStroke('RB')}
                strokeWidth={isSelected('RB') ? 2.2 : 1.4}
              />
              <text
                x="456"
                y="91"
                textAnchor="middle"
                className="font-mono text-[10px] font-semibold fill-[#F1F3F7] pointer-events-none"
              >
                RB
              </text>
            </g>

            {/* Main Sculpted Chassis Silhouette */}
            <path
              d="M236 86 L404 86 C452 86 498 98 524 134 C548 168 566 254 570 308 C573 348 548 378 514 378 C482 378 462 344 440 310 C422 284 398 274 362 274 L278 274 C242 274 218 284 200 310 C178 344 158 378 126 378 C92 378 67 348 70 308 C74 254 92 168 116 134 C142 98 188 86 236 86 Z"
              fill="url(#chassisBody)"
              stroke="#2F3646"
              strokeWidth="1.6"
            />

            {/* Translucent Magnetic Faceplate Seam */}
            <path
              d="M242 94 L398 94 C442 94 484 105 508 138 C525 162 536 210 542 256 C508 268 480 280 456 296 C434 270 402 260 364 260 L276 260 C238 260 206 270 184 296 C160 280 132 268 98 256 C104 210 115 162 132 138 C156 105 198 94 242 94 Z"
              fill="url(#faceplateGlass)"
              stroke="rgba(255,255,255,0.08)"
              strokeWidth="1"
            />

            {/* Subtle internal mecha circuit lines */}
            <path
              d="M150 264 L178 236 L216 236 M490 264 L462 236 L424 236 M292 102 L292 124 M348 102 L348 124"
              stroke="rgba(255,255,255,0.05)"
              strokeWidth="1.2"
              fill="none"
            />

            {/* DUAL SIDE RGB STRIPS (G5 Pro Max, G5 Pro, G5 Pro V2) */}
            {deviceSpec.rgbStyle === 'strips' && (
              <>
                <path
                  d="M126 154 C108 188 97 238 92 292 C91 312 96 332 107 344"
                  fill="none"
                  stroke={computedRgb.left}
                  strokeWidth="5.5"
                  strokeLinecap="round"
                  opacity={computedRgb.opacity}
                  filter="url(#rgbGlow)"
                />
                <path
                  d="M126 154 C108 188 97 238 92 292 C91 312 96 332 107 344"
                  fill="none"
                  stroke="#FFFFFF"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                  opacity={computedRgb.opacity * 0.7}
                />

                <path
                  d="M514 154 C532 188 543 238 548 292 C549 312 544 332 533 344"
                  fill="none"
                  stroke={computedRgb.right}
                  strokeWidth="5.5"
                  strokeLinecap="round"
                  opacity={computedRgb.opacity}
                  filter="url(#rgbGlow)"
                />
                <path
                  d="M514 154 C532 188 543 238 548 292 C549 312 544 332 533 344"
                  fill="none"
                  stroke="#FFFFFF"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                  opacity={computedRgb.opacity * 0.7}
                />
              </>
            )}

            {/* G6 PRO DUAL STICK RGB RINGS */}
            {deviceSpec.rgbStyle === 'rings' && (
              <>
                <circle
                  cx="192"
                  cy="168"
                  r="37"
                  fill="none"
                  stroke={computedRgb.left}
                  strokeWidth="3.2"
                  opacity={computedRgb.opacity}
                  filter="url(#rgbGlow)"
                />
                <circle
                  cx="388"
                  cy="230"
                  r="37"
                  fill="none"
                  stroke={computedRgb.right}
                  strokeWidth="3.2"
                  opacity={computedRgb.opacity}
                  filter="url(#rgbGlow)"
                />
              </>
            )}

            {/* CENTER HOME LED RING (All Machenike Models) */}
            <g className="cursor-pointer" {...handleInteraction('HOME')}>
              <circle
                cx="320"
                cy="144"
                r="21"
                fill="#11141B"
                stroke={computedRgb.center}
                strokeWidth="3"
                opacity={Math.max(0.25, computedRgb.opacity)}
                filter={computedRgb.opacity > 0.1 ? 'url(#rgbGlow)' : undefined}
              />
              <circle
                cx="320"
                cy="144"
                r="16"
                fill={btnFill('HOME', '#181C26')}
                stroke={isSelected('HOME') ? '#F97316' : 'rgba(255,255,255,0.12)'}
                strokeWidth={isSelected('HOME') ? 2 : 1}
              />
              <path
                d="M311 150 L314 138 L320 146 L326 138 L329 150"
                fill="none"
                stroke={computedRgb.opacity > 0.15 ? computedRgb.center : '#9CA3AF'}
                strokeWidth="2.1"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </g>

            {/* VIEW & MENU System Buttons */}
            <g className="cursor-pointer" {...handleInteraction('VIEW')}>
              <circle
                cx="268"
                cy="158"
                r="11"
                fill={btnFill('VIEW')}
                stroke={btnStroke('VIEW')}
                strokeWidth={isSelected('VIEW') ? 2 : 1.3}
              />
              <rect x="263" y="154" width="7" height="6" rx="1" fill="none" stroke="#9EA7B8" strokeWidth="1.2" />
              <rect x="266" y="157" width="7" height="6" rx="1" fill="#1A1E27" stroke="#9EA7B8" strokeWidth="1.2" />
            </g>

            <g className="cursor-pointer" {...handleInteraction('MENU')}>
              <circle
                cx="372"
                cy="158"
                r="11"
                fill={btnFill('MENU')}
                stroke={btnStroke('MENU')}
                strokeWidth={isSelected('MENU') ? 2 : 1.3}
              />
              <path
                d="M366 154 H378 M366 158 H378 M366 162 H378"
                stroke="#9EA7B8"
                strokeWidth="1.4"
                strokeLinecap="round"
              />
            </g>

            {/* LEFT ANALOG STICK (L3) */}
            <g className="cursor-pointer" {...handleInteraction('L3')}>
              <circle cx="192" cy="168" r="34" fill="#10131A" stroke="#2D3445" strokeWidth="1.6" />
              <circle
                cx="192"
                cy="168"
                r="28"
                fill="none"
                stroke={isSelected('L3') ? '#F97316' : 'rgba(255,255,255,0.06)'}
                strokeWidth={isSelected('L3') ? 2 : 1}
                strokeDasharray="4 3"
              />
              <g transform={`translate(${lxOffset}, ${lyOffset})`}>
                <circle
                  cx="192"
                  cy="168"
                  r="22"
                  fill={btnFill('L3', '#232834')}
                  stroke={btnStroke('L3')}
                  strokeWidth={isSelected('L3') ? 2.2 : 1.6}
                />
                <circle cx="192" cy="168" r="14" fill="#171B24" stroke="#343C4F" strokeWidth="1" />
                <text
                  x="192"
                  y="172"
                  textAnchor="middle"
                  className="font-mono text-[10px] font-semibold fill-[#D1D7E2] pointer-events-none"
                >
                  L3
                </text>
              </g>
            </g>

            {/* MECHA 8-WAY D-PAD */}
            <g>
              <circle cx="250" cy="232" r="31" fill="#12151D" stroke="#293040" strokeWidth="1.3" />
              <g className="cursor-pointer" {...handleInteraction('UP')}>
                <path
                  d="M241 205 H259 V224 H241 Z"
                  fill={btnFill('UP', '#222733')}
                  stroke={btnStroke('UP')}
                  strokeWidth={isSelected('UP') ? 2 : 1.2}
                />
                <path d="M250 211 L246 217 H254 Z" fill="#9EA7B8" className="pointer-events-none" />
              </g>
              <g className="cursor-pointer" {...handleInteraction('DOWN')}>
                <path
                  d="M241 240 H259 V259 H241 Z"
                  fill={btnFill('DOWN', '#222733')}
                  stroke={btnStroke('DOWN')}
                  strokeWidth={isSelected('DOWN') ? 2 : 1.2}
                />
                <path d="M250 253 L246 247 H254 Z" fill="#9EA7B8" className="pointer-events-none" />
              </g>
              <g className="cursor-pointer" {...handleInteraction('LEFT')}>
                <path
                  d="M223 223 H242 V241 H223 Z"
                  fill={btnFill('LEFT', '#222733')}
                  stroke={btnStroke('LEFT')}
                  strokeWidth={isSelected('LEFT') ? 2 : 1.2}
                />
                <path d="M229 232 L235 228 V236 Z" fill="#9EA7B8" className="pointer-events-none" />
              </g>
              <g className="cursor-pointer" {...handleInteraction('RIGHT')}>
                <path
                  d="M258 223 H277 V241 H258 Z"
                  fill={btnFill('RIGHT', '#222733')}
                  stroke={btnStroke('RIGHT')}
                  strokeWidth={isSelected('RIGHT') ? 2 : 1.2}
                />
                <path d="M271 232 L265 228 V236 Z" fill="#9EA7B8" className="pointer-events-none" />
              </g>
              <circle cx="250" cy="232" r="6" fill="#181C25" />
            </g>

            {/* RIGHT ANALOG STICK (R3) */}
            <g className="cursor-pointer" {...handleInteraction('R3')}>
              <circle cx="388" cy="230" r="34" fill="#10131A" stroke="#2D3445" strokeWidth="1.6" />
              <circle
                cx="388"
                cy="230"
                r="28"
                fill="none"
                stroke={isSelected('R3') ? '#F97316' : 'rgba(255,255,255,0.06)'}
                strokeWidth={isSelected('R3') ? 2 : 1}
                strokeDasharray="4 3"
              />
              <g transform={`translate(${rxOffset}, ${ryOffset})`}>
                <circle
                  cx="388"
                  cy="230"
                  r="22"
                  fill={btnFill('R3', '#232834')}
                  stroke={btnStroke('R3')}
                  strokeWidth={isSelected('R3') ? 2.2 : 1.6}
                />
                <circle cx="388" cy="230" r="14" fill="#171B24" stroke="#343C4F" strokeWidth="1" />
                <text
                  x="388"
                  y="234"
                  textAnchor="middle"
                  className="font-mono text-[10px] font-semibold fill-[#D1D7E2] pointer-events-none"
                >
                  R3
                </text>
              </g>
            </g>

            {/* ABXY CLUSTER */}
            {[
              { id: 'Y' as PhysicalButtonId, cx: 448, cy: 136, accent: '#F59E0B', text: abxyLabels.Y },
              { id: 'B' as PhysicalButtonId, cx: 480, cy: 168, accent: '#EF4444', text: abxyLabels.B },
              { id: 'A' as PhysicalButtonId, cx: 448, cy: 200, accent: '#22C55E', text: abxyLabels.A },
              { id: 'X' as PhysicalButtonId, cx: 416, cy: 168, accent: '#38BDF8', text: abxyLabels.X },
            ].map((b) => (
              <g key={b.id} className="cursor-pointer" {...handleInteraction(b.id)}>
                <circle
                  cx={b.cx}
                  cy={b.cy}
                  r="15.5"
                  fill={btnFill(b.id, '#1D222D')}
                  stroke={btnStroke(b.id)}
                  strokeWidth={isSelected(b.id) ? 2.4 : 1.5}
                />
                <text
                  x={b.cx}
                  y={b.cy + 4.5}
                  textAnchor="middle"
                  className="font-display text-[13px] font-semibold pointer-events-none"
                  fill={isPressed(b.id) ? '#0C0E12' : b.accent}
                >
                  {b.text}
                </text>
                {bindings[b.id]?.turboEnabled && (
                  <circle cx={b.cx + 12} cy={b.cy - 12} r="4" fill="#F97316" />
                )}
              </g>
            ))}

            {/* Dynamic Model Engraving */}
            <text
              x="320"
              y="244"
              textAnchor="middle"
              className="font-mono text-[9px] tracking-[0.22em] fill-[#7D879B] pointer-events-none"
            >
              {deviceSpec.shortName}
            </text>

            {/* Optional Callout Tags for Custom Mappings */}
            {showBindingTags && (
              <g className="pointer-events-none">
                {(['LB', 'RB', 'A', 'B', 'X', 'Y'] as PhysicalButtonId[]).map((id) => {
                  const binding = bindings[id];
                  if (!binding || !isCustomMapped(id)) return null;
                  const coords: Record<string, { x: number; y: number }> = {
                    LB: { x: 120, y: 58 },
                    RB: { x: 520, y: 58 },
                    Y: { x: 542, y: 124 },
                    B: { x: 562, y: 168 },
                    A: { x: 542, y: 212 },
                    X: { x: 382, y: 124 },
                  };
                  const pos = coords[id];
                  if (!pos) return null;
                  return (
                    <g key={id} transform={`translate(${pos.x}, ${pos.y})`}>
                      <rect
                        x="-42"
                        y="-11"
                        width="84"
                        height="20"
                        rx="4"
                        fill="#14171E"
                        stroke="#38BDF8"
                        strokeWidth="1"
                      />
                      <text
                        x="0"
                        y="3"
                        textAnchor="middle"
                        className="font-mono text-[9px] fill-[#E2E8F0]"
                      >
                        {binding.label.slice(0, 11)}
                      </text>
                    </g>
                  );
                })}
              </g>
            )}
          </g>
        ) : (
          /* REAR CHASSIS VIEW — Adapts paddles & charging pogo pins to the active Machenike model */
          <g filter="url(#softShadow)">
            <path
              d="M148 76 C158 50 202 44 226 52 L222 88 L144 92 Z"
              fill="#1E232E"
              stroke="#313847"
              strokeWidth="1.4"
            />
            <path
              d="M492 76 C482 50 438 44 414 52 L418 88 L496 92 Z"
              fill="#1E232E"
              stroke="#313847"
              strokeWidth="1.4"
            />

            <path
              d="M236 86 L404 86 C452 86 498 98 524 134 C548 168 566 254 570 308 C573 348 548 378 514 378 C482 378 462 344 440 310 C422 284 398 274 362 274 L278 274 C242 274 218 284 200 310 C178 344 158 378 126 378 C92 378 67 348 70 308 C74 254 92 168 116 134 C142 98 188 86 236 86 Z"
              fill="url(#chassisBody)"
              stroke="#2F3646"
              strokeWidth="1.6"
            />

            <path
              d="M116 154 C96 196 86 254 84 306 C84 338 102 362 126 362 C148 362 164 336 180 304 C162 252 146 198 134 156 Z"
              fill="#11141B"
              stroke="rgba(255,255,255,0.06)"
              strokeWidth="1"
            />
            <path
              d="M524 154 C544 196 554 254 556 306 C556 338 538 362 514 362 C492 362 476 336 460 304 C478 252 494 198 506 156 Z"
              fill="#11141B"
              stroke="rgba(255,255,255,0.06)"
              strokeWidth="1"
            />

            {deviceSpec.rgbStyle === 'strips' && (
              <>
                <path
                  d="M104 166 C88 204 78 254 76 300"
                  fill="none"
                  stroke={computedRgb.right}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  opacity={computedRgb.opacity * 0.65}
                  filter="url(#rgbGlow)"
                />
                <path
                  d="M536 166 C552 204 562 254 564 300"
                  fill="none"
                  stroke={computedRgb.left}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  opacity={computedRgb.opacity * 0.65}
                  filter="url(#rgbGlow)"
                />
              </>
            )}

            {/* Central Hardware Plate */}
            <rect
              x="266"
              y="124"
              width="108"
              height="112"
              rx="10"
              fill="#12151D"
              stroke="#282F3D"
              strokeWidth="1.2"
            />
            <text
              x="320"
              y="146"
              textAnchor="middle"
              className="font-mono text-[9px] tracking-[0.16em] fill-[#7D879B]"
            >
              {deviceSpec.shortName}
            </text>
            <text
              x="320"
              y="162"
              textAnchor="middle"
              className="font-mono text-[9px] fill-[#596275]"
            >
              USB · 2.4G · BT
            </text>
            <rect
              x="286"
              y="172"
              width="68"
              height="14"
              rx="4"
              fill="#1C212C"
              stroke="#323A4B"
              strokeWidth="1"
            />
            <rect x="308" y="174" width="22" height="10" rx="2" fill="#465066" />

            {/* Charging Dock Pogo Pins (Only on dock-compatible models) */}
            {deviceSpec.hasChargingDock && (
              <g>
                <circle cx="300" cy="212" r="3.5" fill="#D97706" />
                <circle cx="313" cy="212" r="3.5" fill="#D97706" />
                <circle cx="327" cy="212" r="3.5" fill="#D97706" />
                <circle cx="340" cy="212" r="3.5" fill="#D97706" />
              </g>
            )}

            {hasM1M2 ? (
              <>
                <g className="cursor-pointer" {...handleInteraction('M1')}>
                  <path
                    d="M242 152 L202 162 C188 166 180 178 182 192 L192 246 C194 258 206 264 218 260 L248 248 C254 245 256 238 256 230 L254 164 C254 156 249 150 242 152 Z"
                    fill={btnFill('M1', '#222835')}
                    stroke={btnStroke('M1')}
                    strokeWidth={isSelected('M1') ? 2.6 : 1.8}
                  />
                  <text
                    x="220"
                    y="200"
                    textAnchor="middle"
                    className="font-display text-[15px] font-semibold pointer-events-none"
                    fill={isPressed('M1') ? '#0C0E12' : '#F4F6F9'}
                  >
                    M1
                  </text>
                  <text
                    x="220"
                    y="220"
                    textAnchor="middle"
                    className="font-mono text-[9px] pointer-events-none"
                    fill={isPressed('M1') ? '#0C0E12' : '#38BDF8'}
                  >
                    {(bindings.M1?.label || 'M1').slice(0, 10)}
                  </text>
                </g>

                <g className="cursor-pointer" {...handleInteraction('M2')}>
                  <path
                    d="M398 152 L438 162 C452 166 460 178 458 192 L448 246 C446 258 434 264 422 260 L392 248 C386 245 384 238 384 230 L386 164 C386 156 391 150 398 152 Z"
                    fill={btnFill('M2', '#222835')}
                    stroke={btnStroke('M2')}
                    strokeWidth={isSelected('M2') ? 2.6 : 1.8}
                  />
                  <text
                    x="420"
                    y="200"
                    textAnchor="middle"
                    className="font-display text-[15px] font-semibold pointer-events-none"
                    fill={isPressed('M2') ? '#0C0E12' : '#F4F6F9'}
                  >
                    M2
                  </text>
                  <text
                    x="420"
                    y="220"
                    textAnchor="middle"
                    className="font-mono text-[9px] pointer-events-none"
                    fill={isPressed('M2') ? '#0C0E12' : '#38BDF8'}
                  >
                    {(bindings.M2?.label || 'M2').slice(0, 10)}
                  </text>
                </g>
              </>
            ) : (
              <text
                x="320"
                y="260"
                textAnchor="middle"
                className="font-mono text-[10px] fill-[#6E788C]"
              >
                {deviceSpec.name} — Modelo sem paddles traseiros
              </text>
            )}

            <rect
              x="304"
              y="84"
              width="32"
              height="7"
              rx="3"
              fill="#0B0D12"
              stroke="#363E4F"
              strokeWidth="1"
            />
          </g>
        )}
      </svg>
    </div>
  );
};
