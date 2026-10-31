FROM golang:1.26.10-alpine AS build
WORKDIR /src
RUN apk add --no-cache git
COPY apps/api/go.mod apps/api/go.sum ./
RUN go mod download
COPY apps/api/ ./
RUN CGO_ENABLED=0 go build -o /api ./cmd/api

FROM alpine:3.20
RUN apk add --no-cache ca-certificates
COPY --from=build /api /usr/local/bin/api
EXPOSE 8080
ENTRYPOINT ["api"]
