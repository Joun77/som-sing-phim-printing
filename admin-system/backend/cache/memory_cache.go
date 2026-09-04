package cache

import (
	"sync"
	"time"
)

// Item represents a cached item with an expiration time
type Item[T any] struct {
	Value     T
	ExpiresAt time.Time
}

// MemoryCache is a generic, thread-safe in-memory cache with TTL support
type MemoryCache[T any] struct {
	mu    sync.RWMutex
	items map[string]Item[T]
	ttl   time.Duration
}

// NewMemoryCache creates a new in-memory cache with the specified default TTL and cleanup interval
func NewMemoryCache[T any](ttl time.Duration, cleanupInterval time.Duration) *MemoryCache[T] {
	c := &MemoryCache[T]{
		items: make(map[string]Item[T]),
		ttl:   ttl,
	}

	if cleanupInterval > 0 {
		go c.startCleanup(cleanupInterval)
	}

	return c
}

// Get retrieves a value from the cache by key. Returns (zeroValue, false) if not found or expired.
func (c *MemoryCache[T]) Get(key string) (T, bool) {
	c.mu.RLock()
	defer c.mu.RUnlock()

	item, found := c.items[key]
	if !found {
		var zero T
		return zero, false
	}

	if time.Now().After(item.ExpiresAt) {
		var zero T
		return zero, false
	}

	return item.Value, true
}

// Set stores a value in the cache with the default TTL
func (c *MemoryCache[T]) Set(key string, value T) {
	c.SetWithTTL(key, value, c.ttl)
}

// SetWithTTL stores a value in the cache with a custom TTL
func (c *MemoryCache[T]) SetWithTTL(key string, value T, customTTL time.Duration) {
	c.mu.Lock()
	defer c.mu.Unlock()

	c.items[key] = Item[T]{
		Value:     value,
		ExpiresAt: time.Now().Add(customTTL),
	}
}

// Delete removes an item from the cache
func (c *MemoryCache[T]) Delete(key string) {
	c.mu.Lock()
	defer c.mu.Unlock()
	delete(c.items, key)
}

// Flush removes all items from the cache
func (c *MemoryCache[T]) Flush() {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.items = make(map[string]Item[T])
}

// startCleanup periodically removes expired items
func (c *MemoryCache[T]) startCleanup(interval time.Duration) {
	ticker := time.NewTicker(interval)
	for range ticker.C {
		c.mu.Lock()
		now := time.Now()
		for k, v := range c.items {
			if now.After(v.ExpiresAt) {
				delete(c.items, k)
			}
		}
		c.mu.Unlock()
	}
}
