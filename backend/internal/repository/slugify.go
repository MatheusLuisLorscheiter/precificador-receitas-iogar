package repository

import (
	"regexp"
	"strings"
	"unicode"

	"golang.org/x/text/runes"
	"golang.org/x/text/transform"
	"golang.org/x/text/unicode/norm"
)

var (
	// Regex para remover caracteres não permitidos em slugs
	slugRegex = regexp.MustCompile(`[^a-z0-9-]+`)
	// Regex para remover múltiplos hífens consecutivos
	multiHyphenRegex = regexp.MustCompile(`-+`)
)

// Slugify converte uma string em um slug válido para URLs
// Remove acentos, converte para minúsculas, substitui espaços por hífens
// e remove caracteres especiais
func Slugify(text string) string {
	// Converter para minúsculas
	text = strings.ToLower(text)

	// Remover acentos usando normalização Unicode
	t := transform.Chain(norm.NFD, runes.Remove(runes.In(unicode.Mn)), norm.NFC)
	text, _, _ = transform.String(t, text)

	// Substituir espaços e underscores por hífens
	text = strings.ReplaceAll(text, " ", "-")
	text = strings.ReplaceAll(text, "_", "-")

	// Remover caracteres não permitidos (apenas letras, números e hífens)
	text = slugRegex.ReplaceAllString(text, "")

	// Remover múltiplos hífens consecutivos
	text = multiHyphenRegex.ReplaceAllString(text, "-")

	// Remover hífens do início e fim
	text = strings.Trim(text, "-")

	return text
}
