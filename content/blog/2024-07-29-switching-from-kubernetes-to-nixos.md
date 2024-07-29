---
title: "Switching my home server from Kubernetes to NixOS"
date: 2024-07-29 09:00:00
tags:
- Home Automation
- Kubernetes
- My Setup
- NixOS
- Thoughts
---

For the past few years, I've had a "home server". It's played a number of different roles from hosting backups, to being somewhere that I could try out different things that didn't fit all too well on my Macbook.

The most recent iteration ran Ubuntu, with K3S plopped on top. This worked well for about two years. It was particularly useful having access to the Ubuntu host for running things like Samba that didn't work quite as seamlessly within Kubernetes, and everything else could run on Kubernetes. Kubernetes is probably a controversial choice - but - for the most part it's what I'm used to. It's been years since I've had to look after any Linux hosts in a professional capacity.

I think it's worth noting that I'm not an avid "homelabber". I don't have a lot of time for playing around with stuff anymore and for the most part, and for the sake of my relationship with my partner, most of the services on the server needed to just work. It's all well and good having something cool - but it stops being cool when HomeAssistant goes down and I can't turn the lights on anymore!

I'd done a number of things in an attempt to try and keep this host reproducible. The contents of the Kubernetes cluster
were deployed using ArgoCD, and the Ubuntu host had *originally* been configured with Ansible. The problem was that at
several points I'd run into problems with Ansible and ended up just manually installing something or adjusting some
config.

Eventually, I started to realise that this machine was coming to the end of its life. It had originally been a gaming
machine that some years later had been converted for use as a server, and various signs were starting to show that I had a problem...

For posterity, I'll write out a rough list of the problems I had with this setup:

- I'd long drifted from reproducibility. Years of small manual tweaks had been omitted from Ansible. This perhaps isn't the fault of Ansible, and more my fault, but nonetheless a problem.
- Kubernetes is great, but there's a lot of moving parts and all those moving parts needed updating. If this was more a homelab than a home server, this perhaps would be less arduous.
- It was awkward having some things running in Kubernetes and some things installed directly on the host.
- I'm starting to grow further and further from operating Kubernetes as part of my job, and managing a cluster was quickly becoming more than I wanted to be committed to.

## Choosing a path forward

As it became clear that I was going to have to rebuild this machine, I started to think about what I could do different.

I had a few ideas:

- Abandon Kubernetes and just run a plain old Ubuntu host - and try to stick to managing it with Ansible this time.
- Embrace Kubernetes and run some kind of purpose-fit distro like Talos
- Explore this NixOS thing people kept talking about?

Whilst I roughly knew a bit about the first two choices, I knew next to nothing about the last, bar the fact I'd heard a lot of people singing its praises. From what I had heard, it seemed perfect. An almost completely reproducible way of configuring my machine and in such a way that I couldn't get lazy and start drifting.

I set to work spinning up a virtual machine to install NixOS on. I decided to make my life a little more difficult and play around with ZFS on root. My current home server had the root on a single SSD whilst all other data sat on ZFS, and it seemed to make sense to me to get everything that I could get on ZFS on ZFS. This was a little more challenging than I first thought it would be due to a lot of conflicting advice on the internet around ZFS on root and NixOS. There's some guidance on the NixOS Wiki that disagrees with the OpenZFS guide on NixOS on ZFS root. I'll probably dive into that in another post in the future.

After a few hours of playing, I was thoroughly impressed. Whilst I couldn't claim to understand much about how Nix worked it seemed pretty damn magic. A few weeks later, the parts for my new home server would arrive courtesy of Bezos and I'd set to work transferring the config I'd used for the VM to the physical machine. It worked flawlessly...

## 28 Days Later

I'm about a month in to having switched my home server to NixOS and I'd say I'm still damn impressed. For the most part, the things I want to install are almost always in NixPkgs and have simple configuration options mapped into NixOS. I've started to pick up Nix much faster than I'd expected when trying to work out how to achieve things that aren't so easy - and I'm definitely interested in exploring this as a tool for my day to day development.

I can definitely recommend giving NixOS a go on a virtual machine - even just to get a feel for the experience it provides. I think we can all learn a lot from the experience this is providing and take away some improvements we can make to other tooling.

I'll likely write up an overview of the configuration of my new home server at some point once I've tried a couple different ways of doing things!