#!/usr/bin/env python3
# Lägger in en ombakad ruta i en av väggens färdiga bilder (public/rum/hasse-bak*.webp):
#
#   python3 scripts/hasse/lappa.py ny.png public/rum/hasse-bak.webp x0 y0 x1 y1 [mjuk]
#
# ny.png är bakad med samma ruta (RUTA=x0,y0,x1,y1 node scripts/hasse/baka.mjs …, genomskinlig utanför den). Inom
# rutan tar den nya bilden över, och längs de kanter som inte är bildens egna tonar den in över mjuk bildpunkter
# (standard 36), så att bruset från de två bakningarna inte möts i en kant. Det som ligger utanför rutan rörs inte,
# men hela bilden sparas om som webp med Pillow (kvalitet 88, alfa 90), som de andra.
# Så togs barstolen till höger bort 2026-11-13, när veckans löpsedel kom upp på bardiskens front bredvid den.
import sys

from PIL import Image


def main():
    ny_fil, bild_fil = sys.argv[1], sys.argv[2]
    x0, y0, x1, y1 = (int(v) for v in sys.argv[3:7])
    mjuk = int(sys.argv[7]) if len(sys.argv) > 7 else 36
    gammal = Image.open(bild_fil).convert('RGBA')
    ny = Image.open(ny_fil).convert('RGBA')
    if ny.size != gammal.size:
        raise SystemExit(f'olika storlek: {ny.size} och {gammal.size}')
    W, H = gammal.size
    x1, y1 = min(x1, W), min(y1, H)
    # tonen: 0 utanför rutan, 1 en bit in, en rak ramp mot de kanter som ligger inne i bilden
    mask = Image.new('L', (W, H), 0)
    m = mask.load()
    for y in range(y0, y1):
        ty = 1.0 if y1 >= H and y0 <= 0 else min(1.0, (y - y0 + 0.5) / mjuk) if y0 > 0 else 1.0
        if y1 < H:
            ty = min(ty, (y1 - y - 0.5) / mjuk)
        for x in range(x0, x1):
            tx = min(1.0, (x - x0 + 0.5) / mjuk) if x0 > 0 else 1.0
            if x1 < W:
                tx = min(tx, (x1 - x - 0.5) / mjuk)
            m[x, y] = round(255 * max(0.0, min(tx, ty)))
    # (inom rutan är den nya bilden täckt; utanför den genomskinlig, och där gäller den gamla)
    alfa = ny.crop((x0, y0, x1, y1)).getchannel('A')
    if alfa.getextrema()[0] < 250:
        print('obs: den nya bilden är inte täckt i hela rutan', alfa.getextrema())
    ut = Image.composite(ny, gammal, mask)
    ut.save(bild_fil, 'WEBP', quality=88, alpha_quality=90, method=6)
    print('klart', bild_fil, ut.size)


if __name__ == '__main__':
    main()
