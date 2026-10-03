package finance

import (
	"bytes"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"github.com/shopspring/decimal"
	"io"
	"mime/multipart"
	"net/http"
	"net/url"
	"os"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

// SlipOKRequest represents payload sent to SlipOK API
type SlipOKRequest struct {
	Data   string  `json:"data,omitempty"`
	Amount float64 `json:"amount,omitempty"`
	Log    bool    `json:"log,omitempty"`
}

// SlipOKResponse represents standard response structure from SlipOK API
type SlipOKResponse struct {
	Success bool           `json:"success"`
	Code    int            `json:"code,omitempty"`
	Message string         `json:"message,omitempty"`
	Data    SlipOKDataBody `json:"data"`
}

// SlipOKDataBody holds verified transaction details
type SlipOKDataBody struct {
	TransRef  string          `json:"transRef"`
	TransDate string          `json:"transDate"`
	TransTime string          `json:"transTime"`
	Amount    decimal.Decimal `json:"amount"`
	Currency  string          `json:"currency"`
	Sender    struct {
		Bank struct {
			Name string `json:"name"`
			ID   string `json:"id"`
		} `json:"bank"`
		Account struct {
			Name struct {
				TH string `json:"th"`
				EN string `json:"en"`
			} `json:"name"`
			BankNumber string `json:"bankNumber"`
		} `json:"account"`
	} `json:"sender"`
	Receiver struct {
		Bank struct {
			Name string `json:"name"`
			ID   string `json:"id"`
		} `json:"bank"`
		Account struct {
			Name struct {
				TH string `json:"th"`
				EN string `json:"en"`
			} `json:"name"`
			BankNumber string `json:"bankNumber"`
		} `json:"account"`
	} `json:"receiver"`
}

// VerifySlipRequest represents checkout verify request from Storefront / Admin
type VerifySlipRequest struct {
	OrderID   string   `json:"order_id" binding:"required"`
	QRPayload string   `json:"qr_payload"`
	SlipImage string   `json:"slip_image"` // Base64 encoded or data URL
	Amount    *float64 `json:"amount"`     // Optional override/test amount
	TransRef  string   `json:"trans_ref"`
}

// VerifySlipResponse represents output after slip verification
type VerifySlipResponse struct {
	Status     string  `json:"status"`
	Message    string  `json:"message"`
	OrderID    string  `json:"order_id"`
	NewStatus  string  `json:"new_status"`
	TransRef   string  `json:"trans_ref,omitempty"`
	Amount     float64 `json:"amount,omitempty"`
	VerifiedAt string  `json:"verified_at,omitempty"`
}

// SlipExpectation must come from trusted order/payment configuration, never client overrides.
type SlipExpectation struct {
	Amount          decimal.Decimal
	ReceiverAccount string
	Currency        string
}

var slipProviderClient = &http.Client{Timeout: 10 * time.Second, CheckRedirect: func(_ *http.Request, _ []*http.Request) error { return http.ErrUseLastResponse }}

// CallSlipOKAPI verifies provider evidence only. It never approves or records money.
// Automatic checkout remains manual-review-only, including valid provider evidence.
func CallSlipOKAPI(qrPayload, slipImageBase64 string, expected ...SlipExpectation) (*SlipOKResponse, error) {
	apiKey := strings.TrimSpace(os.Getenv("SLIPOK_API_KEY"))
	branchID := strings.TrimSpace(os.Getenv("SLIPOK_BRANCH_ID"))
	if apiKey == "" || branchID == "" {
		return nil, errors.New("automatic slip verification is not configured")
	}
	if len(expected) != 1 || !expected[0].Amount.IsPositive() || strings.TrimSpace(expected[0].ReceiverAccount) == "" || strings.TrimSpace(expected[0].Currency) == "" {
		return nil, errors.New("trusted amount, receiver and currency are required")
	}
	apiURL := os.Getenv("SLIPOK_API_URL")
	if apiURL == "" {
		apiURL = "https://api.slipok.com/api/line/apikey/" + url.PathEscape(branchID)
	}
	parsed, err := url.Parse(apiURL)
	if err != nil || parsed.Host == "" || parsed.User != nil {
		return nil, errors.New("invalid slip provider URL")
	}
	testLoopback := os.Getenv("ENVIRONMENT") == "test" && parsed.Scheme == "http" && (parsed.Hostname() == "127.0.0.1" || parsed.Hostname() == "localhost")
	if parsed.Scheme != "https" && !testLoopback {
		return nil, errors.New("slip provider requires HTTPS")
	}
	var body io.Reader
	contentType := "application/json"
	if qrPayload != "" {
		payload, err := json.Marshal(SlipOKRequest{Data: qrPayload, Log: true})
		if err != nil {
			return nil, err
		}
		body = bytes.NewReader(payload)
	} else if slipImageBase64 != "" {
		if len(slipImageBase64) > 12*1024*1024 {
			return nil, errors.New("slip image too large")
		}
		image := slipImageBase64
		if idx := strings.Index(image, ","); idx != -1 {
			image = image[idx+1:]
		}
		decoded, err := base64.StdEncoding.DecodeString(image)
		if err != nil || len(decoded) == 0 {
			return nil, errors.New("invalid slip image")
		}
		var buffer bytes.Buffer
		writer := multipart.NewWriter(&buffer)
		part, err := writer.CreateFormFile("files", "slip.jpg")
		if err != nil {
			return nil, err
		}
		if _, err = part.Write(decoded); err != nil {
			return nil, err
		}
		if err = writer.WriteField("log", "true"); err != nil {
			return nil, err
		}
		if err = writer.Close(); err != nil {
			return nil, err
		}
		body = &buffer
		contentType = writer.FormDataContentType()
	} else {
		return nil, errors.New("neither qr_payload nor slip_image provided")
	}
	request, err := http.NewRequest(http.MethodPost, apiURL, body)
	if err != nil {
		return nil, err
	}
	request.Header.Set("Content-Type", contentType)
	request.Header.Set("x-authorization", apiKey)
	response, err := slipProviderClient.Do(request)
	if err != nil {
		return nil, fmt.Errorf("slip provider unavailable: %w", err)
	}
	defer response.Body.Close()
	if response.StatusCode != http.StatusOK {
		return nil, errors.New("slip provider rejected request")
	}
	raw, err := io.ReadAll(io.LimitReader(response.Body, 1024*1024+1))
	if err != nil || len(raw) > 1024*1024 {
		return nil, errors.New("invalid slip provider response")
	}
	var result SlipOKResponse
	if err = json.Unmarshal(raw, &result); err != nil {
		return nil, errors.New("invalid slip provider response")
	}
	e := expected[0]
	if !result.Success || strings.TrimSpace(result.Data.TransRef) == "" || !result.Data.Amount.IsPositive() || !result.Data.Amount.Equal(e.Amount) || result.Data.Receiver.Account.BankNumber != e.ReceiverAccount || result.Data.Currency != e.Currency {
		return nil, errors.New("slip evidence does not match trusted payment details")
	}
	return &result, nil
}

// HandleVerifySlip retains the legacy endpoint without approving money automatically.
// The shop uses staff review of its own QR slips, not a bank/provider gateway.
func HandleVerifySlip(c *gin.Context) {
	var req VerifySlipRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"status": "error", "message": "Invalid request payload"})
		return
	}
	c.JSON(http.StatusConflict, gin.H{
		"status":   "manual_review_required",
		"message":  "Payment slips require authorized staff review",
		"order_id": req.OrderID,
	})
}
