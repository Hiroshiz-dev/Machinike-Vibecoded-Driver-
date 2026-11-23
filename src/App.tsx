import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Bluetooth,
  Check,
  Download,
  FolderKanban,
  Gamepad2,
  Layers,
  LayoutDashboard,
  Menu,
  Radio,
  Sliders,
  Sun,
  Upload,
  Usb,
  X,
} from 'lucide-react';
import {
  ButtonBinding,
  ConnectionMode,
  ControllerProfile,
  DriverConfig,
  INITIAL_MACROS,
  MacroDefinition,
  PHYSICAL_BUTTONS,
  PhysicalButtonId,
  RgbConfig,
  createDefaultBindings,
  createDefaultVibrationEvents,
  createDefaultVibrationPatterns,
  createFactoryDriverConfig,
  createInitialProfiles,
} from './types/controller';
import {
  DetectedHardwareInfo,
  MACHENIKE_DEVICES,
  MachenikeModelId,
  getDeviceSpec,
} from './types/devices';
import { useGamepad } from './hooks/useGamepad';
import { ActiveSection, OverviewView } from './components/OverviewView';
import { ProfilesView } from './components/ProfilesView';
import { ButtonMapperView } from './components/ButtonMapperView';
import { MacroStudioView } from './components/MacroStudioView';
import { RgbLightingView } from './components/RgbLightingView';
import { DriverCalibrationView } from './components/DriverCalibrationView';
import { PWAInstallButton } from './components/PWAInstallModal';
import { OfflineIndicator } from './components/OfflineIndicator';

const STORAGE_PROFILES_KEY = 'g5pro_max_profiles_v2';
const STORAGE_LEGACY_PROFILES_KEY = 'g5pro_max_profiles_v1';
const STORAGE_LEGACY_MACROS_KEY = 'g5pro_max_macros_v1';
const STORAGE_ACTIVE_PROFILE_KEY = 'g5pro_max_active_profile_v2';
const STORAGE_ACTIVE_MODEL_KEY = 'machenike_active_model_v1';

const SECTION_META: Record<
  ActiveSection,
  {
    label: string;
    mobileLabel: string;
    breadcrumb: string;
    icon: React.ComponentType<{ className?: string }>;
  }
> = {
  overview: {
    label: 'Visão Geral',
    mobileLabel: 'Início',
    breadcrumb: 'Visão Geral',
    icon: LayoutDashboard,
  },
  profiles: {
    label: 'Perfis de Jogo',
    mobileLabel: 'Perfis',
    breadcrumb: 'Gerenciador de Perfis',
    icon: FolderKanban,
  },
  mapping: {
    label: 'Mapeamento & Turbina',
    mobileLabel: 'Botões',
    breadcrumb: 'Mapeamento e Disparo Rápido',
    icon: Gamepad2,
  },
  macros: {
    label: 'Macros',
    mobileLabel: 'Macros',
    breadcrumb: 'Estúdio de Macros',
    icon: Layers,
  },
  rgb: {
    label: 'Iluminação RGB',
    mobileLabel: 'RGB',
    breadcrumb: 'Iluminação RGB Multizona',
    icon: Sun,
  },
  driver: {
    label: 'Vibração & Driver',
    mobileLabel: 'Driver',
    breadcrumb: 'Vibração Háptica & Calibração',
    icon: Sliders,
  },
};

function hydrateProfile(
  raw: Partial<ControllerProfile>,
  fallbackMacros: MacroDefinition[]
): ControllerProfile {
  const defaults = createFactoryDriverConfig();
  const rawBindings = raw.bindings ?? createDefaultBindings();
  const normalizedBindings = {} as Record<PhysicalButtonId, ButtonBinding>;
  for (const meta of PHYSICAL_BUTTONS) {
    const existing = rawBindings[meta.id];
    normalizedBindings[meta.id] = existing
      ? {
          ...existing,
          turboMode: existing.turboMode ?? 'hold',
          turboRateHz: existing.turboRateHz ?? 12,
        }
      : {
          type: 'gamepad',
          value:
            meta.id === 'M1'
              ? 'A'
              : meta.id === 'M2'
              ? 'B'
              : meta.id === 'M3'
              ? 'X'
              : meta.id === 'M4'
              ? 'Y'
              : meta.id,
          label:
            meta.id === 'M1'
              ? 'A (Pular)'
              : meta.id === 'M2'
              ? 'B (Agachar)'
              : meta.id === 'M3'
              ? 'X (Recarregar)'
              : meta.id === 'M4'
              ? 'Y (Trocar Arma)'
              : meta.shortLabel,
          turboEnabled: false,
          turboRateHz: 12,
          turboMode: 'hold',
        };
  }

  const rawDriver = raw.driver as Partial<DriverConfig> | undefined;
  const driver: DriverConfig = {
    ...defaults,
    ...rawDriver,
    vibrationEnabled: rawDriver?.vibrationEnabled ?? true,
    vibrationPatterns:
      Array.isArray(rawDriver?.vibrationPatterns) && rawDriver.vibrationPatterns.length > 0
        ? rawDriver.vibrationPatterns
        : createDefaultVibrationPatterns(),
    vibrationEvents:
      Array.isArray(rawDriver?.vibrationEvents) && rawDriver.vibrationEvents.length > 0
        ? rawDriver.vibrationEvents
        : createDefaultVibrationEvents(),
    leftStick: { ...defaults.leftStick, ...rawDriver?.leftStick },
    rightStick: { ...defaults.rightStick, ...rawDriver?.rightStick },
    leftTrigger: { ...defaults.leftTrigger, ...rawDriver?.leftTrigger },
    rightTrigger: { ...defaults.rightTrigger, ...rawDriver?.rightTrigger },
  };

  return {
    id: raw.id || `profile-${Date.now()}`,
    slot: raw.slot,
    name: raw.name || 'Perfil Personalizado',
    gameTitle: raw.gameTitle || raw.category || 'Multiplataforma',
    category: raw.category || 'Uso Geral',
    bindings: normalizedBindings,
    macros: Array.isArray(raw.macros) ? raw.macros : fallbackMacros,
    rgb: raw.rgb ?? {
      mode: 'static',
      brightness: 75,
      speed: 3,
      syncZones: true,
      zones: { leftStrip: '#F97316', rightStrip: '#F97316', centerRing: '#F97316' },
      reactiveColor: '#FFFFFF',
      direction: 'ltr',
    },
    driver,
    createdAt: raw.createdAt || raw.updatedAt || new Date().toISOString().slice(0, 10),
    updatedAt: raw.updatedAt || new Date().toISOString().slice(0, 10),
  };
}

function loadInitialProfiles(): ControllerProfile[] {
  try {
    const rawV2 = window.localStorage.getItem(STORAGE_PROFILES_KEY);
    if (rawV2) {
      const parsed = JSON.parse(rawV2) as Partial<ControllerProfile>[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((p) => hydrateProfile(p, []));
      }
    }
    // Migrate seamlessly from v1 storage if present
    const rawV1 = window.localStorage.getItem(STORAGE_LEGACY_PROFILES_KEY);
    if (rawV1) {
      const parsed = JSON.parse(rawV1) as Partial<ControllerProfile>[];
      let legacyMacros: MacroDefinition[] = INITIAL_MACROS;
      const rawMacros = window.localStorage.getItem(STORAGE_LEGACY_MACROS_KEY);
      if (rawMacros) {
        const parsedM = JSON.parse(rawMacros) as MacroDefinition[];
        if (Array.isArray(parsedM)) legacyMacros = parsedM;
      }
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((p) => hydrateProfile(p, legacyMacros));
      }
    }
  } catch {
    // Fallback to factory profiles
  }
  return createInitialProfiles();
}

export default function App() {
  const [profiles, setProfiles] = useState<ControllerProfile[]>(loadInitialProfiles);
  const [activeProfileId, setActiveProfileId] = useState<string>(() => {
    const stored = window.localStorage.getItem(STORAGE_ACTIVE_PROFILE_KEY);
    return stored || 'profile-1';
  });
  const [activeModelId, setActiveModelId] = useState<MachenikeModelId>(() => {
    const stored = window.localStorage.getItem(STORAGE_ACTIVE_MODEL_KEY) as MachenikeModelId | null;
    if (stored && MACHENIKE_DEVICES.some((d) => d.id === stored)) {
      return stored;
    }
    return 'g5-pro-max';
  });
  const [detectionBanner, setDetectionBanner] = useState<{
    info: DetectedHardwareInfo;
    source: 'gamepad' | 'webhid' | 'bluetooth';
  } | null>(null);
  const [activeSection, setActiveSection] = useState<ActiveSection>('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [syncState, setSyncState] = useState<'idle' | 'syncing' | 'synced'>('idle');
  const [importError, setImportError] = useState<string | null>(null);
  const [lastGamepadPress, setLastGamepadPress] = useState<{
    button: PhysicalButtonId;
    timestamp: number;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const activeDeviceSpec = useMemo(() => getDeviceSpec(activeModelId), [activeModelId]);

  const activeProfile = useMemo(
    () => profiles.find((p) => p.id === activeProfileId) ?? profiles[0],
    [profiles, activeProfileId]
  );

  const handlePhysicalPress = useCallback((button: PhysicalButtonId) => {
    setLastGamepadPress({ button, timestamp: performance.now() });
  }, []);

  const handleHardwareDetected = useCallback(
    (info: DetectedHardwareInfo, source: 'gamepad' | 'webhid' | 'bluetooth') => {
      setActiveModelId(info.modelId);
      setDetectionBanner({ info, source });

      const detectedSpec = getDeviceSpec(info.modelId);
      setProfiles((list) =>
        list.map((p) =>
          p.id === activeProfileId
            ? {
                ...p,
                driver: {
                  ...p.driver,
                  connectionMode: info.transport,
                  gyroTarget: detectedSpec.hasGyro ? p.driver.gyroTarget : 'off',
                },
              }
            : p
        )
      );
    },
    [activeProfileId]
  );

  const {
    state: gamepad,
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
  } = useGamepad(handlePhysicalPress, handleHardwareDetected);

  // Persist active profile ID and active Machenike model ID
  useEffect(() => {
    if (activeProfile) {
      window.localStorage.setItem(STORAGE_ACTIVE_PROFILE_KEY, activeProfile.id);
    }
  }, [activeProfile]);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_ACTIVE_MODEL_KEY, activeModelId);
  }, [activeModelId]);

  const persistProfiles = useCallback((nextProfiles: ControllerProfile[]) => {
    window.localStorage.setItem(STORAGE_PROFILES_KEY, JSON.stringify(nextProfiles));
  }, []);

  const mutateActiveProfile = useCallback(
    (updater: (prev: ControllerProfile) => ControllerProfile) => {
      setProfiles((list) =>
        list.map((p) =>
          p.id === activeProfile.id
            ? { ...updater(p), updatedAt: new Date().toISOString().slice(0, 10) }
            : p
        )
      );
      setHasUnsavedChanges(true);
      setSyncState('idle');
    },
    [activeProfile.id]
  );

  const handleSelectModel = useCallback(
    (modelId: MachenikeModelId) => {
      setActiveModelId(modelId);
      const spec = getDeviceSpec(modelId);
      if (!spec.hasGyro) {
        setProfiles((list) =>
          list.map((p) =>
            p.id === activeProfile.id
              ? { ...p, driver: { ...p.driver, gyroTarget: 'off' } }
              : p
          )
        );
      }
    },
    [activeProfile.id]
  );

  const handleSelectTransport = useCallback(
    (mode: ConnectionMode) => {
      overrideDetectedTransport(mode);
      setDetectionBanner((prev) =>
        prev
          ? {
              ...prev,
              info: {
                ...prev.info,
                transport: mode,
                transportConfidence: 'exact',
              },
            }
          : prev
      );
      mutateActiveProfile((p) => ({
        ...p,
        driver: {
          ...p.driver,
          connectionMode: mode,
          pollingRate:
            mode === 'bluetooth' && p.driver.pollingRate > 250 ? 250 : p.driver.pollingRate,
        },
      }));
    },
    [mutateActiveProfile, overrideDetectedTransport]
  );

  const handleSyncToController = useCallback(() => {
    setSyncState('syncing');
    persistProfiles(profiles);
    window.setTimeout(() => {
      setSyncState('synced');
      setHasUnsavedChanges(false);
      if (activeProfile.driver.vibrationEnabled) {
        triggerRumble(22, 35, 140);
      }
      window.setTimeout(() => setSyncState('idle'), 2200);
    }, 260);
  }, [profiles, persistProfiles, activeProfile.driver.vibrationEnabled, triggerRumble]);

  // Profile CRUD operations
  const handleCreateProfile = useCallback(
    (payload: {
      name: string;
      gameTitle: string;
      category: string;
      source: 'current' | 'factory';
    }) => {
      const today = new Date().toISOString().slice(0, 10);
      const id = `profile-${Date.now()}`;
      const created: ControllerProfile =
        payload.source === 'current'
          ? {
              ...JSON.parse(JSON.stringify(activeProfile)),
              id,
              slot: undefined,
              name: payload.name,
              gameTitle: payload.gameTitle,
              category: payload.category,
              createdAt: today,
              updatedAt: today,
            }
          : {
              id,
              name: payload.name,
              gameTitle: payload.gameTitle,
              category: payload.category,
              bindings: createDefaultBindings(),
              macros: [],
              rgb: {
                mode: 'static',
                brightness: 75,
                speed: 3,
                syncZones: true,
                zones: { leftStrip: '#F97316', rightStrip: '#F97316', centerRing: '#F97316' },
                reactiveColor: '#FFFFFF',
                direction: 'ltr',
              },
              driver: createFactoryDriverConfig(),
              createdAt: today,
              updatedAt: today,
            };

      setProfiles((prev) => {
        const next = [created, ...prev];
        persistProfiles(next);
        return next;
      });
      setActiveProfileId(id);
      setHasUnsavedChanges(false);
    },
    [activeProfile, persistProfiles]
  );

  const handleUpdateProfileMeta = useCallback(
    (id: string, patch: { name: string; gameTitle: string; category: string }) => {
      setProfiles((prev) => {
        const next = prev.map((p) =>
          p.id === id
            ? { ...p, ...patch, updatedAt: new Date().toISOString().slice(0, 10) }
            : p
        );
        persistProfiles(next);
        return next;
      });
      setHasUnsavedChanges(false);
    },
    [persistProfiles]
  );

  const handleDuplicateProfile = useCallback(
    (id: string) => {
      const source = profiles.find((p) => p.id === id);
      if (!source) return;
      const today = new Date().toISOString().slice(0, 10);
      const copy: ControllerProfile = {
        ...JSON.parse(JSON.stringify(source)),
        id: `profile-${Date.now()}`,
        slot: undefined,
        name: `${source.name} (Cópia)`,
        createdAt: today,
        updatedAt: today,
      };
      setProfiles((prev) => {
        const next = [copy, ...prev];
        persistProfiles(next);
        return next;
      });
      setActiveProfileId(copy.id);
    },
    [profiles, persistProfiles]
  );

  const handleDeleteProfile = useCallback(
    (id: string) => {
      setProfiles((prev) => {
        if (prev.length <= 1) return prev;
        const next = prev.filter((p) => p.id !== id);
        persistProfiles(next);
        if (activeProfileId === id) {
          setActiveProfileId(next[0].id);
        }
        return next;
      });
    },
    [activeProfileId, persistProfiles]
  );

  const handleUpdateBinding = useCallback(
    (buttonId: PhysicalButtonId, binding: ButtonBinding) => {
      mutateActiveProfile((p) => ({
        ...p,
        bindings: {
          ...p.bindings,
          [buttonId]: binding,
        },
      }));
    },
    [mutateActiveProfile]
  );

  const handleResetAllBindings = useCallback(() => {
    mutateActiveProfile((p) => ({
      ...p,
      bindings: createDefaultBindings(),
    }));
  }, [mutateActiveProfile]);

  const handleUpdateRgb = useCallback(
    (rgb: RgbConfig) => {
      mutateActiveProfile((p) => ({ ...p, rgb }));
    },
    [mutateActiveProfile]
  );

  const handleUpdateDriver = useCallback(
    (driver: DriverConfig) => {
      mutateActiveProfile((p) => ({ ...p, driver }));
    },
    [mutateActiveProfile]
  );

  const handleResetDriver = useCallback(() => {
    mutateActiveProfile((p) => ({ ...p, driver: createFactoryDriverConfig() }));
  }, [mutateActiveProfile]);

  // Profile-scoped Macro operations
  const handleCreateMacro = useCallback(
    (macro: MacroDefinition) => {
      mutateActiveProfile((p) => ({
        ...p,
        macros: [macro, ...p.macros],
      }));
    },
    [mutateActiveProfile]
  );

  const handleUpdateMacro = useCallback(
    (updated: MacroDefinition) => {
      mutateActiveProfile((p) => {
        const nextBindings = { ...p.bindings };
        (Object.keys(nextBindings) as PhysicalButtonId[]).forEach((key) => {
          if (nextBindings[key].type === 'macro' && nextBindings[key].value === updated.id) {
            nextBindings[key] = { ...nextBindings[key], label: updated.name };
          }
        });
        return {
          ...p,
          macros: p.macros.map((m) => (m.id === updated.id ? updated : m)),
          bindings: nextBindings,
        };
      });
    },
    [mutateActiveProfile]
  );

  const handleDeleteMacro = useCallback(
    (macroId: string) => {
      mutateActiveProfile((p) => {
        const nextBindings = { ...p.bindings };
        (Object.keys(nextBindings) as PhysicalButtonId[]).forEach((key) => {
          if (nextBindings[key].type === 'macro' && nextBindings[key].value === macroId) {
            nextBindings[key] = {
              type: 'gamepad',
              value: key === 'M1' ? 'A' : key === 'M2' ? 'B' : key,
              label: key === 'M1' ? 'A' : key === 'M2' ? 'B' : key,
              turboEnabled: false,
              turboRateHz: 12,
              turboMode: 'hold',
            };
          }
        });
        return {
          ...p,
          macros: p.macros.filter((m) => m.id !== macroId),
          bindings: nextBindings,
        };
      });
    },
    [mutateActiveProfile]
  );

  const handleAssignMacroToButton = useCallback(
    (buttonId: PhysicalButtonId, macro: MacroDefinition) => {
      handleUpdateBinding(buttonId, {
        type: 'macro',
        value: macro.id,
        label: macro.name,
        turboEnabled: false,
        turboRateHz: 12,
        turboMode: 'hold',
      });
    },
    [handleUpdateBinding]
  );

  const handleExportAllConfig = () => {
    const payload = {
      device: activeDeviceSpec.name,
      modelId: activeDeviceSpec.id,
      version: 2,
      exportedAt: new Date().toISOString(),
      profiles,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `machenike-${activeDeviceSpec.id}-perfis.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportSingleProfile = (profile: ControllerProfile) => {
    const payload = {
      device: activeDeviceSpec.name,
      modelId: activeDeviceSpec.id,
      version: 2,
      exportedAt: new Date().toISOString(),
      profile,
    };
    const safeSlug = profile.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `machenike-${activeDeviceSpec.id}-${safeSlug || 'perfil'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result));
        if (Array.isArray(data.profiles) && data.profiles.length > 0) {
          const fallbackMacros = Array.isArray(data.macros) ? data.macros : [];
          const imported = data.profiles.map((p: Partial<ControllerProfile>) =>
            hydrateProfile(p, fallbackMacros)
          );
          setProfiles(imported);
          setActiveProfileId(imported[0].id);
          persistProfiles(imported);
        } else if (data.profile && typeof data.profile === 'object') {
          const importedSingle = hydrateProfile(
            { ...data.profile, id: `profile-${Date.now()}` },
            []
          );
          setProfiles((prev) => {
            const next = [importedSingle, ...prev];
            persistProfiles(next);
            return next;
          });
          setActiveProfileId(importedSingle.id);
        } else {
          throw new Error('Formato não reconhecido');
        }
        setImportError(null);
        setHasUnsavedChanges(false);
      } catch {
        setImportError('Arquivo JSON inválido para configuração G5PRO MAX.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const navOrder: ActiveSection[] = ['overview', 'profiles', 'mapping', 'macros', 'rgb', 'driver'];

  return (
    <div className="min-h-screen bg-[#0C0E12] text-[#F1F3F7] flex">
      {/* Desktop Left Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-[252px] lg:shrink-0 bg-[#11141B] border-r border-white/[0.08] justify-between">
        <div className="p-5 space-y-7">
          <div className="space-y-3">
            <div className="px-2">
              <span className="font-display text-lg font-bold tracking-tight text-[#F4F6F9] whitespace-nowrap">
                Machenike Hub
              </span>
            </div>

            <div className="px-1">
              <label
                htmlFor="sidebar-model-select"
                className="block px-1 mb-1 text-[11px] font-medium text-[#7D879B]"
              >
                {gamepad.connected || gamepad.hidConnected || gamepad.btConnected
                  ? 'Controle Detectado'
                  : 'Modelo Ativo'}
              </label>
              <select
                id="sidebar-model-select"
                value={activeModelId}
                onChange={(e) => handleSelectModel(e.target.value as MachenikeModelId)}
                className="w-full bg-[#0C0E12] border border-white/[0.08] rounded-lg px-2.5 py-2 text-xs font-medium text-[#F4F6F9] focus:outline-none focus:border-[#F97316] cursor-pointer"
              >
                {MACHENIKE_DEVICES.map((device) => (
                  <option key={device.id} value={device.id}>
                    {device.shortName}
                    {gamepad.detectedModelId === device.id ? ' (Conectado)' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <nav className="space-y-1" aria-label="Navegação do controlador">
            {navOrder.map((key) => {
              const item = SECTION_META[key];
              const Icon = item.icon;
              const active = activeSection === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setActiveSection(key)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap cursor-pointer ${
                    active
                      ? 'bg-[#1D222E] text-[#F4F6F9]'
                      : 'text-[#8B95A8] hover:text-[#F4F6F9] hover:bg-white/[0.03]'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 ${active ? 'text-[#F97316]' : 'text-[#717C90]'}`}
                  />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Saved Game Profiles Quick Switcher */}
          <div className="pt-5 border-t border-white/[0.07] space-y-2">
            <div className="px-2 flex items-center justify-between text-xs">
              <span className="font-medium text-[#7D879B]">Perfis Salvos</span>
              <button
                type="button"
                onClick={() => setActiveSection('profiles')}
                className="text-[#F97316] hover:underline cursor-pointer"
              >
                Gerenciar
              </button>
            </div>
            <div className="space-y-1 max-h-[210px] overflow-y-auto pr-0.5">
              {profiles.map((p, idx) => {
                const isCurrent = p.id === activeProfile.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setActiveProfileId(p.id)}
                    className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-left text-xs transition-colors cursor-pointer ${
                      isCurrent
                        ? 'bg-[#1D1916] text-[#F97316] font-semibold'
                        : 'text-[#9EA7B8] hover:text-[#F4F6F9] hover:bg-white/[0.03]'
                    }`}
                  >
                    <span className="truncate">{p.name}</span>
                    <span className="font-mono text-[11px] opacity-75 shrink-0 tabular-nums">
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Bottom Config Import/Export */}
        <div className="p-5 border-t border-white/[0.07] space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleExportAllConfig}
              className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg bg-[#171B24] hover:bg-[#1F2430] border border-white/[0.08] text-xs font-medium text-[#CBD3E1] transition-colors whitespace-nowrap cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Exportar
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg bg-[#171B24] hover:bg-[#1F2430] border border-white/[0.08] text-xs font-medium text-[#CBD3E1] transition-colors whitespace-nowrap cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              Importar
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            onChange={handleImportFile}
            className="hidden"
          />
          {importError && <p className="text-[11px] text-[#EF4444]">{importError}</p>}
        </div>
      </aside>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div className="fixed inset-0 bg-black/70" onClick={() => setMobileMenuOpen(false)} />
          <div className="relative w-72 max-w-[82vw] bg-[#11141B] border-r border-white/[0.08] p-5 flex flex-col justify-between z-10">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <span className="font-display text-lg font-bold text-[#F4F6F9]">Machenike Hub</span>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 text-[#8B95A8] hover:text-white cursor-pointer"
                  aria-label="Fechar menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-1.5">
                <div className="text-[11px] text-[#7D879B]">Modelo Machenike</div>
                <select
                  value={activeModelId}
                  onChange={(e) => handleSelectModel(e.target.value as MachenikeModelId)}
                  className="w-full bg-[#0C0E12] border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-[#F4F6F9]"
                >
                  {MACHENIKE_DEVICES.map((device) => (
                    <option key={device.id} value={device.id}>
                      {device.shortName}
                    </option>
                  ))}
                </select>
              </div>
              <nav className="space-y-1">
                {navOrder.map((key) => {
                  const item = SECTION_META[key];
                  const Icon = item.icon;
                  const active = activeSection === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => {
                        setActiveSection(key);
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium ${
                        active ? 'bg-[#1D222E] text-[#F4F6F9]' : 'text-[#8B95A8]'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${active ? 'text-[#F97316]' : 'text-[#717C90]'}`} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            <div className="space-y-2 pt-4 border-t border-white/[0.08]">
              <div className="text-xs text-[#7D879B]">Perfil Ativo</div>
              <select
                value={activeProfile.id}
                onChange={(e) => setActiveProfileId(e.target.value)}
                className="w-full bg-[#0C0E12] border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-[#F4F6F9]"
              >
                {profiles.map((p, i) => (
                  <option key={p.id} value={p.id}>
                    {String(i + 1).padStart(2, '0')} — {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="h-16 px-5 lg:px-8 border-b border-white/[0.08] bg-[#0C0E12] flex items-center justify-between gap-6 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 -ml-2 text-[#9EA7B8] hover:text-white cursor-pointer"
              aria-label="Abrir navegação"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-sm truncate">
              <span className="text-[#7D879B] whitespace-nowrap">{activeDeviceSpec.name}</span>
              <span aria-hidden="true" className="text-[#4B5567]">/</span>
              <span className="text-[#F4F6F9] font-medium truncate">
                {SECTION_META[activeSection].breadcrumb}
              </span>
              <span aria-hidden="true" className="hidden sm:inline text-[#4B5567]">·</span>
              <span className="hidden sm:inline text-xs font-mono text-[#8B95A8] truncate">
                {activeProfile.name}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <PWAInstallButton />
            <button
              type="button"
              onClick={handleSyncToController}
              disabled={syncState === 'syncing'}
              className={`inline-flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                syncState === 'synced'
                  ? 'bg-[#16A34A] text-white'
                  : hasUnsavedChanges
                  ? 'bg-[#F97316] hover:bg-[#EA6A0E] text-[#0C0E12]'
                  : 'bg-[#1E232E] hover:bg-[#272E3D] text-[#F4F6F9] border border-white/[0.1]'
              }`}
            >
              {syncState === 'synced' ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Perfil Sincronizado</span>
                  <span className="sm:hidden">Salvo</span>
                </>
              ) : syncState === 'syncing' ? (
                'Salvando...'
              ) : hasUnsavedChanges ? (
                <>
                  <span className="hidden sm:inline">Salvar e Aplicar</span>
                  <span className="sm:hidden">Salvar</span>
                </>
              ) : (
                <>
                  <span className="hidden sm:inline">Sincronizar Perfil</span>
                  <span className="sm:hidden">Sincronizar</span>
                </>
              )}
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-5 lg:p-8 pb-24 lg:pb-8">
          <div className="max-w-[1280px] mx-auto space-y-5">
            {detectionBanner && (
              <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 rounded-xl bg-[#141A17] border border-[#22C55E]/35">
                <div className="flex items-center gap-3 min-w-0">
                  {detectionBanner.info.transport === 'bluetooth' ? (
                    <Bluetooth className="w-4 h-4 text-[#22C55E] shrink-0" />
                  ) : detectionBanner.info.transport === 'dongle24g' ? (
                    <Radio className="w-4 h-4 text-[#22C55E] shrink-0" />
                  ) : (
                    <Usb className="w-4 h-4 text-[#22C55E] shrink-0" />
                  )}
                  <div className="text-xs text-[#D7E6DC] min-w-0">
                    <span className="font-semibold text-[#F4F6F9]">
                      {getDeviceSpec(detectionBanner.info.modelId).name}
                    </span>{' '}
                    reconhecido via{' '}
                    <span className="font-mono text-[#86EFAC]">
                      {detectionBanner.info.transport === 'usb'
                        ? 'Cabo USB (Com Fio)'
                        : detectionBanner.info.transport === 'dongle24g'
                        ? 'Receptor 2.4 GHz (Dongle USB 2.0)'
                        : 'Bluetooth'}
                    </span>
                    {detectionBanner.info.transportConfidence === 'ambiguous' && (
                      <span className="text-[#9DB2A4]">
                        {' '}
                        — barramento USB da placa-mãe detectado (ajuste o modo se estiver usando cabo)
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <select
                    aria-label="Confirmar tipo de conexão"
                    value={activeProfile.driver.connectionMode}
                    onChange={(e) => handleSelectTransport(e.target.value as ConnectionMode)}
                    className="bg-[#0C0E12] border border-white/[0.12] rounded-md px-2.5 py-1 text-xs text-[#F4F6F9] focus:outline-none focus:border-[#F97316]"
                  >
                    <option value="dongle24g">Dongle 2.4 GHz (USB 2.0)</option>
                    <option value="usb">Cabo USB (Com Fio)</option>
                    <option value="bluetooth">Bluetooth</option>
                  </select>
                  {detectionBanner.info.confidence === 'inferred' && (
                    <select
                      aria-label="Confirmar modelo Machenike"
                      value={activeModelId}
                      onChange={(e) => handleSelectModel(e.target.value as MachenikeModelId)}
                      className="bg-[#0C0E12] border border-white/[0.12] rounded-md px-2.5 py-1 text-xs text-[#F4F6F9] focus:outline-none focus:border-[#F97316]"
                    >
                      {MACHENIKE_DEVICES.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.shortName}
                        </option>
                      ))}
                    </select>
                  )}
                  <button
                    type="button"
                    onClick={() => setDetectionBanner(null)}
                    className="p-1 text-[#8EA696] hover:text-white cursor-pointer"
                    aria-label="Dispensar aviso de reconhecimento"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {activeSection === 'overview' && (
              <OverviewView
                deviceSpec={activeDeviceSpec}
                profile={activeProfile}
                profiles={profiles}
                gamepad={gamepad}
                connectionMessage={connectionMessage}
                onSelectModel={handleSelectModel}
                onSelectTransport={handleSelectTransport}
                onSelectProfile={setActiveProfileId}
                onNavigate={setActiveSection}
                onPressVirtualButton={setVirtualButton}
                onSetVirtualStick={setVirtualStick}
                onSetVirtualTrigger={setVirtualTrigger}
                onTriggerRumble={triggerRumble}
                onConnectUsb={() => requestHidDevice('usb')}
                onConnect24G={() => requestHidDevice('dongle24g')}
                onConnectBluetooth={requestBluetoothDevice}
                onScanDevices={scanConnectedDevices}
              />
            )}

            {activeSection === 'profiles' && (
              <ProfilesView
                profiles={profiles}
                activeProfileId={activeProfile.id}
                hasUnsavedChanges={hasUnsavedChanges}
                onLoadProfile={setActiveProfileId}
                onCreateProfile={handleCreateProfile}
                onUpdateProfileMeta={handleUpdateProfileMeta}
                onDuplicateProfile={handleDuplicateProfile}
                onDeleteProfile={handleDeleteProfile}
                onSaveAll={handleSyncToController}
                onExportSingleProfile={handleExportSingleProfile}
              />
            )}

            {activeSection === 'mapping' && (
              <ButtonMapperView
                deviceSpec={activeDeviceSpec}
                profile={activeProfile}
                macros={activeProfile.macros}
                gamepad={gamepad}
                onUpdateBinding={handleUpdateBinding}
                onResetAllBindings={handleResetAllBindings}
                onPulseButton={pulseVirtualButton}
                onGoToMacros={() => setActiveSection('macros')}
              />
            )}

            {activeSection === 'macros' && (
              <MacroStudioView
                deviceSpec={activeDeviceSpec}
                macros={activeProfile.macros}
                profile={activeProfile}
                onCreateMacro={handleCreateMacro}
                onUpdateMacro={handleUpdateMacro}
                onDeleteMacro={handleDeleteMacro}
                onAssignMacroToButton={handleAssignMacroToButton}
                onSimulateButton={pulseVirtualButton}
                lastGamepadPress={lastGamepadPress}
              />
            )}

            {activeSection === 'rgb' && (
              <RgbLightingView
                deviceSpec={activeDeviceSpec}
                profile={activeProfile}
                gamepad={gamepad}
                onUpdateRgb={handleUpdateRgb}
                onPulseButton={pulseVirtualButton}
              />
            )}

            {activeSection === 'driver' && (
              <DriverCalibrationView
                deviceSpec={activeDeviceSpec}
                profile={activeProfile}
                gamepad={gamepad}
                hidMessage={connectionMessage}
                onUpdateDriver={handleUpdateDriver}
                onResetDriver={handleResetDriver}
                onSetVirtualStick={setVirtualStick}
                onSetVirtualTrigger={setVirtualTrigger}
                onTriggerRumble={triggerRumble}
                onPlayVibrationPattern={playVibrationPattern}
                onStopVibrationPattern={stopVibrationPattern}
                onRequestHid={() => requestHidDevice()}
                onRequestBluetooth={requestBluetoothDevice}
              />
            )}
          </div>
        </main>

        {/* Mobile Bottom Navigation Bar */}
        <nav
          aria-label="Navegação rápida mobile"
          className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-[#11141B]/95 backdrop-blur-md border-t border-white/[0.08] px-1 pt-1.5 pb-[calc(0.375rem+env(safe-area-inset-bottom))]"
        >
          <div className="grid grid-cols-6 gap-0.5">
            {navOrder.map((key) => {
              const item = SECTION_META[key];
              const Icon = item.icon;
              const active = activeSection === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setActiveSection(key)}
                  className={`flex flex-col items-center justify-center gap-1 py-1.5 rounded-lg transition-colors cursor-pointer ${
                    active ? 'text-[#F97316] bg-[#1D222E]/70' : 'text-[#8B95A8]'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="text-[10px] font-medium leading-none truncate max-w-full">
                    {item.mobileLabel}
                  </span>
                </button>
              );
            })}
          </div>
        </nav>

        <OfflineIndicator />
      </div>
    </div>
  );
}
