FROM node:16

# https://github.com/yarnpkg/yarn/issues/2266
RUN yarn global add @npmcli/fs

WORKDIR /srv/image-resizer-instance

RUN yarn add https://github.com/dwellna/docker-image-resizer/ \
	&& yarn add https://github.com/dwellna/docker-image-resizer new
	&& yarn install --production \
	&& yarn add ejs \
	&& yarn cache clean

RUN yarn global add pm2

ENTRYPOINT ["pm2-docker", "./server.js"]
#ENTRYPOINT ["bash"]
