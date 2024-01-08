package middlewares

import (
	"errors"
	"fmt"
	"github.com/go-chi/chi/v5"
	"github.com/upper/db/v4"
	"log"
	"net/http"
	"strconv"
	"wordy-go-back/internal/infra/http/controllers"
)

type FindableT[T any] interface {
	Find(uint64) (T, error)
}

func PathObjectMiddleware[domainType any](service FindableT[domainType]) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		hfn := func(w http.ResponseWriter, r *http.Request) {
			objKey := controllers.ResolveCtxKeyFromPathType(new(domainType))
			objId, err := strconv.ParseUint(chi.URLParam(r, objKey.URLParam()), 10, 64)
			if err != nil || objId <= 0 {
				err = fmt.Errorf("invalid %s parameter(only positive uint)", objKey.URLParam())
				log.Printf("strconv.ParseUint(PathObjectMiddleware): %s", err)
				controllers.BadRequest(w, err)
				return
			}

			obj, err := service.Find(objId)
			if err != nil {
				if errors.Is(err, db.ErrNoMoreRows) {
					err = fmt.Errorf("record not found")
					log.Printf("service.Find(PathObjectMiddleware): %s", err)
					controllers.NotFound(w, err)
					return
				}
				log.Printf("service.Find(PathObjectMiddleware): %s", err)
				controllers.InternalServerError(w, err)
				return
			}
			ctx := controllers.SetPathValInCtx(r.Context(), obj)
			next.ServeHTTP(w, r.WithContext(ctx))
		}
		return http.HandlerFunc(hfn)
	}
}
