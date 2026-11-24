# Build the React frontend, then run frontend + API in one Render web service.
FROM node:22-alpine AS frontend
WORKDIR /app
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm ci 2>/dev/null || npm install
COPY frontend/ ./
RUN npm run build

FROM node:22-alpine
WORKDIR /app/api
COPY api/package.json api/package-lock.json* ./
RUN npm install --omit=dev && npm cache clean --force
COPY api/server.js ./server.js
COPY --from=frontend /app/dist /app/public
ENV NODE_ENV=production
EXPOSE 3000
CMD ["node", "server.js"]
