package orders

import (
	"bytes"
	"encoding/json"
	"errors"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/DATA-DOG/go-sqlmock"
	"github.com/gin-gonic/gin"
	"somsing.local/backend/auth"
	"somsing.local/backend/db"
)

func ownershipFixtureRouter(t *testing.T) *gin.Engine {
	t.Helper()
	storeMutex.Lock()
	previousOrders, previousSequence := ordersStore, orderSeq
	ordersStore = make(map[string]Order)
	orderSeq = 0
	storeMutex.Unlock()
	quoteMutex.Lock()
	previousQuotes := quotationsStore
	quotationsStore = make(map[string]QuotationRecord)
	quoteMutex.Unlock()
	t.Cleanup(func() {
		storeMutex.Lock()
		ordersStore, orderSeq = previousOrders, previousSequence
		storeMutex.Unlock()
		quoteMutex.Lock()
		quotationsStore = previousQuotes
		quoteMutex.Unlock()
	})
	previousDB := db.DB
	db.DB = nil
	t.Cleanup(func() { db.DB = previousDB })
	t.Setenv("ENVIRONMENT", "test")
	t.Setenv("JWT_SECRET", "fixture-order-ownership-secret-32-chars")
	gin.SetMode(gin.TestMode)
	r := gin.New()
	write := auth.RequireRoles(auth.RoleAdmin, auth.RoleManager, auth.RoleSales)
	r.POST("/api/v1/orders", write, HandleCreateOrder)
	r.PUT("/api/v1/orders/:id", write, HandleUpdateOrder)
	r.POST("/api/v1/quotations", write, HandleSaveQuotation)
	r.PUT("/api/v1/quotations/:id", write, HandleSaveQuotation)
	r.POST("/api/v1/quotations/:id/convert", write, HandleConvertQuotationToOrder)
	return r
}

func ownershipPost(t *testing.T, r *gin.Engine, path string, payload any) *httptest.ResponseRecorder {
	t.Helper()
	body, err := json.Marshal(payload)
	if err != nil {
		t.Fatal(err)
	}
	req := httptest.NewRequest("POST", path, bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+makeUploadTestToken(auth.RoleAdmin, false, false))
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)
	return w
}
func ownershipPayload(number, file, key string) CreateOrderRequest {
	return CreateOrderRequest{OrderNo: number, CustomerName: "Disposable fixture", IdempotencyKey: key, Items: []CreateItemRequest{{ItemName: "Independent original", Quantity: 1, ArtworkURL: "/uploads/artworks/" + file, ArtworkFileName: file, PageCount: 2, Artwork: &ItemArtwork{FileURL: "/uploads/artworks/" + file, FileName: file, PageCount: 2}, Specs: map[string]any{"snapshot": file, "artwork_parts": []any{map[string]any{"role": "inner", "source": map[string]any{"url": "/uploads/artworks/" + file, "name": file}, "pageCount": float64(2)}}}}}}
}
func ownershipDecode(t *testing.T, w *httptest.ResponseRecorder) Order {
	t.Helper()
	if w.Code != 201 {
		t.Fatalf("create status%d: %s", w.Code, w.Body.String())
	}
	var order Order
	if err := json.Unmarshal(w.Body.Bytes(), &order); err != nil {
		t.Fatal(err)
	}
	return order
}
func TestOrderOwnershipCreateSnapshots(t *testing.T) {
	r := ownershipFixtureRouter(t)
	a := ownershipDecode(t, ownershipPost(t, r, "/api/v1/orders", ownershipPayload("fixture-own-A", "original-A.pdf", "")))
	storeMutex.RLock()
	savedA := ordersStore[a.ID]
	before, _ := json.Marshal(savedA)
	storeMutex.RUnlock()
	// Simulate the old startup counter reset without starting a process or DB.
	storeMutex.Lock()
	previousSeq := orderSeq
	orderSeq = 0
	storeMutex.Unlock()
	defer func() { storeMutex.Lock(); orderSeq = previousSeq; storeMutex.Unlock() }()
	b := ownershipDecode(t, ownershipPost(t, r, "/api/v1/orders", ownershipPayload("fixture-own-B", "original-B.pdf", "")))
	if a.ID == b.ID || a.Items[0].ID == b.Items[0].ID {
		t.Fatal("distinct logical orders reused server/item identity")
	}
	storeMutex.RLock()
	afterA, exists := ordersStore[a.ID]
	cachedB := ordersStore[b.ID]
	storeMutex.RUnlock()
	after, _ := json.Marshal(afterA)
	if !exists || !bytes.Equal(before, after) {
		t.Fatal("creating B changed A's original/cache/spec snapshot")
	}
	if cachedB.Items[0].Artwork.FileName != "original-B.pdf" || afterA.Items[0].Artwork.FileName != "original-A.pdf" {
		t.Fatal("A/B artwork ownership mixed")
	}
	for _, stored := range []Order{afterA, cachedB} {
		item := stored.Items[0]
		parts, _ := item.Specs["artwork_parts"].([]any)
		testQuotationPartsStorage(t, stored, parts, item.CoverFileURL, item.InnerFileURL, item.ArtworkFileName, item.ArtworkFileSize)
	}
	if a.Items[0].OrderID != a.ID || b.Items[0].OrderID != b.ID {
		t.Fatal("item ownership does not match parent order")
	}
}
func TestOrderOwnershipDuplicateNumberAndRetry(t *testing.T) {
	r := ownershipFixtureRouter(t)
	a := ownershipDecode(t, ownershipPost(t, r, "/api/v1/orders", ownershipPayload("fixture-duplicate", "original-A.pdf", "fixture-idempotency")))
	before, _ := json.Marshal(a)
	duplicate := ownershipPost(t, r, "/api/v1/orders", ownershipPayload("fixture-duplicate", "original-B.pdf", ""))
	if duplicate.Code != 409 {
		t.Fatalf("duplicate logical number should be409, got%d", duplicate.Code)
	}
	retry := ownershipPost(t, r, "/api/v1/orders", ownershipPayload("fixture-duplicate", "original-B.pdf", "fixture-idempotency"))
	if retry.Code != 200 {
		t.Fatalf("existing idempotency contract lost: %d", retry.Code)
	}
	var got Order
	if err := json.Unmarshal(retry.Body.Bytes(), &got); err != nil {
		t.Fatal(err)
	}
	after, _ := json.Marshal(got)
	if !bytes.Equal(before, after) {
		t.Fatal("retry replaced original A with B payload")
	}
	req := httptest.NewRequest("PUT", "/api/v1/orders/"+a.ID, strings.NewReader(`{"courier_name":"fixture-courier"}`))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+makeUploadTestToken(auth.RoleAdmin, false, false))
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)
	if w.Code != 200 {
		t.Fatal("intentional PUT update contract broken")
	}
	storeMutex.RLock()
	updated := ordersStore[a.ID]
	storeMutex.RUnlock()
	if updated.CourierName != "fixture-courier" || updated.Items[0].Artwork.FileName != "original-A.pdf" {
		t.Fatal("explicit update changed artwork ownership")
	}
}
func TestOrderOwnershipQuotationIdentity(t *testing.T) {
	r := ownershipFixtureRouter(t)
	a := ownershipDecode(t, ownershipPost(t, r, "/api/v1/orders", ownershipPayload("fixture-quote-prior", "original-A.pdf", "")))
	storeMutex.Lock()
	priorSeq := orderSeq
	orderSeq = 0
	storeMutex.Unlock()
	defer func() { storeMutex.Lock(); orderSeq = priorSeq; storeMutex.Unlock() }()
	q := QuotationRecord{ID: "fixture-owner-quote", QuotationNo: "fixture-owner-quote-no", CustomerName: "Fixture", Items: []map[string]any{{"name": "Quote B", "artworkParts": quotationPartsFixture()}}}
	q.TotalCost = 50
	q.TotalSellingPrice = 100
	q.Items[0]["quantity"] = float64(1)
	q.Items[0]["unit_price_lak"] = float64(100)
	q.Items[0]["total_price_lak"] = float64(100)
	q.Items[0]["unit_cost_lak"] = float64(50)
	saved := quotationSaveFixture(t, r, q)
	response := struct{ Data Order }{Data: quotationConvertFixture(t, r, saved)}

	if response.Data.ID == a.ID || response.Data.Items[0].ID == a.Items[0].ID {
		t.Fatal("quotation conversion reused existing order identity")
	}
	storeMutex.RLock()
	cachedA := ordersStore[a.ID]
	storeMutex.RUnlock()
	if cachedA.Items[0].Artwork.FileName != "original-A.pdf" {
		t.Fatal("quotation B overwrote order A")
	}
}
func TestOrderOwnershipInsertConflict(t *testing.T) {
	for _, conflict := range []string{"order", "item"} {
		t.Run(conflict, func(t *testing.T) {
			mockDB, mock, err := sqlmock.New()
			if err != nil {
				t.Fatal(err)
			}
			defer mockDB.Close()
			previous := db.DB
			db.DB = mockDB
			defer func() { db.DB = previous }()
			mock.ExpectBegin()
			mock.ExpectExec("INSERT INTO customers").WillReturnResult(sqlmock.NewResult(0, 1))
			if conflict == "order" {
				mock.ExpectExec("INSERT INTO orders .*ON CONFLICT DO NOTHING").WillReturnResult(sqlmock.NewResult(0, 0))
			} else {
				mock.ExpectExec("INSERT INTO orders").WillReturnResult(sqlmock.NewResult(0, 1))
				mock.ExpectExec("INSERT INTO order_items .*ON CONFLICT DO NOTHING").WillReturnResult(sqlmock.NewResult(0, 0))
			}
			mock.ExpectRollback()
			err = saveOrderToDB(Order{ID: "fixture-conflict", Items: []OrderItem{{ID: "fixture-item-existing", OrderID: "fixture-conflict"}}})
			if err == nil || !strings.Contains(strings.ToLower(err.Error()), "already exists") {
				t.Fatalf("create conflict must roll back, got %v", err)
			}
			if err := mock.ExpectationsWereMet(); err != nil {
				t.Fatal(err)
			}
		})
	}
}
func TestOrderOwnershipUploadAndPrivateAccess(t *testing.T) {
	r := ownershipFixtureRouter(t)
	a := ownershipDecode(t, ownershipPost(t, r, "/api/v1/orders", ownershipPayload("fixture-files-A", "original-A.pdf", "")))
	b := ownershipDecode(t, ownershipPost(t, r, "/api/v1/orders", ownershipPayload("fixture-files-B", "original-B.pdf", "")))
	files, storage := setupUploadSecurityRouter(t)
	pdf := []byte("%PDF-1.4\nfixture-only-original-A\n%%EOF")
	body, contentType, err := createMultipartPayload("file", "replacement.pdf", pdf, map[string]string{"order_no": a.OrderNo, "item_id": b.Items[0].ID, "file_type": "inner"})
	if err != nil {
		t.Fatal(err)
	}
	req := httptest.NewRequest("POST", "/api/v1/orders/upload", body)
	req.Header.Set("Content-Type", contentType)
	req.Header.Set("Authorization", "Bearer "+makeUploadTestToken(auth.RoleAdmin, false, false))
	w := httptest.NewRecorder()
	files.ServeHTTP(w, req)
	if w.Code != 400 {
		t.Fatalf("B item under A must fail, got%d", w.Code)
	}
	if _, err := os.Stat(filepath.Join(storage, "orders")); !errors.Is(err, os.ErrNotExist) {
		t.Fatal("wrong-order upload wrote directory")
	}
	dir := filepath.Join(storage, "orders", a.OrderNo)
	if err := os.MkdirAll(dir, 0700); err != nil {
		t.Fatal(err)
	}
	path := filepath.Join(dir, "original-A.pdf")
	if err := os.WriteFile(path, pdf, 0600); err != nil {
		t.Fatal(err)
	}
	url := "/uploads/orders/" + a.OrderNo + "/original-A.pdf"
	for _, role := range []string{"anonymous", "customer", auth.RoleAdmin} {
		t.Run(role, func(t *testing.T) {
			req := httptest.NewRequest("GET", url, nil)
			if role != "anonymous" {
				req.Header.Set("Authorization", "Bearer "+makeUploadTestToken(role, false, false))
			}
			w := httptest.NewRecorder()
			files.ServeHTTP(w, req)
			expected := 403
			if role == "anonymous" {
				expected = 401
			}
			if role == auth.RoleAdmin {
				expected = 200
			}
			if w.Code != expected {
				t.Fatalf("private original role%s status%d", role, w.Code)
			}
			if expected == 200 && !bytes.Equal(w.Body.Bytes(), pdf) {
				t.Fatal("staff retrieved wrong original bytes")
			}
		})
	}
}

func TestOrderOwnershipDatabaseCreateConflictHTTP(t *testing.T) {
	r := ownershipFixtureRouter(t)
	mockDB, mock, err := sqlmock.New()
	if err != nil {
		t.Fatal(err)
	}
	defer mockDB.Close()
	db.DB = mockDB
	mock.ExpectBegin()
	mock.ExpectExec("INSERT INTO customers").WillReturnResult(sqlmock.NewResult(0, 1))
	mock.ExpectExec("INSERT INTO orders .*ON CONFLICT DO NOTHING").WillReturnResult(sqlmock.NewResult(0, 0))
	mock.ExpectRollback()
	w := ownershipPost(t, r, "/api/v1/orders", ownershipPayload("fixture-db-duplicate", "B.pdf", ""))
	if w.Code != 409 {
		t.Fatalf("database create conflict HTTP%d", w.Code)
	}
	storeMutex.RLock()
	count := len(ordersStore)
	storeMutex.RUnlock()
	if count != 0 {
		t.Fatal("failed create published cache snapshot")
	}
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatal(err)
	}
}

func TestOrderOwnershipConcurrentCreate(t *testing.T) {
	r := ownershipFixtureRouter(t)
	payload := ownershipPayload("fixture-concurrent", "original-A.pdf", "")
	body, err := json.Marshal(payload)
	if err != nil {
		t.Fatal(err)
	}
	token := makeUploadTestToken(auth.RoleAdmin, false, false)
	statuses := make(chan int, 2)
	for i := 0; i < 2; i++ {
		go func() {
			req := httptest.NewRequest("POST", "/api/v1/orders", bytes.NewReader(body))
			req.Header.Set("Content-Type", "application/json")
			req.Header.Set("Authorization", "Bearer "+token)
			w := httptest.NewRecorder()
			r.ServeHTTP(w, req)
			statuses <- w.Code
		}()
	}
	a, b := <-statuses, <-statuses
	if !((a == 201 && b == 409) || (a == 409 && b == 201)) {
		t.Fatalf("concurrent duplicate statuses %d/%d", a, b)
	}
	storeMutex.RLock()
	count := len(ordersStore)
	storeMutex.RUnlock()
	if count != 1 {
		t.Fatalf("concurrent duplicate creates%d cache records", count)
	}
}
