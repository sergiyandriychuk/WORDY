package config

import (
	"github.com/caarlos0/env/v10"
	"log"
	"time"
)

type Configuration struct {
	DatabaseName        string        `env:"DB_NAME,notEmpty"`
	DatabaseHost        string        `env:"DB_HOST,notEmpty"`
	DatabaseUser        string        `env:"DB_USER,notEmpty"`
	DatabasePassword    string        `env:"DB_PASSWORD,notEmpty"`
	MigrateToVersion    string        `env:"MIGRATE" envDefault:"latest"`
	MigrationLocation   string        `env:"MIGRATION_LOCATION" envDefault:"migrations"`
	FileStorageLocation string        `env:"FILES_LOCATION" envDefault:"file_storage"`
	JwtSecret           string        `env:"JWT_SECRET" envDefault:"1234567890"`
	AzureApiKey         string        `env:"AZURE_TRANSLATE_API_KEY,notEmpty"`
	AzureEndpoint       string        `env:"AZURE_ENDPOINT" envDefault:"https://api.cognitive.microsofttranslator.com"`
	AzureApiEnabled     bool          `env:"AZURE_API_ENABLED" envDefault:"true"`
	TelegramBotToken    string        `env:"TELEGRAM_BOT_TOKEN,notEmpty"`
	TelegramChannelId   string        `env:"TELEGRAM_CHANNEL_ID,notEmpty"`
	StripeKey           string        `env:"STRIPE_KEY,notEmpty"`
	ProductPrice        string        `env:"PRODUCT_PRICE,notEmpty"`
	PaymentSuccessUrl   string        `env:"PAYMENT_SUCCESS_URL" envDefault:"https://wordy.education"`
	PaymentCancelUrl    string        `env:"PAYMENT_CANCEL_URL" envDefault:"https://wordy.education/#team"`
	BillingUrl          string        `env:"BILLING_URL" envDefault:"https://wordy.education/cabinet/billing"`
	JwtTTL              time.Duration `env:"JWT_TTL" envDefault:"72h"`
}

func GetConfiguration() Configuration {
	cfg := Configuration{}
	if err := env.Parse(&cfg); err != nil {
		log.Fatalf("%+v\n", err)
	}
	return cfg
}
