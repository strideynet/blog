---
title: "Fixing a chinese MMDVM_HS_Dual_Hat"
date: 2024-09-04 09:00:00
tags:
- My Setup
- Amateur Radio
- Hasty
---

I recently purchased a cheap clone of the [MMDVM_HS_Dual_Hat](https://github.com/phl0/MMDVM_HS_Dual_Hat) from Amazon to set up with the WPSD hotspot software for DMR. I had a lot of trouble trying to get it working, and, couldn't find any resources on the net with an answer, so I figured I'd publish this in case it was useful to someone else. 

## Symptoms

Upon getting it out of the box, and setting it up, I encountered a range of weird symptoms.

I'd gone through and set it up as the `MMDVM_HS_Dual_Hat` modem type, and in Duplex mode. The "DMR" mode flashed green and then turned a disappointing red. Attempting to connect to it with my DMR handheld yielded no success.

I looked through the logs for the MMDVM host and noticed that the device itself was instead reporting itself as  `MMDVM_HS_Hat-v1.3.3 20180224 ADF7021 FW by CA6JAU GitID #62323e7` before hanging at the "Opening the MMDVM" stage. This was a little unusual, I'd expected that it would at least include the word "dual" somewhere in there!

## Bodging my way to success

I then figured I'd try setting it up as the modem type that matched that firmware - `MMDVM_HS_Hat`. This yielded a little more success, the MMDVMHost logs seemed to indicate that it was getting a little further into the initialization, however, the DMRGateway logs then indicated that Brandmeister was rejecting the connection due to misconfiguration. Looking a little more closely, I could see that the modem was still being reported as Simplex but with two frequencies configured. I guessed that this was leading to Brandmeister rejecting the connection.

I finally tried setting the modem mode to Simplex - in that hopes that matching what the modem itself was reporting would get me a little further. This did work! I was able to use my DMR HS to connect through to the Brandmeister network.

I wasn't happy with this though - I'd bought the dual hat because I wanted to make use of both DMR timeslots. I had to figure out what was really wrong!

## Searching the net

It's fairly common that you can find the answer to most problems with a well-written Google search. However, in this case, I was not not so lucky. I found several forum threads of folks reporting similar issues - in most cases, they simply gave up or used the device in Simplex mode.

One forum thread felt like it had once contained the answer, with the original poster thanking someone for their answer. I had to re-read a couple of times before I realised that this answer had been deleted...

## Firmware confusion

I revisited one of my earlier discoveries - why had the modem been reporting a firmware that didn't match up with what I had been expecting. I figured the best next steps would be to try to flash the device with the firmware I had been expecting...

This proved a little more challenging than I'd hoped - the device had been shipped "locked" which prevented the WPSD upgrader from modifying the firmware on the device.

Looking through the advice on the GitHub repository for the hardware, I realised that it would be possible to unlock the device by setting a jumper across Boot 1. Unfortunately, the device had not shipped with headers soldered into these pads - but that was easily rectified.

Once I had added the headers and a jumper setting Boot 1 to the "-" position, I retried flashing the firmware on the device - selecting the `MMDVM_HS_Dual_Hat (14.7456Mhz TXCO) GPIO` option. If you aren't sure which TXCO you need, it's written on the tiny oscillator on the board!

After a few minutes of waiting, it succeeded. I went back to the WPSD configuration, and set the modem mode back to Duplex and the type back to the `MMDVM_HS_Dual_Hat` option that I had originally expected to work. After rebooting the system, I saw that the device now reported itself as running `MDVM_HS_Dual_Hat-v1.6.1 20231115_WPSD 14.7456MHz dual ADF7021 FW by CA6JAU, G4KLX, W0CHP. GitID #7e16099`. Things were beginning to look up - the DMR mode indicator had even turned green!

I broke out my handset and was delighted to discover that the modem was now properly functioning in Duplex mode. I have no clue why the device was shipped with the wrong firmware, I can't determine if it was a mistake, or perhaps they ship it with an older firmware for compatability with tools like Pi-Star. Either way, if you have this board and it's not behaving as you'd expect, it's likely worth also updating your firmware!