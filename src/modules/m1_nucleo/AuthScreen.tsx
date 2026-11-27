import { useState } from 'react';
import { supabase } from '../../config/supabase';
import { 
  Mail, 
  User, 
  ArrowRight, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2, 
  Loader2, 
  Layers,
  KeyRound,
  Eye,
  EyeOff
} from 'lucide-react';

interface AuthScreenProps {
  onAuthSuccess: (user: { id: string; email: string; nombreCompleto: string }) => void;
}

export function AuthScreen({ onAuthSuccess }: AuthScreenProps) {
  const [isLogin, setIsLogin] = useState<boolean>(true);
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [nombreCompleto, setNombreCompleto] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Validación de seguridad de contraseña
  const validatePassword = (pass: string): string | null => {
    if (pass.length < 8) return 'La contraseña debe tener al menos 8 caracteres.';
    if (!/[A-Z]/.test(pass)) return 'La contraseña debe incluir al menos una letra mayúscula.';
    if (!/[0-9]/.test(pass)) return 'La contraseña debe incluir al menos un número.';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsLoading(true);

    try {
      if (isLogin) {
        // 1. INICIAR SESIÓN CON SUPABASE AUTH
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password.trim()
        });

        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            throw new Error('Correo o contraseña incorrectos.');
          }
          if (error.message.includes('Email not confirmed')) {
            throw new Error('Por favor confirmá tu correo electrónico antes de ingresar.');
          }
          throw error;
        }

        if (data.user) {
          const nombre = data.user.user_metadata?.nombre_completo || data.user.email?.split('@')[0] || 'Usuario';
          onAuthSuccess({
            id: data.user.id,
            email: data.user.email || email,
            nombreCompleto: nombre
          });
        }
      } else {
        // 2. REGISTRO CON SUPABASE AUTH
        const passError = validatePassword(password);
        if (passError) throw new Error(passError);
        if (!nombreCompleto.trim()) throw new Error('Por favor ingresá tu nombre completo.');

        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password: password.trim(),
          options: {
            data: {
              nombre_completo: nombreCompleto.trim()
            }
          }
        });

        if (error) {
          if (error.message.includes('User already registered')) {
            throw new Error('Este correo ya se encuentra registrado. Por favor iniciá sesión.');
          }
          throw error;
        }

        if (data.user) {
          // Si Supabase tiene desactivada la confirmación de email, entra directo
          if (data.session) {
            onAuthSuccess({
              id: data.user.id,
              email: data.user.email || email,
              nombreCompleto: nombreCompleto.trim()
            });
          } else {
            setSuccessMessage('¡Cuenta creada con éxito! Si tenés confirmación de email activa, revisá tu casilla.');
            setIsLogin(true);
          }
        }
      }
    } catch (err: unknown) {
      const error = err as Error;
      setErrorMessage(error.message || 'Error al autenticar. Intentá nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

  // Acceso Rápido de Prueba (Dueño / Administrador) para testing sin demoras
  const handleDemoLogin = (rolNombre: string, emailDemo: string) => {
    onAuthSuccess({
      id: `usr_demo_${rolNombre.toLowerCase()}`,
      email: emailDemo,
      nombreCompleto: `${rolNombre} Campo360`
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md space-y-6">
        
        {/* Logo y Encabezado */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 mb-2 shadow-lg shadow-emerald-950/40">
            <Layers className="w-8 h-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Campo360
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-sm mx-auto">
            Plataforma Integral de Gestión Agropecuaria &bull; Acceso Seguro con Aislamiento RLS
          </p>
        </div>

        {/* Tarjeta de Formulario */}
        <div className="bg-slate-900 border border-emerald-900/50 rounded-2xl shadow-2xl p-6 sm:p-8 space-y-5">
          
          {/* Selector Login / Registro */}
          <div className="grid grid-cols-2 p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs font-bold">
            <button
              type="button"
              onClick={() => { setIsLogin(true); setErrorMessage(null); }}
              className={`py-2 rounded-lg transition-all ${
                isLogin ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20' : 'text-slate-400 hover:text-white'
              }`}
            >
              Iniciar Sesión
            </button>
            <button
              type="button"
              onClick={() => { setIsLogin(false); setErrorMessage(null); }}
              className={`py-2 rounded-lg transition-all ${
                !isLogin ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20' : 'text-slate-400 hover:text-white'
              }`}
            >
              Crear Cuenta
            </button>
          </div>

          {/* Mensajes de Alerta */}
          {errorMessage && (
            <div className="p-3 bg-red-950/70 border border-red-800 rounded-xl text-xs text-red-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 bg-emerald-950/70 border border-emerald-800 rounded-xl text-xs text-emerald-300 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">Nombre Completo *</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={nombreCompleto}
                    onChange={(e) => setNombreCompleto(e.target.value)}
                    placeholder="Ej. Juan Manuel Bordeu"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                    required={!isLogin}
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-300">Correo Electrónico *</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="productor@campo360.com"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-slate-300">Contraseña *</label>
                {isLogin && (
                  <span className="text-[11px] text-emerald-400/80 hover:text-emerald-300 cursor-pointer">
                    ¿Olvidaste tu clave?
                  </span>
                )}
              </div>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-10 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {!isLogin && (
                <span className="text-[10px] text-slate-500 block">
                  Mínimo 8 caracteres, una mayúscula y un número.
                </span>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs uppercase tracking-wider font-mono transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Procesando...</span>
                </>
              ) : (
                <>
                  <span>{isLogin ? 'Ingresar a Mi Campo' : 'Crear Cuenta Segura'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Separador */}
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-800"></div>
            </div>
            <div className="relative flex justify-center text-[10px] uppercase font-mono">
              <span className="bg-slate-900 px-2 text-slate-500">O ingresar como rol de prueba</span>
            </div>
          </div>

          {/* Accesos rápidos de prueba por rol */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleDemoLogin('Dueño / Administrador', 'dueno@campo360.com')}
              className="p-2 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-left transition-colors"
            >
              <span className="text-[11px] font-bold text-white block">Dueño</span>
              <span className="text-[9px] text-emerald-400 font-mono">Acceso total + balances</span>
            </button>

            <button
              type="button"
              onClick={() => handleDemoLogin('Capataz a Campo', 'capataz@campo360.com')}
              className="p-2 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-left transition-colors"
            >
              <span className="text-[11px] font-bold text-white block">Capataz</span>
              <span className="text-[9px] text-amber-400 font-mono">Costos 100% ocultos</span>
            </button>
          </div>

        </div>

        {/* Footer de Seguridad */}
        <div className="text-center text-[11px] text-slate-500 flex items-center justify-center gap-1.5 font-mono">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Autenticación Cifrada TLS 1.3 &bull; Supabase Auth JWT</span>
        </div>

      </div>
    </div>
  );
}
