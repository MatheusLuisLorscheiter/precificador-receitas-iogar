import { useEffect, useMemo, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import api from '../lib/api';
import { Settings as SettingsIcon, User, Lock, Save, Sparkles } from 'lucide-react';
import { usePricingStore } from '../store/pricingStore';
import { PricingSettingsUpdatePayload } from '../lib/apiClient';

export default function Settings() {
    const { user, setUser } = useAuthStore();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [pricingError, setPricingError] = useState('');
    const [pricingSuccess, setPricingSuccess] = useState('');

    const [profileData, setProfileData] = useState({
        name: user?.name || '',
        email: user?.email || '',
    });

    const [passwordData, setPasswordData] = useState({
        current_password: '',
        new_password: '',
        confirm_password: '',
    });

    const {
        settings: pricingSettings,
        loadSettings,
        saveSettings,
        loadingSettings,
        savingSettings,
    } = usePricingStore((state) => ({
        settings: state.settings,
        loadSettings: state.loadSettings,
        saveSettings: state.saveSettings,
        loadingSettings: state.loadingSettings,
        savingSettings: state.savingSettings,
    }));

    const [pricingForm, setPricingForm] = useState<PricingSettingsUpdatePayload>({
        labor_cost_per_minute: 0,
        default_packaging_cost: 0,
        default_margin_percent: 0,
        fixed_monthly_costs: 0,
        variable_cost_percent: 0,
        default_tax_rate: 0,
        default_sales_volume: 0,
    });

    useEffect(() => {
        loadSettings().catch(() => {
            setPricingError('Não foi possível carregar as configurações de precificação.');
        });
    }, [loadSettings]);

    useEffect(() => {
        if (pricingSettings) {
            setPricingForm({
                labor_cost_per_minute: pricingSettings.labor_cost_per_minute,
                default_packaging_cost: pricingSettings.default_packaging_cost,
                default_margin_percent: pricingSettings.default_margin_percent,
                fixed_monthly_costs: pricingSettings.fixed_monthly_costs,
                variable_cost_percent: pricingSettings.variable_cost_percent,
                default_tax_rate: pricingSettings.default_tax_rate,
                default_sales_volume: pricingSettings.default_sales_volume,
            });
        }
    }, [pricingSettings]);

    const lastUpdatedAt = useMemo(() => {
        if (!pricingSettings?.updated_at) return '';
        return new Date(pricingSettings.updated_at).toLocaleString('pt-BR');
    }, [pricingSettings?.updated_at]);

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

    const handlePricingChange = (field: keyof PricingSettingsUpdatePayload, value: string) => {
        const parsed = value === '' ? undefined : Number(value);
        setPricingForm((prev) => ({
            ...prev,
            [field]: Number.isNaN(parsed) ? 0 : parsed,
        }));
    };

    const handlePricingSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setPricingError('');
        setPricingSuccess('');

        try {
            await saveSettings(pricingForm);
            setPricingSuccess('Configurações de precificação atualizadas com sucesso!');
        } catch (err: any) {
            setPricingError(err.response?.data?.error || 'Erro ao atualizar configurações de precificação');
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

            <div className="card space-y-6">
                <div className="flex items-center gap-3">
                    <span className="rounded-2xl bg-warning/10 p-2 text-warning">
                        <Sparkles size={22} />
                    </span>
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted">Precificação direta</p>
                        <h2 className="text-xl font-semibold text-foreground">Parâmetros padrão</h2>
                        <p className="text-sm text-muted">Defina custos base e métricas utilizadas nas simulações automáticas.</p>
                    </div>
                </div>

                {pricingError && (
                    <div className="rounded-2xl border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">
                        {pricingError}
                    </div>
                )}
                {pricingSuccess && (
                    <div className="rounded-2xl border border-success/30 bg-success/5 px-4 py-3 text-sm text-success">
                        {pricingSuccess}
                    </div>
                )}

                <form onSubmit={handlePricingSubmit} className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-muted" htmlFor="labor_cost_per_minute">Mão de obra (R$/min)</label>
                            <input
                                id="labor_cost_per_minute"
                                type="number"
                                step="0.01"
                                className="input"
                                value={pricingForm.labor_cost_per_minute ?? ''}
                                onChange={(e) => handlePricingChange('labor_cost_per_minute', e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-muted" htmlFor="default_packaging_cost">Custo padrão de embalagem</label>
                            <input
                                id="default_packaging_cost"
                                type="number"
                                step="0.01"
                                className="input"
                                value={pricingForm.default_packaging_cost ?? ''}
                                onChange={(e) => handlePricingChange('default_packaging_cost', e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-muted" htmlFor="default_margin_percent">Margem padrão (%)</label>
                            <input
                                id="default_margin_percent"
                                type="number"
                                step="0.1"
                                className="input"
                                value={pricingForm.default_margin_percent ?? ''}
                                onChange={(e) => handlePricingChange('default_margin_percent', e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-muted" htmlFor="default_tax_rate">Taxa padrão de imposto (%)</label>
                            <input
                                id="default_tax_rate"
                                type="number"
                                step="0.1"
                                className="input"
                                value={pricingForm.default_tax_rate ?? ''}
                                onChange={(e) => handlePricingChange('default_tax_rate', e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-muted" htmlFor="fixed_monthly_costs">Custos fixos mensais</label>
                            <input
                                id="fixed_monthly_costs"
                                type="number"
                                step="0.01"
                                className="input"
                                value={pricingForm.fixed_monthly_costs ?? ''}
                                onChange={(e) => handlePricingChange('fixed_monthly_costs', e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-muted" htmlFor="variable_cost_percent">Custos variáveis (%)</label>
                            <input
                                id="variable_cost_percent"
                                type="number"
                                step="0.1"
                                className="input"
                                value={pricingForm.variable_cost_percent ?? ''}
                                onChange={(e) => handlePricingChange('variable_cost_percent', e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-muted" htmlFor="default_sales_volume">Volume mensal padrão</label>
                            <input
                                id="default_sales_volume"
                                type="number"
                                step="1"
                                className="input"
                                value={pricingForm.default_sales_volume ?? ''}
                                onChange={(e) => handlePricingChange('default_sales_volume', e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted">
                        <div>
                            {lastUpdatedAt && (
                                <p>Última atualização em <span className="font-semibold text-foreground">{lastUpdatedAt}</span></p>
                            )}
                            {!lastUpdatedAt && loadingSettings && <p>Carregando configurações...</p>}
                        </div>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={savingSettings || loadingSettings}
                        >
                            <Save size={18} />
                            {savingSettings ? 'Salvando...' : 'Salvar parâmetros'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
