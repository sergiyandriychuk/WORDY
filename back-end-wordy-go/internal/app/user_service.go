package app

import (
	"log"
	"wordy-go-back/internal/domain"
	"wordy-go-back/internal/infra/database"

	"golang.org/x/crypto/bcrypt"
)

type UserService interface {
	FindByEmail(email string) (domain.User, error)
	Save(user domain.User) (domain.User, error)
	FindById(id uint64) (domain.User, error)
	Update(user domain.User) (domain.User, error)
	Delete(id uint64) error
	GeneratePasswordHash(password string) (string, error)
}

type userService struct {
	userRepo database.UserRepository
	urlRepo  database.UrlRepository
}

func NewUserService(ur database.UserRepository, urlr database.UrlRepository) UserService {
	return userService{
		userRepo: ur,
		urlRepo:  urlr,
	}
}

func (s userService) FindByEmail(email string) (domain.User, error) {
	user, err := s.userRepo.FindByEmail(email)
	if err != nil {
		log.Printf("UserService: %s", err)
		return domain.User{}, err
	}

	return user, err
}

func (s userService) Save(user domain.User) (domain.User, error) {
	var err error

	user.Password, err = s.GeneratePasswordHash(user.Password)
	if err != nil {
		log.Printf("UserService: %s", err)
		return domain.User{}, err
	}

	u, err := s.userRepo.Save(user)
	if err != nil {
		log.Printf("UserService: %s", err)
		return domain.User{}, err
	}

	return u, err
}

func (s userService) FindById(id uint64) (domain.User, error) {
	user, err := s.userRepo.FindById(id)
	if err != nil {
		log.Printf("UserService: %s", err)
		return domain.User{}, err
	}

	return user, err
}

func (s userService) Update(user domain.User) (domain.User, error) {
	user, err := s.userRepo.Update(user)
	if err != nil {
		log.Printf("UserService: %s", err)
		return domain.User{}, err
	}

	return user, nil
}

func (s userService) Delete(id uint64) error {
	err := s.userRepo.Delete(id)
	if err != nil {
		log.Printf("UserService: %s", err)
		return err
	}

	return nil
}

func (s userService) GeneratePasswordHash(password string) (string, error) {
	bytes, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	return string(bytes), err
}
