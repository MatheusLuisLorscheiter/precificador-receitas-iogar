import { create } from 'zustand';
import {
    pricingAPI,
    PricingSettings,
    PricingSettingsUpdatePayload,
    PricingSuggestion,
    PricingSuggestionPayload,
} from '../lib/apiClient';

interface PricingStore {
    settings: PricingSettings | null;
    suggestion: PricingSuggestion | null;
    loadingSettings: boolean;
    savingSettings: boolean;
    suggesting: boolean;
    lastError: string | null;
    loadSettings: (force?: boolean) => Promise<PricingSettings | null>;
    saveSettings: (payload: PricingSettingsUpdatePayload) => Promise<PricingSettings | null>;
    suggestPrice: (payload: PricingSuggestionPayload) => Promise<PricingSuggestion | null>;
    clearSuggestion: () => void;
    clearError: () => void;
}

const getErrorMessage = (error: unknown): string => {
    if (typeof error === 'string') return error;
    if (error && typeof error === 'object' && 'response' in error) {
        const err = error as { response?: { data?: { error?: string; message?: string }; status?: number } };
        return err.response?.data?.error || err.response?.data?.message || 'Erro inesperado. Tente novamente.';
    }
    if (error instanceof Error) {
        return error.message;
    }
    return 'Erro inesperado. Tente novamente.';
};

export const usePricingStore = create<PricingStore>((set, get) => ({
    settings: null,
    suggestion: null,
    loadingSettings: false,
    savingSettings: false,
    suggesting: false,
    lastError: null,
    loadSettings: async (force = false) => {
        if (!force && get().settings) {
            return get().settings;
        }
        set({ loadingSettings: true, lastError: null });
        try {
            const response = await pricingAPI.getSettings();
            set({ settings: response.data });
            return response.data;
        } catch (error) {
            const message = getErrorMessage(error);
            set({ lastError: message });
            throw error;
        } finally {
            set({ loadingSettings: false });
        }
    },
    saveSettings: async (payload) => {
        set({ savingSettings: true, lastError: null });
        try {
            const response = await pricingAPI.updateSettings(payload);
            set({ settings: response.data });
            return response.data;
        } catch (error) {
            const message = getErrorMessage(error);
            set({ lastError: message });
            throw error;
        } finally {
            set({ savingSettings: false });
        }
    },
    suggestPrice: async (payload) => {
        set({ suggesting: true, lastError: null });
        try {
            const response = await pricingAPI.suggestPrice(payload);
            set({ suggestion: response.data });
            return response.data;
        } catch (error) {
            const message = getErrorMessage(error);
            set({ lastError: message });
            throw error;
        } finally {
            set({ suggesting: false });
        }
    },
    clearSuggestion: () => set({ suggestion: null }),
    clearError: () => set({ lastError: null }),
}));
