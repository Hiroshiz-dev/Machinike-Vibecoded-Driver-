import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ConnectionMode,
  PHYSICAL_BUTTONS,
  PhysicalButtonId,
  VibrationPulseStep,
} from '../types/controller';
import {
  DetectedHardwareInfo,
  MACHENIKE_VENDOR_IDS,
  MachenikeModelId,
  identifyMachenikeDevice,
  saveTransportOverride,
} from '../types/devices';

export interface LiveGamepadState {
  connected: boolean;
  deviceName: string;
  detectedModelId: MachenikeModelId | null;
  detectedTransport: ConnectionMode | null;
  detectionConfidence: 'exact' | 'inferred' | null;
  transportConfidence: 'exact' | 'ambiguous' | null;
  detectionSource: 'gamepad' | 'webhid' | 'bluetooth' | 'virtual';
  hidConnected: boolean;
  hidDeviceName: string | null;
  btConnected: boolean;
  btDeviceName: string | null;
  batteryPercent: number | null;
  pressedButtons: Set<PhysicalButtonId>;
  leftStick: { x: number; y: number };
  rightStick: { x: number; y: number };
  ltValue: number; // 0 to 1
  rtValue: number; // 0 to 1
  lastEventTime: number;
  rumbleActive: boolean;
  activeMotorLevels: { left: number; right: number };
}

interface HidDeviceLike {
  productName?: string;
  vendorId?: number;
  productId?: number;
  open: () => Promise<void>;
  opened?: boolean;
}

interface BluetoothDeviceLike {
  name?: string;
  gatt?: {
    connect: () => Promise<{
      getPrimaryService: (name: string) => Promise<{
        getCharacteristic: (name: string) => Promise<{
          readValue: () => Promise<DataView>;
        }>;
      }>;
    }>;
  };
}

interface NavigatorWithHardware extends Navigator {
  hid?: {
    requestDevice: (options: { filters: Array<Record<string, unknown>> }) => Promise<HidDeviceLike[]>;
    getDevices: () => Promise<HidDeviceLike[]>;
  };
  bluetooth?: {
    requestDevice: (options: Record<string, unknown>) => Promise<BluetoothDeviceLike>;
  };
}

export function useGamepad(
  onButtonPress?: (btn: PhysicalButtonId) => void,
  onHardwareDetected?: (info: DetectedHardwareInfo, source: 'gamepad' | 'webhid' | 'bluetooth') => void
) {
  const [connected, setConnected] = useState(false);
  const [deviceName, setDeviceName] = useState('Machenike G5 Pro Max (Bancada Virtual)');
  const [detectedModelId, setDetectedModelId] = useState<MachenikeModelId | null>(null);
  const [detectedTransport, setDetectedTransport] = useState<ConnectionMode | null>(null);
  const [detectionConfidence, setDetectionConfidence] = useState<'exact' | 'inferred' | null>(null);
  const [transportConfidence, setTransportConfidence] = useState<'exact' | 'ambiguous' | null>(null);
  const [detectionSource, setDetectionSource] = useState<
    'gamepad' | 'webhid' | 'bluetooth' | 'virtual'
  >('virtual');

  const [hidConnected, setHidConnected] = useState(false);
  const [hidDeviceName, setHidDeviceName] = useState<string | null>(null);
  const [btConnected, setBtConnected] = useState(false);
  const [btDeviceName, setBtDeviceName] = useState<string | null>(null);
  const [batteryPercent, setBatteryPercent] = useState<number | null>(null);
  const [connectionMessage, setConnectionMessage] = useState<string | null>(null);

  const [pressedButtons, setPressedButtons] = useState<Set<PhysicalButtonId>>(new Set());
  const [leftStick, setLeftStick] = useState({ x: 0, y: 0 });
  const [rightStick, setRightStick] = useState({ x: 0, y: 0 });
  const [ltValue, setLtValue] = useState(0);
  const [rtValue, setRtValue] = useState(0);
  const [lastEventTime, setLastEventTime] = useState(0);
  const [rumbleActive, setRumbleActive] = useState(false);
  const [activeMotorLevels, setActiveMotorLevels] = useState({ left: 0, right: 0 });

  const virtualPressedRef = useRef<Set<PhysicalButtonId>>(new Set());
  const virtualSticksRef = useRef<{
    lx: number;
    ly: number;
    rx: number;
    ry: number;
    lt: number;
    rt: number;
  }>({
    lx: 0,
    ly: 0,
    rx: 0,
    ry: 0,
    lt: 0,
    rt: 0,
  });

  const prevPhysicalButtonsRef = useRef<Set<PhysicalButtonId>>(new Set());
  const lastDetectedPadIdRef = useRef<string | null>(null);
  const onButtonPressRef = useRef(onButtonPress);
  onButtonPressRef.current = onButtonPress;
  const onHardwareDetectedRef = useRef(onHardwareDetected);
  onHardwareDetectedRef.current = onHardwareDetected;

  const patternCancelRef = useRef<number>(0);

  const applyDetectedHardware = useCallback(
    (info: DetectedHardwareInfo, source: 'gamepad' | 'webhid' | 'bluetooth') => {
      setDetectedModelId(info.modelId);
      setDetectedTransport(info.transport);
      setDetectionConfidence(info.confidence);
      setTransportConfidence(info.transportConfidence);
      setDetectionSource(source);
      onHardwareDetectedRef.current?.(info, source);
    },
    []
  );

  const overrideDetectedTransport = useCallback(
    (mode: ConnectionMode) => {
      setDetectedTransport(mode);
      setTransportConfidence('exact');
      const currentId = lastDetectedPadIdRef.current || hidDeviceName || btDeviceName || deviceName;
      if (currentId && (connected || hidConnected || btConnected)) {
        saveTransportOverride(currentId, mode);
      }
    },
    [connected, hidConnected, btConnected, hidDeviceName, btDeviceName, deviceName]
  );

  const setVirtualButton = useCallback((btn: PhysicalButtonId, down: boolean) => {
    const next = new Set(virtualPressedRef.current);
    if (down) {
      if (!next.has(btn)) {
        next.add(btn);
        setLastEventTime(performance.now());
        onButtonPressRef.current?.(btn);
      }
    } else {
      next.delete(btn);
    }
    virtualPressedRef.current = next;
    if (btn === 'LT') virtualSticksRef.current.lt = down ? 1 : 0;
    if (btn === 'RT') virtualSticksRef.current.rt = down ? 1 : 0;
  }, []);

  const pulseVirtualButton = useCallback(
    (btn: PhysicalButtonId, durationMs = 140) => {
      setVirtualButton(btn, true);
      window.setTimeout(() => {
        setVirtualButton(btn, false);
      }, durationMs);
    },
    [setVirtualButton]
  );

  const setVirtualStick = useCallback((side: 'left' | 'right', x: number, y: number) => {
    const clampedX = Math.max(-1, Math.min(1, x));
    const clampedY = Math.max(-1, Math.min(1, y));
    if (side === 'left') {
      virtualSticksRef.current.lx = clampedX;
      virtualSticksRef.current.ly = clampedY;
    } else {
      virtualSticksRef.current.rx = clampedX;
      virtualSticksRef.current.ry = clampedY;
    }
    if (Math.hypot(clampedX, clampedY) > 0.15) {
      setLastEventTime(performance.now());
    }
  }, []);

  const setVirtualTrigger = useCallback((side: 'LT' | 'RT', value: number) => {
    const clamped = Math.max(0, Math.min(1, value));
    if (side === 'LT') {
      virtualSticksRef.current.lt = clamped;
    } else {
      virtualSticksRef.current.rt = clamped;
    }
    if (clamped > 0.1) {
      setLastEventTime(performance.now());
    }
  }, []);

  const emitHardwareRumble = useCallback(
    async (leftIntensity: number, rightIntensity: number, durationMs: number) => {
      try {
        const pads = navigator.getGamepads ? navigator.getGamepads() : [];
        for (const pad of pads) {
          if (!pad) continue;
          const actuator = (pad as Gamepad & {
            vibrationActuator?: {
              playEffect?: (
                type: string,
                params: {
                  startDelay: number;
                  duration: number;
                  weakMagnitude: number;
                  strongMagnitude: number;
                }
              ) => Promise<void>;
            };
          }).vibrationActuator;
          if (actuator?.playEffect) {
            await actuator.playEffect('dual-rumble', {
              startDelay: 0,
              duration: durationMs,
              strongMagnitude: Math.max(0, Math.min(1, leftIntensity / 100)),
              weakMagnitude: Math.max(0, Math.min(1, rightIntensity / 100)),
            });
          }
        }
      } catch {
        // Graceful fallback when hardware or browser lacks dual-rumble actuator
      }
    },
    []
  );

  const stopVibrationPattern = useCallback(() => {
    patternCancelRef.current += 1;
    setRumbleActive(false);
    setActiveMotorLevels({ left: 0, right: 0 });
  }, []);

  const triggerRumble = useCallback(
    async (leftIntensity: number, rightIntensity: number, durationMs = 450) => {
      const token = ++patternCancelRef.current;
      const clampedL = Math.max(0, Math.min(100, Math.round(leftIntensity)));
      const clampedR = Math.max(0, Math.min(100, Math.round(rightIntensity)));
      setRumbleActive(clampedL > 0 || clampedR > 0);
      setActiveMotorLevels({ left: clampedL, right: clampedR });

      await emitHardwareRumble(clampedL, clampedR, durationMs);

      window.setTimeout(() => {
        if (patternCancelRef.current === token) {
          setRumbleActive(false);
          setActiveMotorLevels({ left: 0, right: 0 });
        }
      }, durationMs);
    },
    [emitHardwareRumble]
  );

  const playVibrationPattern = useCallback(
    async (
      steps: VibrationPulseStep[],
      masterLeftPct: number,
      masterRightPct: number,
      eventScalePct = 100,
      onStepChange?: (stepIndex: number | null) => void
    ) => {
      const token = ++patternCancelRef.current;
      if (steps.length === 0) {
        onStepChange?.(null);
        return;
      }

      for (let i = 0; i < steps.length; i++) {
        if (patternCancelRef.current !== token) break;
        const step = steps[i];
        onStepChange?.(i);

        const scaledLeft = Math.round(
          step.leftMotor * (masterLeftPct / 100) * (eventScalePct / 100)
        );
        const scaledRight = Math.round(
          step.rightMotor * (masterRightPct / 100) * (eventScalePct / 100)
        );

        setRumbleActive(scaledLeft > 0 || scaledRight > 0);
        setActiveMotorLevels({ left: scaledLeft, right: scaledRight });
        void emitHardwareRumble(scaledLeft, scaledRight, step.durationMs);

        await new Promise((resolve) => window.setTimeout(resolve, Math.max(30, step.durationMs)));
        if (patternCancelRef.current !== token) break;

        if (step.pauseMs > 0) {
          setRumbleActive(false);
          setActiveMotorLevels({ left: 0, right: 0 });
          await new Promise((resolve) => window.setTimeout(resolve, step.pauseMs));
        }
      }

      if (patternCancelRef.current === token) {
        setRumbleActive(false);
        setActiveMotorLevels({ left: 0, right: 0 });
        onStepChange?.(null);
      }
    },
    [emitHardwareRumble]
  );

  // Pair USB-C or 2.4GHz Wireless Dongle via WebHID
  const requestHidDevice = useCallback(
    async (preferredTransport?: 'usb' | 'dongle24g') => {
      const nav = navigator as NavigatorWithHardware;
      if (!nav.hid) {
        setConnectionMessage(
          'WebHID não disponível neste navegador. Conecte o controle via USB/2.4GHz e pressione qualquer botão para detecção automática via Gamepad API.'
        );
        return false;
      }
      try {
        const filters = MACHENIKE_VENDOR_IDS.map((vendorId) => ({ vendorId }));
        let devices = await nav.hid.requestDevice({ filters });
        if (!devices || devices.length === 0) {
          devices = await nav.hid.requestDevice({ filters: [] });
        }
        if (devices && devices.length > 0) {
          const device = devices[0];
          if (!device.opened) {
            await device.open();
          }
          const rawName = device.productName || 'Machenike Controller HID';
          const detected = identifyMachenikeDevice(rawName, {
            vendorId: device.vendorId,
            productId: device.productId,
            forcedTransport: preferredTransport,
          });
          setHidConnected(true);
          setHidDeviceName(rawName);
          setDeviceName(rawName);
          setConnectionMessage(null);
          applyDetectedHardware(detected, 'webhid');
          return true;
        }
        setConnectionMessage('Nenhum dispositivo USB ou receptor 2.4 GHz selecionado.');
        return false;
      } catch {
        setConnectionMessage(
          'Pareamento WebHID cancelado ou bloqueado pelo ambiente. Pressione qualquer botão no controle conectado para detecção automática.'
        );
        return false;
      }
    },
    [applyDetectedHardware]
  );

  // Pair Bluetooth Machenike Controller via Web Bluetooth API (+ read Battery GATT if available)
  const requestBluetoothDevice = useCallback(async () => {
    const nav = navigator as NavigatorWithHardware;
    if (!nav.bluetooth) {
      setConnectionMessage(
        'Web Bluetooth não suportado neste navegador. Pareie o controle no Bluetooth do sistema operacional e pressione qualquer botão para detecção automática.'
      );
      return false;
    }
    try {
      const device = await nav.bluetooth.requestDevice({
        filters: [
          { namePrefix: 'Machenike' },
          { namePrefix: 'MACHENIKE' },
          { namePrefix: 'G5' },
          { namePrefix: 'G6' },
          { namePrefix: 'G3' },
          { namePrefix: 'G1' },
          { namePrefix: 'Pro Controller' },
          { namePrefix: 'Xbox Wireless' },
        ],
        optionalServices: ['battery_service'],
      });

      const rawName = device.name || 'Machenike Bluetooth Controller';
      const detected = identifyMachenikeDevice(rawName, { forcedTransport: 'bluetooth' });
      setBtConnected(true);
      setBtDeviceName(rawName);
      setDeviceName(rawName);
      setConnectionMessage(null);
      applyDetectedHardware(detected, 'bluetooth');

      // Attempt reading battery level via standard Bluetooth GATT Battery Service
      if (device.gatt) {
        try {
          const server = await device.gatt.connect();
          const service = await server.getPrimaryService('battery_service');
          const char = await service.getCharacteristic('battery_level');
          const value = await char.readValue();
          setBatteryPercent(value.getUint8(0));
        } catch {
          // Battery service not exposed by this controller firmware
        }
      }
      return true;
    } catch {
      setConnectionMessage(
        'Busca Bluetooth cancelada ou indisponível. Se o controle já estiver pareado no sistema, pressione um botão para detecção automática.'
      );
      return false;
    }
  }, [applyDetectedHardware]);

  // Scan already-paired Gamepads & HID devices on demand
  const scanConnectedDevices = useCallback(async () => {
    const pads = navigator.getGamepads ? Array.from(navigator.getGamepads()).filter(Boolean) : [];
    if (pads.length > 0 && pads[0]) {
      const pad = pads[0];
      const detected = identifyMachenikeDevice(pad.id);
      setConnected(true);
      setDeviceName(pad.id);
      lastDetectedPadIdRef.current = pad.id;
      setConnectionMessage(null);
      applyDetectedHardware(detected, 'gamepad');
      return true;
    }

    const nav = navigator as NavigatorWithHardware;
    if (nav.hid) {
      try {
        const hidDevices = await nav.hid.getDevices();
        if (hidDevices.length > 0) {
          const d = hidDevices[0];
          const rawName = d.productName || 'Machenike HID';
          const detected = identifyMachenikeDevice(rawName, {
            vendorId: d.vendorId,
            productId: d.productId,
          });
          setHidConnected(true);
          setHidDeviceName(rawName);
          setDeviceName(rawName);
          setConnectionMessage(null);
          applyDetectedHardware(detected, 'webhid');
          return true;
        }
      } catch {
        // Ignore HID query error
      }
    }

    setConnectionMessage(
      'Nenhum controle físico ativo detectado agora. Conecte via cabo USB-C, receptor 2.4 GHz ou Bluetooth e pressione qualquer botão (A/Home) para acordar o dispositivo.'
    );
    return false;
  }, [applyDetectedHardware]);

  useEffect(() => {
    let rafId = 0;

    const handleConnect = (e: GamepadEvent) => {
      const idStr = e.gamepad.id || 'Controle Machenike';
      setConnected(true);
      setDeviceName(idStr);
      lastDetectedPadIdRef.current = idStr;
      setConnectionMessage(null);
      const detected = identifyMachenikeDevice(idStr);
      applyDetectedHardware(detected, 'gamepad');
    };

    const handleDisconnect = () => {
      const pads = navigator.getGamepads
        ? Array.from(navigator.getGamepads()).filter(Boolean)
        : [];
      if (pads.length === 0) {
        setConnected(false);
        lastDetectedPadIdRef.current = null;
        if (!hidConnected && !btConnected) {
          setDetectionSource('virtual');
          setDeviceName('Bancada Virtual Machenike');
        }
      }
    };

    window.addEventListener('gamepadconnected', handleConnect);
    window.addEventListener('gamepaddisconnected', handleDisconnect);

    // Also check already-authorized WebHID devices silently on mount
    const nav = navigator as NavigatorWithHardware;
    if (nav.hid) {
      nav.hid
        .getDevices()
        .then((devices) => {
          if (devices && devices.length > 0) {
            const d = devices[0];
            const rawName = d.productName || 'Machenike HID';
            const detected = identifyMachenikeDevice(rawName, {
              vendorId: d.vendorId,
              productId: d.productId,
            });
            setHidConnected(true);
            setHidDeviceName(rawName);
            applyDetectedHardware(detected, 'webhid');
          }
        })
        .catch(() => {});
    }

    const poll = () => {
      const pads = navigator.getGamepads ? navigator.getGamepads() : [];
      let activePad: Gamepad | null = null;
      for (const p of pads) {
        if (p && p.connected) {
          activePad = p;
          break;
        }
      }

      const mergedButtons = new Set<PhysicalButtonId>(virtualPressedRef.current);

      let lx = virtualSticksRef.current.lx;
      let ly = virtualSticksRef.current.ly;
      let rx = virtualSticksRef.current.rx;
      let ry = virtualSticksRef.current.ry;
      let lt = virtualSticksRef.current.lt;
      let rt = virtualSticksRef.current.rt;

      if (activePad) {
        if (lastDetectedPadIdRef.current !== activePad.id) {
          lastDetectedPadIdRef.current = activePad.id;
          setConnected(true);
          setDeviceName(activePad.id);
          const detected = identifyMachenikeDevice(activePad.id);
          applyDetectedHardware(detected, 'gamepad');
        }

        const currentPhysical = new Set<PhysicalButtonId>();
        for (const meta of PHYSICAL_BUTTONS) {
          if (meta.gamepadIndex !== undefined && activePad.buttons[meta.gamepadIndex]) {
            const btnState = activePad.buttons[meta.gamepadIndex];
            if (btnState.pressed || btnState.value > 0.25) {
              mergedButtons.add(meta.id);
              currentPhysical.add(meta.id);
              if (!prevPhysicalButtonsRef.current.has(meta.id)) {
                setLastEventTime(performance.now());
                onButtonPressRef.current?.(meta.id);
              }
            }
          }
        }
        prevPhysicalButtonsRef.current = currentPhysical;

        if (activePad.axes.length >= 2) {
          if (Math.abs(activePad.axes[0]) > 0.04 || Math.abs(activePad.axes[1]) > 0.04) {
            lx = activePad.axes[0];
            ly = activePad.axes[1];
          }
        }
        if (activePad.axes.length >= 4) {
          if (Math.abs(activePad.axes[2]) > 0.04 || Math.abs(activePad.axes[3]) > 0.04) {
            rx = activePad.axes[2];
            ry = activePad.axes[3];
          }
        }
        if (activePad.buttons[6]) {
          lt = Math.max(lt, activePad.buttons[6].value);
        }
        if (activePad.buttons[7]) {
          rt = Math.max(rt, activePad.buttons[7].value);
        }
      }

      setPressedButtons((prev) => {
        if (prev.size === mergedButtons.size && [...prev].every((b) => mergedButtons.has(b))) {
          return prev;
        }
        return mergedButtons;
      });
      setLeftStick((prev) => (prev.x === lx && prev.y === ly ? prev : { x: lx, y: ly }));
      setRightStick((prev) => (prev.x === rx && prev.y === ry ? prev : { x: rx, y: ry }));
      setLtValue((prev) => (prev === lt ? prev : lt));
      setRtValue((prev) => (prev === rt ? prev : rt));

      rafId = window.requestAnimationFrame(poll);
    };

    rafId = window.requestAnimationFrame(poll);

    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener('gamepadconnected', handleConnect);
      window.removeEventListener('gamepaddisconnected', handleDisconnect);
    };
  }, [applyDetectedHardware, hidConnected, btConnected]);

  return {
    state: {
      connected,
      deviceName,
      detectedModelId,
      detectedTransport,
      detectionConfidence,
      transportConfidence,
      detectionSource,
      hidConnected,
      hidDeviceName,
      btConnected,
      btDeviceName,
      batteryPercent,
      pressedButtons,
      leftStick,
      rightStick,
      ltValue,
      rtValue,
      lastEventTime,
      rumbleActive,
      activeMotorLevels,
    } as LiveGamepadState,
    connectionMessage,
    setVirtualButton,
    pulseVirtualButton,
    setVirtualStick,
    setVirtualTrigger,
    triggerRumble,
    playVibrationPattern,
    stopVibrationPattern,
    requestHidDevice,
    requestBluetoothDevice,
    scanConnectedDevices,
    overrideDetectedTransport,
  };
}
