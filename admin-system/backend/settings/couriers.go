package settings

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"math"
	"net/http"
	"os"
	"path/filepath"
	"somsing.local/backend/finance"
	"sort"
	"strings"
	"time"

	"somsing.local/backend/db"

	"github.com/gin-gonic/gin"
)

type Courier struct {
	ID        string    `json:"id"`
	Name      string    `json:"name"`
	ShortName string    `json:"shortName"`
	LogoURL   string    `json:"logoUrl"`
	Fee       float64   `json:"fee"`
	ETA       string    `json:"eta"`
	FreeAbove float64   `json:"freeAbove"`
	Color     string    `json:"color"`
	IsActive  bool      `json:"isActive"`
	IsDefault bool      `json:"isDefault"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

type PaymentMethod struct {
	ID            string    `json:"id"`
	BankName      string    `json:"bankName"`
	AccountName   string    `json:"accountName"`
	AccountNumber string    `json:"accountNumber"`
	Branch        string    `json:"branch"`
	QRCodeURL     string    `json:"qrCodeUrl"`
	LogoURL       string    `json:"logoUrl"`
	PromptPayName string    `json:"promptpayName"`
	ShopName      string    `json:"shopName"`
	IsActive      bool      `json:"isActive"`
	IsDefault     bool      `json:"isDefault"`
	CreatedAt     time.Time `json:"createdAt"`
	UpdatedAt     time.Time `json:"updatedAt"`
}

func settingsAvailable(c *gin.Context, write bool) bool {
	if db.DB == nil {
		finance.WriteOperationError(c, &finance.OperationError{Status: 503, Code: "STORAGE_UNAVAILABLE"})
		return false
	}
	if write {
		role := c.GetString("user_role")
		if role != "admin" && role != "manager" && role != "owner" {
			finance.WriteOperationError(c, &finance.OperationError{Status: 403, Code: "SETTINGS_ROLE_REQUIRED"})
			return false
		}
	}
	return true
}
func settingsRow(raw []byte) (map[string]any, error) {
	var source map[string]any
	if err := json.Unmarshal(raw, &source); err != nil {
		return nil, err
	}
	out := map[string]any{}
	for key, value := range source {
		parts := strings.Split(key, "_")
		for i := 1; i < len(parts); i++ {
			parts[i] = strings.ToUpper(parts[i][:1]) + parts[i][1:]
		}
		out[strings.Join(parts, "")] = value
	}
	if value, has := out["accountName"]; has {
		out["shopName"] = value
	}
	return out, nil
}
func settingsList(c *gin.Context, table string) {
	if !settingsAvailable(c, false) {
		return
	}
	rows, err := db.DB.QueryContext(c.Request.Context(), "SELECT to_jsonb(t) FROM "+table+" t ORDER BY is_default DESC,created_at,id")
	if err != nil {
		finance.WriteOperationError(c, err)
		return
	}
	defer rows.Close()
	list := []map[string]any{}
	for rows.Next() {
		var raw []byte
		if err = rows.Scan(&raw); err != nil {
			finance.WriteOperationError(c, err)
			return
		}
		row, e := settingsRow(raw)
		if e != nil {
			finance.WriteOperationError(c, e)
			return
		}
		list = append(list, row)
	}
	if err = rows.Err(); err != nil {
		finance.WriteOperationError(c, err)
		return
	}
	c.JSON(200, gin.H{"status": "success", "data": list})
}
func HandleGetCouriers(c *gin.Context)       { settingsList(c, "couriers") }
func HandleGetPaymentMethods(c *gin.Context) { settingsList(c, "payment_methods") }
func settingsAudit(c *gin.Context, tx *sql.Tx, table, id, action string, old, row any) error {
	oldJSON, err := json.Marshal(old)
	if err != nil {
		return err
	}
	newJSON, err := json.Marshal(row)
	if err != nil {
		return err
	}
	auditID, err := finance.NewOperationID()
	if err != nil {
		return err
	}
	_, err = tx.ExecContext(c.Request.Context(), `INSERT INTO audit_logs(id,user_id,user_name,action,resource_type,resource_id,old_values,new_values,ip_address) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)`, auditID, c.GetString("user_id"), c.GetString("username"), action, table, id, string(oldJSON), string(newJSON), c.ClientIP())
	return err
}
func settingsWrite(c *gin.Context, table, id string, create, deactivate bool, values map[string]any) {
	if !settingsAvailable(c, true) {
		return
	}
	tx, err := db.DB.BeginTx(c.Request.Context(), nil)
	if err != nil {
		finance.WriteOperationError(c, err)
		return
	}
	defer tx.Rollback()
	if table == "payment_methods" {
		if err = finance.LockPaymentConfiguration(c, tx); err != nil {
			finance.WriteOperationError(c, err)
			return
		}
	}
	var old map[string]any
	if !create {
		var raw []byte
		err = tx.QueryRowContext(c.Request.Context(), "SELECT to_jsonb(t) FROM "+table+" t WHERE id=$1 FOR UPDATE", id).Scan(&raw)
		if err != nil {
			finance.WriteOperationError(c, err)
			return
		}
		old, err = settingsRow(raw)
		if err != nil {
			finance.WriteOperationError(c, err)
			return
		}
	}
	if create {
		id, err = finance.NewOperationID()
		if err != nil {
			finance.WriteOperationError(c, err)
			return
		}
	}
	if table == "payment_methods" && !create && !deactivate {
		var history bool
		err = tx.QueryRowContext(c.Request.Context(), `SELECT EXISTS(SELECT 1 FROM payment_records WHERE payment_method_id=$1)`, id).Scan(&history)
		if err != nil {
			finance.WriteOperationError(c, err)
			return
		}
		if history && (old["bankName"] != values["bank_name"] || old["accountName"] != values["account_name"] || old["accountNumber"] != values["account_number"]) {
			finance.WriteOperationError(c, &finance.OperationError{Status: 409, Code: "PAYMENT_METHOD_HISTORY_PRESENT"})
			return
		}
	}
	if deactivate {
		values = map[string]any{"is_active": false}
	}
	keys := make([]string, 0, len(values))
	for key := range values {
		keys = append(keys, key)
	}
	sort.Strings(keys)
	args := []any{}
	marks, sets := []string{}, []string{}
	for _, key := range keys {
		args = append(args, values[key])
		mark := fmt.Sprintf("$%d", len(args))
		marks = append(marks, mark)
		sets = append(sets, key+"="+mark)
	}
	var query string
	if create {
		keys = append(keys, "id")
		args = append(args, id)
		marks = append(marks, fmt.Sprintf("$%d", len(args)))
		query = "INSERT INTO " + table + " (" + strings.Join(keys, ",") + ") VALUES (" + strings.Join(marks, ",") + ") RETURNING to_jsonb(" + table + ")"
	} else {
		args = append(args, id)
		query = "UPDATE " + table + " SET " + strings.Join(sets, ",") + ",updated_at=NOW() WHERE id=" + fmt.Sprintf("$%d", len(args)) + " RETURNING to_jsonb(" + table + ")"
	}
	var raw []byte
	err = tx.QueryRowContext(c.Request.Context(), query, args...).Scan(&raw)
	if err != nil {
		finance.WriteOperationError(c, err)
		return
	}
	row, err := settingsRow(raw)
	if err != nil {
		finance.WriteOperationError(c, err)
		return
	}
	if table == "payment_methods" && row["isActive"] == false {
		_, err = tx.ExecContext(c.Request.Context(), `UPDATE payment_configuration SET manual_qr_enabled=false,revision=revision+1,updated_by=$2,updated_at=NOW() WHERE payment_method_id=$1 AND manual_qr_enabled`, id, c.GetString("user_id"))
		if err != nil {
			finance.WriteOperationError(c, err)
			return
		}
	}
	if err = settingsAudit(c, tx, table, id, "SETTINGS_SAVE", old, row); err == nil {
		err = tx.Commit()
	}
	if err != nil {
		finance.WriteOperationError(c, err)
		return
	}
	code := 200
	if create {
		code = 201
	}
	c.JSON(code, gin.H{"status": "success", "committed": true, "data": row})
}
func saveCourier(c *gin.Context, create bool) {
	var req Courier
	if c.ShouldBindJSON(&req) != nil {
		finance.WriteOperationError(c, &finance.OperationError{Status: 400, Code: "INVALID_JSON"})
		return
	}
	if strings.TrimSpace(req.Name) == "" || math.IsNaN(req.Fee) || math.IsInf(req.Fee, 0) || req.Fee < 0 || math.IsNaN(req.FreeAbove) || math.IsInf(req.FreeAbove, 0) || req.FreeAbove < 0 {
		finance.WriteOperationError(c, &finance.OperationError{Status: 422, Code: "INVALID_COURIER"})
		return
	}
	if create {
		req.IsActive = true
	}
	settingsWrite(c, "couriers", c.Param("id"), create, false, map[string]any{"name": req.Name, "short_name": req.ShortName, "logo_url": req.LogoURL, "fee": req.Fee, "eta": req.ETA, "free_above": req.FreeAbove, "color": req.Color, "is_active": req.IsActive, "is_default": req.IsDefault})
}
func HandleCreateCourier(c *gin.Context) { saveCourier(c, true) }
func HandleUpdateCourier(c *gin.Context) { saveCourier(c, false) }
func HandleDeleteCourier(c *gin.Context) {
	settingsWrite(c, "couriers", c.Param("id"), false, true, nil)
}
func HandleSyncCouriers(c *gin.Context) {
	finance.WriteOperationError(c, &finance.OperationError{Status: 409, Code: "BULK_REPLACEMENT_FORBIDDEN"})
}
func savePaymentMethod(c *gin.Context, create bool) {
	var req PaymentMethod
	if c.ShouldBindJSON(&req) != nil {
		finance.WriteOperationError(c, &finance.OperationError{Status: 400, Code: "INVALID_JSON"})
		return
	}
	if req.AccountName == "" {
		req.AccountName = req.ShopName
	}
	if req.ShopName != "" && req.ShopName != req.AccountName {
		finance.WriteOperationError(c, &finance.OperationError{Status: 422, Code: "SHOP_NAME_ACCOUNT_NAME_MISMATCH"})
		return
	}
	if strings.TrimSpace(req.BankName) == "" || strings.TrimSpace(req.AccountName) == "" || strings.TrimSpace(req.AccountNumber) == "" || strings.HasPrefix(req.QRCodeURL, "blob:") || strings.HasPrefix(req.QRCodeURL, "data:") {
		finance.WriteOperationError(c, &finance.OperationError{Status: 422, Code: "INVALID_PAYMENT_METHOD"})
		return
	}
	if create {
		req.IsActive = true
	}
	settingsWrite(c, "payment_methods", c.Param("id"), create, false, map[string]any{"bank_name": req.BankName, "account_name": req.AccountName, "account_number": req.AccountNumber, "branch": req.Branch, "qr_code_url": req.QRCodeURL, "logo_url": req.LogoURL, "promptpay_name": req.PromptPayName, "is_active": req.IsActive, "is_default": req.IsDefault})
}
func HandleCreatePaymentMethod(c *gin.Context) { savePaymentMethod(c, true) }
func HandleUpdatePaymentMethod(c *gin.Context) { savePaymentMethod(c, false) }
func HandleDeletePaymentMethod(c *gin.Context) {
	settingsWrite(c, "payment_methods", c.Param("id"), false, true, nil)
}
func HandleSyncPaymentMethods(c *gin.Context) {
	finance.WriteOperationError(c, &finance.OperationError{Status: 409, Code: "BULK_REPLACEMENT_FORBIDDEN"})
}

func HandleUploadLogo(c *gin.Context) {
	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No file uploaded"})
		return
	}

	uploadDir := "./uploads"
	if err := os.MkdirAll(uploadDir, 0755); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create upload dir"})
		return
	}

	ext := filepath.Ext(file.Filename)
	filename := fmt.Sprintf("logo_%d%s", time.Now().UnixNano(), ext)
	targetPath := filepath.Join(uploadDir, filename)

	if err := c.SaveUploadedFile(file, targetPath); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save file"})
		return
	}

	fileURL := fmt.Sprintf("/api/v1/orders/files/%s", filename)
	c.JSON(http.StatusOK, gin.H{
		"status":  "success",
		"fileUrl": fileURL,
	})
}
