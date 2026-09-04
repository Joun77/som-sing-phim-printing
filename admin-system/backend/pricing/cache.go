package pricing

import (
	"sync"
	"time"
)

// CachedPricingItem stores calculated pricing result with expiration
type CachedPricingItem struct {
	Result    CalculationResponse
	CachedAt  time.Time
	ExpiresAt time.Time
}

// PricingMemoryCache provides fast in-memory caching to avoid redundant DB calculations
type PricingMemoryCache struct {
	mu    sync.RWMutex
	items map[string]CachedPricingItem
	ttl   time.Duration
}

var (
	GlobalPricingCache = NewPricingMemoryCache(5 * time.Minute)
)

func NewPricingMemoryCache(ttl time.Duration) *PricingMemoryCache {
	c := &PricingMemoryCache{
		items: make(map[string]CachedPricingItem),
		ttl:   ttl,
	}
	// Background cleanup routine
	go c.startCleanup(10 * time.Minute)
	return c
}

func (c *PricingMemoryCache) Get(cacheKey string) (CalculationResponse, bool) {
	c.mu.RLock()
	defer c.mu.RUnlock()

	item, found := c.items[cacheKey]
	if !found {
		return CalculationResponse{}, false
	}
	if time.Now().After(item.ExpiresAt) {
		return CalculationResponse{}, false
	}
	return item.Result, true
}

func (c *PricingMemoryCache) Set(cacheKey string, result CalculationResponse) {
	c.mu.Lock()
	defer c.mu.Unlock()

	c.items[cacheKey] = CachedPricingItem{
		Result:    result,
		CachedAt:  time.Now(),
		ExpiresAt: time.Now().Add(c.ttl),
	}
}

func (c *PricingMemoryCache) Invalidate() {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.items = make(map[string]CachedPricingItem)
}

func (c *PricingMemoryCache) startCleanup(interval time.Duration) {
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
