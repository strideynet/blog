---
title: Running multiple services (HTTP/GRPC) with Docker Compose & Traefik
date: '2021-02-20T09:00:00.000Z'
tags:
  - Docker
  - Docker Compose
  - Microservices
  - Traefik
  - GRPC
draft: false
---

When developing a system with multiple services (whether that be microservices or a few monoliths), it can be handy to bring them all up locally to test your entire system. This is an almost perfect use-case for docker compose, especially if your apps are already dockerised (which they should be!) However, when some of your services expose themselves on the same port, this can cause quite the issue. Some choose to solve this by assigning a different port on the host to each container, but this can become unwieldy especially if each container exposes multiple different ports. I've chosen to introduce a proxy that will direct traffic to each container based on the hostname of the request, removing the need for remembering which port is which container.

Whilst multiple proxies are available, I've chosen to go with [Traefik](https://doc.traefik.io/traefik/) because it has fantastic support for detecting containers running in docker, and automatically configuring the appropriate rules to direct traffic. This can be further customised by the use of labels on the running containers.

Our end goal is to expose the GRPC port (8080) of a running services, as well as their Prometheus metric ports (9090). If you have a lot of services, it probably makes sense to write a script to generate your Compose configuration based on these templates.

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

By default, Traefik exposes just some HTTP ports, which we will need to change. We will configure Traefik using a yml file that we will map into the container with a volume instruction in the compose file.

```yml
# traefik.yml
api:
  dashboard: true
providers:
  docker: {}
entryPoints:
  http:
    address: ":8080"
  grpc:
    address: ":9000"
  prom:
    address: ":9090"
```

You can see I've chosen to open up three ports. The names you provide here (http, grpc, prom) will be used later in the labels on the services when configuring the routing of traffic. I've also enabled the dashboard, since this can be handy when diagnosing odd behaviour with Traefik.

The next step is to start our docker compose file, and create an entry for traefik:

```yml
# docker-compose.yml
version: "3.8"
services:
  traefik:
    labels:
    - "traefik.http.routers.api.rule=Host(`traefik.localtest.me`)"
    - "traefik.http.routers.api.service=api@internal"
    image: traefik:v2.2
    ports:
    - "8080:8080"
    - "9000:9000"
    - "9090:9090"
    volumes:
    - ./traefik.yml:/traefik.yml
    - /var/run/docker.sock:/var/run/docker.sock # This lets Traefik listen to docker events.
```

There are a few things of note here:

- I've locked the Traefik image to a specific version. This is good practice as relying on the ``latest`` label can cause unexpected behaviour if a new version becomes available, and can take ages to notice!
- Each of the ports we specified as entry points in our traefik config, needs to be mapped to the same port on the host (or any port of your choosing, but keeping these the same involves less mental strain).
- The router rules I've applied using the labels refer to a service called ``api@internal`` which is Traefik's way of letting you expose their API and Dashboard. As I've not selected a specific entrypoint here, the routing rule will be applied to them all.

## Configuring Docker Compose

The next step is to add an entry for each of our services:

```yml
kitchensink:
  build:
    context: .
    dockerfile: svc/dev.Dockerfile
  command: go run /app/svc/kitchensink/main.go
  working_dir: /app
  environment:
    ENVIRONMENT: local
  image: cudo-platform
  labels:
  - traefik.http.routers.kitchensinkgrpc.rule=Host(`kitchensink.localtest.me`)
  - traefik.http.routers.kitchensinkgrpc.service=kitchensinkgrpc
  - traefik.http.routers.kitchensinkgrpc.entrypoints=grpc
  - traefik.http.services.kitchensinkgrpc.loadbalancer.server.port=9000
  - traefik.http.services.kitchensinkgrpc.loadbalancer.server.scheme=h2c
  - traefik.http.routers.kitchensinkprom.rule=Host(`kitchensink.localtest.me`)
  - traefik.http.routers.kitchensinkprom.service=kitchensinkprom
  - traefik.http.routers.kitchensinkprom.entrypoints=prom
  - traefik.http.services.kitchensinkprom.loadbalancer.server.port=9090
  depends_on:
  - traefik
  volumes:
  - $PWD:/app
```

Most of the above config is out of scope of this post, so I'll draw your attention to the most relevant parts:

- ``depends_on`` should include an entry for your Traefik service, so that Traefik is automatically started when that service is started.
- ``labels`` requires a set of entries for each port you are trying to expose. I tend to name the router and the service after the container + port name combined e.g ``kitchensinkgrpc``. You then need to also name the correct entrypoint for that port.
- For GRPC, you need to explicitly state the scheme is ``h2c`` (this is the name for non-TLS HTTP/2).

## End result

And here's what the final result looks like for those wanting a copy-paste:

```yml
# docker-compose.yml
version: "3.8"
services:
  traefik:
    labels:
    - "traefik.http.routers.api.rule=Host(`traefik.localtest.me`)"
    - "traefik.http.routers.api.service=api@internal"
    image: traefik:v2.2
    ports:
    - "8080:8080"
    - "9000:9000"
    - "9090:9090"
    volumes:
    - ./traefik.yml:/traefik.yml
    - /var/run/docker.sock:/var/run/docker.sock # This lets Traefik listen to docker events.
  kitchensink:
    build:
      context: .
      dockerfile: svc/dev.Dockerfile
    command: go run /app/svc/kitchensink/main.go
    working_dir: /app
    environment:
      ENVIRONMENT: local
    image: cudo-platform
    labels:
    - traefik.http.routers.kitchensinkgrpc.rule=Host(`kitchensink.localtest.me`)
    - traefik.http.routers.kitchensinkgrpc.service=kitchensinkgrpc
    - traefik.http.routers.kitchensinkgrpc.entrypoints=grpc
    - traefik.http.services.kitchensinkgrpc.loadbalancer.server.port=9000
    - traefik.http.services.kitchensinkgrpc.loadbalancer.server.scheme=h2c
    - traefik.http.routers.kitchensinkprom.rule=Host(`kitchensink.localtest.me`)
    - traefik.http.routers.kitchensinkprom.service=kitchensinkprom
    - traefik.http.routers.kitchensinkprom.entrypoints=prom
    - traefik.http.services.kitchensinkprom.loadbalancer.server.port=9090
    depends_on:
    - traefik
    volumes:
  - $PWD:/app
```

```yml
# traefik.yml
api:
  dashboard: true
providers:
  docker: {}
entryPoints:
  http:
    address: ":8080"
  grpc:
    address: ":9000"
  prom:
    address: ":9090"
```
