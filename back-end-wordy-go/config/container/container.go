package container

import (
	"context"
	"fmt"
	"github.com/Azure/azure-sdk-for-go/services/cognitiveservices/v3.0/translatortext"
	"github.com/Azure/go-autorest/autorest"
	"github.com/go-chi/jwtauth/v5"
	tgbotapi "github.com/go-telegram-bot-api/telegram-bot-api/v5"
	"github.com/stripe/stripe-go/v76"
	"github.com/upper/db/v4"
	"github.com/upper/db/v4/adapter/postgresql"
	"log"
	"net/http"
	"wordy-go-back/config"
	"wordy-go-back/internal/app"
	"wordy-go-back/internal/infra/database"
	"wordy-go-back/internal/infra/http/controllers"
	"wordy-go-back/internal/infra/http/middlewares"
)

type Container struct {
	Middlewares
	Services
	Controllers
}

type Middlewares struct {
	AuthMw func(http.Handler) http.Handler
}

type Services struct {
	app.AuthService
	app.UserService
	app.WordService
	app.UrlService
	app.SubscriptionService
}

type Controllers struct {
	controllers.AuthController
	controllers.UserController
	controllers.WordController
	controllers.UrlController
	controllers.FeedbackController
	controllers.PaymentController
}

func New(conf config.Configuration, ctx context.Context) Container {
	tknAuth := jwtauth.New("HS256", []byte(conf.JwtSecret), nil)
	sess := getDbSess(conf)

	authorizer := autorest.NewCognitiveServicesAuthorizer(conf.AzureApiKey)
	azureTranslateClient := translatortext.NewTranslatorClient(conf.AzureEndpoint)
	azureTranslateClient.Authorizer = authorizer

	bot, err := tgbotapi.NewBotAPI(conf.TelegramBotToken)
	if err != nil {
		fmt.Printf("Failed to connect to telegram bot: %v", err)
	}
	bot.Debug = true

	aApiEnabled := conf.AzureApiEnabled

	stripe.Key = conf.StripeKey

	userRepository := database.NewUserRepository(sess)
	sessionRepository := database.NewSessRepository(sess)
	urlRepository := database.NewUrlRepository(sess)
	feedbackRepository := database.NewFeedBackRepository(sess)
	paymentRepository := database.NewPaymentRepository(sess)
	subscriptionRepository := database.NewSubscriptionRepository(sess)

	userService := app.NewUserService(userRepository, urlRepository)
	authService := app.NewAuthService(sessionRepository, userService, urlRepository, conf, tknAuth)
	wordService := app.NewWordService(azureTranslateClient, aApiEnabled)
	urlService := app.NewUrlService(urlRepository)
	feedbackService := app.NewFeedbackService(feedbackRepository, bot, conf.TelegramChannelId)
	paymentService := app.NewPaymentService(
		subscriptionRepository,
		paymentRepository,
		userRepository,
		conf.PaymentSuccessUrl,
		conf.PaymentCancelUrl,
		conf.BillingUrl,
		conf.ProductPrice)
	subscriptionService := app.NewSubscriptionService(subscriptionRepository, conf.ProductPrice)

	authController := controllers.NewAuthController(authService, userService, subscriptionService)
	userController := controllers.NewUserController(userService, subscriptionService)
	wordController := controllers.NewWordController(wordService)
	urlController := controllers.NewUrlController(urlService)
	feedbackController := controllers.NewFeedbackController(feedbackService)
	paymentController := controllers.NewPaymentController(paymentService, subscriptionService)

	authMiddleware := middlewares.AuthMiddleware(tknAuth, authService, userService)

	return Container{
		Middlewares: Middlewares{
			AuthMw: authMiddleware,
		},
		Services: Services{
			authService,
			userService,
			wordService,
			urlService,
			subscriptionService,
		},
		Controllers: Controllers{
			authController,
			userController,
			wordController,
			urlController,
			feedbackController,
			paymentController,
		},
	}
}

func getDbSess(conf config.Configuration) db.Session {
	sess, err := postgresql.Open(
		postgresql.ConnectionURL{
			User:     conf.DatabaseUser,
			Host:     conf.DatabaseHost,
			Password: conf.DatabasePassword,
			Database: conf.DatabaseName,
		})
	if err != nil {
		log.Fatalf("Unable to create new DB session: %q\n", err)
	}
	return sess
}
