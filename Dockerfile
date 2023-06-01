FROM node:16-alpine as builder
WORKDIR /app
ADD package.json /app/
RUN apk add --no-cache git make g++ python3

ARG GITHUB_USR=""
ARG GITHUB_PAT=""

RUN mkdir /user && \
    echo 'nobody:x:65534:65534:nobody:/:' > /user/passwd && \
    echo 'nobody:x:65534:' > /user/group

RUN printf "machine github.com\n\
    login ${GITHUB_USR}\n\
    password ${GITHUB_PAT}\n\
    \n\
    machine api.github.com\n\
    login ${GITHUB_USR}\n\
    password ${GITHUB_PAT}\n"\
    >> /root/.netrc
RUN chmod 600 /root/.netrc

RUN yarn install

FROM node:16-alpine
WORKDIR /app
COPY --from=builder /app/node_modules /app/node_modules
ADD . /app

USER nobody:nobody

ENTRYPOINT [ "node"]
CMD ["bin/www"]