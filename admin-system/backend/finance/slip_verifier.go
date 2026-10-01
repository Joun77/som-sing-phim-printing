package finance

import (
	"bytes"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
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
	TransRef  string  `json:"transRef"`
	TransDate string  `json:"transDate"`
	TransTime string  `json:"transTime"`
	Amount    float64 `json:"amount"`
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

// CallSlipOKAPI communicates with SlipOK API endpoint
func CallSlipOKAPI(qrPayload, slipImageBase64 string) (*SlipOKResponse, error) {
	apiKey := os.Getenv("SLIPOK_API_KEY")
	branchID := os.Getenv("SLIPOK_BRANCH_ID")
	apiURL := os.Getenv("SLIPOK_API_URL")

	if apiURL == "" {
		if branchID != "" {
			apiURL = fmt.Sprintf("https://api.slipok.com/api/line/apikey/%s", branchID)
		} else if apiKey != "" {
			apiURL = fmt.Sprintf("https://api.slipok.com/api/line/apikey/%s", apiKey)
		} else {
			apiURL = "https://api.slipok.com/api/line/apikey/"
		}
	}

	if strings.TrimSpace(apiKey) == "" || strings.TrimSpace(branchID) == "" {
		return nil, fmt.Errorf("automatic slip verification is not configured")
	}

	client := &http.Client{Timeout: 10 * time.Second}

	if qrPayload != "" {
		// Verify via QR Text Data
		reqBody, _ := json.Marshal(SlipOKRequest{
			Data: qrPayload,
			Log:  true,
		})

		httpReq, err := http.NewRequest("POST", apiURL, bytes.NewBuffer(reqBody))
		if err != nil {
			return nil, fmt.Errorf("failed to create http request: %w", err)
		}
		httpReq.Header.Set("Content-Type", "application/json")
		if apiKey != "" {
			httpReq.Header.Set("x-authorization", apiKey)
		}

		resp, err := client.Do(httpReq)
		if err != nil {
			return nil, fmt.Errorf("slipok request failed: %w", err)
		}
		defer resp.Body.Close()

		bodyBytes, _ := io.ReadAll(resp.Body)
		var slipRes SlipOKResponse
		if err := json.Unmarshal(bodyBytes, &slipRes); err != nil {
			return nil, fmt.Errorf("failed to parse slipok response: %w", err)
		}

		return &slipRes, nil
	}

	if slipImageBase64 != "" {
		// Handle base64 image or multipart
		imgData := slipImageBase64
		if idx := strings.Index(imgData, ","); idx != -1 {
			imgData = imgData[idx+1:]
		}
		decoded, err := base64.StdEncoding.DecodeString(imgData)
		if err != nil {
			return nil, fmt.Errorf("invalid base64 image: %w", err)
		}

		var body bytes.Buffer
		writer := multipart.NewWriter(&body)
		part, err := writer.CreateFormFile("files", "slip.jpg")
		if err != nil {
			return nil, fmt.Errorf("failed to create form file: %w", err)
		}
		if _, err := part.Write(decoded); err != nil {
			return nil, fmt.Errorf("failed to write file to form: %w", err)
		}
		_ = writer.WriteField("log", "true")
		_ = writer.Close()

		httpReq, err := http.NewRequest("POST", apiURL, &body)
		if err != nil {
			return nil, fmt.Errorf("failed to create multipart request: %w", err)
		}
		httpReq.Header.Set("Content-Type", writer.FormDataContentType())
		if apiKey != "" {
			httpReq.Header.Set("x-authorization", apiKey)
		}

		resp, err := client.Do(httpReq)
		if err != nil {
			return nil, fmt.Errorf("slipok multipart request failed: %w", err)
		}
		defer resp.Body.Close()

		bodyBytes, _ := io.ReadAll(resp.Body)
		var slipRes SlipOKResponse
		if err := json.Unmarshal(bodyBytes, &slipRes); err != nil {
			return nil, fmt.Errorf("failed to parse slipok multipart response: %w", err)
		}

		return &slipRes, nil
	}

	return nil, fmt.Errorf("neither qr_payload nor slip_image provided")
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
