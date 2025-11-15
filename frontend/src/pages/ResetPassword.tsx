import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { authAPI } from '../lib/apiClient';
import { Lock, CheckCircle, ArrowLeft } from 'lucide-react';

export default function ResetPassword() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const tenantSlug = searchParams.get('tenant'); // Pegar da URL em vez do localStorage

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
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
            <div
                style={{
                    minHeight: '100vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '1rem',
                }}
            >
                <div className="card" style={{ maxWidth: '400px', width: '100%', textAlign: 'center' }}>
                    <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'center' }}>
                        <CheckCircle size={64} style={{ color: '#10b981' }} />
                    </div>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: 'bold', marginBottom: '1rem' }}>
                        Senha Redefinida!
                    </h1>
                    <p style={{ marginBottom: '1.5rem', color: 'var(--text-light)' }}>
                        Sua senha foi redefinida com sucesso. Você será redirecionado para a página de login...
                    </p>
                    <Link
                        to="/login"
                        className="btn-primary"
                        style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                    >
                        <ArrowLeft size={18} />
                        Ir para Login
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div
            style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '1rem',
            }}
        >
            <div className="card" style={{ maxWidth: '400px', width: '100%' }}>
                <h1 className="text-center mb-4" style={{ fontSize: '1.75rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                    <Lock size={28} />
                    Redefinir Senha
                </h1>

                {error && (
                    <div
                        style={{
                            backgroundColor: '#fee2e2',
                            color: 'var(--danger)',
                            padding: '0.75rem',
                            borderRadius: '0.5rem',
                            marginBottom: '1rem',
                        }}
                    >
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div>
                        <label htmlFor="password" style={{ display: 'block', marginBottom: '0.5rem' }}>
                            Nova Senha
                        </label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={8}
                            autoComplete="new-password"
                        />
                        <small style={{ color: 'var(--text-light)', fontSize: '0.875rem' }}>
                            Mínimo de 8 caracteres
                        </small>
                    </div>

                    <div>
                        <label htmlFor="confirmPassword" style={{ display: 'block', marginBottom: '0.5rem' }}>
                            Confirmar Senha
                        </label>
                        <input
                            type="password"
                            id="confirmPassword"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            minLength={8}
                            autoComplete="new-password"
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn-primary"
                        disabled={loading || !token}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                    >
                        <Lock size={18} />
                        {loading ? 'Redefinindo...' : 'Redefinir Senha'}
                    </button>
                </form>

                <p className="text-center mt-4 text-sm text-secondary">
                    <Link to="/login" style={{ color: 'var(--primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                        <ArrowLeft size={16} />
                        Voltar para Login
                    </Link>
                </p>
            </div>
        </div>
    );
}
