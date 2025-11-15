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
    ingredient_cost: number;
    labor_cost: number;
    packaging_cost: number;
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
    tax_rate: number;
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
    tax_value: number;
    profit_per_unit: number;
    break_even_price: number;
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
