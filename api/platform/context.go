package platform

import (
	"fmt"
	"os"
	"time"

	"github.com/jmoiron/sqlx"
)

type Context struct {
	DB        *sqlx.DB
	JWTSecret []byte
	ClientURL string
}

func NewContext() (*Context, error) {
	dsn := fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?parseTime=true&loc=Local",
		env("PROD_DB_USERNAME", "songbank"),
		env("PROD_DB_PASSWORD", "songbank"),
		env("PROD_DB_HOST", "127.0.0.1"),
		env("PROD_DB_PORT", "3306"),
		env("PROD_DB_DATABASE", "songbanksdb"),
	)

	db, err := sqlx.Open("mysql", dsn)
	if err != nil {
		return nil, err
	}
	db.SetMaxOpenConns(10)
	db.SetConnMaxLifetime(5 * time.Minute)
	if err := db.Ping(); err != nil {
		return nil, err
	}

	return &Context{
		DB:        db,
		JWTSecret: []byte(env("SESSION_SECRET", "dev-secret")),
		ClientURL: env("CLIENT_URL", "http://localhost:3000"),
	}, nil
}

func env(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
