package storage

import (
	"context"
	"fmt"
	"io"
	"net/url"
	"time"

	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"
)

// Client encapsula o cliente MinIO e metadados relevantes.
type Client struct {
	client     *minio.Client
	bucket     string
	endpoint   string
	presignTTL time.Duration
}

// New cria um cliente configurado para MinIO ou qualquer S3 compatível.
func New(endpoint, accessKey, secretKey, bucket, region string, useSSL bool, presignTTL time.Duration) (*Client, error) {
	opts := &minio.Options{
		Creds:  credentials.NewStaticV4(accessKey, secretKey, ""),
		Secure: useSSL,
	}
	if region != "" {
		opts.Region = region
	}

	cli, err := minio.New(endpoint, opts)
	if err != nil {
		return nil, fmt.Errorf("falha ao inicializar cliente minio: %w", err)
	}

	return &Client{client: cli, bucket: bucket, endpoint: endpoint, presignTTL: presignTTL}, nil
}

// EnsureBucket garante que o bucket exista e esteja versionado.
func (c *Client) EnsureBucket(ctx context.Context) error {
	exists, err := c.client.BucketExists(ctx, c.bucket)
	if err != nil {
		return fmt.Errorf("failed to check if bucket %q exists on %q: %w", c.bucket, c.endpoint, err)
	}

	if !exists {
		if err := c.client.MakeBucket(ctx, c.bucket, minio.MakeBucketOptions{}); err != nil {
			return fmt.Errorf("failed to create bucket %q on %q: %w", c.bucket, c.endpoint, err)
		}
	}

	// Garante versionamento habilitado
	versioning := minio.BucketVersioningConfiguration{
		Status: minio.Enabled,
	}
	if err := c.client.SetBucketVersioning(ctx, c.bucket, versioning); err != nil {
		return fmt.Errorf("failed to set bucket versioning for %q on %q: %w", c.bucket, c.endpoint, err)
	}

	return nil
}

// UploadObject realiza upload com ACL privada e retorna a URL.
func (c *Client) UploadObject(ctx context.Context, objectName, contentType string, size int64, reader io.Reader) (string, error) {
	uploadInfo, err := c.client.PutObject(ctx, c.bucket, objectName, reader, size, minio.PutObjectOptions{ContentType: contentType})
	if err != nil {
		return "", err
	}

	if uploadInfo.Location != "" {
		return uploadInfo.Location, nil
	}

	return fmt.Sprintf("s3://%s/%s", c.bucket, objectName), nil
}

// PresignedURL retorna uma URL temporária para acesso ao arquivo.
func (c *Client) PresignedURL(ctx context.Context, objectName string) (*url.URL, error) {
	return c.client.PresignedGetObject(ctx, c.bucket, objectName, c.presignTTL, nil)
}
