package preflight

import (
	"image"
	"image/color"
	"image/png"
	"os"
	"path/filepath"
	"testing"
)

func TestAnalyzeImage(t *testing.T) {
	// Create a test PNG image (100x100 pixels with pure Cyan/Magenta/Yellow/Black quadrants)
	img := image.NewRGBA(image.Rect(0, 0, 100, 100))

	// Fill Q1 with pure Cyan (R=0, G=255, B=255)
	for y := 0; y < 50; y++ {
		for x := 0; x < 50; x++ {
			img.Set(x, y, color.RGBA{R: 0, G: 255, B: 255, A: 255})
		}
	}

	// Fill Q2 with pure Magenta (R=255, G=0, B=255)
	for y := 0; y < 50; y++ {
		for x := 50; x < 100; x++ {
			img.Set(x, y, color.RGBA{R: 255, G: 0, B: 255, A: 255})
		}
	}

	// Fill Q3 with pure Yellow (R=255, G=255, B=0)
	for y := 50; y < 100; y++ {
		for x := 0; x < 50; x++ {
			img.Set(x, y, color.RGBA{R: 255, G: 255, B: 0, A: 255})
		}
	}

	// Fill Q4 with pure Black (R=0, G=0, B=0)
	for y := 50; y < 100; y++ {
		for x := 50; x < 100; x++ {
			img.Set(x, y, color.RGBA{R: 0, G: 0, B: 0, A: 255})
		}
	}

	tempDir := t.TempDir()
	testFilePath := filepath.Join(tempDir, "test_cmyk_sample.png")
	f, err := os.Create(testFilePath)
	if err != nil {
		t.Fatalf("Failed to create test image: %v", err)
	}
	if err := png.Encode(f, img); err != nil {
		f.Close()
		t.Fatalf("Failed to encode test PNG: %v", err)
	}
	f.Close()

	// Analyze Image
	res, err := AnalyzeFile(testFilePath, "test_cmyk_sample.png")
	if err != nil {
		t.Fatalf("AnalyzeFile failed: %v", err)
	}

	if res.FileType != "IMAGE" {
		t.Errorf("Expected FileType IMAGE, got %s", res.FileType)
	}
	if res.TotalPages != 1 {
		t.Errorf("Expected TotalPages 1, got %d", res.TotalPages)
	}

	// Each quadrant is 25% of the total area -> expected ~25% each
	if res.AvgCovC < 20 || res.AvgCovC > 30 {
		t.Errorf("Expected AvgCovC ~25%%, got %.2f%%", res.AvgCovC)
	}
	if res.AvgCovM < 20 || res.AvgCovM > 30 {
		t.Errorf("Expected AvgCovM ~25%%, got %.2f%%", res.AvgCovM)
	}
	if res.AvgCovY < 20 || res.AvgCovY > 30 {
		t.Errorf("Expected AvgCovY ~25%%, got %.2f%%", res.AvgCovY)
	}
	if res.AvgCovK < 20 || res.AvgCovK > 30 {
		t.Errorf("Expected AvgCovK ~25%%, got %.2f%%", res.AvgCovK)
	}
}

func TestAnalyzeImageSkinToneGCR(t *testing.T) {
	// Create a test image with light human skin tone / beige (R=240, G=200, B=180)
	// Raw K is 1 - 240/255 = 0.0588 (5.88%), which is <= 25% threshold (Tk) -> GCR must produce K = 0%
	img := image.NewRGBA(image.Rect(0, 0, 50, 50))
	for y := 0; y < 50; y++ {
		for x := 0; x < 50; x++ {
			img.Set(x, y, color.RGBA{R: 240, G: 200, B: 180, A: 255})
		}
	}

	tempDir := t.TempDir()
	testFilePath := filepath.Join(tempDir, "test_skin_sample.png")
	f, err := os.Create(testFilePath)
	if err != nil {
		t.Fatalf("Failed to create test image: %v", err)
	}
	if err := png.Encode(f, img); err != nil {
		f.Close()
		t.Fatalf("Failed to encode test PNG: %v", err)
	}
	f.Close()

	res, err := AnalyzeFile(testFilePath, "test_skin_sample.png")
	if err != nil {
		t.Fatalf("AnalyzeFile failed: %v", err)
	}

	if res.AvgCovK != 0 {
		t.Errorf("Expected K=0%% for skin tone with GCR threshold 25%%, got %.2f%%", res.AvgCovK)
	}
	if res.AvgCovC > 10 {
		t.Errorf("Expected C <= 10%% for light skin tone, got %.2f%%", res.AvgCovC)
	}
	if res.AvgCovM < 10 || res.AvgCovM > 25 {
		t.Errorf("Expected M ~15-20%% for skin tone, got %.2f%%", res.AvgCovM)
	}
}
