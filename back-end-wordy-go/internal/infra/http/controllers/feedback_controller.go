package controllers

import (
	"log"
	"net/http"
	"wordy-go-back/internal/app"
	"wordy-go-back/internal/domain"
	"wordy-go-back/internal/infra/http/requests"
)

type FeedbackController struct {
	feedbackService app.FeedbackService
}

func NewFeedbackController(fs app.FeedbackService) FeedbackController {
	return FeedbackController{
		feedbackService: fs,
	}
}

func (c FeedbackController) Save() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		feedback, err := requests.Bind(r, requests.FeedbackRequest{}, domain.Feedback{})
		if err != nil {
			log.Printf("FeedbackController: %s", err)
			BadRequest(w, err)
			return
		}

		user := r.Context().Value(UserKey).(domain.User)
		feedback.UserId = user.Id
		feedback.Status = domain.FeedbackNew
		_, err = c.feedbackService.Save(feedback)
		if err != nil {
			log.Printf("FeedbackController: %s", err)
			BadRequest(w, err)
			return
		}

		Ok(w)
	}
}
