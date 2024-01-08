package controllers

import (
	"errors"
	"github.com/upper/db/v4"
	"log"
	"net/http"
	"wordy-go-back/internal/app"
	"wordy-go-back/internal/domain"
	"wordy-go-back/internal/infra/http/requests"
	"wordy-go-back/internal/infra/http/resources"
)

type UserController struct {
	userService app.UserService
	subsService app.SubscriptionService
}

func NewUserController(us app.UserService, ss app.SubscriptionService) UserController {
	return UserController{
		userService: us,
		subsService: ss,
	}
}

func (c UserController) FindMe() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		user := r.Context().Value(UserKey).(domain.User)

		sub, err := c.subsService.FindByUid(user.Id)
		if err != nil && !errors.Is(err, db.ErrNoMoreRows) {
			log.Printf("UserController: %s", err)
			InternalServerError(w, err)
			return
		}
		user.Subscription = sub
		Success(w, resources.UserDto{}.DomainToDto(user))
	}
}

func (c UserController) Update() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userReq, err := requests.Bind(r, requests.UpdateUserRequest{}, domain.User{})
		if err != nil {
			log.Printf("UserController: %s", err)
			BadRequest(w, err)
			return
		}

		u := r.Context().Value(UserKey).(domain.User)
		if userReq.Name != "" {
			u.Name = userReq.Name
		}
		if userReq.From != "" {
			u.From = userReq.From
		}
		if userReq.To != "" {
			u.To = userReq.To
		}
		u, err = c.userService.Update(u)
		if err != nil {
			log.Printf("UserController: %s", err)
			InternalServerError(w, err)
			return
		}

		sub, err := c.subsService.FindByUid(u.Id)
		if err != nil && !errors.Is(err, db.ErrNoMoreRows) {
			log.Printf("UserController: %s", err)
			InternalServerError(w, err)
			return
		}
		u.Subscription = sub
		var userDto resources.UserDto
		Success(w, userDto.DomainToDto(u))
	}
}

func (c UserController) Delete() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		u := r.Context().Value(UserKey).(domain.User)

		err := c.userService.Delete(u.Id)
		if err != nil {
			log.Printf("UserController: %s", err)
			InternalServerError(w, err)
			return
		}

		Ok(w)
	}
}
