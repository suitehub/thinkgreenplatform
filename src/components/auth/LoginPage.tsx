import React, { useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  Briefcase,
  CalendarDays,
  CheckCircle2,
  Chrome,
  Eye,
  EyeOff,
  GraduationCap,
  Hash,
  Lock,
  Mail,
  ShieldCheck,
  User,
  UserPlus,
} from 'lucide-react';
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

type LoginPortal = 'student' | 'employee';
type LoginMethod = 'google' | 'email';
type LoadingAction = 'google' | 'email' | 'reset' | 'student' | null;

export const LoginPage: React.FC = () => {
  const { loginWithGoogle, loginWithEmail, sendPasswordReset, loginAsStudent } = useApp();

  const [registrationMode, setRegistrationMode] = useState<boolean>(() => isRegistrationLink());
  const [portal, setPortal] = useState<LoginPortal>('employee');
  const [method, setMethod] = useState<LoginMethod>('google');
  const [loadingAction, setLoadingAction] = useState<LoadingAction>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  // Employee credentials
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Student credentials
  const [studentId, setStudentId] = useState('');
  const [birthDate, setBirthDate] = useState('');

  const isLoading = loadingAction !== null;
  const isStudentPortal = portal === 'student' && !registrationMode;

  const clearMessages = () => {
    setErrorMessage(null);
    setInfoMessage(null);
  };

  const switchPortal = (nextPortal: LoginPortal) => {
    clearMessages();
    setPortal(nextPortal);
  };

  const handleGoogleLogin = async () => {
    clearMessages();
    setLoadingAction('google');
    try {
      const result = await loginWithGoogle({ register: registrationMode });
      if (!result.success) {
        setErrorMessage(result.message || 'Could not sign in with Google.');
      }
    } finally {
      setLoadingAction(null);
    }
  };

  const handleEmailSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    clearMessages();

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      setErrorMessage('Enter your email.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setErrorMessage('Enter a valid email address.');
      return;
    }
    if (!password) {
      setErrorMessage('Enter your password.');
      return;
    }
    if (password.length < 6) {
      setErrorMessage('The password must be at least 6 characters long.');
      return;
    }
    if (registrationMode) {
      if (!name.trim()) {
        setErrorMessage('Enter your full name.');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMessage('The passwords do not match. Check both fields.');
        return;
      }
    }

    setLoadingAction('email');
    try {
      const result = await loginWithEmail({
        email: cleanEmail,
        password,
        name: name.trim(),
        register: registrationMode,
      });

      if (!result.success) {
        setErrorMessage(result.message || 'Could not complete sign in.');
      }
    } finally {
      setLoadingAction(null);
    }
  };

  const handlePasswordReset = async () => {
    clearMessages();

    if (!email.trim()) {
      setErrorMessage('Enter your email to receive the reset link.');
      return;
    }

    setLoadingAction('reset');
    try {
      const result = await sendPasswordReset(email);
      if (result.success) {
        setInfoMessage(result.message);
      } else {
        setErrorMessage(result.message);
      }
    } finally {
      setLoadingAction(null);
    }
  };

  const handleStudentSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    clearMessages();

    if (!studentId.trim()) {
      setErrorMessage('Enter your Student ID.');
      return;
    }
    if (!birthDate) {
      setErrorMessage('Enter your date of birth.');
      return;
    }

    setLoadingAction('student');
    try {
      const result = loginAsStudent({ studentId, birthDate });
      if (!result.success) {
        setErrorMessage(result.message || 'Could not sign in with the provided details.');
      }
    } finally {
      setLoadingAction(null);
    }
  };

  const heroBadge = registrationMode
    ? 'Employee Registration'
    : isStudentPortal
    ? 'Student Portal'
    : 'Platform Sign In';

  const heroTitle = registrationMode ? 'Create your account' : 'Sign in to your account';

  const heroDescription = registrationMode
    ? 'Create your account with Google or email and password. Administration will define your role and the modules you can access.'
    : isStudentPortal
    ? 'Sign in with your Student ID and date of birth.'
    : 'Sign in with Google or email and password to continue.';

  return (
    <div className="relative min-h-screen w-full flex overflow-hidden font-sans bg-slate-950 select-none">
      {/* Mobile: full-screen background with blurred video */}
      <video
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        aria-hidden="true"
        className="lg:hidden fixed inset-0 w-full h-full object-cover object-center scale-110 blur-lg opacity-70 pointer-events-none z-0"
      >
        <source src={`${import.meta.env.BASE_URL}login.mp4`} type="video/mp4" />
      </video>

      {/* Mobile: full video, centered with slight blur (welcome visible without cropping) */}
      <video
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        className="lg:hidden fixed inset-0 w-full h-full object-contain object-center blur-[2px] pointer-events-none z-0"
      >
        <source src={`${import.meta.env.BASE_URL}login.mp4`} type="video/mp4" />
      </video>

      {/* Desktop: video covering the background */}
      <video
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        className="hidden lg:block fixed inset-0 w-full h-full object-cover object-center pointer-events-none z-0"
      >
        <source src={`${import.meta.env.BASE_URL}login.mp4`} type="video/mp4" />
      </video>

      {/* Light darkening on mobile so the video stays visible behind the login card */}
      <div className="fixed inset-0 z-0 bg-slate-950/20 lg:bg-transparent pointer-events-none" />

      <div className="relative z-10 w-full min-h-screen grid grid-cols-1 lg:grid-cols-2">
        <div className="hidden lg:block w-full h-full" />

        <div className="w-full flex items-center justify-center p-4 sm:p-10 md:p-14 bg-transparent min-h-screen overflow-y-auto">
          <div className="w-full max-w-[420px] py-6 sm:py-8 flex flex-col justify-center bg-white/70 backdrop-blur-xl rounded-3xl px-5 shadow-2xl sm:px-7 lg:bg-transparent lg:backdrop-blur-none lg:rounded-none lg:px-0 lg:py-8 lg:shadow-none">
            {registrationMode ? (
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto shadow-xs mb-4 border bg-purple-50 border-purple-100 text-purple-700">
                <UserPlus className="w-6 h-6 stroke-[2.2]" />
              </div>
            ) : (
              <img
                src={`${import.meta.env.BASE_URL}TGCCLOGO.png`}
                alt="Think Green Platform"
                className="h-16 w-auto object-contain mx-auto mb-4 drop-shadow-sm"
              />
            )}

            <div className="text-center mb-5">
              <span
                className={`inline-block mb-2 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                  registrationMode
                    ? 'bg-purple-50 text-purple-700 border-purple-200'
                    : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                }`}
              >
                {heroBadge}
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                {heroTitle}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-1.5 font-medium leading-relaxed">
                {heroDescription}
              </p>
            </div>

            {errorMessage && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-semibold flex items-start gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                <span className="leading-relaxed">{errorMessage}</span>
              </div>
            )}

            {infoMessage && (
              <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-semibold flex items-start gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
                <span className="leading-relaxed">{infoMessage}</span>
              </div>
            )}

            {/* Portal tabs: Students / Employees */}
            {!registrationMode && (
              <div className="grid grid-cols-2 gap-1.5 p-1.5 bg-slate-100/90 rounded-xl mb-4">
                <button
                  type="button"
                  onClick={() => switchPortal('student')}
                  className={`flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    portal === 'student'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <GraduationCap className="w-4 h-4" />
                  Students
                </button>
                <button
                  type="button"
                  onClick={() => switchPortal('employee')}
                  className={`flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    portal === 'employee'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Briefcase className="w-4 h-4" />
                  Employees
                </button>
              </div>
            )}

            {isStudentPortal ? (
              <form onSubmit={handleStudentSubmit} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1" htmlFor="student-id">
                    Student ID
                  </label>
                  <div className="relative">
                    <Hash className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="student-id"
                      type="text"
                      value={studentId}
                      onChange={(event) => setStudentId(event.target.value.toUpperCase())}
                      placeholder="STU00000"
                      autoComplete="username"
                      autoCapitalize="characters"
                      spellCheck={false}
                      disabled={isLoading}
                      className="w-full pl-10 pr-3.5 py-3 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 uppercase placeholder:text-slate-400 placeholder:normal-case focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1" htmlFor="student-birth-date">
                    Date of birth
                  </label>
                  <div className="relative">
                    <CalendarDays className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="student-birth-date"
                      type="date"
                      value={birthDate}
                      onChange={(event) => setBirthDate(event.target.value)}
                      autoComplete="bday"
                      disabled={isLoading}
                      className="w-full pl-10 pr-3.5 py-3 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 px-6 active:scale-[0.99] disabled:opacity-75 text-white font-bold rounded-xl text-sm sm:text-base flex items-center justify-center gap-2.5 shadow-md transition-all cursor-pointer bg-[#075e38] hover:bg-[#054a2c] shadow-emerald-950/20"
                >
                  {loadingAction === 'student' ? (
                    <span>Verifying details...</span>
                  ) : (
                    <span>Sign in as student</span>
                  )}
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>

                <div className="mt-1 p-3 bg-sky-50 border border-sky-100 rounded-xl text-[11px] text-sky-800 leading-relaxed">
                  Use the <strong>Student ID</strong> provided by the Registrar's Office (e.g. STU00186) and the
                  <strong> date of birth</strong> registered in your record. If you don't remember it or
                  your details are incorrect, contact the Registrar's Office.
                </div>
              </form>
            ) : (
              <>
                {/* Method selector */}
                <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100/90 rounded-xl mb-4">
                  <button
                    type="button"
                    onClick={() => {
                      clearMessages();
                      setMethod('google');
                    }}
                    className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      method === 'google'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <Chrome className="w-3.5 h-3.5" />
                    Google
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      clearMessages();
                      setMethod('email');
                    }}
                    className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      method === 'email'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <Mail className="w-3.5 h-3.5" />
                    Email and password
                  </button>
                </div>

                {method === 'google' ? (
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
                      {loadingAction === 'google'
                        ? 'Connecting to Google...'
                        : registrationMode
                        ? 'Register with Google'
                        : 'Sign in with Google'}
                    </span>
                    <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                ) : (
                  <form onSubmit={handleEmailSubmit} className="space-y-3">
                    {registrationMode && (
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1" htmlFor="login-name">
                          Full name
                        </label>
                        <div className="relative">
                          <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                          <input
                            id="login-name"
                            type="text"
                            value={name}
                            onChange={(event) => setName(event.target.value)}
                            placeholder="Your full name"
                            autoComplete="name"
                            disabled={isLoading}
                            className="w-full pl-10 pr-3.5 py-3 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
                          />
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1" htmlFor="login-email">
                        Email
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          id="login-email"
                          type="email"
                          value={email}
                          onChange={(event) => setEmail(event.target.value)}
                          placeholder="youremail@example.com"
                          autoComplete="email"
                          disabled={isLoading}
                          className="w-full pl-10 pr-3.5 py-3 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1" htmlFor="login-password">
                        Password
                      </label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          id="login-password"
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(event) => setPassword(event.target.value)}
                          placeholder="Your password"
                          autoComplete={registrationMode ? 'new-password' : 'current-password'}
                          disabled={isLoading}
                          className="w-full pl-10 pr-11 py-3 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((visible) => !visible)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                          title={showPassword ? 'Hide password' : 'Show password'}
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {registrationMode && (
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1" htmlFor="login-confirm">
                          Confirm password
                        </label>
                        <div className="relative">
                          <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                          <input
                            id="login-confirm"
                            type={showPassword ? 'text' : 'password'}
                            value={confirmPassword}
                            onChange={(event) => setConfirmPassword(event.target.value)}
                            placeholder="Repeat the password"
                            autoComplete="new-password"
                            disabled={isLoading}
                            className="w-full pl-10 pr-3.5 py-3 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
                          />
                        </div>
                      </div>
                    )}

                    {!registrationMode && (
                      <button
                        type="button"
                        onClick={handlePasswordReset}
                        disabled={isLoading}
                        className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 disabled:opacity-60 transition-colors cursor-pointer"
                      >
                        {loadingAction === 'reset' ? 'Sending link...' : 'Forgot my password'}
                      </button>
                    )}

                    <button
                      type="submit"
                      disabled={isLoading}
                      className={`w-full py-3.5 px-6 active:scale-[0.99] disabled:opacity-75 text-white font-bold rounded-xl text-sm sm:text-base flex items-center justify-center gap-2.5 shadow-md transition-all cursor-pointer ${
                        registrationMode
                          ? 'bg-purple-700 hover:bg-purple-800 shadow-purple-950/20'
                          : 'bg-[#075e38] hover:bg-[#054a2c] shadow-emerald-950/20'
                      }`}
                    >
                      {registrationMode ? <UserPlus className="w-5 h-5" /> : <ArrowRight className="w-5 h-5" />}
                      <span>
                        {loadingAction === 'email'
                          ? 'Processing...'
                          : registrationMode
                          ? 'Create account with email'
                          : 'Sign in with email'}
                      </span>
                    </button>
                  </form>
                )}
              </>
            )}

            <div className="mt-5 pt-4 border-t border-slate-100 text-[11px] text-slate-500 space-y-2">
              <p className="flex items-center justify-center gap-1.5 text-slate-400 font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-[#075e38]" />
                {isStudentPortal
                  ? 'Student access validated against the Registrar\'s Office records'
                  : 'Secure authentication via Firebase'}
              </p>
              {registrationMode ? (
                <p className="text-center leading-relaxed">
                  After registering, your account will be <strong>awaiting approval</strong>. As soon as
                  administration assigns your role, access will be granted.{' '}
                  <button
                    type="button"
                    onClick={() => {
                      clearMessages();
                      setRegistrationMode(false);
                      setPortal('employee');
                    }}
                    className="font-bold text-emerald-700 hover:text-emerald-900 cursor-pointer"
                  >
                    I already have an account
                  </button>
                </p>
              ) : isStudentPortal ? (
                <p className="text-center leading-relaxed">
                  Are you an employee? Use the <strong>Employees</strong> tab to sign in with Google or
                  email and password.
                </p>
              ) : (
                <p className="text-center leading-relaxed">
                  Are you an employee without access yet? Request the{' '}
                  <strong>general registration link</strong> from administration.
                </p>
              )}
            </div>

            <div className="text-[11px] text-slate-400 text-center mt-6 space-y-0.5">
              <p>© 2026 Think Garden Platform</p>
              <p>All rights reserved.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
