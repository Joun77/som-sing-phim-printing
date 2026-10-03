package orders

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http/httptest"
	"reflect"
	"testing"

	"somsing.local/backend/auth"
)

type metadataUpload struct {
	FileName  string `json:"fileName"`
	SnakeName string `json:"file_name"`
	FileSize  int64  `json:"fileSize"`
	SnakeSize int64  `json:"file_size"`
	FileURL   string `json:"fileUrl"`
}

func TestArtworkMetadataTrace(t *testing.T) {
	for _, path := range []string{"mapper-direct", "specifications-direct", "nested-artwork-direct", "server-conversion"} {
		t.Run(path, func(t *testing.T) {
			orders := ownershipFixtureRouter(t)
			files, _ := setupUploadSecurityRouter(t)
			originals := []struct {
				role, name string
				size       int
				pages      int
			}{{"cover", "ປົກ Cover original 2026.pdf", 1207, 4}, {"inner", "ເນື້ອໃນ Inner original 2026.pdf", 8091, 32}}
			uploads := make([]metadataUpload, 2)
			parts := make([]any, 0, 2)
			for i, original := range originals {
				data := append([]byte("%PDF-1.4\n"), bytes.Repeat([]byte{' '}, original.size-len("%PDF-1.4\n"))...)
				body, contentType, err := createMultipartPayload("file", original.name, data, nil)
				if err != nil {
					t.Fatal(err)
				}
				req := httptest.NewRequest("POST", "/api/v1/upload/artwork", body)
				req.Header.Set("Content-Type", contentType)
				req.Header.Set("Authorization", "Bearer "+makeUploadTestToken(auth.RoleAdmin, false, false))
				w := httptest.NewRecorder()
				files.ServeHTTP(w, req)
				if w.Code != 200 {
					t.Fatalf("upload%d %s", w.Code, w.Body.String())
				}
				if err := json.Unmarshal(w.Body.Bytes(), &uploads[i]); err != nil {
					t.Fatal(err)
				}
				u := uploads[i]
				if u.FileName != original.name || u.SnakeName != original.name || u.FileSize != int64(original.size) || u.SnakeSize != u.FileSize {
					t.Fatalf("first upload metadata loss: %+v", u)
				}
				get := httptest.NewRequest("GET", u.FileURL, nil)
				get.Header.Set("Authorization", "Bearer "+makeUploadTestToken(auth.RoleAdmin, false, false))
				download := httptest.NewRecorder()
				files.ServeHTTP(download, get)
				if download.Code != 200 || !bytes.Equal(download.Body.Bytes(), data) {
					t.Fatal("fixture original bytes changed on upload/read")
				}
				parts = append(parts, map[string]any{"role": original.role, "source": map[string]any{"url": u.FileURL, "name": u.FileName, "size": float64(u.FileSize), "mimeType": "application/pdf"}, "pageCount": float64(original.pages), "paperId": original.role + "-fixture-paper"})
			}
			inner := uploads[1]
			item := map[string]any{"name": "Metadata fixture", "quantity": float64(1), "unitPrice": float64(99), "subtotal": float64(99), "artworkParts": parts, "artworkUrl": inner.FileURL, "fileName": inner.FileName, "fileSize": float64(inner.FileSize), "specs": map[string]any{"artwork_parts": parts, "price_components": map[string]any{"parts": []any{map[string]any{"role": "cover", "paperCost": float64(19)}}}}, "specifications": map[string]any{"artwork_parts": parts}}
			q := QuotationRecord{ID: "metadata-quote-" + path, QuotationNo: "metadata-number-" + path, CustomerName: "Disposable fixture", Items: []map[string]any{item}}
			q.TotalCost = 50
			q.TotalSellingPrice = 99
			q.Items[0]["unit_cost_lak"] = float64(50)
			saved := quotationSaveFixture(t, orders, q)

			if !reflect.DeepEqual(saved.Items[0]["artworkParts"], parts) {
				t.Fatal("quotation saved response lost original parts")
			}
			var order Order
			if path == "server-conversion" {
				order = quotationConvertFixture(t, orders, saved)

			} else {
				req := CreateOrderRequest{OrderNo: "metadata-create-" + path, CustomerName: "Disposable fixture", Items: []CreateItemRequest{{ItemName: "Metadata fixture", Quantity: 1, PageCount: 32, CoverFileURL: uploads[0].FileURL, InnerFileURL: inner.FileURL, ArtworkURL: inner.FileURL, ArtworkFileName: inner.FileName, ArtworkFileSize: inner.FileSize, Artwork: &ItemArtwork{FileURL: inner.FileURL, FileName: inner.FileName, FileSizeBytes: inner.FileSize, PageCount: 32}, Specs: map[string]any{"artwork_parts": parts}, Specifications: map[string]any{"artwork_parts": parts}}}}
				if path == "specifications-direct" {
					req.Items[0].Specs = nil
				}
				if path == "nested-artwork-direct" {
					req.Items[0].ArtworkFileName = ""
					req.Items[0].ArtworkFileSize = 0
					req.Items[0].ArtworkURL = ""
				}
				order = ownershipDecode(t, ownershipPost(t, orders, "/api/v1/orders", req))
			}
			if len(order.Items) != 1 {
				t.Fatal("missing converted item")
			}
			got := order.Items[0]
			if !reflect.DeepEqual(got.Specs["artwork_parts"], parts) {
				t.Fatalf("%s first loss: direct create omitted original parts from persisted Specs; Specifications=%v", path, got.Specifications)
			}
			if got.CoverFileURL != uploads[0].FileURL || got.InnerFileURL != inner.FileURL {
				t.Fatal("original roles changed")
			}
			if got.ArtworkFileName != inner.FileName || got.ArtworkFileSize != inner.FileSize || got.Specs["artwork_file_name"] != inner.FileName || got.Specs["artwork_file_size"] != float64(inner.FileSize) {
				t.Fatalf("%s first loss: canonical primary metadata=%q/%d, wanted=%q/%d", path, got.ArtworkFileName, got.ArtworkFileSize, inner.FileName, inner.FileSize)
			}
			testQuotationPartsStorage(t, order, parts, uploads[0].FileURL, inner.FileURL, inner.FileName, inner.FileSize)
			// The shared writer/reader test validates the exact canonical original parts
			// including each role's source name/size, not just the primary inner fields.
			t.Log(fmt.Sprintf("%s: upload/quote/create-or-convert/SQL writer-reader preserves cover %q/%d and inner %q/%d", path, uploads[0].FileName, uploads[0].FileSize, inner.FileName, inner.FileSize))
		})
	}
}

func TestArtworkMetadataUnknownLegacy(t *testing.T) {
	r := ownershipFixtureRouter(t)
	req := CreateOrderRequest{OrderNo: "metadata-unknown-legacy", CustomerName: "Disposable fixture", Items: []CreateItemRequest{{ItemName: "Legacy original", Quantity: 1, ArtworkURL: "/uploads/artworks/art-existing-storage.pdf"}}}
	got := ownershipDecode(t, ownershipPost(t, r, "/api/v1/orders", req)).Items[0]
	if got.ArtworkFileName != "art-existing-storage.pdf" || got.ArtworkFileSize != 0 {
		t.Fatal("unknown legacy metadata was fabricated")
	}
}

func TestArtworkMetadataSnapshotPrecedence(t *testing.T) {
	r := ownershipFixtureRouter(t)
	parts := quotationPartsFixture()
	req := CreateOrderRequest{OrderNo: "metadata-spec-precedence", CustomerName: "Disposable fixture", Items: []CreateItemRequest{{ItemName: "Snapshot fixture", Quantity: 1, Specs: map[string]any{"artwork_parts": parts, "selected": "specs", "price_components": map[string]any{"parts": []any{map[string]any{"role": "inner", "paperCost": float64(42)}}}}, Specifications: map[string]any{"selected": "specifications", "preserved_setting": "keep", "price_components": map[string]any{"parts": []any{map[string]any{"role": "inner", "paperCost": float64(99)}}}}}}}
	item := ownershipDecode(t, ownershipPost(t, r, "/api/v1/orders", req)).Items[0]
	if item.Specs["selected"] != "specs" || item.Specs["preserved_setting"] != "keep" || !reflect.DeepEqual(item.Specs["price_components"], req.Items[0].Specs["price_components"]) {
		t.Fatal("metadata snapshot merge changed explicit specs or cost snapshot precedence")
	}
	if !reflect.DeepEqual(item.Specs["artwork_parts"], parts) {
		t.Fatal("explicit role snapshots changed")
	}
}
