package app

import (
	"fmt"
	tgbotapi "github.com/go-telegram-bot-api/telegram-bot-api/v5"
	"log"
	"wordy-go-back/internal/domain"
	"wordy-go-back/internal/infra/database"
)

type FeedbackService interface {
	Find(id uint64) (interface{}, error)
	FindList(p domain.Pagination, filters database.FeedbackFilters) (domain.Feedbacks, error)
	Save(f domain.Feedback) (domain.Feedback, error)
	Update(f domain.Feedback) (domain.Feedback, error)
	Delete(f domain.Feedback) error
}

type feedbackService struct {
	feedbackRepo database.FeedbackRepository
	tgBot        *tgbotapi.BotAPI
	channelId    string
}

func NewFeedbackService(fr database.FeedbackRepository, tb *tgbotapi.BotAPI, ci string) FeedbackService {
	return feedbackService{
		feedbackRepo: fr,
		tgBot:        tb,
		channelId:    ci,
	}
}

func (s feedbackService) Find(id uint64) (interface{}, error) {
	f, err := s.feedbackRepo.FindById(id)
	if err != nil {
		log.Printf("FeedbackService -> Find: %s", err)
		return domain.Feedback{}, err
	}
	return f, err
}

func (s feedbackService) FindList(p domain.Pagination, filters database.FeedbackFilters) (domain.Feedbacks, error) {
	fs, err := s.feedbackRepo.FindList(p, filters)
	if err != nil {
		log.Printf("FeedbackService -> FindList: %s", err)
		return domain.Feedbacks{}, err
	}
	return fs, err
}

func (s feedbackService) Save(f domain.Feedback) (domain.Feedback, error) {
	f, err := s.feedbackRepo.Save(f)
	if err != nil {
		log.Printf("FeedbackService -> Save: %s", err)
		return domain.Feedback{}, err
	}

	text := fmt.Sprintf("UserId: %v\nSubject: %s\nMessage: %s\n",
		f.UserId, f.Subject, f.Message)

	if f.Url != "" {
		text += fmt.Sprintf("Url: %s\nDetected Language: %s", f.Url, f.From)
	}

	msg := tgbotapi.NewMessageToChannel(s.channelId, text)
	_, err = s.tgBot.Send(msg)
	if err != nil {
		log.Printf("FeedbackService -> s.tgBot.Send: %s", err)
	}

	return f, nil
}

func (s feedbackService) Update(f domain.Feedback) (domain.Feedback, error) {
	f, err := s.feedbackRepo.Update(f)
	if err != nil {
		log.Printf("FeedbackService -> Update: %s", err)
		return domain.Feedback{}, err
	}
	return f, err
}

func (s feedbackService) Delete(f domain.Feedback) error {
	err := s.feedbackRepo.Delete(f)
	if err != nil {
		log.Printf("FeedbackService -> Delete: %s", err)
		return err
	}
	return err
}
