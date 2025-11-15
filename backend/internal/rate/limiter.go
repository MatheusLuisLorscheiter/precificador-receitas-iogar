package rate

import (
	"context"
	"fmt"
	"time"

	"github.com/redis/go-redis/v9"
)

// Limiter implementa rate limiting baseado em Redis com janela deslizante.
type Limiter struct {
	client *redis.Client
}

func NewLimiter(client *redis.Client) *Limiter {
	return &Limiter{client: client}
}

// Allow valida se ainda há crédito disponível para a chave informada.
func (l *Limiter) Allow(ctx context.Context, key string, limit int, window time.Duration) (bool, error) {
	script := redis.NewScript(`
	local current
	current = redis.call('INCR', KEYS[1])
	if tonumber(current) == 1 then
	  redis.call('PEXPIRE', KEYS[1], ARGV[2])
	end
	if tonumber(current) > tonumber(ARGV[1]) then
	  return 0
	end
	return tonumber(current)
	`)

	ms := window.Milliseconds()
	result, err := script.Run(ctx, l.client, []string{fmt.Sprintf("rate:%s", key)}, limit, ms).Result()
	if err != nil {
		return false, err
	}

	allowed, ok := result.(int64)
	if !ok {
		return false, nil
	}

	return allowed > 0, nil
}
