import api from './api';

export interface Ingredient {
    id: string;
    tenant_id: string;
    name: string;
    unit: string;
    cost_per_unit: number;
    supplier: string;
    lead_time_days: number;
    min_stock_level: number;
    notes: string;
    created_at: string;
    updated_at: string;
}

export interface Recipe {
    id: string;
    tenant_id: string;
    name: string;
    description: string;
    yield_quantity: number;
    yield_unit: string;
    production_time: number;
    notes: string;
    items: RecipeItem[];
    cost_summary?: RecipeSummary;
    created_at: string;
    updated_at: string;
}

export interface RecipeItem {
    id: string;
    tenant_id: string;
    recipe_id: string;
    ingredient_id: string;
    quantity: number;
    unit: string;
    waste_factor: number;
}

export interface RecipeSummary {
    yield_quantity: number;
    ingredient_cost: number;
    ingredient_cost_per_unit: number;
    labor_cost: number;
    labor_cost_per_unit: number;
    packaging_cost: number;
    packaging_cost_per_unit: number;
    total_cost: number;
    cost_per_unit: number;
}

export interface Product {
    id: string;
    tenant_id: string;
    name: string;
    description?: string;
    sku: string;
    barcode: string;
    recipe_id?: string;
    base_price: number;
    suggested_price: number;
    margin_percent: number;
    packaging_cost: number;
    image_object_key: string;
    image_url?: string;
    active: boolean;
    created_at: string;
    updated_at: string;
    category_id?: string | null;
    stock_quantity?: number;
    stock_unit?: string;
    reorder_point?: number;
    storage_location?: string;
    pricing_summary?: ProductPricingSummary;
}

export interface ProductPricingSummary {
    unit_cost: number;
    margin_value: number;
    break_even_price: number;
    contribution_margin: number;
    contribution_margin_pct: number;
    markup: number;
    margin_percent: number;
}

export interface PricingSettings {
    tenant_id: string;
    labor_cost_per_minute: number;       // Custo de mão de obra por minuto (R$/min)
    default_packaging_cost: number;      // Custo padrão de embalagem (R$)
    default_margin_percent: number;      // Margem de lucro padrão (%)
    fixed_monthly_costs: number;         // Custos fixos mensais (R$)
    variable_cost_percent: number;       // Custos variáveis (%)
    default_sales_volume: number;        // Volume mensal estimado (unidades)
    created_at: string;
    updated_at: string;
}

export type PricingSettingsUpdatePayload = Partial<Pick<
    PricingSettings,
    | 'labor_cost_per_minute'
    | 'default_packaging_cost'
    | 'default_margin_percent'
    | 'fixed_monthly_costs'
    | 'variable_cost_percent'
    | 'default_sales_volume'
>>;

export interface PricingSuggestionComponents {
    ingredient_cost: number;
    labor_cost: number;
    packaging_cost: number;
    fixed_cost_per_unit: number;
    variable_cost_unit: number;
    sales_volume_monthly: number;
}

export interface PricingSuggestionInputs {
    margin_percent: number;        // Margem de lucro aplicada (%)
    packaging_cost: number;        // Custo de embalagem (R$)
    fixed_monthly_costs: number;   // Custos fixos mensais (R$)
    variable_cost_percent: number; // Custos variáveis (%)
    labor_cost_per_minute: number; // Custo mão de obra (R$/min)
    sales_volume_monthly: number;  // Volume mensal (unidades)
}

export interface PricingSuggestionFlags {
    missing_sales_volume: boolean;    // Volume de vendas não informado
    low_margin: boolean;              // Margem de lucro abaixo de 20%
    below_break_even: boolean;        // Preço atual abaixo do ponto de equilíbrio
    high_fixed_cost_impact: boolean;  // Custos fixos representam mais de 30% do preço
}

export interface PricingSuggestion {
    unit_cost: number;                  // Custo unitário base
    fixed_cost_per_unit: number;        // Rateio de custos fixos
    variable_cost_unit: number;         // Custos variáveis unitários
    total_cost_per_unit: number;        // Custo total unitário
    suggested_price: number;            // Preço sugerido final
    break_even_price: number;           // Ponto de equilíbrio
    contribution_margin: number;        // Margem de contribuição (R$)
    contribution_margin_pct: number;    // Margem de contribuição (%)
    margin_value: number;               // Valor da margem de lucro (R$)
    margin_percent: number;             // Margem de lucro (%)
    markup: number;                     // Markup aplicado (%)
    current_price: number;              // Preço atual praticado
    delta_vs_current: number;           // Diferença vs preço atual (R$)
    delta_percent: number;              // Diferença vs preço atual (%)
    components: PricingSuggestionComponents;
    inputs: PricingSuggestionInputs;
    flags: PricingSuggestionFlags;
}

export interface PricingSuggestionPayload {
    product_id?: string;
    recipe_id?: string;
    margin_percent?: number;         // Margem de lucro desejada (%)
    packaging_cost?: number;         // Custo de embalagem (R$)
    fixed_monthly_costs?: number;    // Custos fixos mensais (R$)
    variable_cost_percent?: number;  // Custos variáveis (%)
    labor_cost_per_minute?: number;  // Mão de obra (R$/min)
    sales_volume_monthly?: number;   // Volume mensal (unidades)
    current_price?: number;          // Preço atual praticado (R$)
}

export interface Category {
    id: string;
    tenant_id: string;
    name: string;
    slug: string;
    type: string;
    color?: string;
    icon?: string;
    sort_order?: number;
}

export interface MeasurementUnit {
    code: string;
    label: string;
    type: string;
}

export interface MeasurementUnitsResponse {
    units: MeasurementUnit[];
    groups: Record<string, MeasurementUnit[]>;
}

export interface PushSubscription {
    id: string;
    tenant_id: string;
    user_id: string;
    endpoint: string;
    auth: string;
    p256dh: string;
    user_agent: string;
    platform: string;
    last_used_at?: string;
    expires_at?: string;
    created_at: string;
    updated_at: string;
}

export interface IngredientListFilters {
    search?: string;
    supplier?: string;
    unit?: string;
    category_id?: string;
    stock_status?: 'low' | 'out' | 'ok';
}

export interface RecipeListFilters {
    search?: string;
    category_id?: string;
}

export interface ProductListFilters {
    search?: string;
    category_id?: string;
    recipe_id?: string;
    active?: boolean;
    stock_status?: 'low' | 'out' | 'ok';
}

// Auth API
export const authAPI = {
    register: (data: any) => api.post('/auth/register', data),
    login: (tenantSlug: string, email: string, password: string) =>
        api.post('/auth/login', { tenant_slug: tenantSlug, email, password }),
    me: () => api.get('/auth/me'),
    requestPasswordReset: (tenantSlug: string, email: string) =>
        api.post('/auth/forgot-password', { tenant_slug: tenantSlug, email }),
    resetPassword: (tenantSlug: string, token: string, newPassword: string) =>
        api.post('/auth/reset-password', { tenant_slug: tenantSlug, token, new_password: newPassword }),
    getTenantsByEmail: (email: string) =>
        api.get('/auth/tenants-by-email', { params: { email } }),
};

// Ingredients API
export const ingredientsAPI = {
    list: (params?: IngredientListFilters) => api.get<Ingredient[]>('/ingredients', { params }),
    get: (id: string) => api.get<Ingredient>(`/ingredients/${id}`),
    create: (data: Partial<Ingredient>) => api.post<Ingredient>('/ingredients', data),
    update: (id: string, data: Partial<Ingredient>) => api.put<Ingredient>(`/ingredients/${id}`, data),
    delete: (id: string) => api.delete(`/ingredients/${id}`),
    bulkDelete: (ids: string[]) => api.post('/ingredients/bulk-delete', { ids }),
};

// Recipes API
export const recipesAPI = {
    list: (params?: RecipeListFilters) => api.get<Recipe[]>('/recipes', { params }),
    get: (id: string) => api.get<Recipe>(`/recipes/${id}`),
    getByID: (id: string) => api.get<Recipe>(`/recipes/${id}`),
    create: (data: Partial<Recipe>) => api.post<Recipe>('/recipes', data),
    update: (id: string, data: Partial<Recipe>) => api.put<Recipe>(`/recipes/${id}`, data),
    delete: (id: string) => api.delete(`/recipes/${id}`),
    addItem: (recipeId: string, data: Partial<RecipeItem>) =>
        api.post(`/recipes/${recipeId}/items`, data),
    removeItem: (recipeId: string, itemId: string) =>
        api.delete(`/recipes/${recipeId}/items/${itemId}`),
    bulkDelete: (ids: string[]) => api.post('/recipes/bulk-delete', { ids }),
};

// Products API
export const productsAPI = {
    list: (params?: ProductListFilters) => api.get<Product[]>('/products', { params }),
    get: (id: string) => api.get<Product>(`/products/${id}`),
    getByID: (id: string) => api.get<Product>(`/products/${id}`),
    create: (data: Partial<Product>) => api.post<Product>('/products', data),
    update: (id: string, data: Partial<Product>) => api.put<Product>(`/products/${id}`, data),
    delete: (id: string) => api.delete(`/products/${id}`),
    uploadImage: (id: string, file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        return api.post<Product>(`/products/${id}/image`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
    },
    bulkDelete: (ids: string[]) => api.post('/products/bulk-delete', { ids }),
};

// Pricing API
export const pricingAPI = {
    getSettings: () => api.get<PricingSettings>('/pricing/settings'),
    updateSettings: (payload: PricingSettingsUpdatePayload) => api.put<PricingSettings>('/pricing/settings', payload),
    suggestPrice: (payload: PricingSuggestionPayload) => api.post<PricingSuggestion>('/pricing/suggest', payload),
};

// Categories API
export const categoriesAPI = {
    list: (type?: string) =>
        api.get<Category[]>('/categories', {
            params: type ? { type } : undefined,
        }),
};

// Measurement units API
export const measurementAPI = {
    list: () => api.get<MeasurementUnitsResponse>('/measurement-units'),
};

// Push subscriptions API
export const pushSubscriptionsAPI = {
    list: () => api.get<PushSubscription[]>('/push-subscriptions'),
    subscribe: (payload: {
        endpoint: string;
        keys: { auth: string; p256dh: string };
        user_agent?: string;
        platform?: string;
        last_used_at?: string;
        expires_at?: string;
        expirationTime?: number | null;
    }) => api.post<PushSubscription>('/push-subscriptions', payload),
    unsubscribe: (endpoint: string) =>
        api.delete('/push-subscriptions', { data: { endpoint } }),
};
