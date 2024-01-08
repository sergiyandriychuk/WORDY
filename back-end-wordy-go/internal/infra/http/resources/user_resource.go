package resources

import (
	"github.com/stripe/stripe-go/v76"
	"time"
	"wordy-go-back/internal/domain"
)

type UserDto struct {
	Id           uint64          `json:"id"`
	Name         string          `json:"name"`
	Email        string          `json:"email"`
	SocialId     *string         `json:"socialId,omitempty"`
	SocialName   *string         `json:"socialName,omitempty"`
	From         domain.LangCode `json:"from"`
	To           domain.LangCode `json:"to"`
	Subscription SubDto          `json:"subscription"`
	Avatar       *string         `json:"avatar,omitempty"`
	Urls         []UrlDto        `json:"urls,omitempty"`
}

type SubDto struct {
	Status          *stripe.SubscriptionStatus `json:"status,omitempty"`
	NextPaymentDate time.Time                  `json:"nextPaymentDate"`
	Paused          *bool                      `json:"paused,omitempty"`
}

type UsersDto struct {
	Items []UserDto `json:"items"`
	Total uint64    `json:"total"`
	Pages uint      `json:"pages"`
}

type AuthDto struct {
	Token string  `json:"token"`
	User  UserDto `json:"user"`
}

func (d UserDto) DomainToDto(user domain.User) UserDto {
	var urlDto UrlDto
	return UserDto{
		Id:         user.Id,
		Name:       user.Name,
		Email:      user.Email,
		SocialId:   user.SocialId,
		SocialName: user.SocialName,
		From:       user.From,
		To:         user.To,
		Subscription: SubDto{
			Status:          user.Subscription.Status,
			NextPaymentDate: user.Subscription.NextPaymentDate,
			Paused:          user.Subscription.Paused,
		},
		Avatar: user.Avatar,
		Urls:   urlDto.DomainToDtoCollection(user.Urls),
	}
}

func (d UserDto) DomainToDtoCollection(users domain.Users) UsersDto {
	result := make([]UserDto, len(users.Items))

	for i := range users.Items {
		result[i] = d.DomainToDto(users.Items[i])
	}

	return UsersDto{Items: result, Pages: users.Pages, Total: users.Total}
}

func (d AuthDto) DomainToDto(token string, user domain.User) AuthDto {
	var userDto UserDto
	return AuthDto{
		Token: token,
		User:  userDto.DomainToDto(user),
	}
}
