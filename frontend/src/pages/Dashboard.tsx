import { useState, useEffect } from 'react';
import { ingredientsAPI, recipesAPI, productsAPI, Recipe } from '../lib/apiClient';
import { Link } from 'react-router-dom';
import { Package, BookOpen, ShoppingBag, DollarSign, Plus, Zap, Settings } from 'lucide-react';

interface DashboardStats {
    totalIngredients: number;
    totalRecipes: number;
    totalProducts: number;
    totalInventoryValue: number;
}

export default function Dashboard() {
    const [stats, setStats] = useState<DashboardStats>({
        totalIngredients: 0,
        totalRecipes: 0,
        totalProducts: 0,
        totalInventoryValue: 0,
    });
    const [recentRecipes, setRecentRecipes] = useState<Recipe[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        try {
            const [ingredientsRes, recipesRes, productsRes] = await Promise.all([
                ingredientsAPI.list(),
                recipesAPI.list(),
                productsAPI.list(),
            ]);

            const ingredients = ingredientsRes.data || [];
            const recipes = recipesRes.data || [];
            const products = productsRes.data || [];

            // Calcular valor total do inventário
            const inventoryValue = ingredients.reduce(
                (sum, ing) => sum + (ing.cost_per_unit * (ing.min_stock_level || 0)),
                0
            );

            setStats({
                totalIngredients: ingredients.length,
                totalRecipes: recipes.length,
                totalProducts: products.length,
                totalInventoryValue: inventoryValue,
            });

            // Pegar as 5 receitas mais recentes
            setRecentRecipes(recipes.slice(0, 5));
        } catch (err: any) {
            setError(err.response?.data?.error || 'Erro ao carregar dados do dashboard');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-32">
                <div className="spinner" />
                <p className="mt-4 text-sm text-muted">Carregando painel...</p>
            </div>
        );
    }

    const formattedDate = new Intl.DateTimeFormat('pt-BR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    }).format(new Date());

    const statCards = [
        {
            label: 'Total de Ingredientes',
            value: stats.totalIngredients,
            href: '/ingredients',
            icon: Package,
            accent: 'text-primary',
        },
        {
            label: 'Total de Receitas',
            value: stats.totalRecipes,
            href: '/recipes',
            icon: BookOpen,
            accent: 'text-success',
        },
        {
            label: 'Total de Produtos',
            value: stats.totalProducts,
            href: '/products',
            icon: ShoppingBag,
            accent: 'text-warning',
        },
        {
            label: 'Valor Estimado do Estoque',
            value: `R$ ${stats.totalInventoryValue.toFixed(2)}`,
            href: '/ingredients',
            icon: DollarSign,
            accent: 'text-accent',
            helper: 'Baseado no estoque mínimo',
        },
    ];

    const quickActions = [
        { label: 'Novo Ingrediente', href: '/ingredients' },
        { label: 'Nova Receita', href: '/recipes' },
        { label: 'Novo Produto', href: '/products' },
        { label: 'Configurações', href: '/settings', icon: Settings, variant: 'secondary' as const },
    ];

    return (
        <div className="space-y-10">
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.4em] text-muted">Visão geral</p>
                    <h1 className="mt-2 text-3xl font-semibold text-foreground">Dashboard</h1>
                </div>
                <span className="text-sm font-medium text-muted">{formattedDate}</span>
            </div>

            {error && (
                <div className="rounded-2xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm font-medium text-danger">
                    {error}
                </div>
            )}

            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
                {statCards.map((card) => {
                    const Icon = card.icon;
                    return (
                        <Link
                            key={card.label}
                            to={card.href}
                            className="card card-hover flex flex-col gap-4 no-underline"
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <p className="text-xs font-medium uppercase tracking-[0.3em] text-muted">{card.label}</p>
                                    <p className={`mt-3 text-3xl font-semibold ${card.accent}`}>{card.value}</p>
                                </div>
                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-border/50 text-foreground">
                                    <Icon size={24} strokeWidth={2} />
                                </div>
                            </div>
                            {card.helper && <p className="text-xs font-medium text-muted">{card.helper}</p>}
                        </Link>
                    );
                })}
            </div>

            <div className="card card-hover">
                <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                        <Zap size={20} strokeWidth={2} />
                    </span>
                    <div>
                        <h2 className="text-xl font-semibold text-foreground">Ações rápidas</h2>
                        <p className="text-sm text-muted">Atalhos para o que você mais utiliza</p>
                    </div>
                </div>
                <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {quickActions.map((action) => {
                        const Icon = action.icon ?? Plus;
                        const variantClass = action.variant === 'secondary' ? 'btn-secondary' : 'btn-primary';
                        return (
                            <Link
                                key={action.label}
                                to={action.href}
                                className={`btn ${variantClass} no-underline`}
                            >
                                <Icon size={18} strokeWidth={2} />
                                {action.label}
                            </Link>
                        );
                    })}
                </div>
            </div>

            {recentRecipes.length > 0 && (
                <div className="card">
                    <div className="mb-4 flex items-center gap-3">
                        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent/10 text-accent">
                            <BookOpen size={20} strokeWidth={2} />
                        </span>
                        <div>
                            <h2 className="text-xl font-semibold text-foreground">Receitas recentes</h2>
                            <p className="text-sm text-muted">Últimas 5 receitas cadastradas</p>
                        </div>
                    </div>
                    <div className="space-y-3">
                        {recentRecipes.map((recipe) => (
                            <Link
                                key={recipe.id}
                                to="/recipes"
                                className="group flex items-center justify-between rounded-2xl border border-border/60 bg-surface/70 px-4 py-3 no-underline transition hover:border-primary/40 hover:bg-card/80"
                            >
                                <div>
                                    <p className="text-base font-semibold text-foreground">{recipe.name}</p>
                                    <p className="text-sm text-muted">
                                        Rendimento: {recipe.yield_quantity} {recipe.yield_unit}
                                    </p>
                                </div>
                                {recipe.cost_summary && (
                                    <div className="text-right">
                                        <p className="text-base font-semibold text-primary">
                                            R$ {recipe.cost_summary.total_cost.toFixed(2)}
                                        </p>
                                        <p className="text-xs text-muted">Custo total</p>
                                    </div>
                                )}
                            </Link>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
