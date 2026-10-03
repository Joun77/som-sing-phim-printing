package finance

import (
	"context"
	"encoding/json"
	"errors"
	"github.com/shopspring/decimal"
	"io"
	"net/http"
	"strings"
	"testing"
	"time"
)

type fixtureSlipTransport func(*http.Request) (*http.Response, error)

func (f fixtureSlipTransport) RoundTrip(r *http.Request) (*http.Response, error) { return f(r) }

func TestSlipProviderContract(t *testing.T) {
	for _, name := range []string{"valid QR", "valid image", "missing config", "missing trusted expectation", "timeout", "transport failure", "non2xx", "rejection", "zero amount", "amount mismatch", "receiver mismatch", "currency mismatch", "missing currency", "missing reference", "malformed", "read failure", "oversize", "empty image", "invalid image", "missing evidence", "unsafe URL"} {
		t.Run(name, func(t *testing.T) {
			t.Setenv("SLIPOK_API_KEY", "fixture-api-key")
			t.Setenv("SLIPOK_BRANCH_ID", "fixture-branch")
			t.Setenv("SLIPOK_API_URL", "https://fixture.invalid/slip")
			old := slipProviderClient
			t.Cleanup(func() { slipProviderClient = old })
			data := map[string]any{"transRef": "fixture-bank-reference", "amount": "1500.25", "currency": "LAK", "receiver": map[string]any{"account": map[string]any{"bankNumber": "fixture-shop-account"}}}
			response := map[string]any{"success": true, "data": data}
			status := 200
			switch name {
			case "missing config":
				t.Setenv("SLIPOK_API_KEY", "")
			case "non2xx":
				status = 500
			case "rejection":
				response["success"] = false
			case "zero amount":
				data["amount"] = 0
			case "amount mismatch":
				data["amount"] = "1500.24"
			case "receiver mismatch":
				data["receiver"] = map[string]any{"account": map[string]any{"bankNumber": "other-account"}}
			case "currency mismatch":
				data["currency"] = "THB"
			case "missing currency":
				delete(data, "currency")
			case "missing reference":
				data["transRef"] = " "
			case "unsafe URL":
				t.Setenv("SLIPOK_API_URL", "http://remote.invalid/slip")
			}
			calls := 0
			slipProviderClient = &http.Client{Timeout: 5 * time.Millisecond, Transport: fixtureSlipTransport(func(req *http.Request) (*http.Response, error) {
				calls++
				if req.Header.Get("x-authorization") != "fixture-api-key" {
					t.Fatal("fixture auth missing")
				}
				if name == "timeout" {
					<-req.Context().Done()
					return nil, req.Context().Err()
				}
				if name == "transport failure" {
					return nil, errors.New("fixture transport failure")
				}
				raw, _ := json.Marshal(response)
				if name == "malformed" {
					raw = []byte(`{"success":true`)
				}
				if name == "oversize" {
					raw = []byte(strings.Repeat("x", 1024*1024+1))
				}
				var body io.ReadCloser = io.NopCloser(strings.NewReader(string(raw)))
				if name == "read failure" {
					body = fixtureReadFailure{}
				}
				if name == "valid image" {
					if !strings.HasPrefix(req.Header.Get("Content-Type"), "multipart/form-data") {
						t.Fatal("expected real multipart image")
					}
				} else if req.Header.Get("Content-Type") != "application/json" {
					t.Fatal("expected real QR JSON")
				}
				return &http.Response{StatusCode: status, Header: http.Header{}, Body: body}, nil
			})}
			expected := []SlipExpectation{{Amount: decimal.RequireFromString("1500.25"), ReceiverAccount: "fixture-shop-account", Currency: "LAK"}}
			if name == "missing trusted expectation" {
				expected = nil
			}
			qr, image := "fixture-qr", ""
			if name == "valid image" {
				qr = ""
				image = "data:image/jpeg;base64,Zml4dHVyZS1pbWFnZQ=="
			}
			if name == "empty image" {
				qr = ""
				image = "data:image/jpeg;base64,"
			}
			if name == "invalid image" {
				qr = ""
				image = "not-base64"
			}
			if name == "missing evidence" {
				qr = ""
			}
			got, err := CallSlipOKAPI(qr, image, expected...)
			valid := name == "valid QR" || name == "valid image"
			if valid {
				if err != nil || got == nil || got.Data.TransRef != "fixture-bank-reference" || !got.Data.Amount.Equal(expected[0].Amount) {
					t.Fatalf("valid fixture rejected: %v", err)
				}
			} else if err == nil || got != nil {
				t.Fatal("invalid evidence accepted")
			}
			if name == "timeout" && !errors.Is(err, context.DeadlineExceeded) {
				t.Fatalf("timeout not propagated: %v", err)
			}
			if (name == "missing config" || name == "missing trusted expectation" || name == "unsafe URL") && calls != 0 {
				t.Fatal("fail-closed preflight made network call")
			}
		})
	}
}

type fixtureReadFailure struct{}

func (fixtureReadFailure) Read([]byte) (int, error) { return 0, io.ErrUnexpectedEOF }
func (fixtureReadFailure) Close() error             { return nil }
