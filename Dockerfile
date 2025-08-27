FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install --only=production

COPY . .

RUN mkdir -p generated-images

ENV OUTPUT_DIR=/app/generated-images

EXPOSE 3000

CMD ["npm", "start"]