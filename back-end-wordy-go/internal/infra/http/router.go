package http

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"wordy-go-back/config"
	"wordy-go-back/config/container"
	"wordy-go-back/internal/app"
	"wordy-go-back/internal/domain"
	"wordy-go-back/internal/infra/http/controllers"
	"wordy-go-back/internal/infra/http/middlewares"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
)

func Router(cont container.Container) http.Handler {

	router := chi.NewRouter()

	router.Use(middleware.RedirectSlashes, middleware.Logger, cors.Handler(cors.Options{
		AllowedOrigins:   []string{"https://*", "http://*"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token"},
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: false,
		MaxAge:           300,
	}))

	router.Route("/api", func(apiRouter chi.Router) {
		// Health
		apiRouter.Route("/ping", func(healthRouter chi.Router) {
			healthRouter.Get("/", PingHandler())
			healthRouter.Handle("/*", NotFoundJSON())
		})

		apiRouter.Route("/v1", func(apiRouter chi.Router) {
			// Public routes
			PaymentRouter(apiRouter, cont.PaymentController)
			apiRouter.Group(func(apiRouter chi.Router) {
				apiRouter.Route("/auth", func(apiRouter chi.Router) {
					AuthRouter(apiRouter, cont.AuthController, cont.AuthMw)
				})
			})

			// Protected routes
			apiRouter.Group(func(apiRouter chi.Router) {
				apiRouter.Use(cont.AuthMw)

				UserRouter(apiRouter, cont.UserController)
				TranslateRouter(apiRouter, cont.WordController)
				UrlRouter(apiRouter, cont.UrlController, cont.UrlService)
				FeedbackRouter(apiRouter, cont.FeedbackController)
				ProtectedPaymentRouter(apiRouter, cont.PaymentController)

				apiRouter.Handle("/*", NotFoundJSON())
			})
		})
	})

	router.Get("/static/*", func(w http.ResponseWriter, r *http.Request) {
		workDir, _ := os.Getwd()
		filesDir := http.Dir(filepath.Join(workDir, config.GetConfiguration().FileStorageLocation))
		rctx := chi.RouteContext(r.Context())
		pathPrefix := strings.TrimSuffix(rctx.RoutePattern(), "/*")
		fs := http.StripPrefix(pathPrefix, http.FileServer(filesDir))
		fs.ServeHTTP(w, r)
	})

	return router
}

func AuthRouter(r chi.Router, ac controllers.AuthController, amw func(http.Handler) http.Handler) {
	r.Route("/", func(apiRouter chi.Router) {
		apiRouter.Post(
			"/register",
			ac.Register(),
		)
		apiRouter.Post(
			"/login",
			ac.Login(),
		)
		apiRouter.Post(
			"/provider/login",
			ac.LoginByProvider(),
		)
		apiRouter.With(amw).Post(
			"/change-pwd",
			ac.ChangePassword(),
		)
		apiRouter.With(amw).Post(
			"/logout",
			ac.Logout(),
		)
	})
}

func UserRouter(r chi.Router, uc controllers.UserController) {
	r.Route("/users", func(apiRouter chi.Router) {
		apiRouter.Get(
			"/",
			uc.FindMe(),
		)
		apiRouter.Put(
			"/",
			uc.Update(),
		)
		apiRouter.Delete(
			"/",
			uc.Delete(),
		)
	})
}

func TranslateRouter(r chi.Router, wc controllers.WordController) {
	r.Route("/translate", func(apiRouter chi.Router) {
		apiRouter.Post(
			"/",
			wc.WordTranslations(),
		)
	})
}

func UrlRouter(r chi.Router, uc controllers.UrlController, us app.UrlService) {
	upom := middlewares.PathObjectMiddleware[domain.Url](us)
	omw := middlewares.IsOwnerMiddleware[domain.Url]()
	r.Route("/urls", func(apiRouter chi.Router) {
		apiRouter.Get(
			"/",
			uc.FindList(),
		)
		apiRouter.With(upom).Get(
			fmt.Sprintf("/{%s}", controllers.UrlURLParam),
			uc.Find(),
		)
		apiRouter.Post(
			"/",
			uc.Save(),
		)
		apiRouter.With(upom, omw).Put(
			fmt.Sprintf("/{%s}", controllers.UrlURLParam),
			uc.Update(),
		)
		apiRouter.With(upom, omw).Delete(
			fmt.Sprintf("/{%s}", controllers.UrlURLParam),
			uc.Delete(),
		)
		apiRouter.With(upom, omw).Put(
			fmt.Sprintf("/toggle/{%s}", controllers.UrlURLParam),
			uc.Toggle(),
		)
	})
}

func FeedbackRouter(r chi.Router, fc controllers.FeedbackController) {
	r.Route("/feedbacks", func(apiRouter chi.Router) {
		apiRouter.Post(
			"/",
			fc.Save(),
		)
	})
}

func PaymentRouter(r chi.Router, pc controllers.PaymentController) {
	r.Route("/webhook", func(apiRouter chi.Router) {
		apiRouter.Post(
			"/",
			pc.Webhook(),
		)
	})
}

func ProtectedPaymentRouter(r chi.Router, pc controllers.PaymentController) {
	r.Route("/payments", func(apiRouter chi.Router) {
		apiRouter.Post(
			"/",
			pc.GenerateCheckoutLink(),
		)
		apiRouter.Post(
			"/cards",
			pc.GenerateCardAttachLink(),
		)
		apiRouter.Delete(
			"/cards/detach",
			pc.DetachCard(),
		)
		apiRouter.Get(
			"/",
			pc.FindPayments(),
		)
		apiRouter.Get(
			"/subscription",
			pc.FindSubscription(),
		)
		apiRouter.Put(
			"/subscription/pause",
			pc.PauseSubscription(),
		)
		apiRouter.Put(
			"/subscription/resume",
			pc.ResumeSubscription(),
		)
		apiRouter.Delete(
			"/subscription",
			pc.CancelSubscription(),
		)
	})
}

func NotFoundJSON() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusNotFound)
		err := json.NewEncoder(w).Encode("Resource Not Found")
		if err != nil {
			fmt.Printf("writing response: %s", err)
		}
	}
}

func PingHandler() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		err := json.NewEncoder(w).Encode("Ok")
		if err != nil {
			fmt.Printf("writing response: %s", err)
		}
	}
}
