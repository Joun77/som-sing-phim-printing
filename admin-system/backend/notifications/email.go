package notifications

import (
	"bytes"
	"fmt"
	"html/template"
	"net/smtp"
	"os"
	"strings"
)

// EmailConfig holds SMTP configuration
type EmailConfig struct {
	Host     string
	Port     string
	Username string
	Password string
	From     string
	FromName string
}

// GetEmailConfig loads SMTP credentials from environment
func GetEmailConfig() EmailConfig {
	host := os.Getenv("SMTP_HOST")
	if host == "" {
		host = "smtp.gmail.com"
	}
	port := os.Getenv("SMTP_PORT")
	if port == "" {
		port = "587"
	}
	user := os.Getenv("SMTP_USER")
	pass := os.Getenv("SMTP_PASSWORD")
	from := os.Getenv("SMTP_FROM")
	if from == "" {
		from = user
		if from == "" {
			from = "orders@somsingphim.la"
		}
	}
	fromName := os.Getenv("SMTP_FROM_NAME")
	if fromName == "" {
		fromName = "Som Sing Phim Atelier"
	}

	return EmailConfig{
		Host:     host,
		Port:     port,
		Username: user,
		Password: pass,
		From:     from,
		FromName: fromName,
	}
}

// BuildOrderEmailHTML generates luxury gold/navy HTML email content
func BuildOrderEmailHTML(data OrderNotificationData) (string, string, error) {
	var subject, statusBadge, statusTitle, statusDesc, statusColor string

	switch data.Status {
	case "PAID_PREPRESS":
		subject = fmt.Sprintf("✅ ຢືນຢັນຄຳສັ່ງຊື້ ແລະ ການຊຳລະເງິນ - ອໍເດີ #%s | Som Sing Phim", data.OrderNo)
		statusBadge = "PAYMENT RECEIVED"
		statusTitle = "ໄດ້ຮັບການຊຳລະເງິນຮຽບຮ້ອຍແລ້ວ"
		statusDesc = "ພວກເຮົາໄດ້ຮັບຍອດຊຳລະເງິນ ແລະ ໄຟລ໌ຂອງທ່ານແລ້ວ ທີມງານກຳລັງກວດສອບຄວາມລະອຽດ (Preflight) ກ່ອນເລີ່ມພິມ."
		statusColor = "#10B981"
	case "PREFLIGHT_PASSED", "FILE_CONFIRMED":
		subject = fmt.Sprintf("🎨 ໄຟລ໌ງານພິມຜ່ານການກວດສອບແລ້ວ - ອໍເດີ #%s | Som Sing Phim", data.OrderNo)
		statusBadge = "ARTWORK VERIFIED"
		statusTitle = "ໄຟລ໌ງານພິມຖືກຕ້ອງຕາມມາດຕະຖານ (CMYK / 300 DPI)"
		statusDesc = "ໄຟລ໌ງານພິມຂອງທ່ານກວດສອບຜ່ານຮຽບຮ້ອຍແລ້ວ ພ້ອມສົ່ງຕໍ່ເຂົ້າສູ່ສາຍການຜະລິດດິຈິຕອລ."
		statusColor = "#3B82F6"
	case "IN_PRODUCTION":
		subject = fmt.Sprintf("🖨️ ກຳລັງດຳເນີນການພິມຈິງ - ອໍເດີ #%s | Som Sing Phim", data.OrderNo)
		statusBadge = "IN PRODUCTION"
		statusTitle = "ກຳລັງຜະລິດງານພິມດ້ວຍລະບົບດິຈິຕອລຄົມຊັດສູງ"
		statusDesc = "ຊ່າງພິມໄດ້ຮັບຄິວງານ ແລະ ຕັດສະຕັອກວັດສະດຸພ້ອມພິມແລ້ວ ຈະດຳເນີນການເຂົ້າເລັ່ມ ແລະ ເຄືອບຜິວຕາມລຳດັບ."
		statusColor = "#C5A059"
	case "SHIPPED", "DELIVERED":
		subject = fmt.Sprintf("🚚 ຈັດສົ່ງສິນຄ້າແລ້ວ - ອໍເດີ #%s | Som Sing Phim", data.OrderNo)
		statusBadge = "DISPATCHED"
		statusTitle = "ສິນຄ້າຂອງທ່ານກຳລັງເດີນທາງໄປຫາທ່ານ"
		statusDesc = fmt.Sprintf("ສິນຄ້າຜະລິດສຳເລັດ ແລະ ມອບໃຫ້ບໍລິສັດຂົນສົ່ງ %s ຮຽບຮ້ອຍແລ້ວ.", data.CourierName)
		statusColor = "#8B5CF6"
	default:
		subject = fmt.Sprintf("📦 ອັບເດດສະຖານະຄຳສັ່ງຊື້ #%s | Som Sing Phim", data.OrderNo)
		statusBadge = "ORDER UPDATE"
		statusTitle = fmt.Sprintf("ສະຖານະ: %s", data.Status)
		statusDesc = "ຄຳສັ່ງຊື້ຂອງທ່ານມີການອັບເດດສະຖານະໃໝ່."
		statusColor = "#C5A059"
	}

	htmlTmpl := `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{{.Subject}}</title>
<style>
  body { margin: 0; padding: 0; background-color: #070D1E; font-family: 'Helvetica Neue', Arial, sans-serif; color: #FFFFFF; }
  .wrapper { width: 100%; max-width: 600px; margin: 0 auto; background-color: #0E172F; border: 1px solid #C5A059; border-radius: 16px; overflow: hidden; }
  .header { background: linear-gradient(135deg, #070D1E 0%, #142145 100%); padding: 32px 24px; text-align: center; border-bottom: 1px solid rgba(197, 160, 89, 0.3); }
  .header h1 { margin: 0; font-size: 22px; color: #EBD8B2; letter-spacing: 2px; }
  .header p { margin: 6px 0 0 0; font-size: 11px; color: #C5A059; letter-spacing: 3px; }
  .content { padding: 32px 28px; }
  .badge { display: inline-block; padding: 6px 14px; border-radius: 20px; font-size: 11px; font-weight: bold; letter-spacing: 1px; color: #070D1E; background-color: {{.StatusColor}}; margin-bottom: 16px; }
  .title { font-size: 18px; font-weight: bold; color: #FFFFFF; margin-bottom: 12px; }
  .desc { font-size: 14px; line-height: 1.6; color: #94A3B8; margin-bottom: 24px; }
  .card { background-color: #142145; border-radius: 12px; padding: 20px; border: 1px solid rgba(255,255,255,0.08); margin-bottom: 24px; }
  .card-row { display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 13px; }
  .card-label { color: #94A3B8; }
  .card-val { color: #FFFFFF; font-weight: bold; }
  .card-val-gold { color: #EBD8B2; font-weight: bold; font-size: 15px; }
  .btn-track { display: block; text-align: center; background: linear-gradient(135deg, #EBD8B2 0%, #C5A059 100%); color: #070D1E; font-weight: bold; text-decoration: none; padding: 14px 24px; border-radius: 10px; margin-top: 20px; }
  .footer { padding: 24px; text-align: center; font-size: 11px; color: #64748B; border-top: 1px solid rgba(255,255,255,0.08); background-color: #070D1E; }
</style>
</head>
<body>
<div style="padding: 24px 12px;">
  <div class="wrapper">
    <div class="header">
      <h1>SOM SING PHIM</h1>
      <p>PREMIUM PRINTING ATELIER</p>
    </div>
    <div class="content">
      <span class="badge">{{.StatusBadge}}</span>
      <div class="title">{{.StatusTitle}}</div>
      <div class="desc">{{.StatusDesc}}</div>

      <div class="card">
        <div class="card-row">
          <span class="card-label">ເລກທີຄຳສັ່ງຊື້ (Order No):</span>
          <span class="card-val">#{{.OrderNo}}</span>
        </div>
        <div class="card-row">
          <span class="card-label">ຊື່ລູກຄ້າ (Customer):</span>
          <span class="card-val">{{.CustomerName}}</span>
        </div>
        <div class="card-row">
          <span class="card-label">ລາຍການສິນຄ້າ (Item):</span>
          <span class="card-val">{{.ItemSummary}}</span>
        </div>
        <div class="card-row" style="border-top: 1px dashed rgba(255,255,255,0.1); padding-top: 10px; margin-top: 10px;">
          <span class="card-label">ຍອດຊຳລະທັງໝົດ:</span>
          <span class="card-val-gold">₭ {{printf "%.0f" .TotalAmountLAK}}</span>
        </div>
        {{if .TrackingNumber}}
        <div class="card-row">
          <span class="card-label">ເລກພັດສະດຸ (Tracking):</span>
          <span class="card-val" style="color: #38BDF8;">{{.TrackingNumber}} ({{.CourierName}})</span>
        </div>
        {{end}}
      </div>

      <a href="{{.TrackingURL}}" class="btn-track">🔍 ກວດສອບສະຖານະງານພິມແບບ Real-time</a>
    </div>
    <div class="footer">
      Som Sing Phim Atelier · Vientiane, Lao PDR · ໂທ: +856 20 5551 2345<br>
      © 2026 Som Sing Phim Printing ERP. All rights reserved.
    </div>
  </div>
</div>
</body>
</html>`

	tmpl, err := template.New("order_email").Parse(htmlTmpl)
	if err != nil {
		return "", "", err
	}

	type EmailTmplData struct {
		Subject        string
		StatusBadge    string
		StatusTitle    string
		StatusDesc     string
		StatusColor    string
		OrderNo        string
		CustomerName   string
		ItemSummary    string
		TotalAmountLAK float64
		TrackingNumber string
		CourierName    string
		TrackingURL    string
	}

	trackURL := data.TrackingURL
	if trackURL == "" {
		trackURL = fmt.Sprintf("https://somsingphim.la/track?orderId=%s", data.OrderNo)
	}

	tmplData := EmailTmplData{
		Subject:        subject,
		StatusBadge:    statusBadge,
		StatusTitle:    statusTitle,
		StatusDesc:     statusDesc,
		StatusColor:    statusColor,
		OrderNo:        data.OrderNo,
		CustomerName:   data.CustomerName,
		ItemSummary:    data.ItemSummary,
		TotalAmountLAK: data.TotalAmountLAK,
		TrackingNumber: data.TrackingNumber,
		CourierName:    data.CourierName,
		TrackingURL:    trackURL,
	}

	var buf bytes.Buffer
	if err := tmpl.Execute(&buf, tmplData); err != nil {
		return "", "", err
	}

	return subject, buf.String(), nil
}

// SendOrderStatusEmail sends an HTML notification email to the customer
func SendOrderStatusEmail(toEmail string, data OrderNotificationData) error {
	if strings.TrimSpace(toEmail) == "" {
		return fmt.Errorf("recipient email is empty")
	}

	cfg := GetEmailConfig()
	subject, bodyHTML, err := BuildOrderEmailHTML(data)
	if err != nil {
		return fmt.Errorf("failed to build email body: %w", err)
	}

	// In sandbox or unconfigured SMTP mode, log safely
	if cfg.Username == "" || cfg.Password == "" {
		fmt.Printf("[Email Service Mock] Sending email to: %s | Subject: %s\n", toEmail, subject)
		return nil
	}

	headers := make(map[string]string)
	headers["From"] = fmt.Sprintf("%s <%s>", cfg.FromName, cfg.From)
	headers["To"] = toEmail
	headers["Subject"] = subject
	headers["MIME-Version"] = "1.0"
	headers["Content-Type"] = "text/html; charset=UTF-8"

	var message string
	for k, v := range headers {
		message += fmt.Sprintf("%s: %s\r\n", k, v)
	}
	message += "\r\n" + bodyHTML

	auth := smtp.PlainAuth("", cfg.Username, cfg.Password, cfg.Host)
	addr := fmt.Sprintf("%s:%s", cfg.Host, cfg.Port)

	return smtp.SendMail(addr, auth, cfg.From, []string{toEmail}, []byte(message))
}
