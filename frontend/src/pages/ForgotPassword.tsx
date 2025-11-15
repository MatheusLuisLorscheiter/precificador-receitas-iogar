import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { authAPI } from '../lib/apiClient';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import { Mail, ArrowLeft, Send, Building2, Sun, Moon } from 'lucide-react';

export default function ForgotPassword() {
    const { tenantSlug: savedSlug } = useAuthStore();
    const { theme, toggleTheme } = useThemeStore();
    const [tenantSlug, setTenantSlug] = useState('');
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);

    // Auto-preencher com último slug usado
    useEffect(() => {
        if (savedSlug) {
            setTenantSlug(savedSlug);
        }
    }, [savedSlug]);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!tenantSlug) {
            setError('Faça login primeiro para identificar sua empresa');
            return;
        }

        setLoading(true);

        try {
            await authAPI.requestPasswordReset(tenantSlug, email);
            setSuccess(true);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Erro ao solicitar recuperação de senha');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="relative min-h-screen w-full bg-background px-4 py-10">
                <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(234,88,12,0.08),_transparent_45%)]" />

                {/* Theme Toggle */}
                <button
                    onClick={toggleTheme}
                    className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-2xl border border-border bg-card text-muted transition-all hover:-translate-y-0.5 hover:text-foreground"
                    title={theme === 'light' ? 'Modo escuro' : 'Modo claro'}
                >
                    {theme === 'light' ? <Moon size={18} strokeWidth={2} /> : <Sun size={18} strokeWidth={2} />}
                </button>

                <div className="mx-auto w-full max-w-md">
                    <div className="card space-y-6 text-center">
                        <div className="mb-4 flex justify-center">
                            <Mail size={64} className="text-primary" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-semibold text-foreground">
                                Email Enviado!
                            </h1>
                            <p className="mt-4 text-sm text-muted">
                                Enviamos um link de recuperação para <strong className="text-foreground">{email}</strong>.
                                Verifique sua caixa de entrada e spam.
                            </p>
                        </div>
                        <Link
                            to="/login"
                            className="btn btn-primary w-full justify-center gap-2"
                        >
                            <ArrowLeft size={18} />
                            Voltar para Login
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="relative min-h-screen w-full bg-background px-4 py-10">
            <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(234,88,12,0.08),_transparent_45%)]" />

            {/* Theme Toggle */}
            <button
                onClick={toggleTheme}
                className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-2xl border border-border bg-card text-muted transition-all hover:-translate-y-0.5 hover:text-foreground"
                title={theme === 'light' ? 'Modo escuro' : 'Modo claro'}
            >
                {theme === 'light' ? <Moon size={18} strokeWidth={2} /> : <Sun size={18} strokeWidth={2} />}
            </button>

            <div className="mx-auto w-full max-w-md">
                <div className="card space-y-6">
                    <div className="text-center">
                        <p className="text-xs font-semibold uppercase tracking-[0.4em] text-muted">Recuperação</p>
                        <h1 className="mt-2 text-3xl font-semibold text-foreground">
                            Recuperar Senha
                        </h1>
                        <p className="mt-2 text-sm text-muted">
                            Digite seu email e enviaremos um link para redefinir sua senha.
                        </p>
                    </div>

                    {error && (
                        <div className="rounded-2xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm font-medium text-danger">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-2">
                            <label htmlFor="tenantSlug" className="text-sm font-medium text-muted">
                                Empresa (slug)
                            </label>
                            <div className="relative">
                                <span className="pointer-events-none absolute inset-y-0 left-3 inline-flex items-center text-muted">
                                    <Building2 size={16} />
                                </span>
                                <input
                                    type="text"
                                    id="tenantSlug"
                                    className="input pl-10"
                                    value={tenantSlug}
                                    onChange={(e) => setTenantSlug(e.target.value)}
                                    required
                                    placeholder="nome-da-empresa"
                                    autoComplete="organization"
                                />
                            </div>
                            <p className="text-xs text-muted">Identificador da sua empresa</p>
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="email" className="text-sm font-medium text-muted">
                                Email
                            </label>
                            <div className="relative">
                                <span className="pointer-events-none absolute inset-y-0 left-3 inline-flex items-center text-muted">
                                    <Mail size={16} />
                                </span>
                                <input
                                    type="email"
                                    id="email"
                                    className="input pl-10"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    autoComplete="email"
                                    placeholder="seu@email.com"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary w-full justify-center gap-2"
                            disabled={loading}
                        >
                            <Send size={18} />
                            {loading ? 'Enviando...' : 'Enviar Link de Recuperação'}
                        </button>
                    </form>

                    <div className="text-center text-sm">
                        <Link to="/login" className="font-semibold text-primary inline-flex items-center justify-center gap-2">
                            <ArrowLeft size={16} />
                            Voltar para Login
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
