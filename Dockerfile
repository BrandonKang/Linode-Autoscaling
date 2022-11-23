FROM node:lts-alpine
ENV NODE_ENV=production
WORKDIR /usr/src/app
COPY ["package.json", "package-lock.json*", "npm-shrinkwrap.json*", "./"]
RUN yarn install --force  --production --silent && mv node_modules ../
COPY . .
EXPOSE 9999
RUN chown -R node /usr/src/app
USER node
CMD ["npm", "start"]
