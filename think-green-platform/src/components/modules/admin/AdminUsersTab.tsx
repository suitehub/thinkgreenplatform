import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Edit2,
  Trash2,
  LogIn,
  Shield,
  GraduationCap,
  BookOpen,
  CreditCard,
  Building2,
  BarChart3,
  Sparkles,
  Phone,
  Mail,
  Lock,
} from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { User, UserRole } from '../../../types';
import { Modal } from '../../common/Modal';
import { Badge } from '../../common/Badge';

export const AdminUsersTab: React.FC = () => {
  const { state, createUser, updateUser, deleteUser, toggleUserStatus, switchUserById } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modals state
  const [isNewUserModalOpen, setIsNewUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [impersonateSuccess, setImpersonateSuccess] = useState<string | null>(null);

  // New User Form State
  const [formData, setFormData] = useState<{
    name: string;
    email: string;
    phone: string;
    role: UserRole;
    department: string;
    status: 'ACTIVE' | 'INACTIVE';
    studentId: string;
  }>({
    name: '',
    email: '',
    phone: '+20 10 ',
    role: 'SECRETARIAT',
    department: 'Secretaria Acadêmica',
    status: 'ACTIVE',
    studentId: '',
  });

  const rolesList: { role: UserRole; label: string; icon: any; color: string }[] = [
    { role: 'STUDENT', label: 'Aluno (Estudante)', icon: GraduationCap, color: 'bg-purple-50 text-purple-700 border-purple-200' },
    { role: 'TEACHER', label: 'Professor / Docente', icon: BookOpen, color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    { role: 'FINANCE', label: 'Financeiro / Tesouraria', icon: CreditCard, color: 'bg-amber-50 text-amber-700 border-amber-200' },
    { role: 'SECRETARIAT', label: 'Secretaria', icon: Users, color: 'bg-teal-50 text-teal-700 border-teal-200' },
    { role: 'ACCOUNTING', label: 'Contabilidade', icon: BarChart3, color: 'bg-blue-50 text-blue-700 border-blue-200' },
    { role: 'SUPER_ADMIN', label: 'Super Admin', icon: Shield, color: 'bg-purple-100 text-purple-900 border-purple-300 font-bold' },
  ];

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'STUDENT':
        return <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-purple-50 text-purple-800 border border-purple-200">Aluno</span>;
      case 'TEACHER':
        return <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">Professor</span>;
      case 'FINANCE':
        return <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">Financeiro</span>;
      case 'SECRETARIAT':
        return <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-teal-50 text-teal-800 border border-teal-200">Secretaria</span>;
      case 'ACCOUNTING':
        return <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-blue-50 text-blue-800 border border-blue-200">Contabilidade</span>;
      case 'SUPER_ADMIN':
        return <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-purple-100 text-purple-900 border border-purple-300">Super Admin</span>;
      default:
        return <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 text-slate-700">{role}</span>;
    }
  };

  // Filter users
  const filteredUsers = (state.users || []).filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.phone && user.phone.includes(searchQuery)) ||
      (user.department && user.department.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (user.studentId && user.studentId.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesRole = roleFilter === 'ALL' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'ALL' || user.status === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleOpenCreateModal = () => {
    setFormData({
      name: '',
      email: '',
      phone: '+20 10 ',
      role: 'SECRETARIAT',
      department: 'Secretaria Acadêmica',
      status: 'ACTIVE',
      studentId: '',
    });
    setIsNewUserModalOpen(true);
  };

  const handleSaveNewUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim()) return;

    createUser({
      name: formData.name.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      role: formData.role,
      department: formData.department.trim(),
      status: formData.status,
      permissions: ['*'],
      studentId: formData.role === 'STUDENT' ? formData.studentId.trim() || undefined : undefined,
    });

    setIsNewUserModalOpen(false);
  };

  const handleOpenEditModal = (user: User) => {
    setEditingUser(user);
  };

  const handleSaveEditUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    updateUser(editingUser.id, {
      name: editingUser.name,
      email: editingUser.email,
      phone: editingUser.phone,
      role: editingUser.role,
      department: editingUser.department,
      status: editingUser.status,
      studentId: editingUser.studentId,
    });

    setEditingUser(null);
  };

  const handleImpersonate = (user: User) => {
    switchUserById(user.id);
    setImpersonateSuccess(`Agora navegando como ${user.name} (${user.role})!`);
    setTimeout(() => setImpersonateSuccess(null), 3000);
  };

  const handleDeleteConfirm = () => {
    if (!deletingUser) return;
    deleteUser(deletingUser.id);
    setDeletingUser(null);
  };

  return (
    <div className="space-y-5">
      {/* Header & New User Action */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-700" />
            Gestão de Usuários, Perfis e Acessos (RBAC)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Gerencie operadores da secretaria, docentes, equipe financeira, administradores e alunos.
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors shadow-2xs self-start sm:self-auto cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          Novo Usuário
        </button>
      </div>

      {impersonateSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          {impersonateSuccess}
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nome, e-mail, telefone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all"
          />
        </div>

        {/* Role & Status Filters */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Filter className="w-3.5 h-3.5" />
            <span>Papel:</span>
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="ALL">Todos os Papéis ({state.users.length})</option>
            <option value="STUDENT">Aluno</option>
            <option value="TEACHER">Professor</option>
            <option value="FINANCE">Financeiro</option>
            <option value="SECRETARIAT">Secretaria</option>
            <option value="ACCOUNTING">Contabilidade</option>
            <option value="SUPER_ADMIN">Super Admin</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="ALL">Todos os Status</option>
            <option value="ACTIVE">Apenas Ativos</option>
            <option value="INACTIVE">Apenas Inativos</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Usuário</th>
                <th className="px-4 py-3">Papel / Função</th>
                <th className="px-4 py-3">Departamento</th>
                <th className="px-4 py-3">Contato</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                    Nenhum usuário encontrado com os filtros aplicados.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-purple-100 border border-purple-200 text-purple-800 font-bold flex items-center justify-center text-xs flex-shrink-0">
                          {user.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{user.name}</p>
                          <p className="text-[11px] text-slate-400 font-mono">{user.email}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap">
                      {getRoleBadge(user.role)}
                      {user.studentId && (
                        <span className="block font-mono text-[10px] text-slate-400 mt-0.5">
                          ID: {user.studentId}
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3 text-slate-600">
                      {user.department || 'Geral'}
                    </td>

                    <td className="px-4 py-3 text-slate-600 font-mono text-[11px]">
                      {user.phone || '—'}
                    </td>

                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleUserStatus(user.id)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border cursor-pointer transition-all ${
                          user.status === 'ACTIVE'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                            : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                        }`}
                        title="Clique para alternar o status do usuário"
                      >
                        {user.status === 'ACTIVE' ? (
                          <>
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Ativo
                          </>
                        ) : (
                          <>
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                            Inativo
                          </>
                        )}
                      </button>
                    </td>

                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleImpersonate(user)}
                          className="p-1.5 text-slate-500 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors cursor-pointer"
                          title={`Acessar como ${user.name}`}
                        >
                          <LogIn className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleOpenEditModal(user)}
                          className="p-1.5 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                          title="Editar dados do usuário"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => setDeletingUser(user)}
                          className="p-1.5 text-slate-400 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Excluir usuário"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Novo Usuário */}
      <Modal
        isOpen={isNewUserModalOpen}
        onClose={() => setIsNewUserModalOpen(false)}
        title="Cadastrar Novo Usuário do Sistema"
      >
        <form onSubmit={handleSaveNewUser} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Nome Completo *</label>
            <input
              type="text"
              required
              placeholder="Ex: Youssef Ibrahim"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">E-mail Institucional *</label>
              <input
                type="email"
                required
                placeholder="youssef@thinkgreen.org"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Telefone / WhatsApp</label>
              <input
                type="text"
                placeholder="+20 10 1234 5678"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Papel / Nível de Acesso (Role) *</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500"
              >
                <option value="STUDENT">Aluno</option>
                <option value="TEACHER">Professor</option>
                <option value="FINANCE">Financeiro</option>
                <option value="SECRETARIAT">Secretaria</option>
                <option value="ACCOUNTING">Contabilidade</option>
                <option value="SUPER_ADMIN">Super Admin</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Departamento / Lotação</label>
              <input
                type="text"
                placeholder="Ex: Coordenação de Idiomas"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          {formData.role === 'STUDENT' && (
            <div>
              <label className="block font-bold text-slate-700 mb-1">Vincular ID do Aluno (STU00000)</label>
              <input
                type="text"
                placeholder="Ex: STU00001"
                value={formData.studentId}
                onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                className="w-full p-2.5 font-mono border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500"
              />
            </div>
          )}

          <div>
            <label className="block font-bold text-slate-700 mb-1">Status Inicial</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as 'ACTIVE' | 'INACTIVE' })}
              className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500"
            >
              <option value="ACTIVE">Ativo (Acesso Imediato)</option>
              <option value="INACTIVE">Inativo (Bloqueado)</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsNewUserModalOpen(false)}
              className="px-4 py-2 border border-slate-300 rounded-xl font-semibold text-slate-700"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-xl font-bold shadow-2xs"
            >
              Criar Usuário
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Editar Usuário */}
      {editingUser && (
        <Modal
          isOpen={true}
          onClose={() => setEditingUser(null)}
          title={`Editar Usuário: ${editingUser.name}`}
        >
          <form onSubmit={handleSaveEditUser} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Nome Completo *</label>
              <input
                type="text"
                required
                value={editingUser.name}
                onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">E-mail *</label>
                <input
                  type="email"
                  required
                  value={editingUser.email}
                  onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Telefone</label>
                <input
                  type="text"
                  value={editingUser.phone || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, phone: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Papel (Role) *</label>
                <select
                  value={editingUser.role}
                  onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value as UserRole })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500"
                >
                  <option value="STUDENT">Aluno</option>
                  <option value="TEACHER">Professor</option>
                  <option value="FINANCE">Financeiro</option>
                  <option value="SECRETARIAT">Secretaria</option>
                  <option value="ACCOUNTING">Contabilidade</option>
                  <option value="SUPER_ADMIN">Super Admin</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Departamento</label>
                <input
                  type="text"
                  value={editingUser.department || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, department: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Status da Conta</label>
              <select
                value={editingUser.status}
                onChange={(e) => setEditingUser({ ...editingUser, status: e.target.value as 'ACTIVE' | 'INACTIVE' })}
                className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500"
              >
                <option value="ACTIVE">Ativo (Acesso Liberado)</option>
                <option value="INACTIVE">Inativo (Acesso Bloqueado)</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="px-4 py-2 border border-slate-300 rounded-xl font-semibold text-slate-700"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-xl font-bold shadow-2xs"
              >
                Salvar Alterações
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal: Excluir Usuário */}
      {deletingUser && (
        <Modal
          isOpen={true}
          onClose={() => setDeletingUser(null)}
          title="Excluir Usuário"
        >
          <div className="space-y-4 text-xs">
            <p className="text-slate-600">
              Tem certeza de que deseja excluir permanentemente o usuário{' '}
              <strong className="text-slate-900">{deletingUser.name}</strong> ({deletingUser.email})?
              Esta ação registrará um log na auditoria.
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setDeletingUser(null)}
                className="px-4 py-2 border border-slate-300 rounded-xl font-semibold text-slate-700"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold"
              >
                Confirmar Exclusão
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
