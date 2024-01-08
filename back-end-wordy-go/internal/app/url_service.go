package app

import (
	"log"
	"wordy-go-back/internal/domain"
	"wordy-go-back/internal/infra/database"
)

type UrlService interface {
	Find(id uint64) (domain.Url, error)
	FindList(p domain.Pagination, filters database.UrlFilters) (domain.Urls, error)
	Save(u domain.Url) (domain.Url, error)
	Update(u domain.Url) (domain.Url, error)
	Delete(u domain.Url) error
}

type urlService struct {
	urlRepo database.UrlRepository
}

func NewUrlService(ur database.UrlRepository) UrlService {
	return urlService{
		urlRepo: ur,
	}
}

func (s urlService) Find(id uint64) (domain.Url, error) {
	u, err := s.urlRepo.FindById(id)
	if err != nil {
		log.Printf("UrlService -> Find: %s", err)
		return domain.Url{}, err
	}
	return u, err
}

func (s urlService) FindList(p domain.Pagination, filters database.UrlFilters) (domain.Urls, error) {
	us, err := s.urlRepo.FindList(p, filters)
	if err != nil {
		log.Printf("UrlService -> FindList: %s", err)
		return domain.Urls{}, err
	}
	return us, err
}

func (s urlService) Save(u domain.Url) (domain.Url, error) {
	u, err := s.urlRepo.Save(u)
	if err != nil {
		log.Printf("UrlService -> Save: %s", err)
		return domain.Url{}, err
	}
	return u, err
}

func (s urlService) Update(u domain.Url) (domain.Url, error) {
	u, err := s.urlRepo.Update(u)
	if err != nil {
		log.Printf("UrlService -> Update: %s", err)
		return domain.Url{}, err
	}
	return u, err
}

func (s urlService) Delete(u domain.Url) error {
	err := s.urlRepo.Delete(u)
	if err != nil {
		log.Printf("UrlService -> Delete: %s", err)
		return err
	}
	return err
}
