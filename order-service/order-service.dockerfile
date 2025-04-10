FROM node:18

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .

RUN tsc

EXPOSE 8080

CMD ["node", "dist/app.js"]