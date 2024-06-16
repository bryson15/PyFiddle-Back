FROM node:16

WORKDIR /app

COPY package*.json ./

RUN npm install

ARG NODE_ENV

ENV NODE_ENV=${NODE_ENV}

COPY . .

EXPOSE 5000

CMD ["node", "index.js"]