package catalog

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"sync"
	"time"

	"somsing.local/backend/db"

	"github.com/gin-gonic/gin"
	"github.com/lib/pq"
)

var (
	memCategories = make(map[int]PublicCategory)
	memProducts   = make(map[int]PublicProduct)
	memOptions    = make(map[int][]PublicProductOption)
	memTiers      = make(map[int][]ProductDiscountTier)
	memNextCatID  = 10
	memNextProdID = 100
	catalogMutex  sync.RWMutex
)

func init() {
	// Initialize default memory fallback categories
	cats := []PublicCategory{
		{
			ID: 1, Slug: "documents", NameLo: "ງານເອກະສານ & ປຶ້ມ", NameEn: "Documents & Books",
			TaglineLo: "ກັອບປີ້ເອກະສານທົ່ວໄປ, ເຂົ້າເລັ້ມສັນກາວ, ສັນຫ່ວງ, ປຶ້ມ & ລາຍງານ",
			TaglineEn: "Document copying, glue binding, wire-o, books & corporate reports",
			DescriptionLo: "ບໍລິການກັອບປີ້ເອກະສານຂາວດຳ-ສີ, ເຂົ້າເລັ້ມປຶ້ມສັນກາວຮ້ອນ, ສັນຫ່ວງກະດູກງູ, ລາຍງານປະຈຳປີ ແລະ ເອກະສານສຳມະນາຄຸນນະພາບສູງ.",
			DescriptionEn: "High-speed document printing and copying, perfect glue binding, wire-o booklets, catalogs, and training manuals.",
			Icon: "book", SortOrder: 1, IsActive: true, CreatedAt: time.Now(), UpdatedAt: time.Now(),
		},
		{
			ID: 2, Slug: "photos", NameLo: "ງານພິມຮູບພາບພຣີມ້ຽມ", NameEn: "Premium Photo Prints",
			TaglineLo: "ພິມຮູບພາບຄຸນນະພາບສູງ, ໂຟໂຕ້ບຸກ, ອັນບັ້ມຮູບ & ກອບອາຄຣີລິກ",
			TaglineEn: "High-definition photo prints, photobooks, albums & acrylic frames",
			DescriptionLo: "ງານພິມຮູບພາບຄວາມລະອຽດສູງລະດັບແກເລີຣີ, ອັນບັ້ມຮູບປົກແຂງ Layflat 180°, ມິນິໂຟໂຕ້ບຸກ ແລະ ກອບຮູບອາຄຣີລິກຕັ້ງໂຕະຄົມຊັດສີສັນສົດໃສ.",
			DescriptionEn: "Gallery-grade photo printing, luxury hardcover photobooks, compact mini albums, and crystal clear acrylic photo blocks.",
			Icon: "photo", SortOrder: 2, IsActive: true, CreatedAt: time.Now(), UpdatedAt: time.Now(),
		},
		{
			ID: 3, Slug: "stickers", NameLo: "ສະຕິກເກີ & ສະຫຼາກສິນຄ້າ", NameEn: "Stickers & Labels",
			TaglineLo: "ສະຕິກເກີກັນນ້ຳ PP, ໄດຄັດ 50%/100%, ສະຕິກເກີໂຮໂລແກຣມ & ຄຣາຟ",
			TaglineEn: "Waterproof PP stickers, kiss-cut, die-cut, holographic & kraft labels",
			DescriptionLo: "ສະຕິກເກີໄດຄັດພ້ອມແປະ PP ຂາວເງົາ, ຂາວດ້ານ, ເນື້ອໃສກັນນ້ຳ 100% ແຊ່ເຢັນໄດ້, ສະຕິກເກີຟອຍທອງ, ໂຮໂລແກຣມ ແລະ ສະຕິກເກີບາໂຄ້ດສຳລັບຕິດຜະລິດຕະພັນ.",
			DescriptionEn: "Die-cut waterproof PP stickers, glossy, matte, clear, gold foil, holographic security labels, and commercial roll stickers.",
			Icon: "sticker", SortOrder: 3, IsActive: true, CreatedAt: time.Now(), UpdatedAt: time.Now(),
		},
		{
			ID: 4, Slug: "business_cards", NameLo: "ນາມບັດ & ບັດສະມາຊິກ", NameEn: "Business Cards & Tags",
			TaglineLo: "ນາມບັດພຣີມ້ຽມ 350 ແກຣມ, ເຄືອບດ້ານ Soft-touch, ປ້ຳທອງ & ມຸມມົນ",
			TaglineEn: "Premium 350gsm business cards, soft-touch matte, foil stamping & rounded corners",
			DescriptionLo: "ນາມບັດຄົມຊັດລະດັບໂຮງພິມ, ກະດາດອາດກາດ 350gsm, ບັດສະມາຊິກ PVC, ປ້າຍຫ້ອຍສິນຄ້າ (Hang Tags) ແລະ ບັດຂອບຄຸນ.",
			DescriptionEn: "Professional business cards, thick 350gsm art cards, PVC member cards, garment hang tags, and thank-you cards.",
			Icon: "card", SortOrder: 4, IsActive: true, CreatedAt: time.Now(), UpdatedAt: time.Now(),
		},
		{
			ID: 5, Slug: "marketing", NameLo: "ແຜ່ນພັບ & ໂບຣຊົວ", NameEn: "Brochures & Flyers",
			TaglineLo: "ໃບປິວໂຄສະນາ, ແຜ່ນພັບ 2 ພັບ 3 ຕອນ, ໂປສເຕີ A3/A4 ຄົມຊັດສີສົດ",
			TaglineEn: "Marketing flyers, tri-fold brochures, company profiles, high-res posters",
			DescriptionLo: "ໃບປິວ ແລະ ແຜ່ນພັບປະຊາສຳພັນ, ກະດາດອາດມັນ 130-160gsm ພັບສຳເລັດຮູບ, ໂປສເຕີຂະໜາດ A3/A2 ສຳລັບງານອີເວັ້ນ.",
			DescriptionEn: "Promotional leaflets, folded brochures, menus, and vibrant exhibition posters.",
			Icon: "flyer", SortOrder: 5, IsActive: true, CreatedAt: time.Now(), UpdatedAt: time.Now(),
		},
		{
			ID: 6, Slug: "packaging", NameLo: "ກ່ອງບັນຈຸພັນ & ຖົງເຈ້ຍ", NameEn: "Packaging & Paper Bags",
			TaglineLo: "ກ່ອງເຄືອບຟິມ, ກ່ອງເຄື່ອງສຳອາງ, ຖົງເຈ້ຍພຣີມ້ຽມພ້ອມຫູຫິ້ວ",
			TaglineEn: "Custom packaging boxes, cosmetic boxes, branded kraft & art paper bags",
			DescriptionLo: "ກ່ອງບັນຈຸພັນສິນຄ້າ, ກ່ອງລັອກກົ້ນ, ຖົງເຈ້ຍພຣີມ້ຽມພິມໂລໂກ້ ສຳລັບຮ້ານຄ້າ ແລະ ແບຣນສິນຄ້າ.",
			DescriptionEn: "Custom packaging boxes, cosmetic folding cartons, and luxury shopping bags.",
			Icon: "box", SortOrder: 6, IsActive: true, CreatedAt: time.Now(), UpdatedAt: time.Now(),
		},
		{
			ID: 7, Slug: "general", NameLo: "ງານພິມທົ່ວໄປ & ບໍລິການອື່ນໆ", NameEn: "General Print Services",
			TaglineLo: "ສາຍຄໍບັດ, ປ້າຍຊື່, ປະຕິທິນຕັ້ງໂຕະ, ປື້ມເຊັກ & ໃບຮັບເງິນ",
			TaglineEn: "Lanyards, name badges, desktop calendars, receipt books & general printings",
			DescriptionLo: "ບໍລິການງານພິມຫຼາກຫຼາຍຊະນິດ ສາຍຄ້ອງຄໍ, ປ້າຍຊື່ພະນັກງານ, ປະຕິທິນຕັ້ງໂຕະ, ໃບສັ່ງຊື້/ໃບຮັບເງິນ Carbonless ພ້ອມເລກ Run Number.",
			DescriptionEn: "Custom printed lanyards, staff ID badges, custom calendars, and carbonless invoice receipt booklets.",
			Icon: "doc", SortOrder: 7, IsActive: true, CreatedAt: time.Now(), UpdatedAt: time.Now(),
		},
	}
	for _, c := range cats {
		memCategories[c.ID] = c
	}

	// Initialize default memory fallback products
	p1 := PublicProduct{
		ID:           1,
		Name:         "ສຕິກເກີ PP ກັນນ້ຳ (Waterproof PP Sticker)",
		NameLo:       "ສະຕິກເກີ PP ກັນນ້ຳ",
		NameEn:       "Waterproof PP Sticker",
		Slug:         "waterproof-pp-sticker",
		Category:     "stickers",
		CategorySlug: "stickers",
		Description:  "ສະຕິກເກີເນື້ອພລາສຕິກ PP ຈີກບໍ່ຂາດ ກັນນ້ຳ 100% ເໝາະສຳລັບຕິດຂວດນ້ຳ ແກ້ວກາເຟ ແລະ ຖົງຂະໜົມ",
		PricingModel: "STANDARD_FLAT",
		BasePrice:    15000,
		Unit:         "ແຜ່ນ A3+",
		Bestseller:   true,
		Features:     []string{"ກັນນ້ຳ 100%", "ແຊ່ເຢັນ/ແຊ່ຟຣີຊໄດ້", "ໄດຄັດຄົມຊັດ ພ້ອມລອກແປະ", "ໝຶກແທ້ຄົມຊັດລະດັບພຣີມ້ຽມ"},
		ThumbnailURL: "/images/products/sticker-pp.jpg",
		MinQuantity:  1,
		IsOnDemand:   true,
		LeadTimeDays: 1,
		IsActive:     true,
		SortOrder:    1,
		CreatedAt:    time.Now(),
		UpdatedAt:    time.Now(),
	}
	memProducts[1] = p1
	memOptions[1] = []PublicProductOption{
		{ID: 1, ProductID: 1, OptionType: "material", Label: "PP ขาวเงา (Glossy White PP)", LabelLo: "PP ຂາວເງົາ", LabelEn: "Glossy White PP", Value: "pp_glossy_white", MaterialSKU: "MAT-PP-GLOSS", AddPrice: 0.0, IsDefault: true, ExtraCostRate: 0.0},
		{ID: 2, ProductID: 1, OptionType: "material", Label: "PP ขาวด้าน (Matte White PP)", LabelLo: "PP ຂາວດ້ານ", LabelEn: "Matte White PP", Value: "pp_matte_white", MaterialSKU: "MAT-PP-MATTE", AddPrice: 2000.0, IsDefault: false, ExtraCostRate: 0.05},
		{ID: 3, ProductID: 1, OptionType: "cutting", Label: "ไดคัท 50% กึ่งสำเร็จ (Kiss Cut)", LabelLo: "ໄດຄັດ 50% ເຄິ່ງສຳເລັດ", LabelEn: "Kiss Cut Sheet", Value: "kiss_cut", IsDefault: true, ExtraCostRate: 0.0},
	}
	memTiers[1] = []ProductDiscountTier{
		{ID: 1, ProductID: 1, MinQuantity: 10, DiscountPercentage: 5.0},
		{ID: 2, ProductID: 1, MinQuantity: 50, DiscountPercentage: 10.0},
	}
}

// -------------------------------------------------------------
// Category Handlers
// -------------------------------------------------------------

// HandleGetCategories returns list of categories (Admin & Public)
func HandleGetCategories(c *gin.Context) {
	onlyActive := c.Query("active") == "true"
	if db.DB != nil {
		categories, err := getCategoriesFromDB(onlyActive)
		if err == nil {
			c.JSON(http.StatusOK, gin.H{"status": "success", "data": categories})
			return
		}
		log.Printf("[CATALOG DB ERROR] Failed to fetch categories: %v", err)
	}

	catalogMutex.RLock()
	defer catalogMutex.RUnlock()

	var result []PublicCategory
	for _, cat := range memCategories {
		if !onlyActive || cat.IsActive {
			result = append(result, cat)
		}
	}
	c.JSON(http.StatusOK, gin.H{"status": "success", "data": result})
}

// HandleAdminCreateCategory creates a new category
func HandleAdminCreateCategory(c *gin.Context) {
	var req CreateCategoryRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"status": "error", "message": err.Error()})
		return
	}

	slug := req.Slug
	if slug == "" {
		slug = GenerateSlug(req.NameEn)
		if slug == "" {
			slug = GenerateSlug(req.NameLo)
		}
	}

	if db.DB != nil {
		var newID int
		query := `
			INSERT INTO public_categories (slug, name_lo, name_en, tagline_lo, tagline_en, description_lo, description_en, icon, sort_order, is_active)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
			RETURNING id
		`
		err := db.DB.QueryRow(query, slug, req.NameLo, req.NameEn, req.TaglineLo, req.TaglineEn, req.DescriptionLo, req.DescriptionEn, req.Icon, req.SortOrder, req.IsActive).Scan(&newID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"status": "error", "message": fmt.Sprintf("Failed to create category: %v", err)})
			return
		}
		c.JSON(http.StatusCreated, gin.H{"status": "success", "data": gin.H{"id": newID, "slug": slug}})
		return
	}

	catalogMutex.Lock()
	defer catalogMutex.Unlock()
	newCat := PublicCategory{
		ID: memNextCatID, Slug: slug, NameLo: req.NameLo, NameEn: req.NameEn,
		TaglineLo: req.TaglineLo, TaglineEn: req.TaglineEn, DescriptionLo: req.DescriptionLo, DescriptionEn: req.DescriptionEn,
		Icon: req.Icon, SortOrder: req.SortOrder, IsActive: req.IsActive, CreatedAt: time.Now(), UpdatedAt: time.Now(),
	}
	memCategories[memNextCatID] = newCat
	memNextCatID++
	c.JSON(http.StatusCreated, gin.H{"status": "success", "data": newCat})
}

// HandleAdminUpdateCategory updates an existing category
func HandleAdminUpdateCategory(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"status": "error", "message": "Invalid category ID"})
		return
	}

	var req UpdateCategoryRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"status": "error", "message": err.Error()})
		return
	}

	if db.DB != nil {
		query := `
			UPDATE public_categories
			SET name_lo = COALESCE(NULLIF($1, ''), name_lo),
			    name_en = COALESCE(NULLIF($2, ''), name_en),
			    tagline_lo = $3,
			    tagline_en = $4,
			    description_lo = $5,
			    description_en = $6,
			    icon = COALESCE(NULLIF($7, ''), icon),
			    sort_order = $8,
			    is_active = $9,
			    updated_at = CURRENT_TIMESTAMP
			WHERE id = $10
		`
		_, err := db.DB.Exec(query, req.NameLo, req.NameEn, req.TaglineLo, req.TaglineEn, req.DescriptionLo, req.DescriptionEn, req.Icon, req.SortOrder, req.IsActive, id)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"status": "error", "message": fmt.Sprintf("Failed to update category: %v", err)})
			return
		}
		c.JSON(http.StatusOK, gin.H{"status": "success", "message": "Category updated successfully"})
		return
	}

	catalogMutex.Lock()
	defer catalogMutex.Unlock()
	cat, exists := memCategories[id]
	if !exists {
		c.JSON(http.StatusNotFound, gin.H{"status": "error", "message": "Category not found"})
		return
	}
	if req.NameLo != "" {
		cat.NameLo = req.NameLo
	}
	if req.NameEn != "" {
		cat.NameEn = req.NameEn
	}
	cat.TaglineLo = req.TaglineLo
	cat.TaglineEn = req.TaglineEn
	cat.DescriptionLo = req.DescriptionLo
	cat.DescriptionEn = req.DescriptionEn
	if req.Icon != "" {
		cat.Icon = req.Icon
	}
	cat.SortOrder = req.SortOrder
	cat.IsActive = req.IsActive
	cat.UpdatedAt = time.Now()
	memCategories[id] = cat

	c.JSON(http.StatusOK, gin.H{"status": "success", "data": cat})
}

// HandleAdminDeleteCategory deletes a category
func HandleAdminDeleteCategory(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"status": "error", "message": "Invalid category ID"})
		return
	}

	if db.DB != nil {
		tx, err := db.DB.Begin()
		if err == nil {
			defer tx.Rollback()

			// Unlink products referencing this category
			if _, err := tx.Exec(`UPDATE public_products SET category_id = NULL WHERE category_id = $1`, id); err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"status": "error", "message": fmt.Sprintf("Failed to unlink products: %v", err)})
				return
			}

			if _, err := tx.Exec(`DELETE FROM public_categories WHERE id = $1`, id); err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"status": "error", "message": fmt.Sprintf("Failed to delete category: %v", err)})
				return
			}

			if err := tx.Commit(); err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"status": "error", "message": fmt.Sprintf("Failed to commit deletion: %v", err)})
				return
			}

			c.JSON(http.StatusOK, gin.H{"status": "success", "message": "Category deleted successfully"})
			return
		}
		log.Printf("[CATALOG DB WARNING] Delete category DB transaction error: %v (Falling back to memory)", err)
	}

	catalogMutex.Lock()
	defer catalogMutex.Unlock()
	delete(memCategories, id)
	c.JSON(http.StatusOK, gin.H{"status": "success", "message": "Category deleted from memory"})
}

// HandleAdminReorderCategories updates sort orders for categories
func HandleAdminReorderCategories(c *gin.Context) {
	var req ReorderCategoriesRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"status": "error", "message": err.Error()})
		return
	}

	if db.DB != nil {
		tx, err := db.DB.Begin()
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"status": "error", "message": "Database transaction error"})
			return
		}
		defer tx.Rollback()

		stmt, err := tx.Prepare(`UPDATE public_categories SET sort_order = $1 WHERE id = $2`)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"status": "error", "message": err.Error()})
			return
		}
		defer stmt.Close()

		for _, item := range req.Orders {
			if _, err := stmt.Exec(item.SortOrder, item.ID); err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"status": "error", "message": err.Error()})
				return
			}
		}
		if err := tx.Commit(); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"status": "error", "message": "Failed to commit reorder"})
			return
		}
		c.JSON(http.StatusOK, gin.H{"status": "success", "message": "Categories reordered successfully"})
		return
	}

	catalogMutex.Lock()
	defer catalogMutex.Unlock()
	for _, item := range req.Orders {
		if cat, exists := memCategories[item.ID]; exists {
			cat.SortOrder = item.SortOrder
			memCategories[item.ID] = cat
		}
	}
	c.JSON(http.StatusOK, gin.H{"status": "success", "message": "Categories reordered in memory"})
}

func getCategoriesFromDB(onlyActive bool) ([]PublicCategory, error) {
	query := `
		SELECT id, slug, name_lo, name_en, tagline_lo, tagline_en, description_lo, description_en, icon, sort_order, is_active, created_at, updated_at
		FROM public_categories
	`
	if onlyActive {
		query += ` WHERE is_active = true`
	}
	query += ` ORDER BY sort_order ASC, id ASC`

	rows, err := db.DB.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []PublicCategory
	for rows.Next() {
		var cat PublicCategory
		var tagLo, tagEn, descLo, descEn sql.NullString
		if err := rows.Scan(&cat.ID, &cat.Slug, &cat.NameLo, &cat.NameEn, &tagLo, &tagEn, &descLo, &descEn, &cat.Icon, &cat.SortOrder, &cat.IsActive, &cat.CreatedAt, &cat.UpdatedAt); err != nil {
			return nil, err
		}
		cat.TaglineLo = tagLo.String
		cat.TaglineEn = tagEn.String
		cat.DescriptionLo = descLo.String
		cat.DescriptionEn = descEn.String
		list = append(list, cat)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return list, nil
}

// -------------------------------------------------------------
// Product Handlers
// -------------------------------------------------------------

// HandleAdminGetProducts returns all products for admin
func HandleAdminGetProducts(c *gin.Context) {
	if db.DB != nil {
		products, err := getAdminProductsFromDB()
		if err == nil {
			c.JSON(http.StatusOK, gin.H{"status": "success", "data": products})
			return
		}
		log.Printf("[CATALOG DB ERROR] Failed to fetch admin products: %v", err)
	}

	catalogMutex.RLock()
	defer catalogMutex.RUnlock()

	var result []PublicProduct
	for _, p := range memProducts {
		if !p.IsArchived && p.DeletedAt == nil {
			p.Options = memOptions[p.ID]
			p.DiscountTiers = memTiers[p.ID]
			result = append(result, p)
		}
	}
	c.JSON(http.StatusOK, gin.H{"status": "success", "data": result})
}

// HandlePublicGetProducts returns active products for public shop
func HandlePublicGetProducts(c *gin.Context) {
	c.Header("Cache-Control", "no-cache, no-store, must-revalidate")
	c.Header("Pragma", "no-cache")
	c.Header("Expires", "0")
	category := c.Query("category")
	if db.DB != nil {
		products, err := getPublicProductsFromDB(category)
		if err == nil {
			c.JSON(http.StatusOK, gin.H{"status": "success", "data": products})
			return
		}
		log.Printf("[CATALOG DB ERROR] Failed to fetch public products: %v", err)
	}

	catalogMutex.RLock()
	defer catalogMutex.RUnlock()

	var result []PublicProduct
	for _, p := range memProducts {
		if p.IsActive && !p.IsArchived && p.DeletedAt == nil {
			if category == "" || p.Category == category || p.CategorySlug == category {
				p.Options = memOptions[p.ID]
				p.DiscountTiers = memTiers[p.ID]
				result = append(result, p)
			}
		}
	}
	c.JSON(http.StatusOK, gin.H{"status": "success", "data": result})
}

// HandlePublicGetProductBySlug returns a single product by slug
func HandlePublicGetProductBySlug(c *gin.Context) {
	c.Header("Cache-Control", "no-cache, no-store, must-revalidate")
	c.Header("Pragma", "no-cache")
	c.Header("Expires", "0")
	slug := c.Param("slug")
	if db.DB != nil {
		product, err := getProductBySlugFromDB(slug)
		if err == nil && product != nil {
			c.JSON(http.StatusOK, gin.H{"status": "success", "data": product})
			return
		}
	}

	catalogMutex.RLock()
	defer catalogMutex.RUnlock()

	for _, p := range memProducts {
		if p.Slug == slug && p.IsActive && !p.IsArchived && p.DeletedAt == nil {
			p.Options = memOptions[p.ID]
			p.DiscountTiers = memTiers[p.ID]
			c.JSON(http.StatusOK, gin.H{"status": "success", "data": p})
			return
		}
	}

	c.JSON(http.StatusNotFound, gin.H{"status": "error", "message": "Product not found"})
}

// HandleAdminCreateProduct creates a product with options, spec groups, features and tiers
func HandleAdminCreateProduct(c *gin.Context) {
	var req CreateProductRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"status": "error", "message": err.Error()})
		return
	}

	slug := req.Slug
	if slug == "" {
		slug = GenerateSlug(req.NameEn)
		if slug == "" {
			slug = GenerateSlug(req.Name)
		}
	}

	specGroupsJSON, _ := json.Marshal(req.SpecGroups)
	featuresConfigJSON, _ := json.Marshal(req.FeaturesConfig)
	infoTabsJSON, _ := json.Marshal(req.InfoTabs)

	if db.DB != nil {
		uniqueSlug, err := EnsureUniqueSlug(db.DB, slug, 0)
		if err == nil {
			slug = uniqueSlug
		}

		tx, err := db.DB.Begin()
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"status": "error", "message": "Transaction start failed"})
			return
		}
		defer tx.Rollback()

		var newID int
		productQuery := `
			INSERT INTO public_products (
				category_id, name, name_lo, name_en, slug, category, description, description_lo, description_en,
				pricing_model, base_price, unit, bestseller, target_margin_percent, default_machine_id, default_machine_name,
				spec_groups, features_config, info_tabs, features, thumbnail_url, gallery_urls,
				min_quantity, is_on_demand, lead_time_days, is_active, sort_order
			) VALUES (
				$1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27
			) RETURNING id
		`
		err = tx.QueryRow(
			productQuery,
			req.CategoryID, req.Name, req.NameLo, req.NameEn, slug, req.Category, req.Description, req.DescriptionLo, req.DescriptionEn,
			req.PricingModel, req.BasePrice, req.Unit, req.Bestseller, req.TargetMarginPercent, req.DefaultMachineID, req.DefaultMachineName,
			string(specGroupsJSON), string(featuresConfigJSON), string(infoTabsJSON), pq.Array(req.Features), req.ThumbnailURL, pq.Array(req.GalleryURLs),
			req.MinQuantity, req.IsOnDemand, req.LeadTimeDays, req.IsActive, req.SortOrder,
		).Scan(&newID)

		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"status": "error", "message": fmt.Sprintf("Failed to insert product: %v", err)})
			return
		}

		// Insert options
		for _, opt := range req.Options {
			optQuery := `
				INSERT INTO public_product_options (
					product_id, option_type, label, label_lo, label_en, hint_lo, hint_en, value, material_sku, paper_code, machine_id, machine_name, add_price, is_default, extra_cost_rate
				) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
			`
			_, err = tx.Exec(optQuery, newID, opt.OptionType, opt.Label, opt.LabelLo, opt.LabelEn, opt.HintLo, opt.HintEn, opt.Value, opt.MaterialSKU, opt.PaperCode, opt.MachineID, opt.MachineName, opt.AddPrice, opt.IsDefault, opt.ExtraCostRate)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"status": "error", "message": fmt.Sprintf("Failed to insert option: %v", err)})
				return
			}
		}

		// Insert discount tiers
		for _, tier := range req.DiscountTiers {
			tierQuery := `INSERT INTO product_discount_tiers (product_id, min_quantity, discount_percentage) VALUES ($1, $2, $3)`
			_, err = tx.Exec(tierQuery, newID, tier.MinQuantity, tier.DiscountPercentage)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"status": "error", "message": fmt.Sprintf("Failed to insert discount tier: %v", err)})
				return
			}
		}

		if err := tx.Commit(); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"status": "error", "message": "Failed to commit product creation"})
			return
		}

		c.JSON(http.StatusCreated, gin.H{"status": "success", "data": gin.H{"id": newID, "slug": slug}})
		return
	}

	catalogMutex.Lock()
	defer catalogMutex.Unlock()
	newProd := PublicProduct{
		ID:                  memNextProdID,
		CategoryID:          req.CategoryID,
		Name:                req.Name,
		NameLo:              req.NameLo,
		NameEn:              req.NameEn,
		Slug:                slug,
		Category:            req.Category,
		Description:         req.Description,
		DescriptionLo:       req.DescriptionLo,
		DescriptionEn:       req.DescriptionEn,
		PricingModel:        req.PricingModel,
		BasePrice:           req.BasePrice,
		Unit:                req.Unit,
		Bestseller:          req.Bestseller,
		TargetMarginPercent: req.TargetMarginPercent,
		DefaultMachineID:    req.DefaultMachineID,
		DefaultMachineName:  req.DefaultMachineName,
		SpecGroups:          req.SpecGroups,
		FeaturesConfig:      req.FeaturesConfig,
		Features:            req.Features,
		ThumbnailURL:        req.ThumbnailURL,
		GalleryURLs:         req.GalleryURLs,
		InfoTabs:            req.InfoTabs,
		MinQuantity:         req.MinQuantity,
		IsOnDemand:          req.IsOnDemand,
		LeadTimeDays:        req.LeadTimeDays,
		IsActive:            req.IsActive,
		SortOrder:           req.SortOrder,
		CreatedAt:           time.Now(),
		UpdatedAt:           time.Now(),
	}
	memProducts[memNextProdID] = newProd
	memNextProdID++
	c.JSON(http.StatusCreated, gin.H{"status": "success", "data": newProd})
}

// HandleAdminUpdateProduct updates product, options, spec groups, features and discount tiers
func HandleAdminUpdateProduct(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"status": "error", "message": "Invalid product ID"})
		return
	}

	var req UpdateProductRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"status": "error", "message": err.Error()})
		return
	}

	specGroupsJSON, _ := json.Marshal(req.SpecGroups)
	featuresConfigJSON, _ := json.Marshal(req.FeaturesConfig)
	infoTabsJSON, _ := json.Marshal(req.InfoTabs)

	if db.DB != nil {
		tx, err := db.DB.Begin()
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"status": "error", "message": "Transaction start failed"})
			return
		}
		defer tx.Rollback()

		updateQuery := `
			UPDATE public_products SET
				category_id = $1,
				name = $2,
				name_lo = $3,
				name_en = $4,
				category = $5,
				description = $6,
				description_lo = $7,
				description_en = $8,
				pricing_model = $9,
				base_price = $10,
				unit = $11,
				bestseller = $12,
				target_margin_percent = $13,
				default_machine_id = $14,
				default_machine_name = $15,
				spec_groups = $16,
				features_config = $17,
				info_tabs = $18,
				features = $19,
				thumbnail_url = $20,
				gallery_urls = $21,
				min_quantity = $22,
				is_on_demand = $23,
				lead_time_days = $24,
				is_active = $25,
				sort_order = $26,
				updated_at = CURRENT_TIMESTAMP
			WHERE id = $27
		`
		_, err = tx.Exec(
			updateQuery,
			req.CategoryID, req.Name, req.NameLo, req.NameEn, req.Category, req.Description, req.DescriptionLo, req.DescriptionEn,
			req.PricingModel, req.BasePrice, req.Unit, req.Bestseller, req.TargetMarginPercent, req.DefaultMachineID, req.DefaultMachineName,
			string(specGroupsJSON), string(featuresConfigJSON), string(infoTabsJSON), pq.Array(req.Features), req.ThumbnailURL, pq.Array(req.GalleryURLs),
			req.MinQuantity, req.IsOnDemand, req.LeadTimeDays, req.IsActive, req.SortOrder, id,
		)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"status": "error", "message": fmt.Sprintf("Failed to update product: %v", err)})
			return
		}

		// Refresh options
		if req.Options != nil {
			if _, err := tx.Exec(`DELETE FROM public_product_options WHERE product_id = $1`, id); err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"status": "error", "message": "Failed to clear old options"})
				return
			}
			for _, opt := range req.Options {
				optQuery := `
					INSERT INTO public_product_options (
						product_id, option_type, label, label_lo, label_en, hint_lo, hint_en, value, material_sku, paper_code, machine_id, machine_name, add_price, is_default, extra_cost_rate
					) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
				`
				_, err = tx.Exec(optQuery, id, opt.OptionType, opt.Label, opt.LabelLo, opt.LabelEn, opt.HintLo, opt.HintEn, opt.Value, opt.MaterialSKU, opt.PaperCode, opt.MachineID, opt.MachineName, opt.AddPrice, opt.IsDefault, opt.ExtraCostRate)
				if err != nil {
					c.JSON(http.StatusInternalServerError, gin.H{"status": "error", "message": fmt.Sprintf("Failed to insert option: %v", err)})
					return
				}
			}
		}

		// Refresh tiers
		if req.DiscountTiers != nil {
			if _, err := tx.Exec(`DELETE FROM product_discount_tiers WHERE product_id = $1`, id); err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"status": "error", "message": "Failed to clear old tiers"})
				return
			}
			for _, tier := range req.DiscountTiers {
				tierQuery := `INSERT INTO product_discount_tiers (product_id, min_quantity, discount_percentage) VALUES ($1, $2, $3)`
				_, err = tx.Exec(tierQuery, id, tier.MinQuantity, tier.DiscountPercentage)
				if err != nil {
					c.JSON(http.StatusInternalServerError, gin.H{"status": "error", "message": fmt.Sprintf("Failed to insert tier: %v", err)})
					return
				}
			}
		}

		if err := tx.Commit(); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"status": "error", "message": "Failed to commit update"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"status": "success", "message": "Product updated successfully"})
		return
	}

	catalogMutex.Lock()
	defer catalogMutex.Unlock()
	p, exists := memProducts[id]
	if !exists {
		c.JSON(http.StatusNotFound, gin.H{"status": "error", "message": "Product not found"})
		return
	}
	p.Name = req.Name
	p.NameLo = req.NameLo
	p.NameEn = req.NameEn
	p.Category = req.Category
	p.Description = req.Description
	p.DescriptionLo = req.DescriptionLo
	p.DescriptionEn = req.DescriptionEn
	p.PricingModel = req.PricingModel
	p.BasePrice = req.BasePrice
	p.Unit = req.Unit
	p.Bestseller = req.Bestseller
	p.TargetMarginPercent = req.TargetMarginPercent
	p.DefaultMachineID = req.DefaultMachineID
	p.DefaultMachineName = req.DefaultMachineName
	p.SpecGroups = req.SpecGroups
	p.FeaturesConfig = req.FeaturesConfig
	p.Features = req.Features
	p.ThumbnailURL = req.ThumbnailURL
	p.GalleryURLs = req.GalleryURLs
	p.InfoTabs = req.InfoTabs
	p.MinQuantity = req.MinQuantity
	p.IsOnDemand = req.IsOnDemand
	p.LeadTimeDays = req.LeadTimeDays
	p.IsActive = req.IsActive
	p.SortOrder = req.SortOrder
	p.UpdatedAt = time.Now()
	memProducts[id] = p

	c.JSON(http.StatusOK, gin.H{"status": "success", "data": p})
}

// HandleAdminToggleProduct toggles active status
func HandleAdminToggleProduct(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"status": "error", "message": "Invalid product ID"})
		return
	}

	var req struct {
		IsActive bool `json:"isActive"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"status": "error", "message": err.Error()})
		return
	}

	if db.DB != nil {
		_, err := db.DB.Exec(`UPDATE public_products SET is_active = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`, req.IsActive, id)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"status": "error", "message": err.Error()})
			return
		}
		c.JSON(http.StatusOK, gin.H{"status": "success", "message": "Status updated successfully"})
		return
	}

	catalogMutex.Lock()
	defer catalogMutex.Unlock()
	if p, exists := memProducts[id]; exists {
		p.IsActive = req.IsActive
		memProducts[id] = p
		c.JSON(http.StatusOK, gin.H{"status": "success", "message": "Status updated in memory"})
		return
	}
	c.JSON(http.StatusNotFound, gin.H{"status": "error", "message": "Product not found"})
}

// HandleAdminSoftDeleteProduct soft deletes a product
func HandleAdminSoftDeleteProduct(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"status": "error", "message": "Invalid product ID"})
		return
	}

	if db.DB != nil {
		_, err := db.DB.Exec(`UPDATE public_products SET is_archived = true, deleted_at = CURRENT_TIMESTAMP WHERE id = $1`, id)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"status": "error", "message": err.Error()})
			return
		}
		c.JSON(http.StatusOK, gin.H{"status": "success", "message": "Product archived successfully"})
		return
	}

	catalogMutex.Lock()
	defer catalogMutex.Unlock()
	if p, exists := memProducts[id]; exists {
		p.IsArchived = true
		now := time.Now()
		p.DeletedAt = &now
		memProducts[id] = p
		c.JSON(http.StatusOK, gin.H{"status": "success", "message": "Product archived in memory"})
		return
	}
	c.JSON(http.StatusNotFound, gin.H{"status": "error", "message": "Product not found"})
}

// HandleAdminUploadImage handles image uploads for product thumbnails and gallery
func HandleAdminUploadImage(c *gin.Context) {
	file, err := c.FormFile("image")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"status": "error", "message": "No image file provided"})
		return
	}

	uploadDir := "./uploads/products"
	if err := os.MkdirAll(uploadDir, 0755); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"status": "error", "message": "Failed to create upload directory"})
		return
	}

	filename := fmt.Sprintf("prod_%d_%s", time.Now().UnixNano(), filepath.Base(file.Filename))
	dest := filepath.Join(uploadDir, filename)

	if err := c.SaveUploadedFile(file, dest); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"status": "error", "message": "Failed to save file"})
		return
	}

	fileURL := fmt.Sprintf("/api/v1/orders/files/products/%s", filename)
	c.JSON(http.StatusOK, gin.H{
		"status": "success",
		"data": gin.H{
			"url":      fileURL,
			"filename": filename,
		},
	})
}

// Helper DB queries
func getAdminProductsFromDB() ([]PublicProduct, error) {
	query := `
		SELECT 
			p.id, p.category_id, c.slug as category_slug, p.name, p.name_lo, p.name_en, p.slug, p.category, 
			p.description, p.description_lo, p.description_en, p.pricing_model, p.base_price, p.unit, p.bestseller,
			p.target_margin_percent, p.default_machine_id, p.default_machine_name,
			COALESCE(p.spec_groups, '[]'::jsonb), COALESCE(p.features_config, '{}'::jsonb), COALESCE(p.info_tabs, '[]'::jsonb),
			p.features, p.thumbnail_url, p.gallery_urls, p.min_quantity, p.is_on_demand, p.lead_time_days,
			p.is_active, p.is_archived, p.deleted_at, p.sort_order, p.created_at, p.updated_at
		FROM public_products p
		LEFT JOIN public_categories c ON p.category_id = c.id
		WHERE p.is_archived = false AND p.deleted_at IS NULL
		ORDER BY p.sort_order ASC, p.id DESC
	`
	rows, err := db.DB.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var products []PublicProduct
	for rows.Next() {
		var p PublicProduct
		var catID sql.NullInt64
		var catSlug, nameLo, nameEn, descLo, descEn, pricingModel, unit sql.NullString
		var basePrice, targetMargin sql.NullFloat64
		var defMachID, defMachName sql.NullString
		var bestseller sql.NullBool
		var desc, thumb sql.NullString
		var specGroupsJSON, featuresConfigJSON, infoTabsJSON []byte

		err := rows.Scan(
			&p.ID, &catID, &catSlug, &p.Name, &nameLo, &nameEn, &p.Slug, &p.Category,
			&desc, &descLo, &descEn, &pricingModel, &basePrice, &unit, &bestseller,
			&targetMargin, &defMachID, &defMachName,
			&specGroupsJSON, &featuresConfigJSON, &infoTabsJSON,
			&p.Features, &thumb, &p.GalleryURLs, &p.MinQuantity, &p.IsOnDemand, &p.LeadTimeDays,
			&p.IsActive, &p.IsArchived, &p.DeletedAt, &p.SortOrder, &p.CreatedAt, &p.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		if catID.Valid {
			cid := int(catID.Int64)
			p.CategoryID = &cid
		}
		p.CategorySlug = catSlug.String
		p.NameLo = nameLo.String
		p.NameEn = nameEn.String
		p.Description = desc.String
		p.DescriptionLo = descLo.String
		p.DescriptionEn = descEn.String
		p.PricingModel = pricingModel.String
		if p.PricingModel == "" {
			p.PricingModel = "STANDARD_FLAT"
		}
		p.BasePrice = basePrice.Float64
		p.TargetMarginPercent = targetMargin.Float64
		p.DefaultMachineID = defMachID.String
		p.DefaultMachineName = defMachName.String
		p.Unit = unit.String
		p.Bestseller = bestseller.Bool
		p.ThumbnailURL = thumb.String

		if len(specGroupsJSON) > 0 {
			_ = json.Unmarshal(specGroupsJSON, &p.SpecGroups)
		}
		if len(featuresConfigJSON) > 0 {
			_ = json.Unmarshal(featuresConfigJSON, &p.FeaturesConfig)
		}
		if len(infoTabsJSON) > 0 {
			_ = json.Unmarshal(infoTabsJSON, &p.InfoTabs)
		}

		p.Options, _ = getProductOptionsFromDB(p.ID)
		p.DiscountTiers, _ = getProductTiersFromDB(p.ID)

		products = append(products, p)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return products, nil
}

func getPublicProductsFromDB(category string) ([]PublicProduct, error) {
	query := `
		SELECT 
			p.id, p.category_id, c.slug as category_slug, p.name, p.name_lo, p.name_en, p.slug, p.category, 
			p.description, p.description_lo, p.description_en, p.pricing_model, p.base_price, p.unit, p.bestseller,
			p.target_margin_percent, p.default_machine_id, p.default_machine_name,
			COALESCE(p.spec_groups, '[]'::jsonb), COALESCE(p.features_config, '{}'::jsonb), COALESCE(p.info_tabs, '[]'::jsonb),
			p.features, p.thumbnail_url, p.gallery_urls, p.min_quantity, p.is_on_demand, p.lead_time_days,
			p.is_active, p.is_archived, p.deleted_at, p.sort_order, p.created_at, p.updated_at
		FROM public_products p
		LEFT JOIN public_categories c ON p.category_id = c.id
		WHERE p.is_active = true AND p.is_archived = false AND p.deleted_at IS NULL
	`
	var rows *sql.Rows
	var err error
	if category != "" {
		query += ` AND (p.category = $1 OR c.slug = $1)`
		query += ` ORDER BY p.sort_order ASC, p.id DESC`
		rows, err = db.DB.Query(query, category)
	} else {
		query += ` ORDER BY p.sort_order ASC, p.id DESC`
		rows, err = db.DB.Query(query)
	}
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var products []PublicProduct
	for rows.Next() {
		var p PublicProduct
		var catID sql.NullInt64
		var catSlug, nameLo, nameEn, descLo, descEn, pricingModel, unit sql.NullString
		var basePrice, targetMargin sql.NullFloat64
		var defMachID, defMachName sql.NullString
		var bestseller sql.NullBool
		var desc, thumb sql.NullString
		var specGroupsJSON, featuresConfigJSON, infoTabsJSON []byte

		err := rows.Scan(
			&p.ID, &catID, &catSlug, &p.Name, &nameLo, &nameEn, &p.Slug, &p.Category,
			&desc, &descLo, &descEn, &pricingModel, &basePrice, &unit, &bestseller,
			&targetMargin, &defMachID, &defMachName,
			&specGroupsJSON, &featuresConfigJSON, &infoTabsJSON,
			&p.Features, &thumb, &p.GalleryURLs, &p.MinQuantity, &p.IsOnDemand, &p.LeadTimeDays,
			&p.IsActive, &p.IsArchived, &p.DeletedAt, &p.SortOrder, &p.CreatedAt, &p.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		if catID.Valid {
			cid := int(catID.Int64)
			p.CategoryID = &cid
		}
		p.CategorySlug = catSlug.String
		p.NameLo = nameLo.String
		p.NameEn = nameEn.String
		p.Description = desc.String
		p.DescriptionLo = descLo.String
		p.DescriptionEn = descEn.String
		p.PricingModel = pricingModel.String
		if p.PricingModel == "" {
			p.PricingModel = "STANDARD_FLAT"
		}
		p.BasePrice = basePrice.Float64
		p.TargetMarginPercent = targetMargin.Float64
		p.DefaultMachineID = defMachID.String
		p.DefaultMachineName = defMachName.String
		p.Unit = unit.String
		p.Bestseller = bestseller.Bool
		p.ThumbnailURL = thumb.String

		if len(specGroupsJSON) > 0 {
			_ = json.Unmarshal(specGroupsJSON, &p.SpecGroups)
		}
		if len(featuresConfigJSON) > 0 {
			_ = json.Unmarshal(featuresConfigJSON, &p.FeaturesConfig)
		}
		if len(infoTabsJSON) > 0 {
			_ = json.Unmarshal(infoTabsJSON, &p.InfoTabs)
		}

		p.Options, _ = getProductOptionsFromDB(p.ID)
		p.DiscountTiers, _ = getProductTiersFromDB(p.ID)
		products = append(products, p)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return products, nil
}

func getProductBySlugFromDB(slug string) (*PublicProduct, error) {
	query := `
		SELECT 
			p.id, p.category_id, c.slug as category_slug, p.name, p.name_lo, p.name_en, p.slug, p.category, 
			p.description, p.description_lo, p.description_en, p.pricing_model, p.base_price, p.unit, p.bestseller,
			p.target_margin_percent, p.default_machine_id, p.default_machine_name,
			COALESCE(p.spec_groups, '[]'::jsonb), COALESCE(p.features_config, '{}'::jsonb), COALESCE(p.info_tabs, '[]'::jsonb),
			p.features, p.thumbnail_url, p.gallery_urls, p.min_quantity, p.is_on_demand, p.lead_time_days,
			p.is_active, p.is_archived, p.deleted_at, p.sort_order, p.created_at, p.updated_at
		FROM public_products p
		LEFT JOIN public_categories c ON p.category_id = c.id
		WHERE p.slug = $1 AND p.is_archived = false AND p.deleted_at IS NULL
		LIMIT 1
	`
	var p PublicProduct
	var catID sql.NullInt64
	var catSlug, nameLo, nameEn, descLo, descEn, pricingModel, unit sql.NullString
	var basePrice, targetMargin sql.NullFloat64
	var defMachID, defMachName sql.NullString
	var bestseller sql.NullBool
	var desc, thumb sql.NullString
	var specGroupsJSON, featuresConfigJSON, infoTabsJSON []byte

	err := db.DB.QueryRow(query, slug).Scan(
		&p.ID, &catID, &catSlug, &p.Name, &nameLo, &nameEn, &p.Slug, &p.Category,
		&desc, &descLo, &descEn, &pricingModel, &basePrice, &unit, &bestseller,
		&targetMargin, &defMachID, &defMachName,
		&specGroupsJSON, &featuresConfigJSON, &infoTabsJSON,
		&p.Features, &thumb, &p.GalleryURLs, &p.MinQuantity, &p.IsOnDemand, &p.LeadTimeDays,
		&p.IsActive, &p.IsArchived, &p.DeletedAt, &p.SortOrder, &p.CreatedAt, &p.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	if catID.Valid {
		cid := int(catID.Int64)
		p.CategoryID = &cid
	}
	p.CategorySlug = catSlug.String
	p.NameLo = nameLo.String
	p.NameEn = nameEn.String
	p.Description = desc.String
	p.DescriptionLo = descLo.String
	p.DescriptionEn = descEn.String
	p.PricingModel = pricingModel.String
	if p.PricingModel == "" {
		p.PricingModel = "STANDARD_FLAT"
	}
	p.BasePrice = basePrice.Float64
	p.TargetMarginPercent = targetMargin.Float64
	p.DefaultMachineID = defMachID.String
	p.DefaultMachineName = defMachName.String
	p.Unit = unit.String
	p.Bestseller = bestseller.Bool
	p.ThumbnailURL = thumb.String

	if len(specGroupsJSON) > 0 {
		_ = json.Unmarshal(specGroupsJSON, &p.SpecGroups)
	}
	if len(featuresConfigJSON) > 0 {
		_ = json.Unmarshal(featuresConfigJSON, &p.FeaturesConfig)
	}
	if len(infoTabsJSON) > 0 {
		_ = json.Unmarshal(infoTabsJSON, &p.InfoTabs)
	}

	p.Options, _ = getProductOptionsFromDB(p.ID)
	p.DiscountTiers, _ = getProductTiersFromDB(p.ID)

	return &p, nil
}

func getProductOptionsFromDB(productID int) ([]PublicProductOption, error) {
	query := `
		SELECT id, product_id, option_type, label, label_lo, label_en, hint_lo, hint_en, value, material_sku, paper_code, machine_id, machine_name, add_price, is_default, extra_cost_rate, created_at
		FROM public_product_options
		WHERE product_id = $1
		ORDER BY id ASC
	`
	rows, err := db.DB.Query(query, productID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var options []PublicProductOption
	for rows.Next() {
		var opt PublicProductOption
		var labelLo, labelEn, hintLo, hintEn, matSku, paperCode, machID, machName sql.NullString
		var addPrice sql.NullFloat64

		if err := rows.Scan(&opt.ID, &opt.ProductID, &opt.OptionType, &opt.Label, &labelLo, &labelEn, &hintLo, &hintEn, &opt.Value, &matSku, &paperCode, &machID, &machName, &addPrice, &opt.IsDefault, &opt.ExtraCostRate, &opt.CreatedAt); err != nil {
			return nil, err
		}
		opt.LabelLo = labelLo.String
		opt.LabelEn = labelEn.String
		opt.HintLo = hintLo.String
		opt.HintEn = hintEn.String
		opt.MaterialSKU = matSku.String
		opt.PaperCode = paperCode.String
		opt.MachineID = machID.String
		opt.MachineName = machName.String
		opt.AddPrice = addPrice.Float64
		options = append(options, opt)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return options, nil
}

func getProductTiersFromDB(productID int) ([]ProductDiscountTier, error) {
	query := `
		SELECT id, product_id, min_quantity, discount_percentage, created_at
		FROM product_discount_tiers
		WHERE product_id = $1
		ORDER BY min_quantity ASC
	`
	rows, err := db.DB.Query(query, productID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var tiers []ProductDiscountTier
	for rows.Next() {
		var t ProductDiscountTier
		if err := rows.Scan(&t.ID, &t.ProductID, &t.MinQuantity, &t.DiscountPercentage, &t.CreatedAt); err != nil {
			return nil, err
		}
		tiers = append(tiers, t)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return tiers, nil
}
