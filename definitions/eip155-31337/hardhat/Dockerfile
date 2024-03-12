FROM node:18-alpine
WORKDIR /hardhat

COPY ./hardhat.package.json ./package.json
RUN npm install

COPY ./hardhat.config.js ./hardhat.config.js

EXPOSE 8545
ENTRYPOINT ["npx", "hardhat", "node"]
