import { useState, useEffect, useMemo, useRef } from 'react';
import {
    productsAPI,
    recipesAPI,
    categoriesAPI,
    Product,
    Recipe,
    Category,
    ProductListFilters,
    PricingSettings,
} from '../lib/apiClient';
import {
    Plus,
    X,
    Edit2,
    Trash2,
    ShoppingBag,
    Package,
    Barcode,
    DollarSign,
    TrendingUp,
    Layers,
    Warehouse,
    UploadCloud,
    Image as ImageIcon,
    AlertCircle,
    Filter,
    Search,
    Tags,
    RefreshCcw,
    CheckSquare,
    Loader2,
    Calculator,
    Sparkles,
    Info,
    CheckCircle2,
} from 'lucide-react';
import ConfirmDialog from '../components/ConfirmDialog';
import { MeasurementUnitSelect } from '../components/MeasurementUnitSelect';
import { DEFAULT_PRODUCT_UNIT } from '../lib/measurement';
import { useAuthStore } from '../store/authStore';
import { usePricingStore } from '../store/pricingStore';
import { useToast } from '../components/ToastProvider';

type ProductFormState = {
    name: string;
    description: string;
    sku: string;
    barcode: string;
    recipe_id: string;
    category_id: string;
    base_price: number;
    suggested_price: number;
    margin_percent: number;
    packaging_cost: number;
    stock_quantity: number;
    stock_unit: string;
    reorder_point: number;
    storage_location: string;
    active: boolean;
};

const INITIAL_FORM_STATE: ProductFormState = {
    name: '',
    description: '',
    sku: '',
    barcode: '',
    recipe_id: '',
    category_id: '',
    base_price: 0,
    suggested_price: 0,
    margin_percent: 0,
    packaging_cost: 0,
    stock_quantity: 0,
    stock_unit: DEFAULT_PRODUCT_UNIT,
    reorder_point: 0,
    storage_location: '',
    active: true,
};

const createInitialFormState = (settings?: PricingSettings | null): ProductFormState => ({
    ...INITIAL_FORM_STATE,
    margin_percent: settings?.default_margin_percent ?? INITIAL_FORM_STATE.margin_percent,
    packaging_cost: settings?.default_packaging_cost ?? INITIAL_FORM_STATE.packaging_cost,
});

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
});

const numberFormatter = new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
});

type ProductFilterState = {
    search: string;
    category_id: string;
    recipe_id: string;
    active: 'all' | 'active' | 'inactive';
    stock_status: 'all' | 'low' | 'out' | 'ok';
};

const createDefaultFilters = (): ProductFilterState => ({
    search: '',
    category_id: '',
    recipe_id: '',
    active: 'all',
    stock_status: 'all',
});

const ACTIVE_FILTER_LABELS: Record<ProductFilterState['active'], string> = {
    all: 'Todos',
    active: 'Apenas ativos',
    inactive: 'Apenas inativos',
};

const STOCK_FILTER_LABELS: Record<ProductFilterState['stock_status'], string> = {
    all: 'Qualquer estoque',
    low: 'Estoque baixo',
    out: 'Sem estoque',
    ok: 'Estoque saudável',
};

type PricingSimulationFormState = {
    fixed_monthly_costs: number;
    variable_cost_percent: number;
    labor_cost_per_minute: number;
    sales_volume_monthly: number;
    current_price: number;
};

const buildSimulationDefaults = (settings?: PricingSettings | null): PricingSimulationFormState => ({
    fixed_monthly_costs: settings?.fixed_monthly_costs ?? 0,
    variable_cost_percent: settings?.variable_cost_percent ?? 0,
    labor_cost_per_minute: settings?.labor_cost_per_minute ?? 0,
    sales_volume_monthly: settings?.default_sales_volume ?? 0,
    current_price: 0,
});

export default function Products() {
    const { hasHydrated, isAuthenticated } = useAuthStore();
    const {
        settings: pricingSettings,
        loadSettings: loadPricingSettings,
        suggestPrice,
        suggestion,
        suggesting,
        clearSuggestion,
    } = usePricingStore((state) => ({
        settings: state.settings,
        loadSettings: state.loadSettings,
        suggestPrice: state.suggestPrice,
        suggestion: state.suggestion,
        suggesting: state.suggesting,
        clearSuggestion: state.clearSuggestion,
    }));
    const { pushToast } = useToast();
    const [products, setProducts] = useState<Product[]>([]);
    const [recipes, setRecipes] = useState<Recipe[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [pricingConfigError, setPricingConfigError] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [productToDelete, setProductToDelete] = useState<string | null>(null);
    const [formData, setFormData] = useState<ProductFormState>(() => createInitialFormState());
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [filters, setFilters] = useState(createDefaultFilters);
    const [appliedFilters, setAppliedFilters] = useState(createDefaultFilters);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
    const [bulkLoading, setBulkLoading] = useState(false);
    const [simulationParams, setSimulationParams] = useState<PricingSimulationFormState>(() => buildSimulationDefaults());
    const [suggestionError, setSuggestionError] = useState('');
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const formCardRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (hasHydrated && isAuthenticated) {
            loadData();
            loadPricingSettings().catch(() => {
                setPricingConfigError('Não foi possível carregar os parâmetros de precificação.');
            });
        } else if (hasHydrated && !isAuthenticated) {
            setLoading(false);
        }
    }, [hasHydrated, isAuthenticated, loadPricingSettings]);

    useEffect(() => {
        if (showForm && formCardRef.current) {
            formCardRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, [showForm, editingId]);

    useEffect(() => {
        if (!pricingSettings) return;

        if (!editingId) {
            setFormData((prev) => ({
                ...prev,
                margin_percent: prev.margin_percent || pricingSettings.default_margin_percent,
                packaging_cost: prev.packaging_cost || pricingSettings.default_packaging_cost,
            }));
        }

        setSimulationParams((prev) => ({
            ...prev,
            fixed_monthly_costs: prev.fixed_monthly_costs || pricingSettings.fixed_monthly_costs,
            variable_cost_percent: prev.variable_cost_percent || pricingSettings.variable_cost_percent,
            labor_cost_per_minute: prev.labor_cost_per_minute || pricingSettings.labor_cost_per_minute,
            sales_volume_monthly: prev.sales_volume_monthly || pricingSettings.default_sales_volume,
        }));
    }, [pricingSettings, editingId]);

    useEffect(() => {
        const nextPrice = formData.suggested_price || 0;
        setSimulationParams((prev) =>
            Math.abs(prev.current_price - nextPrice) < 0.01
                ? prev
                : { ...prev, current_price: nextPrice }
        );
    }, [formData.suggested_price]);

    const buildFilterParams = (state: ProductFilterState): Partial<ProductListFilters> => {
        const params: Partial<ProductListFilters> = {};
        if (state.search.trim()) {
            params.search = state.search.trim();
        }
        if (state.category_id) {
            params.category_id = state.category_id;
        }
        if (state.recipe_id) {
            params.recipe_id = state.recipe_id;
        }
        if (state.active === 'active') {
            params.active = true;
        } else if (state.active === 'inactive') {
            params.active = false;
        }
        if (state.stock_status !== 'all') {
            params.stock_status = state.stock_status;
        }
        return params;
    };

    const loadData = async ({ silent = false, filtersOverride }: { silent?: boolean; filtersOverride?: ProductFilterState } = {}) => {
        if (silent) {
            setRefreshing(true);
        } else {
            setLoading(true);
        }

        try {
            const [productsRes, recipesRes, categoriesRes] = await Promise.all([
                productsAPI.list(buildFilterParams(filtersOverride ?? appliedFilters)),
                recipesAPI.list(),
                categoriesAPI.list('product'),
            ]);
            setProducts(productsRes.data || []);
            setRecipes(recipesRes.data || []);
            setCategories(categoriesRes.data || []);
            setSelectedIds([]);
        } catch (err: any) {
            const message = err?.response?.data?.error || 'Erro ao carregar dados';
            pushToast({ variant: 'error', title: 'Produtos', description: message });
        } finally {
            if (silent) {
                setRefreshing(false);
            } else {
                setLoading(false);
            }
        }
    };

    const handleApplyFilters = (e: React.FormEvent) => {
        e.preventDefault();
        const next = { ...filters };
        setAppliedFilters(next);
        loadData({ filtersOverride: next });
    };

    const handleClearFilters = () => {
        const next = createDefaultFilters();
        setFilters(next);
        setAppliedFilters(next);
        loadData({ filtersOverride: next });
    };

    const handleSimulationFieldChange = (field: keyof PricingSimulationFormState, value: string | boolean) => {
        setSuggestionError('');
        setSimulationParams((prev) => ({
            ...prev,
            [field]: typeof value === 'boolean'
                ? value
                : value === ''
                    ? 0
                    : Number(value) || 0,
        }));
    };

    const handleSuggestPrice = async () => {
        if (!formData.recipe_id && !editingId) {
            setSuggestionError('Selecione uma receita vinculada ao produto para simular o preço.');
            return;
        }
        setSuggestionError('');
        try {
            await suggestPrice({
                recipe_id: formData.recipe_id || undefined,
                product_id: editingId || undefined,
                margin_percent: formData.margin_percent || undefined,
                packaging_cost: formData.packaging_cost || undefined,
                current_price: simulationParams.current_price || undefined,
                fixed_monthly_costs: simulationParams.fixed_monthly_costs || undefined,
                variable_cost_percent: simulationParams.variable_cost_percent || undefined,
                labor_cost_per_minute: simulationParams.labor_cost_per_minute || undefined,
                sales_volume_monthly: simulationParams.sales_volume_monthly || undefined,
            });
        } catch (err: any) {
            setSuggestionError(err.response?.data?.error || 'Não foi possível gerar a simulação agora.');
        }
    };

    const applySuggestionToForm = () => {
        if (!suggestion) return;
        setFormData((prev) => ({
            ...prev,
            base_price: suggestion.unit_cost,
            suggested_price: suggestion.suggested_price,
            margin_percent: suggestion.margin_percent,
        }));
        setSimulationParams((prev) => ({
            ...prev,
            current_price: suggestion.suggested_price,
        }));
    };

    const clearSuggestionState = () => {
        clearSuggestion();
        setSuggestionError('');
    };

    const toggleProductSelection = (id: string) => {
        setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((selected) => selected !== id) : [...prev, id]
        );
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === products.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(products.map((product) => product.id));
        }
    };

    const openBulkDialog = () => {
        if (!selectedIds.length) return;
        setBulkDialogOpen(true);
    };

    const confirmBulkDelete = async () => {
        if (!selectedIds.length) return;
        setBulkLoading(true);
        try {
            await productsAPI.bulkDelete(selectedIds);
            setBulkDialogOpen(false);
            setSelectedIds([]);
            await loadData({ silent: true });
            pushToast({
                variant: 'success',
                title: 'Produtos',
                description: 'Produtos selecionados excluídos com sucesso.',
            });
        } catch (err: any) {
            const message = err?.response?.data?.error || 'Erro ao excluir produtos selecionados';
            pushToast({ variant: 'error', title: 'Produtos', description: message });
        } finally {
            setBulkLoading(false);
        }
    };

    const categoryLookup = useMemo(() => {
        const map = new Map<string, Category>();
        categories.forEach((category) => {
            map.set(category.id, category);
        });
        return map;
    }, [categories]);

    const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) {
            clearImageSelection();
            return;
        }

        if (imagePreview && imagePreview.startsWith('blob:')) {
            URL.revokeObjectURL(imagePreview);
        }

        setImageFile(file);
        setImagePreview(URL.createObjectURL(file));
    };

    const clearImageSelection = () => {
        if (imagePreview && imagePreview.startsWith('blob:')) {
            URL.revokeObjectURL(imagePreview);
        }
        setImageFile(null);
        setImagePreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    useEffect(() => {
        return () => {
            if (imagePreview && imagePreview.startsWith('blob:')) {
                URL.revokeObjectURL(imagePreview);
            }
        };
    }, [imagePreview]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            const data = {
                ...formData,
                recipe_id: formData.recipe_id || undefined,
                category_id: formData.category_id || undefined,
            };
            let productId = editingId;
            if (editingId) {
                await productsAPI.update(editingId, data);
            } else {
                const response = await productsAPI.create(data);
                productId = response.data.id;
            }

            if (imageFile && productId) {
                await productsAPI.uploadImage(productId, imageFile);
            }

            pushToast({
                variant: 'success',
                title: 'Produtos',
                description: editingId ? 'Produto atualizado com sucesso.' : 'Produto criado com sucesso.',
            });
            resetForm();
            await loadData({ silent: true });
        } catch (err: any) {
            const message = err?.response?.data?.error || 'Erro ao salvar produto';
            pushToast({ variant: 'error', title: 'Produtos', description: message });
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = async (product: Product) => {
        try {
            const response = await productsAPI.getByID(product.id);
            const fullProduct = response.data;
            setFormData({
                name: fullProduct.name,
                description: fullProduct.description || '',
                sku: fullProduct.sku || '',
                barcode: fullProduct.barcode || '',
                recipe_id: fullProduct.recipe_id || '',
                category_id: fullProduct.category_id || '',
                base_price: fullProduct.base_price,
                suggested_price: fullProduct.suggested_price,
                margin_percent: fullProduct.margin_percent,
                packaging_cost: fullProduct.packaging_cost || 0,
                stock_quantity: fullProduct.stock_quantity || 0,
                stock_unit: fullProduct.stock_unit || DEFAULT_PRODUCT_UNIT,
                reorder_point: fullProduct.reorder_point || 0,
                storage_location: fullProduct.storage_location || '',
                active: fullProduct.active,
            });
            setEditingId(product.id);
            setShowForm(true);
            setImageFile(null);
            setImagePreview(fullProduct.image_url || null);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
            setSimulationParams((prev) => ({
                ...prev,
                current_price: fullProduct.suggested_price || 0,
            }));
            clearSuggestionState();
        } catch (err: any) {
            const message = err?.response?.data?.error || 'Erro ao carregar produto';
            pushToast({ variant: 'error', title: 'Produtos', description: message });
        }
    };

    const handleDelete = async (id: string) => {
        setProductToDelete(id);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (!productToDelete) return;

        try {
            await productsAPI.delete(productToDelete);
            await loadData({ silent: true });
            setProductToDelete(null);
            pushToast({ variant: 'success', title: 'Produtos', description: 'Produto excluído com sucesso.' });
        } catch (err: any) {
            const message = err?.response?.data?.error || 'Erro ao excluir produto';
            pushToast({ variant: 'error', title: 'Produtos', description: message });
        }
    };

    const resetForm = () => {
        setFormData(createInitialFormState(pricingSettings));
        setEditingId(null);
        setShowForm(false);
        clearImageSelection();
        clearSuggestionState();
        setSimulationParams(buildSimulationDefaults(pricingSettings));
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-32">
                <div className="spinner" />
                <p className="mt-4 text-sm text-muted">Carregando produtos...</p>
            </div>
        );
    }

    const hasProducts = products.length > 0;
    const selectedCount = selectedIds.length;
    const allSelected = hasProducts && selectedCount === products.length;

    return (
        <div className="space-y-10">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.4em] text-muted">Catálogo</p>
                    <h1 className="mt-2 flex items-center gap-3 text-3xl font-semibold text-foreground">
                        <span className="rounded-2xl bg-warning/10 p-2 text-warning">
                            <ShoppingBag size={28} strokeWidth={2} />
                        </span>
                        Produtos
                    </h1>
                </div>
                <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
                    {showForm ? (
                        <>
                            <X size={18} />
                            Cancelar
                        </>
                    ) : (
                        <>
                            <Plus size={18} />
                            Novo produto
                        </>
                    )}
                </button>
            </div>

            <form onSubmit={handleApplyFilters} className="card space-y-4">
                <div className="flex items-center gap-3 text-muted">
                    <span className="rounded-full bg-warning/10 p-2 text-warning">
                        <Filter size={18} />
                    </span>
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.3em]">Filtros</p>
                        <p className="text-sm">Refine o catálogo por categoria, receita ou disponibilidade</p>
                    </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                    <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">Busca</label>
                        <div className="input flex items-center gap-2">
                            <Search size={16} className="text-muted" />
                            <input
                                type="text"
                                className="w-full bg-transparent outline-none"
                                placeholder="Nome ou descrição"
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
                    <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">Receita</label>
                        <select
                            className="input"
                            value={filters.recipe_id}
                            onChange={(e) => setFilters({ ...filters, recipe_id: e.target.value })}
                        >
                            <option value="">Todas</option>
                            {recipes.map((recipe) => (
                                <option key={recipe.id} value={recipe.id}>
                                    {recipe.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">Status</label>
                        <select
                            className="input"
                            value={filters.active}
                            onChange={(e) => setFilters({ ...filters, active: e.target.value as ProductFilterState['active'] })}
                        >
                            {Object.entries(ACTIVE_FILTER_LABELS).map(([value, label]) => (
                                <option key={value} value={value}>
                                    {label}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">Estoque</label>
                        <select
                            className="input"
                            value={filters.stock_status}
                            onChange={(e) => setFilters({ ...filters, stock_status: e.target.value as ProductFilterState['stock_status'] })}
                        >
                            {Object.entries(STOCK_FILTER_LABELS).map(([value, label]) => (
                                <option key={value} value={value}>
                                    {label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3">
                    {selectedCount > 0 && (
                        <div className="flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm text-primary">
                            <CheckSquare size={16} />
                            <span>{selectedCount} produto(s) selecionado(s)</span>
                        </div>
                    )}
                    <div className="flex flex-wrap gap-2">
                        <button type="button" className="btn btn-ghost" onClick={() => loadData({ silent: true })}>
                            <RefreshCcw size={16} />
                        </button>
                        <button type="button" className="btn btn-outline" onClick={handleClearFilters}>
                            Limpar
                        </button>
                        <button type="submit" className="btn btn-primary">
                            Aplicar
                        </button>
                    </div>
                </div>
            </form>

            {showForm && (
                <div ref={formCardRef} className="card space-y-6">
                    <div>
                        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted">
                            {editingId ? 'Atualização' : 'Cadastro'}
                        </p>
                        <h2 className="mt-2 text-2xl font-semibold text-foreground">
                            {editingId ? 'Editar produto' : 'Novo produto'}
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
                                <label htmlFor="sku" className="text-sm font-medium text-muted">SKU</label>
                                <input
                                    type="text"
                                    id="sku"
                                    className="input"
                                    value={formData.sku}
                                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="barcode" className="text-sm font-medium text-muted">Código de barras</label>
                                <input
                                    type="text"
                                    id="barcode"
                                    className="input"
                                    value={formData.barcode}
                                    onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="recipe_id" className="text-sm font-medium text-muted">Receita vinculada</label>
                                <select
                                    id="recipe_id"
                                    className="select"
                                    value={formData.recipe_id}
                                    onChange={(e) => setFormData({ ...formData, recipe_id: e.target.value })}
                                >
                                    <option value="">Sem receita</option>
                                    {recipes?.map((recipe) => (
                                        <option key={recipe.id} value={recipe.id}>
                                            {recipe.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="category_id" className="text-sm font-medium text-muted">Categoria</label>
                                <select
                                    id="category_id"
                                    className="select"
                                    value={formData.category_id}
                                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                                >
                                    <option value="">Sem categoria</option>
                                    {categories.map((category) => (
                                        <option key={category.id} value={category.id}>
                                            {category.name}
                                        </option>
                                    ))}
                                </select>
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

                        <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-5">
                            <div className="space-y-2">
                                <label htmlFor="base_price" className="text-sm font-medium text-muted">Preço base*</label>
                                <input
                                    type="number"
                                    id="base_price"
                                    step="0.01"
                                    className="input"
                                    value={formData.base_price}
                                    onChange={(e) => setFormData({ ...formData, base_price: parseFloat(e.target.value) || 0 })}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="suggested_price" className="text-sm font-medium text-muted">Preço sugerido*</label>
                                <input
                                    type="number"
                                    id="suggested_price"
                                    step="0.01"
                                    className="input"
                                    value={formData.suggested_price}
                                    onChange={(e) => setFormData({ ...formData, suggested_price: parseFloat(e.target.value) || 0 })}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="margin_percent" className="text-sm font-medium text-muted">Margem (%)*</label>
                                <input
                                    type="number"
                                    id="margin_percent"
                                    step="0.01"
                                    className="input"
                                    value={formData.margin_percent}
                                    onChange={(e) => setFormData({ ...formData, margin_percent: parseFloat(e.target.value) || 0 })}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="packaging_cost" className="text-sm font-medium text-muted">Custo de embalagem</label>
                                <input
                                    type="number"
                                    id="packaging_cost"
                                    step="0.01"
                                    className="input"
                                    value={formData.packaging_cost}
                                    onChange={(e) => setFormData({ ...formData, packaging_cost: parseFloat(e.target.value) || 0 })}
                                />
                            </div>
                        </div>

                        <div className="space-y-4 rounded-2xl border border-border/60 bg-muted/5 p-4">
                            <div className="flex items-start gap-3">
                                <span className="rounded-2xl bg-warning/10 p-2 text-warning">
                                    <Calculator size={22} />
                                </span>
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted">Simulador</p>
                                    <h3 className="text-lg font-semibold text-foreground">Preço sugerido em tempo real</h3>
                                    <p className="text-sm text-muted">Use os parâmetros padrão do tenant e ajuste conforme necessário para ver custos, impostos e margem antes de salvar.</p>
                                </div>
                            </div>

                            {pricingConfigError && (
                                <div className="rounded-2xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
                                    {pricingConfigError}
                                </div>
                            )}

                            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-muted" htmlFor="fixed_monthly_costs">Custos fixos rateados (R$)</label>
                                    <input
                                        id="fixed_monthly_costs"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        className="input"
                                        value={simulationParams.fixed_monthly_costs}
                                        onChange={(e) => handleSimulationFieldChange('fixed_monthly_costs', e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-muted" htmlFor="variable_cost_percent">Custos variáveis (%)</label>
                                    <input
                                        id="variable_cost_percent"
                                        type="number"
                                        step="0.1"
                                        min="0"
                                        className="input"
                                        value={simulationParams.variable_cost_percent}
                                        onChange={(e) => handleSimulationFieldChange('variable_cost_percent', e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-muted" htmlFor="labor_cost_per_minute">Mão de obra (R$/min)</label>
                                    <input
                                        id="labor_cost_per_minute"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        className="input"
                                        value={simulationParams.labor_cost_per_minute}
                                        onChange={(e) => handleSimulationFieldChange('labor_cost_per_minute', e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-muted" htmlFor="sales_volume_monthly">Volume mensal (un)</label>
                                    <input
                                        id="sales_volume_monthly"
                                        type="number"
                                        step="1"
                                        min="0"
                                        className="input"
                                        value={simulationParams.sales_volume_monthly}
                                        onChange={(e) => handleSimulationFieldChange('sales_volume_monthly', e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-muted" htmlFor="current_price">Preço atual praticado</label>
                                    <input
                                        id="current_price"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        className="input"
                                        value={simulationParams.current_price}
                                        onChange={(e) => handleSimulationFieldChange('current_price', e.target.value)}
                                    />
                                </div>
                                {pricingSettings && (
                                    <div className="rounded-2xl border border-border/40 bg-background/60 p-4 text-sm text-muted">
                                        <div className="flex items-center gap-2 text-foreground">
                                            <Info size={16} />
                                            <span>Referências atuais</span>
                                        </div>
                                        <ul className="mt-2 space-y-1">
                                            <li>Margem padrão: <strong>{pricingSettings.default_margin_percent}%</strong></li>
                                            <li>Embalagem: <strong>{currencyFormatter.format(pricingSettings.default_packaging_cost)}</strong></li>
                                            <li>Custos fixos: <strong>{currencyFormatter.format(pricingSettings.fixed_monthly_costs)}/mês</strong></li>
                                            <li>Custos variáveis: <strong>{pricingSettings.variable_cost_percent}%</strong></li>
                                        </ul>
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-wrap gap-3">
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={handleSuggestPrice}
                                    disabled={suggesting}
                                >
                                    <Sparkles size={18} />
                                    {suggesting ? 'Calculando...' : 'Calcular preço sugerido'}
                                </button>
                                {suggestion && (
                                    <>
                                        <button type="button" className="btn btn-outline" onClick={applySuggestionToForm}>
                                            <CheckCircle2 size={18} />
                                            Aplicar no formulário
                                        </button>
                                        <button type="button" className="btn btn-ghost" onClick={clearSuggestionState}>
                                            <X size={18} />
                                            Limpar simulação
                                        </button>
                                    </>
                                )}
                            </div>

                            {suggestionError && (
                                <div className="rounded-2xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
                                    {suggestionError}
                                </div>
                            )}

                            {suggestion && (
                                <div className="space-y-4">
                                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                                        <div className="rounded-2xl border border-border/40 bg-background/80 p-4">
                                            <p className="text-xs uppercase tracking-[0.3em] text-muted">Custo unitário</p>
                                            <p className="mt-2 text-2xl font-semibold text-foreground">{currencyFormatter.format(suggestion.unit_cost)}</p>
                                        </div>
                                        <div className="rounded-2xl border border-border/40 bg-background/80 p-4">
                                            <p className="text-xs uppercase tracking-[0.3em] text-muted">Custo total/unidade</p>
                                            <p className="mt-2 text-2xl font-semibold text-foreground">{currencyFormatter.format(suggestion.total_cost_per_unit)}</p>
                                        </div>
                                        <div className="rounded-2xl border border-border/40 bg-background/80 p-4">
                                            <p className="text-xs uppercase tracking-[0.3em] text-muted">Preço sugerido</p>
                                            <p className="mt-2 text-2xl font-semibold text-primary">{currencyFormatter.format(suggestion.suggested_price)}</p>
                                        </div>
                                        <div className="rounded-2xl border border-border/40 bg-background/80 p-4">
                                            <p className="text-xs uppercase tracking-[0.3em] text-muted">Markup</p>
                                            <p className="mt-2 text-2xl font-semibold text-foreground">{suggestion.markup.toFixed(2)}%</p>
                                        </div>
                                        <div className="rounded-2xl border border-border/40 bg-background/80 p-4">
                                            <p className="text-xs uppercase tracking-[0.3em] text-muted">Margem contribuição</p>
                                            <p className="mt-2 text-2xl font-semibold text-foreground">{currencyFormatter.format(suggestion.contribution_margin)}</p>
                                        </div>
                                        <div className="rounded-2xl border border-border/40 bg-background/80 p-4">
                                            <p className="text-xs uppercase tracking-[0.3em] text-muted">% Contribuição</p>
                                            <p className="mt-2 text-2xl font-semibold text-foreground">{suggestion.contribution_margin_pct.toFixed(2)}%</p>
                                        </div>
                                        <div className="rounded-2xl border border-border/40 bg-background/80 p-4">
                                            <p className="text-xs uppercase tracking-[0.3em] text-muted">Ponto de equilíbrio</p>
                                            <p className="mt-2 text-2xl font-semibold text-foreground">{currencyFormatter.format(suggestion.break_even_price)}</p>
                                        </div>
                                        <div className="rounded-2xl border border-border/40 bg-background/80 p-4">
                                            <p className="text-xs uppercase tracking-[0.3em] text-muted">Diferença vs atual</p>
                                            <p className={`mt-2 text-2xl font-semibold ${suggestion.delta_vs_current >= 0 ? 'text-success' : 'text-danger'}`}>
                                                {currencyFormatter.format(suggestion.delta_vs_current)} ({suggestion.delta_percent.toFixed(2)}%)
                                            </p>
                                        </div>
                                    </div>

                                    <div className="rounded-2xl border border-border/40 bg-background/80 p-4">
                                        <p className="text-xs uppercase tracking-[0.3em] text-muted">Componentes do cálculo</p>
                                        <dl className="mt-3 grid gap-3 text-sm md:grid-cols-2 xl:grid-cols-3">
                                            <div>
                                                <dt className="text-muted">Ingredientes</dt>
                                                <dd className="text-foreground font-semibold">{currencyFormatter.format(suggestion.components.ingredient_cost)}</dd>
                                            </div>
                                            <div>
                                                <dt className="text-muted">Mão de obra</dt>
                                                <dd className="text-foreground font-semibold">{currencyFormatter.format(suggestion.components.labor_cost)}</dd>
                                            </div>
                                            <div>
                                                <dt className="text-muted">Embalagem</dt>
                                                <dd className="text-foreground font-semibold">{currencyFormatter.format(suggestion.components.packaging_cost)}</dd>
                                            </div>
                                            <div>
                                                <dt className="text-muted">Custos fixos por unidade</dt>
                                                <dd className="text-foreground font-semibold">{currencyFormatter.format(suggestion.components.fixed_cost_per_unit)}</dd>
                                            </div>
                                            <div>
                                                <dt className="text-muted">Custos variáveis</dt>
                                                <dd className="text-foreground font-semibold">{currencyFormatter.format(suggestion.components.variable_cost_unit)}</dd>
                                            </div>
                                            <div>
                                                <dt className="text-muted">Volume considerado</dt>
                                                <dd className="text-foreground font-semibold">{numberFormatter.format(suggestion.components.sales_volume_monthly)} un</dd>
                                            </div>
                                        </dl>
                                    </div>

                                    {suggestion.flags.missing_sales_volume && (
                                        <div className="flex items-center gap-2 rounded-2xl bg-warning/10 px-4 py-3 text-sm text-warning">
                                            <AlertCircle size={16} />
                                            Sem volume mensal informado: os custos fixos foram rateados por 1 unidade.
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                            <div className="space-y-2">
                                <label htmlFor="stock_quantity" className="text-sm font-medium text-muted">Quantidade em estoque</label>
                                <input
                                    type="number"
                                    id="stock_quantity"
                                    step="0.01"
                                    className="input"
                                    value={formData.stock_quantity}
                                    onChange={(e) => setFormData({ ...formData, stock_quantity: parseFloat(e.target.value) || 0 })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="stock_unit" className="text-sm font-medium text-muted">Unidade</label>
                                <MeasurementUnitSelect
                                    id="stock_unit"
                                    value={formData.stock_unit}
                                    onValueChange={(value) => setFormData({ ...formData, stock_unit: value })}
                                    includePlaceholder={false}
                                    allowedTypes={['unit', 'portion', 'mass', 'volume']}
                                />
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="reorder_point" className="text-sm font-medium text-muted">Ponto de reposição</label>
                                <input
                                    type="number"
                                    id="reorder_point"
                                    step="0.01"
                                    className="input"
                                    value={formData.reorder_point}
                                    onChange={(e) => setFormData({ ...formData, reorder_point: parseFloat(e.target.value) || 0 })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="storage_location" className="text-sm font-medium text-muted">Local de armazenagem</label>
                                <input
                                    type="text"
                                    id="storage_location"
                                    className="input"
                                    value={formData.storage_location}
                                    onChange={(e) => setFormData({ ...formData, storage_location: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center gap-2 text-sm font-medium text-muted">
                                <ImageIcon size={16} />
                                Imagem do produto (máx. 5MB)
                            </div>
                            <div className="grid gap-3 md:grid-cols-[minmax(0,320px)_1fr]">
                                <div className="flex flex-col gap-3">
                                    <div className="relative overflow-hidden rounded-2xl border border-dashed border-border/60 bg-muted/10 p-4">
                                        {imagePreview ? (
                                            <img
                                                src={imagePreview}
                                                alt="Pré-visualização do produto"
                                                className="h-60 w-full rounded-xl object-cover"
                                            />
                                        ) : (
                                            <div className="flex h-60 flex-col items-center justify-center gap-3 text-center text-muted">
                                                <UploadCloud size={28} />
                                                <p className="text-sm">Arraste uma imagem ou selecione um arquivo</p>
                                                <p className="text-xs text-muted">Formatos suportados: JPG, PNG, WEBP</p>
                                            </div>
                                        )}
                                        <label className="btn btn-outline absolute inset-x-3 bottom-3 flex items-center justify-center gap-2">
                                            <UploadCloud size={16} />
                                            Selecionar arquivo
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                accept="image/*"
                                                className="sr-only"
                                                onChange={handleImageChange}
                                            />
                                        </label>
                                    </div>
                                    {imagePreview && (
                                        <button type="button" className="btn btn-ghost" onClick={clearImageSelection}>
                                            <X size={16} />
                                            Remover imagem
                                        </button>
                                    )}
                                </div>
                                <div className="rounded-2xl border border-border/40 bg-muted/5 p-4 text-sm text-muted">
                                    <div className="flex items-center gap-2 text-foreground">
                                        <AlertCircle size={16} />
                                        <strong className="text-sm">Dicas rápidas</strong>
                                    </div>
                                    <ul className="mt-3 list-disc space-y-2 pl-4">
                                        <li>Use imagens com proporção 4:3 ou quadrada para melhor encaixe.</li>
                                        <li>Mantenha o fundo limpo para destacar o produto.</li>
                                        <li>Arquivos acima de 5MB são rejeitados automaticamente.</li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        <label className="flex items-center gap-3 text-sm font-medium text-muted">
                            <input
                                type="checkbox"
                                className="h-4 w-4 rounded border-border text-primary focus:ring-primary/40"
                                checked={formData.active}
                                onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                            />
                            Produto ativo
                        </label>

                        <div className="flex flex-wrap gap-3">
                            <button type="submit" className="btn btn-primary" disabled={saving}>
                                {saving ? 'Salvando...' : editingId ? 'Atualizar produto' : 'Salvar produto'}
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
                    <div className="flex flex-wrap items-center gap-3 text-sm text-muted">
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                className="checkbox"
                                checked={allSelected}
                                onChange={toggleSelectAll}
                                aria-label="Selecionar todos os produtos"
                            />
                            <span>{allSelected ? 'Todos selecionados' : `${selectedCount} selecionado(s)`}</span>
                        </div>
                        {refreshing && <span className="text-primary">Atualizando catálogo...</span>}
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <button type="button" className="btn btn-outline" onClick={() => loadData({ silent: true })}>
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
                            Excluir selecionados
                        </button>
                    </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                    {products.map((product) => (
                        <div
                            key={product.id}
                            className={`relative card flex flex-col gap-4 ${product.active ? '' : 'opacity-70'} ${selectedIds.includes(product.id) ? 'ring-2 ring-warning/40' : ''}`}
                        >
                            <label className="absolute right-4 top-4 flex items-center gap-2 text-xs text-muted">
                                <input
                                    type="checkbox"
                                    className="checkbox"
                                    checked={selectedIds.includes(product.id)}
                                    onChange={() => toggleProductSelection(product.id)}
                                    aria-label={`Selecionar ${product.name}`}
                                />
                                Selecionar
                            </label>
                            {product.image_url && (
                                <div className="overflow-hidden rounded-2xl border border-border/40">
                                    <img
                                        src={product.image_url}
                                        alt={product.name}
                                        className="h-48 w-full object-cover"
                                    />
                                </div>
                            )}
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted">{product.active ? 'Disponível' : 'Inativo'}</p>
                                    <h3 className="mt-2 text-xl font-semibold text-foreground">{product.name}</h3>
                                    {product.category_id && categoryLookup.get(product.category_id) && (
                                        <span className="mt-2 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                                            {categoryLookup.get(product.category_id)?.name}
                                        </span>
                                    )}
                                </div>
                                {!product.active && (
                                    <span className="rounded-full bg-warning/20 px-3 py-1 text-xs font-semibold text-warning">INATIVO</span>
                                )}
                            </div>

                            {product.description && <p className="text-sm text-muted">{product.description}</p>}

                            <div className="grid gap-3 text-sm">
                                {product.sku && (
                                    <p className="flex items-center gap-2 text-muted">
                                        <Package size={14} /> SKU: {product.sku}
                                    </p>
                                )}
                                {product.barcode && (
                                    <p className="flex items-center gap-2 text-muted">
                                        <Barcode size={14} /> Código: {product.barcode}
                                    </p>
                                )}
                                <p className="flex items-center gap-2 text-foreground">
                                    <DollarSign size={14} /> Preço base: R$ {product.base_price.toFixed(2)}
                                </p>
                                <p className="flex items-center gap-2 text-lg font-semibold text-primary">
                                    <DollarSign size={16} /> Preço sugerido: R$ {product.suggested_price.toFixed(2)}
                                </p>
                                <p className="flex items-center gap-2 text-foreground">
                                    <TrendingUp size={14} /> Margem: {product.margin_percent}%
                                </p>
                                {product.packaging_cost > 0 && (
                                    <p className="flex items-center gap-2 text-foreground">
                                        <Package size={14} /> Embalagem: R$ {product.packaging_cost.toFixed(2)}
                                    </p>
                                )}
                                <p className="flex items-center gap-2 text-foreground">
                                    <Layers size={14} /> Estoque: {numberFormatter.format(product.stock_quantity || 0)} {product.stock_unit?.toUpperCase() || DEFAULT_PRODUCT_UNIT.toUpperCase()}
                                </p>
                                {((product.reorder_point ?? 0) > 0) && (
                                    <p className="flex items-center gap-2 text-warning">
                                        <AlertCircle size={14} /> Reposição: {numberFormatter.format(product.reorder_point ?? 0)} {product.stock_unit?.toUpperCase() || DEFAULT_PRODUCT_UNIT.toUpperCase()}
                                    </p>
                                )}
                                {product.storage_location && (
                                    <p className="flex items-center gap-2 text-muted">
                                        <Warehouse size={14} /> Local: {product.storage_location}
                                    </p>
                                )}
                            </div>

                            {product.pricing_summary && (
                                <div className="rounded-2xl border border-border/60 bg-muted/10 p-4">
                                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted">Resumo financeiro</p>
                                    <div className="mt-3 grid gap-3 text-sm md:grid-cols-2">
                                        <div>
                                            <p className="text-muted">Custo unitário</p>
                                            <p className="text-lg font-semibold text-foreground">{currencyFormatter.format(product.pricing_summary.unit_cost)}</p>
                                        </div>
                                        <div>
                                            <p className="text-muted">Margem líquida</p>
                                            <p className="text-lg font-semibold text-foreground">{currencyFormatter.format(product.pricing_summary.margin_value)}</p>
                                        </div>
                                        <div>
                                            <p className="text-muted">Ponto de equilíbrio</p>
                                            <p className="text-lg font-semibold text-foreground">{currencyFormatter.format(product.pricing_summary.break_even_price)}</p>
                                        </div>
                                        {product.pricing_summary.contribution_margin && (
                                            <div>
                                                <p className="text-muted">Margem contribuição</p>
                                                <p className="text-lg font-semibold text-foreground">{currencyFormatter.format(product.pricing_summary.contribution_margin)} ({product.pricing_summary.contribution_margin_pct?.toFixed(1)}%)</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            <div className="flex gap-3">
                                <button className="btn btn-outline flex-1" onClick={() => handleEdit(product)}>
                                    <Edit2 size={16} />
                                    Editar
                                </button>
                                <button className="btn btn-danger flex-1" onClick={() => handleDelete(product.id)}>
                                    <Trash2 size={16} />
                                    Excluir
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {!hasProducts && (
                <div className="card text-center text-muted">
                    <p className="py-10">Nenhum produto cadastrado ainda.</p>
                </div>
            )}

            <ConfirmDialog
                isOpen={deleteDialogOpen}
                onClose={() => setDeleteDialogOpen(false)}
                onConfirm={confirmDelete}
                title="Excluir Produto"
                message="Tem certeza que deseja excluir este produto? Esta ação não pode ser desfeita."
                confirmText="Excluir"
                cancelText="Cancelar"
                variant="danger"
            />
            <ConfirmDialog
                isOpen={bulkDialogOpen}
                onClose={() => setBulkDialogOpen(false)}
                onConfirm={confirmBulkDelete}
                title="Excluir produtos selecionados"
                message="Deseja realmente excluir todos os produtos selecionados? Esta ação não pode ser desfeita."
                confirmText={bulkLoading ? 'Excluindo...' : 'Excluir selecionados'}
                cancelText="Cancelar"
                variant="danger"
                confirmDisabled={bulkLoading}
                icon={bulkLoading ? <Loader2 className="animate-spin" size={20} /> : undefined}
            />
        </div>
    );
}
