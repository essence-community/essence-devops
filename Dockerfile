FROM node:14 as builder

COPY ./ /opt/service

RUN cd /opt/service && \
    yarn install --force && \
    yarn build && \
    cd /opt/service/dist && \
    yarn install --force

FROM node:14-alpine3.13

ARG UID=1001
ARG GID=1001
ARG ANSIBLE_VERSION="2.10.7"
ARG CRYPTOGRAPHY_VERSION="3.1.1"

ENV TZ=Europe/Moscow

RUN set -euxo pipefail ;\
    sed -i 's/http\:\/\/dl-cdn.alpinelinux.org/https\:\/\/alpine.global.ssl.fastly.net/g' /etc/apk/repositories ;\
    apk upgrade --update-cache; \
    apk add --no-cache --update --virtual .build-deps g++ python3-dev build-base libffi-dev openssl-dev ;\
    apk add --no-cache --update python3 ca-certificates openssh-client sshpass dumb-init su-exec bash tzdata;\
    ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone; \
    rm -rf /tmp/* /var/cache/apk/*; \
    if [ ! -e /usr/bin/python ]; then ln -sf python3 /usr/bin/python ; fi ;\
    echo "**** install pip ****" ;\
    python3 -m ensurepip ;\
    rm -r /usr/lib/python*/ensurepip ;\
    if [ ! -e /usr/bin/pip ]; then ln -s pip3 /usr/bin/pip ; fi ;\
    pip3 install --no-cache --upgrade pip ;\
    pip3 install --no-cache --upgrade cryptography==${CRYPTOGRAPHY_VERSION} setuptools wheel ansible==${ANSIBLE_VERSION} ;\
    apk del --no-cache --purge .build-deps ;\
    ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone; \
    rm -rf /tmp/* /var/cache/apk/*; \
    rm -rf /root/.cache ;\
    mkdir -p /etc/ansible/ ;\
    /bin/echo -e "[local]\nlocalhost ansible_connection=local" > /etc/ansible/hosts ;\
    ssh-keygen -q -t ed25519 -N '' -f /root/.ssh/id_ed25519 ;\
    mkdir -p ~/.ssh && echo "Host *" > ~/.ssh/config && echo " StrictHostKeyChecking no" >> ~/.ssh/config ;\
    ansible-galaxy collection install containers.podman;

RUN adduser -u $UID -g $GID -s /bin/bash --disabled-password service-rest;

USER $UID

COPY --from=builder --chown=$UID:$GID /opt/service/dist /opt/service

RUN mkdir -p ~/.ssh; \
    ssh-keygen -q -t ed25519 -N '' -f ~/.ssh/id_ed25519 ;\
    cat ~/.ssh/id_ed25519.pub; \
    echo "Host *" > ~/.ssh/config && echo " StrictHostKeyChecking no" >> ~/.ssh/config; \
    ansible-galaxy collection install containers.podman;

CMD cd /opt/service && \
    cat /home/service-rest/.ssh/id_ed25519.pub ;\
    yarn server
