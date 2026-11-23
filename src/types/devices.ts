import { ConnectionMode, PhysicalButtonId, PollingRateHz } from './controller';

export type MachenikeModelId =
  | 'g5-pro-max'
  | 'g5-pro'
  | 'g5-pro-v2'
  | 'g6-pro'
  | 'g3-v2'
  | 'g1-pro';

export interface MachenikeDeviceSpec {
  id: MachenikeModelId;
  name: string;
  shortName: string;
  tagline: string;
  supportedConnections: ConnectionMode[];
  maxPollingRate: PollingRateHz;
  extraButtons: PhysicalButtonId[]; // [], ['M1','M2'], or ['M1','M2','M3','M4']
  rgbZones: 1 | 3;
  rgbStyle: 'strips' | 'rings' | 'center';
  hasGyro: boolean;
  hasHallTriggers: boolean;
  hasChargingDock: boolean;
  dockName?: string;
  batteryCapacityMah: number;
  dockChargeTimeMin: number; // Estimated 0-100% charge duration in minutes
  stickTech: string;
  switchTech: string;
  defaultAccent: string;
  matchKeywords: string[];
  knownProductIds: number[];
}

export const MACHENIKE_VENDOR_IDS = [0x2345, 0x3537, 0x248a, 0x2dc8, 0x0079, 0x045e, 0x057e];

export const MACHENIKE_DEVICES: MachenikeDeviceSpec[] = [
  {
    id: 'g5-pro-max',
    name: 'Machenike G5 Pro Max',
    shortName: 'G5PRO MAX',
    tagline: 'Tri-Mode · Faceplate Magnética · Dock de Carga RGB',
    supportedConnections: ['usb', 'dongle24g', 'bluetooth'],
    maxPollingRate: 1000,
    extraButtons: ['M1', 'M2'],
    rgbZones: 3,
    rgbStyle: 'strips',
    hasGyro: true,
    hasHallTriggers: true,
    hasChargingDock: true,
    dockName: 'Base Magnética RGB G5 Pro Max',
    batteryCapacityMah: 600,
    dockChargeTimeMin: 120,
    stickTech: 'Hall-Effect Zero Drift',
    switchTech: 'Microswitch Mecânico Kailh',
    defaultAccent: '#F97316',
    matchKeywords: ['g5pro max', 'g5 pro max', 'g5promax', 'g5 max'],
    knownProductIds: [0x5012, 0x5013, 0xe02f, 0xe02e, 0xe00b, 0x181c],
  },
  {
    id: 'g5-pro-v2',
    name: 'Machenike G5 Pro V2',
    shortName: 'G5PRO V2',
    tagline: 'Tri-Mode · Microswitch Óptico · 4 Botões Extras (M1–M4)',
    supportedConnections: ['usb', 'dongle24g', 'bluetooth'],
    maxPollingRate: 1000,
    extraButtons: ['M1', 'M2', 'M3', 'M4'],
    rgbZones: 3,
    rgbStyle: 'strips',
    hasGyro: true,
    hasHallTriggers: true,
    hasChargingDock: true,
    dockName: 'Base Inteligente RGB G5 Pro V2',
    batteryCapacityMah: 860,
    dockChargeTimeMin: 135,
    stickTech: 'Hall-Effect JH20 Hot-Swap',
    switchTech: 'Microswitch Óptico Machenike',
    defaultAccent: '#38BDF8',
    matchKeywords: ['g5 pro v2', 'g5pro v2', 'g5prov2', 'g5v2', 'g5 v2'],
    knownProductIds: [0x5020, 0x5021],
  },
  {
    id: 'g6-pro',
    name: 'Machenike G6 Pro',
    shortName: 'G6 PRO',
    tagline: 'Esports Tri-Mode · Anéis RGB nos Analógicos · 4 Botões Extras',
    supportedConnections: ['usb', 'dongle24g', 'bluetooth'],
    maxPollingRate: 1000,
    extraButtons: ['M1', 'M2', 'M3', 'M4'],
    rgbZones: 3,
    rgbStyle: 'rings',
    hasGyro: true,
    hasHallTriggers: true,
    hasChargingDock: true,
    dockName: 'Dock Magnético RGB G6 Pro',
    batteryCapacityMah: 860,
    dockChargeTimeMin: 130,
    stickTech: 'K-Silver JH20 Hall-Effect',
    switchTech: 'Microswitch Óptico Kailh',
    defaultAccent: '#22C55E',
    matchKeywords: ['g6 pro', 'g6pro', 'machenike g6'],
    knownProductIds: [0x6010, 0x6011],
  },
  {
    id: 'g5-pro',
    name: 'Machenike G5 Pro',
    shortName: 'G5 PRO',
    tagline: 'Tri-Mode · Carcaça Translúcida · Hall-Effect',
    supportedConnections: ['usb', 'dongle24g', 'bluetooth'],
    maxPollingRate: 1000,
    extraButtons: ['M1', 'M2'],
    rgbZones: 3,
    rgbStyle: 'strips',
    hasGyro: true,
    hasHallTriggers: true,
    hasChargingDock: false,
    batteryCapacityMah: 600,
    dockChargeTimeMin: 120,
    stickTech: 'Hall-Effect',
    switchTech: 'Mecha-Tactile Kailh',
    defaultAccent: '#F97316',
    matchKeywords: ['g5 pro', 'g5pro', 'machenike g5'],
    knownProductIds: [0x5001, 0x5002],
  },
  {
    id: 'g3-v2',
    name: 'Machenike G3 V2 / G3S',
    shortName: 'G3 V2',
    tagline: 'Tri-Mode Compacto · 1000 Hz · 2 Botões Traseiros',
    supportedConnections: ['usb', 'dongle24g', 'bluetooth'],
    maxPollingRate: 1000,
    extraButtons: ['M1', 'M2'],
    rgbZones: 1,
    rgbStyle: 'center',
    hasGyro: false,
    hasHallTriggers: true,
    hasChargingDock: false,
    batteryCapacityMah: 600,
    dockChargeTimeMin: 120,
    stickTech: 'Hall-Effect',
    switchTech: 'Membrana Condutiva Rápida',
    defaultAccent: '#38BDF8',
    matchKeywords: ['g3 v2', 'g3v2', 'g3s', 'g3 pro', 'machenike g3'],
    knownProductIds: [0x3002, 0x3005],
  },
  {
    id: 'g1-pro',
    name: 'Machenike G1 / G1 Pro',
    shortName: 'G1 PRO',
    tagline: 'Tri-Mode Leve · Analógicos TMR/Hall · 17 Botões Padrão',
    supportedConnections: ['usb', 'dongle24g', 'bluetooth'],
    maxPollingRate: 1000,
    extraButtons: [],
    rgbZones: 1,
    rgbStyle: 'center',
    hasGyro: false,
    hasHallTriggers: true,
    hasChargingDock: false,
    batteryCapacityMah: 600,
    dockChargeTimeMin: 120,
    stickTech: 'TMR / Hall-Effect',
    switchTech: 'Membrana Tátil',
    defaultAccent: '#F59E0B',
    matchKeywords: ['g1 pro', 'g1pro', 'machenike g1'],
    knownProductIds: [0x1001, 0x1002],
  },
];

export function isLikelyChargingDockName(rawName: string): boolean {
  const lower = (rawName || '').toLowerCase();
  return (
    lower.includes('dock') ||
    lower.includes('base') ||
    lower.includes('charging') ||
    lower.includes('charger') ||
    lower.includes('cradle') ||
    lower.includes('station') ||
    lower.includes('passthrough')
  );
}

export function getDeviceSpec(id: MachenikeModelId): MachenikeDeviceSpec {
  return MACHENIKE_DEVICES.find((d) => d.id === id) ?? MACHENIKE_DEVICES[0];
}

export interface DetectedHardwareInfo {
  modelId: MachenikeModelId;
  transport: ConnectionMode;
  confidence: 'exact' | 'inferred';
  transportConfidence: 'exact' | 'ambiguous';
  rawName: string;
}

const STORAGE_TRANSPORT_OVERRIDES_KEY = 'machenike_transport_overrides_v1';

export function getSavedTransportOverride(rawName: string): ConnectionMode | null {
  if (typeof window === 'undefined' || !rawName) return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_TRANSPORT_OVERRIDES_KEY);
    if (!raw) return null;
    const map = JSON.parse(raw) as Record<string, ConnectionMode>;
    const saved = map[rawName.trim().toLowerCase()];
    if (saved === 'usb' || saved === 'dongle24g' || saved === 'bluetooth') {
      return saved;
    }
  } catch {
    // Ignore storage read errors
  }
  return null;
}

export function saveTransportOverride(rawName: string, transport: ConnectionMode): void {
  if (typeof window === 'undefined' || !rawName) return;
  try {
    const raw = window.localStorage.getItem(STORAGE_TRANSPORT_OVERRIDES_KEY);
    const map: Record<string, ConnectionMode> = raw ? JSON.parse(raw) : {};
    map[rawName.trim().toLowerCase()] = transport;
    window.localStorage.setItem(STORAGE_TRANSPORT_OVERRIDES_KEY, JSON.stringify(map));
  } catch {
    // Ignore storage write errors
  }
}

/**
 * Identifies a Machenike controller model and its active transport (Bluetooth, 2.4GHz Dongle, or Wired USB)
 * from Web Gamepad API IDs, WebHID product names/IDs, or Web Bluetooth device names.
 *
 * Note: 2.4 GHz USB 2.0 wireless dongles plugged into motherboard USB ports often enumerate as
 * standard X-Input USB controllers (e.g. Xbox 360 Controller / 045e:028e) without exposing
 * whether the physical link is a 2.4 GHz dongle or a wired cable. In those ambiguous cases,
 * we respect any saved per-device user override and default to 'dongle24g' while flagging
 * transportConfidence as 'ambiguous' so the user can toggle with 1 click.
 */
export function identifyMachenikeDevice(
  rawName: string,
  options?: {
    vendorId?: number;
    productId?: number;
    forcedTransport?: ConnectionMode;
    preferredTransport?: ConnectionMode;
  }
): DetectedHardwareInfo {
  const lower = (rawName || '').toLowerCase();
  const savedOverride = getSavedTransportOverride(rawName);

  // 1. Detect transport protocol from descriptor, VID/PID, or saved user override
  let transport: ConnectionMode = 'dongle24g';
  let transportConfidence: 'exact' | 'ambiguous' = 'ambiguous';

  if (options?.forcedTransport) {
    transport = options.forcedTransport;
    transportConfidence = 'exact';
  } else if (savedOverride) {
    transport = savedOverride;
    transportConfidence = 'exact';
  } else if (
    lower.includes('bluetooth') ||
    lower.includes(' bt ') ||
    lower.endsWith(' bt') ||
    lower.includes('ble') ||
    lower.includes('wireless controller') ||
    lower.includes('pro controller') ||
    lower.includes('057e')
  ) {
    transport = 'bluetooth';
    transportConfidence = 'exact';
  } else if (
    lower.includes('2.4g') ||
    lower.includes('2.4 g') ||
    lower.includes('dongle') ||
    lower.includes('receiver') ||
    lower.includes('wireless') ||
    lower.includes('rf ') ||
    lower.includes('02a1') ||
    lower.includes('0719') ||
    options?.productId === 0x02a1 ||
    options?.productId === 0x0719
  ) {
    transport = 'dongle24g';
    transportConfidence = 'exact';
  } else if (
    lower.includes('wired') ||
    lower.includes('usb-c') ||
    lower.includes('cable') ||
    lower.includes('com fio')
  ) {
    transport = 'usb';
    transportConfidence = 'exact';
  } else {
    // Ambiguous USB 2.0 / X-Input enumeration (common for Machenike 2.4 GHz USB 2.0 dongles on motherboard ports)
    transport = options?.preferredTransport ?? 'dongle24g';
    transportConfidence = 'ambiguous';
  }

  // 2. Match Product ID if available via WebHID
  if (options?.productId) {
    for (const spec of MACHENIKE_DEVICES) {
      if (spec.knownProductIds.includes(options.productId)) {
        return {
          modelId: spec.id,
          transport,
          confidence: 'exact',
          transportConfidence,
          rawName,
        };
      }
    }
  }

  // 3. Match exact model keywords (ordered from most specific like G5 Pro Max / V2 to G5 Pro)
  for (const spec of MACHENIKE_DEVICES) {
    for (const kw of spec.matchKeywords) {
      if (lower.includes(kw)) {
        return {
          modelId: spec.id,
          transport,
          confidence: 'exact',
          transportConfidence,
          rawName,
        };
      }
    }
  }

  // 4. Generic Machenike or X-Input dongle fallback
  return {
    modelId: 'g5-pro-max',
    transport,
    confidence: lower.includes('machenike') ? 'exact' : 'inferred',
    transportConfidence,
    rawName: rawName || 'Controle Machenike',
  };
}
