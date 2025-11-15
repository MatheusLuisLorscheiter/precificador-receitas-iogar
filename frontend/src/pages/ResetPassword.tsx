import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { authAPI } from '../lib/apiClient';
import { Lock, CheckCircle, ArrowLeft, Eye, EyeOff } from 'lucide-react';

export default function ResetPassword() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const tenantSlug = searchParams.get('tenant'); // Pegar da URL em vez do localStorage

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        if (!token) {
            setError('Token de recuperação inválido ou expirado');
        }
        if (!tenantSlug) {
            setError('Identificador da empresa não encontrado na URL');
        }
    }, [token, tenantSlug]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('As senhas não coincidem');
            return;
        }

        if (password.length < 8) {
            setError('A senha deve ter pelo menos 8 caracteres');
            return;
        }

        if (!token) {
            setError('Token de recuperação inválido');
            return;
        }

        if (!tenantSlug) {
            setError('Faça login primeiro para identificar sua empresa');
            return;
        }

        setLoading(true);

        try {
            await authAPI.resetPassword(tenantSlug, token, password);
            setSuccess(true);
            setTimeout(() => {
                navigate('/login');
            }, 3000);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Erro ao redefinir senha');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="relative min-h-screen w-full bg-background px-4 py-10">
                <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(234,88,12,0.08),_transparent_45%)]" />
                <div className="mx-auto w-full max-w-md">
                    <div className="card space-y-6 text-center">
                        <div className="flex justify-center">
                            <CheckCircle size={64} className="text-success" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-semibold text-foreground">Senha Redefinida!</h1>
                            <p className="mt-2 text-sm text-muted">
                                Sua senha foi redefinida com sucesso. Você será redirecionado para a página de login...
                            </p>
                        </div>
                        <Link to="/login" className="btn btn-primary inline-flex w-full items-center justify-center gap-2">
                            <ArrowLeft size={18} />
                            Ir para Login
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="relative min-h-screen w-full bg-background px-4 py-10">
            <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(234,88,12,0.08),_transparent_45%)]" />

            <div className="mx-auto w-full max-w-md">
                <div className="card space-y-6">
                    <div className="text-center">
                        <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                            <Lock size={28} strokeWidth={2} />
                        </div>
                        <h1 className="mt-4 text-3xl font-semibold text-foreground">Redefinir Senha</h1>
                        <p className="mt-2 text-sm text-muted">Digite sua nova senha abaixo.</p>
                    </div>

                    {error && (
                        <div className="rounded-2xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm font-medium text-danger">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-2">
                            <label htmlFor="password" className="text-sm font-medium text-muted">
                                Nova Senha
                            </label>
                            <div className="relative">
                                <span className="pointer-events-none absolute inset-y-0 left-3 inline-flex items-center text-muted">
                                    <Lock size={16} />
                                </span>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    id="password"
                                    className="input pl-10 pr-10"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    minLength={8}
                                    placeholder="••••••••"
                                    autoComplete="new-password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-3 inline-flex items-center text-muted"
                                    aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                            <p className="text-xs text-muted">Mínimo de 8 caracteres</p>
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="confirmPassword" className="text-sm font-medium text-muted">
                                Confirmar Senha
                            </label>
                            <div className="relative">
                                <span className="pointer-events-none absolute inset-y-0 left-3 inline-flex items-center text-muted">
                                    <Lock size={16} />
                                </span>
                                <input
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    id="confirmPassword"
                                    className="input pl-10 pr-10"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    minLength={8}
                                    placeholder="••••••••"
                                    autoComplete="new-password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute inset-y-0 right-3 inline-flex items-center text-muted"
                                    aria-label={showConfirmPassword ? 'Ocultar senha' : 'Mostrar senha'}
                                >
                                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary w-full justify-center"
                            disabled={loading || !token}
                        >
                            {loading ? 'Redefinindo...' : 'Redefinir Senha'}
                        </button>
                    </form>

                    <div className="text-center text-sm">
                        <Link to="/login" className="inline-flex items-center gap-2 font-semibold text-primary">
                            <ArrowLeft size={16} />
                            Voltar para Login
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
