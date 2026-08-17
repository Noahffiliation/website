FROM node:24-alpine3.21 AS runner

RUN apk upgrade --no-cache

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts

COPY app.mjs ./
COPY bin ./bin
COPY public ./public
COPY routes ./routes
COPY views ./views

USER node

EXPOSE 3000

CMD ["node", "./bin/www"]
