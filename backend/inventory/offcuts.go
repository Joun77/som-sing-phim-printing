package inventory

import (
	"net/http"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
)

type Offcut struct {
	ID               string    `json:"id"`
	ParentMaterialID string    `json:"parent_material_id" binding:"required"`
	Name             string    `json:"name" binding:"required"`
	WidthMm          float64   `json:"width_mm"`
	LengthMm         float64   `json:"length_mm"`
	Quantity         float64   `json:"quantity" binding:"required,gt=0"`
	CreatedAt        time.Time `json:"created_at"`
}

var (
	offcutsStore = make(map[string]Offcut)
	storeMutex   sync.RWMutex
	offcutSeq    int
)

func init() {
	offcutsStore["offcut-001"] = Offcut{
		ID:               "offcut-001",
		ParentMaterialID: "paper-a4-80",
		Name:             "Leftover strip A4 80gsm",
		WidthMm:          100.0,
		LengthMm:         297.0,
		Quantity:         15.0,
		CreatedAt:        time.Now(),
	}
	offcutSeq = 1
}

// HandleGetOffcuts returns the list of offcut scraps
func HandleGetOffcuts(c *gin.Context) {
	storeMutex.RLock()
	defer storeMutex.RUnlock()

	list := make([]Offcut, 0, len(offcutsStore))
	for _, o := range offcutsStore {
		list = append(list, o)
	}

	c.JSON(http.StatusOK, list)
}

// HandleRegisterOffcut creates an offcut entry
func HandleRegisterOffcut(c *gin.Context) {
	var req Offcut
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid offcut input", "details": err.Error()})
		return
	}

	storeMutex.Lock()
	defer storeMutex.Unlock()

	offcutSeq++
	req.ID = time.Now().Format("20060102-150405-") + string(rune(offcutSeq))
	req.CreatedAt = time.Now()

	offcutsStore[req.ID] = req
	c.JSON(http.StatusCreated, req)
}
