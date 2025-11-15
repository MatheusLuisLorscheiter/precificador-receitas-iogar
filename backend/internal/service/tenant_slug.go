package service

import (
	"context"
	"crypto/rand"
	"errors"
	"fmt"
	"math/big"
	"strings"

	"github.com/MatheusLuisLorscheiter/precificador-receitas-iogar/backend/internal/domain"
	"github.com/MatheusLuisLorscheiter/precificador-receitas-iogar/backend/internal/repository"
)

// ensureTenantSlug generates a unique slug for the given tenant following the strategy:
// 1. Company name (or provided slug)
// 2. Company name + user name
// 3. Company name + 4 random digits (repeated until unique)
func ensureTenantSlug(ctx context.Context, repo *repository.Store, tenant *domain.Tenant, userName string) error {
    tenant.Name = strings.TrimSpace(tenant.Name)

    baseSlugSource := tenant.Slug
    if baseSlugSource == "" {
        baseSlugSource = tenant.Name
    }

    baseSlug := repository.Slugify(baseSlugSource)
    if baseSlug == "" {
        return errors.New("não foi possível gerar slug para o tenant: nome inválido")
    }

    var candidates []string
    candidates = append(candidates, baseSlug)

    if user := strings.TrimSpace(userName); user != "" {
        userSlug := repository.Slugify(fmt.Sprintf("%s %s", tenant.Name, user))
        if userSlug != "" && userSlug != baseSlug {
            candidates = append(candidates, userSlug)
        }
    }

    for _, candidate := range candidates {
        available, err := tenantSlugAvailable(ctx, repo, candidate)
        if err != nil {
            return err
        }
        if available {
            tenant.Slug = candidate
            return nil
        }
    }

    for {
        randDigits, err := randomDigits()
        if err != nil {
            return err
        }
        candidate := repository.Slugify(fmt.Sprintf("%s %s", tenant.Name, randDigits))
        if candidate == "" {
            continue
        }
        available, err := tenantSlugAvailable(ctx, repo, candidate)
        if err != nil {
            return err
        }
        if available {
            tenant.Slug = candidate
            return nil
        }
    }
}

func tenantSlugAvailable(ctx context.Context, repo *repository.Store, slug string) (bool, error) {
    _, err := repo.GetTenantBySlug(ctx, slug)
    if errors.Is(err, repository.ErrNotFound) {
        return true, nil
    }
    if err != nil {
        return false, err
    }
    return false, nil
}

func randomDigits() (string, error) {
    n, err := rand.Int(rand.Reader, big.NewInt(10000))
    if err != nil {
        return "", err
    }
    return fmt.Sprintf("%04d", n.Int64()), nil
}
