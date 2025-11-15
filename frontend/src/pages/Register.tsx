import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../lib/apiClient';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import { Building2, Mail, User, Lock, Eye, EyeOff, Sun, Moon } from 'lucide-react';

export default function Register() {
    const navigate = useNavigate();
    const { setAuth } = useAuthStore();
    const { theme, toggleTheme } = useThemeStore();
    const [formData, setFormData] = useState({
        tenant_name: '',
        tenant_slug: '', // generated automatically
        billing_email: '',
        user_name: '',
        user_email: '',
        password: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            // ensure slug is always set based on tenant_name before submit
            const slug = formData.tenant_slug || slugify(formData.tenant_name);
            const payload = { ...formData, tenant_slug: slug };
            const response = await authAPI.register(payload);
            const { access_token, refresh_token, user } = response.data;
            setAuth(user, access_token, refresh_token, slug);
            navigate('/');
        } catch (err: any) {
            setError(err.response?.data?.error || 'Erro ao criar conta');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const slugify = (value: string) => {
        return value
            .toLowerCase()
            .normalize('NFD')
            .replace(/\p{Diacritic}/gu, '')
            .replace(/[^a-z0-9\s-]/g, '')
            .trim()
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');
    };

    // Auto-generate slug when tenant_name changes
    const handleTenantNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        const newSlug = slugify(value);
        setFormData({ ...formData, tenant_name: value, tenant_slug: newSlug });
    };

    const [showPassword, setShowPassword] = useState(false);
    const toggleShowPassword = () => setShowPassword((s) => !s);

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

            <div className="mx-auto w-full max-w-lg">
                <div className="card space-y-6">
                    <div className="text-center">
                        <p className="text-xs font-semibold uppercase tracking-[0.4em] text-muted">Novo cadastro</p>
                        <h1 className="mt-2 text-3xl font-semibold text-foreground">
                            Criar Conta
                        </h1>
                        <p className="mt-2 text-sm text-muted">Comece a gerenciar seus custos e receitas.</p>
                    </div>

                    {error && (
                        <div className="rounded-2xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm font-medium text-danger">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-4">
                            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted">Informações da Empresa</h3>

                            <div className="space-y-2">
                                <label htmlFor="tenant_name" className="text-sm font-medium text-muted">Nome da Empresa</label>
                                <div className="relative">
                                    <span className="pointer-events-none absolute inset-y-0 left-3 inline-flex items-center text-muted">
                                        <Building2 size={16} />
                                    </span>
                                    <input
                                        type="text"
                                        id="tenant_name"
                                        name="tenant_name"
                                        className="input pl-10"
                                        value={formData.tenant_name}
                                        onChange={handleTenantNameChange}
                                        required
                                        placeholder="Padaria do João"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="billing_email" className="text-sm font-medium text-muted">Email de Cobrança</label>
                                <div className="relative">
                                    <span className="pointer-events-none absolute inset-y-0 left-3 inline-flex items-center text-muted">
                                        <Mail size={16} />
                                    </span>
                                    <input
                                        type="email"
                                        id="billing_email"
                                        name="billing_email"
                                        className="input pl-10"
                                        value={formData.billing_email}
                                        onChange={handleChange}
                                        required
                                        placeholder="contato@empresa.com"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted">Suas Informações</h3>

                            <div className="space-y-2">
                                <label htmlFor="user_name" className="text-sm font-medium text-muted">Seu Nome</label>
                                <div className="relative">
                                    <span className="pointer-events-none absolute inset-y-0 left-3 inline-flex items-center text-muted">
                                        <User size={16} />
                                    </span>
                                    <input
                                        type="text"
                                        id="user_name"
                                        name="user_name"
                                        className="input pl-10"
                                        value={formData.user_name}
                                        onChange={handleChange}
                                        required
                                        placeholder="João Silva"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="user_email" className="text-sm font-medium text-muted">Seu Email</label>
                                <div className="relative">
                                    <span className="pointer-events-none absolute inset-y-0 left-3 inline-flex items-center text-muted">
                                        <Mail size={16} />
                                    </span>
                                    <input
                                        type="email"
                                        id="user_email"
                                        name="user_email"
                                        className="input pl-10"
                                        value={formData.user_email}
                                        onChange={handleChange}
                                        required
                                        placeholder="seu@email.com"
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
                                        name="password"
                                        className="input pl-10 pr-10"
                                        value={formData.password}
                                        onChange={handleChange}
                                        required
                                        minLength={8}
                                        placeholder="••••••••"
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
                                <p className="text-xs text-muted">Mínimo de 8 caracteres</p>
                            </div>
                        </div>

                        <button type="submit" className="btn btn-primary w-full justify-center" disabled={loading}>
                            {loading ? 'Criando conta...' : 'Criar Conta'}
                        </button>
                    </form>

                    <p className="text-center text-sm text-muted">
                        Já tem uma conta?{' '}
                        <Link to="/login" className="font-semibold text-primary">
                            Faça login
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}