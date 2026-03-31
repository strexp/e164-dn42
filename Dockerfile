FROM node:alpine AS builder

RUN apk add python3 make gcc g++

WORKDIR /backend
COPY backend .
RUN npm install && npm run build

WORKDIR /frontend
COPY frontend .
RUN npm install && npm run build

FROM node:alpine
WORKDIR /app
COPY --from=builder /backend/dist ./backend/dist
COPY --from=builder /backend/package*.json ./backend/
COPY --from=builder /frontend/.output ./frontend/.output
COPY --from=builder /frontend/package*.json ./frontend/

WORKDIR /app/frontend
RUN npm install --omit=dev

WORKDIR /app/backend
RUN npm install --omit=dev

WORKDIR /app
RUN apk add --no-cache supervisor
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf
ENTRYPOINT ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
