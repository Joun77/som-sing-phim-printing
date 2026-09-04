package settings

import (
	"database/sql"
	"log"
	"net/http"
	"strings"
	"sync"

	"somsing.local/backend/db"

	"github.com/gin-gonic/gin"
)

// LaoDistrict represents a district in Laos
type LaoDistrict struct {
	ID     int    `json:"id"`
	NameLa string `json:"nameLa"`
	NameEn string `json:"nameEn"`
}

// LaoProvince represents a province in Laos with nested districts
type LaoProvince struct {
	ID        int           `json:"id"`
	NameLa    string        `json:"nameLa"`
	NameEn    string        `json:"nameEn"`
	Label     string        `json:"label"`
	Districts []LaoDistrict `json:"districts"`
}

var (
	locationMu sync.RWMutex
	cachedLocs []LaoProvince
)

// RawDefaultLocations holds the initial seed data of 18 provinces & 148 districts
var RawDefaultLocations = []LaoProvince{
	{
		NameLa: "ນະຄອນຫຼວງວຽງຈັນ", NameEn: "Vientiane Capital", Label: "ນະຄອນຫຼວງວຽງຈັນ (Vientiane Capital)",
		Districts: []LaoDistrict{
			{NameLa: "ຈັນທະບູລີ", NameEn: "Chanthabuly"},
			{NameLa: "ສີໂຄດຕະບອງ", NameEn: "Sikhottabong"},
			{NameLa: "ໄຊເສດຖາ", NameEn: "Xaysetha"},
			{NameLa: "ສີສັດຕະນາກ", NameEn: "Sisattanak"},
			{NameLa: "ນາຊາຍທອງ", NameEn: "Naxaithong"},
			{NameLa: "ໄຊທານີ", NameEn: "Xaythany"},
			{NameLa: "ຫາດຊາຍຟອງ", NameEn: "Hadxayfong"},
			{NameLa: "ສັງທອງ", NameEn: "Sangthong"},
			{NameLa: "ປາກງື່ມ", NameEn: "Pakngum"},
		},
	},
	{
		NameLa: "ແຂວງວຽງຈັນ", NameEn: "Vientiane Province", Label: "ແຂວງວຽງຈັນ (Vientiane Province)",
		Districts: []LaoDistrict{
			{NameLa: "ໂພນໂຮງ", NameEn: "Phonhong"},
			{NameLa: "ທຸລະຄົມ", NameEn: "Thoulakhom"},
			{NameLa: "ແກ້ວອຸດົມ", NameEn: "Keooudom"},
			{NameLa: "ກາສີ", NameEn: "Kasy"},
			{NameLa: "ວັງວຽງ", NameEn: "Vangvieng"},
			{NameLa: "ເຟືອງ", NameEn: "Feuang"},
			{NameLa: "ຊະນະຄາມ", NameEn: "Xanakham"},
			{NameLa: "ແມດ", NameEn: "Mad"},
			{NameLa: "ຫີນເຫີບ", NameEn: "Hinheup"},
			{NameLa: "ໝື່ນ", NameEn: "Meun"},
			{NameLa: "ຮົ່ມ", NameEn: "Hom"},
			{NameLa: "ໄຊສົມບູນ", NameEn: "Xaisomboun"},
		},
	},
	{
		NameLa: "ຫຼວງພະບາງ", NameEn: "Luangprabang", Label: "ຫຼວງພະບາງ (Luangprabang)",
		Districts: []LaoDistrict{
			{NameLa: "ຫຼວງພະບາງ", NameEn: "Luangprabang"},
			{NameLa: "ຊຽງເງິນ", NameEn: "Xiengngeun"},
			{NameLa: "ນານ", NameEn: "Nan"},
			{NameLa: "ປາກອູ", NameEn: "Pak Ou"},
			{NameLa: "ນ້ຳບາກ", NameEn: "Nambak"},
			{NameLa: "ງອຍ", NameEn: "Ngoy"},
			{NameLa: "ປາກແຊງ", NameEn: "Pak Xeng"},
			{NameLa: "ໂພນໄຊ", NameEn: "Phonxay"},
			{NameLa: "ຈອມເພັດ", NameEn: "Chomphet"},
			{NameLa: "ວຽງຄຳ", NameEn: "Viengkham"},
			{NameLa: "ພູຄູນ", NameEn: "Phoukhoun"},
			{NameLa: "ໂພນທອງ", NameEn: "Phonthong"},
		},
	},
	{
		NameLa: "ຈຳປາສັກ", NameEn: "Champasak", Label: "ຈຳປາສັກ (Champasak)",
		Districts: []LaoDistrict{
			{NameLa: "ປາກເຊ", NameEn: "Pakse"},
			{NameLa: "ຊະນະສົມບູນ", NameEn: "Sanasomboun"},
			{NameLa: "ບາຈຽງຈະເລີນສຸກ", NameEn: "Bachiangchaleunsook"},
			{NameLa: "ປາກຊ່ອງ", NameEn: "Paksong"},
			{NameLa: "ປະທຸມພອນ", NameEn: "Pathoumphone"},
			{NameLa: "ໂພນທອງ", NameEn: "Phonthong"},
			{NameLa: "ໂຊ້ງ", NameEn: "Santhong"},
			{NameLa: "ສຸຂຸມາ", NameEn: "Sukhuma"},
			{NameLa: "ມູນລະປະໂມກ", NameEn: "Moonlapamok"},
			{NameLa: "ໂຂງ", NameEn: "Khong"},
		},
	},
	{
		NameLa: "ສະຫວັນນະເຂດ", NameEn: "Savannakhet", Label: "ສະຫວັນນະເຂດ (Savannakhet)",
		Districts: []LaoDistrict{
			{NameLa: "ໄກສອນ ພົມວິຫານ", NameEn: "Kaysone Phomvihane"},
			{NameLa: "ອຸທຸມພອນ", NameEn: "Outhoumphone"},
			{NameLa: "ອາດສະພັງທອງ", NameEn: "Atsaphangthong"},
			{NameLa: "ພີນ", NameEn: "Phine"},
			{NameLa: "ເຊໂປນ", NameEn: "Sepone"},
			{NameLa: "ໜອງ", NameEn: "Nong"},
			{NameLa: "ທ່າປາງທອງ", NameEn: "Thapangthong"},
			{NameLa: "ສອງຄອນ", NameEn: "Songkhone"},
			{NameLa: "ຈຳພອນ", NameEn: "Chamonphone"},
			{NameLa: "ຊົນບູລີ", NameEn: "Xonbuly"},
			{NameLa: "ໄຊບູລີ", NameEn: "Xaybuly"},
			{NameLa: "ວິລະບູລີ", NameEn: "Vilabuly"},
			{NameLa: "ອາດສະພອນ", NameEn: "Assaphone"},
			{NameLa: "ໄຊພູທອງ", NameEn: "Xonkhone"},
			{NameLa: "ພະລານໄຊ", NameEn: "Phouthong"},
		},
	},
	{
		NameLa: "ຄຳມ່ວນ", NameEn: "Khammouane", Label: "ຄຳມ່ວນ (Khammouane)",
		Districts: []LaoDistrict{
			{NameLa: "ທ່າແຂກ", NameEn: "Thakhek"},
			{NameLa: "ມະຫາໄຊ", NameEn: "Mahaxay"},
			{NameLa: "ໜອງບົກ", NameEn: "Nongbok"},
			{NameLa: "ຫີນບູນ", NameEn: "Hinboun"},
			{NameLa: "ຍົມມະລາດ", NameEn: "Nhommalath"},
			{NameLa: "ບົວລະພາ", NameEn: "Bualapha"},
			{NameLa: "ນາກາຍ", NameEn: "Nakai"},
			{NameLa: "ເຊບັ້ງໄຟ", NameEn: "Xebangfai"},
			{NameLa: "ໄຊຈຳພອນ", NameEn: "Saihoum"},
		},
	},
	{
		NameLa: "ບໍລິຄຳໄຊ", NameEn: "Borikhamxay", Label: "ບໍລິຄຳໄຊ (Borikhamxay)",
		Districts: []LaoDistrict{
			{NameLa: "ປາກຊັນ", NameEn: "Pakxan"},
			{NameLa: "ທ່າພະບາດ", NameEn: "Thaphabath"},
			{NameLa: "ປາກກະດິງ", NameEn: "Pakkading"},
			{NameLa: "ບໍລິຄັນ", NameEn: "Borikhan"},
			{NameLa: "ຄຳເກີດ", NameEn: "Khamkeut"},
			{NameLa: "ວຽງທອງ", NameEn: "Viengthong"},
			{NameLa: "ໄຊຈຳພອນ", NameEn: "Xaychamphone"},
		},
	},
	{
		NameLa: "ອຸດົມໄຊ", NameEn: "Oudomxay", Label: "ອຸດົມໄຊ (Oudomxay)",
		Districts: []LaoDistrict{
			{NameLa: "ໄຊ", NameEn: "Xay"},
			{NameLa: "ຫຼາ", NameEn: "La"},
			{NameLa: "ນ້ຳໝໍ້", NameEn: "Nambor"},
			{NameLa: "ງາ", NameEn: "Nga"},
			{NameLa: "ແບ່ງ", NameEn: "Beng"},
			{NameLa: "ຮຸນ", NameEn: "Houn"},
			{NameLa: "ປາກແບ່ງ", NameEn: "Pakbeng"},
		},
	},
	{
		NameLa: "ໄຊຍະບູລີ", NameEn: "Xayaboury", Label: "ໄຊຍະບູລີ (Xayaboury)",
		Districts: []LaoDistrict{
			{NameLa: "ໄຊຍະບູລີ", NameEn: "Xayaboury"},
			{NameLa: "ຄອບ", NameEn: "Khop"},
			{NameLa: "ຫົງສາ", NameEn: "Hongsa"},
			{NameLa: "ເງິນ", NameEn: "Ngeun"},
			{NameLa: "ຊຽງຮ່ອນ", NameEn: "Xienghone"},
			{NameLa: "ພຽງ", NameEn: "Phiang"},
			{NameLa: "ປາກລາຍ", NameEn: "Parklai"},
			{NameLa: "ແກ່ນທ້າວ", NameEn: "Kenethao"},
			{NameLa: "ບໍ່ແຕນ", NameEn: "Botene"},
			{NameLa: "ທົ່ງມີໄຊ", NameEn: "Thongmyxay"},
			{NameLa: "ໄຊສະຖານ", NameEn: "Xaisathan"},
		},
	},
	{
		NameLa: "ຊຽງຂວາງ", NameEn: "Xiengkhouang", Label: "ຊຽງຂວາງ (Xiengkhouang)",
		Districts: []LaoDistrict{
			{NameLa: "ແປກ", NameEn: "Pek"},
			{NameLa: "ຄຳ", NameEn: "Kham"},
			{NameLa: "ໜອງແຮດ", NameEn: "Nonghet"},
			{NameLa: "ຄູນ", NameEn: "Khoun"},
			{NameLa: "ທ່າໂທມ", NameEn: "Thathom"},
			{NameLa: "ພູກູດ", NameEn: "Phookoot"},
			{NameLa: "ຜາໄຊ", NameEn: "Phaxay"},
		},
	},
	{
		NameLa: "ຫົວພັນ", NameEn: "Houaphanh", Label: "ຫົວພັນ (Houaphanh)",
		Districts: []LaoDistrict{
			{NameLa: "ຊຳເໜືອ", NameEn: "Xamneua"},
			{NameLa: "ຊຽງຄໍ້", NameEn: "Xiengkhor"},
			{NameLa: "ຮ້ຽມ", NameEn: "Hiam"},
			{NameLa: "ວຽງໄຊ", NameEn: "Viengxay"},
			{NameLa: "ຫົວເມືອງ", NameEn: "Huameuang"},
			{NameLa: "ຊຳໃຕ້", NameEn: "Samtay"},
			{NameLa: "ສົບເບົາ", NameEn: "Sop Bao"},
			{NameLa: "ແອດ", NameEn: "Et"},
			{NameLa: "ໂກນ", NameEn: "Kone"},
			{NameLa: "ຊ່ອນ", NameEn: "Xon"},
		},
	},
	{
		NameLa: "ຫຼວງນ້ຳທາ", NameEn: "Luangnamtha", Label: "ຫຼວງນ້ຳທາ (Luangnamtha)",
		Districts: []LaoDistrict{
			{NameLa: "ຫຼວງນ້ຳທາ", NameEn: "Luangnamtha"},
			{NameLa: "ສິງ", NameEn: "Sing"},
			{NameLa: "ລອງ", NameEn: "Long"},
			{NameLa: "ວຽງພູຄາ", NameEn: "Viengphoukha"},
			{NameLa: "ນາແລ", NameEn: "Na Le"},
		},
	},
	{
		NameLa: "ບໍ່ແກ້ວ", NameEn: "Bokeo", Label: "ບໍ່ແກ້ວ (Bokeo)",
		Districts: []LaoDistrict{
			{NameLa: "ຫ້ວຍຊາຍ", NameEn: "Houayxay"},
			{NameLa: "ຕົ້ນເຜິ້ງ", NameEn: "Tonpheung"},
			{NameLa: "ເມິງ", NameEn: "Meung"},
			{NameLa: "ຜາອຸດົມ", NameEn: "Pha Oudom"},
			{NameLa: "ປາກທາ", NameEn: "Paktha"},
		},
	},
	{
		NameLa: "ຜົ້ງສາລີ", NameEn: "Phongsaly", Label: "ຜົ້ງສາລີ (Phongsaly)",
		Districts: []LaoDistrict{
			{NameLa: "ຜົ້ງສາລີ", NameEn: "Phongsaly"},
			{NameLa: "ໃໝ່", NameEn: "May"},
			{NameLa: "ຂວາ", NameEn: "Khoua"},
			{NameLa: "ສຳພັນ", NameEn: "Samphanh"},
			{NameLa: "ບຸນເໜືອ", NameEn: "Boun Neua"},
			{NameLa: "ຍອດອູ", NameEn: "Yot Ou"},
			{NameLa: "ບຸນໃຕ້", NameEn: "Boun Tay"},
		},
	},
	{
		NameLa: "ສາລະວັນ", NameEn: "Salavan", Label: "ສາລະວັນ (Salavan)",
		Districts: []LaoDistrict{
			{NameLa: "ສາລະວັນ", NameEn: "Salavan"},
			{NameLa: "ຕະໂອ້ຍ", NameEn: "Ta-Oy"},
			{NameLa: "ຕຸ້ມລານ", NameEn: "To vanity"},
			{NameLa: "ລະຄອນເພັງ", NameEn: "Lakhonepheng"},
			{NameLa: "ວາປີ", NameEn: "Vapi"},
			{NameLa: "ຄົງເຊໂດນ", NameEn: "Khongxedone"},
			{NameLa: "ເລົ່າງາມ", NameEn: "Lao Ngam"},
			{NameLa: "ສະໝ້ວຍ", NameEn: "Samouay"},
		},
	},
	{
		NameLa: "ເຊກອງ", NameEn: "Sekong", Label: "ເຊກອງ (Sekong)",
		Districts: []LaoDistrict{
			{NameLa: "ລະມາມ", NameEn: "Lamam"},
			{NameLa: "ກະລຶມ", NameEn: "Kaleum"},
			{NameLa: "ດັກຈຶງ", NameEn: "Dakcheung"},
			{NameLa: "ທ່າແຕງ", NameEn: "Tha Teng"},
		},
	},
	{
		NameLa: "ອັດຕະປື", NameEn: "Attapeu", Label: "ອັດຕະປື (Attapeu)",
		Districts: []LaoDistrict{
			{NameLa: "ໄຊເສດຖາ", NameEn: "Xaysetha"},
			{NameLa: "ສາມັກຄີໄຊ", NameEn: "Samakkhixay"},
			{NameLa: "ສະໜາມໄຊ", NameEn: "Sanamxay"},
			{NameLa: "ພູວົງ", NameEn: "Phouvong"},
			{NameLa: "ສານໄຊ", NameEn: "Sanxay"},
		},
	},
	{
		NameLa: "ໄຊສົມບູນ", NameEn: "Xaysomboun", Label: "ໄຊສົມບູນ (Xaysomboun)",
		Districts: []LaoDistrict{
			{NameLa: "ອານຸວົງ", NameEn: "Anouvong"},
			{NameLa: "ລອງແຈ້ງ", NameEn: "Longchaeng"},
			{NameLa: "ທ່າໂທມ", NameEn: "Thathom"},
			{NameLa: "ລອງຊານ", NameEn: "Longxan"},
			{NameLa: "ຮົ່ມ", NameEn: "Hom"},
		},
	},
}

func init() {
	cachedLocs = RawDefaultLocations
}

// SeedLocationsToDB ensures PostgreSQL DB has all provinces & districts seeded
func SeedLocationsToDB(database *sql.DB) {
	if database == nil {
		return
	}

	// Check if provinces already seeded
	var count int
	err := database.QueryRow("SELECT COUNT(*) FROM lao_provinces").Scan(&count)
	if err == nil && count > 0 {
		return
	}

	log.Println("[DB SEED] Seeding Lao provinces and districts into database...")
	tx, err := database.Begin()
	if err != nil {
		log.Printf("[DB SEED ERROR] tx begin: %v", err)
		return
	}
	defer tx.Rollback()

	for _, prov := range RawDefaultLocations {
		var provID int
		err := tx.QueryRow(`
			INSERT INTO lao_provinces (name_la, name_en, label)
			VALUES ($1, $2, $3)
			ON CONFLICT (name_la) DO UPDATE SET name_en = EXCLUDED.name_en, label = EXCLUDED.label
			RETURNING id
		`, prov.NameLa, prov.NameEn, prov.Label).Scan(&provID)

		if err != nil {
			log.Printf("[DB SEED ERROR] inserting province %s: %v", prov.NameLa, err)
			continue
		}

		for _, dist := range prov.Districts {
			_, err = tx.Exec(`
				INSERT INTO lao_districts (province_id, name_la, name_en)
				VALUES ($1, $2, $3)
				ON CONFLICT (province_id, name_la) DO UPDATE SET name_en = EXCLUDED.name_en
			`, provID, dist.NameLa, dist.NameEn)
			if err != nil {
				log.Printf("[DB SEED ERROR] inserting district %s: %v", dist.NameLa, err)
			}
		}
	}

	if err := tx.Commit(); err != nil {
		log.Printf("[DB SEED ERROR] commit: %v", err)
	} else {
		log.Println("[DB SEED SUCCESS] Successfully seeded 18 provinces and all districts into PostgreSQL!")
	}
}

// FetchLocationsFromDB retrieves structured provinces with districts
func FetchLocationsFromDB(database *sql.DB) []LaoProvince {
	if database == nil {
		locationMu.RLock()
		defer locationMu.RUnlock()
		return cachedLocs
	}

	rows, err := database.Query(`
		SELECT 
			p.id, p.name_la, p.name_en, p.label,
			COALESCE(d.id, 0), COALESCE(d.name_la, ''), COALESCE(d.name_en, '')
		FROM lao_provinces p
		LEFT JOIN lao_districts d ON p.id = d.province_id
		ORDER BY p.id ASC, d.id ASC
	`)
	if err != nil {
		log.Printf("[DB LOCATIONS WARNING] query error: %v (using fallback)", err)
		locationMu.RLock()
		defer locationMu.RUnlock()
		return cachedLocs
	}
	defer rows.Close()

	provMap := make(map[int]*LaoProvince)
	var provOrder []int

	for rows.Next() {
		var pID, dID int
		var pLa, pEn, pLabel, dLa, dEn string
		if err := rows.Scan(&pID, &pLa, &pEn, &pLabel, &dID, &dLa, &dEn); err != nil {
			continue
		}

		prov, exists := provMap[pID]
		if !exists {
			prov = &LaoProvince{
				ID:        pID,
				NameLa:    pLa,
				NameEn:    pEn,
				Label:     pLabel,
				Districts: make([]LaoDistrict, 0),
			}
			provMap[pID] = prov
			provOrder = append(provOrder, pID)
		}

		if dID > 0 {
			prov.Districts = append(prov.Districts, LaoDistrict{
				ID:     dID,
				NameLa: dLa,
				NameEn: dEn,
			})
		}
	}

	if err := rows.Err(); err != nil {
		log.Printf("[DB LOCATIONS WARNING] rows iteration error: %v (using fallback)", err)
		locationMu.RLock()
		defer locationMu.RUnlock()
		return cachedLocs
	}

	if len(provOrder) == 0 {
		locationMu.RLock()
		defer locationMu.RUnlock()
		return cachedLocs
	}

	var result []LaoProvince
	for _, id := range provOrder {
		result = append(result, *provMap[id])
	}

	locationMu.Lock()
	cachedLocs = result
	locationMu.Unlock()

	return result
}

// HandleGetLaoProvinces serves list of all provinces & districts from DB
func HandleGetLaoProvinces(c *gin.Context) {
	database := db.GetDB()
	locs := FetchLocationsFromDB(database)
	c.JSON(http.StatusOK, gin.H{
		"status": "success",
		"data":   locs,
	})
}

// HandleGetLaoDistricts serves districts for a specific province from DB
func HandleGetLaoDistricts(c *gin.Context) {
	provQuery := c.Query("province")
	database := db.GetDB()
	locs := FetchLocationsFromDB(database)

	var matchedDistricts []LaoDistrict
	for _, p := range locs {
		if strings.EqualFold(p.NameLa, provQuery) ||
			strings.EqualFold(p.NameEn, provQuery) ||
			strings.EqualFold(p.Label, provQuery) ||
			strings.Contains(p.Label, provQuery) ||
			strings.Contains(provQuery, p.NameLa) {
			matchedDistricts = p.Districts
			break
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"status":    "success",
		"province":  provQuery,
		"districts": matchedDistricts,
	})
}
