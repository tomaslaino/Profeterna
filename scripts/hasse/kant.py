#!/usr/bin/env python3
"""Mjukar upp Hasse Backes kontur i hasse-atlas.webp (fotots del, inte ärmens remsa eller huden).

Fotot är urklippt som ett polygon med raka bitar och hörn (klipp.swift), och mot den mörka baren såg
håret ut som om det var klippt med sax: en platt topp, ett trappsteg till höger och en hård, ljus kant.
Här görs hårets kontur rund och mjuk, och resten av huvudet (öronen, halsen) får bara kantutjämning:

- håret (ljust och grått, ovanför öronen): masken suddas kraftigt (SUDD bildpunkter) och tröskas vid
  hälften, så att polygonets hörn blir bågar utan att huvudet blir större eller mindre; kanten är sedan
  KANT bildpunkter mjuk, och där sticker de ljusa stråna ut lite och gliporna mellan dem tunnas ut;
- resten ovanför axlarna: en halv bildpunkts mjukare kant;
- där konturen går utanför den gamla får bildpunkterna färgen från det som syns närmast innanför.

Det inre av fotot är orört; bilden packas om med samma kvalitet som förut ungefär (webp 88, alfa 92).

Köra om (Pillow och numpy):
    python3 scripts/hasse/kant.py public/rum/hasse-atlas.webp public/rum/hasse-atlas.webp
Körs bara en gång på en atlas: körs den igen på resultatet blir håret ännu mjukare. Görs atlasen om
(baka.mjs atlas) ska det här köras efteråt.
"""
import sys

import numpy as np
from PIL import Image

SUDD = 16
KANT = 3
STRAN = 4
# fotots del av atlasen (ATLAS.TW i public/rum-hasse-arm.js); till höger ligger ärmen och huden
TW = 860


def sudda(x, s):
    """Gaussisk oskärpa (s bildpunkter), i två led."""
    r = max(1, int(3 * s + 0.5))
    k = np.exp(-0.5 * (np.arange(-r, r + 1) / s) ** 2).astype(np.float32)
    k /= k.sum()
    for ax in (0, 1):
        p = np.pad(x, [(r, r) if i == ax else (0, 0) for i in range(2)], mode='edge')
        n = x.shape[ax]
        x = sum(k[i] * (p[i:i + n] if ax == 0 else p[:, i:i + n]) for i in range(2 * r + 1))
    return x


def ss(a, b, x):
    t = np.clip((x - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)


def main(src, dst):
    a = np.asarray(Image.open(src).convert('RGBA')).astype(np.float32) / 255
    H, W = a.shape[:2]
    A = a[..., 3]
    C = a[..., :3]
    # färgen utanför konturen: genomsnittet av det som syns närmast (allt vidare tills den är ifylld)
    P = C * A[..., None]
    fyll = C.copy()
    klar = A >= 0.5
    for s in (1.5, 3, 6, 12, 24):
        den = sudda(A, s)
        est = np.stack([sudda(P[..., k], s) for k in range(3)], -1) / np.maximum(den, 1e-4)[..., None]
        ny = ~klar & (den > 0.02)
        fyll[ny] = est[ny]
        klar |= ny
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    # huvudet och halsen, ned till axlarna, i fotots del
    omr = (1 - ss(470, 540, yy)) * (1 - ss(TW - 60, TW - 10, xx))
    # håret: ljust och grått, ovanför öronen
    lum = fyll @ np.array([0.3, 0.59, 0.11], np.float32)
    sat = fyll.max(-1) - fyll.min(-1)
    har = sudda(ss(0.42, 0.6, lum) * (1 - ss(0.1, 0.2, sat)) * (1 - ss(330, 380, yy)), 5)
    # hårets kontur: rundad och mjuk, med strån
    Ab = sudda(A, SUDD)
    w = np.maximum(np.hypot(*np.gradient(Ab)), 1e-4) * KANT / 2
    As = ss(0.5 - w, 0.5 + w, Ab)
    hp = lum - sudda(lum, 2)
    As = np.clip(As + 4 * As * (1 - As) * np.clip(hp * STRAN, -0.6, 0.6), 0, 1)
    # resten: bara kantutjämnad
    Am = sudda(A, 0.6)
    An = A + (Am + (As - Am) * har - A) * omr
    ut = np.concatenate([np.where((An > A)[..., None], fyll, C), An[..., None]], -1)
    bild = Image.fromarray((np.clip(ut, 0, 1) * 255 + 0.5).astype(np.uint8), 'RGBA')
    bild.save(dst, 'WEBP', quality=88, alpha_quality=92, method=6)


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
