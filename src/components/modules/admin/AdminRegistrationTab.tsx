import React, { useMemo, useState } from 'react';
import {
  BarChart3,
  BookOpen,
  Building2,
  CheckCircle2,
  Copy,
  CreditCard,
  GraduationCap,
  Link2,
  Mail,
  MessageCircle,
  Shield,
  UserCheck,
  UserPlus,
  Users,
} from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { User, UserRole } from '../../../types';
import { getAppBasePath } from '../../../utils/urlUtils';
import { Modal } from '../../common/Modal';

const assignableRoles: {
  role: UserRole;
  label: string;
  description: string;
  icon: React.ElementType;
  color: string;
}[] = [
  {
    role: 'TEACHER',
    label: 'Professor / Docente',
    description: 'Somente o painel do professor.',
    icon: BookOpen,
    color: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  },
  {
    role: 'FINANCE',
    label: 'Financeiro / Tesouraria',
    description: 'Cobranças, caixa, recibos e relatórios.',
    icon: CreditCard,
    color: 'bg-amber-50 text-amber-800 border-amber-200',
  },
  {
    role: 'SECRETARIAT',
    label: 'Secretaria',
    description: 'Alunos, matrículas, turmas e documentos.',
    icon: Users,
    color: 'bg-teal-50 text-teal-800 border-teal-200',
  },
  {
    role: 'ACCOUNTING',
    label: 'Contabilidade',
    description: 'Receitas, despesas, reembolsos e DRE.',
    icon: BarChart3,
    color: 'bg-blue-50 text-blue-800 border-blue-200',
  },
  {
    role: 'RECEPTION',
    label: 'Recepção',
    description: 'Atendimento e pré-registro de pagamentos.',
    icon: Building2,
    color: 'bg-indigo-50 text-indigo-800 border-indigo-200',
  },
  {
    role: 'SUPER_ADMIN',
    label: 'Super Admin',
    description: 'Acesso total à administração da plataforma.',
    icon: Shield,
    color: 'bg-purple-50 text-purple-800 border-purple-200',
  },
  {
    role: 'STUDENT',
    label: 'Aluno',
    description: 'Portal do estudante e AVA.',
    icon: GraduationCap,
    color: 'bg-purple-50 text-purple-700 border-purple-200',
  },
];

export const AdminRegistrationTab: React.FC = () => {
  const { state, updateUser } = useApp();
  const [copied, setCopied] = useState(false);
  const [editingPending, setEditingPending] = useState<User | null>(null);
  const [draftRoles, setDraftRoles] = useState<UserRole[]>([]);
  const [savedFeedback, setSavedFeedback] = useState<string | null>(null);

  const registrationLink = useMemo(() => {
    if (typeof window === 'undefined') return '';
    const base = getAppBasePath();
    return `${window.location.origin}${base || ''}/?registro=1`;
  }, []);

  const pendingUsers = (state.users || []).filter(
    (user) => user.role === 'PENDING' || !user.roles || user.roles.length === 0
  );

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(registrationLink);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  };

  const openRoleModal = (user: User) => {
    setEditingPending(user);
    setDraftRoles((user.roles || []).filter((role) => role !== 'PENDING'));
  };

  const toggleDraftRole = (role: UserRole) => {
    setDraftRoles((current) =>
      current.includes(role) ? current.filter((r) => r !== role) : [...current, role]
    );
  };

  const saveRoles = () => {
    if (!editingPending || draftRoles.length === 0) return;
    updateUser(editingPending.id, {
      roles: draftRoles,
      role: draftRoles[0],
      permissions: ['*'],
      status: 'ACTIVE',
    });
    setSavedFeedback(`Função definida para ${editingPending.name}.`);
    setEditingPending(null);
    window.setTimeout(() => setSavedFeedback(null), 3500);
  };

  const shareWhatsApp = () => {
    const message = encodeURIComponent(
      `Olá! Crie seu acesso à Think Green Platform com sua conta Google usando este link: ${registrationLink}`
    );
    window.open(`https://wa.me/?text=${message}`, '_blank', 'noopener,noreferrer');
  };

  const shareEmail = () => {
    const subject = encodeURIComponent('Registro de acesso — Think Green Platform');
    const body = encodeURIComponent(
      `Olá!\n\nCrie seu acesso à Think Green Platform com sua conta Google usando o link abaixo:\n${registrationLink}\n\nApós o registro, sua função será definida pela administração.\n\nThink Green Platform`
    );
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  return (
    <div className="space-y-5">
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <UserPlus className="w-5 h-5 text-purple-700" />
          Registro Geral de Funcionários
        </h2>
        <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
          Envie este link para os funcionários. Eles criam a conta com o Google e ficam
          aguardando a definição da função. Depois de atribuir as funções abaixo, o acesso é
          liberado automaticamente.
        </p>
      </div>

      {savedFeedback && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          {savedFeedback}
        </div>
      )}

      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
          <Link2 className="w-4 h-4 text-purple-600" />
          Link de registro geral
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <input
            readOnly
            value={registrationLink}
            onFocus={(e) => e.currentTarget.select()}
            className="flex-1 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-700"
          />
          <button
            type="button"
            onClick={() => void copyLink()}
            className="px-4 py-2.5 bg-purple-700 hover:bg-purple-800 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Link copiado' : 'Copiar link'}
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={shareWhatsApp}
            className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            Enviar por WhatsApp
          </button>
          <button
            type="button"
            onClick={shareEmail}
            className="px-3.5 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Mail className="w-3.5 h-3.5" />
            Enviar por e-mail
          </button>
        </div>

        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-600 leading-relaxed">
          <strong>Como funciona:</strong> o funcionário entra com a conta Google, o cadastro é
          criado como <em>Aguardando função</em> e ele vê uma tela de espera. Assim que você
          definir uma ou mais funções, o acesso é liberado no próximo login ou na verificação
          automática da tela de espera.
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-amber-600" />
              Cadastros aguardando função
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Defina os módulos que cada funcionário poderá acessar.
            </p>
          </div>
          <span className="self-start sm:self-auto px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
            {pendingUsers.length} pendente{pendingUsers.length === 1 ? '' : 's'}
          </span>
        </div>

        {pendingUsers.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            Nenhum cadastro aguardando aprovação no momento.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {pendingUsers.map((user) => (
              <div
                key={user.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-amber-100 text-amber-800 font-bold flex items-center justify-center overflow-hidden flex-shrink-0">
                    {user.avatarUrl ? (
                      <img
                        src={user.avatarUrl}
                        alt={user.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      user.name.charAt(0)
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate">{user.name}</p>
                    <p className="text-[11px] text-slate-500 font-mono truncate">{user.email}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => openRoleModal(user)}
                  className="self-start sm:self-auto px-3.5 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Shield className="w-3.5 h-3.5" />
                  Definir função
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {editingPending && (
        <Modal
          isOpen={true}
          onClose={() => setEditingPending(null)}
          title={`Definir função de ${editingPending.name}`}
        >
          <div className="space-y-4 text-xs">
            <p className="text-slate-600 leading-relaxed">
              Selecione uma ou mais funções. O funcionário poderá acessar todos os módulos
              vinculados (por exemplo, Administração + Financeiro).
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {assignableRoles.map((item) => {
                const Icon = item.icon;
                const selected = draftRoles.includes(item.role);
                return (
                  <button
                    key={item.role}
                    type="button"
                    onClick={() => toggleDraftRole(item.role)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      selected
                        ? 'bg-purple-50 border-purple-300 ring-1 ring-purple-300'
                        : 'bg-white border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Icon
                        className={`w-4 h-4 ${
                          selected ? 'text-purple-700' : 'text-slate-500'
                        }`}
                      />
                      <span
                        className={`font-bold ${
                          selected ? 'text-purple-900' : 'text-slate-800'
                        }`}
                      >
                        {item.label}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
                      {item.description}
                    </p>
                  </button>
                );
              })}
            </div>

            {draftRoles.length === 0 && (
              <p className="text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-xl p-2.5">
                Selecione pelo menos uma função para liberar o acesso.
              </p>
            )}

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditingPending(null)}
                className="px-4 py-2 border border-slate-300 rounded-xl font-semibold text-slate-700"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={saveRoles}
                disabled={draftRoles.length === 0}
                className="px-5 py-2 bg-purple-700 hover:bg-purple-800 disabled:opacity-60 text-white rounded-xl font-bold"
              >
                Liberar acesso
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
