import { useState } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { DollarSign, ShieldAlert, ArrowRight, Loader2 } from 'lucide-react';

export function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Preencha os dados.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError('Email ou senha inválidos.');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('Este email já está em uso.');
      } else {
        setError('Erro ao autenticar. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0c10] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#10b981]/10 text-[#10b981] mb-4 shadow-[0_0_20px_rgba(16,185,129,0.15)]">
            <DollarSign className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Gestão de Vendas <span className="text-[#f59e0b]">Pro</span></h1>
          <p className="text-[#8b92a5] font-mono text-sm">Controle de Capital Inteligente</p>
        </div>

        <div className="surface-card p-6 rounded-2xl shadow-xl border border-[#ffffff10]">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-[#ef4444]/10 border border-[#ef4444]/20 p-3 rounded-lg flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 text-[#ef4444] mt-0.5 shrink-0" />
                <p className="text-sm font-medium text-[#ef4444]">{error}</p>
              </div>
            )}
            
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#8b92a5] uppercase tracking-wider">Email</label>
              <input 
                type="email" 
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="input-dark w-full h-11 text-base placeholder:text-[#4b5563]"
                placeholder="seu@dominio.com"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#8b92a5] uppercase tracking-wider">Senha Secreta</label>
              <input 
                type="password" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="input-dark w-full h-11 text-base placeholder:text-[#4b5563]"
                placeholder="••••••••"
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full h-11 mt-4 bg-[#10b981] hover:bg-[#059669] text-white rounded-lg flex items-center justify-center gap-2 font-semibold transition-all disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                <>
                  {isLogin ? 'Desbloquear Cofre' : 'Criar Cofre'} <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button 
              type="button"
              onClick={() => { setIsLogin(!isLogin); setError(''); }}
              className="text-xs text-[#8b92a5] hover:text-white transition-colors"
            >
              {isLogin ? 'Não tem acesso? Registre-se agora' : 'Já tem um cofre? Faça login'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
