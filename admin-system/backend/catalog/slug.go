package catalog

import (
	"database/sql"
	"fmt"
	"regexp"
	"strings"
	"time"
	"unicode"
)

var (
	nonLatinRegex = regexp.MustCompile(`[^a-z0-9\-_]+`)
	multipleDash  = regexp.MustCompile(`-+`)
)

// GenerateSlug produces a clean URL slug from input text.
// If input contains non-Latin characters (like Thai / Lao), it transliterates or normalizes.
func GenerateSlug(title string) string {
	slug := strings.ToLower(strings.TrimSpace(title))

	// Replace common Thai/special keywords if applicable
	slug = strings.ReplaceAll(slug, "สติกเกอร์", "-sticker-")
	slug = strings.ReplaceAll(slug, "นามบัตร", "-business-card-")
	slug = strings.ReplaceAll(slug, "สมุด", "-book-")
	slug = strings.ReplaceAll(slug, "แคตตาล็อก", "-catalog-")
	slug = strings.ReplaceAll(slug, "กล่อง", "-box-")
	slug = strings.ReplaceAll(slug, "ป้าย", "-banner-")
	slug = strings.ReplaceAll(slug, "โบรชัวร์", "-brochure-")
	slug = strings.ReplaceAll(slug, "กันน้ำ", "-waterproof-")
	slug = strings.ReplaceAll(slug, "พรีเมียม", "-premium-")

	// Filter out non-ASCII alphanumeric
	var sb strings.Builder
	for _, r := range slug {
		if (r >= 'a' && r <= 'z') || (r >= '0' && r <= '9') || r == '-' || r == '_' {
			sb.WriteRune(r)
		} else if unicode.IsSpace(r) {
			sb.WriteRune('-')
		}
	}
	clean := sb.String()
	clean = nonLatinRegex.ReplaceAllString(clean, "-")
	clean = multipleDash.ReplaceAllString(clean, "-")
	clean = strings.Trim(clean, "-_")

	if clean == "" {
		clean = fmt.Sprintf("product-%d", time.Now().Unix()%100000)
	}

	return clean
}

// EnsureUniqueSlug queries DB to verify uniqueness. If slug exists for another product,
// it appends -1, -2, etc. until unique.
func EnsureUniqueSlug(db *sql.DB, baseSlug string, excludeProductID int) (string, error) {
	if db == nil {
		return baseSlug, nil
	}

	candidate := baseSlug
	counter := 1

	for {
		var exists bool
		var query string
		var err error

		if excludeProductID > 0 {
			query = `SELECT EXISTS(SELECT 1 FROM public_products WHERE slug = $1 AND id != $2 AND deleted_at IS NULL)`
			err = db.QueryRow(query, candidate, excludeProductID).Scan(&exists)
		} else {
			query = `SELECT EXISTS(SELECT 1 FROM public_products WHERE slug = $1 AND deleted_at IS NULL)`
			err = db.QueryRow(query, candidate).Scan(&exists)
		}

		if err != nil {
			return baseSlug, err
		}

		if !exists {
			return candidate, nil
		}

		candidate = fmt.Sprintf("%s-%d", baseSlug, counter)
		counter++
		if counter > 100 {
			candidate = fmt.Sprintf("%s-%d", baseSlug, time.Now().UnixNano()%100000)
			return candidate, nil
		}
	}
}
