package catalog

import (
	"testing"
)

func TestGenerateSlug(t *testing.T) {
	tests := []struct {
		input    string
		expected string
	}{
		{"สติกเกอร์ PP กันน้ำ", "sticker-pp-waterproof"},
		{"นามบัตรพรีเมียม 350 แกรม", "business-card-premium-350"},
		{"Waterproof PP Sticker!!", "waterproof-pp-sticker"},
		{"สมุด & แคตตาล็อก", "book-catalog"},
		{"   Custom Box Design 2026   ", "custom-box-design-2026"},
	}

	for _, tt := range tests {
		result := GenerateSlug(tt.input)
		if result != tt.expected {
			t.Errorf("GenerateSlug(%q) = %q; want %q", tt.input, result, tt.expected)
		}
	}
}
