package middlewares

import (
	"errors"
	"github.com/upper/db/v4"
	"log"
	"net/http"
	"time"
	"wordy-go-back/internal/app"
	"wordy-go-back/internal/domain"
	"wordy-go-back/internal/infra/http/controllers"
)

func CheckSubscriptionMiddleware(ss app.SubscriptionService) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		hfn := func(w http.ResponseWriter, r *http.Request) {
			ctx := r.Context()
			user := ctx.Value(controllers.UserKey).(domain.User)
			sub, err := ss.FindByUid(user.Id)
			if err != nil {
				log.Printf("CheckSubscriptionMiddleware: %s", err)
				if !errors.Is(err, db.ErrNoMoreRows) {
					controllers.NotFound(w, err)
				} else {
					controllers.InternalServerError(w, err)
				}
				return
			}

			if sub.NextPaymentDate.Before(time.Now()) {
				err = errors.New("your subscription expired")
				controllers.Forbidden(w, err)
				return
			}
			next.ServeHTTP(w, r.WithContext(ctx))
		}
		return http.HandlerFunc(hfn)
	}
}
