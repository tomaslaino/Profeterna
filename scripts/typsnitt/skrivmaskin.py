#!/usr/bin/env python3
"""Bygger typsnittet Skrivmaskin ur Special Elite (Astigmatic, Apache 2.0).

Ändringar mot originalet, som licensen kräver att de anges:
- alla tecken står i samma bredd (CELL), som på en riktig skrivmaskin; breda tecken trycks ihop;
- varje tecken finns i ANSLAG varianter som skiljer sig åt: lite högre eller lägre, lite åt sidan,
  lite snett, och med olika hårt anslag (svagt, ojämnt, normalt eller dubbelslag);
- varje tecken har också ett eget fel som alltid sitter kvar, som en sned typarm;
- GSUB-funktionen calt byter variant för varje tecken i raden, så att ingen bokstav blir den andra lik
  utan att sidan behöver göra något. ss01–ss06 börjar raden på ett annat anslag, så att samma ord på
  två rader (lör 16:00) inte blir likadant.

Varianterna är sammansatta glyfer (en hänvisning + förflyttning), så filen växer måttligt: bara de svaga
och ojämna anslagen är egna konturer.

Köra om:  python3 -m venv v && v/bin/pip install fonttools brotli skia-pathops
          v/bin/python scripts/typsnitt/skrivmaskin.py
"""
import math
import random
import sys
import zlib
from pathlib import Path

from fontTools.feaLib.builder import addOpenTypeFeaturesFromString
from fontTools.pens.ttGlyphPen import TTGlyphPen
from fontTools.ttLib import TTFont
from fontTools.ttLib.tables import ttProgram
from fontTools.ttLib.tables._g_l_y_f import Glyph, GlyphComponent
import pathops

ROT = Path(__file__).resolve().parents[2] / 'public' / 'typsnitt'
# Originalen ligger kvar bredvid byggskriptet: public/ ska bara ha det som sidan använder.
KALLA = Path(__file__).resolve().parent / 'kalla'

CELL = 1130        # bredden på varje tecken (2048 på em:et)
ANSLAG = 7         # så många varianter av varje tecken; primtal, så att mönstret inte går att se
# Hur mycket ett anslag får avvika, i enheter (en bildpunkt vid 14 px = 146 enheter).
HOPP = 62          # upp och ner
SIDA = 32          # åt sidan
VRID = 2.2         # grader
FEL_HOPP = 44      # typarmens eget fel, alltid samma för samma tecken
FEL_SIDA = 26
FEL_VRID = 1.4
TUNT = 15          # svagt anslag: så mycket tas bort runt konturen
OJAMNT = 34        # ojämnt anslag: så mycket tas bort på ena halvan
TOLERANS = 3.6     # så långt från originalets kontur en förenkling får gå
RUTNAT = 2         # konturernas punkter rundas hit, för att packas bättre
KRAFTIGARE = {'zero': 20}  # originalets nolla är tunnare än de andra siffrorna
DUBBEL = (11, -8)  # dubbelslag: samma tecken en gång till, så här långt bort


def slump(*nyckel):
    return random.Random(zlib.crc32('/'.join(map(str, nyckel)).encode()))


def platt(glyf, namn):
    """Tecknets konturglyfer: [(namn, a, b, c, d, dx, dy)], också för sammansatta (ä = a + ¨)."""
    g = glyf[namn]
    if not g.isComposite():
        return [(namn, 1, 0, 0, 1, 0, 0)] if g.numberOfContours else []
    ut = []
    for k in g.components:
        a, b, c, d = 1, 0, 0, 1
        if hasattr(k, 'transform'):
            (a, b), (c, d) = k.transform
        for (n, a2, b2, c2, d2, x2, y2) in platt(glyf, k.glyphName):
            ut.append((n, a2 * a + b2 * c, a2 * b + b2 * d, c2 * a + d2 * c, c2 * b + d2 * d,
                       x2 * a + y2 * c + k.x, x2 * b + y2 * d + k.y))
    return ut


def tillPath(gs, namn):
    p = pathops.Path()
    gs[namn].draw(p.getPen(glyphSet=gs))
    return p


def dp(punkter, tol):
    """Douglas-Peucker på en sluten kontur: punkter som inte syns tas bort."""
    if len(punkter) < 4:
        return punkter
    def avst(p, a, b):
        ax, ay = a; bx, by = b; px, py = p
        dx, dy = bx - ax, by - ay
        n = dx * dx + dy * dy
        if not n:
            return math.hypot(px - ax, py - ay)
        t = max(0, min(1, ((px - ax) * dx + (py - ay) * dy) / n))
        return math.hypot(px - ax - t * dx, py - ay - t * dy)
    # delas på de två punkter som ligger längst ifrån varandra
    i0 = 0
    i1 = max(range(len(punkter)), key=lambda i: math.hypot(punkter[i][0] - punkter[0][0], punkter[i][1] - punkter[0][1]))
    def del_(lst):
        behall = [False] * len(lst)
        behall[0] = behall[-1] = True
        stack = [(0, len(lst) - 1)]
        while stack:
            a, b = stack.pop()
            if b - a < 2:
                continue
            k, d = max(((i, avst(lst[i], lst[a], lst[b])) for i in range(a + 1, b)), key=lambda x: x[1])
            if d > tol:
                behall[k] = True
                stack += [(a, k), (k, b)]
        return [p for p, ja in zip(lst, behall) if ja]
    a = del_(punkter[i0:i1 + 1])
    b = del_(punkter[i1:] + punkter[:1])
    return a[:-1] + b[:-1]


class PlattPen:
    """Konturen som brutna linjer, förenklad, och rundad till RUTNAT."""
    def __init__(self, ut):
        self.ut, self.p = ut, []
    def moveTo(self, a):
        self.p = [a]
    def lineTo(self, a):
        self.p.append(a)
    def qCurveTo(self, *pts):
        # TrueType-kurva med underförstådda punkter: delas i enkla kvadratiska
        p0 = self.p[-1]
        for i in range(len(pts) - 1):
            c = pts[i]
            s = pts[i + 1] if i == len(pts) - 2 else ((pts[i][0] + pts[i + 1][0]) / 2, (pts[i][1] + pts[i + 1][1]) / 2)
            n = max(2, min(6, int(math.hypot(s[0] - p0[0], s[1] - p0[1]) / 14) + 1))
            for k in range(1, n + 1):
                t = k / n
                self.p.append(((1 - t) ** 2 * p0[0] + 2 * t * (1 - t) * c[0] + t * t * s[0],
                               (1 - t) ** 2 * p0[1] + 2 * t * (1 - t) * c[1] + t * t * s[1]))
            p0 = s
    def curveTo(self, *pts):
        p0 = self.p[-1]
        c1, c2, s = pts
        for k in range(1, 7):
            t = k / 6
            self.p.append(tuple((1 - t) ** 3 * p0[j] + 3 * t * (1 - t) ** 2 * c1[j] + 3 * t * t * (1 - t) * c2[j] + t ** 3 * s[j] for j in (0, 1)))
    def closePath(self):
        q = dp(self.p, TOLERANS)
        q = [(round(x / RUTNAT) * RUTNAT, round(y / RUTNAT) * RUTNAT) for x, y in q]
        r = [a for i, a in enumerate(q) if a != q[i - 1]]
        if len(r) >= 3:
            self.ut.moveTo(r[0])
            for a in r[1:]:
                self.ut.lineTo(a)
            self.ut.closePath()
        self.p = []
    endPath = closePath
    def addComponent(self, *a, **k):
        raise NotImplementedError


def tillGlyf(p):
    p.convertConicsToQuads()
    pen = TTGlyphPen(None)
    p.draw(PlattPen(pen))
    return pen.glyph()


def skar(a, b, slag):
    """Mängdoperation; konturerna från stroke() har konor, som operationen inte tål."""
    a.convertConicsToQuads()
    b.convertConicsToQuads()
    ut = pathops.op(a, b, slag, fix_winding=True)
    ut.convertConicsToQuads()
    return ut


def yta(p):
    q = pathops.Path(p)
    q.convertConicsToQuads()
    return abs(q.area)


def tunnare(gs, namn, r):
    """Svagt anslag: konturen äts av runt om."""
    p = tillPath(gs, namn)
    kant = pathops.Path(p)
    kant.stroke(TUNT * 2, pathops.LineCap.ROUND_CAP, pathops.LineJoin.ROUND_JOIN, 4)
    return skar(p, kant, pathops.PathOp.DIFFERENCE)


def ojamn(gs, namn, r, box):
    """Ojämnt anslag: typen slår snett, så ena halvan blir tunnare och får hål i färgen."""
    x0, y0, x1, y1 = box
    mx, my = (x0 + x1) / 2, (y0 + y1) / 2
    sida = r.choice('ovhn')
    halva = pathops.Path()
    pen = halva.getPen()
    R = (x0 - 80, y0 - 80, x1 + 80, y1 + 80)
    rek = {'o': (R[0], my, R[2], R[3]), 'n': (R[0], R[1], R[2], my), 'v': (R[0], R[1], mx, R[3]), 'h': (mx, R[1], R[2], R[3])}[sida]
    pen.moveTo((rek[0], rek[1])); pen.lineTo((rek[2], rek[1])); pen.lineTo((rek[2], rek[3])); pen.lineTo((rek[0], rek[3])); pen.closePath()
    p = tillPath(gs, namn)
    kant = pathops.Path(p)
    kant.stroke(OJAMNT * 2, pathops.LineCap.ROUND_CAP, pathops.LineJoin.ROUND_JOIN, 4)
    bort = skar(kant, halva, pathops.PathOp.INTERSECTION)
    ut = skar(p, bort, pathops.PathOp.DIFFERENCE)
    # hålen i färgen
    prick = pathops.Path()
    pen = prick.getPen()
    for _ in range(r.randint(2, 4)):
        x, y = r.uniform(rek[0], rek[2]), r.uniform(rek[1], rek[3])
        s = r.uniform(9, 20)
        pen.moveTo((x - s, y - s * 0.6)); pen.lineTo((x + s * 0.7, y - s)); pen.lineTo((x + s, y + s * 0.5)); pen.lineTo((x - s * 0.5, y + s)); pen.closePath()
    return skar(ut, prick, pathops.PathOp.DIFFERENCE)


def bygg(kalla, ut):
    f = TTFont(kalla)
    glyf = f['glyf']
    hmtx = f['hmtx']
    gs = f.getGlyphSet()
    cmap = f.getBestCmap()
    ordning = f.getGlyphOrder()
    tecken = sorted(set(cmap.values()), key=ordning.index)
    tecken = [g for g in tecken if g != '.notdef']
    tecken_set = set(tecken)

    delar = {g: platt(glyf, g) for g in tecken}
    konturer = sorted({d[0] for v in delar.values() for d in v})
    anslagna = {d[0] for u, g in cmap.items() if g in delar and chr(u).isalnum() for d in delar[g]}

    # Konturerna flyttas till egna glyfer: g.o (normal), g.l (svag), g.u (ojämn).
    nya = {}
    for n in konturer:
        g = glyf[n]
        pen = TTGlyphPen(None)
        if n in KRAFTIGARE:
            p = tillPath(gs, n)
            kant = pathops.Path(p)
            kant.stroke(KRAFTIGARE[n] * 2, pathops.LineCap.ROUND_CAP, pathops.LineJoin.ROUND_JOIN, 4)
            nya[f'{n}.o'] = tillGlyf(skar(p, kant, pathops.PathOp.UNION))
        else:
            gs[n].draw(PlattPen(pen))
            nya[f'{n}.o'] = pen.glyph()
        r = slump('kontur', n)
        g.recalcBounds(glyf)
        box = (g.xMin, g.yMin, g.xMax, g.yMax)
        hel = yta(tillPath(gs, n))
        # bara bokstäver och siffror får egna svaga anslag: det är där de syns, och filen blir mindre
        if n not in anslagna:
            nya[f'{n}.l'] = nya[f'{n}.u'] = nya[f'{n}.o']
            continue
        for suffix, p in (('l', tunnare(gs, n, r)), ('u', ojamn(gs, n, r, box))):
            # små tecken (punkter, accenter) får inte ätas upp
            if yta(p) < hel * 0.5:
                p = tillPath(gs, n)
            nya[f'{n}.{suffix}'] = tillGlyf(p)

    # Tecknets ruta, för att centrera det i cellen och trycka ihop det som är för brett.
    def box_for(g):
        x = []
        for (n, a, b, c, d, dx, dy) in delar[g]:
            k = glyf[n]
            k.recalcBounds(glyf)
            for (px, py) in ((k.xMin, k.yMin), (k.xMax, k.yMin), (k.xMin, k.yMax), (k.xMax, k.yMax)):
                x.append(px * a + py * c + dx)
        return (min(x), max(x)) if x else (0, 0)

    def sammansatt(g, i):
        """Variant i av tecknet g: samma tecken, annat anslag."""
        fel = slump('fel', g)
        fy, fx, fv = fel.uniform(-FEL_HOPP, FEL_HOPP), fel.uniform(-FEL_SIDA, FEL_SIDA), fel.uniform(-FEL_VRID, FEL_VRID)
        r = slump('anslag', g, i)
        dy = fy + r.uniform(-HOPP, HOPP)
        dx = fx + r.uniform(-SIDA, SIDA)
        v = math.radians(fv + r.uniform(-VRID, VRID))
        slag = r.choices('oluh', weights=(48, 26, 12, 14))[0]
        x0, x1 = box_for(g)
        bredd = x1 - x0
        sx = min(1.0, (CELL - 70) / bredd) if bredd else 1.0
        mitt = (x0 + x1) / 2 * sx
        cx, cy = CELL / 2, 500  # vrids kring tecknets mitt
        cos, sin = math.cos(v), math.sin(v)
        ny = Glyph()
        ny.numberOfContours = -1
        ny.components = []

        def lagg(n, suffix, a, b, c, d, x, y, extra=(0, 0), forsta=False):
            # delen: skala i x, sedan vridning kring cellens mitt, sedan förflyttning
            a1, b1, c1, d1 = a * sx, b, c * sx, d
            x1_, y1_ = x * sx - mitt + cx, y
            a2, b2 = a1 * cos - b1 * sin, a1 * sin + b1 * cos
            c2, d2 = c1 * cos - d1 * sin, c1 * sin + d1 * cos
            xr, yr = x1_ - cx, y1_ - cy
            x2 = xr * cos - yr * sin + cx + dx + extra[0]
            y2 = xr * sin + yr * cos + cy + dy + extra[1]
            k = GlyphComponent()
            k.glyphName = f'{n}.{suffix}'
            k.x, k.y = round(x2), round(y2)
            k.flags = 0
            k.transform = ((a2, b2), (c2, d2))
            ny.components.append(k)

        for (n, a, b, c, d, x, y) in delar[g]:
            if slag == 'h':
                lagg(n, 'o', a, b, c, d, x, y)
                lagg(n, 'o', a, b, c, d, x, y, extra=DUBBEL)
            else:
                lagg(n, slag, a, b, c, d, x, y)
        return ny

    varianter = {}
    for g in tecken:
        if not delar[g]:
            continue
        if hmtx[g][0] == 0:
            continue
        for i in range(ANSLAG):
            varianter[(g, i)] = sammansatt(g, i)

    # Nu byts allt ut: tecknen blir hänvisningar, konturerna ligger i .o/.l/.u.
    behalls = ['.notdef']
    nyordning = list(behalls)
    tabell = {'.notdef': glyf['.notdef']}
    bredd = {'.notdef': (CELL, 0)}
    for n, g in nya.items():
        tabell[n] = g
        bredd[n] = (CELL, 0)
        nyordning.append(n)
    tomma = [g for g in tecken if not delar[g]]  # mellanslag och annat utan kontur
    for g in tecken:
        if (g, 0) in varianter:
            tabell[g] = varianter[(g, 0)]
            bredd[g] = (CELL, 0)
        elif g in tomma:
            tom = Glyph()
            tom.numberOfContours = 0
            tabell[g] = tom
            bredd[g] = (CELL, 0)
        else:
            # kombinerande tecken (ingen bredd): rörs inte
            tabell[g] = glyf[g]
            bredd[g] = hmtx[g]
        nyordning.append(g)
    alt = []
    def namn_for(g, i):
        return f'{g}.s{i}'
    for (g, i), v in varianter.items():
        if i:
            n = namn_for(g, i)
            tabell[n] = v
            bredd[n] = (CELL, 0)
            alt.append(n)
    nyordning += alt
    # mellanslaget och andra tomma tecken räknar också, så att raden fortsätter genom dem
    for g in tomma:
        for i in range(1, ANSLAG):
            n = namn_for(g, i)
            tom = Glyph()
            tom.numberOfContours = 0
            tabell[n] = tom
            bredd[n] = (CELL, 0)
            nyordning.append(n)

    for t in ('GPOS', 'GSUB', 'GDEF', 'kern'):
        if t in f:
            del f[t]
    f.setGlyphOrder(nyordning)
    glyf.glyphOrder = nyordning
    glyf.glyphs = tabell
    hmtx.metrics = bredd
    # ingen hintning: varianterna ska få stå där de hamnar
    for g in tabell.values():
        if hasattr(g, 'data'):
            g.expand(glyf)
        if g.isComposite():
            if hasattr(g, 'program'):
                del g.program
            for k in g.components:
                k.flags = 0
        elif g.numberOfContours > 0:
            g.program = ttProgram.Program()
            g.program.fromBytecode(b'')
    # vänstermarginalen i måtten måste stämma med konturen: annars klipps smala tecken, och
    # FreeType (Android) flyttar dem
    for n, g in tabell.items():
        if g.numberOfContours:
            g.recalcBounds(glyf)
            hmtx.metrics[n] = (hmtx.metrics[n][0], g.xMin)
    f['post'].formatType = 3.0
    f['post'].isFixedPitch = 0
    if 'gasp' in f:
        del f['gasp']

    # calt: varje tecken får nästa anslag efter det förra
    cykel = [g for g in tecken if (g, 0) in varianter or g in tomma]
    kl = {i: ' '.join(g if i == 0 else namn_for(g, i) for g in cykel) for i in range(ANSLAG)}
    fea = ''.join(f'@s{i} = [{kl[i]}];\n' for i in range(ANSLAG))
    fea += '@alla = [' + ' '.join(f'@s{i}' for i in range(ANSLAG)) + '];\n'
    for i in range(1, ANSLAG):
        fea += f'lookup till{i} {{ sub @s0 by @s{i}; }} till{i};\n'
    # ssNN: första tecknet i raden börjar på ett annat anslag (först, så att calt fortsätter därifrån)
    for ss in range(1, ANSLAG):
        fea += f"feature ss{ss:02d} {{\n  ignore sub @alla @s0';\n  sub @s0' lookup till{ss};\n}} ss{ss:02d};\n"
    fea += 'feature calt {\n'
    for i in range(ANSLAG - 1):
        fea += f"  sub @s{i} @s0' lookup till{i + 1};\n"
    fea += '} calt;\n'
    addOpenTypeFeaturesFromString(f, fea)

    # namnen
    for rec in f['name'].names:
        if rec.nameID in (1, 16):
            rec.string = 'Skrivmaskin'
        elif rec.nameID == 4:
            rec.string = 'Skrivmaskin Regular'
        elif rec.nameID == 6:
            rec.string = 'Skrivmaskin-Regular'
        elif rec.nameID == 3:
            rec.string = 'Skrivmaskin; bygger pa Special Elite'
    f['name'].setName('Modifierad version av Special Elite: en bredd, varierande anslag (scripts/typsnitt/skrivmaskin.py).', 10, 3, 1, 0x409)

    f.flavor = 'woff2'
    f.save(ut)
    print(Path(ut).name, Path(ut).stat().st_size, 'byte,', len(nyordning), 'glyfer')


if __name__ == '__main__':
    for del_ in ('latin', 'latin-ext'):
        bygg(KALLA / f'special-elite-{del_}.woff2', ROT / f'skrivmaskin-{del_}.woff2')
