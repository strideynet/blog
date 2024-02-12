---
title: "My Setup of Zigbee2mqtt on Kubernetes and Some Tips"
date: 2024-02-12 09:00:00
tags:
- Home Automation
- Kubernetes
- Zigbee2mqtt
- Tips
- My Setup
---

Sorry! This is a bit of a short and rough one but wanted to just publish some things I came across trying to run Zigbee2mqtt on Kubernetes. I couldn't find much advice for this while googling and there was a fairly out of date
helm chart floating around which I didn't fancy trying. I'll try and update this as I learn more.

General thoughts:

- I used the environment variable configuration style as it looks like Z2M writes back to the config file - which could cause problems with a config map.
- Container seems to require some additional capabilities. For now I'm just marking it as privileged but at somepoint I'll come back and assess which individual capabilities need adding.
- I'm using a Sonoff Zigbee dongle connected directly to my single Kubernetes node and I've bound this in using a hostPath volume. If you have multiple nodes, ensure you configure scheduling to ensure the Z2M Pod ends up on that node. You may also wish to explore https://github.com/cminyard/ser2net for some more flexibility in the positioning of
your Zigbee dongle - e.g set up a raspberry pi in an ideal location and use ser2net to make the dongle available to your Z2M Pod in your Kubernetes cluster.

## My Manifests

### Persistent Volume Claim

Stores the data/live config for Z2M. Make sure you have a way of backing this PVC up!

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: zigbee2mqtt-data
spec:
  resources:
      requests:
        storage: 10Gi
  accessModes:
  - ReadWriteOnce
```

### Service

```yaml
apiVersion: v1
kind: Service
metadata:
  name: zigbee2mqtt
  labels:
    app: zigbee2mqtt
spec:
  ports:
  - port: 8080
    targetPort: http
  selector:
    app: zigbee2mqtt
```

### Ingress

Depending on your Kubernetes cluster, you may prefer not to use an Ingress. I'm using Traefik as a provider.

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: zigbee2mqtt
spec:
  ingressClassName: traefik
  rules:
  - host: z2m.svc.example.com
    http:
      paths:
      - path: /
        pathType: ImplementationSpecific
        backend:
          service:
            name: zigbee2mqtt
            port:
              number: 8080
```

### Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: zigbee2mqtt
spec:
  selector:
    matchLabels:
      app: zigbee2mqtt
  strategy:
    type: Recreate
  template:
    metadata:
      labels:
        app: zigbee2mqtt
    spec:
      containers:
      - image: koenkk/zigbee2mqtt:1.35.3
        name: zigbee2mqtt
        env:
        - name: "ZIGBEE2MQTT_DATA"
          value: "/data"
        - name: "ZIGBEE2MQTT_CONFIG_MQTT_SERVER"
          value: "mqtt://mosquitto"
        - name: "ZIGBEE2MQTT_CONFIG_MQTT_BASE_TOPIC"
          value: "zigbee2mqtt"
        - name: "ZIGBEE2MQTT_CONFIG_PERMIT_JOIN"
          value: "true"
        - name: "ZIGBEE2MQTT_CONFIG_SERIAL_PORT"
          value: "/dev/ttyUSB0"
        - name: "ZIGBEE2MQTT_CONFIG_ADVANCED_NETWORK_KEY"
          value: "GENERATE"
        - name: "TZ"
          value: "Europe/London"
        ports:
        - containerPort: 8080
          name: http
        volumeMounts:
        - name: data
          mountPath: /data
        - name: usb
          mountPath: /dev/ttyUSB0
        - name: udev
          mountPath: /run/udev
        securityContext:
          privileged: true
      volumes:
      - name: data
        persistentVolumeClaim:
          claimName: zigbee2mqtt-data
      - name: usb
        hostPath:
          path: /dev/ttyUSB0
      - name: udev
        hostPath:
          path: /run/udev
```