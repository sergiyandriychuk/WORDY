package controllers

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"wordy-go-back/internal/domain"
)

type CtxKey struct {
	name string
}

var (
	UserKey = CtxKey{name: "user"}
	SessKey = CtxKey{name: "sess"}
)

const (
	UrlParam       = "url"
	WordParam      = "word"
	UrlURLParam    = UrlParam + "Id"
	urlPathCtxKey  = CtxStrKey(UrlParam)
	wordPathCtxKey = CtxStrKey(WordParam)
)

func GetUserKey() CtxKey { return UserKey }

func SetPathValInCtx[T any](ctx context.Context, val T) context.Context {
	key := ResolveCtxKeyFromPathType(new(T))
	return context.WithValue(ctx, key, val)
}

func GetPathValFromCtx[T any](ctx context.Context) T {
	key := ResolveCtxKeyFromPathType(new(T))
	return ctx.Value(key).(T)
}

type CtxStrKey string

func (k CtxStrKey) URLParam() string {
	return string(k) + "Id"
}

func ResolveCtxKeyFromPathType(v any) CtxStrKey {
	switch v.(type) {
	case *domain.Word:
		return wordPathCtxKey
	case *domain.Url:
		return urlPathCtxKey
	default:
		panic("unknown type")
	}
}

func Ok(w http.ResponseWriter) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
}

func Success(w http.ResponseWriter, body interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)

	err := json.NewEncoder(w).Encode(body)
	if err != nil {
		log.Print(err)
	}
}

func Created(w http.ResponseWriter, body interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)

	err := json.NewEncoder(w).Encode(body)
	if err != nil {
		log.Print(err)
	}
}

func noContent(w http.ResponseWriter) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusNoContent)
}

func BadRequest(w http.ResponseWriter, err error) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusBadRequest)

	encodeErrorBody(w, err)
}

func Forbidden(w http.ResponseWriter, err error) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusForbidden)

	encodeErrorBody(w, err)
}

func InternalServerError(w http.ResponseWriter, err error) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusInternalServerError)

	encodeErrorBody(w, err)
}

// nolint
func validationError(w http.ResponseWriter, err error) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusUnprocessableEntity)

	encodeErrorBody(w, err)
}

// nolint
func genericError(w http.ResponseWriter, err error) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusBadRequest)

	encodeErrorBody(w, err)
}

func NotFound(w http.ResponseWriter, err error) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusNotFound)

	body := "Not Found"

	if err != nil {
		body = fmt.Sprint(err)
	}

	e := json.NewEncoder(w).Encode(map[string]interface{}{"error": body})
	if e != nil {
		log.Print(e)
	}
}

func encodeErrorBody(w http.ResponseWriter, err error) {
	e := json.NewEncoder(w).Encode(map[string]interface{}{"error": err.Error()})
	if e != nil {
		log.Print(e)
	}
}

func Unauthorized(w http.ResponseWriter, err error) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusUnauthorized)

	encodeErrorBody(w, err)
}
