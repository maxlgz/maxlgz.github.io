# Extraction des silhouettes de la maquette depuis les deux vues officielles.
# Repère de sortie : x en tenons depuis le museau (0) vers l'hélice (96),
# y en plaques depuis le sol (0), z en tenons depuis le plan de symétrie.
#
#   python3 lego/tools/extract.py      (Pillow + numpy)
#
# Lit ref/profil.png (vue de profil, tintin.com/fr/news/5873) et
# ref/dessus.png (vue de dessus, boutique tintin.com), écrit ../profile.js
# et, pour contrôle, overlay-side.png / overlay-top.png (zones détectées
# en couleur sur les photos).
from PIL import Image
import numpy as np, json, os
os.chdir(os.path.dirname(os.path.abspath(__file__)))

S = np.asarray(Image.open('ref/profil.png').convert('RGB')).astype(int)
T = np.asarray(Image.open('ref/dessus.png').convert('RGB')).astype(int)
H, W = S.shape[:2]

# ---------- profil ----------
bg = np.array([246, 246, 246]); dist = np.abs(S - bg).sum(axis=2)
lum = S.mean(axis=2)
mask = dist > 40
mask[848:, :] = False                      # plaque du socle, face supérieure comprise
# fermeture des micro-trous verticaux (liserés clairs de 1 à 4 px)
def close_gaps(m, g=4):
    m = m.copy()
    for x in range(m.shape[1]):
        ys = np.where(m[:, x])[0]
        for a, b in zip(ys[:-1], ys[1:]):
            if 1 < b - a <= g + 1: m[a:b, x] = True
    return m
mask = close_gaps(mask)
NOSE_PX, TAIL_PX = 1798, 156               # museau, bout de l'hélice
PPS = (NOSE_PX - TAIL_PX) / 96.0           # px par tenon
GROUND_PX = 878                            # dessus de la plaque
def sx(px):  return (NOSE_PX - px) / PPS   # px -> tenons
def sy(py):  return (GROUND_PX - py) / PPS * 2.5   # px -> plaques
def col_runs(m, x):
    ys = np.where(m[:, x])[0]
    if not len(ys): return []
    runs, s, p = [], ys[0], ys[0]
    for y in ys[1:]:
        if y == p + 1: p = y; continue
        runs.append((s, p)); s = p = y
    runs.append((s, p)); return runs

# rangées de référence : axe du corps ≈ y 450 px
AXIS_PX = 450
top_px, bot_px = {}, {}
for x in range(TAIL_PX, NOSE_PX + 1):
    runs = col_runs(mask, x)
    body = [r for r in runs if r[0] <= AXIS_PX + 60 and r[1] >= AXIS_PX - 60]
    if body:
        r = body[0]; top_px[x] = r[0]; bot_px[x] = r[1]
# plages où le contour du corps est perturbé (px) : dorsale, verrière, 2e dorsale,
# pectorale, pelvienne, tiges, racine de la caudale
DIST_TOP = [(815, 1360), (470, 610)]
DIST_BOT = [(1190, 1440), (455, 610), (725, 775), (1350, 1400)]
def interp_over(prof, ranges, keys):
    out = dict(prof)
    for a, b in ranges:
        L = [prof[k] for k in range(a - 8, a) if k in prof]; R = [prof[k] for k in range(b + 1, b + 9) if k in prof]
        if not L or not R: continue
        va, vb = np.median(L), np.median(R)
        for x in range(a, b + 1):
            t = (x - a + 4) / (b - a + 8); out[x] = va + (vb - va) * t
    return out
keys = sorted(top_px)
# le corps proprement dit s'arrête à la racine de la caudale
BODY_END_PX = 385
body_top = interp_over(top_px, DIST_TOP, keys)
body_bot = interp_over(bot_px, DIST_BOT, keys)
# lissage médian ±8 px
def med(prof, r=8):
    ks = sorted(prof); out = {}
    for k in ks:
        w = [prof[j] for j in range(k - r, k + r + 1) if j in prof]; w.sort(); out[k] = w[len(w) // 2]
    return out
body_top, body_bot = med(body_top), med(body_bot)

# ---------- éléments au-dessus / au-dessous du corps ----------
def above(x0, x1):
    out = {}
    for x in range(x0, x1 + 1):
        if x not in body_top: continue
        ys = [y for (a, b) in col_runs(mask, x) for y in (a,) if a < body_top[x] - 2]
        runs = [r for r in col_runs(mask, x) if r[0] < body_top[x] - 2]
        if runs: out[x] = (min(r[0] for r in runs), int(body_top[x]))
    return out
RODS = [(722, 778), (1348, 1402)]
def below(x0, x1):
    out = {}
    for x in range(x0, x1 + 1):
        if x not in body_bot or any(a <= x <= b for a, b in RODS): continue
        # première série attachée au ventre, sans sauter de trou
        runs = [r for r in col_runs(mask, x) if r[1] > body_bot[x] + 2 and r[0] <= body_bot[x] + 6]
        if runs: out[x] = (int(body_bot[x]), max(r[1] for r in runs))
    # les colonnes des tiges reprennent la valeur de leurs voisines
    for a, b in RODS:
        L = [out[x] for x in range(a - 6, a) if x in out]; R = [out[x] for x in range(b + 1, b + 7) if x in out]
        if L and R:
            for x in range(a, b + 1):
                if x0 <= x <= x1: t = (x - a) / (b - a + 1); out[x] = (int(L[-1][0] + (R[0][0] - L[-1][0]) * t), int(L[-1][1] + (R[0][1] - L[-1][1]) * t))
    return out
canopy = above(940, 1360)
dorsal = above(815, 1065)
dorsal2 = above(470, 610)
pectoral = below(1190, 1440)
pelvic = below(455, 610)
# caudale verticale : tout le masque à gauche de la racine
caudal, prop = {}, {}
for x in range(TAIL_PX, BODY_END_PX + 1):
    runs = col_runs(mask, x)
    if x < 262:
        prop_runs = [r for r in runs if 360 <= r[0] and r[1] <= 520]
        runs = [r for r in runs if r[1] < 360 or r[0] > 520]
        if prop_runs: prop[x] = (int(min(r[0] for r in prop_runs)), int(max(r[1] for r in prop_runs)))
    if runs: caudal[x] = [(int(a), int(b)) for a, b in runs]

# ---------- livrée : transition noir -> crème dans le corps ----------
livery = {}
for x in range(BODY_END_PX, NOSE_PX + 1):
    if x not in top_px: continue
    t, b = int(body_top[x]), int(body_bot[x])
    col = lum[t:b + 1, x]
    d = np.where(col < 90)[0]
    if not len(d): continue
    after = np.where(col[d[0]:] > 130)[0]
    if len(after): livery[x] = t + d[0] + after[0]
livery = med(livery, 3)

# ---------- dessus ----------
bgT = np.array([247, 247, 247]); distT = np.abs(T - bgT).sum(axis=2); lumT = T.mean(axis=2)
mT = close_gaps(distT > 40)
NOSE_T, TAIL_T = 1843, 156
PPT = (NOSE_T - TAIL_T) / 96.0
CENTER_T = 490
def tx(px): return (NOSE_T - px) / PPT
def tz(py): return (py - CENTER_T) / PPT
width = {}
for x in range(TAIL_T, NOSE_T + 1):
    runs = col_runs(mT, x)
    body = [r for r in runs if r[0] <= CENTER_T + 40 and r[1] >= CENTER_T - 40]
    if body: width[x] = (body[0][0], body[0][1])
# la plaque du socle (x 750-1500 px) noie les bords du corps : on interpole
PLATE_T = (738, 1518)
wtop = interp_over({x: v[0] for x, v in width.items()}, [PLATE_T, (1235, 1370)], sorted(width))
wbot = interp_over({x: v[1] for x, v in width.items()}, [PLATE_T, (1235, 1370)], sorted(width))
# verrière : trou clair dans le corps, x 900-1360 px
canopyT = {}
for x in range(900, 1360):
    ys = np.where(lumT[300:700, x] > 110)[0] + 300
    inside = [y for y in ys if wtop.get(x, 0) < y < wbot.get(x, 1e9)]
    if len(inside) > 4: canopyT[x] = (min(inside), max(inside))
# pectorale vue de dessus : dépassement latéral, x 1235-1370
pectT = {}
for x in range(1235, 1370):
    runs = col_runs(mT, x)
    ext = [r for r in runs if r[0] <= CENTER_T + 40 and r[1] >= CENTER_T - 40]
    if ext: pectT[x] = (ext[0][0], ext[0][1])
# caudale horizontale : étendue en z à gauche de la racine
caudT = {}
for x in range(TAIL_T, 400):
    runs = col_runs(mT, x)
    if x < 270: runs = [r for r in runs if r[1] < CENTER_T - 45 or r[0] > CENTER_T + 45]
    if runs: caudT[x] = [(int(a), int(b)) for a, b in runs]

# ---------- conversion en tenons / plaques, par tenon entier ----------
def per_stud(prof, conv_x, conv_y, agg):
    out = {}
    for px, v in prof.items():
        k = int(conv_x(px))
        out.setdefault(k, []).append(v)
    return {k: agg(vs) for k, vs in out.items()}
P = {}
P['top']    = per_stud(body_top, sx, sy, lambda v: round(sy(np.median(v)), 1))
P['bot']    = per_stud(body_bot, sx, sy, lambda v: round(sy(np.median(v)), 1))
P['livery'] = per_stud(livery,   sx, sy, lambda v: round(sy(np.median(v)), 1))
P['halfw']  = per_stud({x: (wbot[x] - wtop[x]) / 2 for x in wtop if x in wbot}, tx, None, lambda v: round(np.median(v) / PPT, 2))
P['canopy'] = per_stud(canopy, sx, sy, lambda v: [round(sy(np.median([a for a, b in v])), 1), round(sy(np.median([b for a, b in v])), 1)])
P['canopyHalfZ'] = per_stud(canopyT, tx, None, lambda v: round(np.median([(b - a) / 2 for a, b in v]) / PPT, 2))
P['dorsal'] = per_stud(dorsal, sx, sy, lambda v: round(sy(np.median([a for a, b in v])), 1))
P['dorsal2'] = per_stud(dorsal2, sx, sy, lambda v: round(sy(np.median([a for a, b in v])), 1))
P['pectoral'] = per_stud(pectoral, sx, sy, lambda v: [round(sy(np.median([a for a, b in v])), 1), round(sy(np.median([b for a, b in v])), 1)])
P['pectoralHalfZ'] = per_stud(pectT, tx, None, lambda v: round(np.median([(b - a) / 2 for a, b in v]) / PPT, 2))
P['pelvic'] = per_stud(pelvic, sx, sy, lambda v: [round(sy(np.median([a for a, b in v])), 1), round(sy(np.median([b for a, b in v])), 1)])
# caudales : par tenon, liste des intervalles (plaques) ; horizontale : intervalles en z
def runs_per_stud(prof, conv_x, conv):
    out = {}
    for px, runs in prof.items():
        k = int(conv_x(px)); out.setdefault(k, []).append([(conv(b), conv(a)) if conv(a) > conv(b) else (conv(a), conv(b)) for a, b in runs])
    res = {}
    for k, lists in out.items():
        mid = lists[len(lists) // 2]
        res[k] = [[round(a, 1), round(b, 1)] for a, b in mid]
    return res
P['caudalV'] = runs_per_stud(caudal, sx, sy)
P['caudalH'] = runs_per_stud(caudT, tx, tz)
P['propeller'] = {'x': [round(sx(max(prop)), 1), round(sx(min(prop)), 1)], 'y': [round(sy(max(b for a, b in prop.values())), 1), round(sy(min(a for a, b in prop.values())), 1)]} if prop else None
P['eye'] = {'x': round(sx(1622), 1), 'y': round(sy(408), 1), 'r': 0.9}
P['gills'] = {'x': [round(sx(px), 1) for px in (1418, 1436, 1454, 1472)], 'y': [round(sy(478), 1), round(sy(446), 1)]}
P['meta'] = {'pps_side': PPS, 'pps_top': PPT, 'ground_px': GROUND_PX, 'nose_px': NOSE_PX}
json.dump(P, open('profile.json', 'w'))
# module JS pour la page : tables par tenon entier
def to_js(d): return json.dumps(d, separators=(',', ':'))
open('../profile.js', 'w').write(
    "// Silhouettes de la maquette, relevées sur les photos officielles de\n"
    "// profil et de dessus (2000 px, 17,1 px par tenon). Généré par\n"
    "// tools/extract.py — ne pas éditer à la main.\n"
    "// Unités : x en tenons depuis le museau, y en plaques depuis le dessus\n"
    "// de la plaque du socle, z en tenons depuis le plan de symétrie.\n"
    "export const PROFILE = " + to_js(P) + ";\n")
# résumé
def row(name, d, xs): return name.ljust(12) + ' '.join(f'{d.get(x, "-")!s:>7}' for x in xs)
xs = [0, 2, 4, 8, 12, 20, 30, 40, 50, 60, 70, 78, 82]
print(row('x', {x: x for x in xs}, xs)); print(row('top', P['top'], xs)); print(row('bot', P['bot'], xs)); print(row('halfw', P['halfw'], xs)); print(row('livery', P['livery'], xs))
print('verrière x', min(P['canopy']), '-', max(P['canopy']), '| halfZ x', min(P['canopyHalfZ']), '-', max(P['canopyHalfZ']), 'max', max(P['canopyHalfZ'].values()))
print('dorsale x', min(P['dorsal']), '-', max(P['dorsal']), 'sommet', max(P['dorsal'].values()), '| dorsale2', min(P['dorsal2']), '-', max(P['dorsal2']), max(P['dorsal2'].values()))
print('pectorale x', min(P['pectoral']), '-', max(P['pectoral']), 'bas', min(v[0] for v in P['pectoral'].values()), '| halfZ max', max(P['pectoralHalfZ'].values()))
print('pelvienne x', min(P['pelvic']), '-', max(P['pelvic']), 'bas', min(v[0] for v in P['pelvic'].values()))
print('caudale V x', min(P['caudalV']), '-', max(P['caudalV']), 'haut', max(b for v in P['caudalV'].values() for a, b in v), 'bas', min(a for v in P['caudalV'].values() for a, b in v))
print('caudale H x', min(P['caudalH']), '-', max(P['caudalH']), 'z max', max(b for v in P['caudalH'].values() for a, b in v))

from PIL import ImageDraw
im = Image.open('ref/profil.png').convert('RGB'); dr = ImageDraw.Draw(im)
for x in range(BODY_END_PX, NOSE_PX):
    if x in body_top: dr.point((x, body_top[x]), fill=(255, 0, 0)); dr.point((x, body_top[x]+1), fill=(255, 0, 0))
    if x in body_bot: dr.point((x, body_bot[x]), fill=(0, 160, 255)); dr.point((x, body_bot[x]+1), fill=(0, 160, 255))
    if x in livery: dr.point((x, livery[x]), fill=(0, 200, 0)); dr.point((x, livery[x]+1), fill=(0, 200, 0))
for d, c in [(canopy, (255, 0, 255)), (dorsal, (255, 140, 0)), (dorsal2, (255, 140, 0)), (pectoral, (0, 255, 255)), (pelvic, (0, 255, 255))]:
    for x, (a, b) in d.items(): dr.line((x, a, x, b), fill=c)
for x, runs in caudal.items():
    for a, b in runs: dr.line((x, a, x, b), fill=(255, 255, 0))
im.save('overlay-side.png')
im2 = Image.open('ref/dessus.png').convert('RGB'); dr2 = ImageDraw.Draw(im2)
for x in wtop:
    if x in wbot: dr2.point((x, wtop[x]), fill=(255, 0, 0)); dr2.point((x, wbot[x]), fill=(255, 0, 0))
for x, (a, b) in canopyT.items(): dr2.line((x, a, x, b), fill=(255, 0, 255))
for x, runs in caudT.items():
    for a, b in runs: dr2.line((x, a, x, b), fill=(255, 255, 0))
im2.save('overlay-top.png')
print('--- colonnes de debug (profil) px -> runs ---')
for px in [1114, 1300, 1500, 700]:
    print(px, 'stud', round(sx(px),1), col_runs(mask, px))
print('--- dessus px -> runs ---')
for px in [1000, 1300, 1506, 1600, 700]:
    print(px, 'stud', round(tx(px),1), col_runs(mT, px))
