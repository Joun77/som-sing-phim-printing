package handler

import (
	"database/sql"
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/lib/pq"
)

// ProductMaterial matches product_materials table schema
type ProductMaterial struct {
	ID                string   `json:"id"`
	Category          string   `json:"category"`
	CategoryNameLo    string   `json:"categoryNameLo"`
	CategoryNameEn    string   `json:"categoryNameEn"`
	NameLo            string   `json:"nameLo"`
	NameEn            string   `json:"nameEn"`
	GSM               int      `json:"gsm"`
	FinishLo          string   `json:"finishLo"`
	FinishEn          string   `json:"finishEn"`
	TextureClass      string   `json:"textureClass"`
	DescriptionLo     string   `json:"descriptionLo"`
	DescriptionEn     string   `json:"descriptionEn"`
	ProsLo            string   `json:"prosLo"`
	ProsEn            string   `json:"prosEn"`
	ConsLo            string   `json:"consLo"`
	ConsEn            string   `json:"consEn"`
	FinishingCompatLo string   `json:"finishingCompatLo"`
	FinishingCompatEn string   `json:"finishingCompatEn"`
	SuitableForLo     []string `json:"suitableForLo"`
	SuitableForEn     []string `json:"suitableForEn"`
	ProductLink       string   `json:"productLink"`
	ProductTitle      string   `json:"productTitle"`
	SortOrder         int      `json:"sortOrder"`
	IsActive          bool     `json:"isActive"`
	CreatedAt         string   `json:"createdAt"`
	UpdatedAt         string   `json:"updatedAt"`
}

// ProductFAQ matches product_faqs table schema
type ProductFAQ struct {
	ID         string `json:"id"`
	QuestionLo string `json:"questionLo"`
	QuestionEn string `json:"questionEn"`
	AnswerLo   string `json:"answerLo"`
	AnswerEn   string `json:"answerEn"`
	SortOrder  int    `json:"sortOrder"`
	IsActive   bool   `json:"isActive"`
}

// MaterialCategory matches material_categories table schema
type MaterialCategory struct {
	ID            string `json:"id"`
	Key           string `json:"key"`
	NameLo        string `json:"nameLo"`
	NameEn        string `json:"nameEn"`
	Icon          string `json:"icon"`
	DescriptionLo string `json:"descriptionLo"`
	DescriptionEn string `json:"descriptionEn"`
	SortOrder     int    `json:"sortOrder"`
	IsActive      bool   `json:"isActive"`
	CreatedAt     string `json:"createdAt"`
	UpdatedAt     string `json:"updatedAt"`
}

type MaterialHandler struct {
	db *sql.DB
}

func NewMaterialHandler(db *sql.DB) *MaterialHandler {
	return &MaterialHandler{db: db}
}

func (h *MaterialHandler) RegisterRoutes(r *gin.Engine) {
	apiV1 := r.Group("/api/v1")
	{
		// Public endpoints (Storefront reads)
		apiV1.GET("/materials", h.ListMaterials)
		apiV1.GET("/faqs", h.ListFAQs)
		apiV1.GET("/material-categories", h.ListCategories)

		// Admin endpoints (write operations)
		admin := apiV1.Group("/admin")
		{
			admin.POST("/materials", h.CreateMaterial)
			admin.PUT("/materials/:id", h.UpdateMaterial)
			admin.DELETE("/materials/:id", h.SoftDeleteMaterial)
			admin.PATCH("/materials/reorder", h.ReorderMaterials)

			admin.POST("/faqs", h.CreateFAQ)
			admin.PUT("/faqs/:id", h.UpdateFAQ)
			admin.DELETE("/faqs/:id", h.SoftDeleteFAQ)
			admin.PATCH("/faqs/reorder", h.ReorderFAQs)

			admin.GET("/material-categories", h.ListCategoriesAdmin)
			admin.POST("/material-categories", h.CreateCategory)
			admin.PUT("/material-categories/:id", h.UpdateCategory)
			admin.DELETE("/material-categories/:id", h.SoftDeleteCategory)
			admin.PATCH("/material-categories/reorder", h.ReorderCategories)
		}
	}
}

// ListMaterials returns all active materials ordered by sort_order
func (h *MaterialHandler) ListMaterials(c *gin.Context) {
	if h.db == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"status": "error", "message": "Database unavailable"})
		return
	}

	rows, err := h.db.QueryContext(c.Request.Context(), `
		SELECT id, category, category_name_lo, category_name_en,
		       name_lo, name_en, gsm, finish_lo, finish_en,
		       texture_class, description_lo, description_en,
		       pros_lo, pros_en, cons_lo, cons_en,
		       finishing_compat_lo, finishing_compat_en,
		       suitable_for_lo, suitable_for_en,
		       product_link, product_title, sort_order, is_active,
		       created_at, updated_at
		FROM product_materials
		WHERE is_active = true
		ORDER BY sort_order ASC, created_at ASC
	`)
	if err != nil {
		log.Printf("[MaterialHandler ERROR] ListMaterials query: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"status": "error", "message": "Failed to query materials"})
		return
	}
	defer rows.Close()

	var results []ProductMaterial
	for rows.Next() {
		var m ProductMaterial
		err := rows.Scan(
			&m.ID, &m.Category, &m.CategoryNameLo, &m.CategoryNameEn,
			&m.NameLo, &m.NameEn, &m.GSM, &m.FinishLo, &m.FinishEn,
			&m.TextureClass, &m.DescriptionLo, &m.DescriptionEn,
			&m.ProsLo, &m.ProsEn, &m.ConsLo, &m.ConsEn,
			&m.FinishingCompatLo, &m.FinishingCompatEn,
			pq.Array(&m.SuitableForLo), pq.Array(&m.SuitableForEn),
			&m.ProductLink, &m.ProductTitle, &m.SortOrder, &m.IsActive,
			&m.CreatedAt, &m.UpdatedAt,
		)
		if err != nil {
			log.Printf("[MaterialHandler ERROR] ListMaterials scan: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"status": "error", "message": "Failed to read materials"})
			return
		}
		results = append(results, m)
	}

	if results == nil {
		results = []ProductMaterial{}
	}
	c.JSON(http.StatusOK, gin.H{"status": "ok", "data": results})
}

// CreateMaterial — Admin adds a new material
func (h *MaterialHandler) CreateMaterial(c *gin.Context) {
	if h.db == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"status": "error", "message": "Database unavailable"})
		return
	}

	var input ProductMaterial
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"status": "error", "message": err.Error()})
		return
	}

	var id string
	err := h.db.QueryRowContext(c.Request.Context(), `
		INSERT INTO product_materials (
			category, category_name_lo, category_name_en,
			name_lo, name_en, gsm, finish_lo, finish_en,
			texture_class, description_lo, description_en,
			pros_lo, pros_en, cons_lo, cons_en,
			finishing_compat_lo, finishing_compat_en,
			suitable_for_lo, suitable_for_en,
			product_link, product_title, sort_order, is_active
		) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23)
		RETURNING id
	`,
		input.Category, input.CategoryNameLo, input.CategoryNameEn,
		input.NameLo, input.NameEn, input.GSM, input.FinishLo, input.FinishEn,
		input.TextureClass, input.DescriptionLo, input.DescriptionEn,
		input.ProsLo, input.ProsEn, input.ConsLo, input.ConsEn,
		input.FinishingCompatLo, input.FinishingCompatEn,
		pq.Array(input.SuitableForLo), pq.Array(input.SuitableForEn),
		input.ProductLink, input.ProductTitle, input.SortOrder, true,
	).Scan(&id)

	if err != nil {
		log.Printf("[MaterialHandler ERROR] CreateMaterial insert: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"status": "error", "message": "Failed to create material"})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"status": "ok", "id": id})
}

// UpdateMaterial — Admin edits an existing material
func (h *MaterialHandler) UpdateMaterial(c *gin.Context) {
	if h.db == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"status": "error", "message": "Database unavailable"})
		return
	}

	id := c.Param("id")
	var input ProductMaterial
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"status": "error", "message": err.Error()})
		return
	}

	_, err := h.db.ExecContext(c.Request.Context(), `
		UPDATE product_materials SET
			category=$1, category_name_lo=$2, category_name_en=$3,
			name_lo=$4, name_en=$5, gsm=$6, finish_lo=$7, finish_en=$8,
			texture_class=$9, description_lo=$10, description_en=$11,
			pros_lo=$12, pros_en=$13, cons_lo=$14, cons_en=$15,
			finishing_compat_lo=$16, finishing_compat_en=$17,
			suitable_for_lo=$18, suitable_for_en=$19,
			product_link=$20, product_title=$21, sort_order=$22, is_active=$23
		WHERE id=$24
	`,
		input.Category, input.CategoryNameLo, input.CategoryNameEn,
		input.NameLo, input.NameEn, input.GSM, input.FinishLo, input.FinishEn,
		input.TextureClass, input.DescriptionLo, input.DescriptionEn,
		input.ProsLo, input.ProsEn, input.ConsLo, input.ConsEn,
		input.FinishingCompatLo, input.FinishingCompatEn,
		pq.Array(input.SuitableForLo), pq.Array(input.SuitableForEn),
		input.ProductLink, input.ProductTitle, input.SortOrder, input.IsActive,
		id,
	)
	if err != nil {
		log.Printf("[MaterialHandler ERROR] UpdateMaterial update: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"status": "error", "message": "Failed to update material"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"status": "ok"})
}

// SoftDeleteMaterial — sets is_active = false (no hard delete)
func (h *MaterialHandler) SoftDeleteMaterial(c *gin.Context) {
	if h.db == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"status": "error", "message": "Database unavailable"})
		return
	}

	id := c.Param("id")
	_, err := h.db.ExecContext(c.Request.Context(), `UPDATE product_materials SET is_active = false WHERE id = $1`, id)
	if err != nil {
		log.Printf("[MaterialHandler ERROR] SoftDeleteMaterial: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"status": "error", "message": "Failed to delete material"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"status": "ok"})
}

// ReorderMaterials — batch update sort_order for drag-and-drop
func (h *MaterialHandler) ReorderMaterials(c *gin.Context) {
	if h.db == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"status": "error", "message": "Database unavailable"})
		return
	}

	var input []struct {
		ID        string `json:"id"`
		SortOrder int    `json:"sortOrder"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"status": "error", "message": err.Error()})
		return
	}

	tx, err := h.db.BeginTx(c.Request.Context(), nil)
	if err != nil {
		log.Printf("[MaterialHandler ERROR] ReorderMaterials BeginTx: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"status": "error", "message": "Failed to start transaction"})
		return
	}
	for _, item := range input {
		if _, err := tx.ExecContext(c.Request.Context(), `UPDATE product_materials SET sort_order=$1 WHERE id=$2`, item.SortOrder, item.ID); err != nil {
			_ = tx.Rollback()
			log.Printf("[MaterialHandler ERROR] ReorderMaterials ExecContext: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"status": "error", "message": "Failed to update material order"})
			return
		}
	}
	if err := tx.Commit(); err != nil {
		log.Printf("[MaterialHandler ERROR] ReorderMaterials Commit: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"status": "error", "message": "Failed to commit material reorder"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"status": "ok"})
}

// --- FAQ handlers ---

func (h *MaterialHandler) ListFAQs(c *gin.Context) {
	if h.db == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"status": "error", "message": "Database unavailable"})
		return
	}
	rows, err := h.db.QueryContext(c.Request.Context(), `
		SELECT id, question_lo, question_en, answer_lo, answer_en, sort_order, is_active
		FROM product_faqs WHERE is_active = true ORDER BY sort_order ASC
	`)
	if err != nil {
		log.Printf("[MaterialHandler ERROR] ListFAQs query: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"status": "error", "message": "Failed to query faqs"})
		return
	}
	defer rows.Close()

	var results []ProductFAQ
	for rows.Next() {
		var f ProductFAQ
		if err := rows.Scan(&f.ID, &f.QuestionLo, &f.QuestionEn, &f.AnswerLo, &f.AnswerEn, &f.SortOrder, &f.IsActive); err != nil {
			log.Printf("[MaterialHandler ERROR] ListFAQs scan: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"status": "error", "message": "Failed to read faqs"})
			return
		}
		results = append(results, f)
	}
	if results == nil {
		results = []ProductFAQ{}
	}
	c.JSON(http.StatusOK, gin.H{"status": "ok", "data": results})
}

func (h *MaterialHandler) CreateFAQ(c *gin.Context) {
	if h.db == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"status": "error", "message": "Database unavailable"})
		return
	}

	var input ProductFAQ
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"status": "error", "message": err.Error()})
		return
	}
	var id string
	err := h.db.QueryRowContext(c.Request.Context(), `
		INSERT INTO product_faqs (question_lo, question_en, answer_lo, answer_en, sort_order)
		VALUES ($1,$2,$3,$4,$5) RETURNING id
	`, input.QuestionLo, input.QuestionEn, input.AnswerLo, input.AnswerEn, input.SortOrder).Scan(&id)
	if err != nil {
		log.Printf("[MaterialHandler ERROR] CreateFAQ insert: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"status": "error", "message": "Failed to create faq"})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"status": "ok", "id": id})
}

func (h *MaterialHandler) UpdateFAQ(c *gin.Context) {
	if h.db == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"status": "error", "message": "Database unavailable"})
		return
	}

	id := c.Param("id")
	var input ProductFAQ
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"status": "error", "message": err.Error()})
		return
	}
	_, err := h.db.ExecContext(c.Request.Context(), `
		UPDATE product_faqs SET question_lo=$1, question_en=$2, answer_lo=$3, answer_en=$4, sort_order=$5, is_active=$6
		WHERE id=$7
	`, input.QuestionLo, input.QuestionEn, input.AnswerLo, input.AnswerEn, input.SortOrder, input.IsActive, id)
	if err != nil {
		log.Printf("[MaterialHandler ERROR] UpdateFAQ update: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"status": "error", "message": "Failed to update faq"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"status": "ok"})
}

func (h *MaterialHandler) SoftDeleteFAQ(c *gin.Context) {
	if h.db == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"status": "error", "message": "Database unavailable"})
		return
	}

	id := c.Param("id")
	_, err := h.db.ExecContext(c.Request.Context(), `UPDATE product_faqs SET is_active = false WHERE id = $1`, id)
	if err != nil {
		log.Printf("[MaterialHandler ERROR] SoftDeleteFAQ: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"status": "error", "message": "Failed to delete faq"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"status": "ok"})
}

func (h *MaterialHandler) ReorderFAQs(c *gin.Context) {
	if h.db == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"status": "error", "message": "Database unavailable"})
		return
	}

	var input []struct {
		ID        string `json:"id"`
		SortOrder int    `json:"sortOrder"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"status": "error", "message": err.Error()})
		return
	}
	tx, err := h.db.BeginTx(c.Request.Context(), nil)
	if err != nil {
		log.Printf("[MaterialHandler ERROR] ReorderFAQs BeginTx: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"status": "error", "message": "Failed to start transaction"})
		return
	}
	for _, item := range input {
		if _, err := tx.ExecContext(c.Request.Context(), `UPDATE product_faqs SET sort_order=$1 WHERE id=$2`, item.SortOrder, item.ID); err != nil {
			_ = tx.Rollback()
			log.Printf("[MaterialHandler ERROR] ReorderFAQs ExecContext: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"status": "error", "message": "Failed to update faq order"})
			return
		}
	}
	if err := tx.Commit(); err != nil {
		log.Printf("[MaterialHandler ERROR] ReorderFAQs Commit: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"status": "error", "message": "Failed to commit faq reorder"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"status": "ok"})
}

// --- Material Categories Handlers ---

// ListCategories returns active material categories ordered by sort_order
func (h *MaterialHandler) ListCategories(c *gin.Context) {
	if h.db == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"status": "error", "message": "Database unavailable"})
		return
	}

	rows, err := h.db.QueryContext(c.Request.Context(), `
		SELECT id, key, name_lo, name_en, icon,
		       COALESCE(description_lo, ''), COALESCE(description_en, ''),
		       sort_order, is_active, created_at, updated_at
		FROM material_categories
		WHERE is_active = true
		ORDER BY sort_order ASC, created_at ASC
	`)
	if err != nil {
		log.Printf("[MaterialHandler ERROR] ListCategories: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"status": "error", "message": "Failed to query categories"})
		return
	}
	defer rows.Close()

	var results []MaterialCategory
	for rows.Next() {
		var cat MaterialCategory
		if err := rows.Scan(
			&cat.ID, &cat.Key, &cat.NameLo, &cat.NameEn, &cat.Icon,
			&cat.DescriptionLo, &cat.DescriptionEn,
			&cat.SortOrder, &cat.IsActive, &cat.CreatedAt, &cat.UpdatedAt,
		); err != nil {
			log.Printf("[MaterialHandler ERROR] ListCategories scan: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"status": "error", "message": "Failed to read categories"})
			return
		}
		results = append(results, cat)
	}

	if results == nil {
		results = []MaterialCategory{}
	}
	c.JSON(http.StatusOK, gin.H{"status": "ok", "data": results})
}

// ListCategoriesAdmin returns all categories (including inactive) for management
func (h *MaterialHandler) ListCategoriesAdmin(c *gin.Context) {
	if h.db == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"status": "error", "message": "Database unavailable"})
		return
	}

	rows, err := h.db.QueryContext(c.Request.Context(), `
		SELECT id, key, name_lo, name_en, icon,
		       COALESCE(description_lo, ''), COALESCE(description_en, ''),
		       sort_order, is_active, created_at, updated_at
		FROM material_categories
		ORDER BY sort_order ASC, created_at ASC
	`)
	if err != nil {
		log.Printf("[MaterialHandler ERROR] ListCategoriesAdmin: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"status": "error", "message": "Failed to query categories"})
		return
	}
	defer rows.Close()

	var results []MaterialCategory
	for rows.Next() {
		var cat MaterialCategory
		if err := rows.Scan(
			&cat.ID, &cat.Key, &cat.NameLo, &cat.NameEn, &cat.Icon,
			&cat.DescriptionLo, &cat.DescriptionEn,
			&cat.SortOrder, &cat.IsActive, &cat.CreatedAt, &cat.UpdatedAt,
		); err != nil {
			log.Printf("[MaterialHandler ERROR] ListCategoriesAdmin scan: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"status": "error", "message": "Failed to read categories"})
			return
		}
		results = append(results, cat)
	}

	if results == nil {
		results = []MaterialCategory{}
	}
	c.JSON(http.StatusOK, gin.H{"status": "ok", "data": results})
}

// CreateCategory adds a new material category
func (h *MaterialHandler) CreateCategory(c *gin.Context) {
	if h.db == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"status": "error", "message": "Database unavailable"})
		return
	}

	var input MaterialCategory
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"status": "error", "message": err.Error()})
		return
	}

	if input.Icon == "" {
		input.Icon = "layers"
	}

	var id string
	err := h.db.QueryRowContext(c.Request.Context(), `
		INSERT INTO material_categories (key, name_lo, name_en, icon, description_lo, description_en, sort_order, is_active)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		RETURNING id
	`, input.Key, input.NameLo, input.NameEn, input.Icon, input.DescriptionLo, input.DescriptionEn, input.SortOrder, true).Scan(&id)

	if err != nil {
		log.Printf("[MaterialHandler ERROR] CreateCategory: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"status": "error", "message": "Failed to create category"})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"status": "ok", "id": id})
}

// UpdateCategory updates an existing category
func (h *MaterialHandler) UpdateCategory(c *gin.Context) {
	if h.db == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"status": "error", "message": "Database unavailable"})
		return
	}

	id := c.Param("id")
	var input MaterialCategory
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"status": "error", "message": err.Error()})
		return
	}

	_, err := h.db.ExecContext(c.Request.Context(), `
		UPDATE material_categories SET
			key=$1, name_lo=$2, name_en=$3, icon=$4,
			description_lo=$5, description_en=$6,
			sort_order=$7, is_active=$8
		WHERE id=$9
	`, input.Key, input.NameLo, input.NameEn, input.Icon, input.DescriptionLo, input.DescriptionEn, input.SortOrder, input.IsActive, id)

	if err != nil {
		log.Printf("[MaterialHandler ERROR] UpdateCategory: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"status": "error", "message": "Failed to update category"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"status": "ok"})
}

// SoftDeleteCategory sets is_active = false
func (h *MaterialHandler) SoftDeleteCategory(c *gin.Context) {
	if h.db == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"status": "error", "message": "Database unavailable"})
		return
	}

	id := c.Param("id")
	_, err := h.db.ExecContext(c.Request.Context(), `UPDATE material_categories SET is_active = false WHERE id = $1`, id)
	if err != nil {
		log.Printf("[MaterialHandler ERROR] SoftDeleteCategory: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"status": "error", "message": "Failed to delete category"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"status": "ok"})
}

// ReorderCategories batch updates sort_order for categories
func (h *MaterialHandler) ReorderCategories(c *gin.Context) {
	if h.db == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"status": "error", "message": "Database unavailable"})
		return
	}

	var input []struct {
		ID        string `json:"id"`
		SortOrder int    `json:"sortOrder"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"status": "error", "message": err.Error()})
		return
	}

	tx, err := h.db.BeginTx(c.Request.Context(), nil)
	if err != nil {
		log.Printf("[MaterialHandler ERROR] ReorderCategories BeginTx: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"status": "error", "message": "Failed to start transaction"})
		return
	}
	for _, item := range input {
		if _, err := tx.ExecContext(c.Request.Context(), `UPDATE material_categories SET sort_order=$1 WHERE id=$2`, item.SortOrder, item.ID); err != nil {
			_ = tx.Rollback()
			log.Printf("[MaterialHandler ERROR] ReorderCategories ExecContext: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"status": "error", "message": "Failed to update category order"})
			return
		}
	}
	if err := tx.Commit(); err != nil {
		log.Printf("[MaterialHandler ERROR] ReorderCategories Commit: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"status": "error", "message": "Failed to commit category reorder"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"status": "ok"})
}
