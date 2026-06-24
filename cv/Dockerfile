# Minimal image with a curated TeX Live install, so the CV PDF can be compiled
# with pdflatex — the engine this template targets — without installing any TeX
# distribution on the host.
#
# Built and run automatically by `npm run cv:pdf` (scripts/generate-cv.ts).
# Everything is baked in at build time, so compiles are fully offline and fast
# once the image exists. The package set covers this template's dependencies
# (titlesec, enumitem, fullpage, fancyhdr, hyperref, tabularx, …); add more
# texlive-* packages here if you introduce a package pdflatex can't find.
FROM debian:bookworm-slim

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        texlive-latex-base \
        texlive-latex-recommended \
        texlive-latex-extra \
        texlive-fonts-recommended \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /work
