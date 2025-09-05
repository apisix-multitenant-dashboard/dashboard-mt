<!--
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
-->

# APISIX Multitenant Dashboard
A modern, interactive, multitenant control plane for Apache APISIX with centralized monitoring.

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://github.com/apache/apisix-dashboard/blob/master/LICENSE)
[![Docker Pulls](https://img.shields.io/docker/pulls/your-org/apisix-dashboard)]()
[![Node Version](https://img.shields.io/badge/Node-18+-brightgreen)]()
[![Go Version](https://img.shields.io/badge/Go-1.20+-blue)]()

## Table of Contents
- [What's Apache APISIX Dashboard](#whats-apache-apisix-dashboard)
- [Description](#description)
- [Features](#features)
- [Project structure](#project-structure)
- [Demo](#demo)
- [Installation and Setup](#installation-and-setup)
  - [Prerequisites](#prerequisites)
  - [Docker Environment](#docker-environment)

## What's Apache APISIX Dashboard

The Apache APISIX Dashboard is designed to make it as easy as possible for users to operate [Apache APISIX](https://github.com/apache/apisix) through a frontend interface.

The Dashboard is the control plane and performs all parameter checks; Apache APISIX mixes data and control planes and will evolve to a pure data plane.

Note: Currently the Dashboard does not have complete coverage of Apache APISIX features, [visit here](https://github.com/apache/apisix-dashboard/milestones) to view the milestones.

![architecture](./docs/assets/images/architecture.png)

## Description
This project is a complete revamp of the **Apache APISIX Dashboard** to make it **multitenant, interactive, and centralized**, with advanced monitoring via Prometheus and multi-instance setup through Docker Compose.  

The Dashboard allows managing multiple APISIX instances while providing a super-admin centralized view of all instances and their performance.

---
## Features
- **Multitenancy support:** manage multiple APISIX instances in a single dashboard.
- **ETCD prefix isolation:** each instance has a dedicated ETCD prefix for data separation.
- **Administration rights:** assign instance-specific admin roles; super-admin oversees all instances.
- **Frontend instance selector:** switch between instances seamlessly; API calls adapt automatically.
- **Status & counters:** display UP/DOWN status and key metrics:
  - Routes, Services, Upstreams, Consumers, Protocol Buffers, Plugins, SSLs
- **Metrics visualization:** Prometheus metrics aggregated and displayed in interactive charts:
  - Connections: accepted, active, reading, writing, waiting
  - Total requests per instance
- **Responsive design** using Ant Design and Recharts.
- **Pagination:** automatically handles large numbers of instances.

---

## Project structure

```text
.
├── CHANGELOG.md
├── CODE_OF_CONDUCT.md
├── CONTRIBUTING.md
├── Dockerfile
├── LICENSE
├── Makefile
├── NOTICE
├── README.md
├── api
├── docs
├── licenses
└── web
```

1. The `api` directory is used to store the `Manager API` source codes, which is used to manage `etcd` and provide APIs to the frontend interface.
2. The `web` directory is used to store the frontend source codes.

## Demo

[Online Playground](https://apisix-dashboard.apiseven.com/)

```text
Username: admin
Password: admin
```
## Installation and Setup

### Prerequisites
- Docker & Docker Compose
- Node.js >= 18
- Go >= 1.20
- An ETCD database for the APISIX backend

### Docker Environment
```bash
git clone https://github.com/apisix-multitenant-dashboard/docker-infra.git
cd  example
