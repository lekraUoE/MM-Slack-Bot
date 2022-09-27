FROM node:16

COPY . /home/node/app

WORKDIR /home/node/app

# ENV SLACK_BOT_TOKEN=
# ENV SLACK_SIGNING_SECRET=
# ENV CHANNEL_ID=
# ENV DB_USER=
# ENV DB_PASSWORD=

RUN ["npm", "install"]

RUN ["npm", "install", "mysql"]

CMD ["node", "/home/node/app/app.js"]