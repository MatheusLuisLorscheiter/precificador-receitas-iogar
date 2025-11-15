package mailer

import (
	"crypto/tls"
	"fmt"
	"net"
	"net/smtp"
)

// SMTPClient encapsula envio de e-mails.
type SMTPClient struct {
	host        string
	port        int
	username    string
	password    string
	fromAddress string
	tlsRequired bool
}

func NewSMTPClient(host string, port int, username, password, from string, tlsRequired bool) *SMTPClient {
	return &SMTPClient{
		host:        host,
		port:        port,
		username:    username,
		password:    password,
		fromAddress: from,
		tlsRequired: tlsRequired,
	}
}

// Send envia um email texto simples para o destinatário.
func (c *SMTPClient) Send(to, subject, body string) error {
	auth := smtp.PlainAuth("", c.username, c.password, c.host)

	msg := fmt.Sprintf("From: %s\r\nTo: %s\r\nSubject: %s\r\nMIME-Version: 1.0\r\nContent-Type: text/plain; charset=UTF-8\r\n\r\n%s", c.fromAddress, to, subject, body)

	addr := net.JoinHostPort(c.host, fmt.Sprintf("%d", c.port))

	// Para porta 465, usa TLS direto (SMTPS)
	if c.tlsRequired && c.port == 465 {
		conn, err := tls.Dial("tcp", addr, &tls.Config{ServerName: c.host})
		if err != nil {
			return err
		}
		client, err := smtp.NewClient(conn, c.host)
		if err != nil {
			return err
		}
		defer client.Quit()

		if err := client.Auth(auth); err != nil {
			return err
		}
		if err := client.Mail(c.fromAddress); err != nil {
			return err
		}
		if err := client.Rcpt(to); err != nil {
			return err
		}
		writer, err := client.Data()
		if err != nil {
			return err
		}
		if _, err := writer.Write([]byte(msg)); err != nil {
			return err
		}
		return writer.Close()
	}

	// Para porta 587 ou quando TLS é requerido, usa STARTTLS
	conn, err := net.Dial("tcp", addr)
	if err != nil {
		return err
	}
	defer conn.Close()

	client, err := smtp.NewClient(conn, c.host)
	if err != nil {
		return err
	}
	defer client.Quit()

	// Sempre tenta STARTTLS na porta 587 ou quando tlsRequired=true
	if c.port == 587 || c.tlsRequired {
		tlsConfig := &tls.Config{ServerName: c.host}
		if err := client.StartTLS(tlsConfig); err != nil {
			return err
		}
	}

	if c.username != "" {
		if err := client.Auth(auth); err != nil {
			return err
		}
	}

	if err := client.Mail(c.fromAddress); err != nil {
		return err
	}
	if err := client.Rcpt(to); err != nil {
		return err
	}

	writer, err := client.Data()
	if err != nil {
		return err
	}
	if _, err := writer.Write([]byte(msg)); err != nil {
		return err
	}
	return writer.Close()
}
