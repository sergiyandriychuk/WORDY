package jobs

import (
	"fmt"
	"github.com/robfig/cron/v3"
	"log"
	"os"
	"os/signal"
	"syscall"
	"wordy-go-back/internal/infra/database"
)

type DbCleaner struct {
	cron     *cron.Cron
	wordRepo database.WordRepository
}

func NewDbCleaner(c *cron.Cron, wr database.WordRepository) DbCleaner {
	return DbCleaner{
		cron:     c,
		wordRepo: wr,
	}
}

func (j DbCleaner) RunCheckAndClean() {
	_, err := j.cron.AddFunc("@midnight", j.wordRepo.RemoveInvalid)
	if err != nil {
		log.Printf("jobs.RunCheckAndClean->RemoveInvalid: %s", err)
	}

	j.cron.Start()

	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)
	go func() {
		<-sigChan
		fmt.Println("Application is going down...")
		j.cron.Stop()
	}()
}
