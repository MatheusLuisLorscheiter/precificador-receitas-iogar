import { useState, useEffect, useRef, useMemo } from 'react';
import {
    recipesAPI,
    ingredientsAPI,
    categoriesAPI,
    Recipe,
    Ingredient,
    Category,
    RecipeListFilters,
} from '../lib/apiClient';
import {
    Plus,
    X,
    Edit2,
    Trash2,
    BookOpen,
    Clock,
    TrendingUp,
    DollarSign,
    Filter,
    Search,
    Tags,
    RefreshCcw,
    CheckSquare,
    Loader2,
} from 'lucide-react';
import ConfirmDialog from '../components/ConfirmDialog';
import { MeasurementUnitSelect } from '../components/MeasurementUnitSelect';
import { DEFAULT_PRODUCT_UNIT } from '../lib/measurement';
import { useAuthStore } from '../store/authStore';
import { useToast } from '../components/ToastProvider';

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
});

interface RecipeFormItem {
    ingredient_id: string;
    quantity: number;
    unit: string;
    waste_factor: number;
}

interface RecipeFormData {
    name: string;
    description: string;
    yield_quantity: number;
    yield_unit: string;
    production_time: number;
    notes: string;
    items: RecipeFormItem[];
}

const createDefaultFilters = () => ({
    search: '',
    category_id: '',
});

export default function Recipes() {
    const { hasHydrated, isAuthenticated } = useAuthStore();
    const { pushToast } = useToast();
    const [recipes, setRecipes] = useState<Recipe[]>([]);
    const [ingredients, setIngredients] = useState<Ingredient[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [recipeToDelete, setRecipeToDelete] = useState<string | null>(null);
    const [filters, setFilters] = useState(createDefaultFilters);
    const [appliedFilters, setAppliedFilters] = useState(createDefaultFilters);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
    const [bulkLoading, setBulkLoading] = useState(false);
    const [formData, setFormData] = useState<RecipeFormData>({
        name: '',
        description: '',
        yield_quantity: 0,
        yield_unit: DEFAULT_PRODUCT_UNIT,
        production_time: 0,
        notes: '',
        items: [],
    });
    const formCardRef = useRef<HTMLDivElement | null>(null);
    const ingredientLookup = useMemo(() => {
        const map = new Map<string, Ingredient>();
        ingredients.forEach((ingredient) => {
            map.set(ingredient.id, ingredient);
        });
        return map;
    }, [ingredients]);

    useEffect(() => {
        if (hasHydrated && isAuthenticated) {
            loadData(appliedFilters);
        } else if (hasHydrated && !isAuthenticated) {
            setLoading(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [hasHydrated, isAuthenticated]);

    const buildFilterParams = (state: ReturnType<typeof createDefaultFilters>) => {
        const params: Partial<RecipeListFilters> = {};
        if (state.search.trim()) {
            params.search = state.search.trim();
        }
        if (state.category_id) {
            params.category_id = state.category_id;
        }
        return params;
    };

    const loadData = async (state: ReturnType<typeof createDefaultFilters> = appliedFilters) => {
        setLoading(true);
        try {
            const [recipesRes, ingredientsRes, categoriesRes] = await Promise.all([
                recipesAPI.list(buildFilterParams(state)),
                ingredientsAPI.list(),
                categoriesAPI.list('recipe'),
            ]);
            setRecipes(recipesRes.data || []);
            setIngredients(ingredientsRes.data || []);
            setCategories(categoriesRes.data || []);
            setSelectedIds([]);
        } catch (err: any) {
            const message = err?.response?.data?.error || 'Erro ao carregar dados';
            pushToast({ variant: 'error', title: 'Receitas', description: message });
        } finally {
            setLoading(false);
        }
    };

    const handleApplyFilters = (e: React.FormEvent) => {
        e.preventDefault();
        const next = { ...filters };
        setAppliedFilters(next);
        loadData(next);
    };

    const handleClearFilters = () => {
        const next = createDefaultFilters();
        setFilters(next);
        setAppliedFilters(next);
        loadData(next);
    };

    const toggleRecipeSelection = (id: string) => {
        setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((selected) => selected !== id) : [...prev, id]
        );
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === recipes.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(recipes.map((recipe) => recipe.id));
        }
    };

    useEffect(() => {
        if (showForm && formCardRef.current) {
            formCardRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, [showForm, editingId]);

    const openBulkDialog = () => {
        if (!selectedIds.length) return;
        setBulkDialogOpen(true);
    };

    const confirmBulkDelete = async () => {
        if (!selectedIds.length) return;
        setBulkLoading(true);
        try {
            await recipesAPI.bulkDelete(selectedIds);
            setBulkDialogOpen(false);
            setSelectedIds([]);
            loadData(appliedFilters);
            pushToast({
                variant: 'success',
                title: 'Receitas',
                description: 'Receitas selecionadas excluídas com sucesso.',
            });
        } catch (err: any) {
            const message = err?.response?.data?.error || 'Erro ao excluir receitas selecionadas';
            pushToast({ variant: 'error', title: 'Receitas', description: message });
        } finally {
            setBulkLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const wasEditing = Boolean(editingId);
            if (editingId) {
                await recipesAPI.update(editingId, formData as any);
            } else {
                await recipesAPI.create(formData as any);
            }
            resetForm();
            loadData(appliedFilters);
            pushToast({
                variant: 'success',
                title: 'Receitas',
                description: wasEditing ? 'Receita atualizada com sucesso.' : 'Receita criada com sucesso.',
            });
        } catch (err: any) {
            const message = err?.response?.data?.error || 'Erro ao salvar receita';
            pushToast({ variant: 'error', title: 'Receitas', description: message });
        }
    };

    const handleEdit = async (recipe: Recipe) => {
        try {
            const response = await recipesAPI.getByID(recipe.id);
            const fullRecipe = response.data;
            setFormData({
                name: fullRecipe.name,
                description: fullRecipe.description || '',
                yield_quantity: fullRecipe.yield_quantity,
                yield_unit: fullRecipe.yield_unit || DEFAULT_PRODUCT_UNIT,
                production_time: fullRecipe.production_time || 0,
                notes: fullRecipe.notes || '',
                items: (fullRecipe.items || []).map(item => ({
                    ingredient_id: item.ingredient_id,
                    quantity: item.quantity,
                    unit: item.unit || DEFAULT_PRODUCT_UNIT,
                    waste_factor: 0,
                })),
            });
            setEditingId(recipe.id);
            setShowForm(true);
        } catch (err: any) {
            const message = err?.response?.data?.error || 'Erro ao carregar receita';
            pushToast({ variant: 'error', title: 'Receitas', description: message });
        }
    };

    const handleDelete = async (id: string) => {
        setRecipeToDelete(id);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (!recipeToDelete) return;

        try {
            await recipesAPI.delete(recipeToDelete);
            loadData(appliedFilters);
            setRecipeToDelete(null);
            pushToast({ variant: 'success', title: 'Receitas', description: 'Receita excluída com sucesso.' });
        } catch (err: any) {
            const message = err?.response?.data?.error || 'Erro ao excluir receita';
            pushToast({ variant: 'error', title: 'Receitas', description: message });
        }
    };

    const addItem = () => {
        setFormData(prev => ({
            ...prev,
            items: [
                ...prev.items,
                { ingredient_id: '', quantity: 0, unit: '', waste_factor: 0 },
            ],
        }));
    };

    const removeItem = (index: number) => {
        setFormData(prev => ({
            ...prev,
            items: prev.items.filter((_, i) => i !== index),
        }));
    };

    const updateItem = (index: number, field: keyof RecipeFormItem, value: any) => {
        setFormData(prev => {
            const newItems = [...prev.items];
            newItems[index] = { ...newItems[index], [field]: value };
            return { ...prev, items: newItems };
        });
    };

    const handleIngredientChange = (index: number, ingredientId: string) => {
        setFormData(prev => {
            const ingredient = ingredientLookup.get(ingredientId);
            const newItems = [...prev.items];
            newItems[index] = {
                ...newItems[index],
                ingredient_id: ingredientId,
                unit: ingredient?.unit || '',
                waste_factor: 0,
            };
            return { ...prev, items: newItems };
        });
    };

    const resetForm = () => {
        setFormData({
            name: '',
            description: '',
            yield_quantity: 0,
            yield_unit: DEFAULT_PRODUCT_UNIT,
            production_time: 0,
            notes: '',
            items: [],
        });
        setEditingId(null);
        setShowForm(false);
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-32">
                <div className="spinner" />
                <p className="mt-4 text-sm text-muted">Carregando receitas...</p>
            </div>
        );
    }

    const hasRecipes = recipes.length > 0;
    const selectedCount = selectedIds.length;
    const allSelected = hasRecipes && selectedCount === recipes.length;

    return (
        <div className="space-y-10">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.4em] text-muted">Produção</p>
                    <h1 className="mt-2 flex items-center gap-3 text-3xl font-semibold text-foreground">
                        <span className="rounded-2xl bg-accent/10 p-2 text-accent">
                            <BookOpen size={28} strokeWidth={2} />
                        </span>
                        Receitas
                    </h1>
                </div>
                <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
                    {showForm ? (
                        <>
                            <X size={18} />
                            Cancelar edição
                        </>
                    ) : (
                        <>
                            <Plus size={18} />
                            Nova receita
                        </>
                    )}
                </button>
            </div>

            <form onSubmit={handleApplyFilters} className="card space-y-4">
                <div className="flex items-center gap-3 text-muted">
                    <span className="rounded-full bg-accent/10 p-2 text-accent">
                        <Filter size={18} />
                    </span>
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.3em]">Filtros</p>
                        <p className="text-sm">Procure por nome, descrição ou categoria</p>
                    </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">Busca</label>
                        <div className="input flex items-center gap-2">
                            <Search size={16} className="text-muted" />
                            <input
                                type="text"
                                className="w-full bg-transparent outline-none"
                                placeholder="Nome da receita"
                                value={filters.search}
                                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">Categoria</label>
                        <div className="input flex items-center gap-2">
                            <Tags size={16} className="text-muted" />
                            <select
                                className="w-full bg-transparent outline-none"
                                value={filters.category_id}
                                onChange={(e) => setFilters({ ...filters, category_id: e.target.value })}
                            >
                                <option value="">Todas</option>
                                {categories.map((category) => (
                                    <option key={category.id} value={category.id}>
                                        {category.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="flex items-end gap-2 md:col-span-2 lg:col-span-1">
                        <button type="submit" className="btn btn-primary flex-1">
                            Aplicar
                        </button>
                        <button type="button" className="btn btn-outline" onClick={handleClearFilters}>
                            Limpar
                        </button>
                        <button type="button" className="btn btn-ghost" onClick={() => loadData(appliedFilters)}>
                            <RefreshCcw size={16} />
                        </button>
                    </div>
                </div>
                {selectedCount > 0 && (
                    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-accent/20 bg-accent/5 px-4 py-3 text-sm">
                        <CheckSquare size={16} className="text-accent" />
                        <span className="font-medium text-accent">{selectedCount} receita(s) selecionada(s)</span>
                        <span className="text-muted">Use as ações em massa abaixo</span>
                    </div>
                )}
            </form>

            {showForm && (
                <div ref={formCardRef} className="card space-y-6">
                    <div>
                        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted">
                            {editingId ? 'Atualização' : 'Cadastro'}
                        </p>
                        <h2 className="mt-2 text-2xl font-semibold text-foreground">
                            {editingId ? 'Editar receita' : 'Nova receita'}
                        </h2>
                    </div>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                            <div className="space-y-2">
                                <label htmlFor="name" className="text-sm font-medium text-muted">Nome*</label>
                                <input
                                    type="text"
                                    id="name"
                                    className="input"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="yield_quantity" className="text-sm font-medium text-muted">Rendimento*</label>
                                <input
                                    type="number"
                                    id="yield_quantity"
                                    step="0.01"
                                    className="input"
                                    value={formData.yield_quantity}
                                    onChange={(e) => setFormData({ ...formData, yield_quantity: parseFloat(e.target.value) || 0 })}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="yield_unit" className="text-sm font-medium text-muted">Unidade do rendimento*</label>
                                <MeasurementUnitSelect
                                    id="yield_unit"
                                    value={formData.yield_unit}
                                    onValueChange={(value) => setFormData({ ...formData, yield_unit: value || DEFAULT_PRODUCT_UNIT })}
                                    includePlaceholder={false}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="production_time" className="text-sm font-medium text-muted">Tempo de produção (min)</label>
                                <input
                                    type="number"
                                    id="production_time"
                                    className="input"
                                    value={formData.production_time}
                                    onChange={(e) => setFormData({ ...formData, production_time: parseInt(e.target.value) || 0 })}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="description" className="text-sm font-medium text-muted">Descrição</label>
                            <textarea
                                id="description"
                                className="textarea"
                                rows={3}
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="notes" className="text-sm font-medium text-muted">Notas e instruções</label>
                            <textarea
                                id="notes"
                                className="textarea"
                                rows={5}
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            />
                        </div>

                        <div className="space-y-4">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted">Ingredientes</p>
                                    <p className="text-sm text-muted">Monte a ficha técnica com os insumos cadastrados</p>
                                </div>
                                <button type="button" className="btn btn-outline" onClick={addItem}>
                                    <Plus size={16} />
                                    Adicionar ingrediente
                                </button>
                            </div>

                            <div className="space-y-3">
                                {formData.items.length === 0 && (
                                    <div className="rounded-2xl border border-dashed border-border/60 p-6 text-center text-sm text-muted">
                                        Nenhum ingrediente adicionado. Clique em “Adicionar ingrediente”.
                                    </div>
                                )}
                                {formData.items.map((item, index) => {
                                    const selectedIngredient = ingredientLookup.get(item.ingredient_id || '');
                                    const costValue = selectedIngredient
                                        ? item.quantity * (selectedIngredient.cost_per_unit || 0)
                                        : 0;
                                    const costDisplay = selectedIngredient
                                        ? currencyFormatter.format(costValue)
                                        : '—';

                                    return (
                                        <div
                                            key={index}
                                            className="grid gap-3 rounded-2xl border border-border/70 bg-surface/70 p-3 md:[grid-template-columns:2fr_1fr_1fr_1fr_auto]"
                                        >
                                            <select
                                                value={item.ingredient_id}
                                                onChange={(e) => handleIngredientChange(index, e.target.value)}
                                                required
                                                className="select"
                                            >
                                                <option value="">Selecione...</option>
                                                {ingredients.map((ing) => (
                                                    <option key={ing.id} value={ing.id}>
                                                        {ing.name} ({ing.unit})
                                                    </option>
                                                ))}
                                            </select>
                                            <input
                                                type="number"
                                                step="0.01"
                                                placeholder="Qtd"
                                                className="input"
                                                value={item.quantity}
                                                onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                                                required
                                            />
                                            <input
                                                type="text"
                                                className="input"
                                                value={item.unit || ''}
                                                placeholder="Unidade"
                                                disabled
                                            />
                                            <div className="rounded-2xl border border-border/70 px-4 py-2 text-sm font-semibold text-primary">
                                                {costDisplay}
                                            </div>
                                            <button
                                                type="button"
                                                className="btn btn-danger px-3"
                                                onClick={() => removeItem(index)}
                                            >
                                                <X size={16} />
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-3">
                            <button type="submit" className="btn btn-primary">
                                {editingId ? 'Atualizar receita' : 'Salvar receita'}
                            </button>
                            <button type="button" className="btn btn-outline" onClick={resetForm}>
                                Limpar formulário
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="card space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            className="checkbox"
                            checked={allSelected}
                            onChange={toggleSelectAll}
                            aria-label="Selecionar todas as receitas"
                        />
                        <span className="text-sm text-muted">
                            {allSelected ? 'Todas selecionadas' : `${selectedCount} selecionada(s)`}
                        </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <button type="button" className="btn btn-outline" onClick={() => loadData(appliedFilters)}>
                            <RefreshCcw size={16} />
                            Atualizar
                        </button>
                        <button
                            type="button"
                            className="btn btn-danger"
                            disabled={!selectedCount}
                            onClick={openBulkDialog}
                        >
                            <Trash2 size={16} />
                            Excluir selecionadas
                        </button>
                    </div>
                </div>
                <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                    {recipes.map((recipe) => (
                        <div
                            key={recipe.id}
                            className={`relative card flex flex-col gap-4 ${selectedIds.includes(recipe.id) ? 'ring-2 ring-accent/40' : ''}`}
                        >
                            <label className="absolute right-4 top-4 flex items-center gap-2 text-xs text-muted">
                                <input
                                    type="checkbox"
                                    className="checkbox"
                                    checked={selectedIds.includes(recipe.id)}
                                    onChange={() => toggleRecipeSelection(recipe.id)}
                                    aria-label={`Selecionar ${recipe.name}`}
                                />
                                Selecionar
                            </label>
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted">Ficha técnica</p>
                                    <h3 className="mt-2 text-xl font-semibold text-foreground">{recipe.name}</h3>
                                </div>
                            </div>

                            {recipe.description && (
                                <p className="text-sm text-muted">{recipe.description}</p>
                            )}
                            <div className="grid gap-3 text-sm">
                                <p className="flex items-center gap-2 text-foreground">
                                    <TrendingUp size={16} />
                                    Rendimento: {recipe.yield_quantity} {recipe.yield_unit}
                                </p>
                                {recipe.production_time && (
                                    <p className="flex items-center gap-2 text-foreground">
                                        <Clock size={16} />
                                        Tempo: {recipe.production_time} min
                                    </p>
                                )}
                                {recipe.cost_summary && (
                                    <p className="flex items-center gap-2 font-semibold text-primary">
                                        <DollarSign size={16} />
                                        Custo: R$ {recipe.cost_summary.total_cost.toFixed(2)}
                                    </p>
                                )}
                            </div>
                            <div className="flex gap-3">
                                <button
                                    className="btn btn-outline flex-1"
                                    onClick={() => handleEdit(recipe)}
                                >
                                    <Edit2 size={16} />
                                    Editar
                                </button>
                                <button
                                    className="btn btn-danger flex-1"
                                    onClick={() => handleDelete(recipe.id)}
                                >
                                    <Trash2 size={16} />
                                    Excluir
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {!hasRecipes && (
                <div className="card text-center text-muted">
                    <p className="py-10">Nenhuma receita cadastrada. Comece adicionando sua primeira ficha técnica.</p>
                </div>
            )}

            <ConfirmDialog
                isOpen={deleteDialogOpen}
                onClose={() => setDeleteDialogOpen(false)}
                onConfirm={confirmDelete}
                title="Excluir Receita"
                message="Tem certeza que deseja excluir esta receita? Esta ação não pode ser desfeita."
                confirmText="Excluir"
                cancelText="Cancelar"
                variant="danger"
            />
            <ConfirmDialog
                isOpen={bulkDialogOpen}
                onClose={() => setBulkDialogOpen(false)}
                onConfirm={confirmBulkDelete}
                title="Excluir receitas selecionadas"
                message="Deseja realmente excluir todas as receitas selecionadas? Esta ação é irreversível."
                confirmText={bulkLoading ? 'Excluindo...' : 'Excluir selecionadas'}
                cancelText="Cancelar"
                variant="danger"
                confirmDisabled={bulkLoading}
                icon={bulkLoading ? <Loader2 className="animate-spin" size={20} /> : undefined}
            />
        </div>
    );
}           
