package orders

import (
	"bytes"
	"database/sql"
	"database/sql/driver"
	"encoding/json"
	"errors"
	"fmt"
	"net/http/httptest"
	"net/url"
	"os"
	"reflect"
	"strings"
	"sync"
	"testing"
	"time"

	"github.com/DATA-DOG/go-sqlmock"
	"github.com/gin-gonic/gin"
	"somsing.local/backend/auth"
	"somsing.local/backend/db"
)

func quotationPartsFixture() []any {
	return []any{
		map[string]any{"role": "cover", "source": map[string]any{"url": "/uploads/artworks/cover-original.pdf", "name": "cover source.pdf", "size": float64(1200), "mimeType": "application/pdf"}, "pageCount": float64(4), "paperId": "cover-stock", "widthMM": float64(210), "heightMM": float64(297), "colorMode": "CMYK", "coverage": map[string]any{"c": float64(17)}, "doubleSided": false},
		map[string]any{"role": "inner", "source": map[string]any{"url": "/uploads/artworks/inner-original.pdf", "name": "inner source.pdf", "size": float64(8400), "mimeType": "application/pdf"}, "pageCount": float64(32), "paperId": "inner-stock", "printerId": "fixture-printer", "widthMM": float64(148), "heightMM": float64(210), "colorMode": "MONO_K", "coverage": map[string]any{"k": float64(9)}, "doubleSided": true},
	}
}

func TestQuotationPartsContract(t *testing.T) {
	originalDB := db.DB
	db.DB = nil
	t.Cleanup(func() { db.DB = originalDB })
	parts := quotationPartsFixture()
	costs := map[string]any{"parts": []any{map[string]any{"role": "cover", "paperCost": float64(500), "inkCost": float64(100)}, map[string]any{"role": "inner", "paperCost": float64(1900), "machineOverhead": float64(73)}}, "shared": map[string]any{"binding": float64(42)}}
	for _, shape := range []string{"top-level", "specs", "specifications", "empty-authoritative", "cover-only", "inner-only", "legacy"} {
		t.Run(shape, func(t *testing.T) {
			item := map[string]any{"name": "Fixture book", "quantity": float64(10), "unitPrice": float64(99), "subtotal": float64(990), "artworkUrl": "/uploads/artworks/legacy.pdf", "fileName": "legacy.pdf", "fileSize": float64(91), "page_count": float64(7), "specs": map[string]any{"price_components": costs, "custom_snapshot": "retained"}}
			wantParts := parts
			wantCover := "/uploads/artworks/cover-original.pdf"
			wantInner := "/uploads/artworks/inner-original.pdf"
			wantName := "inner source.pdf"
			wantSize := int64(8400)
			wantPages := 32
			switch shape {
			case "top-level":
				item["artworkParts"] = parts
				item["specs"].(map[string]any)["artwork_parts"] = []any{parts[0]}
				item["specifications"] = map[string]any{"artwork_parts": []any{parts[1]}, "other_snapshot": "retained too"}
			case "specs":
				item["specs"].(map[string]any)["artwork_parts"] = parts
				item["specifications"] = map[string]any{"artwork_parts": []any{parts[0]}}
			case "specifications":
				item["specifications"] = map[string]any{"artwork_parts": parts}
			case "empty-authoritative":
				item["artworkParts"] = []any{}
				item["specs"].(map[string]any)["artwork_parts"] = parts
				wantParts = []any{}
				wantCover = ""
				wantInner = "/uploads/artworks/legacy.pdf"
				wantName = "legacy.pdf"
				wantSize = 91
				wantPages = 7
			case "cover-only":
				item["artworkParts"] = []any{parts[0]}
				wantParts = []any{parts[0]}
				wantInner = ""
				wantName = "cover source.pdf"
				wantSize = 1200
				wantPages = 4
			case "inner-only":
				item["artworkParts"] = []any{parts[1]}
				wantParts = []any{parts[1]}
				wantCover = ""
			case "legacy":
				wantParts = nil
				wantCover = ""
				wantInner = "/uploads/artworks/legacy.pdf"
				wantName = "legacy.pdf"
				wantSize = 91
				wantPages = 7
			}
			router := ownershipFixtureRouter(t)
			q := QuotationRecord{ID: "fixture-" + shape, QuotationNo: "fixture-number-" + shape, CustomerName: "Fixture", TotalCost: 500, TotalSellingPrice: 990, Items: []map[string]any{item}}
			q.Items[0]["unit_cost_lak"] = float64(50)
			savedQuote := quotationSaveFixture(t, router, q)
			savedBefore, _ := json.Marshal(quotationStripReserved(savedQuote.Items))
			response := struct{ Data Order }{Data: quotationConvertFixture(t, router, savedQuote)}

			if len(response.Data.Items) != 1 {
				t.Fatalf("items: %d", len(response.Data.Items))
			}
			got := response.Data.Items[0]
			if got.CoverFileURL != wantCover || got.InnerFileURL != wantInner {
				t.Fatalf("original roles: cover=%q inner=%q", got.CoverFileURL, got.InnerFileURL)
			}
			if got.Artwork == nil || got.Artwork.FileName != wantName || got.Artwork.FileSizeBytes != wantSize || got.Artwork.PageCount != wantPages || got.PageCount != wantPages {
				t.Fatalf("original metadata: %+v item pages=%d", got.Artwork, got.PageCount)
			}
			if got.ArtworkFileName != wantName || got.ArtworkFileSize != wantSize {
				t.Fatalf("primary metadata fields: %+v", got)
			}
			if wantParts != nil && !reflect.DeepEqual(got.Specs["artwork_parts"], wantParts) {
				t.Fatalf("parts snapshots lost: %+v", got.Specs["artwork_parts"])
			}
			if !reflect.DeepEqual(got.Specs["price_components"], costs) || got.Specs["custom_snapshot"] != "retained" {
				t.Fatal("cost/spec snapshot changed")
			}
			if got.UnitPriceLAK != 99 || got.TotalPriceLAK != 990 || response.Data.TotalCost != 500 || response.Data.TotalAmountLAK != 990 {
				t.Fatal("financial snapshot changed")
			}
			quoteMutex.RLock()
			after := quotationsStore[q.ID]
			quoteMutex.RUnlock()
			afterJSON, _ := json.Marshal(quotationStripReserved(after.Items))
			if !bytes.Equal(savedBefore, afterJSON) {
				t.Fatal("conversion mutated quotation snapshot")
			}
			testQuotationPartsStorage(t, response.Data, wantParts, wantCover, wantInner, wantName, wantSize)
		})
	}
}

type quotationSpecsArgument struct {
	t      *testing.T
	want   map[string]any
	stored *[]byte
}

func (a quotationSpecsArgument) Match(value driver.Value) bool {
	text, ok := value.(string)
	if !ok {
		return false
	}
	var got map[string]any
	if err := json.Unmarshal([]byte(text), &got); err != nil {
		return false
	}
	// Compare via JSON since live conversion uses int64 canonical file size.
	expected, _ := json.Marshal(a.want)
	actual, _ := json.Marshal(got)
	if !bytes.Equal(expected, actual) {
		return false
	}
	*a.stored = []byte(text)
	return true
}

func testQuotationPartsStorage(t *testing.T, order Order, parts []any, cover, inner, name string, size int64) {
	t.Helper()
	mockDB, mock, err := sqlmock.New()
	if err != nil {
		t.Fatal(err)
	}
	defer mockDB.Close()
	previous := db.DB
	db.DB = mockDB
	defer func() { db.DB = previous }()
	// Customer auto-linking stays inside sqlmock; no real CRM writes.
	order.CustomerID = ""
	order.CustomerName = ""
	order.CustomerPhone = ""
	mock.ExpectBegin()
	if order.CustomerID != "" {
		mock.ExpectQuery("SELECT id FROM customers WHERE id").WithArgs(order.CustomerID).WillReturnRows(sqlmock.NewRows([]string{"id"}).AddRow(order.CustomerID))
		mock.ExpectExec("UPDATE customers").WillReturnResult(sqlmock.NewResult(0, 1))
	} else {
		mock.ExpectExec("INSERT INTO customers").WillReturnResult(sqlmock.NewResult(0, 1))
	}
	mock.ExpectExec("INSERT INTO orders").WillReturnResult(sqlmock.NewResult(0, 1))
	var persisted []byte
	args := make([]driver.Value, 24)
	for i := range args {
		args[i] = sqlmock.AnyArg()
	}
	args[9] = cover
	args[10] = inner
	args[23] = quotationSpecsArgument{t, order.Items[0].Specs, &persisted}
	mock.ExpectExec("INSERT INTO order_items").WithArgs(args...).WillReturnResult(sqlmock.NewResult(0, 1))
	mock.ExpectCommit()
	if err := saveOrderToDB(order); err != nil {
		t.Fatal(err)
	}
	item := order.Items[0]
	columns := []string{"id", "order_id", "item_name", "quantity", "unit_price_snapshot", "cost_price_snapshot", "specs", "page_count", "paper_size", "cover_paper_id", "inner_paper_id", "cover_file_url", "inner_file_url", "binding_type", "spine_width_mm", "current_step", "avg_cov_c", "avg_cov_m", "avg_cov_y", "avg_cov_k", "unit_cost_lak", "unit_price_lak", "total_price_lak"}
	mock.ExpectQuery("SELECT id, order_id").WithArgs(order.ID).WillReturnRows(sqlmock.NewRows(columns).AddRow(item.ID, order.ID, item.ItemName, item.Quantity, item.UnitPriceSnapshot, item.CostPriceSnapshot, persisted, item.PageCount, item.PaperSize, item.CoverPaperID, item.InnerPaperID, cover, inner, string(item.BindingType), item.SpineWidthMM, string(item.CurrentStep), item.AvgCovC, item.AvgCovM, item.AvgCovY, item.AvgCovK, item.UnitCostLAK, item.UnitPriceLAK, item.TotalPriceLAK))
	read, err := getOrderItemsFromDB(order.ID)
	if err != nil {
		t.Fatal(err)
	}
	if len(read) != 1 || read[0].CoverFileURL != cover || read[0].InnerFileURL != inner || read[0].ArtworkFileName != name || read[0].ArtworkFileSize != size {
		t.Fatalf("actual DB reader metadata: %+v", read)
	}
	if parts != nil && !reflect.DeepEqual(read[0].Specs["artwork_parts"], parts) {
		t.Fatal("persisted parts snapshots lost on readback")
	}
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatal(err)
	}
}

// Exercise quotations.items_json persistence and conversion's DB read, using the
// same production handlers with an in-process SQL driver; this is not durability.
func TestQuotationPartsPersistedQuotation(t *testing.T) {
	r := ownershipFixtureRouter(t)
	parts := quotationPartsFixture()
	item := map[string]any{"name": "Fixture persisted book", "quantity": float64(10), "unitPrice": float64(99), "subtotal": float64(990), "unit_cost_lak": float64(50), "artworkParts": parts, "specs": map[string]any{"artwork_parts": parts, "price_components": map[string]any{"parts": []any{map[string]any{"role": "inner", "paperCost": float64(1900)}}}}}
	q := QuotationRecord{ID: "fixture-db-quote", QuotationNo: "fixture-db-number", CustomerName: "Fixture", TotalCost: 500, TotalSellingPrice: 990, Items: []map[string]any{item}}
	saved := quotationSaveFixture(t, r, q)
	quoteMutex.Lock()
	quotationsStore = make(map[string]QuotationRecord)
	quoteMutex.Unlock()
	result := quotationConvertFixture(t, r, saved)
	if len(result.Items) != 1 {
		t.Fatal("missing actual persisted item")
	}
	got := result.Items[0]
	if got.CoverFileURL != "/uploads/artworks/cover-original.pdf" || got.InnerFileURL != "/uploads/artworks/inner-original.pdf" || got.Artwork == nil || got.Artwork.FileName != "inner source.pdf" || got.Artwork.PageCount != 32 || !reflect.DeepEqual(got.Specs["artwork_parts"], parts) {
		t.Fatal("actual persisted originals/parts changed")
	}
	testQuotationPartsStorage(t, result, parts, got.CoverFileURL, got.InnerFileURL, got.ArtworkFileName, got.ArtworkFileSize)
}

type quotationItemsArgument struct {
	want   []map[string]any
	stored *[]byte
}

func (a quotationItemsArgument) Match(value driver.Value) bool {
	text, ok := value.(string)
	if !ok {
		return false
	}
	var got []map[string]any
	if json.Unmarshal([]byte(text), &got) != nil || !reflect.DeepEqual(got, a.want) {
		return false
	}
	*a.stored = []byte(text)
	return true
}

// Canonical fixture helpers use the production writer/reader, authenticated handlers and explicit synthetic money.
type quotationCaptureValue struct {
	values *[]driver.Value
	index  int
}

func (a quotationCaptureValue) Match(value driver.Value) bool {
	(*a.values)[a.index] = value
	return true
}
func quotationCaptureArgs(values *[]driver.Value, n int) []driver.Value {
	*values = make([]driver.Value, n)
	args := make([]driver.Value, n)
	for i := range args {
		args[i] = quotationCaptureValue{values, i}
	}
	return args
}
func quotationTestRows(q QuotationRecord) *sqlmock.Rows {
	raw, _ := json.Marshal(q.Items)
	columns := make([]string, 21)
	for i := range columns {
		columns[i] = fmt.Sprintf("col_%d", i)
	}
	return sqlmock.NewRows(columns).AddRow(q.ID, q.QuotationNo, q.Title, q.CustomerName, q.CustomerPhone, q.CustomerAddress, q.Status, q.TotalCost, q.TotalSellingPrice, q.OverallProfitPercent, q.DiscountPercent, q.SetupFee, q.PackagingCost, q.ShippingFee, q.ExpiryDate, q.Notes, q.ArtworkURL, q.DigitalProofURL, raw, q.CreatedAt, q.UpdatedAt)
}
func quotationTestPost(r *gin.Engine, method, path string, payload any, role string) *httptest.ResponseRecorder {
	raw, _ := json.Marshal(payload)
	req := httptest.NewRequest(method, path, bytes.NewReader(raw))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+makeUploadTestToken(role, false, false))
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)
	return w
}
func quotationSaveFixture(t *testing.T, r *gin.Engine, q QuotationRecord) QuotationRecord {
	t.Helper()
	fixture, mock, err := sqlmock.New()
	if err != nil {
		t.Fatal(err)
	}
	defer fixture.Close()
	prior := db.DB
	db.DB = fixture
	defer func() { db.DB = prior }()
	mock.ExpectBegin()
	mock.ExpectQuery("SELECT COALESCE").WithArgs(q.ID).WillReturnRows(sqlmock.NewRows([]string{"id"}))
	mock.ExpectExec("INSERT INTO customers").WillReturnResult(sqlmock.NewResult(0, 1))
	var values []driver.Value
	mock.ExpectExec("INSERT INTO quotations").WithArgs(quotationCaptureArgs(&values, 21)...).WillReturnResult(sqlmock.NewResult(0, 1))
	mock.ExpectExec("INSERT INTO audit_logs").WillReturnResult(sqlmock.NewResult(0, 1))
	mock.ExpectCommit()
	result := quotationTestPost(r, "POST", "/api/v1/quotations", q, auth.RoleAdmin)
	if result.Code != 200 {
		t.Fatalf("fixture actual save%d %s", result.Code, result.Body.String())
	}
	var saved QuotationRecord
	if err := json.Unmarshal(result.Body.Bytes(), &saved); err != nil {
		t.Fatal(err)
	}
	if !saved.Committed || values[7] != q.TotalCost || values[8] != q.TotalSellingPrice {
		t.Fatal("actual saved financial arguments/ack differ")
	}
	var persisted []map[string]any
	if err := json.Unmarshal([]byte(values[18].(string)), &persisted); err != nil {
		t.Fatal(err)
	}
	if !quoteObjectsEqual(saved.Items, persisted) {
		t.Fatal("save reply differs from actual persisted JSON")
	}
	saved.Items = persisted
	saved.CreatedAt = values[19].(time.Time)
	saved.UpdatedAt = values[20].(time.Time)
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatal(err)
	}
	return saved
}
func quotationExpectConversion(mock sqlmock.Sqlmock, q QuotationRecord, orders, items *[]driver.Value) {
	mock.ExpectBegin()
	mock.ExpectQuery("SELECT COALESCE").WithArgs(q.ID).WillReturnRows(quotationTestRows(q))
	mock.ExpectQuery("SELECT id FROM orders WHERE idempotency_key").WithArgs("quotation-conversion:" + q.ID).WillReturnRows(sqlmock.NewRows([]string{"id"}))
	if q.CustomerPhone != "" {
		mock.ExpectQuery("SELECT id FROM customers WHERE phone").WillReturnRows(sqlmock.NewRows([]string{"id"}))
	}
	mock.ExpectExec("INSERT INTO customers").WillReturnResult(sqlmock.NewResult(0, 1))
	if orders == nil {
		mock.ExpectExec("INSERT INTO orders").WillReturnResult(sqlmock.NewResult(0, 1))
	} else {
		mock.ExpectExec("INSERT INTO orders").WithArgs(quotationCaptureArgs(orders, 35)...).WillReturnResult(sqlmock.NewResult(0, 1))
	}
	for range q.Items {
		if items == nil {
			mock.ExpectExec("INSERT INTO order_items").WillReturnResult(sqlmock.NewResult(0, 1))
		} else {
			mock.ExpectExec("INSERT INTO order_items").WithArgs(quotationCaptureArgs(items, 24)...).WillReturnResult(sqlmock.NewResult(0, 1))
		}
	}
	mock.ExpectExec("UPDATE quotations SET status='CONVERTED'").WillReturnResult(sqlmock.NewResult(0, 1))
	mock.ExpectExec("INSERT INTO audit_logs").WillReturnResult(sqlmock.NewResult(0, 1))
	mock.ExpectCommit()
}
func quotationConvertFixture(t *testing.T, r *gin.Engine, q QuotationRecord) Order {
	t.Helper()
	fixture, mock, err := sqlmock.New()
	if err != nil {
		t.Fatal(err)
	}
	defer fixture.Close()
	prior := db.DB
	db.DB = fixture
	defer func() { db.DB = prior }()
	quotationExpectConversion(mock, q, nil, nil)
	result := quotationTestPost(r, "POST", "/api/v1/quotations/"+q.ID+"/convert", map[string]any{"expected_updated_at": q.UpdatedAt.Format(time.RFC3339Nano), "expected_total_selling_price": q.TotalSellingPrice}, auth.RoleAdmin)
	if result.Code != 201 {
		t.Fatalf("actual fixture conversion%d %s", result.Code, result.Body.String())
	}
	var reply struct {
		Data      Order  `json:"data"`
		Committed bool   `json:"committed"`
		QuoteID   string `json:"quotation_id"`
	}
	if err := json.Unmarshal(result.Body.Bytes(), &reply); err != nil {
		t.Fatal(err)
	}
	if !reply.Committed || reply.QuoteID != q.ID {
		t.Fatal("mismatched conversion ack")
	}
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatal(err)
	}
	return reply.Data
}
func quotationStripReserved(items []map[string]any) []map[string]any {
	copy, _ := quoteCloneItems(items)
	for _, item := range copy {
		delete(quoteObject(item["specs"]), quoteSnapshotKey)
	}
	return copy
}
func quotationCommercialFixture(id string) QuotationRecord {
	return QuotationRecord{ID: id, QuotationNo: "FIXTURE-" + id, CustomerName: "Disposable quotation", Status: "Pending", TotalCost: 1500, TotalSellingPrice: 2600, ShippingFee: 125, OverallProfitPercent: 40, DiscountPercent: 10,
		CommercialSnapshot: map[string]any{"version": float64(1), "currency": "LAK", "total_cost_lak": float64(1500), "final_total_lak": float64(2600), "discounted_subtotal_lak": float64(2250), "tax_amount_lak": float64(225), "shipping_fee_lak": float64(125), "setup_fee_lak": float64(0), "packaging_cost_lak": float64(0), "base_selling_price_lak": float64(2500), "discount_amount_lak": float64(250), "discount_percent": float64(10), "target_margin_percent": float64(40)},
		Items:              []map[string]any{{"name": "Commercial original", "quantity": float64(2), "unit_price_lak": float64(1125), "unitPrice": float64(1125), "total_price_lak": float64(2250), "subtotal": float64(2250), "unit_cost_lak": float64(500), "unitCost": float64(500), "artworkParts": quotationPartsFixture(), "specs": map[string]any{"price_components": map[string]any{"preserved": "original"}, "commercial_cost_snapshot": map[string]any{"net_cost_lak": float64(1000), "labor_cost_lak": float64(300), "packaging_delivery_cost_lak": float64(200), "commercial_cost_lak": float64(1500)}}}},
	}
}
func TestQuotationSavedConversionContract(t *testing.T) {
	for _, name := range []string{"discount and shared charges", "unit rounding", "manager required", "verified zero"} {
		t.Run(name, func(t *testing.T) {
			r := ownershipFixtureRouter(t)
			q := quotationCommercialFixture("contract-" + strings.ReplaceAll(name, " ", "-"))
			if name == "unit rounding" {
				q.Items[0]["quantity"] = float64(3)
				q.Items[0]["unit_price_lak"] = 749.99
				q.Items[0]["unitPrice"] = 749.99
			}
			if name == "manager required" {
				q.Status = "REQUIRES_MANAGER_APPROVAL"
			}
			if name == "verified zero" {
				q.TotalCost = 0
				q.CommercialSnapshot["total_cost_lak"] = float64(0)
				q.CommercialSnapshot["zero_cost_reason"] = "Fixture explicitly free donated materials/labor"
				q.Items[0]["unit_cost_lak"] = float64(0)
				q.Items[0]["unitCost"] = float64(0)
				q.Items[0]["specs"].(map[string]any)["commercial_cost_snapshot"] = map[string]any{"net_cost_lak": float64(0), "labor_cost_lak": float64(0), "packaging_delivery_cost_lak": float64(0), "commercial_cost_lak": float64(0)}
			}
			saved := quotationSaveFixture(t, r, q)
			// Cache values are deliberately wrong: converter must consume committed row, never cached prices.
			cached := saved
			cached.TotalSellingPrice = 999999
			cached.TotalCost = 123456
			quotationsStore[q.ID] = cached
			order := quotationConvertFixture(t, r, saved)
			if order.TotalAmountLAK != q.TotalSellingPrice || order.TotalPrice != q.TotalSellingPrice || order.TotalCost != q.TotalCost || order.DepositLAK != 0 || order.RemainingLAK != q.TotalSellingPrice || order.Items[0].TotalPriceLAK != 2250 || order.Items[0].UnitCostLAK != q.Items[0]["unit_cost_lak"] {
				t.Fatal("committed snapshot/receipt/item costs changed")
			}
			if name == "manager required" && order.Status != StatusRequiresManagerApproval {
				t.Fatal("converter implicitly approved margin")
			}
			if name != "manager required" && order.Status != StatusWaitingDeposit {
				t.Fatal("trusted pre-tax margin state changed")
			}
			if order.Items[0].CoverFileURL != "/uploads/artworks/cover-original.pdf" || order.Items[0].InnerFileURL != "/uploads/artworks/inner-original.pdf" {
				t.Fatal("original role identity changed")
			}
			if name == "unit rounding" && order.Items[0].TotalPriceLAK == order.Items[0].UnitPriceLAK*3 {
				t.Fatal("item subtotal replaced by rounded multiplication")
			}
		})
	}
}
func TestQuotationSavedConversionFailures(t *testing.T) {
	for _, stage := range []string{"storage", "begin", "source read", "missing", "ambiguous", "order lookup", "stale", "body override", "bad key", "missing cost", "contradictory aliases", "unverified zero", "customer write", "order write", "order zero rows", "item write", "source write", "source zero rows", "audit write", "audit zero rows", "commit"} {
		t.Run(stage, func(t *testing.T) {
			r := ownershipFixtureRouter(t)
			q := quotationCommercialFixture("failure-target")
			q.CreatedAt = time.Now().UTC()
			q.UpdatedAt = q.CreatedAt
			q.CostReview = map[string]any{"source": "computed", "user_id": "fixture"}
			if err := normalizeQuotationItems(&q); err != nil {
				t.Fatal(err)
			}
			cached := q
			cachedJSON, _ := json.Marshal(q)
			_ = json.Unmarshal(cachedJSON, &cached)
			quotationsStore[q.ID] = cached
			code := 500
			if stage == "storage" {
				code = 503
				w := quotationTestPost(r, "POST", "/api/v1/quotations/"+q.ID+"/convert", nil, auth.RoleSales)
				if w.Code != code {
					t.Fatalf("storage%d", w.Code)
				}
				return
			}
			fixture, mock, err := sqlmock.New()
			if err != nil {
				t.Fatal(err)
			}
			defer fixture.Close()
			db.DB = fixture
			body := map[string]any{"expected_updated_at": q.UpdatedAt.Format(time.RFC3339Nano), "expected_total_selling_price": q.TotalSellingPrice}
			if stage == "body override" {
				body["total_cost"] = float64(1)
				code = 400
			} else {
				b := mock.ExpectBegin()
				if stage == "begin" {
					b.WillReturnError(errors.New("private fixture failure"))
				} else {
					source := mock.ExpectQuery("SELECT COALESCE").WithArgs(q.ID)
					if stage == "source read" {
						source.WillReturnError(errors.New("private fixture read"))
						mock.ExpectRollback()
					} else if stage == "missing" {
						source.WillReturnRows(sqlmock.NewRows([]string{"id"}))
						mock.ExpectRollback()
						code = 404
					} else if stage == "ambiguous" {
						rows := quotationTestRows(q)
						raw, _ := json.Marshal(q.Items)
						rows.AddRow(q.ID, q.QuotationNo, q.Title, q.CustomerName, q.CustomerPhone, q.CustomerAddress, q.Status, q.TotalCost, q.TotalSellingPrice, q.OverallProfitPercent, q.DiscountPercent, q.SetupFee, q.PackagingCost, q.ShippingFee, q.ExpiryDate, q.Notes, q.ArtworkURL, q.DigitalProofURL, raw, q.CreatedAt, q.UpdatedAt)
						source.WillReturnRows(rows)
						mock.ExpectRollback()
						code = 409
					} else {
						if stage == "missing cost" {
							delete(q.CommercialSnapshot, "total_cost_lak")
							code = 422
						}
						if stage == "unverified zero" {
							q.TotalCost = 0
							q.CommercialSnapshot["total_cost_lak"] = float64(0)
							code = 422
						}
						if stage == "contradictory aliases" {
							q.Items[0]["subtotal"] = float64(1)
							code = 422
						}
						if err := normalizeQuotationItems(&q); err != nil {
							t.Fatal(err)
						}
						source.WillReturnRows(quotationTestRows(q))
						if stage == "bad key" {
							mock.ExpectRollback()
							code = 400
						} else {
							look := mock.ExpectQuery("SELECT id FROM orders WHERE idempotency_key").WithArgs("quotation-conversion:" + q.ID)
							if stage == "order lookup" {
								look.WillReturnError(errors.New("private fixture lookup"))
								mock.ExpectRollback()
							} else {
								look.WillReturnRows(sqlmock.NewRows([]string{"id"}))
								if stage == "stale" {
									body["expected_total_selling_price"] = float64(1)
									code = 409
								}
								if code == 422 || stage == "stale" {
									mock.ExpectRollback()
								} else {
									customer := mock.ExpectExec("INSERT INTO customers")
									if stage == "customer write" {
										customer.WillReturnError(errors.New("private customer failure"))
										mock.ExpectRollback()
									} else {
										customer.WillReturnResult(sqlmock.NewResult(0, 1))
										o := mock.ExpectExec("INSERT INTO orders")
										if stage == "order write" {
											o.WillReturnError(errors.New("private order failure"))
											mock.ExpectRollback()
										} else if stage == "order zero rows" {
											o.WillReturnResult(sqlmock.NewResult(0, 0))
											mock.ExpectRollback()
										} else {
											o.WillReturnResult(sqlmock.NewResult(0, 1))
											item := mock.ExpectExec("INSERT INTO order_items")
											if stage == "item write" {
												item.WillReturnError(errors.New("private item failure"))
												mock.ExpectRollback()
											} else {
												item.WillReturnResult(sqlmock.NewResult(0, 1))
												update := mock.ExpectExec("UPDATE quotations SET status='CONVERTED'")
												if stage == "source write" {
													update.WillReturnError(errors.New("private source failure"))
													mock.ExpectRollback()
												} else if stage == "source zero rows" {
													update.WillReturnResult(sqlmock.NewResult(0, 0))
													mock.ExpectRollback()
												} else {
													update.WillReturnResult(sqlmock.NewResult(0, 1))
													audit := mock.ExpectExec("INSERT INTO audit_logs")
													if stage == "audit write" {
														audit.WillReturnError(errors.New("private audit failure"))
														mock.ExpectRollback()
													} else if stage == "audit zero rows" {
														audit.WillReturnResult(sqlmock.NewResult(0, 0))
														mock.ExpectRollback()
													} else {
														audit.WillReturnResult(sqlmock.NewResult(0, 1))
														mock.ExpectCommit().WillReturnError(errors.New("private commit failure"))
													}
												}
											}
										}
									}
								}
							}
						}
					}
				}
			}
			raw, _ := json.Marshal(body)
			req := httptest.NewRequest("POST", "/api/v1/quotations/"+q.ID+"/convert", bytes.NewReader(raw))
			req.Header.Set("Authorization", "Bearer "+makeUploadTestToken(auth.RoleSales, false, false))
			req.Header.Set("Content-Type", "application/json")
			if stage == "bad key" {
				req.Header.Set("Idempotency-Key", "foreign-quote-key")
			}
			w := httptest.NewRecorder()
			r.ServeHTTP(w, req)
			if w.Code != code {
				t.Fatalf("%s want%d got%d %s", stage, code, w.Code, w.Body.String())
			}
			if bytes.Contains(w.Body.Bytes(), []byte("private")) || bytes.Contains(w.Body.Bytes(), []byte(`"committed":true`)) {
				t.Fatal("failed transaction acknowledged or raw error leaked")
			}
			if len(ordersStore) != 0 || !quoteObjectsEqual(quotationsStore[q.ID], cached) {
				t.Fatal("failure published order/source cache")
			}
			if err := mock.ExpectationsWereMet(); err != nil {
				t.Fatal(err)
			}
		})
	}
}

// Exact mounted frontend requests, not reconstructed calculator DTOs.
func TestQuotationSavedConversionActualFrontendDTO(t *testing.T) {
	for _, key := range []string{"P1_SAVED_BATCH_DTO", "P1_SAVED_CONFIRM_DTO"} {
		t.Run(key, func(t *testing.T) {
			path := os.Getenv(key)
			if path == "" {
				t.Fatal("exact frontend DTO path required by joined runner")
			}
			raw, err := os.ReadFile(path)
			if err != nil {
				t.Fatal(err)
			}
			var original QuotationRecord
			if err := json.Unmarshal(raw, &original); err != nil {
				t.Fatal(err)
			}
			r := ownershipFixtureRouter(t)
			fixture, mock, err := sqlmock.New()
			if err != nil {
				t.Fatal(err)
			}
			defer fixture.Close()
			prior := db.DB
			db.DB = fixture
			defer func() { db.DB = prior }()
			mock.ExpectBegin()
			mock.ExpectQuery("SELECT COALESCE").WithArgs(original.ID).WillReturnRows(sqlmock.NewRows([]string{"id"}))
			mock.ExpectQuery("SELECT id FROM customers WHERE phone").WillReturnRows(sqlmock.NewRows([]string{"id"}))
			mock.ExpectExec("INSERT INTO customers").WillReturnResult(sqlmock.NewResult(0, 1))
			var values []driver.Value
			mock.ExpectExec("INSERT INTO quotations").WithArgs(quotationCaptureArgs(&values, 21)...).WillReturnResult(sqlmock.NewResult(0, 1))
			mock.ExpectExec("INSERT INTO audit_logs").WillReturnResult(sqlmock.NewResult(0, 1))
			mock.ExpectCommit()
			req := httptest.NewRequest("POST", "/api/v1/quotations", bytes.NewReader(raw))
			req.Header.Set("Authorization", "Bearer "+makeUploadTestToken(auth.RoleAdmin, false, false))
			req.Header.Set("Content-Type", "application/json")
			w := httptest.NewRecorder()
			r.ServeHTTP(w, req)
			if w.Code != 200 {
				t.Fatalf("exact mounted save%d: %s", w.Code, w.Body.String())
			}
			var saved QuotationRecord
			if err := json.Unmarshal(w.Body.Bytes(), &saved); err != nil {
				t.Fatal(err)
			}
			if !saved.Committed || values[7] != original.TotalCost || values[8] != original.TotalSellingPrice {
				t.Fatal("save changed actual calculator money")
			}
			if err := mock.ExpectationsWereMet(); err != nil {
				t.Fatal(err)
			}
			order := quotationConvertFixture(t, r, saved)
			if order.TotalCost != original.TotalCost || order.TotalAmountLAK != original.TotalSellingPrice || order.DepositLAK != 0 || order.RemainingLAK != original.TotalSellingPrice {
				t.Fatal("actual mounted money/receipt changed")
			}
			for i, item := range original.Items {
				unit, _ := quoteNumber(item["unit_cost_lak"])
				subtotal, _ := quoteNumber(item["total_price_lak"])
				if order.Items[i].UnitCostLAK != unit || order.Items[i].TotalPriceLAK != subtotal {
					t.Fatal("net unit cost or final subtotal changed")
				}
			}
		})
	}
}

// Disposable prerequisite schema is scoped handler evidence, not full migration bootstrap.
func TestQuotationSavedConversionPostgres(t *testing.T) {
	rawDSN := os.Getenv("TEST_FIXTURE_DSN")
	u, parseErr := url.Parse(rawDSN)
	if parseErr != nil || u.Scheme != "postgres" || u.Hostname() != "127.0.0.1" || u.Port() != "55432" || u.Path != "/somsing_fixture_db" {
		t.Fatal("refusing non-owned fixture DSN")
	}
	for key, values := range u.Query() {
		if len(values) != 1 || !((key == "sslmode" && values[0] == "disable") || (key == "connect_timeout" && values[0] == "5")) {
			t.Fatal("refusing fixture DSN option")
		}
	}
	dsn, err := db.ParseAndValidateDSN(rawDSN)
	if err != nil {
		t.Fatal(err)
	}
	control, err := sql.Open("postgres", dsn)
	if err != nil {
		t.Fatal(err)
	}
	defer control.Close()
	token, err := generateTrackingToken()
	if err != nil {
		t.Fatal(err)
	}
	schema := "quote_fixture_" + token
	must := func(statement string, args ...any) {
		t.Helper()
		if _, err := control.Exec(statement, args...); err != nil {
			t.Fatal(err)
		}
	}
	must("CREATE SCHEMA " + schema)
	prior := db.DB
	var pool *sql.DB
	defer func() {
		db.DB = prior
		if pool != nil {
			pool.Close()
		}
		must("ALTER DATABASE somsing_fixture_db RESET search_path")
		must("DROP SCHEMA " + schema + " CASCADE")
	}()
	must("SET search_path TO " + schema + ",public")
	must("ALTER DATABASE somsing_fixture_db SET search_path TO " + schema + ",public")
	must(`CREATE TABLE customers (id text PRIMARY KEY, name text DEFAULT '', phone text DEFAULT '', email text DEFAULT '', address text DEFAULT '', province text DEFAULT '', district text DEFAULT '', village text DEFAULT '', credit_limit numeric DEFAULT 0, payment_terms text DEFAULT '', total_spent_lak numeric DEFAULT 0, total_orders_count numeric DEFAULT 0, created_at timestamptz, updated_at timestamptz);
CREATE TABLE orders (id text PRIMARY KEY, order_no text DEFAULT '', order_number text DEFAULT '', customer_id text DEFAULT '', customer_name text DEFAULT '', customer_phone text DEFAULT '', customer_email text DEFAULT '', customer_address text DEFAULT '', status text DEFAULT '', overall_status text DEFAULT '', deposit_amount numeric DEFAULT 0, deposit_lak numeric DEFAULT 0, remaining_lak numeric DEFAULT 0, total_price numeric DEFAULT 0, total_amount_lak numeric DEFAULT 0, total_cost numeric DEFAULT 0, delivery_date text DEFAULT '', google_drive_link text DEFAULT '', stock_deducted_at timestamptz, proof_url text DEFAULT '', digital_proof_url text DEFAULT '', proof_version numeric DEFAULT 0, proof_status text DEFAULT '', proof_feedback text DEFAULT '', prepress_notes text DEFAULT '', proof_approved_at timestamptz, proof_rejected_at timestamptz, proof_signature_ip text DEFAULT '', proof_rejection_reason text DEFAULT '', tracking_code text DEFAULT '', internal_tracking_code text DEFAULT '', public_tracking_token text DEFAULT '', courier_name text DEFAULT '', branch_code text DEFAULT '', idempotency_key text DEFAULT '', created_at timestamptz, updated_at timestamptz, notes text DEFAULT '');
CREATE TABLE order_items (id text PRIMARY KEY, order_id text DEFAULT '', job_name text DEFAULT '', item_name text DEFAULT '', quantity numeric DEFAULT 0, page_count numeric DEFAULT 0, paper_size text DEFAULT '', cover_paper_id text DEFAULT '', inner_paper_id text DEFAULT '', cover_file_url text DEFAULT '', inner_file_url text DEFAULT '', binding_type text DEFAULT '', spine_width_mm numeric DEFAULT 0, current_step text DEFAULT '', avg_cov_c numeric DEFAULT 0, avg_cov_m numeric DEFAULT 0, avg_cov_y numeric DEFAULT 0, avg_cov_k numeric DEFAULT 0, unit_cost_lak numeric DEFAULT 0, unit_price_lak numeric DEFAULT 0, total_price_lak numeric DEFAULT 0, unit_price_snapshot numeric DEFAULT 0, cost_price_snapshot numeric DEFAULT 0, specs jsonb, created_at timestamptz, updated_at timestamptz);
CREATE TABLE quotations (id text PRIMARY KEY, quotation_no text DEFAULT '', title text DEFAULT '', customer_name text DEFAULT '', customer_phone text DEFAULT '', customer_address text DEFAULT '', status text DEFAULT '', total_cost numeric DEFAULT 0, total_selling_price text DEFAULT '', overall_profit_percent numeric DEFAULT 0, discount_percent numeric DEFAULT 0, setup_fee numeric DEFAULT 0, packaging_cost numeric DEFAULT 0, shipping_fee numeric DEFAULT 0, expiry_date text DEFAULT '', notes text DEFAULT '', artwork_url text DEFAULT '', digital_proof_url text DEFAULT '', items_json jsonb, created_at timestamptz, updated_at timestamptz, quotation_id uuid);
CREATE TABLE audit_logs (id text PRIMARY KEY, user_id text DEFAULT '', user_name text DEFAULT '', action text DEFAULT '', resource_type text DEFAULT '', resource_id text DEFAULT '', old_values jsonb, new_values jsonb, ip_address text DEFAULT '', created_at timestamptz);
CREATE TABLE bank_transaction_logs(trans_ref text);`)
	migration, err := os.ReadFile("../migrations/024_idempotency_and_order_persistence.sql")
	if err != nil {
		t.Fatal(err)
	}
	must(string(migration))
	reopen := func() {
		if pool != nil {
			pool.Close()
		}
		pool, err = sql.Open("postgres", dsn)
		if err != nil {
			t.Fatal(err)
		}
		pool.SetMaxOpenConns(8)
		if err = pool.Ping(); err != nil {
			t.Fatal(err)
		}
		db.DB = pool
	}
	reopen()
	r := ownershipFixtureRouter(t)
	db.DB = pool
	save := func(q QuotationRecord, method string, role string) QuotationRecord {
		path := "/api/v1/quotations"
		if method == "PUT" {
			path += "/" + q.ID
		}
		w := quotationTestPost(r, method, path, q, role)
		if w.Code != 200 {
			t.Fatalf("real save%d %s", w.Code, w.Body.String())
		}
		var result QuotationRecord
		if err := json.Unmarshal(w.Body.Bytes(), &result); err != nil {
			t.Fatal(err)
		}
		return result
	}
	source := save(quotationCommercialFixture("pg-concurrent"), "POST", auth.RoleSales)
	body := map[string]any{"expected_updated_at": source.UpdatedAt.Format(time.RFC3339Nano), "expected_total_selling_price": source.TotalSellingPrice}
	var wg sync.WaitGroup
	replies := make([]*httptest.ResponseRecorder, 2)
	for i := range replies {
		wg.Add(1)
		go func(i int) {
			defer wg.Done()
			replies[i] = quotationTestPost(r, "POST", "/api/v1/quotations/"+source.ID+"/convert", body, auth.RoleSales)
		}(i)
	}
	wg.Wait()
	ids := []string{}
	created, replayed := 0, 0
	for _, w := range replies {
		if w.Code == 201 {
			created++
		} else if w.Code == 200 {
			replayed++
		} else {
			t.Fatalf("concurrent real conversion%d %s", w.Code, w.Body.String())
		}
		var ack struct {
			OrderID string `json:"order_id"`
		}
		json.Unmarshal(w.Body.Bytes(), &ack)
		ids = append(ids, ack.OrderID)
	}
	if created != 1 || replayed != 1 || ids[0] != ids[1] {
		t.Fatal("concurrent conversion duplicated source")
	}
	var count int
	if err := pool.QueryRow("SELECT count(*) FROM orders WHERE idempotency_key=$1", "quotation-conversion:"+source.ID).Scan(&count); err != nil || count != 1 {
		t.Fatalf("rowcount%d %v", count, err)
	}
	// Fixture-only receipt mutation demonstrates replay hydration, not payment handler verification.
	must("UPDATE orders SET deposit_lak=125,deposit_amount=125,remaining_lak=2475,status='IN_PRODUCTION',overall_status='IN_PRODUCTION' WHERE id=$1", ids[0])
	storeMutex.Lock()
	ordersStore = map[string]Order{}
	storeMutex.Unlock()
	quoteMutex.Lock()
	quotationsStore = map[string]QuotationRecord{}
	quoteMutex.Unlock()
	reopen()
	r = ownershipFixtureRouter(t)
	db.DB = pool
	w := quotationTestPost(r, "POST", "/api/v1/quotations/"+source.ID+"/convert", body, auth.RoleSales)
	if w.Code != 200 {
		t.Fatalf("reconnected replay%d %s", w.Code, w.Body.String())
	}
	var receipt struct {
		Data Order `json:"data"`
	}
	json.Unmarshal(w.Body.Bytes(), &receipt)
	if receipt.Data.ID != ids[0] || receipt.Data.DepositLAK != 125 || receipt.Data.RemainingLAK != 2475 || receipt.Data.Status != StatusInProduction {
		t.Fatal("replay reset legitimate fixture receipt/status")
	}

	for _, key := range []string{"P1_SAVED_BATCH_DTO", "P1_SAVED_CONFIRM_DTO"} {
		raw, err := os.ReadFile(os.Getenv(key))
		if err != nil {
			t.Fatal(err)
		}
		var original QuotationRecord
		if err = json.Unmarshal(raw, &original); err != nil {
			t.Fatal(err)
		}
		req := httptest.NewRequest("POST", "/api/v1/quotations", bytes.NewReader(raw))
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("Authorization", "Bearer "+makeUploadTestToken(auth.RoleSales, false, false))
		ack := httptest.NewRecorder()
		r.ServeHTTP(ack, req)
		if ack.Code != 200 {
			t.Fatalf("PG exact DTO save%d %s", ack.Code, ack.Body.String())
		}
		saved, err := loadQuotation(pool, original.ID, false)
		if err != nil {
			t.Fatal(err)
		}
		if saved.TotalCost != original.TotalCost || saved.TotalSellingPrice != original.TotalSellingPrice || !quoteObjectsEqual(saved.CommercialSnapshot, original.CommercialSnapshot) {
			t.Fatal("PG exact commercial readback changed")
		}
		converted := quotationTestPost(r, "POST", "/api/v1/quotations/"+saved.ID+"/convert", map[string]any{"expected_updated_at": saved.UpdatedAt.Format(time.RFC3339Nano), "expected_total_selling_price": saved.TotalSellingPrice}, auth.RoleSales)
		if converted.Code != 201 {
			t.Fatalf("PG exact DTO convert%d %s", converted.Code, converted.Body.String())
		}
		persisted, err := getOrderByIdempotencyKeyFromDB("quotation-conversion:" + saved.ID)
		if err != nil {
			t.Fatal(err)
		}
		if persisted.TotalCost != original.TotalCost || persisted.TotalAmountLAK != original.TotalSellingPrice || persisted.DepositLAK != 0 || persisted.RemainingLAK != original.TotalSellingPrice {
			t.Fatal("PG frontend sale/cost/receipt changed")
		}
		for i, item := range original.Items {
			unit, _ := quoteNumber(item["unit_cost_lak"])
			subtotal, _ := quoteNumber(item["total_price_lak"])
			cover, inner, artwork, _ := quotationArtworkSnapshot(item)
			actual := persisted.Items[i]
			if actual.UnitCostLAK != unit || actual.TotalPriceLAK != subtotal || actual.CoverFileURL != cover || actual.InnerFileURL != inner {
				t.Fatal("PG mounted item snapshot changed")
			}
			if artwork != nil && (actual.ArtworkURL != artwork.FileURL || actual.ArtworkFileName != artwork.FileName || actual.ArtworkFileSize != artwork.FileSizeBytes) {
				t.Fatal("PG original metadata changed")
			}
		}
		must("UPDATE orders SET deposit_lak=125,deposit_amount=125,remaining_lak=total_amount_lak-125,status='IN_PRODUCTION',overall_status='IN_PRODUCTION' WHERE id=$1", persisted.ID)
		validReplay := quotationTestPost(r, "POST", "/api/v1/quotations/"+saved.ID+"/convert", map[string]any{}, auth.RoleSales)
		if validReplay.Code != 200 {
			t.Fatalf("valid single/batch original proof%d %s", validReplay.Code, validReplay.Body.String())
		}

	}
	historical := save(quotationCommercialFixture("pg-historical"), "POST", auth.RoleSales)
	incompatible, err := makeQuotationOrder(historical)
	if err != nil {
		t.Fatal(err)
	}
	if err := saveOrderToDB(incompatible); err != nil {
		t.Fatal(err)
	}
	conflict := quotationTestPost(r, "POST", "/api/v1/quotations/"+historical.ID+"/convert", map[string]any{}, auth.RoleSales)
	if conflict.Code != 409 || !strings.Contains(conflict.Body.String(), "existing_conversion_requires_review") || !strings.Contains(conflict.Body.String(), incompatible.ID) {
		t.Fatalf("historical key reconcile%d %s", conflict.Code, conflict.Body.String())
	}
	legacy := quotationCommercialFixture("pg-legacy")
	legacy.TotalCost = 0
	legacy.CommercialSnapshot = nil
	legacy = save(legacy, "POST", auth.RoleSales)
	complete := quotationCommercialFixture(legacy.ID)
	complete.SnapshotCompletionReason = "Documented fixture review"
	denied := quotationTestPost(r, "PUT", "/api/v1/quotations/"+legacy.ID, complete, auth.RoleSales)
	if denied.Code != 403 {
		t.Fatalf("sales completion%d", denied.Code)
	}
	reviewed := save(complete, "PUT", auth.RoleManager)
	if reviewed.CostReview["source"] != "manager_reviewed" {
		t.Fatal("server review provenance missing")
	}
	if err := pool.QueryRow("SELECT count(*) FROM audit_logs WHERE resource_id=$1 AND action='QUOTATION_SNAPSHOT_COMPLETED'", legacy.ID).Scan(&count); err != nil || count != 1 {
		t.Fatal("completion audit missing", err)
	}
	rollback := save(quotationCommercialFixture("pg-rollback"), "POST", auth.RoleSales)
	must(`CREATE FUNCTION reject_fixture_conversion() RETURNS trigger AS $$ BEGIN IF NEW.id='pg-rollback' AND NEW.status='CONVERTED' THEN RAISE EXCEPTION 'fixture checked source failure'; END IF; RETURN NEW; END; $$ LANGUAGE plpgsql; CREATE TRIGGER reject_fixture_conversion BEFORE UPDATE ON quotations FOR EACH ROW EXECUTE FUNCTION reject_fixture_conversion();`)
	failed := quotationTestPost(r, "POST", "/api/v1/quotations/"+rollback.ID+"/convert", map[string]any{}, auth.RoleSales)
	if failed.Code != 500 {
		t.Fatalf("real rollback%d %s", failed.Code, failed.Body.String())
	}
	if err := pool.QueryRow("SELECT count(*) FROM orders WHERE idempotency_key=$1", "quotation-conversion:"+rollback.ID).Scan(&count); err != nil || count != 0 {
		t.Fatal("rolled-back order published", err)
	}

	t.Run("F1 contradictory zero provenance", func(t *testing.T) {
		for _, field := range []string{"unit", "net_cost_lak", "labor_cost_lak", "packaging_delivery_cost_lak", "commercial_cost_lak", "setup", "packaging"} {
			zero := quotationCommercialFixture("zero-reject-" + field)
			zero.TotalCost = 0
			zero.CommercialSnapshot["total_cost_lak"] = float64(0)
			zero.CommercialSnapshot["zero_cost_reason"] = "Reason cannot override positive costs"
			zero.Items[0]["unit_cost_lak"] = float64(0)
			zero.Items[0]["unitCost"] = float64(0)
			costs := map[string]any{"net_cost_lak": float64(0), "labor_cost_lak": float64(0), "packaging_delivery_cost_lak": float64(0), "commercial_cost_lak": float64(0)}
			zero.Items[0]["specs"].(map[string]any)["commercial_cost_snapshot"] = costs
			if field == "unit" {
				zero.Items[0]["unit_cost_lak"] = float64(500)
				zero.Items[0]["unitCost"] = float64(500)
			} else if field == "setup" {
				zero.SetupFee = 1
				zero.CommercialSnapshot["setup_fee_lak"] = float64(1)
			} else if field == "packaging" {
				zero.PackagingCost = 1
				zero.CommercialSnapshot["packaging_cost_lak"] = float64(1)
			} else {
				costs[field] = float64(1)
			}
			denied := quotationTestPost(r, "POST", "/api/v1/quotations", zero, auth.RoleSales)
			if denied.Code != 422 {
				t.Fatalf("%s contradictory zero save%d %s", field, denied.Code, denied.Body.String())
			}
			if _, published := quotationsStore[zero.ID]; published {
				t.Fatal("rejected zero published")
			}
			var count int
			for _, table := range []string{"quotations", "orders", "audit_logs"} {
				column := "id"
				if table == "orders" {
					column = "idempotency_key"
				} else if table == "audit_logs" {
					column = "resource_id"
				}
				value := zero.ID
				if table == "orders" {
					value = "quotation-conversion:" + zero.ID
				}
				if err := pool.QueryRow("SELECT count(*) FROM "+table+" WHERE "+column+"=$1", value).Scan(&count); err != nil || count != 0 {
					t.Fatal("rejected zero persisted", table, err)
				}
			}
		}
		old := save(quotationCommercialFixture("zero-stored-contradiction"), "POST", auth.RoleSales)
		old.TotalCost = 0
		old.CommercialSnapshot["total_cost_lak"] = float64(0)
		old.CommercialSnapshot["zero_cost_reason"] = "Untrusted stored zero"
		if err := normalizeQuotationItems(&old); err != nil {
			t.Fatal(err)
		}
		raw, _ := json.Marshal(old.Items)
		must("UPDATE quotations SET total_cost=0,items_json=$1::jsonb WHERE id=$2", string(raw), old.ID)
		before, _ := loadQuotation(pool, old.ID, false)
		beforeJSON, _ := json.Marshal(before)
		cacheQuotesBefore, _ := json.Marshal(quotationsStore)
		cacheOrdersBefore, _ := json.Marshal(ordersStore)
		denied := quotationTestPost(r, "POST", "/api/v1/quotations/"+old.ID+"/convert", map[string]any{}, auth.RoleSales)
		after, _ := loadQuotation(pool, old.ID, false)
		afterJSON, _ := json.Marshal(after)
		cacheQuotesAfter, _ := json.Marshal(quotationsStore)
		cacheOrdersAfter, _ := json.Marshal(ordersStore)
		if !bytes.Equal(cacheQuotesBefore, cacheQuotesAfter) || !bytes.Equal(cacheOrdersBefore, cacheOrdersAfter) {
			t.Fatal("contradictory zero published cache state")
		}
		if err := pool.QueryRow("SELECT count(*) FROM audit_logs WHERE resource_id=$1", old.ID).Scan(&count); err != nil || count != 1 {
			t.Fatal("rejected zero changed existing audit", err)
		}
		if denied.Code != 422 || !bytes.Equal(beforeJSON, afterJSON) {
			t.Fatal("stored contradictory conversion changed source")
		}
		if err := pool.QueryRow("SELECT count(*) FROM orders WHERE idempotency_key=$1", "quotation-conversion:"+old.ID).Scan(&count); err != nil || count != 0 {
			t.Fatal("contradictory order created", err)
		}
		if err := pool.QueryRow("SELECT count(*) FROM audit_logs WHERE resource_id=$1 AND action='QUOTATION_CONVERTED'", old.ID).Scan(&count); err != nil || count != 0 {
			t.Fatal("contradictory conversion audit", err)
		}
		// A documented manager completion remains valid when every cost is actually zero.
		legacyZero := quotationCommercialFixture("manager-zero")
		legacyZero.CommercialSnapshot = nil
		legacyZero.TotalCost = 0
		legacyZero = save(legacyZero, "POST", auth.RoleSales)
		complete := quotationCommercialFixture(legacyZero.ID)
		complete.TotalCost = 0
		complete.CommercialSnapshot["total_cost_lak"] = float64(0)
		complete.CommercialSnapshot["zero_cost_reason"] = "Donated all material/labor"
		complete.SnapshotCompletionReason = "Verified donation"
		complete.Items[0]["unit_cost_lak"] = float64(0)
		complete.Items[0]["unitCost"] = float64(0)
		complete.Items[0]["specs"].(map[string]any)["commercial_cost_snapshot"] = map[string]any{"net_cost_lak": float64(0), "labor_cost_lak": float64(0), "packaging_delivery_cost_lak": float64(0), "commercial_cost_lak": float64(0)}
		reviewed := save(complete, "PUT", auth.RoleManager)
		if reviewed.CostReview["source"] != "manager_reviewed" {
			t.Fatal("zero completion lost audit provenance")
		}
		valid := quotationTestPost(r, "POST", "/api/v1/quotations/"+reviewed.ID+"/convert", map[string]any{}, auth.RoleSales)
		if valid.Code != 201 {
			t.Fatalf("genuine manager zero%d %s", valid.Code, valid.Body.String())
		}
	})
	t.Run("F2 stable source identity and mutable production", func(t *testing.T) {
		multi := quotationCommercialFixture("multi-stable")
		seed := multi.Items[0]
		multi.Items = nil
		subtotal := float64(0)
		for i := 0; i < 13; i++ {
			clone, _ := quoteCloneItems([]map[string]any{seed})
			job := clone[0]
			job["name"] = fmt.Sprintf("Distinct job %d", i)
			if i == 3 {
				job["name"] = "Fixture (Parent Sheets)"
			}
			unit := float64(100 + i)
			job["unit_price_lak"] = unit
			job["unitPrice"] = unit
			job["total_price_lak"] = unit * 2
			job["subtotal"] = unit * 2
			if i != 3 {
				subtotal += unit * 2
			}
			multi.Items = append(multi.Items, job)
		}
		multi.TotalSellingPrice = subtotal + 350
		multi.CommercialSnapshot["discounted_subtotal_lak"] = subtotal
		multi.CommercialSnapshot["final_total_lak"] = multi.TotalSellingPrice
		multi = save(multi, "POST", auth.RoleSales)
		created := quotationTestPost(r, "POST", "/api/v1/quotations/"+multi.ID+"/convert", map[string]any{}, auth.RoleSales)
		if created.Code != 201 {
			t.Fatalf("multi create%d %s", created.Code, created.Body.String())
		}
		var ack struct {
			Data Order `json:"data"`
		}
		json.Unmarshal(created.Body.Bytes(), &ack)
		if len(ack.Data.Items) != 12 {
			t.Fatal("parent sheet was converted")
		}
		must("UPDATE order_items SET current_step='PREPRESS' WHERE id=$1", ack.Data.Items[0].ID)
		must("UPDATE orders SET status='IN_PRODUCTION',overall_status='IN_PRODUCTION',deposit_lak=125,deposit_amount=125,remaining_lak=total_amount_lak-125 WHERE id=$1", ack.Data.ID)
		reopen()
		storeMutex.Lock()
		ordersStore = map[string]Order{}
		storeMutex.Unlock()
		quoteMutex.Lock()
		quotationsStore = map[string]QuotationRecord{}
		quoteMutex.Unlock()
		var wg sync.WaitGroup
		replies := make([]*httptest.ResponseRecorder, 2)
		for i := range replies {
			wg.Add(1)
			go func(i int) {
				defer wg.Done()
				replies[i] = quotationTestPost(r, "POST", "/api/v1/quotations/"+multi.ID+"/convert", map[string]any{}, auth.RoleSales)
			}(i)
		}
		wg.Wait()
		for _, reply := range replies {
			if reply.Code != 200 {
				t.Fatalf("compatible multi replay%d %s", reply.Code, reply.Body.String())
			}
			var current struct {
				Data Order `json:"data"`
			}
			json.Unmarshal(reply.Body.Bytes(), &current)
			if current.Data.ID != ack.Data.ID || current.Data.DepositLAK != 125 || current.Data.Status != StatusInProduction {
				t.Fatal("multi replay reset state")
			}
			found := false
			for _, job := range current.Data.Items {
				if job.ID == ack.Data.Items[0].ID {
					found = job.CurrentStep == ProductionStep("PREPRESS")
				}
			}
			if !found {
				t.Fatal("replay discarded current job step")
			}
		}
		// A distinct source with the same jobs must retain its own order and proof.
		sibling := multi
		sibling.ID = "multi-sibling"
		sibling.QuotationNo = "FIXTURE-multi-sibling"
		sibling.Items, _ = quoteCloneItems(multi.Items)
		sibling = save(sibling, "POST", auth.RoleSales)
		siblingFirst := quotationTestPost(r, "POST", "/api/v1/quotations/"+sibling.ID+"/convert", map[string]any{}, auth.RoleSales)
		if siblingFirst.Code != 201 {
			t.Fatal("distinct multi source create")
		}
		var siblingAck struct {
			Data Order `json:"data"`
		}
		json.Unmarshal(siblingFirst.Body.Bytes(), &siblingAck)
		if siblingAck.Data.ID == ack.Data.ID {
			t.Fatal("distinct quotes shared order")
		}
		siblingAgain := quotationTestPost(r, "POST", "/api/v1/quotations/"+sibling.ID+"/convert", map[string]any{}, auth.RoleSales)
		if siblingAgain.Code != 200 {
			t.Fatalf("distinct multi replay%d %s", siblingAgain.Code, siblingAgain.Body.String())
		}
		// Missing and unexpected durable identity remain incompatible.
		itemID := ack.Data.Items[0].ID
		must("UPDATE order_items SET id='unexpected-fixture-item' WHERE id=$1", itemID)
		bad := quotationTestPost(r, "POST", "/api/v1/quotations/"+multi.ID+"/convert", map[string]any{}, auth.RoleSales)
		if bad.Code != 409 {
			t.Fatal("unexpected durable identity accepted")
		}
		must("UPDATE order_items SET id=$1 WHERE id='unexpected-fixture-item'", itemID)
	})
	t.Run("F3 immutable original and calculator proof", func(t *testing.T) {
		corrupt := save(quotationCommercialFixture("immutable-proof"), "POST", auth.RoleSales)
		initial := quotationTestPost(r, "POST", "/api/v1/quotations/"+corrupt.ID+"/convert", map[string]any{}, auth.RoleSales)
		if initial.Code != 201 {
			t.Fatal("proof fixture create")
		}
		var ack struct {
			Data Order `json:"data"`
		}
		json.Unmarshal(initial.Body.Bytes(), &ack)
		item := ack.Data.Items[0]
		originalJSON, _ := json.Marshal(item.Specs)
		for _, path := range []string{"{artwork_parts,1,source,mimeType}", "{artwork_parts,1,source,url}", "{artwork_parts,1,role}", "{artwork_parts,1,coverage,k}", "{commercial_cost_snapshot,net_cost_lak}", "{price_components,preserved}"} {
			must("UPDATE order_items SET specs=jsonb_set(specs,$1::text[],to_jsonb('corrupted-fixture-proof'::text)) WHERE id=$2", path, item.ID)
			failed := quotationTestPost(r, "POST", "/api/v1/quotations/"+corrupt.ID+"/convert", map[string]any{}, auth.RoleSales)
			if failed.Code != 409 || !strings.Contains(failed.Body.String(), ack.Data.ID) {
				t.Fatalf("immutable %s replay%d %s", path, failed.Code, failed.Body.String())
			}
			if err := pool.QueryRow("SELECT count(*) FROM orders WHERE idempotency_key=$1", "quotation-conversion:"+corrupt.ID).Scan(&count); err != nil || count != 1 {
				t.Fatal("proof conflict created replacement", err)
			}
			must("UPDATE order_items SET specs=$1::jsonb WHERE id=$2", string(originalJSON), item.ID)
		}
		must("UPDATE orders SET deposit_lak=125,deposit_amount=125,remaining_lak=2475,status='IN_PRODUCTION',overall_status='IN_PRODUCTION' WHERE id=$1", ack.Data.ID)
		valid := quotationTestPost(r, "POST", "/api/v1/quotations/"+corrupt.ID+"/convert", map[string]any{}, auth.RoleSales)
		if valid.Code != 200 {
			t.Fatalf("restored split proof%d %s", valid.Code, valid.Body.String())
		}
	})

	t.Run("F4 compatible saves preserve frozen review and replay", func(t *testing.T) {
		for _, sourceKind := range []string{"computed", "manager_reviewed"} {
			t.Run(sourceKind, func(t *testing.T) {
				original := quotationCommercialFixture("compatible-" + sourceKind)
				if sourceKind == "manager_reviewed" {
					incomplete := quotationCommercialFixture(original.ID)
					incomplete.CommercialSnapshot = nil
					incomplete.TotalCost = 0
					save(incomplete, "POST", auth.RoleSales)
					original.SnapshotCompletionReason = "Documented manager cost completion"
					original = save(original, "PUT", auth.RoleManager)
				} else {
					original = save(original, "POST", auth.RoleSales)
				}
				created := quotationTestPost(r, "POST", "/api/v1/quotations/"+original.ID+"/convert", map[string]any{}, auth.RoleSales)
				if created.Code != 201 {
					t.Fatalf("compatible create%d %s", created.Code, created.Body.String())
				}
				var ack struct {
					Data Order `json:"data"`
				}
				json.Unmarshal(created.Body.Bytes(), &ack)
				must("UPDATE orders SET deposit_lak=125,deposit_amount=125,remaining_lak=2475,status='IN_PRODUCTION',overall_status='IN_PRODUCTION' WHERE id=$1", ack.Data.ID)
				must("UPDATE order_items SET current_step='PREPRESS' WHERE order_id=$1", ack.Data.ID)
				frozen, err := loadQuotation(pool, original.ID, false)
				if err != nil {
					t.Fatal(err)
				}
				review, _ := json.Marshal(frozen.CostReview)
				conversion, _ := json.Marshal(frozen.Conversion)
				items, _ := json.Marshal(frozen.Items)
				if frozen.CostReview["source"] != sourceKind {
					t.Fatal("wrong initial provenance")
				}
				var auditsBefore int
				if err := pool.QueryRow("SELECT count(*) FROM audit_logs WHERE resource_id=$1", original.ID).Scan(&auditsBefore); err != nil {
					t.Fatal(err)
				}
				for _, operation := range []string{"notes-only", "no-op"} {
					current, err := loadQuotation(pool, original.ID, false)
					if err != nil {
						t.Fatal(err)
					}
					if operation == "notes-only" {
						current.Notes = "Nonfinancial follow-up remains retryable"
					}
					// Actual callers strip reserved proof; spoofed root proof must never replace stored authority.
					current.CostReview = map[string]any{"source": "spoofed", "user_id": "client", "reviewed_at": "client"}
					current.Conversion = map[string]any{"order_id": "client"}
					for _, job := range current.Items {
						delete(quoteObject(job["specs"]), quoteSnapshotKey)
					}
					saved := save(current, "PUT", auth.RoleSales)
					stored, err := loadQuotation(pool, original.ID, false)
					if err != nil {
						t.Fatal(err)
					}
					afterReview, _ := json.Marshal(stored.CostReview)
					afterConversion, _ := json.Marshal(stored.Conversion)
					afterItems, _ := json.Marshal(stored.Items)
					if !bytes.Equal(review, afterReview) || !bytes.Equal(conversion, afterConversion) || !bytes.Equal(items, afterItems) || !quoteObjectsEqual(saved.CostReview, stored.CostReview) || stored.Notes != "Nonfinancial follow-up remains retryable" {
						t.Fatal("compatible save rewrote frozen proof")
					}
					reopen()
					storeMutex.Lock()
					ordersStore = map[string]Order{}
					storeMutex.Unlock()
					quoteMutex.Lock()
					quotationsStore = map[string]QuotationRecord{}
					quoteMutex.Unlock()
					replay := quotationTestPost(r, "POST", "/api/v1/quotations/"+original.ID+"/convert", map[string]any{"expected_updated_at": original.UpdatedAt.Format(time.RFC3339Nano), "expected_total_selling_price": original.TotalSellingPrice}, auth.RoleSales)
					if replay.Code != 200 {
						t.Fatalf("%s save-reload-replay%d %s", operation, replay.Code, replay.Body.String())
					}
					var currentOrder struct {
						Data Order `json:"data"`
					}
					json.Unmarshal(replay.Body.Bytes(), &currentOrder)
					if currentOrder.Data.ID != ack.Data.ID || currentOrder.Data.DepositLAK != 125 || currentOrder.Data.RemainingLAK != 2475 || currentOrder.Data.Status != StatusInProduction || currentOrder.Data.Items[0].CurrentStep != ProductionStep("PREPRESS") {
						t.Fatal("compatible save replay changed current state")
					}
				}
				var auditsAfter int
				if err := pool.QueryRow("SELECT count(*) FROM audit_logs WHERE resource_id=$1", original.ID).Scan(&auditsAfter); err != nil || auditsAfter != auditsBefore+2 {
					t.Fatal("compatible saves were not audited", err)
				}
				for _, field := range []string{"money", "item"} {
					before, err := loadQuotation(pool, original.ID, false)
					if err != nil {
						t.Fatal(err)
					}
					beforeJSON, _ := json.Marshal(before)
					incompatible := before
					incompatible.Items, _ = quoteCloneItems(before.Items)
					if field == "money" {
						incompatible.TotalCost++
					} else {
						incompatible.Items[0]["name"] = "Changed immutable job"
					}
					denied := quotationTestPost(r, "PUT", "/api/v1/quotations/"+original.ID, incompatible, auth.RoleSales)
					after, err := loadQuotation(pool, original.ID, false)
					if err != nil {
						t.Fatal(err)
					}
					afterJSON, _ := json.Marshal(after)
					if denied.Code != 409 || !bytes.Equal(beforeJSON, afterJSON) {
						t.Fatal("incompatible converted save mutated source")
					}
					var count int
					if err := pool.QueryRow("SELECT count(*) FROM orders WHERE idempotency_key=$1", "quotation-conversion:"+original.ID).Scan(&count); err != nil || count != 1 {
						t.Fatal("incompatible save replaced order", err)
					}
				}
			})
		}
	})

	t.Log("PASS real PG source locking/concurrent201+200/same-order/reconnect/cache-clear/receipt replay/manager completion audit/source-failure rollback; synthetic prerequisites + real024 only")
}

func TestQuotationSavedConversionSaveFailures(t *testing.T) {
	for _, stage := range []string{"begin", "read", "customer", "quotation", "quotation zero", "audit", "audit zero", "commit"} {
		t.Run(stage, func(t *testing.T) {
			r := ownershipFixtureRouter(t)
			fixture, mock, err := sqlmock.New()
			if err != nil {
				t.Fatal(err)
			}
			defer fixture.Close()
			prior := db.DB
			db.DB = fixture
			defer func() { db.DB = prior }()
			q := quotationCommercialFixture("save-failure")
			failure := errors.New("private save fixture SQL detail")
			begin := mock.ExpectBegin()
			if stage == "begin" {
				begin.WillReturnError(failure)
			} else {
				read := mock.ExpectQuery("SELECT COALESCE").WithArgs(q.ID)
				if stage == "read" {
					read.WillReturnError(failure)
				} else {
					read.WillReturnRows(sqlmock.NewRows([]string{"id"}))
					customer := mock.ExpectExec("INSERT INTO customers")
					if stage == "customer" {
						customer.WillReturnError(failure)
					} else {
						customer.WillReturnResult(sqlmock.NewResult(0, 1))
						write := mock.ExpectExec("INSERT INTO quotations")
						if stage == "quotation" {
							write.WillReturnError(failure)
						} else if stage == "quotation zero" {
							write.WillReturnResult(sqlmock.NewResult(0, 0))
						} else {
							write.WillReturnResult(sqlmock.NewResult(0, 1))
							audit := mock.ExpectExec("INSERT INTO audit_logs")
							if stage == "audit" {
								audit.WillReturnError(failure)
							} else if stage == "audit zero" {
								audit.WillReturnResult(sqlmock.NewResult(0, 0))
							} else {
								audit.WillReturnResult(sqlmock.NewResult(0, 1))
								mock.ExpectCommit().WillReturnError(failure)
							}
						}
					}
				}
				if stage != "commit" {
					mock.ExpectRollback()
				}
			}
			w := quotationTestPost(r, "POST", "/api/v1/quotations", q, auth.RoleSales)
			if w.Code != 500 || strings.Contains(w.Body.String(), "committed\":true") || strings.Contains(w.Body.String(), "private") {
				t.Fatalf("false save acknowledgment%d %s", w.Code, w.Body.String())
			}
			if _, ok := quotationsStore[q.ID]; ok {
				t.Fatal("failed save published in cache")
			}
			if err := mock.ExpectationsWereMet(); err != nil {
				t.Fatal(err)
			}
		})
	}
}
