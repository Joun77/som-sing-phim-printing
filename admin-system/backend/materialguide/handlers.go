package materialguide

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"
	"regexp"
	"sort"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/lib/pq"
	"somsing.local/backend/auth"
	"somsing.local/backend/db"
)

type resource struct {
	table    string
	fields   []string
	required []string
}

var materials = resource{"product_materials", strings.Fields("category category_name_lo category_name_en name_lo name_en gsm finish_lo finish_en texture_class description_lo description_en pros_lo pros_en cons_lo cons_en finishing_compat_lo finishing_compat_en suitable_for_lo suitable_for_en product_link product_title sort_order is_active"), strings.Fields("category category_name_lo category_name_en name_lo name_en gsm")}
var faqs = resource{"product_faqs", strings.Fields("question_lo question_en answer_lo answer_en sort_order is_active"), strings.Fields("question_lo answer_lo")}
var categories = resource{"material_categories", strings.Fields("key name_lo name_en icon description_lo description_en sort_order is_active"), strings.Fields("key name_lo name_en")}

func camel(s string) string {
	parts := strings.Split(s, "_")
	for i := 1; i < len(parts); i++ {
		parts[i] = strings.ToUpper(parts[i][:1]) + parts[i][1:]
	}
	return strings.Join(parts, "")
}
func shape(raw []byte) (map[string]any, error) {
	var row map[string]any
	if err := json.Unmarshal(raw, &row); err != nil {
		return nil, err
	}
	out := map[string]any{}
	for k, v := range row {
		out[camel(k)] = v
	}
	return out, nil
}
func fail(c *gin.Context, err error) {
	code := 500
	key := "STORAGE_FAILURE"
	if err == sql.ErrNoRows {
		code = 404
		key = "NOT_FOUND"
	}
	if e, ok := err.(*pq.Error); ok {
		if e.Code == "23505" {
			code = 409
			key = "CONFLICT"
		}
		if e.Code == "22P02" || e.Code == "23502" || e.Code == "23514" {
			code = 422
			key = "INVALID_FIELD"
		}
	}
	c.AbortWithStatusJSON(code, gin.H{"status": "error", "code": key, "message": "ບໍ່ສາມາດບັນທຶກໄດ້"})
}
func available(c *gin.Context) bool {
	if db.DB == nil {
		c.AbortWithStatusJSON(503, gin.H{"status": "error", "code": "STORAGE_UNAVAILABLE", "message": "ລະບົບຈັດເກັບຂໍ້ມູນບໍ່ພ້ອມ"})
		return false
	}
	return true
}
func list(r resource) gin.HandlerFunc {
	return func(c *gin.Context) {
		if !available(c) {
			return
		}
		rows, err := db.DB.Query("SELECT to_jsonb(t) FROM " + r.table + " t ORDER BY sort_order,id")
		if err != nil {
			fail(c, err)
			return
		}
		defer rows.Close()
		data := []map[string]any{}
		for rows.Next() {
			var raw []byte
			if err = rows.Scan(&raw); err != nil {
				fail(c, err)
				return
			}
			row, e := shape(raw)
			if e != nil {
				fail(c, e)
				return
			}
			data = append(data, row)
		}
		if err = rows.Err(); err != nil {
			fail(c, err)
			return
		}
		c.JSON(200, gin.H{"status": "success", "data": data})
	}
}
func save(r resource, create bool) gin.HandlerFunc {
	return func(c *gin.Context) {
		if !available(c) {
			return
		}
		var body map[string]any
		if c.ShouldBindJSON(&body) != nil {
			c.AbortWithStatusJSON(400, gin.H{"status": "error", "code": "INVALID_JSON"})
			return
		}
		for _, f := range r.required {
			v, ok := body[camel(f)]
			if !ok || v == nil || strings.TrimSpace(fmt.Sprint(v)) == "" {
				c.AbortWithStatusJSON(422, gin.H{"status": "error", "code": "REQUIRED_FIELD", "field": camel(f)})
				return
			}
		}
		cols := []string{}
		args := []any{}
		marks := []string{}
		sets := []string{}
		for _, f := range r.fields {
			v, ok := body[camel(f)]
			if !ok {
				continue
			}
			if f == "suitable_for_lo" || f == "suitable_for_en" {
				values, ok := v.([]any)
				if !ok {
					c.AbortWithStatusJSON(422, gin.H{"status": "error", "code": "INVALID_ARRAY"})
					return
				}
				ss := []string{}
				for _, x := range values {
					s, ok := x.(string)
					if !ok {
						c.AbortWithStatusJSON(422, gin.H{"status": "error", "code": "INVALID_ARRAY"})
						return
					}
					ss = append(ss, s)
				}
				v = pq.Array(ss)
			}
			cols = append(cols, f)
			args = append(args, v)
			mark := fmt.Sprintf("$%d", len(args))
			marks = append(marks, mark)
			sets = append(sets, f+"="+mark)
		}
		var query string
		if create {
			query = "INSERT INTO " + r.table + " (" + strings.Join(cols, ",") + ") VALUES (" + strings.Join(marks, ",") + ") RETURNING to_jsonb(" + r.table + ")"
		} else {
			args = append(args, c.Param("id"))
			query = "UPDATE " + r.table + " SET " + strings.Join(sets, ",") + ",updated_at=NOW() WHERE id=" + fmt.Sprintf("$%d", len(args)) + "::uuid RETURNING to_jsonb(" + r.table + ")"
		}
		tx, err := db.DB.BeginTx(c.Request.Context(), nil)
		if err != nil {
			fail(c, err)
			return
		}
		defer tx.Rollback()
		if r.table == "product_materials" {
			var key string
			err = tx.QueryRowContext(c.Request.Context(), `SELECT key FROM material_categories WHERE key=$1 AND is_active FOR SHARE`, body["category"]).Scan(&key)
			if err != nil {
				if err == sql.ErrNoRows {
					c.JSON(422, gin.H{"status": "error", "code": "INVALID_CATEGORY"})
					return
				}
				fail(c, err)
				return
			}
		}
		if r.table == "material_categories" && !create {
			var oldKey string
			err = tx.QueryRowContext(c.Request.Context(), `SELECT key FROM material_categories WHERE id=$1::uuid FOR UPDATE`, c.Param("id")).Scan(&oldKey)
			if err != nil {
				fail(c, err)
				return
			}
			if oldKey != body["key"] {
				var linked bool
				err = tx.QueryRowContext(c.Request.Context(), `SELECT EXISTS(SELECT 1 FROM product_materials WHERE category=$1)`, oldKey).Scan(&linked)
				if err != nil {
					fail(c, err)
					return
				}
				if linked {
					c.JSON(409, gin.H{"status": "error", "code": "CATEGORY_KEY_REFERENCED"})
					return
				}
			}
		}
		var raw []byte
		if err := tx.QueryRowContext(c.Request.Context(), query, args...).Scan(&raw); err != nil {
			fail(c, err)
			return
		}
		row, err := shape(raw)
		if err != nil {
			fail(c, err)
			return
		}
		if err = tx.Commit(); err != nil {
			fail(c, err)
			return
		}
		code := 200
		if create {
			code = http.StatusCreated
		}
		c.JSON(code, gin.H{"status": "success", "committed": true, "data": row})
	}
}
func deactivate(r resource) gin.HandlerFunc {
	return func(c *gin.Context) {
		if !available(c) {
			return
		}
		var raw []byte
		err := db.DB.QueryRow("UPDATE "+r.table+" SET is_active=false,updated_at=NOW() WHERE id=$1::uuid RETURNING to_jsonb("+r.table+")", c.Param("id")).Scan(&raw)
		if err != nil {
			fail(c, err)
			return
		}
		row, err := shape(raw)
		if err != nil {
			fail(c, err)
			return
		}
		c.JSON(200, gin.H{"status": "success", "committed": true, "data": row})
	}
}
func reorder(r resource) gin.HandlerFunc {
	return func(c *gin.Context) {
		if !available(c) {
			return
		}
		var input []struct {
			ID        string `json:"id"`
			SortOrder int    `json:"sortOrder"`
		}
		if c.ShouldBindJSON(&input) != nil || len(input) == 0 {
			c.AbortWithStatusJSON(422, gin.H{"status": "error", "code": "INVALID_REORDER"})
			return
		}
		seen := map[string]bool{}
		for index := range input {
			input[index].ID = strings.ToLower(input[index].ID)
			item := input[index]
			if !regexp.MustCompile(`^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$`).MatchString(item.ID) || seen[item.ID] {
				c.AbortWithStatusJSON(422, gin.H{"status": "error", "code": "DUPLICATE_ID"})
				return
			}
			seen[item.ID] = true
		}
		sort.Slice(input, func(i, j int) bool { return input[i].ID < input[j].ID })
		tx, err := db.DB.BeginTx(c.Request.Context(), nil)
		if err != nil {
			fail(c, err)
			return
		}
		defer tx.Rollback()
		data := []map[string]any{}
		for _, item := range input {
			var raw []byte
			if err = tx.QueryRow("UPDATE "+r.table+" SET sort_order=$1,updated_at=NOW() WHERE id=$2::uuid RETURNING to_jsonb("+r.table+")", item.SortOrder, item.ID).Scan(&raw); err != nil {
				fail(c, err)
				return
			}
			row, e := shape(raw)
			if e != nil {
				fail(c, e)
				return
			}
			data = append(data, row)
		}
		if err = tx.Commit(); err != nil {
			fail(c, err)
			return
		}
		c.JSON(200, gin.H{"status": "success", "committed": true, "data": data})
	}
}
func RegisterRoutes(router *gin.Engine) {
	read := auth.RequireAuth()
	write := auth.RequireRoles(auth.RoleAdmin, auth.RoleManager)
	for _, entry := range []struct {
		read, write string
		r           resource
	}{{"/api/v1/material-guide", "/api/v1/admin/material-guide", materials}, {"/api/v1/faqs", "/api/v1/admin/faqs", faqs}, {"/api/v1/admin/material-categories", "/api/v1/admin/material-categories", categories}} {
		router.GET(entry.read, read, list(entry.r))
		router.POST(entry.write, write, save(entry.r, true))
		router.PUT(entry.write+"/:id", write, save(entry.r, false))
		router.DELETE(entry.write+"/:id", write, deactivate(entry.r))
		router.PATCH(entry.write+"/reorder", write, reorder(entry.r))
	}
}
