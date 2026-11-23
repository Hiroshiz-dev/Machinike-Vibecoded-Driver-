import React, { useMemo, useState } from 'react';
import {
  Check,
  Copy,
  Download,
  FolderOpen,
  Plus,
  Save,
  Search,
  Trash2,
} from 'lucide-react';
import {
  ControllerProfile,
  PHYSICAL_BUTTONS,
} from '../types/controller';

interface ProfilesViewProps {
  profiles: ControllerProfile[];
  activeProfileId: string;
  hasUnsavedChanges: boolean;
  onLoadProfile: (id: string) => void;
  onCreateProfile: (payload: {
    name: string;
    gameTitle: string;
    category: string;
    source: 'current' | 'factory';
  }) => void;
  onUpdateProfileMeta: (
    id: string,
    patch: { name: string; gameTitle: string; category: string }
  ) => void;
  onDuplicateProfile: (id: string) => void;
  onDeleteProfile: (id: string) => void;
  onSaveAll: () => void;
  onExportSingleProfile: (profile: ControllerProfile) => void;
}

const CATEGORY_SUGGESTIONS = [
  'Tiro em Primeira Pessoa',
  'Jogos de Luta e Hack-and-Slash',
  'Simuladores de Direção',
  'RPG / Mundo Aberto',
  'Esportes / Futebol',
  'Plataforma / Metroidvania',
  'Uso Geral',
];

const RGB_LABELS: Record<string, string> = {
  static: 'Estático',
  breathing: 'Respiração',
  rainbow: 'Arco-íris',
  reactive: 'Reativo',
  pulse: 'Pulso',
  off: 'Desligado',
};

export const ProfilesView: React.FC<ProfilesViewProps> = ({
  profiles,
  activeProfileId,
  hasUnsavedChanges,
  onLoadProfile,
  onCreateProfile,
  onUpdateProfileMeta,
  onDuplicateProfile,
  onDeleteProfile,
  onSaveAll,
  onExportSingleProfile,
}) => {
  const [search, setSearch] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newGame, setNewGame] = useState('');
  const [newCategory, setNewCategory] = useState(CATEGORY_SUGGESTIONS[0]);
  const [newSource, setNewSource] = useState<'current' | 'factory'>('current');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const activeProfile = useMemo(
    () => profiles.find((p) => p.id === activeProfileId) ?? profiles[0],
    [profiles, activeProfileId]
  );

  const [editName, setEditName] = useState(activeProfile.name);
  const [editGame, setEditGame] = useState(activeProfile.gameTitle);
  const [editCategory, setEditCategory] = useState(activeProfile.category);

  // Sync editor inputs when active profile changes
  React.useEffect(() => {
    setEditName(activeProfile.name);
    setEditGame(activeProfile.gameTitle);
    setEditCategory(activeProfile.category);
  }, [activeProfile.id, activeProfile.name, activeProfile.gameTitle, activeProfile.category]);

  const showToast = (msg: string) => {
    setFeedback(msg);
    window.setTimeout(() => setFeedback(null), 2800);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newName.trim();
    if (!trimmed) return;
    onCreateProfile({
      name: trimmed,
      gameTitle: newGame.trim() || 'Jogo Personalizado',
      category: newCategory,
      source: newSource,
    });
    setNewName('');
    setNewGame('');
    setShowCreateForm(false);
    showToast(`Perfil "${trimmed}" criado e carregado no controlador.`);
  };

  const handleSaveActiveMeta = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = editName.trim();
    if (!trimmed) return;
    onUpdateProfileMeta(activeProfile.id, {
      name: trimmed,
      gameTitle: editGame.trim() || 'Multiplataforma',
      category: editCategory,
    });
    onSaveAll();
    showToast(`Perfil "${trimmed}" salvo com todas as configurações de botões, macros, RGB e vibração.`);
  };

  const filteredProfiles = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return profiles;
    return profiles.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.gameTitle.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
    );
  }, [profiles, search]);

  const summarizeProfile = (p: ControllerProfile) => {
    const turboCount = PHYSICAL_BUTTONS.filter((b) => p.bindings[b.id]?.turboEnabled).length;
    const remappedCount = PHYSICAL_BUTTONS.filter((b) => {
      const bind = p.bindings[b.id];
      if (!bind) return false;
      if (bind.type !== 'gamepad') return true;
      if (b.id !== 'M1' && b.id !== 'M2' && bind.value !== b.id) return true;
      return false;
    }).length;
    const activeEvents = p.driver.vibrationEvents.filter((e) => e.enabled).length;
    return { turboCount, remappedCount, activeEvents };
  };

  return (
    <div className="space-y-6">
      {/* Header + Create Button */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-[#F4F6F9]">Perfis de Jogo</h1>
          <p className="text-xs text-[#8B95A8] mt-0.5">
            Cada perfil armazena mapeamento de botões, modo turbina, macros dedicadas, iluminação RGB e padrões de vibração.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowCreateForm((v) => !v)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#F97316] hover:bg-[#EA6A0E] text-[#0C0E12] text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            {showCreateForm ? 'Cancelar Criação' : 'Novo Perfil de Jogo'}
          </button>
        </div>
      </div>

      {feedback && (
        <div className="px-4 py-3 rounded-lg bg-[#16A34A]/15 border border-[#16A34A]/40 text-xs text-[#86EFAC] flex items-center gap-2">
          <Check className="w-4 h-4 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Inline Create Profile Form */}
      {showCreateForm && (
        <form
          onSubmit={handleCreateSubmit}
          className="bg-[#14171E] border border-[#F97316]/60 rounded-xl p-6 space-y-4"
        >
          <div className="flex items-center justify-between border-b border-white/[0.07] pb-3">
            <h2 className="text-sm font-semibold text-[#F4F6F9]">Criar Novo Perfil de Jogo</h2>
            <span className="text-xs text-[#8B95A8]">
              O novo perfil será carregado imediatamente após a criação
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="new-profile-name" className="block text-xs text-[#9EA7B8]">
                Nome do Perfil
              </label>
              <input
                id="new-profile-name"
                type="text"
                required
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Ex.: Warzone Ranked, Elden Ring..."
                className="w-full px-3 py-2 text-xs bg-[#0C0E12] border border-white/[0.1] rounded-lg text-[#F4F6F9] placeholder-[#6B7487] focus:outline-none focus:border-[#F97316]"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="new-profile-game" className="block text-xs text-[#9EA7B8]">
                Jogo / Título Associado
              </label>
              <input
                id="new-profile-game"
                type="text"
                value={newGame}
                onChange={(e) => setNewGame(e.target.value)}
                placeholder="Ex.: Call of Duty: Warzone"
                className="w-full px-3 py-2 text-xs bg-[#0C0E12] border border-white/[0.1] rounded-lg text-[#F4F6F9] placeholder-[#6B7487] focus:outline-none focus:border-[#F97316]"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="new-profile-cat" className="block text-xs text-[#9EA7B8]">
                Gênero / Categoria
              </label>
              <select
                id="new-profile-cat"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[#0C0E12] border border-white/[0.1] rounded-lg text-[#F4F6F9] focus:outline-none focus:border-[#F97316]"
              >
                {CATEGORY_SUGGESTIONS.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
            <div className="inline-flex items-center p-1 bg-[#0C0E12] border border-white/[0.08] rounded-lg">
              <button
                type="button"
                onClick={() => setNewSource('current')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                  newSource === 'current'
                    ? 'bg-[#222733] text-[#F4F6F9]'
                    : 'text-[#8B95A8] hover:text-[#F4F6F9]'
                }`}
              >
                Baseado no Perfil Atual ({activeProfile.name})
              </button>
              <button
                type="button"
                onClick={() => setNewSource('factory')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                  newSource === 'factory'
                    ? 'bg-[#222733] text-[#F4F6F9]'
                    : 'text-[#8B95A8] hover:text-[#F4F6F9]'
                }`}
              >
                Configuração Limpa de Fábrica
              </button>
            </div>

            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-[#F97316] hover:bg-[#EA6A0E] text-[#0C0E12] text-xs font-semibold transition-colors cursor-pointer"
            >
              Criar e Carregar Perfil
            </button>
          </div>
        </form>
      )}

      {/* Active Profile Save & Metadata Editor */}
      <form
        onSubmit={handleSaveActiveMeta}
        className="bg-[#14171E] border border-white/[0.08] rounded-xl p-6 space-y-5"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-white/[0.07]">
          <div>
            <div className="text-xs font-mono text-[#F97316]">
              Perfil Carregado Agora · Atualizado em {activeProfile.updatedAt}
            </div>
            <h2 className="text-base font-semibold text-[#F4F6F9] mt-0.5">
              {activeProfile.name}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onExportSingleProfile(activeProfile)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#0C0E12] hover:bg-[#1C212C] border border-white/[0.08] text-xs font-medium text-[#CBD3E1] transition-colors whitespace-nowrap cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Exportar Perfil (.json)
            </button>
            <button
              type="submit"
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                hasUnsavedChanges
                  ? 'bg-[#F97316] hover:bg-[#EA6A0E] text-[#0C0E12]'
                  : 'bg-[#222733] hover:bg-[#2C3344] text-[#F4F6F9]'
              }`}
            >
              <Save className="w-3.5 h-3.5" />
              Salvar Alterações no Perfil
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label htmlFor="edit-prof-name" className="block text-xs text-[#9EA7B8]">
              Nome do Perfil
            </label>
            <input
              id="edit-prof-name"
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-[#0C0E12] border border-white/[0.08] rounded-lg text-[#F4F6F9] focus:outline-none focus:border-[#F97316]"
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="edit-prof-game" className="block text-xs text-[#9EA7B8]">
              Jogo / Aplicação
            </label>
            <input
              id="edit-prof-game"
              type="text"
              value={editGame}
              onChange={(e) => setEditGame(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-[#0C0E12] border border-white/[0.08] rounded-lg text-[#F4F6F9] focus:outline-none focus:border-[#F97316]"
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="edit-prof-cat" className="block text-xs text-[#9EA7B8]">
              Categoria
            </label>
            <select
              id="edit-prof-cat"
              value={editCategory}
              onChange={(e) => setEditCategory(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-[#0C0E12] border border-white/[0.08] rounded-lg text-[#F4F6F9] focus:outline-none focus:border-[#F97316]"
            >
              {CATEGORY_SUGGESTIONS.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Clean Unboxed Config Snapshot Summary */}
        {(() => {
          const stats = summarizeProfile(activeProfile);
          return (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 pt-4 border-t border-white/[0.07] text-xs">
              <div>
                <div className="text-[#7D879B]">Mapeamentos</div>
                <div className="font-mono tabular-nums text-[#F4F6F9] mt-1">
                  {stats.remappedCount} personalizados
                </div>
              </div>
              <div>
                <div className="text-[#7D879B]">Modo Turbina</div>
                <div className="font-mono tabular-nums text-[#F4F6F9] mt-1">
                  {stats.turboCount} botões ativos
                </div>
              </div>
              <div>
                <div className="text-[#7D879B]">Macros do Perfil</div>
                <div className="font-mono tabular-nums text-[#F4F6F9] mt-1">
                  {activeProfile.macros.length} sequências
                </div>
              </div>
              <div>
                <div className="text-[#7D879B]">Iluminação RGB</div>
                <div className="flex items-center gap-2 mt-1 font-mono text-[#F4F6F9]">
                  <span
                    className="w-3 h-3 rounded-xs border border-white/20 shrink-0"
                    style={{
                      backgroundColor:
                        activeProfile.rgb.mode === 'off'
                          ? '#232834'
                          : activeProfile.rgb.zones.leftStrip,
                    }}
                  />
                  <span>
                    {RGB_LABELS[activeProfile.rgb.mode]} · {activeProfile.rgb.brightness}%
                  </span>
                </div>
              </div>
              <div>
                <div className="text-[#7D879B]">Vibração & Eventos</div>
                <div className="font-mono tabular-nums text-[#F4F6F9] mt-1">
                  {activeProfile.driver.vibrationLeft}%/{activeProfile.driver.vibrationRight}% ·{' '}
                  {stats.activeEvents} eventos
                </div>
              </div>
            </div>
          );
        })()}
      </form>

      {/* Library of All Saved Game Profiles */}
      <section className="bg-[#14171E] border border-white/[0.08] rounded-xl overflow-hidden">
        <div className="p-5 border-b border-white/[0.07] flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold text-[#F4F6F9]">
              Biblioteca de Perfis ({profiles.length})
            </h2>
            <p className="text-xs text-[#8B95A8] mt-0.5">
              Carregue, duplique ou exclua perfis salvos para diferentes jogos.
            </p>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-[#7B8598] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filtrar por nome ou jogo..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#0C0E12] border border-white/[0.08] rounded-lg text-[#F4F6F9] placeholder-[#6B7487] focus:outline-none focus:border-[#F97316]"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/[0.07] text-xs font-medium text-[#7D879B]">
                <th className="py-3 px-5">Perfil / Jogo</th>
                <th className="py-3 px-4">RGB</th>
                <th className="py-3 px-4 text-right">Turbina</th>
                <th className="py-3 px-4 text-right">Macros</th>
                <th className="py-3 px-4 text-right">Polling</th>
                <th className="py-3 px-5 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.05] text-sm">
              {filteredProfiles.map((p) => {
                const isActive = p.id === activeProfile.id;
                const stats = summarizeProfile(p);
                const confirmingDelete = confirmDeleteId === p.id;
                return (
                  <tr
                    key={p.id}
                    className={`transition-colors ${
                      isActive ? 'bg-[#1A1F2B]' : 'hover:bg-[#171B24]'
                    }`}
                  >
                    <td className="py-3 px-5">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-[#F4F6F9]">{p.name}</span>
                        {isActive && (
                          <span className="text-xs font-mono text-[#F97316]">· Ativo</span>
                        )}
                      </div>
                      <div className="text-xs text-[#8B95A8] mt-0.5">
                        {p.gameTitle} · {p.category}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2 text-xs text-[#CBD3E1]">
                        <span
                          className="w-3 h-3 rounded-xs border border-white/20 shrink-0"
                          style={{
                            backgroundColor:
                              p.rgb.mode === 'off' ? '#232834' : p.rgb.zones.leftStrip,
                          }}
                        />
                        <span>{RGB_LABELS[p.rgb.mode]}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-xs tabular-nums text-[#CBD3E1]">
                      {stats.turboCount} botões
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-xs tabular-nums text-[#CBD3E1]">
                      {p.macros.length}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-xs tabular-nums text-[#8B95A8]">
                      {p.driver.pollingRate} Hz
                    </td>
                    <td className="py-3 px-5 text-right">
                      <div className="inline-flex items-center justify-end gap-1.5">
                        {!isActive && (
                          <button
                            type="button"
                            onClick={() => {
                              onLoadProfile(p.id);
                              showToast(`Perfil "${p.name}" carregado no controle.`);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-[#222733] hover:bg-[#F97316] hover:text-[#0C0E12] text-xs font-medium text-[#F4F6F9] transition-colors cursor-pointer"
                          >
                            <FolderOpen className="w-3.5 h-3.5" />
                            Carregar
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            onDuplicateProfile(p.id);
                            showToast(`Cópia de "${p.name}" criada.`);
                          }}
                          className="p-1.5 text-[#8B95A8] hover:text-[#F4F6F9] rounded-md transition-colors cursor-pointer"
                          title="Duplicar perfil"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>

                        {profiles.length > 1 && (
                          confirmingDelete ? (
                            <div className="inline-flex items-center gap-1 ml-1">
                              <button
                                type="button"
                                onClick={() => {
                                  onDeleteProfile(p.id);
                                  setConfirmDeleteId(null);
                                  showToast(`Perfil "${p.name}" excluído.`);
                                }}
                                className="px-2 py-1 rounded bg-[#DC2626] text-white text-[11px] font-semibold cursor-pointer"
                              >
                                Confirmar
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteId(null)}
                                className="px-2 py-1 rounded bg-[#222733] text-[#CBD3E1] text-[11px] cursor-pointer"
                              >
                                Cancelar
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(p.id)}
                              className="p-1.5 text-[#8B95A8] hover:text-[#EF4444] rounded-md transition-colors cursor-pointer"
                              title="Excluir perfil"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
