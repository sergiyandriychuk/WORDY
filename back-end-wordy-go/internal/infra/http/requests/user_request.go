package requests

import (
	"wordy-go-back/internal/domain"
)

type RegisterRequest struct {
	Name     string `json:"name" validate:"required,gte=1,max=40"`
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required,gte=4,max=20"`
}

type AuthRequest struct {
	Email    string `json:"email"  validate:"required,email"`
	Password string `json:"password" validate:"required,gte=4"`
}

type UpdateUserRequest struct {
	Name string          `json:"name" validate:"max=40"`
	From domain.LangCode `json:"from" validate:"max=2"`
	To   domain.LangCode `json:"to" validate:"max=2"`
}

type ChangePasswordRequest struct {
	OldPassword string `json:"oldPassword" validate:"required,gte=4,max=40"`
	NewPassword string `json:"newPassword" validate:"required,gte=4,max=40"`
}

type AuthByProviderRequest struct {
	Provider string `json:"provider"  validate:"required"`
	Token    string `json:"accessToken"  validate:"required"`
}

func (r AuthByProviderRequest) ToDomainModel() (interface{}, error) {
	provider, err := domain.ParseProvider(r.Provider)
	if err != nil {
		return nil, err
	}

	return domain.AuthByProvider{
		Provider:    provider,
		AccessToken: r.Token,
	}, nil
}

type UserFromProvider struct {
	SocialId string          `json:"sub"`
	Name     string          `json:"name"`
	Avatar   string          `json:"picture"`
	Email    string          `json:"email"`
	Locale   domain.LangCode `json:"locale"`
	Error    *string         `json:"error"`
}

func (r UpdateUserRequest) ToDomainModel() (interface{}, error) {
	return domain.User{
		Name: r.Name,
		From: r.From,
		To:   r.To,
	}, nil
}

func (r RegisterRequest) ToDomainModel() (interface{}, error) {
	return domain.User{
		Email:    r.Email,
		Password: r.Password,
		Name:     r.Name,
	}, nil
}

func (r AuthRequest) ToDomainModel() (interface{}, error) {
	return domain.User{
		Email:    r.Email,
		Password: r.Password,
	}, nil
}

func (r ChangePasswordRequest) ToDomainModel() (interface{}, error) {
	return domain.ChangePassword{
		OldPassword: r.OldPassword,
		NewPassword: r.NewPassword,
	}, nil
}
