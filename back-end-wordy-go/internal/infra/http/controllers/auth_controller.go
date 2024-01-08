package controllers

import (
	"encoding/json"
	"errors"
	"github.com/sethvargo/go-password/password"
	"github.com/upper/db/v4"
	"log"
	"net/http"
	"wordy-go-back/internal/app"
	"wordy-go-back/internal/domain"
	"wordy-go-back/internal/infra/http/requests"
	"wordy-go-back/internal/infra/http/resources"
)

type AuthController struct {
	authService app.AuthService
	userService app.UserService
	subsService app.SubscriptionService
}

func NewAuthController(as app.AuthService, us app.UserService, ss app.SubscriptionService) AuthController {
	return AuthController{
		authService: as,
		userService: us,
		subsService: ss,
	}
}

func (c AuthController) Register() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		user, err := requests.Bind(r, requests.RegisterRequest{}, domain.User{})
		if err != nil {
			log.Printf("AuthController: %s", err)
			BadRequest(w, errors.New("invalid request body"))
			return
		}

		user.From = domain.English
		user.To = domain.Ukrainian
		user, token, err := c.authService.Register(user)
		if err != nil {
			log.Printf("AuthController: %s", err)
			BadRequest(w, err)
			return
		}

		var customerId string
		customerId, err = c.subsService.CustomerCreate(user)
		if err != nil {
			log.Printf("AuthController: %s", err)
			InternalServerError(w, err)
			return
		}

		user.CustomerId = &customerId
		user, err = c.userService.Update(user)
		if err != nil {
			log.Printf("AuthController: %s", err)
			InternalServerError(w, err)
			return
		}

		sub := domain.Subscription{
			UserId:     user.Id,
			CustomerId: customerId,
		}
		sub, err = c.subsService.Save(sub)
		if err != nil {
			log.Printf("AuthController: %s", err)
			InternalServerError(w, err)
			return
		}

		user.Subscription = sub

		var authDto resources.AuthDto
		Success(w, authDto.DomainToDto(token, user))
	}
}

func (c AuthController) Login() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		user, err := requests.Bind(r, requests.AuthRequest{}, domain.User{})
		if err != nil {
			log.Printf("AuthController: %s", err)
			BadRequest(w, err)
			return
		}

		user, token, err := c.authService.Login(user)
		if err != nil {
			Unauthorized(w, err)
			return
		}

		var sub domain.Subscription
		if user.CustomerId == nil {
			var customerId string
			customerId, err = c.subsService.CustomerCreate(user)
			if err != nil {
				log.Printf("AuthController: %s", err)
				InternalServerError(w, err)
				return
			}

			user.CustomerId = &customerId
			user, err = c.userService.Update(user)
			if err != nil {
				log.Printf("AuthController: %s", err)
				InternalServerError(w, err)
				return
			}

			sub = domain.Subscription{
				UserId:     user.Id,
				CustomerId: customerId,
			}
			sub, err = c.subsService.Save(sub)
			if err != nil {
				log.Printf("AuthController: %s", err)
				InternalServerError(w, err)
				return
			}
		} else {
			sub, err = c.subsService.FindByUid(user.Id)
			if err != nil && !errors.Is(err, db.ErrNoMoreRows) {
				log.Printf("AuthController: %s", err)
				InternalServerError(w, err)
				return
			}

			if sub.Id == 0 {
				sub = domain.Subscription{
					UserId:     user.Id,
					CustomerId: *user.CustomerId,
				}
				sub, err = c.subsService.Save(sub)
				if err != nil {
					log.Printf("AuthController: %s", err)
					InternalServerError(w, err)
					return
				}
			}
		}

		user.Subscription = sub

		var authDto resources.AuthDto
		Success(w, authDto.DomainToDto(token, user))
	}
}

func (c AuthController) LoginByProvider() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		abp, err := requests.Bind(r, requests.AuthByProviderRequest{}, domain.AuthByProvider{})
		if err != nil {
			log.Printf("requests.Bind(AuthController.LoginByProvider): %s", err)
			BadRequest(w, err)
			return
		}

		req, err := http.NewRequest("GET", domain.ProvidersURL[abp.Provider], nil)
		if err != nil {
			InternalServerError(w, err)
			return
		}
		req.Header.Add("Authorization", "Bearer "+abp.AccessToken)
		client := &http.Client{}
		res, err := client.Do(req)
		if err != nil {
			InternalServerError(w, err)
			return
		}
		defer func() { _ = res.Body.Close() }()

		var u requests.UserFromProvider
		err = json.NewDecoder(res.Body).Decode(&u)
		if err != nil {
			log.Printf("Decode(AuthController.CallbackFromProvider): %s", err)
			BadRequest(w, err)
			return
		}
		if u.Error != nil {
			err = errors.New("invalid access token")
			log.Printf("Decode(AuthController.CallbackFromProvider): %s", err)
			BadRequest(w, err)
			return
		}

		user, err := c.userService.FindByEmail(u.Email)
		if err != nil && !errors.Is(err, db.ErrNoMoreRows) {
			log.Printf("userService.FindByEmail(AuthController.CallbackFromProvider): %s", err)
			InternalServerError(w, err)
			return
		}

		var sub domain.Subscription
		if user.Id == 0 {
			user.Password, err = password.Generate(10, 1, 1, false, true)
			if err != nil {
				log.Printf("password.Generate(AuthController.CallbackFromProvider): %s", err)
				InternalServerError(w, err)
				return
			}
			user.Email = u.Email
			user.Name = u.Name
			user.Avatar = &u.Avatar
			user.To = u.Locale
			if u.Locale == domain.English {
				user.From = domain.Spanish
			} else {
				user.From = domain.English
			}
			user, err = c.userService.Save(user)
			if err != nil {
				log.Printf("userService.Save(AuthController.CallbackFromProvider): %s", err)
				InternalServerError(w, err)
				return
			}

			var customerId string
			customerId, err = c.subsService.CustomerCreate(user)
			if err != nil {
				log.Printf("AuthController: %s", err)
				InternalServerError(w, err)
				return
			}

			user.CustomerId = &customerId
			user, err = c.userService.Update(user)
			if err != nil {
				log.Printf("AuthController: %s", err)
				InternalServerError(w, err)
				return
			}

			sub = domain.Subscription{
				UserId:     user.Id,
				CustomerId: customerId,
			}
			sub, err = c.subsService.Save(sub)
			if err != nil {
				log.Printf("AuthController: %s", err)
				InternalServerError(w, err)
				return
			}
		} else {
			if user.CustomerId == nil {
				var customerId string
				customerId, err = c.subsService.CustomerCreate(user)
				if err != nil {
					log.Printf("AuthController: %s", err)
					InternalServerError(w, err)
					return
				}

				user.CustomerId = &customerId
				user, err = c.userService.Update(user)
				if err != nil {
					log.Printf("AuthController: %s", err)
					InternalServerError(w, err)
					return
				}

				sub = domain.Subscription{
					UserId:     user.Id,
					CustomerId: customerId,
				}
				sub, err = c.subsService.Save(sub)
				if err != nil {
					log.Printf("AuthController: %s", err)
					InternalServerError(w, err)
					return
				}
			} else {
				sub, err = c.subsService.FindByUid(user.Id)
				if err != nil && !errors.Is(err, db.ErrNoMoreRows) {
					log.Printf("AuthController: %s", err)
					InternalServerError(w, err)
					return
				}

				if sub.Id == 0 {
					sub = domain.Subscription{
						UserId:     user.Id,
						CustomerId: *user.CustomerId,
					}
					sub, err = c.subsService.Save(sub)
					if err != nil {
						log.Printf("AuthController: %s", err)
						InternalServerError(w, err)
						return
					}
				}
			}
		}

		if user.Avatar != &u.Avatar {
			user.Avatar = &u.Avatar
			user, err = c.userService.Update(user)
			if err != nil {
				log.Printf("userService.Update(AuthController.CallbackFromProvider): %s", err)
				InternalServerError(w, err)
				return
			}
		}

		token, err := c.authService.GenerateJwt(user)
		if err != nil {
			log.Printf("authService.GenerateJwt(AuthController.CallbackFromProvider): %s", err)
			InternalServerError(w, err)
			return
		}
		user.Subscription = sub

		Success(w, resources.AuthDto{}.DomainToDto(token, user))
	}
}

func (c AuthController) Logout() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		sess := r.Context().Value(SessKey).(domain.Session)
		err := c.authService.Logout(sess)
		if err != nil {
			log.Print(err)
			InternalServerError(w, err)
			return
		}

		noContent(w)
	}
}

func (c AuthController) ChangePassword() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		req, err := requests.Bind(r, requests.ChangePasswordRequest{}, domain.ChangePassword{})
		if err != nil {
			log.Printf("AuthController: %s", err)
			BadRequest(w, err)
			return
		}
		user := r.Context().Value(UserKey).(domain.User)

		err = c.authService.ChangePassword(user, req)
		if err != nil {
			log.Printf("AuthController: %s", err)
			InternalServerError(w, err)
			return
		}

		Ok(w)
	}
}
