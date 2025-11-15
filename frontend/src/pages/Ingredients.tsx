import { useState, useEffect } from 'react';
import { ingredientsAPI, Ingredient, IngredientListFilters } from '../lib/apiClient';
import { Plus, X, Edit2, Trash2, Package, Filter, Search, RefreshCcw, CheckSquare, Loader2 } from 'lucide-react';
import ConfirmDialog from '../components/ConfirmDialog';
import { MeasurementUnitSelect } from '../components/MeasurementUnitSelect';
import { DEFAULT_PRODUCT_UNIT } from '../lib/measurement';

const STOCK_STATUS_LABELS = {
    all: 'Todos',
    low: 'Estoque baixo',
    out: 'Sem estoque',
    ok: 'Estoque saudável',
} as const;

type StockStatusKey = keyof typeof STOCK_STATUS_LABELS;

const createDefaultFilters = () => ({
    search: '',
    supplier: '',
    stock_status: 'all' as StockStatusKey,
});

export default function Ingredients() {
    const [ingredients, setIngredients] = useState<Ingredient[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [ingredientToDelete, setIngredientToDelete] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        cost_per_unit: 0,
        unit: DEFAULT_PRODUCT_UNIT,
        supplier: '',
        lead_time_days: 0,
        min_stock_level: 0,
    });
    const [filters, setFilters] = useState(createDefaultFilters);
    const [appliedFilters, setAppliedFilters] = useState(createDefaultFilters);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
    const [bulkLoading, setBulkLoading] = useState(false);

    useEffect(() => {
        loadIngredients(appliedFilters);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const buildFilterParams = (state: ReturnType<typeof createDefaultFilters>) => {
        const params: Partial<IngredientListFilters> = {};
        if (state.search.trim()) {
            params.search = state.search.trim();
        }
        if (state.supplier.trim()) {
            params.supplier = state.supplier.trim();
        }
        if (state.stock_status !== 'all') {
            params.stock_status = state.stock_status;
        }
        return params;
    };

    const loadIngredients = async (state: ReturnType<typeof createDefaultFilters> = appliedFilters) => {
        setLoading(true);
        try {
            const response = await ingredientsAPI.list(buildFilterParams(state));
            setIngredients(response.data || []);
            setSelectedIds([]);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Erro ao carregar ingredientes');
        } finally {
            setLoading(false);
        }
    };

    const handleApplyFilters = (e: React.FormEvent) => {
        e.preventDefault();
        setAppliedFilters(filters);
        loadIngredients(filters);
    };

    const handleClearFilters = () => {
        const next = createDefaultFilters();
        setFilters(next);
        setAppliedFilters(next);
        loadIngredients(next);
    };

    const toggleIngredientSelection = (id: string) => {
        setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((selected) => selected !== id) : [...prev, id]
        );
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === ingredients.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(ingredients.map((ingredient) => ingredient.id));
        }
    };

    const openBulkDeleteDialog = () => {
        if (!selectedIds.length) return;
        setBulkDialogOpen(true);
    };

    const confirmBulkDelete = async () => {
        if (!selectedIds.length) return;
        setBulkLoading(true);
        setError('');
        try {
            await ingredientsAPI.bulkDelete(selectedIds);
            setBulkDialogOpen(false);
            setSelectedIds([]);
            loadIngredients(appliedFilters);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Erro ao excluir ingredientes selecionados');
        } finally {
            setBulkLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        try {
            if (editingId) {
                await ingredientsAPI.update(editingId, formData);
            } else {
                await ingredientsAPI.create(formData);
            }
            resetForm();
            loadIngredients(appliedFilters);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Erro ao salvar ingrediente');
        }
    };

    const handleEdit = (ingredient: Ingredient) => {
        setFormData({
            name: ingredient.name,
            cost_per_unit: ingredient.cost_per_unit,
            unit: ingredient.unit || DEFAULT_PRODUCT_UNIT,
            supplier: ingredient.supplier || '',
            lead_time_days: ingredient.lead_time_days || 0,
            min_stock_level: ingredient.min_stock_level || 0,
        });
        setEditingId(ingredient.id);
        setShowForm(true);
    };

    const handleDelete = async (id: string) => {
        setIngredientToDelete(id);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (!ingredientToDelete) return;

        try {
            await ingredientsAPI.delete(ingredientToDelete);
            loadIngredients(appliedFilters);
            setIngredientToDelete(null);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Erro ao excluir ingrediente');
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            cost_per_unit: 0,
            unit: DEFAULT_PRODUCT_UNIT,
            supplier: '',
            lead_time_days: 0,
            min_stock_level: 0,
        });
        setEditingId(null);
        setShowForm(false);
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-32">
                <div className="spinner" />
                <p className="mt-4 text-sm text-muted">Carregando ingredientes...</p>
            </div>
        );
    }

    const hasIngredients = ingredients.length > 0;
    const selectedCount = selectedIds.length;
    const allSelected = hasIngredients && selectedCount === ingredients.length;

    return (
        <div className="space-y-10">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.4em] text-muted">Controle de estoque</p>
                    <h1 className="mt-2 flex items-center gap-3 text-3xl font-semibold text-foreground">
                        <span className="rounded-2xl bg-primary/10 p-2 text-primary">
                            <Package size={28} strokeWidth={2} />
                        </span>
                        Ingredientes
                    </h1>
                </div>
                <button
                    className="btn btn-primary"
                    onClick={() => setShowForm(!showForm)}
                >
                    {showForm ? (
                        <>
                            <X size={18} />
                            Cancelar
                        </>
                    ) : (
                        <>
                            <Plus size={18} />
                            Novo ingrediente
                        </>
                    )}
                </button>
            </div>

            {error && (
                <div className="rounded-2xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm font-medium text-danger">
                    {error}
                </div>
            )}

            <form onSubmit={handleApplyFilters} className="card space-y-4">
                <div className="flex items-center gap-3 text-muted">
                    <span className="rounded-full bg-primary/10 p-2 text-primary">
                        <Filter size={18} />
                    </span>
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.3em]">Filtros</p>
                        <p className="text-sm">Refine a lista de ingredientes</p>
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
                                placeholder="Nome do ingrediente"
                                value={filters.search}
                                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">Fornecedor</label>
                        <input
                            type="text"
                            className="input"
                            placeholder="Nome do fornecedor"
                            value={filters.supplier}
                            onChange={(e) => setFilters({ ...filters, supplier: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">Estoque</label>
                        <select
                            className="input"
                            value={filters.stock_status}
                            onChange={(e) => setFilters({ ...filters, stock_status: e.target.value as StockStatusKey })}
                        >
                            {Object.entries(STOCK_STATUS_LABELS).map(([value, label]) => (
                                <option key={value} value={value}>
                                    {label}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="flex items-end gap-2">
                        <button type="submit" className="btn btn-primary flex-1">
                            Aplicar
                        </button>
                        <button type="button" className="btn btn-outline" onClick={handleClearFilters}>
                            Limpar
                        </button>
                        <button type="button" className="btn btn-ghost" onClick={() => loadIngredients(appliedFilters)}>
                            <RefreshCcw size={16} />
                        </button>
                    </div>
                </div>
                {selectedCount > 0 && (
                    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm">
                        <CheckSquare size={16} className="text-primary" />
                        <span className="font-medium text-primary">{selectedCount} selecionado(s)</span>
                        <span className="text-muted">Pronto para ações em massa</span>
                    </div>
                )}
            </form>

            {showForm && (
                <div className="card space-y-6">
                    <div>
                        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted">
                            {editingId ? 'Atualização' : 'Cadastro'}
                        </p>
                        <h2 className="mt-2 text-2xl font-semibold text-foreground">
                            {editingId ? 'Editar ingrediente' : 'Novo ingrediente'}
                        </h2>
                    </div>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
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
                                <label htmlFor="cost_per_unit" className="text-sm font-medium text-muted">Custo por unidade*</label>
                                <input
                                    type="number"
                                    id="cost_per_unit"
                                    step="0.01"
                                    className="input"
                                    value={formData.cost_per_unit}
                                    onChange={(e) => setFormData({ ...formData, cost_per_unit: parseFloat(e.target.value) })}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="unit" className="text-sm font-medium text-muted">Unidade*</label>
                                <MeasurementUnitSelect
                                    id="unit"
                                    value={formData.unit}
                                    onValueChange={(value) => setFormData({ ...formData, unit: value })}
                                    includePlaceholder={false}
                                />
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="supplier" className="text-sm font-medium text-muted">Fornecedor</label>
                                <input
                                    type="text"
                                    id="supplier"
                                    className="input"
                                    value={formData.supplier}
                                    onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="lead_time_days" className="text-sm font-medium text-muted">Prazo de entrega (dias)</label>
                                <input
                                    type="number"
                                    id="lead_time_days"
                                    className="input"
                                    value={formData.lead_time_days}
                                    onChange={(e) => setFormData({ ...formData, lead_time_days: parseInt(e.target.value) || 0 })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="min_stock_level" className="text-sm font-medium text-muted">Estoque mínimo</label>
                                <input
                                    type="number"
                                    id="min_stock_level"
                                    step="0.01"
                                    className="input"
                                    value={formData.min_stock_level}
                                    onChange={(e) => setFormData({ ...formData, min_stock_level: parseFloat(e.target.value) || 0 })}
                                />
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            <button type="submit" className="btn btn-primary">
                                {editingId ? 'Atualizar ingrediente' : 'Criar ingrediente'}
                            </button>
                            <button type="button" className="btn btn-outline" onClick={resetForm}>
                                Limpar campos
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="card">
                <div className="flex flex-wrap items-center justify-between gap-4 pb-4">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted">Lista</p>
                        <h2 className="text-2xl font-semibold text-foreground">Ingredientes cadastrados</h2>
                    </div>
                    <span className="rounded-full bg-surface px-4 py-1 text-sm text-muted">
                        {ingredients.length} itens
                    </span>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 text-sm">
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            className="checkbox"
                            checked={allSelected}
                            onChange={toggleSelectAll}
                            aria-label="Selecionar todos"
                        />
                        <span className="text-muted">
                            {allSelected ? 'Todos selecionados' : `${selectedCount} selecionado(s)`}
                        </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <button
                            type="button"
                            className="btn btn-outline"
                            onClick={() => loadIngredients(appliedFilters)}
                        >
                            <RefreshCcw size={16} />
                            Atualizar
                        </button>
                        <button
                            type="button"
                            className="btn btn-danger"
                            disabled={!selectedCount}
                            onClick={openBulkDeleteDialog}
                        >
                            <Trash2 size={16} />
                            Excluir selecionados
                        </button>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full text-left text-sm">
                        <thead>
                            <tr className="border-y border-border/80 text-xs uppercase tracking-[0.3em] text-muted">
                                <th className="px-4 py-3">
                                    <span className="sr-only">Selecionar</span>
                                </th>
                                <th className="px-4 py-3 font-semibold">Nome</th>
                                <th className="px-4 py-3 text-right font-semibold">Custo/Un</th>
                                <th className="px-4 py-3 font-semibold">Unidade</th>
                                <th className="px-4 py-3 font-semibold">Fornecedor</th>
                                <th className="px-4 py-3 text-right font-semibold">Prazo</th>
                                <th className="px-4 py-3 text-right font-semibold">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {ingredients.map((ingredient) => (
                                <tr
                                    key={ingredient.id}
                                    className={`border-b border-border/60 last:border-0 ${selectedIds.includes(ingredient.id) ? 'bg-primary/5' : ''}`}
                                >
                                    <td className="px-4 py-4">
                                        <input
                                            type="checkbox"
                                            className="checkbox"
                                            checked={selectedIds.includes(ingredient.id)}
                                            onChange={() => toggleIngredientSelection(ingredient.id)}
                                            aria-label={`Selecionar ${ingredient.name}`}
                                        />
                                    </td>
                                    <td className="px-4 py-4 font-medium text-foreground">{ingredient.name}</td>
                                    <td className="px-4 py-4 text-right font-semibold text-primary">
                                        R$ {ingredient.cost_per_unit.toFixed(2)}
                                    </td>
                                    <td className="px-4 py-4 text-muted">{ingredient.unit}</td>
                                    <td className="px-4 py-4 text-muted">{ingredient.supplier || '-'}</td>
                                    <td className="px-4 py-4 text-right text-muted">
                                        {ingredient.lead_time_days ? `${ingredient.lead_time_days}d` : '-'}
                                    </td>
                                    <td className="px-4 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                className="btn btn-outline px-3 py-1.5 text-sm"
                                                onClick={() => handleEdit(ingredient)}
                                            >
                                                <Edit2 size={16} />
                                                Editar
                                            </button>
                                            <button
                                                className="btn btn-danger px-3 py-1.5 text-sm"
                                                onClick={() => handleDelete(ingredient.id)}
                                            >
                                                <Trash2 size={16} />
                                                Excluir
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {!hasIngredients && (
                        <div className="flex flex-col items-center justify-center gap-2 py-12 text-center text-muted">
                            <Package size={32} />
                            <p>Nenhum ingrediente cadastrado ainda.</p>
                            <p className="text-sm">Utilize o botão acima para adicionar seu primeiro ingrediente.</p>
                        </div>
                    )}
                </div>
            </div>

            <ConfirmDialog
                isOpen={deleteDialogOpen}
                onClose={() => setDeleteDialogOpen(false)}
                onConfirm={confirmDelete}
                title="Excluir Ingrediente"
                message="Tem certeza que deseja excluir este ingrediente? Esta ação não pode ser desfeita."
                confirmText="Excluir"
                cancelText="Cancelar"
                variant="danger"
            />
            <ConfirmDialog
                isOpen={bulkDialogOpen}
                onClose={() => setBulkDialogOpen(false)}
                onConfirm={confirmBulkDelete}
                title="Excluir ingredientes selecionados"
                message="Deseja realmente excluir todos os ingredientes selecionados? Esta ação é irreversível."
                confirmText={bulkLoading ? 'Excluindo...' : 'Excluir selecionados'}
                cancelText="Cancelar"
                variant="danger"
                confirmDisabled={bulkLoading}
                icon={bulkLoading ? <Loader2 className="animate-spin" size={20} /> : undefined}
            />
        </div>
    );
}
