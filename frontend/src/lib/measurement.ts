import { MeasurementUnit } from './apiClient';

export const DEFAULT_PRODUCT_UNIT = 'un';

export const MEASUREMENT_GROUP_LABELS: Record<string, string> = {
    mass: 'Massa',
    volume: 'Volume',
    unit: 'Unidades',
    portion: 'Porções',
    area: 'Área',
    length: 'Comprimento',
};

export const FALLBACK_MEASUREMENT_UNIT: MeasurementUnit = {
    code: DEFAULT_PRODUCT_UNIT,
    label: 'Unidade',
    type: 'unit',
};

export type MeasurementGroupTuple = [string, MeasurementUnit[]];

export function sortMeasurementGroups(groups: Record<string, MeasurementUnit[]> | undefined): MeasurementGroupTuple[] {
    if (!groups) {
        return [[FALLBACK_MEASUREMENT_UNIT.type, [FALLBACK_MEASUREMENT_UNIT]]];
    }

    return Object.entries(groups)
        .map<MeasurementGroupTuple>(([type, units]) => [type, [...units]])
        .sort(([a], [b]) => {
            const labelA = MEASUREMENT_GROUP_LABELS[a] || a;
            const labelB = MEASUREMENT_GROUP_LABELS[b] || b;
            return labelA.localeCompare(labelB, 'pt-BR');
        })
        .map(([type, units]) => [type, units.sort((u1, u2) => u1.label.localeCompare(u2.label, 'pt-BR'))]);
}

export function normalizeMeasurementCode(value?: string | null): string {
    return (value || DEFAULT_PRODUCT_UNIT).trim().toLowerCase();
}
