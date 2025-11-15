import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import api from '../lib/api';
import { Settings as SettingsIcon, User, Lock, Save } from 'lucide-react';

export default function Settings() {
    const { user, setUser } = useAuthStore();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [profileData, setProfileData] = useState({
        name: user?.name || '',
        email: user?.email || '',
    });

    const [passwordData, setPasswordData] = useState({
        current_password: '',
        new_password: '',
        confirm_password: '',
    });

    const handleProfileSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);

        try {
            const response = await api.put('/users/me', profileData);
            setUser(response.data);
            setSuccess('Perfil atualizado com sucesso!');
        } catch (err: any) {
            setError(err.response?.data?.error || 'Erro ao atualizar perfil');
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (passwordData.new_password !== passwordData.confirm_password) {
            setError('As senhas não coincidem');
            return;
        }

        if (passwordData.new_password.length < 8) {
            setError('A nova senha deve ter pelo menos 8 caracteres');
            return;
        }

        setLoading(true);

        try {
            await api.put('/users/me/password', {
                current_password: passwordData.current_password,
                new_password: passwordData.new_password,
            });
            setSuccess('Senha alterada com sucesso!');
            setPasswordData({ current_password: '', new_password: '', confirm_password: '' });
        } catch (err: any) {
            setError(err.response?.data?.error || 'Erro ao alterar senha');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.4em] text-muted">Conta</p>
                    <h1 className="mt-2 flex items-center gap-3 text-3xl font-semibold text-foreground">
                        <span className="rounded-2xl bg-secondary/10 p-2 text-foreground">
                            <SettingsIcon size={28} strokeWidth={2} />
                        </span>
                        Configurações
                    </h1>
                </div>
            </div>

            {error && (
                <div className="rounded-2xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm font-medium text-danger">
                    {error}
                </div>
            )}

            {success && (
                <div className="rounded-2xl border border-success/30 bg-success/10 px-4 py-3 text-sm font-medium text-success">
                    {success}
                </div>
            )}

            <div className="grid gap-6 lg:grid-cols-2">
                <div className="card space-y-5">
                    <div className="flex items-center gap-3">
                        <span className="rounded-2xl bg-primary/10 p-2 text-primary">
                            <User size={22} />
                        </span>
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted">Perfil</p>
                            <h2 className="text-xl font-semibold text-foreground">Informações do usuário</h2>
                        </div>
                    </div>
                    <form onSubmit={handleProfileSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <label htmlFor="name" className="text-sm font-medium text-muted">Nome</label>
                            <input
                                type="text"
                                id="name"
                                className="input"
                                value={profileData.name}
                                onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="email" className="text-sm font-medium text-muted">Email</label>
                            <input
                                type="email"
                                id="email"
                                className="input"
                                value={profileData.email}
                                onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary w-full justify-center"
                            disabled={loading}
                        >
                            <Save size={18} />
                            {loading ? 'Salvando...' : 'Salvar alterações'}
                        </button>
                    </form>
                </div>

                <div className="card space-y-5">
                    <div className="flex items-center gap-3">
                        <span className="rounded-2xl bg-secondary/10 p-2 text-foreground">
                            <Lock size={22} />
                        </span>
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted">Segurança</p>
                            <h2 className="text-xl font-semibold text-foreground">Alterar senha</h2>
                        </div>
                    </div>
                    <form onSubmit={handlePasswordSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <label htmlFor="current_password" className="text-sm font-medium text-muted">Senha atual</label>
                            <input
                                type="password"
                                id="current_password"
                                className="input"
                                value={passwordData.current_password}
                                onChange={(e) => setPasswordData({ ...passwordData, current_password: e.target.value })}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="new_password" className="text-sm font-medium text-muted">Nova senha</label>
                            <input
                                type="password"
                                id="new_password"
                                className="input"
                                value={passwordData.new_password}
                                onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                                required
                                minLength={8}
                            />
                            <p className="text-xs text-muted">Mínimo de 8 caracteres.</p>
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="confirm_password" className="text-sm font-medium text-muted">Confirmar nova senha</label>
                            <input
                                type="password"
                                id="confirm_password"
                                className="input"
                                value={passwordData.confirm_password}
                                onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                                required
                                minLength={8}
                            />
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary w-full justify-center"
                            disabled={loading}
                        >
                            <Lock size={18} />
                            {loading ? 'Alterando...' : 'Alterar senha'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
