import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  LogOut,
  Mail,
  RefreshCw,
  ShieldAlert,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

/**
 * Shown to employees who registered with Google but still have no role.
 * As soon as a Super Admin assigns at least one role, the next refresh signs
 * them into the correct module automatically.
 */
export const PendingApprovalPage: React.FC = () => {
  const { currentUser, refreshCurrentUser, logout } = useApp();
  const [isChecking, setIsChecking] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'info' | 'error'; text: string } | null>(
    null
  );

  const checkStatus = async (silent = false) => {
    if (!silent) setIsChecking(true);
    try {
      const result = await refreshCurrentUser();
      if (result.success && !result.pending) {
        setFeedback({
          type: 'info',
          text: 'Função liberada! Carregando seu painel...',
        });
      } else if (!silent && result.message) {
        setFeedback({ type: 'error', text: result.message });
      }
    } finally {
      if (!silent) setIsChecking(false);
    }
  };

  useEffect(() => {
    const timer = window.setInterval(() => {
      void checkStatus(true);
    }, 20000);
    return () => window.clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-8 font-sans">
      <div className="w-full max-w-lg bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
        <div className="bg-gradient-to-r from-[#064e2e] via-[#075e38] to-emerald-700 p-6 sm:p-7 text-white">
          <div className="w-12 h-12 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center mb-4">
            <Clock className="w-6 h-6" />
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">
            Cadastro aguardando aprovação
          </h1>
          <p className="text-xs sm:text-sm text-emerald-50/90 mt-1.5 leading-relaxed">
            Sua conta foi criada com sucesso, mas a administração ainda precisa definir sua
            função e os módulos que você poderá acessar.
          </p>
        </div>

        <div className="p-6 sm:p-7 space-y-5 text-xs">
          <div className="flex items-center gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
            <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center overflow-hidden flex-shrink-0">
              {currentUser.avatarUrl ? (
                <img
                  src={currentUser.avatarUrl}
                  alt={currentUser.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                currentUser.name.charAt(0)
              )}
            </div>
            <div className="min-w-0">
              <p className="font-bold text-slate-900 truncate">{currentUser.name}</p>
              <p className="text-[11px] text-slate-500 font-mono truncate flex items-center gap-1.5">
                <Mail className="w-3 h-3" />
                {currentUser.email}
              </p>
            </div>
            <span className="ml-auto shrink-0 px-2 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
              Pendente
            </span>
          </div>

          <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-2.5 text-amber-900">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <p className="font-bold">O que acontece agora?</p>
              <p className="text-[11px] mt-0.5 text-amber-800">
                Um Super Admin vai revisar seu cadastro e atribuir sua função (Professor,
                Financeiro, Secretaria, Contabilidade, Recepção ou Administração). Você pode
                manter esta tela aberta: ela verifica automaticamente a cada 20 segundos.
              </p>
            </div>
          </div>

          {feedback && (
            <div
              className={`p-3 rounded-xl border flex items-center gap-2 font-semibold ${
                feedback.type === 'error'
                  ? 'bg-rose-50 border-rose-200 text-rose-700'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-800'
              }`}
            >
              {feedback.type === 'error' ? (
                <AlertCircle className="w-4 h-4 shrink-0" />
              ) : (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              )}
              <span>{feedback.text}</span>
            </div>
          )}

          <div className="space-y-2">
            <button
              type="button"
              onClick={() => void checkStatus(false)}
              disabled={isChecking}
              className="w-full py-3 px-5 bg-[#075e38] hover:bg-[#054a2c] disabled:opacity-70 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${isChecking ? 'animate-spin' : ''}`} />
              {isChecking ? 'Verificando...' : 'Verificar novamente'}
            </button>

            <button
              type="button"
              onClick={logout}
              className="w-full py-2.5 px-5 border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              Sair e usar outra conta
            </button>
          </div>

          <p className="text-center text-[11px] text-slate-400 leading-relaxed">
            Em caso de dúvidas, procure a administração da Think Green Platform informando o
            e-mail acima.
          </p>
        </div>
      </div>
    </div>
  );
};
