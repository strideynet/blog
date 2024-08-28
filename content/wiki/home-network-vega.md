---
title: Vega - NixOS Home Server
---

## Managing configuration
As this is only a single machine, I've kept this fairly simple. I have a repository that contains my personal Nix flake and I use a simple script to SCP this to the server and then use SSH to execute `nixos-rebuild switch`. This means that the first time around, I have to manually bootstrap the machine, but I don't see myself regularly rebuilding.
## Filesystem
The primary filesystem in use on the host is ZFS. Storage on the host is divided into two pools:
- `rpool`
	- SSDs in mirrored vdevs.
	- Stores most operating system files, application data etc.
- `rust`
	- Large, spinning disks in mirrored vdevs.
	- Stores backups, media etc.

Because of various issues (e.g swap on ZFS, need for EFI partitions), ZFS is given a partition on the SSDs rather than the full SSD.

My datasets are organised as follows:
- `rpool`
	- `rpool/local`
		- Container dataset for datasets that do not need to be snapshotted or backed up.
		- `rpool/local/nix` -> `/nix`
	- `rpool/system`
		- Container dataset for datasets that should occasionally be snapshotted, but do not hold data critical enough to be worth backing up.
		- `rpool/system/root` -> `/`
	- `rpool/user`
		- Container dataset for datasets which should be snapshotted and backed up regularly.
		- `rpool/user/home/noah` -> `/home/noah`
- `rust`
	- This is an older pool which has not been re-arranged to be more organised.
	- `rust/media` -> `/mnt/media`
	- `rust/store-noah` -> `/home/noah/rust`
	- `rust/timemachine-noah` -> `/mnt/timemachine/noah`

**Resources:**
- https://openzfs.github.io/openzfs-docs/Getting%20Started/NixOS/Root%20on%20ZFS.html
- https://grahamc.com/blog/nixos-on-zfs/

## Services
### Caddy
https://caddyserver.com/

Caddy looks after forwarding traffic to :443 to the correct service based on the hostname. It also manages fetching a TLS certificate to secure this traffic - I use a DNS based challenge so that my host doesn't have to be internet facing but can still receive a real (and trusted) TLS certificate.
### Home Assistant
https://www.home-assistant.io/

Home Assistant powers my various home automations. This has been deployed as a container, mostly because I don't want to have to maintain a whole different Linux host as is required with the VM deployment.
### Samba
Samba is used to share directories to Linux, Windows and macOS hosts across our network.
#### Time Machine
Samba shares can be used by macOS as a target for Time Machine backups. This requires use of the so-called "fruit" extensions.

**Resources:**
- https://blog.jhnr.ch/2023/01/09/setup-apple-time-machine-network-drive-with-samba-on-ubuntu-22.04/
- https://www.jpatrickfulton.dev/blog/2023-06-23-samba-and-timemachine/
- https://nixos.wiki/wiki/Samba#Apple_Time_Machine

There's a small amount of tweaking necessary to support backing up Apple TimeMachine to a Samba server:

```nix
--snip--
  services.samba = {
    enable = true;
    securityType = "user";
    openFirewall = true;
    extraConfig = ''
      workgroup = WORKGROUP
      server string = vega
      netbios name = vega
      security = user
      #use sendfile = yes
      #max protocol = smb2
      # note: localhost is the ipv6 localhost ::1
      hosts allow = 10.42.0.0/16 127.0.0.1 localhost
      hosts deny = 0.0.0.0/0
      guest account = nobody
      map to guest = bad user
      vfs objects = fruit streams_xattr  
      fruit:metadata = stream
      fruit:model = MacSamba
      fruit:posix_rename = yes 
      fruit:veto_appledouble = no
      fruit:nfs_aces = no
      fruit:wipe_intentionally_left_blank_rfork = yes 
      fruit:delete_empty_adfiles = yes 
    '';
    shares = {
      noah = {
        path = "/home/noah";
        browseable = "yes";
        writeable = "yes";
        public = "no";
        "valid users" = "noah";
      };
      noah-tm = {
          "fruit:time machine" = "yes";
          path = "/mnt/timemachine/noah";
          browseable = "yes";
          writeable = "yes";
          public = "no";
          "valid users" = "noah";
      };
--snip--
```
