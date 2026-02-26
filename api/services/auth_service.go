package services

import (
	"fmt"
	"strconv"
	"strings"
	"time"

	"be-songbanks-v1/api/models"
	"be-songbanks-v1/api/repositories"
	"be-songbanks-v1/api/types"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

type AuthService struct {
	repo      *repositories.AuthRepository
	jwtSecret []byte
}

func NewAuthService(repo *repositories.AuthRepository, jwtSecret []byte) *AuthService {
	return &AuthService{repo: repo, jwtSecret: jwtSecret}
}

func (s *AuthService) Login(username, email, password string) (map[string]any, int, error) {
	identifier := strings.TrimSpace(username)
	if identifier == "" {
		identifier = strings.TrimSpace(email)
	}
	if identifier == "" || password == "" {
		return nil, 400, fmt.Errorf("username/email and password are required")
	}

	if p, err := s.repo.FindPengurusByUsername(identifier); err != nil {
		return nil, 500, err
	} else if p != nil {
		if !matchesPassword(p.Password, password) {
			return nil, 401, fmt.Errorf("invalid credentials")
		}
		level, _ := strconv.Atoi(strings.TrimSpace(p.LevelAdmin))
		if level <= 1 {
			return nil, 403, fmt.Errorf("insufficient admin level access")
		}
		token, err := s.issueToken(types.Claims{UserID: p.ID, UserType: "pengurus", Username: p.Username})
		if err != nil {
			return nil, 500, err
		}
		return map[string]any{"token": token, "user": mapPengurus(*p)}, 200, nil
	}

	u, err := s.repo.FindPesertaByEmail(identifier)
	if err != nil {
		return nil, 500, err
	}
	if u == nil {
		return nil, 401, fmt.Errorf("invalid credentials")
	}
	if !matchesPassword(u.Password, password) {
		return nil, 401, fmt.Errorf("invalid credentials")
	}
	level, _ := strconv.Atoi(strings.TrimSpace(u.UserLevel))
	if level <= 2 {
		return nil, 403, fmt.Errorf("insufficient user level access")
	}
	if strings.TrimSpace(u.Verifikasi) != "1" {
		return nil, 403, fmt.Errorf("account not verified")
	}
	token, err := s.issueToken(types.Claims{UserID: u.ID, UserType: "peserta", Username: u.Email, UserLevel: u.UserLevel})
	if err != nil {
		return nil, 500, err
	}
	return map[string]any{"token": token, "user": mapPeserta(*u)}, 200, nil
}

func (s *AuthService) issueToken(c types.Claims) (string, error) {
	now := time.Now()
	c.RegisteredClaims = jwt.RegisteredClaims{IssuedAt: jwt.NewNumericDate(now), ExpiresAt: jwt.NewNumericDate(now.Add(24 * time.Hour))}
	t := jwt.NewWithClaims(jwt.SigningMethodHS256, c)
	return t.SignedString(s.jwtSecret)
}

func (s *AuthService) ParseToken(token string) (*types.Claims, error) {
	parsed, err := jwt.ParseWithClaims(token, &types.Claims{}, func(t *jwt.Token) (any, error) {
		return s.jwtSecret, nil
	})
	if err != nil || !parsed.Valid {
		return nil, fmt.Errorf("invalid token")
	}
	cl, ok := parsed.Claims.(*types.Claims)
	if !ok {
		return nil, fmt.Errorf("invalid token claims")
	}
	return cl, nil
}

func mapPengurus(p models.Pengurus) map[string]any {
	return map[string]any{"id": p.ID, "nama": p.Nama, "username": p.Username, "userType": "pengurus", "isAdmin": true, "leveladmin": p.LevelAdmin, "nowa": p.Nowa, "kotalevelup": p.Kota}
}

func mapPeserta(u models.Peserta) map[string]any {
	return map[string]any{"id": u.ID, "nama": u.Nama, "username": u.Email, "userCode": u.UserCode, "userType": "peserta", "isAdmin": false, "userlevel": u.UserLevel, "verifikasi": u.Verifikasi, "status": u.Status, "role": u.Role}
}

func matchesPassword(stored, input string) bool {
	if strings.HasPrefix(stored, "$2") {
		return bcrypt.CompareHashAndPassword([]byte(stored), []byte(input)) == nil
	}
	return stored == input
}
