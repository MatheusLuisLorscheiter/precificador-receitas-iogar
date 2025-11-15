package domain

import (
	"sort"
	"strings"
)

// MeasurementUnit descreve unidades suportadas pelo sistema.
type MeasurementUnit struct {
	Code  string `json:"code"`
	Label string `json:"label"`
	Type  string `json:"type"` // mass, volume, unit, area, length, portion
}

// AllowedMeasurementUnits contém todas as unidades suportadas organizadas por código.
var AllowedMeasurementUnits = map[string]MeasurementUnit{
	"mg":      {Code: "mg", Label: "Miligrama", Type: "mass"},
	"g":       {Code: "g", Label: "Grama", Type: "mass"},
	"kg":      {Code: "kg", Label: "Quilograma", Type: "mass"},
	"oz":      {Code: "oz", Label: "Onça", Type: "mass"},
	"lb":      {Code: "lb", Label: "Libra", Type: "mass"},
	"ml":      {Code: "ml", Label: "Mililitro", Type: "volume"},
	"l":       {Code: "l", Label: "Litro", Type: "volume"},
	"tsp":     {Code: "tsp", Label: "Colher de chá", Type: "volume"},
	"tbsp":    {Code: "tbsp", Label: "Colher de sopa", Type: "volume"},
	"cup":     {Code: "cup", Label: "Xícara", Type: "volume"},
	"un":      {Code: "un", Label: "Unidade", Type: "unit"},
	"dz":      {Code: "dz", Label: "Dúzia", Type: "unit"},
	"pct":     {Code: "pct", Label: "Pacote", Type: "unit"},
	"pctk":    {Code: "pctk", Label: "Pacote (kg)", Type: "mass"},
	"porc":    {Code: "porc", Label: "Porção", Type: "portion"},
	"bandeja": {Code: "bandeja", Label: "Bandeja", Type: "unit"},
	"m":       {Code: "m", Label: "Metro", Type: "length"},
	"cm":      {Code: "cm", Label: "Centímetro", Type: "length"},
	"mm":      {Code: "mm", Label: "Milímetro", Type: "length"},
	"m2":      {Code: "m2", Label: "Metro quadrado", Type: "area"},
	"cm2":     {Code: "cm2", Label: "Centímetro quadrado", Type: "area"},
	"lata":    {Code: "lata", Label: "Lata", Type: "unit"},
	"caixa":   {Code: "caixa", Label: "Caixa", Type: "unit"},
	"fatia":   {Code: "fatia", Label: "Fatia", Type: "portion"},
}

var (
	measurementUnitsList    []MeasurementUnit
	measurementUnitsByGroup map[string][]MeasurementUnit
)

func init() {
	measurementUnitsList = make([]MeasurementUnit, 0, len(AllowedMeasurementUnits))
	for _, unit := range AllowedMeasurementUnits {
		measurementUnitsList = append(measurementUnitsList, unit)
	}
	sort.Slice(measurementUnitsList, func(i, j int) bool {
		if measurementUnitsList[i].Type == measurementUnitsList[j].Type {
			return measurementUnitsList[i].Label < measurementUnitsList[j].Label
		}
		return measurementUnitsList[i].Type < measurementUnitsList[j].Type
	})

	measurementUnitsByGroup = make(map[string][]MeasurementUnit)
	for _, unit := range measurementUnitsList {
		measurementUnitsByGroup[unit.Type] = append(measurementUnitsByGroup[unit.Type], unit)
	}
}

// DefaultProductUnit define a unidade padrão para produtos finais.
const DefaultProductUnit = "un"

// IsValidMeasurementUnit verifica se a unidade informada está na lista suportada.
func IsValidMeasurementUnit(code string) bool {
	if code == "" {
		return false
	}
	_, ok := AllowedMeasurementUnits[NormalizeUnit(code)]
	return ok
}

// NormalizeUnit normaliza códigos de unidades para lowercase e trim.
func NormalizeUnit(code string) string {
	normalized := strings.TrimSpace(strings.ToLower(code))
	switch normalized {
	case "litro", "litros", "lt", "lts", "ltrs":
		normalized = "l"
	case "quilo", "quilos", "kgs", "kgm":
		normalized = "kg"
	case "grama", "gramas", "gram", "gr":
		normalized = "g"
	case "mililitro", "mililitros", "mls":
		normalized = "ml"
	case "unidad", "unidade", "unidades", "unit", "units":
		normalized = "un"
	case "pacote", "pacotes":
		normalized = "pct"
	case "bandejas":
		normalized = "bandeja"
	case "metro", "metros":
		normalized = "m"
	case "centimetro", "centimetros":
		normalized = "cm"
	case "milimetro", "milimetros":
		normalized = "mm"
	case "metro quadrado", "metros quadrados":
		normalized = "m2"
	case "centimetro quadrado", "centimetros quadrados":
		normalized = "cm2"
	case "porcao", "porções", "porcoes":
		normalized = "porc"
	}
	return normalized
}

// MeasurementUnits retorna uma cópia ordenada das unidades suportadas.
func MeasurementUnits() []MeasurementUnit {
	units := make([]MeasurementUnit, len(measurementUnitsList))
	copy(units, measurementUnitsList)
	return units
}

// MeasurementUnitsByType agrupa as unidades por tipo, retornando cópia defensiva.
func MeasurementUnitsByType() map[string][]MeasurementUnit {
	groups := make(map[string][]MeasurementUnit, len(measurementUnitsByGroup))
	for key, value := range measurementUnitsByGroup {
		bucket := make([]MeasurementUnit, len(value))
		copy(bucket, value)
		groups[key] = bucket
	}
	return groups
}
