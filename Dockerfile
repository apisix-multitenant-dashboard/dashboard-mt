#
# Licensed to the Apache Software Foundation (ASF) under one or more
# contributor license agreements.  See the NOTICE file distributed with
# this work for additional information regarding copyright ownership.
# The ASF licenses this file to You under the Apache License, Version 2.0
# (the "License"); you may not use this file except in compliance with
# the License.  You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
#
# Étape 1 : Backend
FROM golang:1.19 AS api-builder
WORKDIR /usr/local/apisix-dashboard
COPY api/ ./api/
COPY api/go.mod api/go.sum ./
RUN go env -w GO111MODULE=on \
    && CGO_ENABLED=0 ./api/build.sh

# Étape 2 : Frontend
FROM node:16-bullseye AS fe-builder
WORKDIR /usr/local/apisix-dashboard/web

# Fix OpenSSL 3 pour Node 20
ENV NODE_OPTIONS=--max_old_space_size=4096

# Installer les dépendances système nécessaires
RUN apt-get update && apt-get install -y python3 make g++ bash git \
    && rm -rf /var/lib/apt/lists/*

# Copier uniquement les fichiers de dépendances pour utiliser le cache Docker
COPY web/package.json web/yarn.lock ./

# Installer les dépendances
RUN yarn install --ignore-scripts --ignore-engines

# Copier le reste du frontend
COPY web/ ./

# Builder le frontend
RUN yarn build && ls -la ../output/html

# Étape 3 : Runtime
FROM alpine:latest AS prod
WORKDIR /usr/local/apisix-dashboard
RUN apk add --no-cache ca-certificates bash

# Copier backend et frontend
COPY --from=api-builder /usr/local/apisix-dashboard/output/ ./
COPY --from=fe-builder /usr/local/apisix-dashboard/output/html ./html

RUN mkdir logs

EXPOSE 9000
CMD [ "/usr/local/apisix-dashboard/manager-api" ]