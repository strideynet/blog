---
title: Beware Firebase Auth and GCP CICP
date: '2021-02-08T09:00:00.000Z'
tags:
  - Firebase
  - GCP
  - Auth
  - CICP
draft: false
---

For over two years now, Google has offered a 'Google-grade identity and access management' platform under the Firebase brand as "Firebase Authentication" and under the parent GCP platform as 'Cloud Identity for Customers and Partners (CICP)'. At first sight, they seem to be a fit solution for authentication, but are they all that they seem?

I'll start by at least addresssing the positives of the platform. They provide a relatively quick drop-in solution for authentication that ships supporting multiple popular providers, and that can be extended via SAML and OIDC to support practically anything. My original attraction to the platform was the built-in support for multi-tenancy which allowed me to quickly move forward with a project where the authentication element could have taken weeks of engineering. To their credit, these parts work quite well, and I have not had any performance or reliability issues with the platform. The client libraries are performant, and are available for a wide range of languages.

Custom claims are another extremely useful part of the CICP platform, allowing you to attach additional data to the user that can be read as part of Firestore rules, or when consuming the tokens as part of your own API. This can be handy when trying to bootstrap a project and you don't yet want to build up tracking for user roles as part of your own database.

## Extremely vulnerable to credential stuffing

Perhaps my greatest concern, is the extent to which the CICP platform is vulnerable to credential stuffing when using the email/password provider. It is clear that some security has been dropped here in order to provide a better user experience, but this should at least be made clearer to developers.

The first issue, is that an auth endpoint exists (``/identitytoolkit/v3/relyingparty/createAuthUri``) that makes it clear whether or not an account is registered to a specific email address, before a password is even provided. This provides attackers with the ability to work out which accounts to focus more effort onto when attempting to brute-force logins with known credentials.

The second, much larger, issue is that there does not appear to be functioning rate-limiting of the auth endpoints. This combined with the first issue makes it extremely easy for attackers to try known email/password combinations from previous attacks. I've witnessed this on projects I've worked on, where it's clear from the API metrics that a large amount of incorrect details are being tried against the endpoints, with the occasional success. This seems to directly contravene Google's claim that "Identity platform is integrated with Google's intelligence and threat signals to help detect compromised user accounts".

## Inflexible MFA support

MFA support became generally available in August of 2020, some year and a half after the initial release of the CICP platform. The introduced support works well, however is quite restricted.

The first restriction is that they have only chosen to offer SMS based MFA. This is frustrating for a few reasons, the first being that plenty of users are expecting to be able to use their password manager or app to generate TOTP MFA codes, and this can be more convenient where multiple users in an organisation may be sharing an account when compared to an SMS being sent to an individual's phone. The second reason, price. Generating and validating a TOTP costs essentially nothing, whereas SMS costs could become significant where users have a low lifetime value.

The second restriction I see, is that MFA seems to only be possible for initial login. There's no way of requesting that a user provides an additional code when completing a particularly sensitive action. Whilst this is not an issue for plenty of developers, if your application is security-sensitive then this is definitely something to consider when thinking about CICP.

## Summary

Whilst CICP helps you bootstrap quickly, more attention is needed to the security of the platform if it is to remain viable for projects where users require the utmost security. I look forward to what Google may have to offer in future with this platform, but there is a long way to go before I will be considering using it on any new projects.
