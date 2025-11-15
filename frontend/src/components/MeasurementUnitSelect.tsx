import { useEffect, useMemo, type SelectHTMLAttributes } from 'react';
import { MeasurementUnit } from '../lib/apiClient';
import { useReferenceStore } from '../store/referenceStore';
import { MEASUREMENT_GROUP_LABELS, FALLBACK_MEASUREMENT_UNIT, sortMeasurementGroups } from '../lib/measurement';

interface MeasurementUnitSelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
    value: string;
    onValueChange: (value: string) => void;
    allowedTypes?: string[];
    includePlaceholder?: boolean;
    placeholder?: string;
}

export function MeasurementUnitSelect({
    value,
    onValueChange,
    allowedTypes,
    includePlaceholder = true,
    placeholder = 'Selecione a unidade',
    className = '',
    disabled,
    ...rest
}: MeasurementUnitSelectProps) {
    const { groups, units, loading, error, fetch } = useReferenceStore((state) => ({
        groups: state.groups,
        units: state.units,
        loading: state.loading,
        error: state.error,
        fetch: state.fetch,
    }));

    useEffect(() => {
        if (!units.length && !loading) {
            fetch().catch(() => {
                /* handled via error state */
            });
        }
    }, [units.length, loading, fetch]);

    const groupedOptions = useMemo(() => {
        let mapped = sortMeasurementGroups(groups);
        if (allowedTypes && allowedTypes.length > 0) {
            mapped = mapped.filter(([type]) => allowedTypes.includes(type));
        }
        if (!mapped.length) {
            return [[FALLBACK_MEASUREMENT_UNIT.type, [FALLBACK_MEASUREMENT_UNIT]] as [string, MeasurementUnit[]]];
        }
        return mapped;
    }, [groups, allowedTypes]);

    return (
        <div className="space-y-1">
            <select
                className={`select ${className}`}
                value={value}
                onChange={(event) => onValueChange(event.target.value)}
                disabled={disabled || (loading && !units.length)}
                {...rest}
            >
                {includePlaceholder && <option value="">{loading ? 'Carregando...' : placeholder}</option>}
                {groupedOptions.map(([type, list]) => (
                    <optgroup key={type} label={MEASUREMENT_GROUP_LABELS[type] || type}>
                        {list.map((unit) => (
                            <option key={unit.code} value={unit.code}>
                                {unit.label} ({unit.code})
                            </option>
                        ))}
                    </optgroup>
                ))}
            </select>
            {error && (
                <p className="text-xs text-danger">{error}</p>
            )}
        </div>
    );
}
