---
title: "Retaking the Helm: Kubernetes manifests as Go - WIP"
date: 2020-09-13 09:00:00
tags:
- Helm
- Kubernetes
- Go
categories:
- Tech
---

*This post is still work in progress :)*

A lot about Helm leaves me extremely dissatisfied, especially as manifests grow more complicated and I aim to reduce
duplication. The templating language itself always leaves me thinking that there simply has to be a better
way of doing this that doesn't involve painstakingly adding ``{{ indent xyz }}`` and carefully stripping whitespace.

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

## Something a bit more complex

## Evaluation
