import { useState, useEffect } from 'react';
import { ingredientsAPI, recipesAPI, productsAPI, Recipe, Ingredient, Product } from '../lib/apiClient';
import { Link } from 'react-router-dom';
import { Package, BookOpen, ShoppingBag, DollarSign, Plus, Zap, Settings, AlertTriangle, TrendingDown } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

interface DashboardStats {
    totalIngredients: number;
    totalRecipes: number;
    totalProducts: number;
    totalInventoryValue: number;
    lowStockIngredients: number;
    lowMarginProducts: number;
}

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
});

export default function Dashboard() {
    const { hasHydrated, isAuthenticated } = useAuthStore();
    const [stats, setStats] = useState<DashboardStats>({
        totalIngredients: 0,
        totalRecipes: 0,
        totalProducts: 0,
        totalInventoryValue: 0,
        lowStockIngredients: 0,
        lowMarginProducts: 0,
    });
    const [recentRecipes, setRecentRecipes] = useState<Recipe[]>([]);
    const [lowStockIngredientsList, setLowStockIngredientsList] = useState<Ingredient[]>([]);
    const [lowMarginProductsList, setLowMarginProductsList] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        // Só carregar dados após hidratação do store e se autenticado
        if (hasHydrated && isAuthenticated) {
            loadDashboardData();
        } else if (hasHydrated && !isAuthenticated) {
            setLoading(false);
        }
    }, [hasHydrated, isAuthenticated]);

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
                (sum, ing) => sum + ing.cost_per_unit * (ing.current_stock || 0),
                0
            );

            const criticalIngredients = ingredients
                .filter((ing) => ing.min_stock_level > 0 && (ing.current_stock || 0) <= ing.min_stock_level)
                .sort((a, b) => (a.current_stock - a.min_stock_level) - (b.current_stock - b.min_stock_level));

            const marginAlerts = products
                .filter((product) => product.pricing_summary && product.pricing_summary.margin_percent < 20)
                .sort((a, b) => (a.pricing_summary!.margin_percent - b.pricing_summary!.margin_percent));

            setStats({
                totalIngredients: ingredients.length,
                totalRecipes: recipes.length,
                totalProducts: products.length,
                totalInventoryValue: inventoryValue,
                lowStockIngredients: criticalIngredients.length,
                lowMarginProducts: marginAlerts.length,
            });

            // Pegar listas derivadas para seções do dashboard
            setRecentRecipes(
                [...recipes]
                    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                    .slice(0, 5)
            );
            setLowStockIngredientsList(criticalIngredients.slice(0, 5));
            setLowMarginProductsList(marginAlerts.slice(0, 5));
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
            value: currencyFormatter.format(stats.totalInventoryValue),
            href: '/ingredients',
            icon: DollarSign,
            accent: 'text-accent',
            helper: 'Baseado no estoque mínimo',
        },
        {
            label: 'Ingredientes com estoque crítico',
            value: stats.lowStockIngredients,
            href: '/ingredients',
            icon: AlertTriangle,
            accent: stats.lowStockIngredients > 0 ? 'text-danger' : 'text-success',
            helper: stats.lowStockIngredients > 0 ? 'Reponha o quanto antes' : 'Todos acima do mínimo',
        },
        {
            label: 'Produtos com margem < 20%',
            value: stats.lowMarginProducts,
            href: '/products',
            icon: TrendingDown,
            accent: stats.lowMarginProducts > 0 ? 'text-warning' : 'text-success',
            helper: stats.lowMarginProducts > 0 ? 'Revise precificação' : 'Margens saudáveis',
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

            <div className="grid gap-6 lg:grid-cols-2">
                <div className="card">
                    <div className="mb-4 flex items-center gap-3">
                        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-danger/10 text-danger">
                            <AlertTriangle size={20} strokeWidth={2} />
                        </span>
                        <div>
                            <h2 className="text-xl font-semibold text-foreground">Estoque crítico</h2>
                            <p className="text-sm text-muted">Ingredientes abaixo do nível mínimo</p>
                        </div>
                    </div>
                    {lowStockIngredientsList.length > 0 ? (
                        <div className="space-y-3">
                            {lowStockIngredientsList.map((ingredient) => (
                                <Link
                                    key={ingredient.id}
                                    to="/ingredients"
                                    className="group flex items-center justify-between rounded-2xl border border-border/60 bg-surface/70 px-4 py-3 no-underline transition hover:border-danger/40 hover:bg-card/80"
                                >
                                    <div>
                                        <p className="text-base font-semibold text-foreground">{ingredient.name}</p>
                                        <p className="text-sm text-muted">
                                            Atual: {ingredient.current_stock ?? 0} {ingredient.unit} • Mínimo: {ingredient.min_stock_level}{' '}
                                            {ingredient.unit}
                                        </p>
                                    </div>
                                    <p className="text-sm font-semibold text-danger">
                                        {currencyFormatter.format(ingredient.cost_per_unit * (ingredient.min_stock_level - (ingredient.current_stock || 0)))}
                                    </p>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm font-medium text-muted">Todos os ingredientes estão acima do estoque mínimo.</p>
                    )}
                </div>

                <div className="card">
                    <div className="mb-4 flex items-center gap-3">
                        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-warning/10 text-warning">
                            <TrendingDown size={20} strokeWidth={2} />
                        </span>
                        <div>
                            <h2 className="text-xl font-semibold text-foreground">Margem em alerta</h2>
                            <p className="text-sm text-muted">Produtos com margem de lucro abaixo de 20%</p>
                        </div>
                    </div>
                    {lowMarginProductsList.length > 0 ? (
                        <div className="space-y-3">
                            {lowMarginProductsList.map((product) => {
                                const marginPercent = product.pricing_summary?.margin_percent ?? 0;
                                return (
                                    <Link
                                        key={product.id}
                                        to="/products"
                                        className="group flex items-center justify-between rounded-2xl border border-border/60 bg-surface/70 px-4 py-3 no-underline transition hover:border-warning/40 hover:bg-card/80"
                                    >
                                        <div>
                                            <p className="text-base font-semibold text-foreground">{product.name}</p>
                                            <p className="text-sm text-muted">
                                                Margem atual:{' '}
                                                <span className="font-semibold text-warning">
                                                    {marginPercent.toFixed(1)}%
                                                </span>
                                            </p>
                                        </div>
                                        <p className="text-xs text-muted">
                                            Custo unitário {currencyFormatter.format(product.pricing_summary?.unit_cost || 0)}
                                        </p>
                                    </Link>
                                );
                            })}
                        </div>
                    ) : (
                        <p className="text-sm font-medium text-muted">Nenhum produto com margem crítica no momento.</p>
                    )}
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
                        {recentRecipes.map((recipe) => {
                            const summary = recipe.cost_summary;
                            const unitLabel = recipe.yield_unit || 'un.';
                            return (
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
                                    {summary && (
                                        <div className="text-right text-sm">
                                            <p className="font-semibold text-primary">
                                                {currencyFormatter.format(summary.total_cost)}
                                            </p>
                                            <p className="text-xs text-muted">
                                                {currencyFormatter.format(summary.cost_per_unit)} / {unitLabel}
                                            </p>
                                        </div>
                                    )}
                                </Link>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
