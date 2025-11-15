import { create } from 'zustand';
import { MeasurementUnit, measurementAPI } from '../lib/apiClient';

interface MeasurementState {
    units: MeasurementUnit[];
    groups: Record<string, MeasurementUnit[]>;
    loading: boolean;
    error: string | null;
    lastFetched?: number;
    fetch: () => Promise<void>;
}

export const useReferenceStore = create<MeasurementState>((set, get) => ({
    units: [],
    groups: {},
    loading: false,
    error: null,
    lastFetched: undefined,
    fetch: async () => {
        const { loading, units, lastFetched } = get();
        if (loading) return;
        const now = Date.now();
        if (units.length > 0 && lastFetched && now - lastFetched < 5 * 60 * 1000) {
            return;
        }

        set({ loading: true, error: null });
        try {
            const response = await measurementAPI.list();
            set({
                units: response.data.units || [],
                groups: response.data.groups || {},
                loading: false,
                lastFetched: now,
            });
        } catch (error: any) {
            set({
                loading: false,
                error: error?.response?.data?.error || 'Não foi possível carregar unidades de medida.',
            });
            throw error;
        }
    },
}));
