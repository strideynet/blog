---
title: "Running multiple services (HTTP/GRPC) with Docker Compose & Traefik"
date: 2021-02-10 09:00:00
tags:
- Docker
- Docker Compose
- Microservices
- Traefik
- GRPC
---

When developing a system with multiple services (whether that be microservices or a few monoliths), it can be handy to bring them all up locally to test your entire system. This is an almost perfect use-case for docker compose, especially if your apps are already dockerised (which they should be!) However, when some of your services expose themselves on the same port, this can cause quite the issue. Some choose to solve this by assigning a different port on the host to each container, but this can become unwieldy especially if each container exposes multiple different ports. I've chosen to introduce a proxy that will direct traffic to each container based on the hostname of the request, removing the need for remembering which port is which container.

Whilst multiple proxies are available, I've chosen to go with [Traefik](https://doc.traefik.io/traefik/) because it has fantastic support for detecting containers running in docker, and automatically configuring the appropriate rules to direct traffic. This can be further customised by the use of labels on the running containers. We only need to provide a single flag when starting Traefik to enable the docker provider.

Our end goal is to expose the GRPC port (8080) of two running services, as well as their Prometheus metric ports (9090). If you have a lot of services, it probably makes sense to write a script to generate your Compose configuration.

## Choosing a domain

You'll need to find some domain to use as a root that has a wildcard A record that points to ``127.0.0.1``. This removes the need for adding multiple records to hosts file. There are quite a [few of these available](https://stackoverflow.com/questions/1562954/public-wildcard-domain-name-to-resolve-to-127-0-0-1) and you can trivially configure your own with your own domain.

I've chosen to go with [localtest.me](https://readme.localtest.me) since I've heard it's name thrown around a lot and it'll be one that works if you choose to use it rather than set your own up. We can see if we run ``nslookup`` that it returns an A record pointing to 127.0.0.1 for any level of wildcard below the root:

```shell
nslookup this.is.an.example.localtest.me

Server:         192.168.1.1
Address:        192.168.1.1#53

Non-authoritative answer:
Name:   this.is.an.example.localtest.me
Address: 127.0.0.1
```

**I will strongly suggest, however, that you configure your own if you are passing traffic that may in anyway be sensitive.**

## Configuring Traefik

You'll note in the compose file a few interesting parts, firstly, you will need to map the docker socket into the container to ensure that it is able to pick up Docker events and change the routing rules to acknowledge these.

## The final result

```yml
# docker-compose.yml
version: "3.8"
services:
  teapot:
    image: golang:1.15.7-buster
    command: go run /app/service.teapot/main.go
    working_dir: /app
    labels:
    - traefik.http.routers.teapotgrpc.rule=Host(`teapot.localtest.me`)
    - traefik.http.routers.teapotgrpc.service=teapotgrpc
    - traefik.http.services.teapotgrpc.loadbalancer.server.port=8080
    - traefik.http.services.teapotgrpc.loadbalancer.server.scheme=h2c
    - traefik.http.routers.teapotprom.rule=Host(`teapot.localtest.me`)
    - traefik.http.routers.teapotprom.service=teapotprom
    - traefik.http.services.teapotprom.loadbalancer.server.port=9090
    depends_on:
    - traefik
    volumes:
    - $PWD:/app
  foo:
    image: golang:1.15.7-buster
    command: go run /app/service.foo/main.go
    working_dir: /app
    labels:
    - traefik.http.routers.foogrpc.rule=Host(`foo.localtest.me`)
    - traefik.http.routers.foogrpc.service=foogrpc
    - traefik.http.services.foogrpc.loadbalancer.server.port=8080
    - traefik.http.services.footgrpc.loadbalancer.server.scheme=h2c
    - traefik.http.routers.fooprom.rule=Host(`foo.localtest.me`)
    - traefik.http.routers.fooprom.service=fooprom
    - traefik.http.services.fooprom.loadbalancer.server.port=9090
    depends_on:
    - traefik
    volumes:
    - $PWD:/app
  
  traefik:
    image: traefik:v2.2
    command:
    - --api.insecure=true
    - --providers.docker=true
    ports:
    - "80:80"
    - "8080:8080"
    volumes:
    # So that Traefik can listen to the Docker events
    - /var/run/docker.sock:/var/run/docker.sock
```