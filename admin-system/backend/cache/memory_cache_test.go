package cache

import (
	"testing"
	"time"
)

func TestMemoryCache_GetSet(t *testing.T) {
	c := NewMemoryCache[string](50*time.Millisecond, 100*time.Millisecond)

	// Set and Get before expiry
	c.Set("greeting", "hello world")
	val, ok := c.Get("greeting")
	if !ok || val != "hello world" {
		t.Fatalf("Expected 'hello world', got '%s', ok=%v", val, ok)
	}

	// Wait for expiration
	time.Sleep(70 * time.Millisecond)
	_, ok = c.Get("greeting")
	if ok {
		t.Fatalf("Expected item to expire, but it was found")
	}
}

func TestMemoryCache_DeleteAndFlush(t *testing.T) {
	c := NewMemoryCache[int](1*time.Minute, 0)

	c.Set("k1", 100)
	c.Set("k2", 200)

	c.Delete("k1")
	if _, ok := c.Get("k1"); ok {
		t.Fatalf("Expected k1 to be deleted")
	}
	if v, ok := c.Get("k2"); !ok || v != 200 {
		t.Fatalf("Expected k2 to be 200, got %d", v)
	}

	c.Flush()
	if _, ok := c.Get("k2"); ok {
		t.Fatalf("Expected cache to be flushed")
	}
}
