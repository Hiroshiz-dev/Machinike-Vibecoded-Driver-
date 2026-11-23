import { DockConfig, DockRgbMode, RgbConfig, RgbMode } from '../types/controller';

export interface HidReportItemLike {
  reportCount?: number;
  reportSize?: number;
}

export interface HidReportInfoLike {
  reportId: number;
  items?: HidReportItemLike[];
}

export interface HidCollectionLike {
  usagePage?: number;
  usage?: number;
  outputReports?: HidReportInfoLike[];
  featureReports?: HidReportInfoLike[];
}

export interface HidInputReportEventLike {
  reportId: number;
  data: DataView;
}

export interface HidDeviceHardware {
  productName?: string;
  vendorId?: number;
  productId?: number;
  collections?: HidCollectionLike[];
  open: () => Promise<void>;
  opened?: boolean;
  sendReport?: (reportId: number, data: BufferSource) => Promise<void>;
  sendFeatureReport?: (reportId: number, data: BufferSource) => Promise<void>;
  addEventListener?: (
    type: 'inputreport',
    listener: (event: HidInputReportEventLike) => void
  ) => void;
  removeEventListener?: (
    type: 'inputreport',
    listener: (event: HidInputReportEventLike) => void
  ) => void;
}

export interface BleWritableCharacteristic {
  uuid?: string;
  properties?: {
    write?: boolean;
    writeWithoutResponse?: boolean;
  };
  writeValueWithoutResponse?: (value: BufferSource) => Promise<void>;
  writeValue?: (value: BufferSource) => Promise<void>;
}

export interface RgbHardwareSyncResult {
  sent: boolean;
  channel: 'webhid-output' | 'webhid-feature' | 'ble-gatt' | 'none';
  detail: string;
  timestamp: number;
}

const MODE_BYTE_MAP: Record<RgbMode, number> = {
  off: 0x00,
  static: 0x01,
  breathing: 0x02,
  rainbow: 0x03,
  reactive: 0x04,
  pulse: 0x05,
};

const DIRECTION_BYTE_MAP: Record<RgbConfig['direction'], number> = {
  ltr: 0x00,
  rtl: 0x01,
  center: 0x02,
};

export function hexToRgbBytes(hex: string): [number, number, number] {
  const clean = hex.replace('#', '').trim();
  if (!/^[0-9a-fA-F]{6}$/.test(clean)) {
    return [249, 115, 22];
  }
  return [
    parseInt(clean.slice(0, 2), 16),
    parseInt(clean.slice(2, 4), 16),
    parseInt(clean.slice(4, 6), 16),
  ];
}

function calcReportByteLength(report?: HidReportInfoLike, fallback = 63): number {
  if (!report?.items || report.items.length === 0) return fallback;
  let totalBits = 0;
  for (const item of report.items) {
    totalBits += (item.reportCount ?? 1) * (item.reportSize ?? 8);
  }
  const bytes = Math.ceil(totalBits / 8);
  return bytes > 0 ? Math.min(bytes, 64) : fallback;
}

/**
 * Encodes Machenike / ZhiXu KeyLinker RGB lighting payload into a fixed-length byte frame.
 * Structure:
 *  [0..1] Command header (0xA5, 0x24 = RGB lighting config command)
 *  [2]    Lighting mode (0=off, 1=static, 2=breathing, 3=rainbow, 4=reactive, 5=pulse)
 *  [3]    Brightness (0..100)
 *  [4]    Animation speed (1..5)
 *  [5]    Direction (0=ltr, 1=rtl, 2=center)
 *  [6]    Sync zones flag (1=synced, 0=independent)
 *  [7..9] Left strip / primary RGB (R, G, B)
 * [10..12] Center ring RGB (R, G, B)
 * [13..15] Right strip RGB (R, G, B)
 * [16..18] Reactive flash RGB (R, G, B)
 * [19]    Checksum (sum of bytes 0..18 mod 256)
 */
export function buildMachenikeRgbFrame(rgb: RgbConfig, length = 63): Uint8Array<ArrayBuffer> {
  const size = Math.max(20, length);
  const buf = new Uint8Array(new ArrayBuffer(size));

  const [lr, lg, lb] = hexToRgbBytes(rgb.zones.leftStrip);
  const [cr, cg, cb] = hexToRgbBytes(rgb.syncZones ? rgb.zones.leftStrip : rgb.zones.centerRing);
  const [rr, rg, rb] = hexToRgbBytes(rgb.syncZones ? rgb.zones.leftStrip : rgb.zones.rightStrip);
  const [fr, fg, fb] = hexToRgbBytes(rgb.reactiveColor);

  buf[0] = 0xa5;
  buf[1] = 0x24;
  buf[2] = MODE_BYTE_MAP[rgb.mode] ?? 0x01;
  buf[3] = rgb.mode === 'off' ? 0 : Math.max(0, Math.min(100, Math.round(rgb.brightness)));
  buf[4] = Math.max(1, Math.min(5, Math.round(rgb.speed)));
  buf[5] = DIRECTION_BYTE_MAP[rgb.direction] ?? 0x00;
  buf[6] = rgb.syncZones ? 0x01 : 0x00;

  buf[7] = lr;
  buf[8] = lg;
  buf[9] = lb;

  buf[10] = cr;
  buf[11] = cg;
  buf[12] = cb;

  buf[13] = rr;
  buf[14] = rg;
  buf[15] = rb;

  buf[16] = fr;
  buf[17] = fg;
  buf[18] = fb;

  let checksum = 0;
  for (let i = 0; i < 19; i++) {
    checksum = (checksum + buf[i]) & 0xff;
  }
  buf[19] = checksum;

  return buf;
}

/**
 * Selects the best writable HID device from a list of authorized WebHID interfaces,
 * preferring vendor-defined configuration collections (usagePage >= 0xFF00) with
 * output or feature reports over read-only standard gamepad collections.
 */
export function pickBestConfigHidDevice(devices: HidDeviceHardware[]): HidDeviceHardware | null {
  if (!devices || devices.length === 0) return null;

  const withVendorWritable = devices.find((d) =>
    d.collections?.some(
      (c) =>
        (c.usagePage ?? 0) >= 0xff00 &&
        ((c.outputReports?.length ?? 0) > 0 || (c.featureReports?.length ?? 0) > 0)
    )
  );
  if (withVendorWritable) return withVendorWritable;

  const withAnyWritable = devices.find((d) =>
    d.collections?.some(
      (c) => (c.outputReports?.length ?? 0) > 0 || (c.featureReports?.length ?? 0) > 0
    )
  );
  return withAnyWritable ?? devices[0];
}

export async function transmitRgbOverWebHid(
  device: HidDeviceHardware,
  rgb: RgbConfig
): Promise<RgbHardwareSyncResult> {
  const now = Date.now();
  try {
    if (!device.opened) {
      await device.open();
    }

    const collections = device.collections ?? [];
    // Prefer vendor-defined HID collections first, then any collection with output/feature reports
    const ordered = [
      ...collections.filter((c) => (c.usagePage ?? 0) >= 0xff00),
      ...collections.filter((c) => (c.usagePage ?? 0) < 0xff00),
    ];

    for (const col of ordered) {
      if (col.outputReports && col.outputReports.length > 0 && device.sendReport) {
        const rep = col.outputReports[0];
        const byteLen = calcReportByteLength(rep, 63);
        const frame = buildMachenikeRgbFrame(rgb, byteLen);
        await device.sendReport(rep.reportId ?? 0, frame);
        return {
          sent: true,
          channel: 'webhid-output',
          detail: `Pacote RGB enviado via WebHID Output Report (ID 0x${(rep.reportId ?? 0)
            .toString(16)
            .padStart(2, '0')}, ${byteLen} bytes) para ${device.productName || 'Machenike'}.`,
          timestamp: now,
        };
      }
      if (col.featureReports && col.featureReports.length > 0 && device.sendFeatureReport) {
        const rep = col.featureReports[0];
        const byteLen = calcReportByteLength(rep, 63);
        const frame = buildMachenikeRgbFrame(rgb, byteLen);
        await device.sendFeatureReport(rep.reportId ?? 0, frame);
        return {
          sent: true,
          channel: 'webhid-feature',
          detail: `Pacote RGB enviado via WebHID Feature Report (ID 0x${(rep.reportId ?? 0)
            .toString(16)
            .padStart(2, '0')}, ${byteLen} bytes) para ${device.productName || 'Machenike'}.`,
          timestamp: now,
        };
      }
    }

    // Fallback attempt on Report ID 0 if descriptor omitted explicit report metadata
    if (device.sendReport) {
      const frame = buildMachenikeRgbFrame(rgb, 63);
      await device.sendReport(0, frame);
      return {
        sent: true,
        channel: 'webhid-output',
        detail: `Pacote RGB enviado via WebHID padrão (63 bytes) para ${device.productName || 'Machenike'}.`,
        timestamp: now,
      };
    }

    return {
      sent: false,
      channel: 'none',
      detail:
        'A interface HID conectada não expôs relatórios de escrita (Output/Feature). O controle pode estar em modo X-Input bloqueado pelo driver do sistema.',
      timestamp: now,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'erro de escrita HID';
    return {
      sent: false,
      channel: 'none',
      detail: `O driver do sistema recusou o pacote HID (${msg}). Se o controle estiver em modo X-Input puro pelo dongle, vincule via Bluetooth BLE (KeyLinker) ou alterne o modo HID no controle.`,
      timestamp: now,
    };
  }
}

export async function transmitRgbOverBleGatt(
  characteristic: BleWritableCharacteristic,
  rgb: RgbConfig,
  deviceName?: string | null
): Promise<RgbHardwareSyncResult> {
  const now = Date.now();
  try {
    const frame = buildMachenikeRgbFrame(rgb, 20);
    if (characteristic.properties?.writeWithoutResponse && characteristic.writeValueWithoutResponse) {
      await characteristic.writeValueWithoutResponse(frame);
    } else if (characteristic.writeValue) {
      await characteristic.writeValue(frame);
    } else if (characteristic.writeValueWithoutResponse) {
      await characteristic.writeValueWithoutResponse(frame);
    } else {
      return {
        sent: false,
        channel: 'none',
        detail: 'Característica Bluetooth BLE encontrada não aceita gravação de pacotes RGB.',
        timestamp: now,
      };
    }

    return {
      sent: true,
      channel: 'ble-gatt',
      detail: `Comando RGB enviado via Bluetooth BLE GATT (20 bytes) para ${deviceName || 'Machenike BLE'}.`,
      timestamp: now,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'falha GATT';
    return {
      sent: false,
      channel: 'none',
      detail: `Não foi possível gravar RGB via Bluetooth BLE (${msg}). Reconecte o canal BLE para tentar novamente.`,
      timestamp: now,
    };
  }
}

export const KEYLINKER_BLE_SERVICE_UUIDS: (number | string)[] = [
  'battery_service',
  0xfff0,
  0xffe0,
  0xae00,
  0xff00,
  0x1812,
  '0000fff0-0000-1000-8000-00805f9b34fb',
  '0000ffe0-0000-1000-8000-00805f9b34fb',
  '0000ae00-0000-1000-8000-00805f9b34fb',
];

const DOCK_MODE_BYTE_MAP: Record<DockRgbMode, number> = {
  off: 0x00,
  static: 0x01,
  breathing: 0x02,
  rainbow: 0x03,
  sync: 0x04,
  'battery-indicator': 0x05,
};

export function getBatteryIndicatorColor(batteryPercent: number): string {
  if (batteryPercent >= 95) return '#22C55E'; // Carga completa / Esmeralda
  if (batteryPercent >= 60) return '#38BDF8'; // Boa carga / Ciano
  if (batteryPercent >= 25) return '#F59E0B'; // Carga média / Âmbar
  return '#EF4444'; // Bateria baixa / Carmesim
}

export function resolveDockRgbColor(
  dock: DockConfig,
  controllerRgb: RgbConfig,
  batteryPercent: number
): string {
  if (dock.mode === 'off') return '#232834';
  if (dock.mode === 'battery-indicator') return getBatteryIndicatorColor(batteryPercent);
  if (dock.mode === 'sync') return controllerRgb.zones.leftStrip;
  return dock.color;
}

/**
 * Encodes Machenike Magnetic Charging Dock RGB & power behavior payload.
 * Header: 0xA5, 0x28 (Dock RGB / Station config command)
 */
export function buildMachenikeDockRgbFrame(
  dock: DockConfig,
  controllerRgb: RgbConfig,
  batteryPercent: number,
  isCharging: boolean,
  length = 63
): Uint8Array<ArrayBuffer> {
  const size = Math.max(20, length);
  const buf = new Uint8Array(new ArrayBuffer(size));

  const effectiveHex = resolveDockRgbColor(dock, controllerRgb, batteryPercent);
  const [r, g, b] = hexToRgbBytes(effectiveHex);

  buf[0] = 0xa5;
  buf[1] = 0x28;
  buf[2] = DOCK_MODE_BYTE_MAP[dock.mode] ?? 0x01;
  buf[3] = dock.mode === 'off' ? 0 : Math.max(0, Math.min(100, Math.round(dock.brightness)));
  buf[4] = Math.max(1, Math.min(5, Math.round(dock.speed)));
  buf[5] = r;
  buf[6] = g;
  buf[7] = b;
  buf[8] = dock.autoWakeOnLift ? 0x01 : 0x00;
  buf[9] = dock.showChargeProgressLed ? 0x01 : 0x00;
  buf[10] = Math.max(0, Math.min(100, Math.round(batteryPercent)));
  buf[11] = isCharging ? 0x01 : 0x00;

  let checksum = 0;
  for (let i = 0; i < 12; i++) {
    checksum = (checksum + buf[i]) & 0xff;
  }
  buf[12] = checksum;

  return buf;
}

export async function transmitDockRgbOverWebHid(
  device: HidDeviceHardware,
  dock: DockConfig,
  controllerRgb: RgbConfig,
  batteryPercent: number,
  isCharging: boolean
): Promise<RgbHardwareSyncResult> {
  const now = Date.now();
  try {
    if (!device.opened) {
      await device.open();
    }

    const collections = device.collections ?? [];
    const ordered = [
      ...collections.filter((c) => (c.usagePage ?? 0) >= 0xff00),
      ...collections.filter((c) => (c.usagePage ?? 0) < 0xff00),
    ];

    for (const col of ordered) {
      if (col.outputReports && col.outputReports.length > 0 && device.sendReport) {
        const rep = col.outputReports[0];
        const byteLen = calcReportByteLength(rep, 63);
        const frame = buildMachenikeDockRgbFrame(
          dock,
          controllerRgb,
          batteryPercent,
          isCharging,
          byteLen
        );
        await device.sendReport(rep.reportId ?? 0, frame);
        return {
          sent: true,
          channel: 'webhid-output',
          detail: `RGB da Dock enviado via WebHID (${byteLen} bytes) para ${device.productName || 'Base Machenike'}.`,
          timestamp: now,
        };
      }
      if (col.featureReports && col.featureReports.length > 0 && device.sendFeatureReport) {
        const rep = col.featureReports[0];
        const byteLen = calcReportByteLength(rep, 63);
        const frame = buildMachenikeDockRgbFrame(
          dock,
          controllerRgb,
          batteryPercent,
          isCharging,
          byteLen
        );
        await device.sendFeatureReport(rep.reportId ?? 0, frame);
        return {
          sent: true,
          channel: 'webhid-feature',
          detail: `RGB da Dock enviado via WebHID Feature Report (${byteLen} bytes) para ${device.productName || 'Base Machenike'}.`,
          timestamp: now,
        };
      }
    }

    if (device.sendReport) {
      const frame = buildMachenikeDockRgbFrame(dock, controllerRgb, batteryPercent, isCharging, 63);
      await device.sendReport(0, frame);
      return {
        sent: true,
        channel: 'webhid-output',
        detail: `RGB da Dock enviado via WebHID padrão para ${device.productName || 'Base Machenike'}.`,
        timestamp: now,
      };
    }

    return {
      sent: false,
      channel: 'none',
      detail: 'A interface HID da Dock não expôs relatórios graváveis para controle de LEDs.',
      timestamp: now,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'erro HID';
    return {
      sent: false,
      channel: 'none',
      detail: `Não foi possível enviar RGB para a Dock via WebHID (${msg}).`,
      timestamp: now,
    };
  }
}

export async function transmitDockRgbOverBleGatt(
  characteristic: BleWritableCharacteristic,
  dock: DockConfig,
  controllerRgb: RgbConfig,
  batteryPercent: number,
  isCharging: boolean,
  deviceName?: string | null
): Promise<RgbHardwareSyncResult> {
  const now = Date.now();
  try {
    const frame = buildMachenikeDockRgbFrame(dock, controllerRgb, batteryPercent, isCharging, 20);
    if (characteristic.properties?.writeWithoutResponse && characteristic.writeValueWithoutResponse) {
      await characteristic.writeValueWithoutResponse(frame);
    } else if (characteristic.writeValue) {
      await characteristic.writeValue(frame);
    } else if (characteristic.writeValueWithoutResponse) {
      await characteristic.writeValueWithoutResponse(frame);
    } else {
      return {
        sent: false,
        channel: 'none',
        detail: 'Característica BLE não permite escrita de comandos da Dock.',
        timestamp: now,
      };
    }

    return {
      sent: true,
      channel: 'ble-gatt',
      detail: `RGB da Dock enviado via Bluetooth BLE GATT para ${deviceName || 'Machenike BLE'}.`,
      timestamp: now,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'erro GATT';
    return {
      sent: false,
      channel: 'none',
      detail: `Falha ao gravar RGB da Dock via BLE (${msg}).`,
      timestamp: now,
    };
  }
}

/**
 * Parses Machenike / ZhiXu vendor HID input reports containing live battery & charging flags.
 * Supports standard Machenike status frames (0xA5 0x20/0x21) where:
 *   byte[2] = battery percentage (0..100)
 *   byte[3] = power flags (bit 0 = charging, bit 1 = seated on dock)
 */
export function parseHidBatteryInputReport(
  data: DataView
): { batteryPercent: number; isCharging: boolean; isDocked: boolean } | null {
  if (!data || data.byteLength < 4) return null;
  const b0 = data.getUint8(0);
  const b1 = data.getUint8(1);
  if (b0 === 0xa5 && (b1 === 0x20 || b1 === 0x21 || b1 === 0x29)) {
    const pct = data.getUint8(2);
    const flags = data.getUint8(3);
    if (pct <= 100) {
      const isCharging = (flags & 0x01) !== 0;
      const isDocked = (flags & 0x02) !== 0 || isCharging;
      return { batteryPercent: pct, isCharging, isDocked };
    }
  }
  return null;
}
