package notifications

import (
	"fmt"
	"log"
	"os"

	"github.com/line/line-bot-sdk-go/v7/linebot"
)

// OrderNotificationData represents normalized order payload for notifications
type OrderNotificationData struct {
	ID                   string  `json:"id"`
	OrderNo              string  `json:"order_no"`
	CustomerName         string  `json:"customer_name"`
	CustomerPhone        string  `json:"customer_phone"`
	CustomerLineID       string  `json:"customer_line_id"`
	TotalAmountLAK       float64 `json:"total_amount_lak"`
	DepositLAK           float64 `json:"deposit_lak"`
	RemainingLAK         float64 `json:"remaining_lak"`
	Status               string  `json:"status"` // PAID_PREPRESS, IN_PRODUCTION, SHIPPED, READY_FOR_PICKUP, etc.
	ItemSummary          string  `json:"item_summary"`
	TrackingNumber       string  `json:"tracking_number"`
	CourierName          string  `json:"courier_name"`
	TrackingURL          string  `json:"tracking_url"`
}

var (
	lineBotClient *linebot.Client
)

// InitLineBot initializes the LINE Bot SDK client from environment variables
func InitLineBot() (*linebot.Client, error) {
	secret := os.Getenv("LINE_CHANNEL_SECRET")
	token := os.Getenv("LINE_CHANNEL_ACCESS_TOKEN")

	if secret == "" || token == "" {
		return nil, fmt.Errorf("LINE credentials not set in environment (LINE_CHANNEL_SECRET, LINE_CHANNEL_ACCESS_TOKEN)")
	}

	bot, err := linebot.New(secret, token)
	if err != nil {
		return nil, err
	}
	lineBotClient = bot
	return bot, nil
}

// BuildOrderStatusFlexMessage constructs a high-converting Flex Message container based on order status
func BuildOrderStatusFlexMessage(data OrderNotificationData) *linebot.BubbleContainer {
	var headerTitle, headerColor, bodyMainText, heroBadge string

	switch data.Status {
	case "PAID_PREPRESS":
		headerTitle = "✅ ໄດ້ຮັບການຊຳລະເງິນແລ້ວ (Paid)"
		headerColor = "#10B981" // Emerald Green
		bodyMainText = "ໄດ້ຮັບຊຳລະເງິນຮຽບຮ້ອຍແລ້ວ! ທີມງານກຳລັງກວດສອບໄຟລ໌ງານພິມ (Preflight) ເພື່ອກຽມສັ່ງຜະລິດ."
		heroBadge = "PAID & PREPRESS CHECKING"
	case "IN_PRODUCTION":
		headerTitle = "🖨️ ກຳລັງຜະລິດ (In Production)"
		headerColor = "#3B82F6" // Blue
		bodyMainText = "ງານພິມຂອງທ່ານກຳລັງຢູ່ເທິງເຄື່ອງພິມ! ລະບົບກຳລັງຄວບຄຸມຄຸນນະພາບສີ ແລະ ການຕັດເຂົ້າສັນ."
		heroBadge = "ON PRESS & FINISHING"
	case "SHIPPED":
		headerTitle = "🚚 ສິນຄ້າຈັດສົ່ງແລ້ວ (Shipped)"
		headerColor = "#8B5CF6" // Purple
		tracking := data.TrackingNumber
		if tracking == "" {
			tracking = "SSP-" + data.OrderNo
		}
		courier := data.CourierName
		if courier == "" {
			courier = "Anousith Express / VIP Delivery"
		}
		bodyMainText = fmt.Sprintf("ສິນຄ້າຂອງທ່ານຖືກຈັດສົ່ງອອກຈາກໂຮງພິມແລ້ວ!\nຂົນສົ່ງ: %s\nເລກພັດສະດຸ: %s", courier, tracking)
		heroBadge = "DISPATCHED"
	default:
		headerTitle = "📋 ອັບເດດສະຖານະງານພິມ (Status Update)"
		headerColor = "#0F172A" // Slate Dark
		bodyMainText = fmt.Sprintf("ອໍເດີຂອງທ່ານປ່ຽນສະຖານະເປັນ: %s", data.Status)
		heroBadge = data.Status
	}

	orderNum := data.OrderNo
	if orderNum == "" {
		orderNum = data.ID
	}

	trackingLink := data.TrackingURL
	if trackingLink == "" {
		trackingLink = fmt.Sprintf("https://somsingphim.la/track/%s", orderNum)
	}

	bubble := &linebot.BubbleContainer{
		Type: linebot.FlexContainerTypeBubble,
		Header: &linebot.BoxComponent{
			Type:            linebot.FlexComponentTypeBox,
			Layout:          linebot.FlexBoxLayoutTypeVertical,
			BackgroundColor: headerColor,
			PaddingAll:      "20px",
			Contents: []linebot.FlexComponent{
				&linebot.TextComponent{
					Type:   linebot.FlexComponentTypeText,
					Text:   "SOM SING PHIM LUXURY PRINT",
					Color:  "#FFFFFFCC",
					Size:   linebot.FlexTextSizeTypeXs,
					Weight: linebot.FlexTextWeightTypeBold,
				},
				&linebot.TextComponent{
					Type:   linebot.FlexComponentTypeText,
					Text:   headerTitle,
					Color:  "#FFFFFF",
					Size:   linebot.FlexTextSizeTypeLg,
					Weight: linebot.FlexTextWeightTypeBold,
					Margin: linebot.FlexComponentMarginTypeSm,
				},
			},
		},
		Body: &linebot.BoxComponent{
			Type:       linebot.FlexComponentTypeBox,
			Layout:     linebot.FlexBoxLayoutTypeVertical,
			PaddingAll: "20px",
			Contents: []linebot.FlexComponent{
				&linebot.BoxComponent{
					Type:            linebot.FlexComponentTypeBox,
					Layout:          linebot.FlexBoxLayoutTypeHorizontal,
					BackgroundColor: "#F1F5F9",
					CornerRadius:    "8px",
					PaddingAll:      "10px",
					Margin:          linebot.FlexComponentMarginTypeNone,
					Contents: []linebot.FlexComponent{
						&linebot.TextComponent{
							Type:   linebot.FlexComponentTypeText,
							Text:   "ORDER NUMBER:",
							Size:   linebot.FlexTextSizeTypeXs,
							Color:  "#64748B",
							Weight: linebot.FlexTextWeightTypeBold,
						},
						&linebot.TextComponent{
							Type:   linebot.FlexComponentTypeText,
							Text:   orderNum,
							Size:   linebot.FlexTextSizeTypeSm,
							Color:  "#0F172A",
							Weight: linebot.FlexTextWeightTypeBold,
							Align:  linebot.FlexComponentAlignTypeEnd,
						},
					},
				},
				&linebot.TextComponent{
					Type:   linebot.FlexComponentTypeText,
					Text:   bodyMainText,
					Size:   linebot.FlexTextSizeTypeSm,
					Color:  "#334155",
					Wrap:   true,
					Margin: linebot.FlexComponentMarginTypeLg,
				},
				&linebot.SeparatorComponent{
					Type:   linebot.FlexComponentTypeSeparator,
					Margin: linebot.FlexComponentMarginTypeLg,
				},
				&linebot.BoxComponent{
					Type:   linebot.FlexComponentTypeBox,
					Layout: linebot.FlexBoxLayoutTypeVertical,
					Margin: linebot.FlexComponentMarginTypeLg,
					Contents: []linebot.FlexComponent{
						&linebot.BoxComponent{
							Type:   linebot.FlexComponentTypeBox,
							Layout: linebot.FlexBoxLayoutTypeHorizontal,
							Contents: []linebot.FlexComponent{
								&linebot.TextComponent{
									Type:  linebot.FlexComponentTypeText,
									Text:  "ລູກຄ້າ / Customer:",
									Size:  linebot.FlexTextSizeTypeXs,
									Color: "#94A3B8",
								},
								&linebot.TextComponent{
									Type:   linebot.FlexComponentTypeText,
									Text:   data.CustomerName,
									Size:   linebot.FlexTextSizeTypeXs,
									Color:  "#1E293B",
									Weight: linebot.FlexTextWeightTypeBold,
									Align:  linebot.FlexComponentAlignTypeEnd,
								},
							},
						},
						&linebot.BoxComponent{
							Type:   linebot.FlexComponentTypeBox,
							Layout: linebot.FlexBoxLayoutTypeHorizontal,
							Margin: linebot.FlexComponentMarginTypeSm,
							Contents: []linebot.FlexComponent{
								&linebot.TextComponent{
									Type:  linebot.FlexComponentTypeText,
									Text:  "ຍອດລວມ / Total:",
									Size:  linebot.FlexTextSizeTypeXs,
									Color: "#94A3B8",
								},
								&linebot.TextComponent{
									Type:   linebot.FlexComponentTypeText,
									Text:   fmt.Sprintf("%.0f LAK", data.TotalAmountLAK),
									Size:   linebot.FlexTextSizeTypeXs,
									Color:  "#10B981",
									Weight: linebot.FlexTextWeightTypeBold,
									Align:  linebot.FlexComponentAlignTypeEnd,
								},
							},
						},
					},
				},
			},
		},
		Footer: &linebot.BoxComponent{
			Type:       linebot.FlexComponentTypeBox,
			Layout:     linebot.FlexBoxLayoutTypeVertical,
			PaddingAll: "16px",
			Contents: []linebot.FlexComponent{
				&linebot.ButtonComponent{
					Type:   linebot.FlexComponentTypeButton,
					Style:  linebot.FlexButtonStyleTypePrimary,
					Color:  headerColor,
					Height: linebot.FlexButtonHeightTypeSm,
					Action: &linebot.URIAction{
						Label: "🔍 ຕິດຕາມສະຖານະງານພິມ (Live Track)",
						URI:   trackingLink,
					},
				},
			},
		},
	}

	_ = heroBadge
	return bubble
}

// SendOrderStatusFlexMessage sends the Flex message to the customer's LINE ID
func SendOrderStatusFlexMessage(customerLineID string, order OrderNotificationData) error {
	if customerLineID == "" {
		log.Printf("[LINE BOT SKIPPED] No customerLineID provided for order %s", order.OrderNo)
		return nil
	}

	flexContainer := BuildOrderStatusFlexMessage(order)
	flexMessage := linebot.NewFlexMessage(fmt.Sprintf("ອັບເດດສະຖານະອໍເດີ #%s", order.OrderNo), flexContainer)

	if lineBotClient == nil {
		if bot, err := InitLineBot(); err == nil {
			lineBotClient = bot
		} else {
			log.Printf("[LINE BOT SIMULATION] Target: %s | Order: %s | Status: %s | (Token not configured)", customerLineID, order.OrderNo, order.Status)
			return nil
		}
	}

	_, err := lineBotClient.PushMessage(customerLineID, flexMessage).Do()
	if err != nil {
		log.Printf("[LINE BOT ERROR] Failed to push message to %s: %v", customerLineID, err)
		return err
	}

	log.Printf("[LINE BOT SUCCESS] Sent status '%s' notification to %s for order %s", order.Status, customerLineID, order.OrderNo)
	return nil
}
