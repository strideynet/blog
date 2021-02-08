---
title: "Retaking the Helm: Kubernetes manifests as Go - WIP"
date: 2020-09-13 09:00:00
tags:
- Helm
- Kubernetes
- Go
---

*This post is still work in progress :)*

A lot about Helm leaves me extremely dissatisfied, especially as manifests grow more complicated and I aim to reduce duplication. The templating language itself always leaves me thinking that there simply has to be a better way of doing this that doesn't involve painstakingly adding ``{{ indent xyz }}`` and carefully stripping whitespace.

It occurred to me that it must be possible to use the Kubernetes API types to directly define or generate these manifests from Go code, thus allowing us to use standard Go loops and conditionals or even including entire pre-written sections with the benefits of type-checking and editor auto-complete when working on more complex manifests. But would it be better or worse?

I've listed out the steps in my exploration here, but feel free to skip straight to my evaluation at the end or view the source code here: blahblah

## Investigating

I had a few questions I needed to answer before knowing if this was something worst investigating further:

- Are the types provided by the Kubernetes library correctly marshalled into JSON/YAML?
- Are the types provided by the Kubernetes library easily accessed & understood?

 I realised that I'd probably be able to answer these questions by taking a look at the Kubernetes libraries available on Github. We can find the core type definitions for Kubernetes on Github at https://github.com/kubernetes/api where they are synced in from the core Kubernetes repository. Taking a dive into ``api/core/v1/types.go`` shows us a few things:

```golang
// Pod is a collection of containers that can run on a host. This resource is created
// by clients and scheduled onto hosts.
type Pod struct {
	metav1.TypeMeta `json:",inline"`
	// Standard object's metadata.
	// More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#metadata
	// +optional
	metav1.ObjectMeta `json:"metadata,omitempty" protobuf:"bytes,1,opt,name=metadata"`

	// Specification of the desired behavior of the pod.
	// More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#spec-and-status
	// +optional
	Spec PodSpec `json:"spec,omitempty" protobuf:"bytes,2,opt,name=spec"`

	// Most recently observed status of the pod.
	// This data may not be up to date.
	// Populated by the system.
	// Read-only.
	// More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#spec-and-status
	// +optional
	Status PodStatus `json:"status,omitempty" protobuf:"bytes,3,opt,name=status"`
}
```

We can see that not only are these types properly tagged up (for marshalling into JSON), but that these types are quite well documented. This is quite useful for in-editor hints, linking directly to the more in-depth Kubernetes documentation where needed.

As I'd expect for the Kubernetes project, the git repository is correctly tagged up with release versions, making it extremely easy for us to lock our go module dependency to the correct version.

## Trying out the basics

Now that we know it's possible to achieve what we are trying to do, it comes to answering a slightly different question: is writing Kubernetes manifests in Go unwieldy or unnatural compared to using YAML?

Of course, the only way to really answer this question would be to set out and actually write some manifests in Go using the Kubernetes types.

I decided it would be reasonable to write out a single deployment, and then export it as YAML.

### YAML

Out of interest, I tried marshalling the pod spec to YAML (with no particular expectations of it working) and found that it does indeed produce incorrectly named keys. If you require YAML, and not JSON, you'll need to marshal to JSON
and then into YAML, or obtain a custom YAML marshaller that supports the ``json`` struct tag.

I decided to give a random package (``"github.com/ghodss/yaml"``) a chance at converting the structure to YAML. This did in fact work as I expected, but I do prefer to avoid third party packages where possible so this is something I'd look to try and replace, or at least investigate with a bit more detail.

### The Code

I've trimmed this file to only show the more interesting parts and you can find the full version here on [Github](https://github.com/strideynet/go-k8s-caac/blob/main/00-basics/basics.go).

```golang
var podLabels = map[string]string{
	"app.kubernetes.io/name":      "sheep",
	"app.kubernetes.io/component": "api",
	"app.kubernetes.io/part-of":   "farm",
}

var replicaCount int32 = 3

var containers = []corev1.Container{
	{
		Name:  "api",
		Image: "gcr.io/farm-manager/sheep-api:latest",

		Ports: []corev1.ContainerPort{
			{
				Name:          "http",
				ContainerPort: 80,
			},
		},
	},
}

var deployment = appsv1.Deployment{
	TypeMeta: v1.TypeMeta{
		Kind:       "Deployment",
		APIVersion: "apps/v1",
	},
	ObjectMeta: v1.ObjectMeta{
		Name:      "sheep-api",
		Namespace: "default",
	},
	Spec: appsv1.DeploymentSpec{
		Replicas: &replicaCount,
		Selector: &v1.LabelSelector{
			MatchLabels: podLabels,
		},

		Template: corev1.PodTemplateSpec{
			ObjectMeta: v1.ObjectMeta{
				Labels: podLabels,
			},

			Spec: corev1.PodSpec{
				Containers: containers,
			},
		},
	},
}
```

There's a few observations I'd like to make. The first being that it would appear that there are no stricter typings than string applied to the API Version and Kind for the deployment. This is annoying because one of the primary reasons I wanted to use Golang was to avoid potentially invalid manifests. I can see two paths to rectify this:

- Introduce a helper function that produces a default deployment that we can then decorate
- Produce some kind of validator to run as a final step to validate the files are correct

It's entirely possible that a validator or similar already exists, however, I do quite like the idea of a function that produces a resource with sensible defaults since quite often I'd expect to have very similar configuration across a large number of the resources, especially when handling micro-services of a single language. In an ideal world, we would also run the validator as part of a test suite to ensure generated manifests were good.

The generated YAML is sensible and there's no major surprises here:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  creationTimestamp: null
  name: sheep-api
  namespace: default
spec:
  replicas: 3
  selector:
    matchLabels:
      app.kubernetes.io/component: api
      app.kubernetes.io/name: sheep
      app.kubernetes.io/part-of: farm
  strategy: {}
  template:
    metadata:
      creationTimestamp: null
      labels:
        app.kubernetes.io/component: api
        app.kubernetes.io/name: sheep
        app.kubernetes.io/part-of: farm
    spec:
      containers:
      - image: gcr.io/farm-manager/sheep-api:latest
        name: api
        ports:
        - containerPort: 80
          name: http
        resources: {}
status: {}
```

Overall I was quite pleased, but it would take a more complicated example to be able to compare it like for like with Helm.

## Something a bit more complex

## Evaluation
