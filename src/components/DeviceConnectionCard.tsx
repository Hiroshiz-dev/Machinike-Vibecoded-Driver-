import React from 'react';
import {
  Bluetooth,
  Check,
  Radio,
  RefreshCw,
  Usb,
} from 'lucide-react';
import { ConnectionMode } from '../types/controller';
import {
  MACHENIKE_DEVICES,
  MachenikeDeviceSpec,
  MachenikeModelId,
} from '../types/devices';
import { LiveGamepadState } from '../hooks/useGamepad';

interface DeviceConnectionCardProps {
  activeDevice: MachenikeDeviceSpec;
  activeTransport: ConnectionMode;
  gamepad: LiveGamepadState;
  connectionMessage: string | null;
  onSelectModel: (modelId: MachenikeModelId) => void;
  onSelectTransport: (mode: ConnectionMode) => void;
  onConnectUsb: () => void;
  onConnect24G: () => void;
  onConnectBluetooth: () => void;
  onScanDevices: () => void;
}

const TRANSPORT_LABELS: Record<ConnectionMode, string> = {
  usb: 'USB-C com fio',
  dongle24g: 'Receptor 2.4 GHz',
  bluetooth: 'Bluetooth',
};

export const DeviceConnectionCard: React.FC<DeviceConnectionCardProps> = ({
  activeDevice,
  activeTransport,
  gamepad,
  connectionMessage,
  onSelectModel,
  onSelectTransport,
  onConnectUsb,
  onConnect24G,
  onConnectBluetooth,
  onScanDevices,
}) => {
  const isPhysicallyDetected =
    gamepad.connected || gamepad.hidConnected || gamepad.btConnected;

  return (
    <section className="bg-[#14171E] border border-white/[0.08] rounded-xl p-6 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-white/[0.07]">
        <div>
          <h2 className="text-base font-semibold text-[#F4F6F9]">
            Reconhecimento de Controles Machenike
          </h2>
          <p className="text-xs text-[#8B95A8] mt-0.5 font-mono tabular-nums">
            {isPhysicallyDetected
              ? `Conectado via ${TRANSPORT_LABELS[gamepad.detectedTransport ?? activeTransport]} · ${gamepad.deviceName}`
              : `Aguardando conexão física (USB-C, 2.4 GHz ou Bluetooth) · Bancada: ${activeDevice.name}`}
            {gamepad.batteryPercent !== null ? ` · Bateria ${gamepad.batteryPercent}%` : ''}
          </p>
        </div>

        <button
          type="button"
          onClick={onScanDevices}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1E232E] hover:bg-[#272E3D] border border-white/[0.08] text-xs font-medium text-[#F4F6F9] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5 text-[#F97316]" />
          Detectar Agora
        </button>
      </div>

      {/* 3-Protocol Direct Connection Triggers (USB / 2.4GHz / Bluetooth) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <button
          type="button"
          onClick={() => {
            onSelectTransport('usb');
            onConnectUsb();
          }}
          className={`p-3.5 rounded-lg border text-left transition-colors cursor-pointer ${
            activeTransport === 'usb'
              ? 'bg-[#1D1916] border-[#F97316]'
              : 'bg-[#0C0E12] border-white/[0.08] hover:border-white/25'
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-[#F4F6F9]">
              <Usb className="w-4 h-4 text-[#F97316]" />
              <span>Cabo USB-C</span>
            </div>
            <span className="font-mono text-[11px] text-[#8B95A8]">
              {activeTransport === 'usb' ? 'Ativo' : 'Parear'}
            </span>
          </div>
          <p className="text-xs text-[#7D879B] mt-1">
            Conexão direta WebHID / Gamepad com latência mínima de 1 ms (1000 Hz).
          </p>
        </button>

        <button
          type="button"
          onClick={() => {
            onSelectTransport('dongle24g');
            onConnect24G();
          }}
          className={`p-3.5 rounded-lg border text-left transition-colors cursor-pointer ${
            activeTransport === 'dongle24g'
              ? 'bg-[#1D1916] border-[#F97316]'
              : 'bg-[#0C0E12] border-white/[0.08] hover:border-white/25'
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-[#F4F6F9]">
              <Radio className="w-4 h-4 text-[#38BDF8]" />
              <span>Receptor 2.4 GHz</span>
            </div>
            <span className="font-mono text-[11px] text-[#8B95A8]">
              {activeTransport === 'dongle24g' ? 'Ativo' : 'Parear'}
            </span>
          </div>
          <p className="text-xs text-[#7D879B] mt-1">
            Reconhece o dongle sem fio Machenike via WebHID ou modo X-Input automático.
          </p>
        </button>

        <button
          type="button"
          onClick={() => {
            onSelectTransport('bluetooth');
            onConnectBluetooth();
          }}
          className={`p-3.5 rounded-lg border text-left transition-colors cursor-pointer ${
            activeTransport === 'bluetooth'
              ? 'bg-[#1D1916] border-[#F97316]'
              : 'bg-[#0C0E12] border-white/[0.08] hover:border-white/25'
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-[#F4F6F9]">
              <Bluetooth className="w-4 h-4 text-[#60A5FA]" />
              <span>Bluetooth 5.0 / 5.3</span>
            </div>
            <span className="font-mono text-[11px] text-[#8B95A8]">
              {activeTransport === 'bluetooth' ? 'Ativo' : 'Parear'}
            </span>
          </div>
          <p className="text-xs text-[#7D879B] mt-1">
            Busca dispositivos Machenike BLE, identifica o modelo e lê nível de bateria.
          </p>
        </button>
      </div>

      {connectionMessage && (
        <p className="text-xs text-[#D97706] leading-relaxed">{connectionMessage}</p>
      )}

      {/* Supported Machenike Family Model Selector */}
      <div className="space-y-2.5 pt-2 border-t border-white/[0.07]">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="font-medium text-[#CBD3E1]">
            Modelos Machenike Compatíveis ({MACHENIKE_DEVICES.length})
          </span>
          <span className="text-[#7D879B]">
            Selecionado automaticamente ao conectar — ou escolha manualmente para pré-configurar
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {MACHENIKE_DEVICES.map((dev) => {
            const isCurrent = dev.id === activeDevice.id;
            const isAutoMatched =
              isPhysicallyDetected && gamepad.detectedModelId === dev.id;
            return (
              <button
                key={dev.id}
                type="button"
                onClick={() => onSelectModel(dev.id)}
                className={`p-3 rounded-lg border text-left transition-colors cursor-pointer ${
                  isCurrent
                    ? 'bg-[#1A1F2B] border-[#F97316]'
                    : 'bg-[#0C0E12] border-white/[0.08] hover:border-white/20'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-[#F4F6F9] truncate">
                    {dev.name}
                  </span>
                  {isCurrent && (
                    <Check className="w-3.5 h-3.5 text-[#F97316] shrink-0" />
                  )}
                </div>
                <div className="text-[11px] text-[#7D879B] mt-1 truncate">
                  {dev.extraButtons.length > 0
                    ? `${dev.extraButtons.join('/')} · `
                    : '17 botões · '}
                  {dev.rgbZones === 3 ? 'RGB 3 zonas' : 'LED Central'} ·{' '}
                  {dev.hasGyro ? 'Giroscópio' : 'Sem Giro'}
                </div>
                {isAutoMatched && (
                  <div className="text-[10px] font-mono text-[#22C55E] mt-1">
                    Detectado via {TRANSPORT_LABELS[gamepad.detectedTransport ?? activeTransport]}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
};
