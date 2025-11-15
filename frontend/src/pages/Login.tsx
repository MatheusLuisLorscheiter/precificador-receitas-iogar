import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { authAPI } from '../lib/apiClient';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import { HelpCircle, Eye, EyeOff, Building2, Mail, Lock, Sun, Moon } from 'lucide-react';
import Dialog from '../components/Dialog';

interface TenantOption {
    slug: string;
    name: string;
}

export default function Login() {
    const navigate = useNavigate();
    const location = useLocation();
    const { setAuth, tenantSlug: savedSlug } = useAuthStore();
    const { theme, toggleTheme } = useThemeStore();
    const [tenantSlug, setTenantSlug] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const toggleShowPassword = () => setShowPassword((s) => !s);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Modal "Esqueceu o slug?"
    const [showSlugModal, setShowSlugModal] = useState(false);
    const [slugEmail, setSlugEmail] = useState('');
    const [slugLoading, setSlugLoading] = useState(false);
    const [slugError, setSlugError] = useState('');
    const [tenantOptions, setTenantOptions] = useState<TenantOption[]>([]);

    // Auto-preencher slug com query param (?tenant=) ou último usado
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const slugFromUrl = params.get('tenant') ?? params.get('slug');

        if (slugFromUrl) {
            setTenantSlug(slugFromUrl);
            return;
        }

        if (savedSlug) {
            setTenantSlug(savedSlug);
        }
    }, [location.search, savedSlug]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await authAPI.login(tenantSlug, email, password);
            const { access_token, refresh_token, user } = response.data;
            setAuth(user, access_token, refresh_token, tenantSlug);
            navigate('/');
        } catch (err: any) {
            setError(err.response?.data?.error || 'Erro ao fazer login');
        } finally {
            setLoading(false);
        }
    };

    const handleFindTenant = async (e: React.FormEvent) => {
        e.preventDefault();
        setSlugError('');
        setSlugLoading(true);
        setTenantOptions([]);

        try {
            const response = await authAPI.getTenantsByEmail(slugEmail);
            const tenants = response.data;

            if (tenants.length === 0) {
                setSlugError('Nenhuma empresa encontrada com este email');
            } else {
                setTenantOptions(tenants);
            }
        } catch (err: any) {
            setSlugError(err.response?.data?.error || 'Erro ao buscar empresas');
        } finally {
            setSlugLoading(false);
        }
    };

    const selectTenant = (slug: string) => {
        setTenantSlug(slug);
        setShowSlugModal(false);
        setSlugEmail('');
        setTenantOptions([]);
        setSlugError('');
    };

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
                        <p className="text-xs font-semibold uppercase tracking-[0.4em] text-muted">Bem-vindo</p>
                        <h1 className="mt-2 text-3xl font-semibold text-foreground">Acessar conta</h1>
                        <p className="mt-2 text-sm text-muted">Entre para gerenciar seus custos e receitas.</p>
                    </div>

                    {error && (
                        <div className="rounded-2xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm font-medium text-danger">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <label htmlFor="tenantSlug" className="text-sm font-medium text-muted">
                                    Empresa (slug)
                                </label>
                                <button
                                    type="button"
                                    className="text-sm font-medium text-primary inline-flex items-center gap-1"
                                    onClick={() => setShowSlugModal(true)}
                                >
                                    <HelpCircle size={14} />
                                    Esqueceu o slug?
                                </button>
                            </div>
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
                            <p className="text-xs text-muted">Identificador único fornecido ao criar a conta.</p>
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="email" className="text-sm font-medium text-muted">Email</label>
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
                                    placeholder="seu@email.com"
                                    autoComplete="email"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="password" className="text-sm font-medium text-muted">Senha</label>
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
                                    placeholder="••••••••"
                                    autoComplete="current-password"
                                />
                                <button
                                    type="button"
                                    onClick={toggleShowPassword}
                                    className="absolute inset-y-0 right-3 inline-flex items-center text-muted"
                                    aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <button type="submit" className="btn btn-primary w-full justify-center" disabled={loading}>
                            {loading ? 'Entrando...' : 'Entrar'}
                        </button>
                    </form>

                    <div className="text-center text-sm">
                        <Link to="/forgot-password" className="font-semibold text-primary">
                            Esqueceu sua senha?
                        </Link>
                    </div>

                    <p className="text-center text-sm text-muted">
                        Não tem uma conta?{' '}
                        <Link to="/register" className="font-semibold text-primary">
                            Registre-se
                        </Link>
                    </p>
                </div>
            </div>

            {/* Modal: Esqueceu o slug? */}
            <Dialog
                isOpen={showSlugModal}
                onClose={() => {
                    setShowSlugModal(false);
                    setSlugEmail('');
                    setTenantOptions([]);
                    setSlugError('');
                }}
                title="Encontrar sua Empresa"
            >
                <p className="mb-4 text-sm text-muted">
                    Digite seu email e mostraremos todas as empresas onde você possui acesso.
                </p>

                {slugError && (
                    <div className="mb-4 rounded-2xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm font-medium text-danger">
                        {slugError}
                    </div>
                )}

                <form onSubmit={handleFindTenant} className="mb-6 space-y-4">
                    <div className="space-y-2">
                        <label htmlFor="slugEmail" className="text-sm font-medium text-muted">
                            Seu email
                        </label>
                        <input
                            type="email"
                            id="slugEmail"
                            className="input"
                            value={slugEmail}
                            onChange={(e) => setSlugEmail(e.target.value)}
                            required
                            placeholder="seu@email.com"
                            autoComplete="email"
                        />
                    </div>
                    <button type="submit" className="btn btn-primary w-full" disabled={slugLoading}>
                        {slugLoading ? 'Buscando...' : 'Buscar empresas'}
                    </button>
                </form>

                {tenantOptions.length > 0 && (
                    <div className="space-y-3">
                        <h3 className="text-sm font-semibold text-muted">Selecione sua empresa:</h3>
                        <div className="space-y-3">
                            {tenantOptions.map((tenant) => (
                                <button
                                    key={tenant.slug}
                                    onClick={() => selectTenant(tenant.slug)}
                                    className="btn btn-outline flex w-full flex-col items-start gap-1 text-left"
                                >
                                    <span className="font-semibold text-foreground">{tenant.name}</span>
                                    <span className="text-xs text-muted">{tenant.slug}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </Dialog>
        </div>
    );
}
