import React, { useState } from 'react';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  HelpCircle,
  X,
  ShieldCheck,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const LoginPage: React.FC = () => {
  const { login } = useApp();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    setTimeout(() => {
      try {
        const result = login(identifier, password);
        if (!result.success) {
          setErrorMessage(result.message || 'Credenciais inválidas. Tente novamente.');
          setIsLoading(false);
        }
      } catch {
        setErrorMessage('Erro ao autenticar. Tente novamente.');
        setIsLoading(false);
      }
    }, 400);
  };

  return (
    <div className="relative min-h-screen w-full flex overflow-hidden font-sans bg-slate-950 select-none">
      {/* 
        Background Video (Untouched & Unfiltered):
        Left 50% contains the animated Think Garden brand presentation.
        Right 50% is the clean white area for the login form.
      */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none z-0"
      >
        <source src={`${import.meta.env.BASE_URL}login.mp4`} type="video/mp4" />
      </video>

      {/* 
        Responsive layout over the video:
        - Left 50% (hidden on small mobile or transparent) shows the animated video brand.
        - Right 50% hosts the login form placed directly over the white section.
      */}
      <div className="relative z-10 w-full min-h-screen grid grid-cols-1 lg:grid-cols-2">
        {/* Left half: Transparent space letting the video's left animation show completely */}
        <div className="hidden lg:block w-full h-full" />

        {/* Right half: Form positioned seamlessly on the white area */}
        <div className="w-full flex items-center justify-center p-6 sm:p-10 md:p-14 bg-white/95 lg:bg-transparent min-h-screen overflow-y-auto">
          <div className="w-full max-w-[420px] py-6 sm:py-8 flex flex-col justify-center">
            {/* Top Lock Badge */}
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center mx-auto text-[#075e38] shadow-xs mb-4">
              <Lock className="w-6 h-6 stroke-[2.2]" />
            </div>

            {/* Header Titles */}
            <div className="text-center mb-6">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Acesse sua conta
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-1.5 font-medium">
                Entre com suas credenciais para continuar
              </p>
            </div>

            {/* Error Alert */}
            {errorMessage && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-semibold flex items-center gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* E-mail ou usuário */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                  E-mail ou usuário
                </label>
                <div className="relative flex items-center">
                  <Mail className="w-5 h-5 text-slate-400 absolute left-3.5 pointer-events-none" />
                  <input
                    type="text"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="seu@email.com"
                    className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-[#075e38] focus:ring-2 focus:ring-[#075e38]/20 transition-all font-medium shadow-2xs"
                  />
                </div>
              </div>

              {/* Senha */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                  Senha
                </label>
                <div className="relative flex items-center">
                  <Lock className="w-5 h-5 text-slate-400 absolute left-3.5 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-11 pr-11 py-3 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-[#075e38] focus:ring-2 focus:ring-[#075e38]/20 transition-all font-medium shadow-2xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 text-slate-400 hover:text-slate-600 p-1 cursor-pointer transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Lembrar-me & Esqueci minha senha */}
              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 text-slate-600 cursor-pointer select-none font-medium">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded-sm border-slate-300 text-[#075e38] focus:ring-[#075e38] cursor-pointer"
                  />
                  <span>Lembrar-me</span>
                </label>

                <button
                  type="button"
                  onClick={() => setIsForgotModalOpen(true)}
                  className="text-[#075e38] hover:text-[#054a2c] font-bold hover:underline cursor-pointer"
                >
                  Esqueci minha senha
                </button>
              </div>

              {/* Botão Entrar na plataforma */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 px-6 bg-[#075e38] hover:bg-[#054a2c] active:scale-[0.99] disabled:opacity-75 text-white font-bold rounded-xl text-sm sm:text-base flex items-center justify-center gap-2 shadow-md shadow-emerald-950/20 transition-all cursor-pointer mt-2"
              >
                <span>{isLoading ? 'Acessando...' : 'Entrar na plataforma'}</span>
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </form>

            {/* Quick Demo Fill & Security Badge */}
            <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
              <span className="flex items-center gap-1.5 text-slate-400 font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-[#075e38]" />
                Ambiente Seguro SSL 256-bit
              </span>
              <button
                type="button"
                onClick={() => {
                  setIdentifier('admin@thinkgreen.org');
                  setPassword('admin123');
                }}
                className="text-[11px] font-bold text-[#075e38] hover:underline cursor-pointer"
                title="Preencher credencial de teste"
              >
                Preencher Demo
              </button>
            </div>

            {/* Copyright */}
            <div className="text-[11px] text-slate-400 text-center mt-6 space-y-0.5">
              <p>© 2026 Think Garden Platform</p>
              <p>Todos os direitos reservados.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Esqueci minha senha */}
      {isForgotModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-slate-200 text-left space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#075e38] flex items-center justify-center font-bold">
                  <HelpCircle className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-slate-900 text-sm">Recuperação de Senha</h3>
              </div>
              <button
                onClick={() => setIsForgotModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Para redefinir seu acesso à <strong>Think Garden Platform</strong>, entre em contato com a secretaria do centro comunitário ou utilize o e-mail institucional cadastrado.
            </p>

            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-1.5 text-xs">
              <span className="font-bold text-slate-800 block">Canais de Atendimento:</span>
              <p className="text-slate-600 font-mono">📧 secretaria@thinkgreen.org</p>
              <p className="text-slate-600 font-mono">📱 +20 10 9876 5432 (WhatsApp)</p>
            </div>

            <button
              onClick={() => setIsForgotModalOpen(false)}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl cursor-pointer"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
