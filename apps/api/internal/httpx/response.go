package httpx

import (
	"encoding/json"
	"io"
	"log/slog"
	"net/http"
)

const maxJSONBodyBytes = 1 << 20 // 1 MiB

type ErrorBody struct {
	Error   string `json:"error"`
	Message string `json:"message,omitempty"`
}

func WriteJSON(w http.ResponseWriter, status int, payload any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if payload == nil {
		return
	}
	if err := json.NewEncoder(w).Encode(payload); err != nil {
		slog.Error("encode json response", "err", err)
	}
}

func WriteError(w http.ResponseWriter, status int, code, message string) {
	WriteJSON(w, status, ErrorBody{Error: code, Message: message})
}

func DecodeJSON(r *http.Request, dst any) error {
	dec := json.NewDecoder(io.LimitReader(r.Body, maxJSONBodyBytes))
	dec.DisallowUnknownFields()
	return dec.Decode(dst)
}
