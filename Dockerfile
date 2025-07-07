# Stage 1: Build the application
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Serve the application with a lightweight server
FROM node:18-alpine
WORKDIR /app
COPY --from=build /app/dist /app/dist
COPY package*.json ./
RUN npm install --only=production
EXPOSE 3000
CMD ["npx", "serve", "dist"]
