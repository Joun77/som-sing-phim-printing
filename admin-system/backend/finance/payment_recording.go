package finance

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"database/sql"
	"database/sql/driver"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net"
	"net/http"
	"os"
	"path/filepath"
	"regexp"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/lib/pq"
	"github.com/shopspring/decimal"
	"somsing.local/backend/auth"
	"somsing.local/backend/db"
)

type OperationError struct {
	Status int
	Code   string
}

func (e *OperationError) Error() string            { return e.Code }
func operationError(status int, code string) error { return &OperationError{status, code} }
func WriteOperationError(c *gin.Context, err error) {
	status, code := 500, "STORAGE_FAILURE"
	var op *OperationError
	var pg *pq.Error
	var networkFailure *net.OpError
	if errors.As(err, &op) {
		status, code = op.Status, op.Code
	} else if errors.Is(err, driver.ErrBadConn) || errors.Is(err, sql.ErrConnDone) || errors.As(err, &networkFailure) {
		status, code = 503, "STORAGE_UNAVAILABLE"
	} else if errors.Is(err, sql.ErrNoRows) {
		status, code = 404, "NOT_FOUND"
	} else if errors.As(err, &pg) {
		switch pg.Code {
		case "08000", "08001", "08003", "08006", "57P01", "57P02", "57P03":
			status, code = 503, "STORAGE_UNAVAILABLE"
		case "23505":
			status, code = 409, "CONFLICT"
		case "23503":
			status, code = 409, "REFERENCED_RECORD"
		case "22P02", "23502", "23514", "22003":
			status, code = 422, "INVALID_FIELD"
		}
	}
	message := code
	if code == "PRECUT_STOCK_DIMENSIONS_INCOMPATIBLE" {
		message = "ຂະໜາດວຽກບໍ່ກົງກັບເຈ້ຍທີ່ຕັດໄວ້. ກະລຸນາເລືອກເຈ້ຍທີ່ເໝາະສົມ."
	}
	c.AbortWithStatusJSON(status, gin.H{"status": "error", "code": code, "message": message})
}
func NewOperationID() (string, error) {
	b := make([]byte, 16)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return hex.EncodeToString(b), nil
}

var decimalAmountPattern = regexp.MustCompile(`^(0|[1-9][0-9]*)(\.[0-9]{1,2})?$`)

func ParsePaymentAmount(s string) (decimal.Decimal, error) {
	if !decimalAmountPattern.MatchString(s) {
		return decimal.Zero, operationError(422, "INVALID_AMOUNT")
	}
	v, err := decimal.NewFromString(s)
	if err != nil || v.GreaterThanOrEqual(decimal.New(1, 13)) {
		return decimal.Zero, operationError(422, "INVALID_AMOUNT")
	}
	return v, nil
}

// BeginOperation serializes retries before any row mutation. Audit and result commit together.
func BeginOperation(c *gin.Context, operation string, payload any) (*sql.Tx, json.RawMessage, string, error) {
	if c.GetString("user_id") == "" {
		return nil, nil, "", operationError(401, "AUTHENTICATION_REQUIRED")
	}
	if db.DB == nil {
		return nil, nil, "", operationError(503, "STORAGE_UNAVAILABLE")
	}
	key := c.GetHeader("Idempotency-Key")
	if strings.TrimSpace(key) == "" || len(key) > 128 {
		return nil, nil, "", operationError(422, "IDEMPOTENCY_KEY_REQUIRED")
	}
	raw, err := json.Marshal(gin.H{"actor": c.GetString("user_id"), "operation": operation, "payload": payload})
	if err != nil {
		return nil, nil, "", err
	}
	sum := sha256.Sum256(raw)
	fingerprint := hex.EncodeToString(sum[:])
	tx, err := db.DB.BeginTx(c.Request.Context(), nil)
	if err != nil {
		return nil, nil, "", err
	}
	if _, err = tx.ExecContext(c.Request.Context(), `SELECT pg_advisory_xact_lock(hashtextextended($1,0))`, "phase2-request:"+key); err != nil {
		tx.Rollback()
		return nil, nil, "", err
	}
	var stored string
	var response []byte
	err = tx.QueryRowContext(c.Request.Context(), `SELECT request_fingerprint,committed_response FROM audit_logs WHERE request_key=$1`, key).Scan(&stored, &response)
	if err == nil {
		tx.Rollback()
		if stored != fingerprint {
			return nil, nil, "", operationError(409, "IDEMPOTENCY_PAYLOAD_CONFLICT")
		}
		if len(response) == 0 {
			return nil, nil, "", operationError(409, "IDEMPOTENCY_RESULT_UNAVAILABLE")
		}
		return nil, response, fingerprint, nil
	}
	if !errors.Is(err, sql.ErrNoRows) {
		tx.Rollback()
		return nil, nil, "", err
	}
	return tx, nil, fingerprint, nil
}
func CommitOperation(c *gin.Context, tx *sql.Tx, operation, resourceType, resourceID, fingerprint string, response any) error {
	raw, err := json.Marshal(response)
	if err != nil {
		return err
	}
	id, err := NewOperationID()
	if err != nil {
		return err
	}
	_, err = tx.ExecContext(c.Request.Context(), `INSERT INTO audit_logs(id,user_id,user_name,action,resource_type,resource_id,new_values,ip_address,request_key,request_fingerprint,committed_response) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$7)`, id, c.GetString("user_id"), c.GetString("username"), operation, resourceType, resourceID, string(raw), c.ClientIP(), c.GetHeader("Idempotency-Key"), fingerprint)
	if err != nil {
		return err
	}
	return tx.Commit()
}
func operationRole(c *gin.Context, roles ...string) bool {
	role := c.GetString("user_role")
	for _, allowed := range roles {
		if role == allowed {
			return true
		}
	}
	WriteOperationError(c, operationError(403, "ROLE_FORBIDDEN"))
	return false
}
func requestRole(c *gin.Context) bool {
	return operationRole(c, "owner", "admin", "manager", "sales", "finance", "accountant")
}
func reviewRole(c *gin.Context) bool {
	return operationRole(c, "owner", "admin", "manager", "finance", "accountant")
}
func LockPaymentConfiguration(c *gin.Context, tx *sql.Tx) error {
	_, err := tx.ExecContext(c.Request.Context(), `SELECT pg_advisory_xact_lock(hashtextextended('phase2-payment-configuration',0))`)
	return err
}

type PaymentSummary struct {
	OrderID                             string  `json:"order_id"`
	DepositMode                         *string `json:"deposit_mode"`
	DepositTargetPercent                string  `json:"deposit_target_percent"`
	DepositTargetAmount                 string  `json:"deposit_target_amount_lak"`
	Revision                            int64   `json:"payment_revision"`
	Status                              string  `json:"payment_status"`
	Received                            string  `json:"received_net_lak"`
	Remaining                           string  `json:"remaining_lak"`
	Total                               string  `json:"total_lak"`
	Opening                             string  `json:"legacy_opening_received_lak"`
	customerID, slip, status            string
	total, received, remaining, percent decimal.Decimal
}

func checkedLegacyAmount(s sql.NullString) (decimal.Decimal, error) {
	if !s.Valid {
		return decimal.Zero, nil
	}
	v, err := decimal.NewFromString(s.String)
	if err != nil || v.IsNegative() || !v.Equal(v.Round(2)) {
		return decimal.Zero, operationError(409, "LEGACY_MONEY_RECONCILIATION_REQUIRED")
	}
	return v, nil
}
func loadPaymentSummary(c *gin.Context, tx *sql.Tx, id string, capture bool) (*PaymentSummary, error) {
	return loadPaymentSummaryContext(c.Request.Context(), tx, id, capture)
}
func loadPaymentSummaryContext(ctx context.Context, tx *sql.Tx, id string, capture bool) (*PaymentSummary, error) {
	s := &PaymentSummary{OrderID: id}
	var total, alias, deposit, depositAlias, remaining, opening sql.NullString
	var mode sql.NullBool
	var percent string
	err := tx.QueryRowContext(ctx, `SELECT total_price::text,total_amount_lak::text,deposit_amount::text,deposit_lak::text,remaining_lak::text,payment_opening_received_lak::text,deposit_mode,COALESCE(deposit_percentage,100)::text,payment_revision,COALESCE(customer_id,''),COALESCE(NULLIF(payment_slip_url,''),proof_url,''),status FROM orders WHERE id=$1 FOR UPDATE`, id).Scan(&total, &alias, &deposit, &depositAlias, &remaining, &opening, &mode, &percent, &s.Revision, &s.customerID, &s.slip, &s.status)
	if err != nil {
		return nil, err
	}
	s.total, err = checkedLegacyAmount(total)
	if err != nil {
		return nil, err
	}
	for _, pair := range []struct{ a, b sql.NullString }{{total, alias}, {deposit, depositAlias}} {
		a, e := checkedLegacyAmount(pair.a)
		if e != nil {
			return nil, e
		}
		b, e := checkedLegacyAmount(pair.b)
		if e != nil {
			return nil, e
		}
		if pair.a.Valid && pair.b.Valid && !a.Equal(b) {
			return nil, operationError(409, "LEGACY_MONEY_RECONCILIATION_REQUIRED")
		}
	}
	if !total.Valid {
		s.total, err = checkedLegacyAmount(alias)
		if err != nil {
			return nil, err
		}
	}
	oldReceived, err := checkedLegacyAmount(deposit)
	if err != nil {
		return nil, err
	}
	if !deposit.Valid {
		oldReceived, err = checkedLegacyAmount(depositAlias)
		if err != nil {
			return nil, err
		}
	}
	oldRemaining, err := checkedLegacyAmount(remaining)
	if err != nil {
		return nil, err
	}
	if oldReceived.GreaterThan(s.total) || (remaining.Valid && !s.total.Sub(oldReceived).Equal(oldRemaining)) {
		return nil, operationError(409, "LEGACY_MONEY_RECONCILIATION_REQUIRED")
	}
	openingAmount := oldReceived
	if opening.Valid {
		openingAmount, err = checkedLegacyAmount(opening)
		if err != nil {
			return nil, err
		}
	} else if capture {
		_, err = tx.ExecContext(ctx, `UPDATE orders SET payment_opening_received_lak=$2,payment_opening_captured_at=NOW() WHERE id=$1 AND payment_opening_received_lak IS NULL`, id, openingAmount.StringFixed(2))
		if err != nil {
			return nil, err
		}
	}
	var deltaText string
	err = tx.QueryRowContext(ctx, `SELECT COALESCE(SUM(CASE WHEN record_kind='RECEIPT' THEN actual_received_amount_lak ELSE -actual_received_amount_lak END),0)::text FROM payment_records WHERE order_id=$1 AND state='CONFIRMED'`, id).Scan(&deltaText)
	if err != nil {
		return nil, err
	}
	delta, err := decimal.NewFromString(deltaText)
	if err != nil {
		return nil, err
	}
	s.received = openingAmount.Add(delta)
	if !s.received.Equal(oldReceived) || s.received.IsNegative() || s.received.GreaterThan(s.total) {
		return nil, operationError(409, "LEGACY_MONEY_RECONCILIATION_REQUIRED")
	}
	s.remaining = s.total.Sub(s.received)
	s.percent, err = decimal.NewFromString(percent)
	if err != nil {
		return nil, operationError(409, "LEGACY_MONEY_RECONCILIATION_REQUIRED")
	}
	if mode.Valid {
		name := "OFF"
		if mode.Bool {
			name = "ON"
		}
		s.DepositMode = &name
		if !mode.Bool {
			s.percent = decimal.NewFromInt(100)
		}
	}
	s.Total = s.total.StringFixed(2)
	s.Received = s.received.StringFixed(2)
	s.Remaining = s.remaining.StringFixed(2)
	s.Opening = openingAmount.StringFixed(2)
	s.DepositTargetPercent = s.percent.StringFixed(2)
	s.DepositTargetAmount = s.remaining.Mul(s.percent).Div(decimal.NewFromInt(100)).Round(2).StringFixed(2)
	s.Status = "PARTIAL"
	if s.remaining.IsZero() {
		s.Status = "PAID"
	} else if s.received.IsZero() {
		s.Status = "UNPAID"
	}
	return s, nil
}
func persistPaymentSummary(c *gin.Context, tx *sql.Tx, s *PaymentSummary) error {
	s.remaining = s.total.Sub(s.received)
	s.Received = s.received.StringFixed(2)
	s.Remaining = s.remaining.StringFixed(2)
	s.Total = s.total.StringFixed(2)
	s.Status = "PARTIAL"
	if s.remaining.IsZero() {
		s.Status = "PAID"
	} else if s.received.IsZero() {
		s.Status = "UNPAID"
	}
	s.Revision++
	s.DepositTargetAmount = s.remaining.Mul(s.percent).Div(decimal.NewFromInt(100)).Round(2).StringFixed(2)
	result, err := tx.ExecContext(c.Request.Context(), `UPDATE orders SET deposit_amount=$2,deposit_lak=$2,remaining_lak=$3,payment_state=$4,payment_revision=$5,updated_at=NOW() WHERE id=$1`, s.OrderID, s.Received, s.Remaining, s.Status, s.Revision)
	if err != nil {
		return err
	}
	n, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if n != 1 {
		return sql.ErrNoRows
	}
	return nil
}
func validateRevision(s *PaymentSummary, revision *int64) error {
	if revision == nil {
		return operationError(422, "PAYMENT_REVISION_REQUIRED")
	}
	if *revision != s.Revision {
		return operationError(409, "STALE_PAYMENT_REVISION")
	}
	return nil
}
func eligibleCustomer(c *gin.Context, tx *sql.Tx, s *PaymentSummary) error {
	var eligible bool
	if s.customerID == "" {
		return operationError(422, "CUSTOMER_DEPOSIT_INELIGIBLE")
	}
	err := tx.QueryRowContext(c.Request.Context(), `SELECT deposit_eligible FROM customers WHERE id=$1 FOR SHARE`, s.customerID).Scan(&eligible)
	if err != nil {
		return err
	}
	if !eligible {
		return operationError(422, "CUSTOMER_DEPOSIT_INELIGIBLE")
	}
	return nil
}

type paymentRecordRequest struct {
	Channel   string `json:"channel"`
	Purpose   string `json:"purpose"`
	Amount    string `json:"requested_amount_lak"`
	Currency  string `json:"currency"`
	Method    string `json:"payment_method_id"`
	Reference string `json:"reference"`
	Evidence  string `json:"evidence_url"`
	Percent   string `json:"requested_percent"`
	Revision  *int64 `json:"expected_payment_revision"`
}

func paymentRecordRow(c *gin.Context, tx *sql.Tx, id string) (map[string]any, error) {
	var raw []byte
	err := tx.QueryRowContext(c.Request.Context(), `SELECT to_jsonb(p) || jsonb_build_object('requested_amount_lak',p.requested_amount_lak::text,'actual_received_amount_lak',p.actual_received_amount_lak::text) FROM payment_records p WHERE id=$1::uuid`, id).Scan(&raw)
	if err != nil {
		return nil, err
	}
	var record map[string]any
	err = json.Unmarshal(raw, &record)
	delete(record, "request_fingerprint")
	return record, err
}
func admitPaymentMethod(c *gin.Context, tx *sql.Tx, id string) error {
	var enabled bool
	var selected sql.NullString
	err := tx.QueryRowContext(c.Request.Context(), `SELECT manual_qr_enabled,payment_method_id FROM payment_configuration WHERE id=true FOR UPDATE`).Scan(&enabled, &selected)
	if errors.Is(err, sql.ErrNoRows) || (err == nil && (!enabled || !selected.Valid || selected.String != id)) {
		return operationError(409, "PAYMENT_CHANNEL_DISABLED")
	}
	if err != nil {
		return err
	}
	var account, qr string
	var active bool
	err = tx.QueryRowContext(c.Request.Context(), `SELECT account_number,COALESCE(qr_code_url,''),COALESCE(is_active,false) FROM payment_methods WHERE id=$1 FOR SHARE`, id).Scan(&account, &qr, &active)
	if err != nil {
		return err
	}
	if !active || strings.TrimSpace(account) == "" || qr == "" || strings.Contains(strings.ToLower(qr), "placeholder") {
		return operationError(422, "PAYMENT_METHOD_UNCONFIGURED")
	}
	return nil
}
func HandleCreatePaymentRecord(c *gin.Context) {
	if !requestRole(c) {
		return
	}
	var req paymentRecordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		WriteOperationError(c, operationError(400, "INVALID_JSON"))
		return
	}
	req.Reference = strings.TrimSpace(req.Reference)
	id := c.Param("id")
	tx, replay, fp, err := BeginOperation(c, "PAYMENT_REQUEST", gin.H{"order_id": id, "request": req})
	if err != nil {
		WriteOperationError(c, err)
		return
	}
	if replay != nil {
		c.Data(200, "application/json", replay)
		return
	}
	defer tx.Rollback()
	if err = LockPaymentConfiguration(c, tx); err != nil {
		WriteOperationError(c, err)
		return
	}
	s, err := loadPaymentSummary(c, tx, id, true)
	if err != nil {
		WriteOperationError(c, err)
		return
	}
	if err = validateRevision(s, req.Revision); err == nil {
		err = admitPaymentMethod(c, tx, req.Method)
	}
	if err != nil {
		WriteOperationError(c, err)
		return
	}
	amount, err := ParsePaymentAmount(req.Amount)
	if err != nil {
		WriteOperationError(c, err)
		return
	}
	if req.Channel != "MANUAL_QR" || req.Currency != "LAK" || (req.Purpose != "FULL" && req.Purpose != "DEPOSIT" && req.Purpose != "REMAINING") || !amount.IsPositive() || amount.GreaterThan(s.remaining) {
		WriteOperationError(c, operationError(422, "INVALID_PAYMENT_REQUEST"))
		return
	}
	if s.DepositMode == nil || *s.DepositMode == "OFF" {
		if req.Purpose == "DEPOSIT" || !amount.Equal(s.remaining) {
			WriteOperationError(c, operationError(422, "FULL_OUTSTANDING_REQUIRED"))
			return
		}
	} else if err = eligibleCustomer(c, tx, s); err != nil {
		WriteOperationError(c, err)
		return
	}
	if (req.Purpose == "FULL" || req.Purpose == "REMAINING") && !amount.Equal(s.remaining) {
		WriteOperationError(c, operationError(422, "FULL_OUTSTANDING_REQUIRED"))
		return
	}
	if req.Percent != "" {
		percent, e := ParsePaymentAmount(req.Percent)
		if e != nil || !percent.IsPositive() || percent.GreaterThan(decimal.NewFromInt(100)) || !s.remaining.Mul(percent).Div(decimal.NewFromInt(100)).Round(2).Equal(amount) {
			WriteOperationError(c, operationError(422, "PAYMENT_PERCENT_AMOUNT_MISMATCH"))
			return
		}
	}
	// Only the authenticated order's existing payment upload is admissible evidence.
	if req.Evidence == "" || req.Evidence != s.slip || (!strings.HasPrefix(req.Evidence, "/api/v1/orders/files/") && !strings.HasPrefix(req.Evidence, "/uploads/")) || strings.Contains(req.Evidence, "..") {
		WriteOperationError(c, operationError(422, "PAYMENT_EVIDENCE_NOT_OWNED"))
		return
	}
	if _, err = ReadOrderUpload(c.Request.Context(), tx, id, req.Evidence, "payment_slip", true); err != nil {
		WriteOperationError(c, err)
		return
	}
	if req.Reference != "" {
		var exists bool
		err = tx.QueryRowContext(c.Request.Context(), `SELECT EXISTS(SELECT 1 FROM bank_transaction_logs WHERE trans_ref=$1)`, req.Reference).Scan(&exists)
		if err != nil {
			WriteOperationError(c, err)
			return
		}
		if exists {
			WriteOperationError(c, operationError(409, "REFERENCE_CONFLICT"))
			return
		}
	}
	var recordID string
	err = tx.QueryRowContext(c.Request.Context(), `INSERT INTO payment_records(order_id,record_kind,state,channel,purpose,requested_amount_lak,payment_method_id,reference,evidence_url,actor_id,request_key,request_fingerprint) VALUES($1,'RECEIPT','PENDING',$2,$3,$4,$5,NULLIF($6,''),$7,$8,$9,$10) RETURNING id::text`, id, req.Channel, req.Purpose, amount.StringFixed(2), req.Method, req.Reference, req.Evidence, c.GetString("user_id"), c.GetHeader("Idempotency-Key"), fp).Scan(&recordID)
	if err != nil {
		WriteOperationError(c, err)
		return
	}
	if err = persistPaymentSummary(c, tx, s); err != nil {
		WriteOperationError(c, err)
		return
	}
	record, err := paymentRecordRow(c, tx, recordID)
	if err != nil {
		WriteOperationError(c, err)
		return
	}
	response := gin.H{"status": "success", "committed": true, "data": gin.H{"record": record, "summary": s}}
	if err = CommitOperation(c, tx, "PAYMENT_REQUEST", "ORDER", id, fp, response); err != nil {
		WriteOperationError(c, err)
		return
	}
	c.JSON(http.StatusCreated, response)
}

type paymentPolicyRequest struct {
	Mode     string  `json:"deposit_mode"`
	Percent  string  `json:"deposit_target_percent"`
	Amount   *string `json:"deposit_target_amount_lak"`
	Revision *int64  `json:"expected_payment_revision"`
}

func HandlePaymentPolicy(c *gin.Context) {
	if !requestRole(c) {
		return
	}
	var req paymentPolicyRequest
	if c.ShouldBindJSON(&req) != nil {
		WriteOperationError(c, operationError(400, "INVALID_JSON"))
		return
	}
	id := c.Param("id")
	tx, replay, fp, err := BeginOperation(c, "PAYMENT_POLICY", gin.H{"order_id": id, "request": req})
	if err != nil {
		WriteOperationError(c, err)
		return
	}
	if replay != nil {
		c.Data(200, "application/json", replay)
		return
	}
	defer tx.Rollback()
	s, err := loadPaymentSummary(c, tx, id, true)
	if err != nil {
		WriteOperationError(c, err)
		return
	}
	if err = validateRevision(s, req.Revision); err != nil {
		WriteOperationError(c, err)
		return
	}
	percent, err := ParsePaymentAmount(req.Percent)
	if err != nil || !percent.IsPositive() || percent.GreaterThan(decimal.NewFromInt(100)) || (req.Mode != "ON" && req.Mode != "OFF") || (req.Mode == "OFF" && !percent.Equal(decimal.NewFromInt(100))) {
		WriteOperationError(c, operationError(422, "INVALID_PAYMENT_POLICY"))
		return
	}
	target := s.remaining.Mul(percent).Div(decimal.NewFromInt(100)).Round(2)
	if s.remaining.IsPositive() && !target.IsPositive() {
		WriteOperationError(c, operationError(422, "NONPOSITIVE_PAYMENT_TARGET"))
		return
	}
	if req.Amount != nil {
		amount, e := ParsePaymentAmount(*req.Amount)
		if e != nil || !amount.Equal(target) {
			WriteOperationError(c, operationError(422, "PAYMENT_PERCENT_AMOUNT_MISMATCH"))
			return
		}
	}
	if req.Mode == "ON" {
		if err = eligibleCustomer(c, tx, s); err != nil {
			WriteOperationError(c, err)
			return
		}
	}
	_, err = tx.ExecContext(c.Request.Context(), `UPDATE orders SET deposit_mode=$2,deposit_percentage=$3,payment_state=$4,payment_revision=payment_revision+1,updated_at=NOW() WHERE id=$1`, id, req.Mode == "ON", percent.StringFixed(2), s.Status)
	if err != nil {
		WriteOperationError(c, err)
		return
	}
	s.DepositMode = &req.Mode
	s.percent = percent
	s.DepositTargetPercent = percent.StringFixed(2)
	s.DepositTargetAmount = target.StringFixed(2)
	s.Revision++
	response := gin.H{"status": "success", "committed": true, "data": s}
	if err = CommitOperation(c, tx, "PAYMENT_POLICY", "ORDER", id, fp, response); err != nil {
		WriteOperationError(c, err)
		return
	}
	c.JSON(200, response)
}
func HandlePaymentHistory(c *gin.Context) {
	if c.GetString("user_id") == "" {
		WriteOperationError(c, operationError(401, "AUTHENTICATION_REQUIRED"))
		return
	}
	if db.DB == nil {
		WriteOperationError(c, operationError(503, "STORAGE_UNAVAILABLE"))
		return
	}
	tx, err := db.DB.BeginTx(c.Request.Context(), nil)
	if err != nil {
		WriteOperationError(c, err)
		return
	}
	defer tx.Rollback()
	s, err := loadPaymentSummary(c, tx, c.Param("id"), false)
	if err != nil {
		WriteOperationError(c, err)
		return
	}
	rows, err := tx.QueryContext(c.Request.Context(), `SELECT (to_jsonb(p)-'request_fingerprint') || jsonb_build_object('requested_amount_lak',p.requested_amount_lak::text,'actual_received_amount_lak',p.actual_received_amount_lak::text) FROM payment_records p WHERE order_id=$1 ORDER BY created_at,id`, s.OrderID)
	if err != nil {
		WriteOperationError(c, err)
		return
	}
	records := []map[string]any{}
	for rows.Next() {
		var raw []byte
		var record map[string]any
		if err = rows.Scan(&raw); err == nil {
			err = json.Unmarshal(raw, &record)
		}
		if err != nil {
			rows.Close()
			WriteOperationError(c, err)
			return
		}
		records = append(records, record)
	}
	err = rows.Err()
	rows.Close()
	if err == nil {
		for _, record := range records {
			url, _ := record["evidence_url"].(string)
			if _, e := ReadOrderUpload(c.Request.Context(), tx, s.OrderID, url, "payment_slip", false); e != nil {
				record["evidence_available"] = false
			} else {
				record["evidence_available"] = true
			}
		}
	}
	if err != nil {
		WriteOperationError(c, err)
		return
	}
	var captured sql.NullTime
	err = tx.QueryRowContext(c.Request.Context(), `SELECT payment_opening_captured_at FROM orders WHERE id=$1`, s.OrderID).Scan(&captured)
	if err != nil {
		WriteOperationError(c, err)
		return
	}
	var capturedAt any
	if captured.Valid {
		capturedAt = captured.Time.UTC()
	}
	if err = tx.Commit(); err != nil {
		WriteOperationError(c, err)
		return
	}
	c.JSON(200, gin.H{"status": "success", "data": gin.H{"records": records, "summary": s, "legacy_opening": gin.H{"provenance": "UNKNOWN", "received_lak": s.Opening, "captured_at": capturedAt, "reversible": false}}})
}

type paymentConfigRequest struct {
	Manual   *bool   `json:"manual_qr_enabled"`
	Portal   *bool   `json:"portal_enabled"`
	Gateway  *bool   `json:"gateway_enabled"`
	Method   *string `json:"payment_method_id"`
	Revision *int64  `json:"expected_revision"`
}

func paymentConfig(c *gin.Context, tx *sql.Tx) (gin.H, error) {
	var manual, portal, gateway bool
	var method sql.NullString
	var revision int64
	err := tx.QueryRowContext(c.Request.Context(), `SELECT manual_qr_enabled,portal_enabled,gateway_enabled,payment_method_id,revision FROM payment_configuration WHERE id=true`).Scan(&manual, &portal, &gateway, &method, &revision)
	if err != nil && !errors.Is(err, sql.ErrNoRows) {
		return nil, err
	}
	var value any
	if method.Valid {
		value = method.String
	}
	return gin.H{"manual_qr_enabled": manual, "portal_enabled": portal, "gateway_enabled": gateway, "payment_method_id": value, "revision": revision}, nil
}
func HandleGetPaymentConfig(c *gin.Context) {
	if db.DB == nil {
		WriteOperationError(c, operationError(503, "STORAGE_UNAVAILABLE"))
		return
	}
	tx, err := db.DB.BeginTx(c.Request.Context(), nil)
	if err != nil {
		WriteOperationError(c, err)
		return
	}
	defer tx.Rollback()
	data, err := paymentConfig(c, tx)
	if err == nil {
		err = tx.Commit()
	}
	if err != nil {
		WriteOperationError(c, err)
		return
	}
	c.JSON(200, gin.H{"status": "success", "data": data})
}
func HandlePutPaymentConfig(c *gin.Context) {
	if !operationRole(c, "owner", "admin", "manager") {
		return
	}
	var req paymentConfigRequest
	if c.ShouldBindJSON(&req) != nil {
		WriteOperationError(c, operationError(400, "INVALID_JSON"))
		return
	}
	tx, replay, fp, err := BeginOperation(c, "PAYMENT_CONFIGURATION", req)
	if err != nil {
		WriteOperationError(c, err)
		return
	}
	if replay != nil {
		c.Data(200, "application/json", replay)
		return
	}
	defer tx.Rollback()
	if err = LockPaymentConfiguration(c, tx); err != nil {
		WriteOperationError(c, err)
		return
	}
	old, err := paymentConfig(c, tx)
	if err != nil {
		WriteOperationError(c, err)
		return
	}
	if req.Revision == nil || *req.Revision != old["revision"].(int64) {
		WriteOperationError(c, operationError(409, "STALE_CONFIGURATION_REVISION"))
		return
	}
	if req.Gateway != nil && *req.Gateway != old["gateway_enabled"].(bool) && c.GetString("user_role") != "owner" {
		WriteOperationError(c, operationError(403, "OWNER_REQUIRED"))
		return
	}
	if (req.Gateway != nil && *req.Gateway) || (req.Portal != nil && *req.Portal) {
		WriteOperationError(c, operationError(422, "CHANNEL_UNAVAILABLE"))
		return
	}
	if req.Manual == nil {
		WriteOperationError(c, operationError(422, "MANUAL_QR_REQUIRED"))
		return
	}
	var method any
	if req.Method != nil && *req.Method != "" {
		method = *req.Method
	}
	if *req.Manual {
		if method == nil {
			WriteOperationError(c, operationError(422, "PAYMENT_METHOD_UNCONFIGURED"))
			return
		}
		var active bool
		var account, qr string
		err = tx.QueryRowContext(c.Request.Context(), `SELECT COALESCE(is_active,false),account_number,COALESCE(qr_code_url,'') FROM payment_methods WHERE id=$1 FOR SHARE`, method).Scan(&active, &account, &qr)
		if err != nil {
			WriteOperationError(c, err)
			return
		}
		if !active || strings.TrimSpace(account) == "" || qr == "" || strings.Contains(strings.ToLower(qr), "placeholder") {
			WriteOperationError(c, operationError(422, "PAYMENT_METHOD_UNCONFIGURED"))
			return
		}
	}
	revision := old["revision"].(int64) + 1
	_, err = tx.ExecContext(c.Request.Context(), `INSERT INTO payment_configuration(id,manual_qr_enabled,payment_method_id,revision,updated_by) VALUES(true,$1,$2,$3,$4) ON CONFLICT(id) DO UPDATE SET manual_qr_enabled=EXCLUDED.manual_qr_enabled,payment_method_id=EXCLUDED.payment_method_id,revision=EXCLUDED.revision,updated_by=EXCLUDED.updated_by,updated_at=NOW()`, *req.Manual, method, revision, c.GetString("user_id"))
	if err != nil {
		WriteOperationError(c, err)
		return
	}
	data, err := paymentConfig(c, tx)
	if err != nil {
		WriteOperationError(c, err)
		return
	}
	response := gin.H{"status": "success", "committed": true, "data": data}
	if err = CommitOperation(c, tx, "PAYMENT_CONFIGURATION", "PAYMENT_CONFIGURATION", "true", fp, response); err != nil {
		WriteOperationError(c, err)
		return
	}
	c.JSON(200, response)
}

// Journal linkage is obtained from this transaction, never guessed from an order's last journal.
func receiptJournal(c *gin.Context, tx *sql.Tx, orderID, recordID string, amount decimal.Decimal) (string, error) {
	bank, err := getAccountIDByCode(tx, "1110")
	if err != nil {
		return "", err
	}
	revenue, err := getAccountIDByCode(tx, "4100")
	if err != nil {
		return "", err
	}
	var id string
	err = tx.QueryRowContext(c.Request.Context(), `INSERT INTO journal_entries(entry_date,description,reference_type,reference_id,created_by) VALUES(CURRENT_DATE,$1,'PAYMENT_RECEIPT',$2,$3) RETURNING id::text`, "Receipt for order "+orderID, recordID, c.GetString("user_id")).Scan(&id)
	if err != nil {
		return "", err
	}
	_, err = tx.ExecContext(c.Request.Context(), `INSERT INTO journal_lines(entry_id,account_id,debit,credit,currency) VALUES($1::uuid,$2::uuid,$4,0,'LAK'),($1::uuid,$3::uuid,0,$4,'LAK')`, id, bank, revenue, amount.StringFixed(2))
	return id, err
}
func HandleReviewPaymentRecord(c *gin.Context, req PaymentVerificationRequest) {
	if !reviewRole(c) {
		return
	}
	tx, replay, fp, err := BeginOperation(c, "PAYMENT_REVIEW", req)
	if err != nil {
		WriteOperationError(c, err)
		return
	}
	if replay != nil {
		c.Data(200, "application/json", replay)
		return
	}
	defer tx.Rollback()
	if err = LockPaymentConfiguration(c, tx); err != nil {
		WriteOperationError(c, err)
		return
	}
	s, err := loadPaymentSummary(c, tx, req.OrderID, true)
	if err != nil {
		WriteOperationError(c, err)
		return
	}
	if err = validateRevision(s, req.ExpectedPaymentRevision); err != nil {
		WriteOperationError(c, err)
		return
	}
	record, err := applyPaymentReview(c, tx, s, req)
	if err != nil {
		WriteOperationError(c, err)
		return
	}
	response := gin.H{"status": "success", "committed": true, "orderId": s.OrderID, "newStatus": s.status, "record": record, "summary": s}
	if err = CommitOperation(c, tx, "PAYMENT_REVIEW", "ORDER", s.OrderID, fp, response); err != nil {
		WriteOperationError(c, err)
		return
	}
	c.JSON(200, response)
}

func applyPaymentReview(c *gin.Context, tx *sql.Tx, s *PaymentSummary, req PaymentVerificationRequest) (map[string]any, error) {
	var err error
	var state, requested, method, kind, reason, evidence string
	var actual sql.NullString
	err = tx.QueryRowContext(c.Request.Context(), `SELECT state,requested_amount_lak::text,payment_method_id,record_kind,COALESCE(reason,''),actual_received_amount_lak::text,evidence_url FROM payment_records WHERE id=$1::uuid AND order_id=$2 FOR UPDATE`, req.PaymentRecordID, s.OrderID).Scan(&state, &requested, &method, &kind, &reason, &actual, &evidence)
	if err != nil {
		return nil, err
	}
	if state != "PENDING" || kind != "RECEIPT" {
		return nil, operationError(409, "PAYMENT_ALREADY_DECIDED")
	}
	if _, err = ReadOrderUpload(c.Request.Context(), tx, s.OrderID, evidence, "payment_slip", false); err != nil {
		return nil, err
	}
	if req.Status != "APPROVED" && req.Status != "REJECTED" {
		return nil, operationError(422, "INVALID_REVIEW_DECISION")
	}
	if req.Status == "REJECTED" {
		if strings.TrimSpace(req.RejectionReason) == "" {
			return nil, operationError(422, "REJECTION_REASON_REQUIRED")
		}
		_, err = tx.ExecContext(c.Request.Context(), `UPDATE payment_records SET state='REJECTED',reviewer_id=$2,reason=$3,reviewed_at=NOW() WHERE id=$1::uuid`, req.PaymentRecordID, c.GetString("user_id"), req.RejectionReason)
	} else {
		// This durable request was admitted before configuration could change.
		// Reconciliation uses its retained original destination, even when disabled.
		var account string
		if err = tx.QueryRowContext(c.Request.Context(), `SELECT account_number FROM payment_methods WHERE id=$1 FOR SHARE`, method).Scan(&account); err != nil {
			return nil, err
		}
		if strings.TrimSpace(account) == "" {
			return nil, operationError(409, "PAYMENT_DESTINATION_INCONSISTENT")
		}
		amount, e := ParsePaymentAmount(req.ActualReceivedAmountLAK)
		requestedAmount, e2 := decimal.NewFromString(requested)
		if e != nil || e2 != nil || !amount.IsPositive() || amount.GreaterThan(requestedAmount) || amount.GreaterThan(s.remaining) {
			return nil, operationError(422, "INVALID_RECEIVED_AMOUNT")
		}
		if s.DepositMode == nil || *s.DepositMode == "OFF" {
			if !amount.Equal(s.remaining) {
				return nil, operationError(422, "FULL_OUTSTANDING_REQUIRED")
			}
		} else if err = eligibleCustomer(c, tx, s); err != nil {
			return nil, err
		}
		journalID, e := receiptJournal(c, tx, s.OrderID, req.PaymentRecordID, amount)
		if e != nil {
			return nil, e
		}
		_, err = tx.ExecContext(c.Request.Context(), `UPDATE payment_records SET state='CONFIRMED',actual_received_amount_lak=$2,reviewer_id=$3,journal_entry_id=$4::uuid,reviewed_at=NOW() WHERE id=$1::uuid`, req.PaymentRecordID, amount.StringFixed(2), c.GetString("user_id"), journalID)
		s.received = s.received.Add(amount)
	}
	if err != nil {
		return nil, err
	}
	if err = persistPaymentSummary(c, tx, s); err != nil {
		return nil, err
	}
	record, err := paymentRecordRow(c, tx, req.PaymentRecordID)
	if err != nil {
		return nil, err
	}
	return record, nil
}

func RegisterPaymentRoutes(router *gin.Engine) {
	staff := auth.RequireAuth()
	request := auth.RequireRoles("admin", "manager", "sales", "finance", "accountant", "owner")
	review := auth.RequireRoles("admin", "manager", "finance", "accountant", "owner")
	configuration := auth.RequireRoles("admin", "manager", "owner")
	router.GET("/api/v1/orders/:id/payment-records", staff, HandlePaymentHistory)
	router.POST("/api/v1/orders/:id/payment-records", request, HandleCreatePaymentRecord)
	router.PUT("/api/v1/orders/:id/payment-policy", request, HandlePaymentPolicy)
	router.GET("/api/v1/finance/payment-config", staff, HandleGetPaymentConfig)
	router.PUT("/api/v1/finance/payment-config", configuration, HandlePutPaymentConfig)
	router.POST("/api/v1/payment-records/:id/reversals", review, HandleReversePaymentRecord)
	router.POST("/api/v1/orders/:id/deposit", request, HandleCreatePaymentRecord)
}

type reversalRequest struct {
	Amount   string `json:"amount_lak"`
	Reason   string `json:"reason"`
	Revision *int64 `json:"expected_payment_revision"`
}

func HandleReversePaymentRecord(c *gin.Context) {
	if !reviewRole(c) {
		return
	}
	var req reversalRequest
	if c.ShouldBindJSON(&req) != nil {
		WriteOperationError(c, operationError(400, "INVALID_JSON"))
		return
	}
	req.Reason = strings.TrimSpace(req.Reason)
	amount, err := ParsePaymentAmount(req.Amount)
	if err != nil || !amount.IsPositive() || req.Reason == "" {
		WriteOperationError(c, operationError(422, "INVALID_REVERSAL"))
		return
	}
	originalID := c.Param("id")
	tx, replay, fp, err := BeginOperation(c, "PAYMENT_REVERSAL", gin.H{"record_id": originalID, "request": req})
	if err != nil {
		WriteOperationError(c, err)
		return
	}
	if replay != nil {
		c.Data(200, "application/json", replay)
		return
	}
	defer tx.Rollback()
	var orderID string
	err = tx.QueryRowContext(c.Request.Context(), `SELECT order_id FROM payment_records WHERE id=$1::uuid`, originalID).Scan(&orderID)
	if err != nil {
		WriteOperationError(c, err)
		return
	}
	s, err := loadPaymentSummary(c, tx, orderID, true)
	if err != nil {
		WriteOperationError(c, err)
		return
	}
	if err = validateRevision(s, req.Revision); err != nil {
		WriteOperationError(c, err)
		return
	}
	var kind, state, method, evidence string
	var sourceAmount, sourceJournal sql.NullString
	err = tx.QueryRowContext(c.Request.Context(), `SELECT record_kind,state,actual_received_amount_lak::text,journal_entry_id::text,payment_method_id,evidence_url FROM payment_records WHERE id=$1::uuid FOR UPDATE`, originalID).Scan(&kind, &state, &sourceAmount, &sourceJournal, &method, &evidence)
	if err != nil {
		WriteOperationError(c, err)
		return
	}
	if kind != "RECEIPT" || state != "CONFIRMED" || !sourceAmount.Valid || !sourceJournal.Valid {
		WriteOperationError(c, operationError(409, "REVERSAL_SOURCE_NOT_CONFIRMED"))
		return
	}
	source, err := decimal.NewFromString(sourceAmount.String)
	if err != nil {
		WriteOperationError(c, err)
		return
	}
	var priorText string
	if _, err = ReadOrderUpload(c.Request.Context(), tx, orderID, evidence, "payment_slip", false); err != nil {
		WriteOperationError(c, err)
		return
	}
	err = tx.QueryRowContext(c.Request.Context(), `SELECT COALESCE(SUM(actual_received_amount_lak),0)::text FROM payment_records WHERE reversal_of=$1::uuid AND state='CONFIRMED'`, originalID).Scan(&priorText)
	if err != nil {
		WriteOperationError(c, err)
		return
	}
	prior, err := decimal.NewFromString(priorText)
	if err != nil {
		WriteOperationError(c, err)
		return
	}
	if prior.Add(amount).GreaterThan(source) || amount.GreaterThan(s.received) {
		WriteOperationError(c, operationError(409, "REVERSAL_AMOUNT_EXCEEDS_RECEIPT"))
		return
	}
	rows, err := tx.QueryContext(c.Request.Context(), `SELECT account_id::text,debit::text,credit::text,currency FROM journal_lines WHERE entry_id=$1::uuid ORDER BY id FOR SHARE`, sourceJournal.String)
	if err != nil {
		WriteOperationError(c, err)
		return
	}
	type originalLine struct {
		account, currency string
		debit, credit     decimal.Decimal
	}
	lines := []originalLine{}
	debitTotal, creditTotal := decimal.Zero, decimal.Zero
	for rows.Next() {
		var account, debit, credit, currency string
		if err = rows.Scan(&account, &debit, &credit, &currency); err != nil {
			break
		}
		d, e := decimal.NewFromString(debit)
		cr, e2 := decimal.NewFromString(credit)
		if e != nil || e2 != nil || currency != "LAK" || d.IsNegative() || cr.IsNegative() || (d.IsPositive() && cr.IsPositive()) {
			err = operationError(409, "REVERSAL_JOURNAL_INCONSISTENT")
			break
		}
		lines = append(lines, originalLine{account, currency, d, cr})
		debitTotal = debitTotal.Add(d)
		creditTotal = creditTotal.Add(cr)
	}
	if err == nil {
		err = rows.Err()
	}
	rows.Close()
	if err != nil {
		WriteOperationError(c, err)
		return
	}
	// Receipts produced by this service have two exact lines. Refuse ambiguous legacy allocations.
	if len(lines) != 2 || !debitTotal.Equal(source) || !creditTotal.Equal(source) {
		WriteOperationError(c, operationError(409, "REVERSAL_JOURNAL_INCONSISTENT"))
		return
	}
	reversalID, err := NewOperationID()
	if err != nil {
		WriteOperationError(c, err)
		return
	}
	var journalID string
	err = tx.QueryRowContext(c.Request.Context(), `INSERT INTO journal_entries(entry_date,description,reference_type,reference_id,created_by) VALUES(CURRENT_DATE,$1,'PAYMENT_REVERSAL',$2,$3) RETURNING id::text`, fmt.Sprintf("Reversal of receipt %s: %s", originalID, req.Reason), reversalID, c.GetString("user_id")).Scan(&journalID)
	if err != nil {
		WriteOperationError(c, err)
		return
	}
	for _, line := range lines {
		debit, credit := decimal.Zero, decimal.Zero
		if line.credit.IsPositive() {
			debit = amount
		}
		if line.debit.IsPositive() {
			credit = amount
		}
		_, err = tx.ExecContext(c.Request.Context(), `INSERT INTO journal_lines(entry_id,account_id,debit,credit,currency) VALUES($1::uuid,$2::uuid,$3,$4,$5)`, journalID, line.account, debit.StringFixed(2), credit.StringFixed(2), line.currency)
		if err != nil {
			WriteOperationError(c, err)
			return
		}
	}
	_, err = tx.ExecContext(c.Request.Context(), `INSERT INTO payment_records(id,order_id,record_kind,state,channel,purpose,requested_amount_lak,actual_received_amount_lak,payment_method_id,evidence_url,reversal_of,reason,actor_id,reviewer_id,journal_entry_id,request_key,request_fingerprint,reviewed_at) VALUES($1::uuid,$2,'REVERSAL','CONFIRMED','MANUAL_QR','REMAINING',$3,$3,$4,$5,$6::uuid,$7,$8,$8,$9::uuid,$10,$11,NOW())`, reversalID, orderID, amount.StringFixed(2), method, evidence, originalID, req.Reason, c.GetString("user_id"), journalID, c.GetHeader("Idempotency-Key"), fp)
	if err != nil {
		WriteOperationError(c, err)
		return
	}
	s.received = s.received.Sub(amount)
	if err = persistPaymentSummary(c, tx, s); err != nil {
		WriteOperationError(c, err)
		return
	}
	record, err := paymentRecordRow(c, tx, reversalID)
	if err != nil {
		WriteOperationError(c, err)
		return
	}
	response := gin.H{"status": "success", "committed": true, "data": gin.H{"record": record, "summary": s, "original_record_id": originalID}}
	if err = CommitOperation(c, tx, "PAYMENT_REVERSAL", "ORDER", orderID, fp, response); err != nil {
		WriteOperationError(c, err)
		return
	}
	c.JSON(201, response)
}

func HandleLegacyFullReview(c *gin.Context, req PaymentVerificationRequest) {
	if !reviewRole(c) {
		return
	}
	if db.DB == nil {
		WriteOperationError(c, operationError(503, "STORAGE_UNAVAILABLE"))
		return
	}
	var id, slip string
	rows, err := db.DB.QueryContext(c.Request.Context(), `SELECT id,COALESCE(NULLIF(payment_slip_url,''),proof_url,'') FROM orders WHERE id=$1 OR order_no=$1`, req.OrderID)
	if err != nil {
		WriteOperationError(c, err)
		return
	}
	count := 0
	for rows.Next() {
		count++
		if err = rows.Scan(&id, &slip); err != nil {
			break
		}
	}
	if err == nil {
		err = rows.Err()
	}
	rows.Close()
	if err != nil {
		WriteOperationError(c, err)
		return
	}
	if count == 0 {
		WriteOperationError(c, sql.ErrNoRows)
		return
	}
	if count != 1 {
		WriteOperationError(c, operationError(409, "AMBIGUOUS_ORDER_ID"))
		return
	}
	req.OrderID = id
	if c.GetHeader("Idempotency-Key") == "" {
		sum := sha256.Sum256([]byte(id + "\x00" + slip + "\x00" + req.Status))
		c.Request.Header.Set("Idempotency-Key", "legacy-review:"+hex.EncodeToString(sum[:]))
	}
	tx, replay, fp, err := BeginOperation(c, "LEGACY_FULL_REVIEW", gin.H{"request": req, "slip": slip})
	if err != nil {
		WriteOperationError(c, err)
		return
	}
	if replay != nil {
		c.Data(200, "application/json", replay)
		return
	}
	defer tx.Rollback()
	if err = LockPaymentConfiguration(c, tx); err != nil {
		WriteOperationError(c, err)
		return
	}
	s, err := loadPaymentSummary(c, tx, id, true)
	if err != nil {
		WriteOperationError(c, err)
		return
	}
	if s.received.IsPositive() {
		WriteOperationError(c, operationError(409, "LEGACY_PARTIAL_REQUIRES_RECEIPT"))
		return
	}
	switch s.status {
	case "PENDING_SLIP_CHECK", "PENDING_PAYMENT", "WAITING_DEPOSIT", "Verification Required", "Pending Payment":
	default:
		WriteOperationError(c, operationError(409, "PAYMENT_ALREADY_DECIDED"))
		return
	}
	if slip == "" || slip != s.slip || (!strings.HasPrefix(slip, "/api/v1/orders/files/") && !strings.HasPrefix(slip, "/uploads/")) || strings.Contains(slip, "..") {
		WriteOperationError(c, operationError(422, "PAYMENT_EVIDENCE_NOT_OWNED"))
		return
	}
	if _, err = ReadOrderUpload(c.Request.Context(), tx, id, slip, "payment_slip", true); err != nil {
		WriteOperationError(c, err)
		return
	}
	var method string
	err = tx.QueryRowContext(c.Request.Context(), `SELECT payment_method_id FROM payment_configuration WHERE id=true AND manual_qr_enabled FOR UPDATE`).Scan(&method)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			err = operationError(409, "PAYMENT_CHANNEL_DISABLED")
		}
		WriteOperationError(c, err)
		return
	}
	if err = admitPaymentMethod(c, tx, method); err != nil {
		WriteOperationError(c, err)
		return
	}
	if !s.remaining.IsPositive() {
		WriteOperationError(c, operationError(422, "INVALID_RECEIVED_AMOUNT"))
		return
	}
	var recordID string
	err = tx.QueryRowContext(c.Request.Context(), `INSERT INTO payment_records(order_id,record_kind,state,channel,purpose,requested_amount_lak,payment_method_id,evidence_url,actor_id,request_key,request_fingerprint) VALUES($1,'RECEIPT','PENDING','MANUAL_QR','FULL',$2,$3,$4,$5,$6,$7) RETURNING id::text`, id, s.Remaining, method, slip, c.GetString("user_id"), c.GetHeader("Idempotency-Key"), fp).Scan(&recordID)
	if err != nil {
		WriteOperationError(c, err)
		return
	}
	req.PaymentRecordID = recordID
	req.ActualReceivedAmountLAK = s.Remaining
	record, err := applyPaymentReview(c, tx, s, req)
	if err != nil {
		WriteOperationError(c, err)
		return
	}
	newStatus := "PAYMENT_REJECTED"
	if req.Status == "APPROVED" {
		newStatus = "PAID_PREPRESS"
	}
	_, err = tx.ExecContext(c.Request.Context(), `UPDATE orders SET status=$2,overall_status=$2,proof_rejection_reason=$3 WHERE id=$1`, id, newStatus, req.RejectionReason)
	if err != nil {
		WriteOperationError(c, err)
		return
	}
	response := gin.H{"status": "success", "committed": true, "orderId": id, "newStatus": newStatus, "record": record, "summary": s}
	if err = CommitOperation(c, tx, "LEGACY_FULL_REVIEW", "ORDER", id, fp, response); err != nil {
		WriteOperationError(c, err)
		return
	}
	c.JSON(200, response)
}

// HandleOrderTotalCorrection is the only existing-order total writer.
// Authorized review records the reason and prior server summary; original quote/items stay historical.
func HandleOrderTotalCorrection(c *gin.Context, body map[string]any, validateSource func(*gin.Context, *sql.Tx, map[string]any, decimal.Decimal) (gin.H, error)) {
	if !reviewRole(c) {
		return
	}
	id := c.Param("id")
	for key := range body {
		switch key {
		case "total_price", "expected_payment_revision", "reason", "source_quotation_id", "source_quotation_updated_at":
		default:
			WriteOperationError(c, operationError(422, "TOTAL_CORRECTION_MUST_BE_SEPARATE"))
			return
		}
	}
	amountText, ok := body["total_price"].(string)
	if !ok {
		WriteOperationError(c, operationError(422, "DECIMAL_STRING_REQUIRED"))
		return
	}
	total, err := ParsePaymentAmount(amountText)
	if err != nil {
		WriteOperationError(c, err)
		return
	}
	reason, ok := body["reason"].(string)
	if !ok || strings.TrimSpace(reason) == "" {
		WriteOperationError(c, operationError(422, "TOTAL_CORRECTION_REASON_REQUIRED"))
		return
	}
	revisionValue, ok := body["expected_payment_revision"].(float64)
	if !ok || revisionValue < 0 || revisionValue != float64(int64(revisionValue)) {
		WriteOperationError(c, operationError(422, "PAYMENT_REVISION_REQUIRED"))
		return
	}
	revision := int64(revisionValue)
	tx, replay, fp, err := BeginOperation(c, "ORDER_TOTAL_CORRECTION", gin.H{"order_id": id, "request": body})
	if err != nil {
		WriteOperationError(c, err)
		return
	}
	if replay != nil {
		c.Data(200, "application/json", replay)
		return
	}
	defer tx.Rollback()
	s, err := loadPaymentSummary(c, tx, id, true)
	if err != nil {
		WriteOperationError(c, err)
		return
	}
	if err = validateRevision(s, &revision); err != nil {
		WriteOperationError(c, err)
		return
	}
	if total.LessThan(s.received) {
		WriteOperationError(c, operationError(409, "TOTAL_BELOW_RECEIVED"))
		return
	}
	source, err := validateSource(c, tx, body, total)
	if err != nil { // Map the source owner's structured failure without importing orders.
		var failure interface{ PaymentFailure() (int, string) }
		if errors.As(err, &failure) {
			status, code := failure.PaymentFailure()
			err = operationError(status, code)
		}
		WriteOperationError(c, err)
		return
	}
	previous := s.Total
	s.total = total
	_, err = tx.ExecContext(c.Request.Context(), `UPDATE orders SET total_price=$2,total_amount_lak=$2 WHERE id=$1`, id, total.StringFixed(2))
	if err == nil {
		err = persistPaymentSummary(c, tx, s)
	}
	if err != nil {
		WriteOperationError(c, err)
		return
	}
	source["previous_total_lak"] = previous
	source["total_lak"] = s.Total
	source["reason"] = reason
	source["reviewer_id"] = c.GetString("user_id")
	response := gin.H{"status": "success", "committed": true, "data": s, "price_review": source}
	if err = CommitOperation(c, tx, "ORDER_TOTAL_CORRECTION", "ORDER", id, fp, response); err != nil {
		WriteOperationError(c, err)
		return
	}
	c.JSON(200, response)
}
func RejectOrderMoneyBypass(c *gin.Context, body map[string]any) bool {
	for _, key := range strings.Fields("deposit_amount deposit_lak depositAmountPaid received_net_lak received_amount_lak paid_amount paid_amount_lak remaining_lak remaining_amount_lak payment_status payment_state payment_revision deposit_mode deposit_percentage deposit_target_percent deposit_target_amount_lak total_amount_lak totalPriceCharged") {
		if _, has := body[key]; has {
			WriteOperationError(c, operationError(422, "MONEY_WRITER_BYPASS"))
			return true
		}
	}
	return false
}
func OrderCanDelete(c *gin.Context, tx *sql.Tx, id string) error {
	s, err := loadPaymentSummary(c, tx, id, false)
	if err != nil {
		return err
	}
	var history bool
	err = tx.QueryRowContext(c.Request.Context(), `SELECT EXISTS(SELECT 1 FROM payment_records WHERE order_id=$1) OR EXISTS(SELECT 1 FROM bank_transaction_logs WHERE order_id=$1) OR EXISTS(SELECT 1 FROM journal_entries WHERE reference_type='ORDER' AND reference_id=$1)`, id).Scan(&history)
	if err != nil {
		return err
	}
	if history || s.received.IsPositive() {
		return operationError(409, "ORDER_PAYMENT_HISTORY_PRESENT")
	}
	return nil
}

func ReadOrderPaymentSummaryTx(ctx context.Context, tx *sql.Tx, id string) (*PaymentSummary, error) {
	if tx == nil {
		return nil, operationError(503, "STORAGE_UNAVAILABLE")
	}
	return loadPaymentSummaryContext(ctx, tx, id, false)
}

func ReadOrderPaymentSummary(ctx context.Context, id string) (*PaymentSummary, error) {
	if db.DB == nil {
		return nil, operationError(503, "STORAGE_UNAVAILABLE")
	}
	tx, err := db.DB.BeginTx(ctx, nil)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback()
	summary, err := loadPaymentSummaryContext(ctx, tx, id, false)
	if err != nil {
		return nil, err
	}
	if err = tx.Commit(); err != nil {
		return nil, err
	}
	return summary, nil
}
func CheckOrderFundsForProduction(ctx context.Context, tx *sql.Tx, id string) error {
	summary, err := loadPaymentSummaryContext(ctx, tx, id, false)
	if err != nil {
		return err
	}
	if summary.total.IsZero() {
		return nil
	}
	if summary.DepositMode != nil && *summary.DepositMode == "OFF" {
		if !summary.remaining.IsZero() {
			return operationError(409, "FULL_PAYMENT_REQUIRED_FOR_PRODUCTION")
		}
		return nil
	}
	if !summary.received.IsPositive() {
		return operationError(409, "CONFIRMED_FUNDS_REQUIRED_FOR_PRODUCTION")
	}
	if summary.DepositMode != nil && *summary.DepositMode == "ON" {
		var eligible bool
		err = tx.QueryRowContext(ctx, `SELECT deposit_eligible FROM customers WHERE id=$1 FOR SHARE`, summary.customerID).Scan(&eligible)
		if err != nil {
			return err
		}
		if !eligible {
			return operationError(409, "CUSTOMER_DEPOSIT_INELIGIBLE")
		}
	}
	return nil
}

// ReadOrderUpload validates retained association and real bytes. requireAudit is
// used only for new admissions; old records retain explicit legacy associations.
func ReadOrderUpload(ctx context.Context, tx *sql.Tx, orderID, url, purpose string, requireAudit bool) (map[string]any, error) {
	fail := func() (map[string]any, error) { return nil, operationError(409, "EVIDENCE_UNAVAILABLE") }
	var orderNo string
	if err := tx.QueryRowContext(ctx, `SELECT COALESCE(order_no,'') FROM orders WHERE id=$1`, orderID).Scan(&orderNo); err != nil {
		return nil, err
	}
	var relative string
	if strings.HasPrefix(url, "/api/v1/orders/files/") {
		relative = strings.TrimPrefix(url, "/api/v1/orders/files/")
	} else if strings.HasPrefix(url, "/uploads/") {
		relative = strings.TrimPrefix(url, "/uploads/")
	} else {
		return fail()
	}
	if strings.Contains(relative, "..") || strings.ContainsAny(relative, "\\\x00") || filepath.IsAbs(relative) {
		return fail()
	}
	canonicalPrefix := "orders/" + orderID + "/"
	if !strings.HasPrefix(relative, canonicalPrefix) && (requireAudit || orderNo == "" || !strings.HasPrefix(relative, "orders/"+orderNo+"/")) {
		return fail()
	}
	root := strings.TrimSpace(os.Getenv("UPLOAD_STORAGE_DIR"))
	if root == "" {
		root = "./uploads"
	}
	absoluteRoot, err := filepath.Abs(root)
	if err != nil {
		return nil, err
	}
	absoluteRoot, err = filepath.EvalSymlinks(absoluteRoot)
	if err != nil {
		return fail()
	}
	target, err := filepath.EvalSymlinks(filepath.Join(absoluteRoot, filepath.FromSlash(relative)))
	if err != nil {
		return fail()
	}
	rel, err := filepath.Rel(absoluteRoot, target)
	if err != nil || rel == ".." || strings.HasPrefix(rel, ".."+string(filepath.Separator)) {
		return fail()
	}
	// A contained symlink to a different order is still not order ownership.
	if filepath.ToSlash(rel) != relative {
		return fail()
	}
	file, err := os.Open(target)
	if err != nil {
		return fail()
	}
	defer file.Close()
	stat, err := file.Stat()
	if err != nil || !stat.Mode().IsRegular() || stat.Size() <= 0 || stat.Size() > 50*1024*1024 {
		return fail()
	}
	hash := sha256.New()
	header := make([]byte, 512)
	n, err := file.Read(header)
	if err != nil && err != io.EOF {
		return fail()
	}
	mime := http.DetectContentType(header[:n])
	if _, err = file.Seek(0, io.SeekStart); err != nil {
		return fail()
	}
	if _, err = io.Copy(hash, io.LimitReader(file, 50*1024*1024+1)); err != nil {
		return fail()
	}
	digest := hex.EncodeToString(hash.Sum(nil))
	var raw []byte
	err = tx.QueryRowContext(ctx, `SELECT new_values->'data' FROM audit_logs WHERE resource_type='ORDER' AND resource_id=$1 AND action IN ('PAYMENT_SLIP_UPLOADED','ORDER_ARTWORK_UPLOADED') AND new_values->'data'->>'file_url'=$2 ORDER BY created_at DESC LIMIT 1`, orderID, url).Scan(&raw)
	if errors.Is(err, sql.ErrNoRows) {
		if requireAudit {
			return fail()
		}
		// Historical evidence is kept, without inventing a server upload hash/audit.
		if purpose == "payment_slip" && mime != "image/png" && mime != "image/jpeg" && mime != "application/pdf" {
			return fail()
		}
		return map[string]any{"file_url": url, "size": stat.Size(), "mime_type": mime, "legacy_association": true}, nil
	}
	if err != nil {
		return nil, err
	}
	var asset map[string]any
	if err = json.Unmarshal(raw, &asset); err != nil {
		return nil, err
	}
	size, ok := asset["size"].(float64)
	if !ok || size != float64(stat.Size()) || asset["sha256"] != digest || asset["mime_type"] != mime || asset["order_id"] != orderID || asset["purpose"] != purpose {
		return fail()
	}
	return asset, nil
}
func BindPaymentSlipTx(c *gin.Context, tx *sql.Tx, id, url string, revision int64) (*PaymentSummary, error) {
	s, err := loadPaymentSummary(c, tx, id, true)
	if err != nil {
		return nil, err
	}
	if err = validateRevision(s, &revision); err != nil {
		return nil, err
	}
	result, err := tx.ExecContext(c.Request.Context(), `UPDATE orders SET payment_slip_url=$2 WHERE id=$1`, id, url)
	if err != nil {
		return nil, err
	}
	n, err := result.RowsAffected()
	if err != nil {
		return nil, err
	}
	if n != 1 {
		return nil, sql.ErrNoRows
	}
	if err = persistPaymentSummary(c, tx, s); err != nil {
		return nil, err
	}
	return s, nil
}
