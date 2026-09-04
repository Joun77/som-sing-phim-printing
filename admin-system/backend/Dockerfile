# Multi-stage build for Go Backend
FROM golang:1.22-alpine AS builder

ENV CGO_ENABLED=0 GOOS=linux GOTOOLCHAIN=local GONOSUMDB=* GOPRIVATE=somsing.local

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .

RUN go build -o /app/somsing-app .

FROM alpine:latest
RUN apk --no-cache add ca-certificates tzdata ghostscript

WORKDIR /app
COPY --from=builder /app/somsing-app /app/somsing-app
COPY --from=builder /app/assets ./assets
COPY --from=builder /app/migrations ./migrations
COPY --from=builder /app/couriers_data.json ./couriers_data.json
COPY --from=builder /app/payment_methods_data.json ./payment_methods_data.json
RUN mkdir -p uploads/orders uploads/preflight uploads/products

EXPOSE 8080

CMD ["./somsing-app"]
