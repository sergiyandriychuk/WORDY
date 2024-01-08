package app

import (
	"errors"
	"github.com/go-chi/jwtauth/v5"
	"github.com/google/uuid"
	"github.com/upper/db/v4"
	"golang.org/x/crypto/bcrypt"
	"log"
	"wordy-go-back/config"
	"wordy-go-back/internal/domain"
	"wordy-go-back/internal/infra/database"
)

type AuthService interface {
	Register(user domain.User) (domain.User, string, error)
	Login(user domain.User) (domain.User, string, error)
	ChangePassword(user domain.User, req domain.ChangePassword) error
	Logout(sess domain.Session) error
	Check(sess domain.Session) error
	GenerateJwt(user domain.User) (string, error)
}

type authService struct {
	authRepo    database.SessionRepository
	userService UserService
	urlRepo     database.UrlRepository
	config      config.Configuration
	tokenAuth   *jwtauth.JWTAuth
}

func NewAuthService(
	ar database.SessionRepository,
	us UserService,
	ur database.UrlRepository,
	cf config.Configuration,
	ta *jwtauth.JWTAuth) AuthService {
	return authService{
		authRepo:    ar,
		userService: us,
		urlRepo:     ur,
		config:      cf,
		tokenAuth:   ta,
	}
}

func (s authService) Register(user domain.User) (domain.User, string, error) {
	_, err := s.userService.FindByEmail(user.Email)
	if err == nil {
		log.Printf("invalid credentials")
		return domain.User{}, "", errors.New("invalid credentials")
	} else if !errors.Is(err, db.ErrNoMoreRows) {
		log.Print(err)
		return domain.User{}, "", err
	}

	user, err = s.userService.Save(user)
	if err != nil {
		log.Print(err)
		return domain.User{}, "", err
	}

	token, err := s.GenerateJwt(user)
	return user, token, err
}

func (s authService) Login(user domain.User) (domain.User, string, error) {
	u, err := s.userService.FindByEmail(user.Email)
	if err != nil {
		if errors.Is(err, db.ErrNoMoreRows) {
			log.Printf("AuthService: failed to find user %s", err)
		}
		log.Printf("AuthService: login error %s", err)
		return domain.User{}, "", err
	}

	valid := s.checkPasswordHash(user.Password, u.Password)
	if !valid {
		return domain.User{}, "", errors.New("invalid credentials")
	}

	token, err := s.GenerateJwt(u)
	if err != nil {
		log.Printf("AuthService->s.GenerateJwt %s", err)
		return domain.User{}, "", err
	}

	u.Urls, err = s.urlRepo.FindByUserId(u.Id)
	if err != nil {
		log.Printf("AuthService->s.urlRepo.FindByUserId %s", err)
		return domain.User{}, "", err
	}

	return u, token, err
}

func (s authService) Logout(sess domain.Session) error {
	return s.authRepo.Delete(sess)
}

func (s authService) ChangePassword(user domain.User, req domain.ChangePassword) error {
	var err error
	if !s.checkPasswordHash(req.OldPassword, user.Password) {
		err = errors.New("invalid credentials")
		return err
	}

	if s.checkPasswordHash(req.NewPassword, user.Password) {
		err = errors.New("old password used")
		return err
	}

	user.Password, err = s.userService.GeneratePasswordHash(req.NewPassword)
	if err != nil {
		return err
	}

	_, err = s.userService.Update(user)
	if err != nil {
		return err
	}

	return nil
}

func (s authService) GenerateJwt(user domain.User) (string, error) {
	sess := domain.Session{UserId: user.Id, UUID: uuid.New()}
	err := s.authRepo.Save(sess)
	if err != nil {
		log.Printf("AuthService: failed to save session %s", err)
		return "", err
	}

	claims := map[string]interface{}{
		"user_id": sess.UserId,
		"uuid":    sess.UUID,
	}
	jwtauth.SetExpiryIn(claims, s.config.JwtTTL)
	_, tokenString, err := s.tokenAuth.Encode(claims)
	if err != nil {
		return "", err
	}

	return tokenString, nil
}

func (s authService) Check(sess domain.Session) error {
	return s.authRepo.Exists(sess)
}

func (s authService) checkPasswordHash(password, hash string) bool {
	return bcrypt.CompareHashAndPassword([]byte(hash), []byte(password)) == nil
}
