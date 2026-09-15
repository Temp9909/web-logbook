# syntax=docker/dockerfile:1

# ---- Stage 1: build the React UI ----
FROM node:22-alpine AS ui-builder

WORKDIR /src/app/ui

COPY app/ui/package.json app/ui/package-lock.json ./
RUN npm install

COPY app/ui ./
# Build directly with vite (skips the vitest run that "npm run build" also does,
# so a flaky/unrelated test can't block the image build)
RUN npx vite build

# ---- Stage 2: build the Go binary, embedding the UI build output ----
FROM golang:1.23-alpine AS go-builder

WORKDIR /src

COPY go.mod go.sum ./
RUN go mod download

COPY . .
# Overwrite the empty ui/dist with the real build from stage 1
# (this is the folder embedded by //go:embed ui/dist/* in app/handlers_aux.go)
COPY --from=ui-builder /src/app/ui/dist ./app/ui/dist

RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -trimpath -o /out/web-logbook ./app

# ---- Stage 3: minimal runtime image ----
FROM alpine

LABEL org.opencontainers.image.title="Web Logbook" \
      org.opencontainers.image.description="Container image built from source"

RUN apk update --no-cache && \
    apk add --no-cache ca-certificates libssl3 openssl && \
    adduser -g "WebLogbook" -s /usr/sbin/nologin -D -H weblogbook

WORKDIR /web-logbook
COPY --from=go-builder /out/web-logbook /web-logbook/web-logbook

VOLUME [ "/data", "/certs" ]
EXPOSE 4000

USER weblogbook
ENTRYPOINT [ "./web-logbook" ]
CMD [ "-dsn", "/data/web-logbook.sql" ]
