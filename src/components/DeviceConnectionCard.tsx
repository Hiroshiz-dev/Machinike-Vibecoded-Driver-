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
  usb: 'Cabo USB (Com Fio)',
  dongle24g: 'Receptor 2.4 GHz (Dongle USB 2.0)',
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
              ? `Conectado via ${TRANSPORT_LABELS[activeTransport]} · ${gamepad.deviceName}`
              : `Aguardando conexão física (Dongle 2.4 GHz, Cabo USB ou Bluetooth) · Bancada: ${activeDevice.name}`}
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

      {/* 3-Protocol Selector + Direct Pairing Triggers (2.4GHz Dongle / Wired USB / Bluetooth) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div
          onClick={() => onSelectTransport('dongle24g')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onSelectTransport('dongle24g');
            }
          }}
          className={`p-3.5 rounded-lg border text-left transition-colors cursor-pointer flex flex-col justify-between gap-2.5 ${
            activeTransport === 'dongle24g'
              ? 'bg-[#1D1916] border-[#F97316]'
              : 'bg-[#0C0E12] border-white/[0.08] hover:border-white/25'
          }`}
        >
          <div>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#F4F6F9]">
                <Radio className="w-4 h-4 text-[#38BDF8]" />
                <span>Receptor 2.4 GHz</span>
              </div>
              <span className="font-mono text-[11px] text-[#8B95A8]">
                {activeTransport === 'dongle24g' ? 'Ativo' : 'Selecionar'}
              </span>
            </div>
            <p className="text-xs text-[#7D879B] mt-1">
              Dongle sem fio USB 2.0 conectado na placa-mãe ou dock (1000 Hz, modo X-Input).
            </p>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSelectTransport('dongle24g');
              onConnect24G();
            }}
            className="self-start text-[11px] font-medium text-[#38BDF8] hover:underline cursor-pointer"
          >
            Vincular receptor via WebHID
          </button>
        </div>

        <div
          onClick={() => onSelectTransport('usb')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onSelectTransport('usb');
            }
          }}
          className={`p-3.5 rounded-lg border text-left transition-colors cursor-pointer flex flex-col justify-between gap-2.5 ${
            activeTransport === 'usb'
              ? 'bg-[#1D1916] border-[#F97316]'
              : 'bg-[#0C0E12] border-white/[0.08] hover:border-white/25'
          }`}
        >
          <div>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#F4F6F9]">
                <Usb className="w-4 h-4 text-[#F97316]" />
                <span>Cabo USB (Com Fio)</span>
              </div>
              <span className="font-mono text-[11px] text-[#8B95A8]">
                {activeTransport === 'usb' ? 'Ativo' : 'Selecionar'}
              </span>
            </div>
            <p className="text-xs text-[#7D879B] mt-1">
              Conexão direta por cabo USB-C / USB-A com latência mínima de 1 ms (1000 Hz).
            </p>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSelectTransport('usb');
              onConnectUsb();
            }}
            className="self-start text-[11px] font-medium text-[#F97316] hover:underline cursor-pointer"
          >
            Vincular cabo via WebHID
          </button>
        </div>

        <div
          onClick={() => onSelectTransport('bluetooth')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onSelectTransport('bluetooth');
            }
          }}
          className={`p-3.5 rounded-lg border text-left transition-colors cursor-pointer flex flex-col justify-between gap-2.5 ${
            activeTransport === 'bluetooth'
              ? 'bg-[#1D1916] border-[#F97316]'
              : 'bg-[#0C0E12] border-white/[0.08] hover:border-white/25'
          }`}
        >
          <div>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#F4F6F9]">
                <Bluetooth className="w-4 h-4 text-[#60A5FA]" />
                <span>Bluetooth 5.0 / 5.3</span>
              </div>
              <span className="font-mono text-[11px] text-[#8B95A8]">
                {activeTransport === 'bluetooth' ? 'Ativo' : 'Selecionar'}
              </span>
            </div>
            <p className="text-xs text-[#7D879B] mt-1">
              Ideal para celular (Android/iOS) e notebooks, com leitura de bateria via GATT.
            </p>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSelectTransport('bluetooth');
              onConnectBluetooth();
            }}
            className="self-start text-[11px] font-medium text-[#60A5FA] hover:underline cursor-pointer"
          >
            Buscar dispositivo Bluetooth
          </button>
        </div>
      </div>

      {isPhysicallyDetected && gamepad.transportConfidence === 'ambiguous' && (
        <p className="text-xs text-[#8B95A8] leading-relaxed">
          Nota técnica: receptores <strong className="text-[#CBD3E1]">2.4 GHz USB 2.0</strong> plugados na
          placa-mãe são reportados pelo sistema operacional no mesmo barramento USB de um cabo com fio.
          Sua seleção acima (<strong className="text-[#F4F6F9]">{TRANSPORT_LABELS[activeTransport]}</strong>) é
          salva automaticamente para este dispositivo.
        </p>
      )}

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
                    Detectado via {TRANSPORT_LABELS[activeTransport]}
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
