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
        const passError = validatePassword(password);
        if (passError) throw new Error(passError);
        if (!nombreCompleto.trim()) throw new Error('Por favor ingresá tu nombre completo.');

        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password: password.trim(),
          options: {
            data: { nombre_completo: nombreCompleto.trim() }
          }
        });

        if (error) {
          if (error.message.includes('User already registered')) {
            throw new Error('Este correo ya se encuentra registrado. Por favor iniciá sesión.');
          }
          throw error;
        }

        if (data.user) {
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

  const handleDemoLogin = (rolNombre: string, emailDemo: string) => {
    onAuthSuccess({
      id: `usr_demo_${rolNombre.toLowerCase().replace(/[^a-z]/g, '')}`,
      email: emailDemo,
      nombreCompleto: `${rolNombre} Landa360`
    });
  };

  return (
    <div className="min-h-screen bg-campo-blanco flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md space-y-6">
        
        {/* Logo y Encabezado */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-campo-bosque text-white mb-2 shadow-md">
            <Layers className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-extrabold text-campo-texto tracking-tight">
            Landa360
          </h1>
          <p className="text-xs sm:text-sm text-campo-muted max-w-sm mx-auto">
            Plataforma Integral de Gestión Agropecuaria &bull; Acceso Seguro con Aislamiento RLS
          </p>
        </div>

        {/* Tarjeta de Formulario en Blanco Puro con borde Arena */}
        <div className="bg-campo-card border border-campo-borde rounded-3xl shadow-sm p-6 sm:p-8 space-y-5">
          
          {/* Selector Login / Registro */}
          <div className="grid grid-cols-2 p-1 bg-campo-arena rounded-xl border border-campo-borde text-xs font-bold">
            <button
              type="button"
              onClick={() => { setIsLogin(true); setErrorMessage(null); }}
              className={`py-2 rounded-lg transition-all ${
                isLogin ? 'bg-campo-card text-campo-texto shadow-sm' : 'text-campo-muted hover:text-campo-texto'
              }`}
            >
              Iniciar Sesión
            </button>
            <button
              type="button"
              onClick={() => { setIsLogin(false); setErrorMessage(null); }}
              className={`py-2 rounded-lg transition-all ${
                !isLogin ? 'bg-campo-card text-campo-texto shadow-sm' : 'text-campo-muted hover:text-campo-texto'
              }`}
            >
              Crear Cuenta
            </button>
          </div>

          {/* Mensajes de Alerta */}
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-campo-error/30 rounded-xl text-xs text-campo-error flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-campo-error shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 bg-emerald-50 border border-campo-exito/30 rounded-xl text-xs text-campo-exito flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-campo-exito shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-1">
                <label className="text-xs font-medium text-campo-texto">Nombre Completo *</label>
                <div className="relative">
                  <User className="w-4 h-4 text-campo-muted absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={nombreCompleto}
                    onChange={(e) => setNombreCompleto(e.target.value)}
                    placeholder="Ej. Juan Manuel Bordeu"
                    className="w-full bg-campo-blanco border border-campo-borde rounded-xl pl-9 pr-3 py-2 text-xs text-campo-texto focus:outline-none focus:border-campo-verde"
                    required={!isLogin}
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-medium text-campo-texto">Correo Electrónico *</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-campo-muted absolute left-3 top-2.5" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="productor@landa360.com"
                  className="w-full bg-campo-blanco border border-campo-borde rounded-xl pl-9 pr-3 py-2 text-xs text-campo-texto focus:outline-none focus:border-campo-verde"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-campo-texto">Contraseña *</label>
                {isLogin && (
                  <span className="text-[11px] text-campo-oliva hover:underline cursor-pointer">
                    ¿Olvidaste tu clave?
                  </span>
                )}
              </div>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-campo-muted absolute left-3 top-2.5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-campo-blanco border border-campo-borde rounded-xl pl-9 pr-10 py-2 text-xs text-campo-texto focus:outline-none focus:border-campo-verde font-mono"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-campo-muted hover:text-campo-texto"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {!isLogin && (
                <span className="text-[10px] text-campo-muted block">
                  Mínimo 8 caracteres, una mayúscula y un número.
                </span>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-campo-verde hover:bg-campo-oliva text-white font-bold text-xs uppercase tracking-wider font-mono transition-all shadow-sm disabled:opacity-50"
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
              <div className="w-full border-t border-campo-borde"></div>
            </div>
            <div className="relative flex justify-center text-[10px] uppercase font-mono">
              <span className="bg-campo-card px-2 text-campo-muted">O ingresar como rol de prueba</span>
            </div>
          </div>

          {/* Accesos rápidos de prueba por rol */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleDemoLogin('Dueño / Administrador', 'dueno@landa360.com')}
              className="p-2.5 rounded-xl bg-campo-blanco hover:bg-campo-arena border border-campo-borde text-left transition-colors"
            >
              <span className="text-[11px] font-bold text-campo-texto block">Dueño</span>
              <span className="text-[10px] text-campo-oliva font-mono">Acceso total + balances</span>
            </button>

            <button
              type="button"
              onClick={() => handleDemoLogin('Capataz a Campo', 'capataz@landa360.com')}
              className="p-2.5 rounded-xl bg-campo-blanco hover:bg-campo-arena border border-campo-borde text-left transition-colors"
            >
              <span className="text-[11px] font-bold text-campo-texto block">Capataz</span>
              <span className="text-[10px] text-campo-alerta font-mono">Costos 100% ocultos</span>
            </button>
          </div>

        </div>

        {/* Footer de Seguridad */}
        <div className="text-center text-[11px] text-campo-muted flex items-center justify-center gap-1.5 font-mono">
          <ShieldCheck className="w-3.5 h-3.5 text-campo-verde" />
          <span>Autenticación Cifrada TLS 1.3 &bull; Supabase Auth JWT</span>
        </div>

      </div>
    </div>
  );
}
