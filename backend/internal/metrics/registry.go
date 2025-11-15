package metrics

import (
	"github.com/prometheus/client_golang/prometheus"
)

// Registry mantém métricas customizadas utilizadas no serviço.
type Registry struct {
	HTTPRequests *prometheus.CounterVec
	HTTPLatency  *prometheus.HistogramVec
	PricingCache *prometheus.CounterVec
}

// NewRegistry registra e retorna as métricas padrão do backend.
func NewRegistry() *Registry {
	reg := &Registry{
		HTTPRequests: prometheus.NewCounterVec(prometheus.CounterOpts{
			Name: "http_requests_total",
			Help: "Total de requisições HTTP",
		}, []string{"method", "path", "status"}),
		HTTPLatency: prometheus.NewHistogramVec(prometheus.HistogramOpts{
			Name:    "http_request_duration_seconds",
			Help:    "Duração das requisições HTTP",
			Buckets: prometheus.DefBuckets,
		}, []string{"method", "path"}),
		PricingCache: prometheus.NewCounterVec(prometheus.CounterOpts{
			Name: "pricing_cache_events_total",
			Help: "Contabiliza hits/misses do cache de precificação",
		}, []string{"event"}),
	}

	prometheus.MustRegister(reg.HTTPRequests, reg.HTTPLatency, reg.PricingCache)

	return reg
}
