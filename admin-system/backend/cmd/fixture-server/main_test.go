package main

import (
	"bytes"
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"mime/multipart"
	"net"
	"net/http"
	"net/http/httptest"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strconv"
	"strings"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"somsing.local/backend/auth"
)

func setupTestFixtureRouter(t *testing.T) (*gin.Engine, string, string) {
	t.Helper()
	tempDir := t.TempDir()
	t.Setenv("UPLOAD_STORAGE_DIR", tempDir)

	// Generate dedicated random fixture secret
	randBytes := make([]byte, 32)
	_, _ = rand.Read(randBytes)
	secret := hex.EncodeToString(randBytes)
	t.Setenv("JWT_SECRET", secret)
	t.Setenv("ENVIRONMENT", "test")

	if err := SeedFixtureAssets(tempDir); err != nil {
		t.Fatalf("failed to seed fixture assets: %v", err)
	}

	router := BuildFixtureEngine(tempDir, "8089", nil)

	// Fetch token
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/fixture/token", nil)
	router.ServeHTTP(w, req)
	var tokenResp struct {
		Token string `json:"token"`
	}
	_ = json.Unmarshal(w.Body.Bytes(), &tokenResp)

	return router, tempDir, tokenResp.Token
}

func TestDisposableFixtureServer_Endpoints(t *testing.T) {
	router, tempDir, token := setupTestFixtureRouter(t)

	t.Run("Health endpoint returns status ready and storage dir", func(t *testing.T) {
		w := httptest.NewRecorder()
		req, _ := http.NewRequest("GET", "/fixture/health", nil)
		router.ServeHTTP(w, req)

		if w.Code != http.StatusOK {
			t.Fatalf("expected 200, got %d", w.Code)
		}
		var resp map[string]interface{}
		_ = json.Unmarshal(w.Body.Bytes(), &resp)
		if resp["status"] != "ready" || resp["storage_dir"] != tempDir {
			t.Errorf("unexpected health response: %v", resp)
		}
	})

	t.Run("Anonymous access to private artwork returns 401", func(t *testing.T) {
		w := httptest.NewRecorder()
		req, _ := http.NewRequest("GET", "/uploads/artworks/single_master.jpg", nil)
		router.ServeHTTP(w, req)

		if w.Code != http.StatusUnauthorized {
			t.Fatalf("expected 401 Unauthorized for anonymous, got %d", w.Code)
		}
	})

	t.Run("Authenticated access to JPEG returns 200 and image/jpeg", func(t *testing.T) {
		w := httptest.NewRecorder()
		req, _ := http.NewRequest("GET", "/uploads/artworks/single_master.jpg", nil)
		req.Header.Set("Authorization", "Bearer "+token)
		router.ServeHTTP(w, req)

		if w.Code != http.StatusOK {
			t.Fatalf("expected 200, got %d", w.Code)
		}
		if !strings.Contains(w.Header().Get("Content-Type"), "image/jpeg") {
			t.Errorf("expected Content-Type image/jpeg, got %s", w.Header().Get("Content-Type"))
		}
	})

	t.Run("Authenticated access to PDF returns 200 and application/pdf", func(t *testing.T) {
		w := httptest.NewRecorder()
		req, _ := http.NewRequest("GET", "/uploads/artworks/sample_document.pdf", nil)
		req.Header.Set("Authorization", "Bearer "+token)
		router.ServeHTTP(w, req)

		if w.Code != http.StatusOK {
			t.Fatalf("expected 200, got %d", w.Code)
		}
		if !strings.Contains(w.Header().Get("Content-Type"), "application/pdf") {
			t.Errorf("expected Content-Type application/pdf, got %s", w.Header().Get("Content-Type"))
		}
	})

	t.Run("Simulate HTML fallback returns 200 and text/html (SPA fallback simulation)", func(t *testing.T) {
		w := httptest.NewRecorder()
		req, _ := http.NewRequest("GET", "/fixture/simulate-html-fallback", nil)
		router.ServeHTTP(w, req)

		if w.Code != http.StatusOK {
			t.Fatalf("expected 200, got %d", w.Code)
		}
		if !strings.Contains(w.Header().Get("Content-Type"), "text/html") {
			t.Errorf("expected Content-Type text/html, got %s", w.Header().Get("Content-Type"))
		}
		if !strings.Contains(w.Body.String(), "<!DOCTYPE html>") {
			t.Errorf("expected body to contain DOCTYPE html, got %s", w.Body.String())
		}
	})

	t.Run("Access to restricted file returns 403 Forbidden", func(t *testing.T) {
		w := httptest.NewRecorder()
		req, _ := http.NewRequest("GET", "/uploads/artworks/restricted_failure.pdf", nil)
		req.Header.Set("Authorization", "Bearer "+token)
		router.ServeHTTP(w, req)

		if w.Code != http.StatusForbidden {
			t.Fatalf("expected 403 Forbidden, got %d", w.Code)
		}
	})

	t.Run("Upload valid PDF artwork succeeds with 200", func(t *testing.T) {
		body := &bytes.Buffer{}
		writer := multipart.NewWriter(body)
		part, _ := writer.CreateFormFile("file", "valid_doc.pdf")
		_, _ = part.Write(makeValidPDF("Valid Upload Test"))
		_ = writer.Close()

		w := httptest.NewRecorder()
		req, _ := http.NewRequest("POST", "/api/upload/artwork", body)
		req.Header.Set("Content-Type", writer.FormDataContentType())
		req.Header.Set("Authorization", "Bearer "+token)
		router.ServeHTTP(w, req)

		if w.Code != http.StatusOK {
			t.Fatalf("expected 200 for valid upload, got %d: %s", w.Code, w.Body.String())
		}
		var resp map[string]interface{}
		_ = json.Unmarshal(w.Body.Bytes(), &resp)
		if resp["status"] != "success" || resp["assetId"] == "" {
			t.Errorf("expected success with assetId, got %v", resp)
		}
	})

	t.Run("Upload disguised file is rejected with 400 Bad Request", func(t *testing.T) {
		body := &bytes.Buffer{}
		writer := multipart.NewWriter(body)
		part, _ := writer.CreateFormFile("file", "malware.pdf")
		_, _ = part.Write([]byte("MZ\x90\x00\x03\x00\x00FakeDisguisedExecutable"))
		_ = writer.Close()

		w := httptest.NewRecorder()
		req, _ := http.NewRequest("POST", "/api/upload/artwork", body)
		req.Header.Set("Content-Type", writer.FormDataContentType())
		req.Header.Set("Authorization", "Bearer "+token)
		router.ServeHTTP(w, req)

		if w.Code != http.StatusBadRequest {
			t.Fatalf("expected 400 Bad Request for disguised file, got %d: %s", w.Code, w.Body.String())
		}
	})
}

// computeSHA256 returns hex encoded sha256 checksum of a file
func computeSHA256(filePath string) (string, error) {
	f, err := os.Open(filePath)
	if err != nil {
		return "", err
	}
	defer f.Close()
	h := sha256.New()
	if _, err := io.Copy(h, f); err != nil {
		return "", err
	}
	return hex.EncodeToString(h.Sum(nil)), nil
}

// TestActualMainBinaryStartupAndTeardown tests the real compiled main binary execution
// launched from an isolated external working directory with whitelisted environment.
func TestActualMainBinaryStartupAndTeardown(t *testing.T) {
	// 1. Locate explicit absolute repository and package paths
	_, thisFile, _, ok := runtime.Caller(0)
	if !ok {
		t.Fatalf("failed to determine test file location via runtime.Caller")
	}
	fixturePkgDir := filepath.Dir(thisFile)
	backendDir := filepath.Clean(filepath.Join(fixturePkgDir, "..", ".."))
	couriersPath := filepath.Join(backendDir, "couriers_data.json")
	paymentPath := filepath.Join(backendDir, "payment_methods_data.json")

	// Snapshot repository JSON files before execution — MUST FAIL ON ERROR!
	courierHashBefore, err := computeSHA256(couriersPath)
	if err != nil {
		t.Fatalf("failed to compute hash of couriers_data.json before test: %v", err)
	}
	if courierHashBefore == "" {
		t.Fatalf("courierHashBefore computed to empty string")
	}
	paymentHashBefore, err := computeSHA256(paymentPath)
	if err != nil {
		t.Fatalf("failed to compute hash of payment_methods_data.json before test: %v", err)
	}
	if paymentHashBefore == "" {
		t.Fatalf("paymentHashBefore computed to empty string")
	}

	// 2. Compile fixture server binary into t.TempDir() using explicit backendDir and package path
	binDir := t.TempDir()
	binPath := filepath.Join(binDir, "fixture_server_runner.bin")
	buildCmd := exec.Command("go", "build", "-o", binPath, "./cmd/fixture-server")
	buildCmd.Dir = backendDir // runs with explicit backendDir containing go.mod
	if out, err := buildCmd.CombinedOutput(); err != nil {
		t.Fatalf("failed to compile fixture-server binary: %v\nOutput: %s", err, string(out))
	}

	// 3. Allocate a dynamic, reviewer-owned loopback port
	listener, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatalf("failed to allocate dynamic loopback port: %v", err)
	}
	testPort := strconv.Itoa(listener.Addr().(*net.TCPAddr).Port)
	_ = listener.Close()

	// 4. Setup clean external working directory
	isolatedCwd := t.TempDir()

	runCmd := exec.Command(binPath, "-port", testPort)
	runCmd.Dir = isolatedCwd
	// Whitelisted environment only: never inherit shop secrets or live config
	runCmd.Env = []string{
		"PATH=" + os.Getenv("PATH"),
		"HOME=" + os.Getenv("HOME"),
		"ENVIRONMENT=test",
	}

	var stdout, stderr bytes.Buffer
	runCmd.Stdout = &stdout
	runCmd.Stderr = &stderr

	if err := runCmd.Start(); err != nil {
		t.Fatalf("failed to start fixture-server process: %v", err)
	}

	// Ensure process is killed on test exit if teardown fails
	defer func() {
		if runCmd.Process != nil {
			_ = runCmd.Process.Kill()
		}
	}()

	// 5. Poll health endpoint until server is ready
	healthURL := fmt.Sprintf("http://127.0.0.1:%s/fixture/health", testPort)
	tokenURL := fmt.Sprintf("http://127.0.0.1:%s/fixture/token", testPort)
	teardownURL := fmt.Sprintf("http://127.0.0.1:%s/fixture/teardown", testPort)

	var healthResp map[string]interface{}
	ready := false
	for i := 0; i < 30; i++ {
		time.Sleep(100 * time.Millisecond)
		resp, err := http.Get(healthURL)
		if err == nil && resp.StatusCode == http.StatusOK {
			_ = json.NewDecoder(resp.Body).Decode(&healthResp)
			_ = resp.Body.Close()
			ready = true
			break
		}
		if resp != nil {
			_ = resp.Body.Close()
		}
	}

	if !ready {
		t.Fatalf("fixture-server failed to become ready on %s within 3s.\nStdout: %s\nStderr: %s", healthURL, stdout.String(), stderr.String())
	}

	if healthResp["status"] != "ready" {
		t.Errorf("expected health status 'ready', got: %v", healthResp["status"])
	}
	storageDir, _ := healthResp["storage_dir"].(string)
	if storageDir == "" || !strings.Contains(storageDir, "somsing-disposable-fixture-") {
		t.Errorf("expected isolated storage directory in /tmp, got: %s", storageDir)
	}

	// 6. Test token issuance
	tokenResp, err := http.Get(tokenURL)
	if err != nil || tokenResp.StatusCode != http.StatusOK {
		t.Fatalf("failed to get token from running process: %v (code %d)", err, tokenResp.StatusCode)
	}
	var tokenData struct {
		Token string `json:"token"`
		Role  string `json:"role"`
	}
	_ = json.NewDecoder(tokenResp.Body).Decode(&tokenData)
	_ = tokenResp.Body.Close()

	if tokenData.Token == "" || tokenData.Role != auth.RolePrepress {
		t.Errorf("unexpected token data: %+v", tokenData)
	}

	// 7. Test protected file fetch via Bearer token
	docURL := fmt.Sprintf("http://127.0.0.1:%s/uploads/artworks/sample_document.pdf", testPort)
	req, _ := http.NewRequest("GET", docURL, nil)
	req.Header.Set("Authorization", "Bearer "+tokenData.Token)
	client := &http.Client{Timeout: 2 * time.Second}
	docResp, err := client.Do(req)
	if err != nil || docResp.StatusCode != http.StatusOK {
		t.Fatalf("failed to fetch protected document: %v", err)
	}
	_ = docResp.Body.Close()

	// 8. Request graceful teardown
	teardownResp, err := http.Post(teardownURL, "application/json", nil)
	if err != nil || teardownResp.StatusCode != http.StatusOK {
		t.Fatalf("failed to request teardown: %v", err)
	}
	_ = teardownResp.Body.Close()

	// Wait for process to exit cleanly
	err = runCmd.Wait()
	if err != nil {
		t.Fatalf("process exited with error after teardown: %v\nStdout: %s\nStderr: %s", err, stdout.String(), stderr.String())
	}

	// 9. Verify repository JSON files were NOT touched (fail on error!)
	courierHashAfter, err := computeSHA256(couriersPath)
	if err != nil {
		t.Fatalf("failed to compute hash of couriers_data.json after run: %v", err)
	}
	paymentHashAfter, err := computeSHA256(paymentPath)
	if err != nil {
		t.Fatalf("failed to compute hash of payment_methods_data.json after run: %v", err)
	}

	if courierHashBefore != courierHashAfter {
		t.Fatalf("repository couriers_data.json was modified during test! Before: %s, After: %s", courierHashBefore, courierHashAfter)
	}
	if paymentHashBefore != paymentHashAfter {
		t.Fatalf("repository payment_methods_data.json was modified during test! Before: %s, After: %s", paymentHashBefore, paymentHashAfter)
	}
}
