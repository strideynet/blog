---
title: "Customizing Caddy Plugins in NixOS"
date: 2024-09-02 09:00:00
tags:
- My Setup
- NixOS
---

AKA: How do I get the ACME DNS providers (Cloudflare etc) installed in Caddy on NixOS?!

Another short and sweet one since it took me a couple of hours to figure this out and I couldn't find any nice resources on this across the net. Bear in mind - I'm a bit of a Nix newbie - so my advice might not be the best!

Caddy is an awesome web server/reverse proxy, but it's made even more awesome by the plugins you can install in it. These plugins allow you to do many things, but the most useful to me was the ability to integrate with a DNS providers API for the purposes of ACME.

Plugins are compiled into Caddy - rather than something you install on top - and the Caddy package available on NixPkgs doesn't come with any of the plugins installed. There's a lot of active discussion on how this could be better offered through NixPkgs, however, it doesn't look like any of the options are moving forward quickly.

In the mean time, there's a few different wasy of approaching the problem. The option I chose was to publish my own package as a flake that had Caddy built with the plugins I wanted. This was made a little easier by a pre-existimg template being available for doing just this: [github.com/pinpox/nixos-caddy-patched](https://github.com/pinpox/nixos-caddy-patched).

This method makes most sense if you're already using Flakes with your NixOS setup. If you aren't then you'll want to try one of the other options listed on these GitHub threads:

- [https://github.com/NixOS/nixpkgs/issues/14671](https://github.com/NixOS/nixpkgs/issues/14671)
- [https://github.com/NixOS/nixpkgs/issues/89268#issuecomment-636529668](https://github.com/NixOS/nixpkgs/issues/89268#issuecomment-636529668)

Once you've followed the instructions on that template, you'll end up with something like this [github.com/strideynet/nixos-caddy-patched](https://github.com/strideynet/nixos-caddy-patched). In my case, I needed the plugins for PorkBun and Cloudflare.

Including your custom package into your NixOS flake is fairly simple. First, you'll need to add it as an input:

```nix
  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable";
    ...snip...
    caddy-patched.url = "github:strideynet/nixos-caddy-patched/main";
    caddy-patched.inputs.nixpkgs.follows = "nixpkgs";
  };
```

Then, you can reference this within your configuration:

```nix
  environment.systemPackages = [
    inputs.caddy-patched.packages.x86_64-linux.caddy;
  ]
```

Apologies if this was a bit short - I figured that getting this out there as a starting point for follow NixOS newbs would be helpful! I'll try and update this at somepoint with some more in-depth explanation.