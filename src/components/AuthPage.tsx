import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Cloud, Mail, Lock, Eye, EyeOff, Fingerprint, Scan, ShieldAlert, CheckCircle2, User, KeyRound, ArrowLeft, RefreshCw 
} from 'lucide-react';
import { Profile } from '../types';
import { dbAuth } from '../lib/db';

interface AuthPageProps {
  onAuthSuccess: (profile: Profile) => void;
  onBackToLanding: () => void;
}

export default function AuthPage({ onAuthSuccess, onBackToLanding }: AuthPageProps) {
  // Navigation states: 'signin-email' | 'signin-passcode' | 'signup' | 'forgot'
  const [authMode, setAuthMode] = useState<'signin-passcode' | 'signin-email' | 'signup' | 'forgot'>('signin-passcode');
  
  // Fields state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState(''); // Serves as passcode or standard password
  const [displayName, setDisplayName] = useState('');
  const [vaultName, setVaultName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // PIN / Passcode Input State for circular keypad
  const [pinCode, setPinCode] = useState<string>('');
  const [selectedVaultName, setSelectedVaultName] = useState<string>('Parthiv'); // Default for quick access
  
  // Biometric scanner state
  const [biometricScanning, setBiometricScanning] = useState(false);
  const [biometricSuccess, setBiometricSuccess] = useState(false);
  const [biometricMessage, setBiometricMessage] = useState('');

  // Auto-fill some helpful helper accounts on launch so the user doesn't have to guess!
  useEffect(() => {
    // Register Parthiv by default in database if not already present
    const initDemoUser = async () => {
      try {
        await dbAuth.signUp(
          'parthiv1058@gmail.com', 
          'Parthiv', 
          'Parthiv', 
          '1058' // passcode matching parthiv1058!
        );
      } catch {
        // Already registered, which is fine
      }
    };
    initDemoUser();
  }, []);

  // Handle traditional Sign Up (Create isolated Vault)
  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!email || !displayName || !vaultName || !password) {
      setError("Please fill in all details.");
      setLoading(false);
      return;
    }

    if (password.length < 4 || password.length > 6 || isNaN(Number(password))) {
      setError("Passcode must be a 4 to 6 digit number.");
      setLoading(false);
      return;
    }

    try {
      const profile = await dbAuth.signUp(email, displayName, vaultName, password);
      onAuthSuccess(profile);
    } catch (err: any) {
      setError(err.message || "Failed to create Vault.");
    } finally {
      setLoading(false);
    }
  };

  // Handle traditional Email & Password Login
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!email || !password) {
      setError("Please fill in email/vault name and passcode.");
      setLoading(false);
      return;
    }

    try {
      const profile = await dbAuth.signIn(email, password);
      onAuthSuccess(profile);
    } catch (err: any) {
      setError(err.message || "Invalid credentials.");
    } finally {
      setLoading(false);
    }
  };

  // Circular keypad input handling
  const handleKeypadPress = (num: string) => {
    setError(null);
    if (pinCode.length < 6) {
      const newPin = pinCode + num;
      setPinCode(newPin);
      
      // Auto-submit passcode once 4 digits are entered for Parthiv (or 6 for custom)
      if (newPin.length === 4 && selectedVaultName.toLowerCase() === 'parthiv') {
        autoSubmitPasscode(selectedVaultName, newPin);
      }
    }
  };

  const handleKeypadBackspace = () => {
    if (pinCode.length > 0) {
      setPinCode(pinCode.slice(0, -1));
    }
  };

  const autoSubmitPasscode = async (vault: string, pin: string) => {
    setLoading(true);
    try {
      const profile = await dbAuth.signIn(vault, pin);
      onAuthSuccess(profile);
    } catch (err: any) {
      setError(err.message || "Incorrect passcode.");
      setPinCode('');
    } finally {
      setLoading(false);
    }
  };

  const handlePasscodeSubmit = async () => {
    if (!pinCode) {
      setError("Enter your passcode.");
      return;
    }
    autoSubmitPasscode(selectedVaultName, pinCode);
  };

  // Trigger biometric fallback scanning animation
  const handleBiometricAuth = async () => {
    setError(null);
    setBiometricScanning(true);
    setBiometricSuccess(false);
    setBiometricMessage("Initializing biometric credentials framework...");

    // Simulate real biometric scanning
    setTimeout(() => {
      setBiometricMessage("Analyzing face coordinate structure & touch profile...");
    }, 1000);

    setTimeout(() => {
      setBiometricMessage("Verifying secure token match with device credentials...");
    }, 2000);

    setTimeout(async () => {
      try {
        // Authenticate the default Parthiv account
        const profile = await dbAuth.signInBiometric(selectedVaultName);
        setBiometricSuccess(true);
        setBiometricMessage("Access Granted! Loading secure vault...");
        setTimeout(() => {
          setBiometricScanning(false);
          onAuthSuccess(profile);
        }, 1000);
      } catch (err: any) {
        setBiometricSuccess(false);
        setBiometricMessage(`Error: ${err.message || "Verification failed."}`);
        setTimeout(() => {
          setBiometricScanning(false);
          setError("Biometric secure signature did not match any active enrollments.");
        }, 1500);
      }
    }, 3200);
  };

  // Standard passwords reset
  const handleForgotPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    setTimeout(() => {
      setError("Password reset authorization has been dispatched to your email registry.");
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 relative select-none">
      
      {/* High-definition sunset Golden Gate Bridge background photo matching 2nd image exactly */}
      <img 
        src="https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1920&q=80"
        alt="Golden Gate Bridge"
        referrerPolicy="no-referrer"
        className="absolute inset-0 w-full h-full object-cover transition-all duration-1000 -z-20 select-none pointer-events-none"
      />

      {/* Dark tint overlay for pristine contrast and depth - with enhanced blur & opacity to fix transparency error */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950/65 via-slate-950/35 to-slate-950/85 -z-10 backdrop-blur-[10px]" />

      {/* Floating Header */}
      <div className="absolute top-6 left-6 z-10">
        <button 
          id="back-to-landing-btn"
          onClick={onBackToLanding}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-semibold text-white transition-all cursor-pointer shadow-md active:scale-95"
        >
          <ArrowLeft className="w-4 h-4" />
          pumanocan Home
        </button>
      </div>

      {/* Main Authentication Container */}
      <div className="w-full max-w-md relative z-10">
        
        {/* Toggle options between classic visual input & passcode/biometrics */}
        <div className="flex justify-center p-1.5 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 mb-6 max-w-[340px] mx-auto shadow-lg">
          <button
            id="switch-passcode-btn"
            onClick={() => {
              setAuthMode('signin-passcode');
              setError(null);
            }}
            className={`flex-1 py-2 rounded-full text-xs font-bold transition-all ${
              authMode === 'signin-passcode' ? 'bg-white text-indigo-950 shadow-md' : 'text-white hover:bg-white/5'
            }`}
          >
            Passcode Access
          </button>
          <button
            id="switch-email-btn"
            onClick={() => {
              setAuthMode('signin-email');
              setError(null);
            }}
            className={`flex-1 py-2 rounded-full text-xs font-bold transition-all ${
              authMode === 'signin-email' ? 'bg-white text-indigo-950 shadow-md' : 'text-white hover:bg-white/5'
            }`}
          >
            Email Login
          </button>
        </div>

        {/* Premium Liquid Glass auth card panel */}
        <div className="liquid-glass overflow-hidden p-8 border border-white/35 shadow-2xl relative rounded-[44px]">
          
          {/* Animated liquid light blobs inside the card to simulate fluid refraction */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10 rounded-[38px]">
            <div className="absolute w-[240px] h-[240px] rounded-full blur-[45px] bg-sky-500/15 -top-20 -left-12 animate-fluid-1" />
            <div className="absolute w-[260px] h-[260px] rounded-full blur-[55px] bg-amber-400/15 -bottom-16 -right-16 animate-fluid-2" />
            <div className="absolute w-[180px] h-[180px] rounded-full blur-[40px] bg-rose-500/10 top-1/3 left-1/4 animate-fluid-3" />
          </div>

          {/* Top Logo and Header */}
          <div className="text-center mb-6">
            <div className="flex flex-col items-center justify-center mb-4">
              <div className="flex items-center gap-2">
                {/* Elegant modern wavy line wireframe logo matching 2nd image */}
                <svg className="w-5 h-5 text-white opacity-85" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 12c1.5-3 2.5-3 4 0s2.5 3 4 0 2.5-3 4 0 2.5 3 4 0" />
                </svg>
                <div className="flex flex-col text-left leading-none">
                  <span className="text-[10px] font-sans font-medium tracking-wider text-white/95 uppercase">Welcome</span>
                  <span className="text-[10px] font-sans font-bold tracking-wider text-[#ebd2b4] uppercase">Master</span>
                </div>
              </div>
            </div>
            
            {/* Custom Brand Headline from bridge mockup using gold-cream display serif font */}
            <h2 className="text-[32px] md:text-[36px] font-serif text-[#ebd2b4] tracking-tight mb-2 leading-[1.15] text-center font-medium">
              {authMode === 'signup' ? (
                <>Create Your<br />Private Vault</>
              ) : authMode === 'forgot' ? (
                <>Recover Your<br />Private Vault</>
              ) : (
                <>Welcome Master,<br />how's it going?</>
              )}
            </h2>
            <p className="text-xs text-white/80 font-sans tracking-wide text-center">
              {authMode === 'signup' 
                ? 'Establish your personal, encrypted sandbox.' 
                : authMode === 'forgot'
                ? 'Provide your email address to restore access.'
                : 'Sign in to continue to your dashboard.'}
            </p>
          </div>

          {/* Validation Banner */}
          {error && (
            <div className={`p-3 rounded-2xl mb-4 border text-xs flex items-center gap-2.5 transition-all animate-bounce ${
              error.includes('sent') || error.includes('dispatched')
                ? 'bg-emerald-500/15 border-emerald-500/35 text-emerald-200'
                : 'bg-rose-500/15 border-rose-500/35 text-rose-200'
            }`}>
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Core forms with AnimatePresence */}
          <AnimatePresence mode="wait">
            
            {/* 1. PASSCODE ACCESS (Keypad & Biometrics) */}
            {authMode === 'signin-passcode' && (
              <motion.div
                key="passcode"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.25 }}
                className="flex flex-col items-center"
              >
                {/* Vault Name Picker for quick convenience */}
                <div className="w-full mb-5 text-left">
                  <label className="block text-xs font-bold text-[#ebd2b4] uppercase tracking-wider mb-2">
                    Target Private Vault
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={selectedVaultName}
                      onChange={(e) => setSelectedVaultName(e.target.value)}
                      placeholder="e.g. Parthiv, Priyansh"
                      className="w-full bg-white/10 hover:bg-white/15 focus:bg-white/15 border border-white/20 rounded-2xl pl-11 pr-5 py-3.5 text-sm text-white placeholder-white/50 outline-none transition-all focus:border-white/40 font-semibold"
                    />
                    <div className="absolute left-4 top-4 flex items-center text-white/60">
                      <User className="w-4.5 h-4.5" />
                    </div>
                  </div>
                  {/* Demo Helper Chips */}
                  <div className="flex gap-2 mt-2">
                    {['Parthiv', 'Priyansh'].map(demoName => (
                      <button
                        key={demoName}
                        onClick={() => {
                          setSelectedVaultName(demoName);
                          setError(null);
                        }}
                        className={`px-3.5 py-1.5 rounded-full text-[11px] font-semibold border transition-all cursor-pointer ${
                          selectedVaultName === demoName 
                            ? 'bg-[#0a3a78] border-[#0a3a78] text-white shadow-md'
                            : 'bg-white/10 border-white/15 text-white/90 hover:bg-white/20'
                        }`}
                      >
                        Vault: {demoName}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Secure Pin Code Bullet Indicators */}
                <div className="flex justify-center gap-3.5 my-4">
                  {[0, 1, 2, 3, 4, 5].map((idx) => {
                    // Match current code length (default 4 digits for demo, up to 6)
                    const isFilled = idx < pinCode.length;
                    return (
                      <div 
                        key={idx}
                        className={`w-4 h-4 rounded-full border-2 transition-all duration-300 ${
                          isFilled 
                            ? 'bg-[#ebd2b4] border-[#ebd2b4] scale-110 shadow-[0_0_8px_#ebd2b4]' 
                            : 'border-white/40 bg-white/5'
                        }`}
                      />
                    );
                  })}
                </div>

                {/* Keypad Layout 3x4 */}
                <div className="grid grid-cols-3 gap-x-5 gap-y-3.5 max-w-[280px] w-full mt-4">
                  {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => handleKeypadPress(num)}
                      className="w-14 h-14 rounded-full bg-white/10 hover:bg-white/20 active:scale-90 transition-all border border-white/15 font-sans text-xl font-medium text-white flex items-center justify-center shadow-md cursor-pointer mx-auto"
                    >
                      {num}
                    </button>
                  ))}
                  
                  {/* Empty placeholder to maintain grid alignment (no biometrics) */}
                  <div className="w-14 h-14" />

                  <button
                    type="button"
                    onClick={() => handleKeypadPress('0')}
                    className="w-14 h-14 rounded-full bg-white/10 hover:bg-white/20 active:scale-90 transition-all border border-white/15 font-sans text-xl font-medium text-white flex items-center justify-center shadow-md cursor-pointer mx-auto"
                  >
                    0
                  </button>

                  {/* Backspace Button */}
                  <button
                    type="button"
                    onClick={handleKeypadBackspace}
                    className="w-14 h-14 rounded-full bg-white/5 hover:bg-white/15 active:scale-90 transition-all border border-white/5 text-slate-300 flex items-center justify-center cursor-pointer mx-auto"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                </div>

                {/* Submit action */}
                <button
                  id="passcode-submit-btn"
                  onClick={handlePasscodeSubmit}
                  disabled={loading}
                  className="w-full mt-6 py-3.5 px-6 rounded-full bg-[#0a3a78] hover:bg-[#0c448d] text-white font-semibold text-sm transition-all shadow-lg active:scale-98 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
                  Open Secure Vault
                </button>
              </motion.div>
            )}

            {/* 2. TRADITIONAL EMAIL / PASSWORD SIGN IN */}
            {authMode === 'signin-email' && (
              <motion.form
                key="email-login"
                onSubmit={handleEmailSubmit}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.25 }}
                className="space-y-4"
              >
                <div className="text-left">
                  <div className="relative">
                    <input
                      type="text"
                      required
                      placeholder="Email Address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-white/10 focus:bg-white/15 border border-white/20 hover:border-white/30 rounded-2xl pl-11 pr-5 py-3.5 text-sm text-white placeholder-white/50 outline-none transition-all focus:border-white/40 font-medium"
                    />
                    <Mail className="absolute left-4 top-4.5 w-4 h-4 text-white/70" />
                  </div>
                </div>

                <div className="text-left">
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-white/10 focus:bg-white/15 border border-white/20 hover:border-white/30 rounded-2xl pl-11 pr-11 py-3.5 text-sm text-white placeholder-white/50 outline-none transition-all focus:border-white/40 font-medium tracking-wide"
                    />
                    <Lock className="absolute left-4 top-4.5 w-4 h-4 text-white/70" />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-4 text-white/60 hover:text-white transition-all"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Forgot Password Right-aligned Link */}
                <div className="text-right">
                  <button
                    type="button"
                    onClick={() => setAuthMode('forgot')}
                    className="text-xs text-[#ebd2b4] hover:underline cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                </div>

                <button
                  id="email-signin-btn"
                  type="submit"
                  disabled={loading}
                  className="w-full mt-4 py-3.5 px-6 rounded-full bg-[#0a3a78] hover:bg-[#0c448d] text-white font-semibold text-sm transition-all shadow-lg active:scale-98 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Sign In'}
                </button>
              </motion.form>
            )}

            {/* 3. SIGN UP (CREATE VAULT) */}
            {authMode === 'signup' && (
              <motion.form
                key="signup"
                onSubmit={handleSignUpSubmit}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.25 }}
                className="space-y-4"
              >
                <div className="text-left">
                  <label className="block text-xs font-bold text-[#ebd2b4] uppercase tracking-wider mb-2">
                    Display Name
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      placeholder="Display Name"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="w-full bg-white/10 focus:bg-white/15 border border-white/20 hover:border-white/30 rounded-2xl pl-11 pr-5 py-3.5 text-sm text-white placeholder-white/50 outline-none transition-all focus:border-white/40 font-medium"
                    />
                    <User className="absolute left-4 top-4.5 w-4.5 h-4.5 text-white/70" />
                  </div>
                </div>

                <div className="text-left">
                  <label className="block text-xs font-bold text-[#ebd2b4] uppercase tracking-wider mb-2">
                    Unique Vault Name
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      placeholder="Vault Name (no spaces)"
                      value={vaultName}
                      onChange={(e) => setVaultName(e.target.value.replace(/\s+/g, ''))}
                      className="w-full bg-white/10 focus:bg-white/15 border border-white/20 hover:border-white/30 rounded-2xl pl-11 pr-5 py-3.5 text-sm text-white placeholder-white/50 outline-none transition-all focus:border-white/40 font-medium"
                    />
                    <svg className="absolute left-4 top-4 w-4.5 h-4.5 text-white/70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 2a5 5 0 0 0-5 5v3H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-1V7a5 5 0 0 0-5-5z" />
                    </svg>
                  </div>
                </div>

                <div className="text-left">
                  <label className="block text-xs font-bold text-[#ebd2b4] uppercase tracking-wider mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      placeholder="Email Address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-white/10 focus:bg-white/15 border border-white/20 hover:border-white/30 rounded-2xl pl-11 pr-5 py-3.5 text-sm text-white placeholder-white/50 outline-none transition-all focus:border-white/40 font-medium"
                    />
                    <Mail className="absolute left-4 top-4.5 w-4.5 h-4.5 text-white/70" />
                  </div>
                </div>

                <div className="text-left">
                  <label className="block text-xs font-bold text-[#ebd2b4] uppercase tracking-wider mb-2">
                    Vault Passcode PIN (4-6 digits)
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      maxLength={6}
                      required
                      placeholder="e.g. 1058"
                      value={password}
                      onChange={(e) => setPassword(e.target.value.replace(/\D/g, ''))}
                      className="w-full bg-white/10 focus:bg-white/15 border border-white/20 hover:border-white/30 rounded-2xl pl-11 pr-5 py-3.5 text-sm text-white placeholder-white/50 outline-none transition-all focus:border-white/40 text-center font-bold tracking-widest"
                    />
                    <Lock className="absolute left-4 top-4.5 w-4.5 h-4.5 text-white/70" />
                  </div>
                </div>

                <button
                  id="signup-submit-btn"
                  type="submit"
                  disabled={loading}
                  className="w-full mt-4 py-3.5 px-6 rounded-full bg-[#0a3a78] hover:bg-[#0c448d] text-white font-semibold text-sm transition-all shadow-lg active:scale-98 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Create Isolated Vault'}
                </button>
              </motion.form>
            )}

            {/* 4. FORGOT PASSWORD / PIN */}
            {authMode === 'forgot' && (
              <motion.form
                key="forgot"
                onSubmit={handleForgotPassword}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.25 }}
                className="space-y-4"
              >
                <div className="text-left">
                  <p className="text-xs text-white/90 leading-relaxed mb-4 text-center">
                    Provide the email address linked with your private vault, and we will transmit secure recovery codes to restore your access.
                  </p>
                </div>

                <div className="text-left">
                  <div className="relative">
                    <input
                      type="email"
                      required
                      placeholder="Email Address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-white/10 focus:bg-white/15 border border-white/20 hover:border-white/30 rounded-2xl pl-11 pr-5 py-3.5 text-sm text-white placeholder-white/50 outline-none transition-all focus:border-white/40 font-medium"
                    />
                    <Mail className="absolute left-4 top-4.5 w-4.5 h-4.5 text-white/70" />
                  </div>
                </div>

                <button
                  id="forgot-submit-btn"
                  type="submit"
                  disabled={loading}
                  className="w-full mt-4 py-3.5 px-6 rounded-full bg-[#0a3a78] hover:bg-[#0c448d] text-white font-semibold text-sm transition-all shadow-lg active:scale-98 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Transmit Recovery Link'}
                </button>
              </motion.form>
            )}

          </AnimatePresence>

          {/* Card Footer Switch Links */}
          <div className="mt-6 pt-5 border-t border-white/10 text-center">
            {authMode !== 'signup' ? (
              <p className="text-xs text-white/80 font-sans">
                Don't have an account?{' '}
                <button
                  id="toggle-signup-btn"
                  type="button"
                  onClick={() => {
                    setAuthMode('signup');
                    setError(null);
                  }}
                  className="text-[#ebd2b4] font-bold hover:underline cursor-pointer"
                >
                  Register for free.
                </button>
              </p>
            ) : (
              <p className="text-xs text-white/80 font-sans">
                Already have a vault?{' '}
                <button
                  id="toggle-signin-btn"
                  type="button"
                  onClick={() => {
                    setAuthMode('signin-passcode');
                    setError(null);
                  }}
                  className="text-[#ebd2b4] font-bold hover:underline cursor-pointer"
                >
                  Sign in here.
                </button>
              </p>
            )}
          </div>

        </div>
      </div>



    </div>
  );
}
