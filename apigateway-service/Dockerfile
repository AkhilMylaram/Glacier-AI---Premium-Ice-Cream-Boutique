FROM golang:1.22-alpine AS build
WORKDIR /src
COPY go.mod go.sum* ./
RUN apk add --no-cache git
RUN go env -w GOPROXY=https://proxy.golang.org
COPY . .
RUN go build -o /out/api-gateway main.go

FROM alpine:3.18
RUN apk add --no-cache ca-certificates
COPY --from=build /out/api-gateway /usr/local/bin/api-gateway
EXPOSE 8080
ENTRYPOINT ["/usr/local/bin/api-gateway"]
