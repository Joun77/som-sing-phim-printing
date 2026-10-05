package orders

import (
	"bytes"
	"context"
	"crypto/sha256"
	"database/sql"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"math"
	"path/filepath"
	"somsing.local/backend/finance"
	"somsing.local/backend/pricing"
	"strings"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/shopspring/decimal"
	"somsing.local/backend/auth"
	"somsing.local/backend/db"
)

type QuotationRecord struct {
	PriceCorrectionTargetOrderID string           `json:"price_correction_target_order_id,omitempty"`
	ExpectedOrderUpdatedAt       string           `json:"expected_order_updated_at,omitempty"`
	PriceCorrectionSource        map[string]any   `json:"price_correction_source,omitempty"`
	ID                           string           `json:"id"`
	QuotationNo                  string           `json:"quotation_no"`
	Title                        string           `json:"title"`
	CustomerID                   string           `json:"customer_id,omitempty"`
	CustomerName                 string           `json:"customer_name"`
	CustomerPhone                string           `json:"customer_phone"`
	CustomerAddress              string           `json:"customer_address"`
	Status                       string           `json:"status"`
	TotalCost                    float64          `json:"total_cost"`
	TotalSellingPrice            float64          `json:"total_selling_price"`
	OverallProfitPercent         float64          `json:"overall_profit_percent"`
	DiscountPercent              float64          `json:"discount_percent"`
	SetupFee                     float64          `json:"setup_fee"`
	PackagingCost                float64          `json:"packaging_cost"`
	ShippingFee                  float64          `json:"shipping_fee"`
	ExpiryDate                   string           `json:"expiry_date"`
	Notes                        string           `json:"notes"`
	ArtworkURL                   string           `json:"artwork_url,omitempty"`
	DigitalProofURL              string           `json:"digital_proof_url,omitempty"`
	Items                        []map[string]any `json:"items"`
	CreatedAt                    time.Time        `json:"created_at"`
	UpdatedAt                    time.Time        `json:"updated_at"`
	CommercialSnapshot           map[string]any   `json:"commercial_snapshot,omitempty"`
	CostReview                   map[string]any   `json:"cost_review,omitempty"`
	Conversion                   map[string]any   `json:"conversion,omitempty"`
	SnapshotCompletionReason     string           `json:"snapshot_completion_reason,omitempty"`
	Committed                    bool             `json:"committed"`
	legacyCostMissing            bool
}

var (
	quotationsStore = make(map[string]QuotationRecord)
	quoteMutex      sync.RWMutex
)

const quoteSnapshotKey = "_somsing_quote_snapshot"
const quotationColumns = `SELECT COALESCE(id, quotation_id::text), COALESCE(quotation_no, ''), COALESCE(title, ''),
 customer_name, COALESCE(customer_phone, ''), COALESCE(customer_address, ''),
 COALESCE(status, 'Draft'), total_cost, total_selling_price, overall_profit_percent,
 COALESCE(discount_percent,0), COALESCE(setup_fee,0), COALESCE(packaging_cost,0), COALESCE(shipping_fee,0),
 COALESCE(expiry_date,''), COALESCE(notes,''), COALESCE(artwork_url,''), COALESCE(digital_proof_url,''),
 COALESCE(items_json,'[]'::jsonb), created_at, updated_at FROM quotations `

type quotationQuerier interface {
	Query(string, ...any) (*sql.Rows, error)
}
type quotationFailure struct {
	status     int
	code       string
	fields     []string
	existingID string
}

func (e *quotationFailure) Error() string                 { return e.code }
func (e *quotationFailure) PaymentFailure() (int, string) { return e.status, e.code }
func quoteFailure(status int, code string, fields ...string) error {
	return &quotationFailure{status: status, code: code, fields: fields}
}
func sendQuotationFailure(c *gin.Context, err error) {
	var op *finance.OperationError
	if errors.As(err, &op) {
		finance.WriteOperationError(c, err)
		return
	}
	var failure *quotationFailure
	if !errors.As(err, &failure) {
		log.Printf("[QUOTATION OPERATION ERROR] %v", err)
		failure = &quotationFailure{status: 500, code: "quotation_operation_failed"}
	}
	body := gin.H{"status": "error", "code": failure.code, "message": "Quotation operation could not be completed"}
	if len(failure.fields) > 0 {
		body["fields"] = failure.fields
	}
	if failure.code == "quotation_snapshot_incomplete" {
		body["requires_manager_review"] = true
	}
	if failure.existingID != "" {
		body["existing_order_id"] = failure.existingID
	}
	c.JSON(failure.status, body)
}
func quotationManager(c *gin.Context) bool {
	role, ok := c.Get("user_role")
	return ok && auth.CheckRole(fmt.Sprint(role), []string{auth.RoleAdmin, auth.RoleManager})
}
func quoteNumber(value any) (float64, bool) {
	var n float64
	switch value := value.(type) {
	case float64:
		n = value
	case float32:
		n = float64(value)
	case int:
		n = float64(value)
	case int64:
		n = float64(value)
	case json.Number:
		var err error
		n, err = value.Float64()
		if err != nil {
			return 0, false
		}
	default:
		return 0, false
	}
	return n, !math.IsNaN(n) && !math.IsInf(n, 0)
}
func quoteMoneyEqual(a, b float64) bool {
	if math.IsNaN(a) || math.IsNaN(b) || math.IsInf(a, 0) || math.IsInf(b, 0) {
		return false
	}
	return decimal.NewFromFloat(a).Round(2).Equal(decimal.NewFromFloat(b).Round(2))
}
func quoteObject(value any) map[string]any { object, _ := value.(map[string]any); return object }
func quoteObjectsEqual(a, b any) bool {
	x, e := json.Marshal(a)
	y, f := json.Marshal(b)
	return e == nil && f == nil && bytes.Equal(x, y)
}
func quoteCloneItems(items []map[string]any) ([]map[string]any, error) {
	data, err := json.Marshal(items)
	if err != nil {
		return nil, err
	}
	var result []map[string]any
	err = json.Unmarshal(data, &result)
	return result, err
}
func quotationReserved(q QuotationRecord) map[string]any {
	result := map[string]any{}
	if q.PriceCorrectionSource != nil {
		result["price_correction_source"] = q.PriceCorrectionSource
	}
	if q.CommercialSnapshot != nil {
		result["commercial_snapshot"] = q.CommercialSnapshot
	}
	if q.CostReview != nil {
		result["cost_review"] = q.CostReview
	}
	if q.Conversion != nil {
		result["conversion"] = q.Conversion
	}
	return result
}
func normalizeQuotationItems(q *QuotationRecord) error {
	items, err := quoteCloneItems(q.Items)
	if err != nil {
		return err
	}
	q.Items = items
	for _, item := range q.Items {
		specs := quoteObject(item["specs"])
		if specs == nil {
			specs = map[string]any{}
		}
		// Reserved provenance is always recreated from server-owned values, never accepted from client JSON.
		specs[quoteSnapshotKey] = quotationReserved(*q)
		item["specs"] = specs
	}
	return nil
}
func hydrateQuotationSnapshot(q *QuotationRecord) error {
	var reference map[string]any
	found := false
	for _, item := range q.Items {
		specs := quoteObject(item["specs"])
		value, has := specs[quoteSnapshotKey]
		if has {
			object := quoteObject(value)
			if object == nil {
				return quoteFailure(422, "quotation_snapshot_incomplete", "items.specs."+quoteSnapshotKey)
			}
			if !found {
				reference = object
				found = true
			} else if !quoteObjectsEqual(reference, object) {
				return quoteFailure(422, "quotation_snapshot_incomplete", "items.specs."+quoteSnapshotKey)
			}
		}
	}
	if found {
		for _, item := range q.Items {
			if _, ok := quoteObject(item["specs"])[quoteSnapshotKey]; !ok {
				return quoteFailure(422, "quotation_snapshot_incomplete", "items.specs."+quoteSnapshotKey)
			}
		}
		q.CommercialSnapshot = quoteObject(reference["commercial_snapshot"])
		q.CostReview = quoteObject(reference["cost_review"])
		q.Conversion = quoteObject(reference["conversion"])
		q.PriceCorrectionSource = quoteObject(reference["price_correction_source"])
		if q.PriceCorrectionSource != nil {
			q.CustomerID = quotationString(q.PriceCorrectionSource, "customer_id")
			q.PriceCorrectionTargetOrderID = quotationString(q.PriceCorrectionSource, "target_order_id")
		}
	}
	return nil
}
func readQuotationRows(rows *sql.Rows) ([]QuotationRecord, error) {
	defer rows.Close()
	result := []QuotationRecord{}
	for rows.Next() {
		var q QuotationRecord
		var raw []byte
		var cost sql.NullFloat64
		if err := rows.Scan(&q.ID, &q.QuotationNo, &q.Title, &q.CustomerName, &q.CustomerPhone, &q.CustomerAddress, &q.Status, &cost, &q.TotalSellingPrice, &q.OverallProfitPercent, &q.DiscountPercent, &q.SetupFee, &q.PackagingCost, &q.ShippingFee, &q.ExpiryDate, &q.Notes, &q.ArtworkURL, &q.DigitalProofURL, &raw, &q.CreatedAt, &q.UpdatedAt); err != nil {
			return nil, err
		}
		q.TotalCost = cost.Float64
		q.legacyCostMissing = !cost.Valid
		if err := json.Unmarshal(raw, &q.Items); err != nil {
			return nil, err
		}
		if err := hydrateQuotationSnapshot(&q); err != nil {
			return nil, err
		}
		q.Committed = true
		result = append(result, q)
	}
	return result, rows.Err()
}
func loadQuotation(queryer quotationQuerier, id string, lock bool) (QuotationRecord, error) {
	query := quotationColumns + `WHERE id=$1 OR quotation_no=$1 OR (id IS NULL AND quotation_id::text=$1)`
	if lock {
		query += " FOR UPDATE"
	}
	rows, err := queryer.Query(query, id)
	if err != nil {
		return QuotationRecord{}, err
	}
	list, err := readQuotationRows(rows)
	if err != nil {
		return QuotationRecord{}, err
	}
	if len(list) == 0 {
		return QuotationRecord{}, sql.ErrNoRows
	}
	if len(list) != 1 {
		return QuotationRecord{}, quoteFailure(409, "ambiguous_quotation")
	}
	return list[0], nil
}
func HandleGetQuotations(c *gin.Context) {
	if db.DB == nil {
		sendQuotationFailure(c, quoteFailure(503, "quotation_storage_unavailable"))
		return
	}
	rows, err := db.DB.Query(quotationColumns + "ORDER BY created_at DESC")
	if err != nil {
		sendQuotationFailure(c, err)
		return
	}
	list, err := readQuotationRows(rows)
	if err != nil {
		sendQuotationFailure(c, err)
		return
	}
	c.JSON(200, list)
}
func quotationItemMoney(item map[string]any, canonical string, aliases ...string) (float64, error) {
	value, exists := item[canonical]
	if !exists {
		for _, alias := range aliases {
			if alias == "unitCost" {
				continue
			}
			if candidate, ok := item[alias]; ok {
				value = candidate
				exists = true
				break
			}
		}
	}
	number, valid := quoteNumber(value)
	if !exists || !valid || number < 0 {
		return 0, quoteFailure(422, "quotation_snapshot_incomplete", "items."+canonical)
	}
	for _, alias := range aliases {
		if v, ok := item[alias]; ok {
			n, good := quoteNumber(v)
			if !good || !quoteMoneyEqual(number, n) {
				return 0, quoteFailure(422, "quotation_snapshot_incomplete", "items."+alias)
			}
		}
	}
	return number, nil
}
func validateQuotationSnapshot(q QuotationRecord) error {
	if q.legacyCostMissing || q.TotalCost < 0 || math.IsNaN(q.TotalCost) || math.IsInf(q.TotalCost, 0) || q.TotalSellingPrice <= 0 || math.IsNaN(q.TotalSellingPrice) || math.IsInf(q.TotalSellingPrice, 0) || len(q.Items) == 0 {
		return quoteFailure(422, "quotation_snapshot_incomplete", "total_cost", "total_selling_price", "items")
	}
	snap := q.CommercialSnapshot
	if snap == nil {
		if q.TotalCost <= 0 {
			return quoteFailure(422, "quotation_snapshot_incomplete", "total_cost")
		}
	} else {
		version, valid := quoteNumber(snap["version"])
		if !valid || version != 1 || snap["currency"] != "LAK" {
			return quoteFailure(422, "quotation_snapshot_incomplete", "commercial_snapshot.version", "commercial_snapshot.currency")
		}
		required := []string{"total_cost_lak", "final_total_lak", "discounted_subtotal_lak", "tax_amount_lak", "shipping_fee_lak", "setup_fee_lak", "packaging_cost_lak"}
		for _, key := range required {
			n, ok := quoteNumber(snap[key])
			if !ok || n < 0 {
				return quoteFailure(422, "quotation_snapshot_incomplete", "commercial_snapshot."+key)
			}
		}
		for key, root := range map[string]float64{"total_cost_lak": q.TotalCost, "final_total_lak": q.TotalSellingPrice, "shipping_fee_lak": q.ShippingFee, "setup_fee_lak": q.SetupFee, "packaging_cost_lak": q.PackagingCost} {
			n, _ := quoteNumber(snap[key])
			if !quoteMoneyEqual(n, root) {
				return quoteFailure(422, "quotation_snapshot_incomplete", "commercial_snapshot."+key)
			}
		}
		subtotal, _ := quoteNumber(snap["discounted_subtotal_lak"])
		tax, _ := quoteNumber(snap["tax_amount_lak"])
		shipping, _ := quoteNumber(snap["shipping_fee_lak"])
		if !quoteMoneyEqual(q.TotalSellingPrice, subtotal+tax+shipping) {
			return quoteFailure(422, "quotation_snapshot_incomplete", "commercial_snapshot.final_total_lak")
		}
		if q.TotalCost == 0 {
			if q.SetupFee > 0 || q.PackagingCost > 0 {
				return quoteFailure(422, "quotation_snapshot_incomplete", "setup_fee", "packaging_cost")
			}
			reason, _ := snap["zero_cost_reason"].(string)
			if strings.TrimSpace(reason) == "" {
				return quoteFailure(422, "quotation_snapshot_incomplete", "commercial_snapshot.zero_cost_reason")
			}
		}
	}
	for _, item := range q.Items {
		qty, ok := quoteNumber(item["quantity"])
		if !ok || qty <= 0 || qty != math.Trunc(qty) {
			return quoteFailure(422, "quotation_snapshot_incomplete", "items.quantity")
		}
		if _, err := quotationItemMoney(item, "unit_price_lak", "unitPrice", "unit_price_snapshot"); err != nil {
			return err
		}
		if _, err := quotationItemMoney(item, "total_price_lak", "subtotal", "totalPrice"); err != nil {
			return err
		}
		unitCost, err := quotationItemMoney(item, "unit_cost_lak", "costPriceSnapshot", "unitCost")
		if err != nil {
			return err
		}
		if q.TotalCost == 0 && unitCost > 0 {
			return quoteFailure(422, "quotation_snapshot_incomplete", "items.unit_cost_lak")
		}
		if snap != nil {
			costs := quoteObject(quoteObject(item["specs"])["commercial_cost_snapshot"])
			for _, key := range []string{"net_cost_lak", "labor_cost_lak", "packaging_delivery_cost_lak", "commercial_cost_lak"} {
				n, ok := quoteNumber(costs[key])
				if !ok || n < 0 || (q.TotalCost == 0 && n > 0) {
					return quoteFailure(422, "quotation_snapshot_incomplete", "items.specs.commercial_cost_snapshot."+key)
				}
			}
		}
	}
	return nil
}
func auditQuotation(tx *sql.Tx, c *gin.Context, action, id string, old, new any) error {
	actor := c.GetString("user_id")
	if actor == "" {
		return quoteFailure(401, "unauthorized")
	}
	token, err := generateTrackingToken()
	if err != nil {
		return err
	}
	before, err := json.Marshal(old)
	if err != nil {
		return err
	}
	after, err := json.Marshal(new)
	if err != nil {
		return err
	}
	resourceType := "QUOTATION"
	if strings.HasPrefix(action, "ORDER_") {
		resourceType = "ORDER"
	}
	result, err := tx.Exec(`INSERT INTO audit_logs(id,user_id,user_name,action,resource_type,resource_id,old_values,new_values,ip_address,created_at) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,NOW())`, token, actor, c.GetString("username"), action, resourceType, id, string(before), string(after), c.ClientIP())
	if err != nil {
		return err
	}
	n, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if n != 1 {
		return fmt.Errorf("quotation audit matched %d rows", n)
	}
	return nil
}
func quoteSnapshotFingerprint(q QuotationRecord) ([]byte, error) {
	items, err := quoteCloneItems(q.Items)
	if err != nil {
		return nil, err
	}
	for _, item := range items {
		delete(quoteObject(item["specs"]), quoteSnapshotKey)
	}
	return json.Marshal(map[string]any{"sale": q.TotalSellingPrice, "cost": q.TotalCost, "commercial_snapshot": q.CommercialSnapshot, "items": items, "artwork_url": q.ArtworkURL})
}
func HandleSaveQuotation(c *gin.Context) {
	if db.DB == nil {
		sendQuotationFailure(c, quoteFailure(503, "quotation_storage_unavailable"))
		return
	}
	var q QuotationRecord
	if err := c.ShouldBindJSON(&q); err != nil {
		sendQuotationFailure(c, quoteFailure(400, "invalid_request"))
		return
	}
	q.CustomerName = strings.TrimSpace(q.CustomerName)
	if q.CustomerName == "" {
		sendQuotationFailure(c, quoteFailure(400, "invalid_request", "customer_name"))
		return
	}
	if q.ID == "" {
		q.ID = c.Param("id")
	}
	if q.ID == "" {
		token, err := generateTrackingToken()
		if err != nil {
			sendQuotationFailure(c, err)
			return
		}
		q.ID = "qt-" + token
	}
	if q.Status == "" {
		q.Status = "Draft"
	}
	if (strings.EqualFold(q.Status, "ACCEPTED") || strings.EqualFold(q.Status, "REJECTED")) && !quotationManager(c) {
		sendQuotationFailure(c, quoteFailure(403, "forbidden"))
		return
	}
	// Root reserved values supplied by clients are ignored; provenance/linkage comes only from stored state.
	q.CostReview = nil
	q.Conversion = nil
	q.Committed = false
	q.PriceCorrectionSource = nil
	err := db.RunInTransaction(func(tx *sql.Tx) error {
		// Bound paths lock the parent before the source and recheck the binding under lock.
		hint, hintErr := loadQuotation(tx, q.ID, false)
		if hintErr != nil && !errors.Is(hintErr, sql.ErrNoRows) {
			return hintErr
		}
		target := q.PriceCorrectionTargetOrderID
		if hint.PriceCorrectionSource != nil {
			storedTarget := quotationString(hint.PriceCorrectionSource, "target_order_id")
			if target != "" && target != storedTarget {
				return quoteFailure(409, "PRICE_SOURCE_ALREADY_USED")
			}
			target = storedTarget
		}
		if target != "" {
			if q.ExpectedOrderUpdatedAt == "" {
				return quoteFailure(422, "PRICE_SOURCE_REQUIRED")
			}
			if err := lockPriceSourceOrder(tx, target, q.ExpectedOrderUpdatedAt); err != nil {
				return err
			}
		}
		old, err := loadQuotation(tx, q.ID, true)
		exists := err == nil
		if err != nil && !errors.Is(err, sql.ErrNoRows) {
			return err
		}
		if exists {
			q.ID = old.ID
			q.CreatedAt = old.CreatedAt
			q.QuotationNo = old.QuotationNo
			if old.Conversion != nil {
				a, e := quoteSnapshotFingerprint(old)
				b, f := quoteSnapshotFingerprint(q)
				if e != nil {
					return e
				}
				if f != nil {
					return f
				}
				if !bytes.Equal(a, b) {
					return quoteFailure(409, "quotation_already_converted")
				}
				q.Conversion = old.Conversion
				q.CostReview = old.CostReview
				q.Status = old.Status
			}
			if strings.EqualFold(old.Status, "REQUIRES_MANAGER_APPROVAL") && !strings.EqualFold(q.Status, old.Status) && !quotationManager(c) {
				return quoteFailure(403, "forbidden")
			}
		} else {
			q.CreatedAt = time.Now().UTC().Truncate(time.Microsecond)
			if q.QuotationNo == "" {
				q.QuotationNo = "QT-" + strings.TrimPrefix(q.ID, "qt-")
			}
			if strings.EqualFold(q.Status, "CONVERTED") {
				return quoteFailure(400, "invalid_request", "status")
			}
		}
		if old.PriceCorrectionSource != nil && quotationString(old.PriceCorrectionSource, "target_order_id") != target {
			return quoteFailure(409, "PRICE_SOURCE_ALREADY_USED")
		}
		if target != "" {
			if old.Conversion != nil || q.Conversion != nil {
				return quoteFailure(409, "PRICE_SOURCE_ALREADY_USED")
			}
			q.PriceCorrectionTargetOrderID = target
			if err := bindPriceSource(tx, &q, target); err != nil {
				return err
			}
		}
		q.UpdatedAt = time.Now().UTC().Truncate(time.Microsecond)
		complete := validateQuotationSnapshot(q) == nil
		if q.CommercialSnapshot != nil && !complete {
			return validateQuotationSnapshot(q)
		}
		if exists && validateQuotationSnapshot(old) == nil && !complete {
			return quoteFailure(422, "quotation_snapshot_incomplete")
		}
		action := "QUOTATION_SAVE"
		if exists && validateQuotationSnapshot(old) != nil && complete {
			if c.Request.Method != "PUT" || !quotationManager(c) {
				return quoteFailure(403, "forbidden")
			}
			if strings.TrimSpace(q.SnapshotCompletionReason) == "" {
				return quoteFailure(422, "quotation_snapshot_incomplete", "snapshot_completion_reason")
			}
			action = "QUOTATION_SNAPSHOT_COMPLETED"
		}
		if complete && q.Conversion == nil {
			source := "computed"
			reason := ""
			if action == "QUOTATION_SNAPSHOT_COMPLETED" {
				source = "manager_reviewed"
				reason = q.SnapshotCompletionReason
			}
			q.CostReview = map[string]any{"source": source, "user_id": c.GetString("user_id"), "reviewed_at": q.UpdatedAt.Format(time.RFC3339Nano), "reason": reason}
		}
		if q.Conversion == nil {
			if err := validateQuotationImposition(tx, &q); err != nil {
				return err
			}
		}
		if err := normalizeQuotationItems(&q); err != nil {
			return err
		}
		if target == "" {
			if _, err := autoLinkOrCreateCustomer(tx, Order{CustomerID: q.CustomerID, CustomerName: q.CustomerName, CustomerPhone: q.CustomerPhone, CustomerAddress: q.CustomerAddress}); err != nil {
				return err
			}
		}
		items, err := json.Marshal(q.Items)
		if err != nil {
			return err
		}
		result, err := tx.Exec(`INSERT INTO quotations(id,quotation_no,title,customer_name,customer_phone,customer_address,status,total_cost,total_selling_price,overall_profit_percent,discount_percent,setup_fee,packaging_cost,shipping_fee,expiry_date,notes,artwork_url,digital_proof_url,items_json,created_at,updated_at)
   VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19::jsonb,$20,$21)
   ON CONFLICT(id) DO UPDATE SET title=EXCLUDED.title,customer_name=EXCLUDED.customer_name,customer_phone=EXCLUDED.customer_phone,customer_address=EXCLUDED.customer_address,status=EXCLUDED.status,total_cost=EXCLUDED.total_cost,total_selling_price=EXCLUDED.total_selling_price,overall_profit_percent=EXCLUDED.overall_profit_percent,discount_percent=EXCLUDED.discount_percent,setup_fee=EXCLUDED.setup_fee,packaging_cost=EXCLUDED.packaging_cost,shipping_fee=EXCLUDED.shipping_fee,expiry_date=EXCLUDED.expiry_date,notes=EXCLUDED.notes,artwork_url=EXCLUDED.artwork_url,digital_proof_url=EXCLUDED.digital_proof_url,items_json=EXCLUDED.items_json,updated_at=EXCLUDED.updated_at`, q.ID, q.QuotationNo, q.Title, q.CustomerName, q.CustomerPhone, q.CustomerAddress, q.Status, q.TotalCost, q.TotalSellingPrice, q.OverallProfitPercent, q.DiscountPercent, q.SetupFee, q.PackagingCost, q.ShippingFee, q.ExpiryDate, q.Notes, q.ArtworkURL, q.DigitalProofURL, string(items), q.CreatedAt, q.UpdatedAt)
		if err != nil {
			return err
		}
		n, err := result.RowsAffected()
		if err != nil {
			return err
		}
		if n != 1 {
			return fmt.Errorf("quotation save matched %d rows", n)
		}
		return auditQuotation(tx, c, action, q.ID, old, q)
	})
	if err != nil {
		sendQuotationFailure(c, err)
		return
	}
	q.Committed = true
	q.SnapshotCompletionReason = ""
	cacheQuotation(q)
	c.JSON(200, q)
}
func cacheQuotation(q QuotationRecord) {
	quoteMutex.Lock()
	quotationsStore[q.ID] = q
	quotationsStore[q.QuotationNo] = q
	quoteMutex.Unlock()
}

// Existing delete route retained; this task does not rewrite or repair historical records.
func HandleDeleteQuotation(c *gin.Context) {
	id := c.Param("id")
	if db.DB == nil {
		sendQuotationFailure(c, quoteFailure(503, "quotation_storage_unavailable"))
		return
	}
	if _, err := db.DB.Exec("DELETE FROM quotations WHERE id=$1 OR quotation_no=$1", id); err != nil {
		sendQuotationFailure(c, err)
		return
	}
	quoteMutex.Lock()
	delete(quotationsStore, id)
	quoteMutex.Unlock()
	c.JSON(200, gin.H{"status": "success", "deleted_id": id})
}

type quotationConversionRequest struct {
	ExpectedUpdatedAt         *string  `json:"expected_updated_at"`
	ExpectedTotalSellingPrice *float64 `json:"expected_total_selling_price"`
}

func quotationNeedsManager(q QuotationRecord) bool {
	if strings.EqualFold(q.Status, "REQUIRES_MANAGER_APPROVAL") || q.CommercialSnapshot == nil {
		return true
	}
	subtotal, ok := quoteNumber(q.CommercialSnapshot["discounted_subtotal_lak"])
	if !ok || subtotal <= 0 {
		return true
	}
	margin := decimal.NewFromFloat(subtotal).Sub(decimal.NewFromFloat(q.TotalCost)).Div(decimal.NewFromFloat(subtotal)).Mul(decimal.NewFromInt(100))
	return margin.LessThan(decimal.NewFromInt(25))
}
func makeQuotationOrder(q QuotationRecord) (Order, error) {
	id, number, err := generateOrderIdentity()
	if err != nil {
		return Order{}, err
	}
	token, err := generateTrackingToken()
	if err != nil {
		return Order{}, err
	}
	status := StatusWaitingDeposit
	if quotationNeedsManager(q) {
		status = StatusRequiresManagerApproval
	}
	now := time.Now().UTC().Truncate(time.Microsecond)
	order := Order{ID: id, OrderNo: number, OrderNumber: number, CustomerID: q.CustomerID, CustomerName: q.CustomerName, CustomerPhone: q.CustomerPhone, CustomerAddress: q.CustomerAddress, TotalCost: q.TotalCost, TotalPrice: q.TotalSellingPrice, TotalAmountLAK: q.TotalSellingPrice, RemainingLAK: q.TotalSellingPrice, Status: status, OverallStatus: status, GoogleDriveLink: q.ArtworkURL, ArtworkURL: q.ArtworkURL, ProofURL: q.DigitalProofURL, PublicTrackingToken: token, IdempotencyKey: "quotation-conversion:" + q.ID, CreatedAt: now, UpdatedAt: now}
	for idx, item := range q.Items {
		name, _ := item["name"].(string)
		if name == "" {
			name, _ = item["item_name"].(string)
		}
		if name == "" {
			name = fmt.Sprintf("Item #%d", idx+1)
		}
		if strings.Contains(name, "(Parent Sheets)") || strings.Contains(name, "ແຜ່ນແມ່") {
			continue
		}
		qty, _ := quoteNumber(item["quantity"])
		unit, _ := quotationItemMoney(item, "unit_price_lak", "unitPrice", "unit_price_snapshot")
		sale, _ := quotationItemMoney(item, "total_price_lak", "subtotal", "totalPrice")
		cost, _ := quotationItemMoney(item, "unit_cost_lak", "costPriceSnapshot", "unitCost")
		cover, inner, artwork, specs := quotationArtworkSnapshot(item)
		if specs == nil {
			specs = map[string]any{}
		}
		specs[quoteSnapshotKey] = quotationReserved(q)
		paper := "A4"
		if value, ok := item["paperSize"].(string); ok && value != "" {
			paper = value
		} else if value, ok := item["paper_size"].(string); ok && value != "" {
			paper = value
		}
		pages := quotationPositiveInt(specs, "page_count", "pagesPerBook", "pageCount", "pages")
		if artwork != nil && artwork.PageCount > 0 {
			pages = artwork.PageCount
		}
		if pages == 0 {
			pages = 1
		}
		result := OrderItem{ID: fmt.Sprintf("item-%s-%d", id, idx+1), OrderID: id, JobName: name, ItemName: name, Quantity: int(qty), PageCount: pages, PaperSize: paper, CoverFileURL: cover, InnerFileURL: inner, Artwork: artwork, Specifications: specs, Specs: specs, CurrentStep: StepPending, UnitPriceLAK: unit, TotalPriceLAK: sale, UnitCostLAK: cost, UnitPriceSnapshot: unit, CostPriceSnapshot: cost, CreatedAt: now, UpdatedAt: now}
		if artwork != nil {
			result.ArtworkURL = artwork.FileURL
			result.ArtworkFileName = artwork.FileName
			result.ArtworkFileSize = artwork.FileSizeBytes
		}
		order.Items = append(order.Items, result)
	}
	if len(order.Items) == 0 {
		return Order{}, quoteFailure(422, "quotation_snapshot_incomplete", "items")
	}
	if order.ArtworkURL == "" {
		for _, item := range order.Items {
			if item.ArtworkURL != "" {
				order.ArtworkURL = item.ArtworkURL
				order.GoogleDriveLink = item.ArtworkURL
				break
			}
		}
	}
	for _, item := range order.Items {
		if item.ArtworkFileName != "" {
			order.ArtworkFileName = item.ArtworkFileName
			break
		}
	}
	if order.ArtworkFileName == "" && order.ArtworkURL != "" {
		order.ArtworkFileName = filepath.Base(order.ArtworkURL)
	}
	return order, nil
}
func HandleConvertQuotationToOrder(c *gin.Context) {
	if db.DB == nil {
		sendQuotationFailure(c, quoteFailure(503, "quotation_storage_unavailable"))
		return
	}
	var request quotationConversionRequest
	decoder := json.NewDecoder(c.Request.Body)
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(&request); err != nil && !errors.Is(err, io.EOF) {
		sendQuotationFailure(c, quoteFailure(400, "invalid_request"))
		return
	}
	if (request.ExpectedUpdatedAt == nil) != (request.ExpectedTotalSellingPrice == nil) {
		sendQuotationFailure(c, quoteFailure(400, "invalid_request"))
		return
	}
	var q QuotationRecord
	var order Order
	var existingID string
	var sourceRevision string
	err := db.RunInTransaction(func(tx *sql.Tx) error {
		var err error
		q, err = loadQuotation(tx, c.Param("id"), true)
		if errors.Is(err, sql.ErrNoRows) {
			return quoteFailure(404, "quotation_not_found")
		}
		if err != nil {
			return err
		}
		if q.PriceCorrectionSource != nil {
			return quoteFailure(409, "PRICE_SOURCE_ALREADY_USED")
		}
		key := "quotation-conversion:" + q.ID
		if supplied := c.GetHeader("Idempotency-Key"); supplied != "" && supplied != key {
			return quoteFailure(400, "invalid_request", "Idempotency-Key")
		}
		err = tx.QueryRow("SELECT id FROM orders WHERE idempotency_key=$1", key).Scan(&existingID)
		if err == nil {
			link := q.Conversion
			if link == nil || link["quotation_id"] != q.ID || link["order_id"] != existingID || link["idempotency_key"] != key {
				return &quotationFailure{status: 409, code: "existing_conversion_requires_review", existingID: existingID}
			}
			sourceRevision, _ = link["source_updated_at"].(string)
			if sourceRevision == "" {
				return &quotationFailure{status: 409, code: "existing_conversion_requires_review", existingID: existingID}
			}
			return nil
		}
		if !errors.Is(err, sql.ErrNoRows) {
			return err
		}
		if q.Conversion != nil {
			return quoteFailure(409, "existing_conversion_requires_review")
		}
		if strings.EqualFold(q.Status, "REJECTED") {
			return quoteFailure(409, "quotation_changed")
		}
		if request.ExpectedUpdatedAt != nil {
			timestamp, e := time.Parse(time.RFC3339Nano, *request.ExpectedUpdatedAt)
			if e != nil {
				return quoteFailure(400, "invalid_request", "expected_updated_at")
			}
			if !q.UpdatedAt.Equal(timestamp) || !quoteMoneyEqual(q.TotalSellingPrice, *request.ExpectedTotalSellingPrice) {
				return quoteFailure(409, "quotation_changed")
			}
		}
		if err := validateQuotationSnapshot(q); err != nil {
			return err
		}
		if err := validateQuotationImposition(tx, &q); err != nil {
			return err
		}
		sourceRevision = q.UpdatedAt.UTC().Format(time.RFC3339Nano)
		order, err = makeQuotationOrder(q)
		if err != nil {
			return err
		}
		old := q
		q.Conversion = map[string]any{"quotation_id": q.ID, "order_id": order.ID, "idempotency_key": key, "source_updated_at": sourceRevision, "approval_required": order.Status == StatusRequiresManagerApproval}
		if err := normalizeQuotationItems(&q); err != nil {
			return err
		}
		for idx := range order.Items {
			order.Items[idx].Specs[quoteSnapshotKey] = quotationReserved(q)
		}
		if err := saveOrderInTransaction(tx, &order); err != nil {
			return err
		}
		q.Status = "CONVERTED"
		q.UpdatedAt = time.Now().UTC().Truncate(time.Microsecond)
		raw, err := json.Marshal(q.Items)
		if err != nil {
			return err
		}
		result, err := tx.Exec(`UPDATE quotations SET status='CONVERTED',items_json=$2::jsonb,updated_at=$3 WHERE id=$1 OR (id IS NULL AND quotation_id::text=$1)`, q.ID, string(raw), q.UpdatedAt)
		if err != nil {
			return err
		}
		n, err := result.RowsAffected()
		if err != nil {
			return err
		}
		if n != 1 {
			return fmt.Errorf("quotation transition matched %d rows", n)
		}
		return auditQuotation(tx, c, "QUOTATION_CONVERTED", q.ID, old, q)
	})
	if err != nil {
		sendQuotationFailure(c, err)
		return
	}
	replay := existingID != ""
	if replay {
		order, err = getOrderByIDFromDB(existingID)
		if err != nil {
			sendQuotationFailure(c, err)
			return
		}
		key := "quotation-conversion:" + q.ID
		matched := quoteMoneyEqual(order.TotalAmountLAK, q.TotalSellingPrice) && quoteMoneyEqual(order.TotalCost, q.TotalCost)

		// Persisted item IDs contain the source index, including gaps from skipped parent sheets.
		byID := make(map[string]OrderItem, len(order.Items))
		for _, current := range order.Items {
			if _, duplicate := byID[current.ID]; duplicate || current.OrderID != order.ID {
				matched = false
			}
			byID[current.ID] = current
		}
		for sourceIndex, sourceItem := range q.Items {
			name, _ := sourceItem["name"].(string)
			if name == "" {
				name, _ = sourceItem["item_name"].(string)
			}
			if name == "" {
				name = fmt.Sprintf("Item #%d", sourceIndex+1)
			}
			if strings.Contains(name, "(Parent Sheets)") || strings.Contains(name, "ແຜ່ນແມ່") {
				continue
			}
			itemID := fmt.Sprintf("item-%s-%d", order.ID, sourceIndex+1)
			current, found := byID[itemID]
			if !found {
				matched = false
				continue
			}
			delete(byID, itemID)
			qty, _ := quoteNumber(sourceItem["quantity"])
			unit, e1 := quotationItemMoney(sourceItem, "unit_price_lak", "unitPrice", "unit_price_snapshot")
			sale, e2 := quotationItemMoney(sourceItem, "total_price_lak", "subtotal", "totalPrice")
			cost, e3 := quotationItemMoney(sourceItem, "unit_cost_lak", "costPriceSnapshot", "unitCost")
			cover, inner, artwork, expectedSpecs := quotationArtworkSnapshot(sourceItem)
			expectedSpecs[quoteSnapshotKey] = quotationReserved(q)
			// Every saved original/calculator/spec field is immutable proof. Production step,
			// order lifecycle and later receipts live outside this frozen source projection.
			for key, value := range expectedSpecs {
				actual, present := current.Specs[key]
				if key == "specs" || key == "specifications" {
					// The nested input wrapper predates conversion normalization; its server
					// metadata is redundant. Compare its authored fields and the normalized
					// authoritative server proof separately at the outer level.
					expectedInput, actualInput := map[string]any{}, map[string]any{}
					for k, v := range quoteObject(value) {
						if k != quoteSnapshotKey {
							expectedInput[k] = v
						}
					}
					for k, v := range quoteObject(actual) {
						if k != quoteSnapshotKey {
							actualInput[k] = v
						}
					}
					value, actual = expectedInput, actualInput
				}
				if !present || !quoteObjectsEqual(actual, value) {
					matched = false
				}
			}
			if e1 != nil || e2 != nil || e3 != nil || current.ItemName != name || current.Quantity != int(qty) || !quoteMoneyEqual(current.UnitPriceLAK, unit) || !quoteMoneyEqual(current.TotalPriceLAK, sale) || !quoteMoneyEqual(current.UnitCostLAK, cost) || current.CoverFileURL != cover || current.InnerFileURL != inner {
				matched = false
			}
			if artwork != nil && (current.ArtworkURL != artwork.FileURL || current.ArtworkFileName != artwork.FileName || current.ArtworkFileSize != artwork.FileSizeBytes) {
				matched = false
			}
		}
		if len(byID) != 0 {
			matched = false
		}

		if order.IdempotencyKey != key || len(order.Items) == 0 || !matched {
			sendQuotationFailure(c, &quotationFailure{status: 409, code: "existing_conversion_requires_review", existingID: existingID})
			return
		}
		for _, item := range order.Items {
			proof := quoteObject(item.Specs[quoteSnapshotKey])
			link := quoteObject(proof["conversion"])
			if link["quotation_id"] != q.ID || link["order_id"] != order.ID || link["idempotency_key"] != key || link["source_updated_at"] != sourceRevision {
				sendQuotationFailure(c, &quotationFailure{status: 409, code: "existing_conversion_requires_review", existingID: existingID})
				return
			}
		}
	}
	storeMutex.Lock()
	ordersStore[order.ID] = order
	storeMutex.Unlock()
	q.Committed = true
	cacheQuotation(q)
	code := 201
	if replay {
		code = 200
	}
	c.JSON(code, gin.H{"status": "success", "committed": true, "replayed": replay, "quotation_id": q.ID, "quotation_status": "CONVERTED", "idempotency_key": order.IdempotencyKey, "source_quotation_updated_at": sourceRevision, "approval_required": order.Status == StatusRequiresManagerApproval, "order_id": order.ID, "orderId": order.ID, "order_number": order.OrderNo, "orderNumber": order.OrderNo, "data": order})
}

// quotationArtworkSnapshot preserves the frontend parts contract in the Specs JSON
// stored by saveOrderToDB. Top-level artworkParts wins over specs, then specifications.
func quotationArtworkSnapshot(item map[string]any) (coverURL, innerURL string, artwork *ItemArtwork, specs map[string]any) {
	specs = make(map[string]any, len(item))
	for key, value := range item {
		specs[key] = value
	}
	for _, key := range []string{"specifications", "specs"} {
		if nested, ok := item[key].(map[string]any); ok {
			for name, value := range nested {
				specs[name] = value
			}
		}
	}
	parts, hasParts := item["artworkParts"].([]any)
	if !hasParts {
		for _, key := range []string{"specs", "specifications"} {
			if nested, ok := item[key].(map[string]any); ok {
				if parts, hasParts = nested["artwork_parts"].([]any); hasParts {
					break
				}
			}
		}
	}
	if hasParts {
		specs["artwork_parts"] = parts
	}
	var cover, inner *ItemArtwork
	for _, raw := range parts {
		part, ok := raw.(map[string]any)
		if !ok {
			continue
		}
		source, _ := part["source"].(map[string]any)
		url := quotationString(source, "url")
		if url == "" {
			continue
		}
		file := &ItemArtwork{FileURL: url, FileName: quotationString(source, "name"), FileSizeBytes: int64(quotationPositiveInt(source, "size")), PageCount: quotationPositiveInt(part, "pageCount"), PreviewThumbnailURL: quotationString(part, "thumbnailUrl")}
		if file.FileName == "" {
			file.FileName = filepath.Base(url)
		}
		switch part["role"] {
		case "cover":
			if cover == nil {
				cover = file
			}
		case "inner":
			if inner == nil {
				inner = file
			}
		}
	}
	if cover != nil || inner != nil {
		if cover != nil {
			coverURL = cover.FileURL
			artwork = cover
		}
		if inner != nil {
			innerURL = inner.FileURL
			artwork = inner
		}
	} else {
		// Legacy single artwork represents one original, never a fabricated cover.
		coverURL = quotationString(specs, "cover_file_url", "coverArtworkUrl")
		innerURL = quotationString(specs, "inner_file_url", "artworkUrl", "artwork_url", "fileUrl", "file_url")
		url := innerURL
		if url == "" {
			url = coverURL
		}
		if url != "" {
			name := quotationString(specs, "fileName", "file_name", "artworkFileName", "artwork_file_name")
			if name == "" {
				name = filepath.Base(url)
			}
			artwork = &ItemArtwork{FileURL: url, FileName: name, FileSizeBytes: int64(quotationPositiveInt(specs, "fileSize", "file_size", "artworkFileSize", "artwork_file_size")), PageCount: quotationPositiveInt(specs, "page_count", "pagesPerBook", "pageCount", "pages")}
			if artwork.PageCount == 0 {
				artwork.PageCount = 1
			}
		}
	}
	if artwork != nil {
		specs["artwork_url"] = artwork.FileURL
		specs["artwork_file_name"] = artwork.FileName
		specs["artwork_file_size"] = artwork.FileSizeBytes
	}
	return
}

func quotationString(values map[string]any, keys ...string) string {
	for _, key := range keys {
		if value, ok := values[key].(string); ok && value != "" {
			return value
		}
	}
	return ""
}

func quotationPositiveInt(values map[string]any, keys ...string) int {
	for _, key := range keys {
		if value, ok := values[key].(float64); ok && value > 0 {
			return int(value)
		}
	}
	return 0
}

// Validate and materialize explicit modes only; legacy absence is never backfilled.
func validateQuotationImposition(tx *sql.Tx, q *QuotationRecord) error {
	for _, item := range q.Items {
		_, _, _, specs := quotationArtworkSnapshot(item)
		mode, err := explicitImpositionMode(item, specs)
		if err != nil {
			return err
		}
		parts, _ := specs["artwork_parts"].([]any)
		var primary *pricing.StockDimensionSnapshot
		for _, raw := range parts {
			part, ok := raw.(map[string]any)
			if !ok {
				continue
			}
			settings := quoteObject(part["printSettings"])
			if settings == nil {
				settings = map[string]any{}
			}
			partMode, e := explicitImpositionMode(part, settings)
			if e != nil {
				return e
			}
			if partMode == "" {
				partMode = mode
			}
			if partMode == "" {
				continue
			}
			part["printSettings"] = settings
			settings["imposition_mode"] = partMode
			if partMode == "OFF" {
				merged := map[string]any{}
				for k, v := range settings {
					merged[k] = v
				}
				for k, v := range part {
					merged[k] = v
				}
				if err = rejectImpositionCutting(merged); err != nil {
					return err
				}
				snapshot, e := validatePrecutSpec(tx, merged)
				if e != nil {
					return e
				}
				settings["stock_dimension_snapshot"] = snapshot
				if primary == nil || part["role"] == "inner" {
					primary = snapshot
				}
			}
		}
		if mode == "" {
			continue
		}
		item["imposition_mode"] = mode
		specs["imposition_mode"] = mode
		if mode == "OFF" {
			if err = rejectImpositionCutting(specs); err != nil {
				return err
			}
			key := quotationString(specs, "paper_sku", "paperId", "paper_id")
			width := impositionNumber(specs, "job_width", "jobWidth", "unfolded_width_mm", "widthMM", "width_mm")
			height := impositionNumber(specs, "job_height", "jobHeight", "unfolded_height_mm", "heightMM", "height_mm")
			if key != "" && width > 0 && height > 0 {
				primary, err = validatePrecutSpec(tx, specs)
				if err != nil {
					return err
				}
			} else if primary == nil {
				return &finance.OperationError{Status: 422, Code: "PRECUT_STOCK_DIMENSIONS_INCOMPATIBLE"}
			}
			if existing := specs["stock_dimension_snapshot"]; existing != nil {
				if err = compareStockSnapshot(existing, primary); err != nil {
					return err
				}
			}
			specs["stock_dimension_snapshot"] = primary
		}
		item["specs"] = specs
	}
	return nil
}
func explicitImpositionMode(objects ...map[string]any) (string, error) {
	mode := ""
	for _, object := range objects {
		value, has := object["imposition_mode"]
		if !has {
			continue
		}
		s, ok := value.(string)
		if !ok || (s != "OFF" && s != "ON") {
			return "", &finance.OperationError{Status: 422, Code: "INVALID_IMPOSITION_MODE"}
		}
		if mode != "" && s != mode {
			return "", &finance.OperationError{Status: 422, Code: "IMPOSITION_MODE_CONFLICT"}
		}
		mode = s
	}
	return mode, nil
}
func impositionNumber(specs map[string]any, keys ...string) float64 {
	for _, key := range keys {
		if value, ok := specs[key].(float64); ok {
			return value
		}
	}
	return 0
}
func rejectImpositionCutting(specs map[string]any) error {
	for _, key := range []string{"paper_cutting_ticket", "paper_cutting_tickets", "cuttingTickets"} {
		if value, has := specs[key]; has && value != nil {
			if array, ok := value.([]any); !ok || len(array) > 0 {
				return &finance.OperationError{Status: 422, Code: "OFF_CUTTING_OPTIONS_FORBIDDEN"}
			}
		}
	}
	for _, key := range []string{"requires_guillotine_cut", "requiresGuillotineCut", "use_31x43_parent_sheet"} {
		if specs[key] == true {
			return &finance.OperationError{Status: 422, Code: "OFF_CUTTING_OPTIONS_FORBIDDEN"}
		}
	}
	for _, key := range []string{"cuts_per_sheet", "cutsPerSheet", "cutsPerSheetOverride", "images_per_sheet"} {
		if value, ok := specs[key].(float64); ok && value > 1 {
			return &finance.OperationError{Status: 422, Code: "OFF_CUTTING_OPTIONS_FORBIDDEN"}
		}
	}
	return nil
}
func compareStockSnapshot(value any, expected *pricing.StockDimensionSnapshot) error {
	raw, err := json.Marshal(value)
	if err != nil {
		return err
	}
	var actual pricing.StockDimensionSnapshot
	if json.Unmarshal(raw, &actual) != nil {
		return &finance.OperationError{Status: 422, Code: "STOCK_DIMENSION_SNAPSHOT_INVALID"}
	}
	if actual.Version != expected.Version {
		return &finance.OperationError{Status: 409, Code: "STOCK_DIMENSION_SNAPSHOT_STALE"}
	}
	if actual != *expected {
		return &finance.OperationError{Status: 422, Code: "STOCK_DIMENSION_SNAPSHOT_INVALID"}
	}
	return nil
}
func validatePrecutSpec(tx *sql.Tx, specs map[string]any) (*pricing.StockDimensionSnapshot, error) {
	key := quotationString(specs, "paper_sku", "paperId", "paper_id")
	if key == "" {
		key = quotationString(quoteObject(specs["paper"]), "id")
	}
	width := impositionNumber(specs, "job_width", "jobWidth", "unfolded_width_mm", "widthMM", "width_mm")
	height := impositionNumber(specs, "job_height", "jobHeight", "unfolded_height_mm", "heightMM", "height_mm")
	snapshot, _, err := pricing.ResolvePrecutStock(context.Background(), tx, key, width, height)
	if err != nil {
		return nil, err
	}
	if value := specs["stock_dimension_snapshot"]; value != nil {
		if err = compareStockSnapshot(value, snapshot); err != nil {
			return nil, err
		}
	}
	return snapshot, nil
}

// A replacement quote changes commercial amounts only. Work comparison retains
// every unrecognized spec, so an unfamiliar work field cannot silently disappear.
func priceSourceWork(value any) any { return priceSourceWorkAt(value, true) }
func priceSourceWorkAt(value any, root bool) any {
	switch v := value.(type) {
	case map[string]any:
		result := map[string]any{}
		for key, item := range v {
			if key == quoteSnapshotKey {
				continue
			}
			if root {
				switch key {
				case "id", "specs", "specifications", "cover_file_url", "inner_file_url", "quantity", "unit_price_lak", "unitPrice", "unit_price_snapshot", "total_price_lak", "subtotal", "totalPrice", "unit_cost_lak", "costPriceSnapshot", "unitCost", "cost_price_snapshot", "total_cost", "total_selling_price", "commercial_snapshot", "commercial_cost_snapshot":
					continue
				}
			}
			result[key] = priceSourceWorkAt(item, false)
		}
		return result
	case []any:
		result := make([]any, len(v))
		for i, item := range v {
			result[i] = priceSourceWorkAt(item, false)
		}
		return result
	default:
		return value
	}
}
func lockPriceSourceOrder(tx *sql.Tx, id, expected string) error {
	var version time.Time
	if err := tx.QueryRow(`SELECT updated_at FROM orders WHERE id=$1 FOR UPDATE`, id).Scan(&version); err != nil {
		return err
	}
	if expected != "" && version.UTC().Format(time.RFC3339Nano) != expected {
		return quoteFailure(409, "PRICE_SOURCE_STALE")
	}
	return nil
}
func priceSourceOrderWork(tx *sql.Tx, id string) (string, map[string]map[string]any, error) {
	rows, err := tx.Query(`SELECT id,quantity,COALESCE(specs,'{}'::jsonb),COALESCE(page_count,1),COALESCE(paper_size,''),COALESCE(cover_file_url,''),COALESCE(inner_file_url,''),COALESCE(binding_type,'NONE'),COALESCE(cover_paper_id,''),COALESCE(inner_paper_id,''),COALESCE(spine_width_mm,0),COALESCE(avg_cov_c,0),COALESCE(avg_cov_m,0),COALESCE(avg_cov_y,0),COALESCE(avg_cov_k,0) FROM order_items WHERE order_id=$1 ORDER BY id FOR UPDATE`, id)
	if err != nil {
		return "", nil, err
	}
	defer rows.Close()
	items := map[string]map[string]any{}
	ordered := []map[string]any{}
	for rows.Next() {
		var itemID, paper, cover, inner, binding, coverPaper, innerPaper string
		var qty, pages int
		var raw []byte
		var spine, c, m, y, k float64
		if err = rows.Scan(&itemID, &qty, &raw, &pages, &paper, &cover, &inner, &binding, &coverPaper, &innerPaper, &spine, &c, &m, &y, &k); err != nil {
			return "", nil, err
		}
		specs := map[string]any{}
		if err = json.Unmarshal(raw, &specs); err != nil {
			return "", nil, err
		}
		item := map[string]any{"id": itemID, "quantity": qty, "page_count": pages, "paper_size": paper, "cover_file_url": cover, "inner_file_url": inner, "binding_type": binding, "cover_paper_id": coverPaper, "inner_paper_id": innerPaper, "spine_width_mm": spine, "avg_cov_c": c, "avg_cov_m": m, "avg_cov_y": y, "avg_cov_k": k, "work_specs": priceSourceWork(specs)}
		items[itemID] = item
		ordered = append(ordered, item)
	}
	if err = rows.Err(); err != nil {
		return "", nil, err
	}
	if len(items) == 0 {
		return "", nil, quoteFailure(409, "PRICE_SOURCE_ITEMS_MISMATCH")
	}
	raw, err := json.Marshal(ordered)
	sum := sha256.Sum256(raw)
	return hex.EncodeToString(sum[:]), items, err
}
func bindPriceSource(tx *sql.Tx, q *QuotationRecord, target string) error {
	var customer string
	if err := tx.QueryRow(`SELECT COALESCE(customer_id,'') FROM orders WHERE id=$1`, target).Scan(&customer); err != nil {
		return err
	}
	if customer == "" || (q.CustomerID != "" && q.CustomerID != customer) {
		return quoteFailure(409, "PRICE_SOURCE_CUSTOMER_MISMATCH")
	}
	if err := tx.QueryRow(`SELECT COALESCE(name,''),COALESCE(phone,''),COALESCE(address,'') FROM customers WHERE id=$1 FOR UPDATE`, customer).Scan(&q.CustomerName, &q.CustomerPhone, &q.CustomerAddress); err != nil {
		return err
	}
	fingerprint, canonical, err := priceSourceOrderWork(tx, target)
	if err != nil {
		return err
	}
	if len(canonical) != len(q.Items) {
		return quoteFailure(409, "PRICE_SOURCE_ITEMS_MISMATCH")
	}
	seen := map[string]bool{}
	for _, item := range q.Items {
		id := quotationString(item, "id")
		stored, ok := canonical[id]
		if !ok || seen[id] {
			return quoteFailure(409, "PRICE_SOURCE_ITEMS_MISMATCH")
		}
		seen[id] = true
		qty, ok := quoteNumber(item["quantity"])
		if !ok || qty != float64(stored["quantity"].(int)) {
			return quoteFailure(409, "PRICE_SOURCE_ITEMS_MISMATCH")
		}
		cover, inner, _, specs := quotationArtworkSnapshot(item)
		if !quoteObjectsEqual(priceSourceWork(specs), stored["work_specs"]) || cover != stored["cover_file_url"] || inner != stored["inner_file_url"] {
			return quoteFailure(409, "PRICE_SOURCE_ITEMS_MISMATCH")
		}
	}
	q.CustomerID = customer
	q.PriceCorrectionSource = map[string]any{"target_order_id": target, "customer_id": customer, "order_work_fingerprint": fingerprint}
	return nil
}
func priceSourceCommercialFingerprint(q QuotationRecord) (string, error) {
	raw, err := quoteSnapshotFingerprint(q)
	sum := sha256.Sum256(raw)
	return hex.EncodeToString(sum[:]), err
}
func validateBoundPriceSource(tx *sql.Tx, q QuotationRecord, target string) error {
	if q.Conversion != nil || quotationString(q.PriceCorrectionSource, "target_order_id") != target {
		return quoteFailure(409, "PRICE_SOURCE_ALREADY_USED")
	}
	var customer string
	if err := tx.QueryRow(`SELECT COALESCE(customer_id,'') FROM orders WHERE id=$1`, target).Scan(&customer); err != nil {
		return err
	}
	if customer == "" || quotationString(q.PriceCorrectionSource, "customer_id") != customer {
		return quoteFailure(409, "PRICE_SOURCE_CUSTOMER_MISMATCH")
	}
	if q.CommercialSnapshot == nil {
		return quoteFailure(409, "PRICE_SOURCE_NOT_APPROVED")
	}
	if err := validateQuotationSnapshot(q); err != nil {
		return quoteFailure(409, "PRICE_SOURCE_NOT_APPROVED")
	}
	fingerprint, _, err := priceSourceOrderWork(tx, target)
	if err != nil {
		return err
	}
	if fingerprint != quotationString(q.PriceCorrectionSource, "order_work_fingerprint") {
		return quoteFailure(409, "PRICE_SOURCE_ITEMS_MISMATCH")
	}
	return nil
}
func approvePriceSource(c *gin.Context, expected string) {
	role := c.GetString("user_role")
	if role != "admin" && role != "manager" && role != "owner" {
		sendQuotationFailure(c, quoteFailure(403, "forbidden"))
		return
	}
	var q QuotationRecord
	var approval gin.H
	err := db.RunInTransaction(func(tx *sql.Tx) error {
		hint, err := loadQuotation(tx, c.Param("id"), false)
		if err != nil {
			return err
		}
		target := quotationString(hint.PriceCorrectionSource, "target_order_id")
		if hint.ID != c.Param("id") || target == "" || expected == "" {
			return quoteFailure(422, "PRICE_SOURCE_REQUIRED")
		}
		if err = lockPriceSourceOrder(tx, target, ""); err != nil {
			return err
		}
		q, err = loadQuotation(tx, hint.ID, true)
		if err != nil {
			return err
		}
		if q.UpdatedAt.UTC().Format(time.RFC3339Nano) != expected {
			return quoteFailure(409, "PRICE_SOURCE_STALE")
		}
		if err = validateBoundPriceSource(tx, q, target); err != nil {
			return err
		}
		q.Status = "ACCEPTED"
		if err = tx.QueryRow(`UPDATE quotations SET status='ACCEPTED',updated_at=clock_timestamp() WHERE id=$1 RETURNING updated_at`, q.ID).Scan(&q.UpdatedAt); err != nil {
			return err
		}
		fingerprint, err := priceSourceCommercialFingerprint(q)
		if err != nil {
			return err
		}
		approvalID, err := finance.NewOperationID()
		if err != nil {
			return err
		}
		approval = gin.H{"approval_audit_id": approvalID, "source_quotation_id": q.ID, "source_quotation_updated_at": q.UpdatedAt.UTC().Format(time.RFC3339Nano), "commercial_fingerprint": fingerprint, "total_lak": decimal.NewFromFloat(q.TotalSellingPrice).StringFixed(2), "target_order_id": target, "customer_id": q.CustomerID, "actor_id": c.GetString("user_id"), "actor_role": role}
		raw, err := json.Marshal(approval)
		if err != nil {
			return err
		}
		_, err = tx.Exec(`INSERT INTO audit_logs(id,user_id,user_name,action,resource_type,resource_id,new_values,ip_address) VALUES($1,$2,$3,'QUOTATION_PRICE_SOURCE_APPROVED','QUOTATION',$4,$5,$6)`, approvalID, c.GetString("user_id"), c.GetString("username"), q.ID, string(raw), c.ClientIP())
		return err
	})
	if err != nil {
		sendQuotationFailure(c, err)
		return
	}
	q.Committed = true
	cacheQuotation(q)
	c.JSON(200, gin.H{"status": "success", "committed": true, "data": q, "price_source_approval": approval, "updated_at": q.UpdatedAt.UTC().Format(time.RFC3339Nano)})
}
func validateTotalPriceSource(c *gin.Context, tx *sql.Tx, body map[string]any, total decimal.Decimal) (gin.H, error) {
	id, ok := body["source_quotation_id"].(string)
	version, vok := body["source_quotation_updated_at"].(string)
	if !ok || !vok || id == "" || version == "" {
		return nil, &finance.OperationError{Status: 422, Code: "PRICE_SOURCE_REQUIRED"}
	}
	q, err := loadQuotation(tx, id, true)
	if err != nil {
		return nil, err
	}
	if q.ID != id {
		return nil, quoteFailure(422, "PRICE_SOURCE_REQUIRED")
	}
	if q.UpdatedAt.UTC().Format(time.RFC3339Nano) != version {
		return nil, quoteFailure(409, "PRICE_SOURCE_STALE")
	}
	if q.Status != "ACCEPTED" {
		return nil, quoteFailure(409, "PRICE_SOURCE_NOT_APPROVED")
	}
	if err = validateBoundPriceSource(tx, q, c.Param("id")); err != nil {
		return nil, err
	}
	var dbTotal string
	if err = tx.QueryRow(`SELECT total_selling_price::text FROM quotations WHERE id=$1`, id).Scan(&dbTotal); err != nil {
		return nil, err
	}
	stored, err := decimal.NewFromString(dbTotal)
	if err != nil {
		return nil, err
	}
	snapshotAmount, valid := quoteNumber(q.CommercialSnapshot["final_total_lak"])
	if !valid || !stored.Equal(total) || !decimal.NewFromFloat(snapshotAmount).Equal(total) || !stored.Equal(stored.Truncate(2)) {
		return nil, quoteFailure(422, "PRICE_SOURCE_TOTAL_MISMATCH")
	}
	fingerprint, err := priceSourceCommercialFingerprint(q)
	if err != nil {
		return nil, err
	}
	var raw []byte
	var auditID, actor string
	err = tx.QueryRow(`SELECT id,user_id,new_values FROM audit_logs WHERE action='QUOTATION_PRICE_SOURCE_APPROVED' AND resource_id=$1 AND new_values->>'source_quotation_updated_at'=$2 ORDER BY created_at DESC LIMIT 1`, id, version).Scan(&auditID, &actor, &raw)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, quoteFailure(409, "PRICE_SOURCE_NOT_APPROVED")
	}
	if err != nil {
		return nil, err
	}
	var approval map[string]any
	if err = json.Unmarshal(raw, &approval); err != nil {
		return nil, err
	}
	role := quotationString(approval, "actor_role")
	if (role != "admin" && role != "manager" && role != "owner") || actor == "" || quotationString(approval, "commercial_fingerprint") != fingerprint || quotationString(approval, "target_order_id") != c.Param("id") || quotationString(approval, "customer_id") != q.CustomerID {
		return nil, quoteFailure(409, "PRICE_SOURCE_NOT_APPROVED")
	}
	var reused bool
	err = tx.QueryRow(`SELECT EXISTS(SELECT 1 FROM audit_logs WHERE action='ORDER_TOTAL_CORRECTION' AND new_values->'price_review'->>'source_quotation_id'=$1 AND resource_id<>$2)`, id, c.Param("id")).Scan(&reused)
	if err != nil {
		return nil, err
	}
	if reused {
		return nil, quoteFailure(409, "PRICE_SOURCE_ALREADY_USED")
	}
	return gin.H{"source": "approved_quotation", "source_quotation_id": id, "source_quotation_updated_at": version, "approval_audit_id": auditID, "commercial_fingerprint": fingerprint, "target_order_id": c.Param("id"), "customer_id": q.CustomerID}, nil
}
