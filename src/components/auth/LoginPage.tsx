import React, { useMemo, useState } from 'react';
import { AlertCircle, ArrowRight, Chrome, ShieldCheck, UserPlus } from 'lucide-react';
import { useApp } from '../../context/AppContext';

const isRegistrationLink = (): boolean => {
  if (typeof window === 'undefined') return false;
  const params = new URLSearchParams(window.location.search);
  const hash = window.location.hash.replace(/^#/, '');
  const hashParams = new URLSearchParams(hash);
  return (
    ['1', 'true', 'registro', 'register'].includes(
      (params.get('registro') || params.get('register') || '').toLowerCase()
    ) ||
    ['1', 'true', 'registro', 'register'].includes(
      (hashParams.get('registro') || hashParams.get('register') || '').toLowerCase()
    )
  );
};

export const LoginPage: React.FC = () => {
  const { loginWithGoogle } = useApp();

  const registrationMode = useMemo(isRegistrationLink, []);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    setErrorMessage(null);
    setIsLoading(true);
    try {
      const result = await loginWithGoogle({ register: registrationMode });
      if (!result.success) {
        setErrorMessage(result.message || 'Não foi possível entrar com o Google.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex overflow-hidden font-sans bg-slate-950 select-none">
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none z-0"
      >
        <source src={`${import.meta.env.BASE_URL}login.mp4`} type="video/mp4" />
      </video>

      <div className="relative z-10 w-full min-h-screen grid grid-cols-1 lg:grid-cols-2">
        <div className="hidden lg:block w-full h-full" />

        <div className="w-full flex items-center justify-center p-6 sm:p-10 md:p-14 bg-white/95 lg:bg-transparent min-h-screen overflow-y-auto">
          <div className="w-full max-w-[420px] py-6 sm:py-8 flex flex-col justify-center">
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto shadow-xs mb-4 border ${
                registrationMode
                  ? 'bg-purple-50 border-purple-100 text-purple-700'
                  : 'bg-emerald-50 border-emerald-100 text-[#075e38]'
              }`}
            >
              {registrationMode ? (
                <UserPlus className="w-6 h-6 stroke-[2.2]" />
              ) : (
                <ShieldCheck className="w-6 h-6 stroke-[2.2]" />
              )}
            </div>

            <div className="text-center mb-6">
              <span
                className={`inline-block mb-2 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                  registrationMode
                    ? 'bg-purple-50 text-purple-700 border-purple-200'
                    : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                }`}
              >
                {registrationMode ? 'Registro de Funcionário' : 'Acesso à Plataforma'}
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                {registrationMode ? 'Crie seu acesso' : 'Acesse sua conta'}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-1.5 font-medium leading-relaxed">
                {registrationMode
                  ? 'Use sua conta Google para enviar o cadastro. A administração definirá sua função e os módulos que você poderá acessar.'
                  : 'Entre com sua conta Google institucional para continuar.'}
              </p>
            </div>

            {errorMessage && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-semibold flex items-start gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                <span className="leading-relaxed">{errorMessage}</span>
              </div>
            )}

            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className={`w-full py-3.5 px-6 active:scale-[0.99] disabled:opacity-75 text-white font-bold rounded-xl text-sm sm:text-base flex items-center justify-center gap-2.5 shadow-md transition-all cursor-pointer ${
                registrationMode
                  ? 'bg-purple-700 hover:bg-purple-800 shadow-purple-950/20'
                  : 'bg-[#075e38] hover:bg-[#054a2c] shadow-emerald-950/20'
              }`}
            >
              <Chrome className="w-5 h-5" />
              <span>
                {isLoading
                  ? 'Conectando ao Google...'
                  : registrationMode
                  ? 'Registrar com Google'
                  : 'Entrar com Google'}
              </span>
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            <div className="mt-5 pt-4 border-t border-slate-100 text-[11px] text-slate-500 space-y-2">
              <p className="flex items-center justify-center gap-1.5 text-slate-400 font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-[#075e38]" />
                Autenticação segura via Google
              </p>
              {registrationMode ? (
                <p className="text-center leading-relaxed">
                  Após o registro, sua conta ficará <strong>aguardando aprovação</strong>. Assim que a
                  administração definir sua função, o acesso será liberado.
                </p>
              ) : (
                <p className="text-center leading-relaxed">
                  É funcionário e ainda não tem acesso? Solicite o{' '}
                  <strong>link de registro geral</strong> à administração.
                </p>
              )}
            </div>

            <div className="text-[11px] text-slate-400 text-center mt-6 space-y-0.5">
              <p>© 2026 Think Garden Platform</p>
              <p>Todos os direitos reservados.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
