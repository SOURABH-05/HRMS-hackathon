# Dockerfile for HRMS Express Server
FROM node:18

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

COPY . .

EXPOSE 5000

ENV PORT=5000
# MongoDB & Redis envs for docker-compose use
ENV MONGO_URI=mongodb://mongo:27017/hrms
ENV REDIS_URL=redis://redis:6379

CMD ["npm", "run", "dev"]
