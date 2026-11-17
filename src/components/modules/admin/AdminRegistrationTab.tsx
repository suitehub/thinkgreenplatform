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
    label: 'Teacher / Instructor',
    description: 'Teacher panel only.',
    icon: BookOpen,
    color: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  },
  {
    role: 'FINANCE',
    label: 'Finance / Treasury',
    description: 'Charges, cashier, receipts and reports.',
    icon: CreditCard,
    color: 'bg-amber-50 text-amber-800 border-amber-200',
  },
  {
    role: 'SECRETARIAT',
    label: 'Secretariat',
    description: 'Students, enrollments, classes and documents.',
    icon: Users,
    color: 'bg-teal-50 text-teal-800 border-teal-200',
  },
  {
    role: 'ACCOUNTING',
    label: 'Accounting',
    description: 'Revenue, expenses, refunds and P&L.',
    icon: BarChart3,
    color: 'bg-blue-50 text-blue-800 border-blue-200',
  },
  {
    role: 'RECEPTION',
    label: 'Reception',
    description: 'Front desk service and payment pre-registration.',
    icon: Building2,
    color: 'bg-indigo-50 text-indigo-800 border-indigo-200',
  },
  {
    role: 'SUPER_ADMIN',
    label: 'Super Admin',
    description: 'Full access to platform administration.',
    icon: Shield,
    color: 'bg-purple-50 text-purple-800 border-purple-200',
  },
  {
    role: 'STUDENT',
    label: 'Student',
    description: 'Student portal and LMS.',
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
    setSavedFeedback(`Role assigned to ${editingPending.name}.`);
    setEditingPending(null);
    window.setTimeout(() => setSavedFeedback(null), 3500);
  };

  const shareWhatsApp = () => {
    const message = encodeURIComponent(
      `Hello! Create your Think Green Platform access with Google or email and password using this link: ${registrationLink}`
    );
    window.open(`https://wa.me/?text=${message}`, '_blank', 'noopener,noreferrer');
  };

  const shareEmail = () => {
    const subject = encodeURIComponent('Access registration — Think Green Platform');
    const body = encodeURIComponent(
      `Hello!\n\nCreate your Think Green Platform access with Google or email and password using the link below:\n${registrationLink}\n\nAfter registering, your role will be assigned by administration.\n\nThink Green Platform`
    );
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  return (
    <div className="space-y-5">
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <UserPlus className="w-5 h-5 text-purple-700" />
          General Staff Registration
        </h2>
        <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
          Send this link to staff members. They create an account with Google or email and password
          and wait for a role to be assigned. Once you assign the roles below, access is granted
          automatically.
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
          General registration link
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
            {copied ? 'Link copied' : 'Copy link'}
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={shareWhatsApp}
            className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            Send via WhatsApp
          </button>
          <button
            type="button"
            onClick={shareEmail}
            className="px-3.5 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Mail className="w-3.5 h-3.5" />
            Send via email
          </button>
        </div>

        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-600 leading-relaxed">
          <strong>How it works:</strong> the staff member signs in with Google or creates an account
          with email and password, the account is created as <em>Awaiting role</em> and they see a
          waiting screen. As soon as you assign one or more roles, access is granted on the next
          login or on the automatic check of the waiting screen.
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-amber-600" />
              Registrations awaiting role
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Define which modules each staff member can access.
            </p>
          </div>
          <span className="self-start sm:self-auto px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
            {pendingUsers.length} pending
          </span>
        </div>

        {pendingUsers.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            No registrations awaiting approval at the moment.
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
                  Assign role
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
          title={`Assign role to ${editingPending.name}`}
        >
          <div className="space-y-4 text-xs">
            <p className="text-slate-600 leading-relaxed">
              Select one or more roles. The staff member will be able to access all linked
              modules (for example, Administration + Finance).
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
                Select at least one role to grant access.
              </p>
            )}

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditingPending(null)}
                className="px-4 py-2 border border-slate-300 rounded-xl font-semibold text-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveRoles}
                disabled={draftRoles.length === 0}
                className="px-5 py-2 bg-purple-700 hover:bg-purple-800 disabled:opacity-60 text-white rounded-xl font-bold"
              >
                Grant access
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
