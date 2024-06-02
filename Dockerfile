FROM node:20-slim

# Dependencies
RUN apt update && apt install -y make clang wget

# Environment
ENV CC=clang
ENV CFLAGS='-Ofast -ffast-math -march=native -mtune=native'
ENV STRIPFLAGS='--strip-debug --strip-unneeded --remove-section=.note.gnu.gold-version --remove-section=.note --strip-all --discard-locals --remove-section=.gnu.version --remove-section=.eh_frame --remove-section=.note.gnu.build-id --remove-section=.note.ABI-tag --strip-symbol=__gmon_start__ --remove-section=.comment --remove-section=.eh_frame_ptr --discard-all'
ENV LIBDIR=/lib

# Libtrie
RUN wget https://ari.lt/gh/libtrie/archive/refs/tags/v2.tar.gz
RUN tar xf v2.tar.gz
RUN cd libtrie-2 && make install -j$(nproc)

# NodeJS
COPY package*.json /tmp/
RUN cd /tmp && npm install
RUN mkdir -p /opt/app && cp -a /tmp/node_modules /opt/app/

# App
VOLUME /opt/app/model.bin
WORKDIR /opt/app
COPY . /opt/app

ENV CFLAGS='-Ofast -s -ffast-math -flto=full -march=native -mtune=native'
RUN make strip -j$(nproc) && make install
RUN printf '' | ./bin/trie-update model.bin

CMD ["npm", "run", "bot"]
