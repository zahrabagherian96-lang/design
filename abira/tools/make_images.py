#!/usr/bin/env python3
"""
Procedural architectural imagery for the ABIRA demo.

Why: no licensed stock-photo source is reachable from the build environment, and
re-using photos of unclear licence is not acceptable for a commercial theme.
These images are original, generated from code (3D projection + noise), so they
carry no third-party licence. Replace with real licensed photography before sale
if a more "photographic" look is wanted.

Usage: python3 make_images.py <out_dir> <playwright_core_node_modules_dir>
Requires: numpy, Pillow, node + playwright-core + Chromium (for SVG rasterising).
"""
import math, random, sys, os, json, subprocess, tempfile
import numpy as np
from PIL import Image, ImageFilter

OUT = sys.argv[1]
NODE_MODULES = sys.argv[2]
os.makedirs(OUT, exist_ok=True)

# ---------- helpers ----------------------------------------------------------
def hex2rgb(h): h = h.lstrip('#'); return tuple(int(h[i:i+2], 16) for i in (0, 2, 4))
def rgb2hex(c): return '#%02x%02x%02x' % tuple(max(0, min(255, int(round(v)))) for v in c)
def lerp(a, b, t): return tuple(x + (y - x) * t for x, y in zip(a, b))
def mix(h1, h2, t): return rgb2hex(lerp(hex2rgb(h1), hex2rgb(h2), max(0, min(1, t))))

class Noise:
    def __init__(self, seed): self.r = random.Random(seed); self.seed = seed
    def h(self, i, j):
        n = (i * 374761393 + j * 668265263 + self.seed * 1442695041) & 0xFFFFFFFF
        n = (n ^ (n >> 13)) * 1274126177 & 0xFFFFFFFF
        return ((n ^ (n >> 16)) & 0xFFFF) / 65535.0
    def smooth(self, x, y):
        i, j = math.floor(x), math.floor(y); fx, fy = x - i, y - j
        fx = fx * fx * (3 - 2 * fx); fy = fy * fy * (3 - 2 * fy)
        a, b = self.h(i, j), self.h(i + 1, j); c, d = self.h(i, j + 1), self.h(i + 1, j + 1)
        return (a + (b - a) * fx) * (1 - fy) + (c + (d - c) * fx) * fy
    def fbm(self, x, y, o=3):
        v, amp, f = 0, 0.5, 1
        for _ in range(o): v += amp * self.smooth(x * f, y * f); amp /= 2; f *= 2
        return v

class Cam:
    def __init__(self, w, h, pos, yaw=0, pitch=0, fov=60):
        self.w, self.h, self.pos = w, h, pos
        self.yaw, self.pitch = math.radians(yaw), math.radians(pitch)
        self.f = (w / 2) / math.tan(math.radians(fov) / 2)
    def to_cam(self, p):
        x, y, z = p[0] - self.pos[0], p[1] - self.pos[1], p[2] - self.pos[2]
        cy, sy = math.cos(self.yaw), math.sin(self.yaw)
        x, z = x * cy - z * sy, x * sy + z * cy
        cp, sp = math.cos(self.pitch), math.sin(self.pitch)
        y, z = y * cp - z * sp, y * sp + z * cp
        return x, y, z
    def proj(self, p):
        x, y, z = self.to_cam(p)
        if z < 0.05: return None
        return (self.w / 2 + self.f * x / z, self.h / 2 - self.f * y / z, z)

def poly(pts, fill, stroke=None, sw=0.8, op=None, extra=''):
    d = ' '.join('%.1f,%.1f' % (p[0], p[1]) for p in pts)
    s = f'<polygon points="{d}" fill="{fill}"'
    if stroke: s += f' stroke="{stroke}" stroke-width="{sw}" stroke-linejoin="round"'
    if op is not None: s += f' fill-opacity="{op}"'
    return s + f' {extra}/>'

def bil(c, u, v):
    """bilinear on 4 corners (p00,p10,p11,p01) of 3D points"""
    p00, p10, p11, p01 = c
    return tuple((1-u)*(1-v)*a + u*(1-v)*b + u*v*cc + (1-u)*v*d for a, b, cc, d in zip(p00, p10, p11, p01))

def clip_poly_near(pts3, cam):
    """project polygon with near clipping (Sutherland-Hodgman against z>0.1 in cam space)"""
    cp = [cam.to_cam(p) for p in pts3]; out = []
    for i in range(len(cp)):
        a, b = cp[i], cp[(i + 1) % len(cp)]
        ina, inb = a[2] > 0.1, b[2] > 0.1
        if ina: out.append(a)
        if ina != inb:
            t = (0.1 - a[2]) / (b[2] - a[2]); out.append(tuple(a[k] + (b[k] - a[k]) * t for k in range(3)))
    return [(cam.w / 2 + cam.f * x / z, cam.h / 2 - cam.f * y / z) for x, y, z in out]

# ---------- scene builder ----------------------------------------------------
class Scene:
    def __init__(self, w, h, seed, cam, sky, fog):
        self.w, self.h, self.cam, self.seed = w, h, cam, seed
        self.noise = Noise(seed); self.rnd = random.Random(seed)
        self.sky, self.fog = sky, fog
        self.items = []   # (depth, svg)
        self.defs = []
        self.pre = []     # background svg (sky etc.)
        self.post = []    # overlays

    def add(self, depth, svg): self.items.append((depth, svg))

    def face(self, corners, rows, cols, base_dark, base_light, mullion, seed_off=0,
             floor_h=None, scale=0.07, lit_chance=0.0, lit='#ffd9a0', fog_k=0.0, spandrel=None, depth=None,
             sky_refl=None, contrast=1.0):
        """curtain-wall face: corners = (p00,p10,p11,p01) with p00 bottom-left in face space"""
        cam = self.cam; out = []
        n = self.noise; sd = seed_off * 17.3
        centre = bil(corners, .5, .5); dist = max(0.1, cam.to_cam(centre)[2])
        if depth is None: depth = dist
        fogt = min(1, fog_k * dist)
        for r in range(rows):
            for c in range(cols):
                u0, u1 = c / cols, (c + 1) / cols; v0, v1 = r / rows, (r + 1) / rows
                gap_u, gap_v = 0.04 / cols * cols * 0.12, 0.0
                cell3 = [bil(corners, u0, v0), bil(corners, u1, v0), bil(corners, u1, v1), bil(corners, u0, v1)]
                pts = clip_poly_near(cell3, cam)
                if len(pts) < 3: continue
                # reflection: cloud-like noise in face space + vertical gradient
                nx, ny = (u0 + u1) / 2 * cols * scale + sd, (v0 + v1) / 2 * rows * scale + sd
                refl = n.fbm(nx * 2.2, ny * 2.2, 3)
                refl = refl * 0.9 + (v0 * 0.35)
                refl = max(0, min(1, (refl - 0.35) * 1.7 * contrast))
                col = mix(base_dark, base_light, refl)
                # sporadic panel variation
                jit = n.h(c + int(sd), r * 7 + 3)
                col = mix(col, base_dark, 0.18 * jit)
                if lit_chance and n.h(c * 3 + 11, r * 5 + int(sd)) < lit_chance:
                    col = mix(col, lit, 0.75)
                if fogt: col = mix(col, self.fog, fogt)
                out.append(poly(pts, col, mullion, 0.7 if dist < 60 else 0.4, extra='shape-rendering="geometricPrecision"'))
        self.add(depth, '\n'.join(out))

    def box(self, x0, y0, z0, x1, y1, z1, **kw):
        """draw visible vertical faces of an axis aligned box with curtain wall; returns nothing"""
        cam = self.cam
        faces = {
            'front': ((x0, y0, z0), (x1, y0, z0), (x1, y1, z0), (x0, y1, z0)),   # facing -z (toward camera if cam z < z0)
            'back':  ((x1, y0, z1), (x0, y0, z1), (x0, y1, z1), (x1, y1, z1)),
            'left':  ((x0, y0, z1), (x0, y0, z0), (x0, y1, z0), (x0, y1, z1)),
            'right': ((x1, y0, z0), (x1, y0, z1), (x1, y1, z1), (x1, y1, z0)),
        }
        return faces

# ---------- concrete scene: tower (low angle) --------------------------------
def tower_scene(seed, w, h, *, yaw=-28, pitch=48, cam_pos=(0, 1.7, -2), tw=34, td=26, th=240,
                floors=58, cols_a=16, cols_b=12, pal=None, extra=True, fov=70):
    pal = pal or {}
    sky_top = pal.get('sky_top', '#0b2a5e'); sky_mid = pal.get('sky_mid', '#2b6cd0'); sky_low = pal.get('sky_low', '#cfe0f7')
    dark = pal.get('dark', '#0a1c3a'); light = pal.get('light', '#7fb0ee'); mull = pal.get('mull', '#13294f')
    dark_b = pal.get('dark_b', '#06142b'); light_b = pal.get('light_b', '#3d73c4')
    cam = Cam(w, h, cam_pos, yaw=0, pitch=pitch, fov=fov)
    sc = Scene(w, h, seed, cam, sky_mid, pal.get('fog', '#bcd3f2'))

    def rot(p, ang, c):
        a = math.radians(ang); x, z = p[0] - c[0], p[2] - c[2]
        return (c[0] + x * math.cos(a) - z * math.sin(a), p[1], c[2] + x * math.sin(a) + z * math.cos(a))

    def tower(cx, cz, w_, d_, h_, ang, fl, ca, cb, seedoff, d_col, l_col, d2, l2, fogk=0.0, lit=0.0):
        hw, hd = w_ / 2, d_ / 2
        base = [(-hw, 0, -hd), (hw, 0, -hd), (hw, 0, hd), (-hw, 0, hd)]
        pts = [rot((cx + x, y, cz + z), ang, (cx, 0, cz)) for x, y, z in base]
        # faces between consecutive base corners; visibility by facing camera
        for i in range(4):
            a, b = pts[i], pts[(i + 1) % 4]
            ex, ez = b[0] - a[0], b[2] - a[2]
            nx, nz = ez, -ex            # outward normal (for ccw winding seen from above)
            mx, mz = (a[0] + b[0]) / 2, (a[2] + b[2]) / 2
            if nx * (cam.pos[0] - mx) + nz * (cam.pos[2] - mz) <= 0: continue
            corners = ((a[0], 0, a[2]), (b[0], 0, b[2]), (b[0], h_, b[2]), (a[0], h_, a[2]))
            horiz = math.hypot(ex, ez)
            cols = ca if i % 2 == 0 else cb
            lighter = (nx * 0.7 + nz * -0.4) > 0
            sc.face(corners, fl, cols, d_col if not lighter else d2, l_col if not lighter else l2, pal.get('mull', mull),
                    seed_off=seedoff + i, scale=0.06, fog_k=fogk, lit_chance=lit, contrast=1.0)
    return sc, tower, cam

# ---------- sky helpers ------------------------------------------------------
def sky_rect(w, h, stops, cid='sky'):
    st = ''.join(f'<stop offset="{o}" stop-color="{c}"/>' for o, c in stops)
    return f'<linearGradient id="{cid}" x1="0" y1="0" x2="0" y2="1">{st}</linearGradient><rect width="{w}" height="{h}" fill="url(#{cid})"/>'

def clouds(w, h, seed, n=7, y0=0.0, y1=0.6, color='#ffffff', op=0.18):
    r = random.Random(seed); s = ''
    for i in range(n):
        cx, cy = r.uniform(0, w), r.uniform(h * y0, h * y1); rw, rh = r.uniform(w * .25, w * .6), r.uniform(h * .015, h * .05)
        s += f'<ellipse cx="{cx:.0f}" cy="{cy:.0f}" rx="{rw:.0f}" ry="{rh:.0f}" fill="{color}" opacity="{op*r.uniform(.5,1):.2f}" filter="url(#blur)"/>'
    return s

BLUR = '<filter id="blur" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="38"/></filter><filter id="soft"><feGaussianBlur stdDeviation="3"/></filter>'

# ---------- individual images ------------------------------------------------
def img_hero(w=1400, h=1700):
    pal = dict(sky_top='#0a2a62', sky_mid='#2f74d8', sky_low='#e4eefc', dark='#08234d', light='#9cc4f4', mull='#0e2a57', dark_b='#05152e', light_b='#3b76c9', fog='#cfe0f7')
    sc, tower, cam = tower_scene(11, w, h, pitch=52, cam_pos=(0, 1.7, 0), fov=78, pal=pal)
    # background towers (fog)
    tower(-62, 150, 30, 30, 330, 18, 80, 14, 14, 2, '#9fbde6', '#dbe8f9', '#b7cfee', '#eef4fd', 0.0016)
    tower(70, 170, 36, 28, 380, -12, 90, 14, 12, 3, '#7ea4d8', '#d4e3f7', '#9db9e2', '#e8f0fb', 0.0014)
    # hero tower
    tower(14, 52, 34, 28, 260, 20, 62, 16, 14, 5, pal['dark'], pal['light'], pal['dark_b'], pal['light_b'], 0.0, 0.015)
    tower(-36, 74, 22, 24, 190, -14, 46, 11, 11, 6, '#0d2c5a', '#86b2ea', '#07173a', '#2f66b8', 0.0006, 0.01)
    body = ''.join(svg for _, svg in sorted(sc.items, key=lambda t: -t[0]))
    bg = sky_rect(w, h, [(0, pal['sky_top']), (.45, pal['sky_mid']), (1, pal['sky_low'])]) + clouds(w, h, 4, 8, .05, .7, '#ffffff', .22)
    glow = f'<radialGradient id="sun" cx="0.82" cy="0.12" r="0.7"><stop offset="0" stop-color="#ffffff" stop-opacity=".75"/><stop offset=".5" stop-color="#cfe2ff" stop-opacity=".15"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/></radialGradient><rect width="{w}" height="{h}" fill="url(#sun)"/>'
    vig = f'<linearGradient id="vg" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#04112a" stop-opacity=".55"/><stop offset=".25" stop-color="#04112a" stop-opacity="0"/></linearGradient><rect width="{w}" height="{h}" fill="url(#vg)"/>'
    return svg_doc(w, h, bg + body + glow + vig)

def img_tower2(seed, w, h, yaw_pal, pitch=30, tw=34, th=210, ang=24, cam_z=-40, fl=52):
    pal = yaw_pal
    cam = Cam(w, h, (0, 1.7, cam_z), 0, pitch, 62)
    sc = Scene(w, h, seed, cam, pal['sky_mid'], pal['fog'])
    def rot(p, a, c):
        a = math.radians(a); x, z = p[0] - c[0], p[2] - c[2]
        return (c[0] + x*math.cos(a) - z*math.sin(a), p[1], c[2] + x*math.sin(a) + z*math.cos(a))
    def tower(cx, cz, w_, d_, h_, a, fl_, ca, cb, so, dc, lc, d2, l2, fogk=0, lit=0):
        hw, hd = w_/2, d_/2
        pts = [rot((cx+x, 0, cz+z), a, (cx, 0, cz)) for x, z in [(-hw,-hd),(hw,-hd),(hw,hd),(-hw,hd)]]
        for i in range(4):
            A, B = pts[i], pts[(i+1)%4]; ex, ez = B[0]-A[0], B[2]-A[2]; nx, nz = ez, -ex
            mx, mz = (A[0]+B[0])/2, (A[2]+B[2])/2
            if nx*(cam.pos[0]-mx)+nz*(cam.pos[2]-mz) <= 0: continue
            corners = ((A[0],0,A[2]),(B[0],0,B[2]),(B[0],h_,B[2]),(A[0],h_,A[2]))
            lighter = (nx*0.7 + nz*-0.4) > 0
            sc.face(corners, fl_, ca if i%2==0 else cb, dc if not lighter else d2, lc if not lighter else l2, pal['mull'], seed_off=so+i, scale=.06, fog_k=fogk, lit_chance=lit)
    tower(-30, 120, 40, 30, 300, 10, 70, 16, 12, 1, pal['fd'], pal['fl'], pal['fd'], pal['fl'], .0012)
    tower(40, 90, 30, 26, 220, -20, 54, 12, 12, 2, pal['fd'], pal['fl'], pal['fd'], pal['fl'], .0009)
    tower(0, 30, tw, 28, th, ang, fl, 16, 12, 3, pal['dark'], pal['light'], pal['dark_b'], pal['light_b'], 0, .012)
    body = ''.join(s for _, s in sorted(sc.items, key=lambda t: -t[0]))
    bg = sky_rect(w, h, [(0, pal['sky_top']), (.5, pal['sky_mid']), (1, pal['sky_low'])]) + clouds(w, h, seed, 6, .05, .6, '#fff', .2)
    vig = f'<linearGradient id="vg" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#04112a" stop-opacity=".45"/><stop offset=".3" stop-color="#04112a" stop-opacity="0"/></linearGradient><rect width="{w}" height="{h}" fill="url(#vg)"/>'
    return svg_doc(w, h, bg + body + vig)

def svg_doc(w, h, inner):
    return f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}"><defs>{BLUR}</defs>{inner}</svg>'

# interior: office with window wall and long table, one-point perspective
def img_interior(seed, w, h, warm=False, table=True):
    cam = Cam(w, h, (0, 1.5, -9), 0, 2, 64); r = random.Random(seed)
    sc = Scene(w, h, seed, cam, '#d9e6f8', '#cfe0f7')
    parts = []
    def P(*pts3, fill, stroke=None, op=None):
        pts = clip_poly_near(list(pts3), cam)
        if len(pts) >= 3: parts.append(poly(pts, fill, stroke, 0.8, op))
    W2, Hh, D = 6.5, 3.4, 14   # half width, height, depth
    # window wall far z=D : sky + skyline
    sky = f'<linearGradient id="ws" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6fa3e8"/><stop offset="1" stop-color="#e6effc"/></linearGradient>'
    parts.append(sky)
    P((-W2,0,D),(W2,0,D),(W2,Hh,D),(-W2,Hh,D), fill='url(#ws)')
    # skyline blocks
    n = Noise(seed)
    x = -W2
    while x < W2:
        bw = r.uniform(.4, 1.1); bh = r.uniform(.5, 2.2) if abs(x) > 1.5 else r.uniform(.4, 1.3)
        tone = mix('#a9c4ec', '#5d8bd0', r.random() * .8)
        P((x,0,D-.01),(x+bw,0,D-.01),(x+bw,bh,D-.01),(x,bh,D-.01), fill=tone, op=.85)
        x += bw + r.uniform(0, .15)
    # floor
    parts.append('<linearGradient id="fl" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#0f2c59"/><stop offset="1" stop-color="#7f9fcf"/></linearGradient>')
    P((-W2,0,-12),(W2,0,-12),(W2,0,D),(-W2,0,D), fill='url(#fl)')
    # floor reflections of windows
    for i in range(8):
        a = -W2 + (i + .5) * (2 * W2 / 8)
        P((a-.3,0,2),(a+.3,0,2),(a+.9,0,D),(a-.9,0,D), fill='#ffffff', op=.08)
    # side walls
    P((-W2,0,-12),(-W2,0,D),(-W2,Hh,D),(-W2,Hh,-12), fill='#16336a')
    P((W2,0,-12),(W2,0,D),(W2,Hh,D),(W2,Hh,-12), fill='#0f2756')
    # ceiling
    P((-W2,Hh,-12),(W2,Hh,-12),(W2,Hh,D),(-W2,Hh,D), fill='#0b1f45')
    # light strips
    for k in range(7):
        z0 = -4 + k * 2.6
        for xs in (-3.2, 0, 3.2):
            P((xs-.08,Hh-.01,z0),(xs+.08,Hh-.01,z0),(xs+.08,Hh-.01,z0+1.6),(xs-.08,Hh-.01,z0+1.6), fill='#ffffff', op=.92)
    # window mullions
    for i in range(9):
        a = -W2 + i * (2 * W2 / 8)
        P((a-.04,0,D-.02),(a+.04,0,D-.02),(a+.04,Hh,D-.02),(a-.04,Hh,D-.02), fill='#0e2652')
    P((-W2,Hh*.52,D-.02),(W2,Hh*.52,D-.02),(W2,Hh*.52+.07,D-.02),(-W2,Hh*.52+.07,D-.02), fill='#0e2652')
    if table:
        # long table
        parts.append('<linearGradient id="tb" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#e9f0fb"/><stop offset="1" stop-color="#b6c9e6"/></linearGradient>')
        P((-1.3,.74,-1),(1.3,.74,-1),(1.3,.74,10),(-1.3,.74,10), fill='url(#tb)')
        P((-1.3,.70,-1),(1.3,.70,-1),(1.3,.74,-1),(-1.3,.74,-1), fill='#7f9ccb')
        # chairs
        for k in range(5):
            z0 = 1 + k * 1.9
            for sx in (-1, 1):
                x0 = sx * 1.55
                P((x0-.25,.45,z0),(x0+.25,.45,z0),(x0+.25,.9,z0),(x0-.25,.9,z0), fill='#0a1d40')
                P((x0-.25,.45,z0),(x0+.25,.45,z0),(x0+.25,.45,z0+.5),(x0-.25,.45,z0+.5), fill='#17356c')
    # sunlight shafts
    shafts = '<linearGradient id="sh" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".35"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>'
    sh = ''.join(f'<polygon points="{w*(.22+i*.17):.0f},{h*.35:.0f} {w*(.30+i*.17):.0f},{h*.35:.0f} {w*(.10+i*.2):.0f},{h:.0f} {w*(-.08+i*.2):.0f},{h:.0f}" fill="url(#sh)" opacity=".35"/>' for i in range(3))
    vig = f'<radialGradient id="v" cx=".5" cy=".5" r=".75"><stop offset=".6" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#020b1f" stop-opacity=".55"/></radialGradient><rect width="{w}" height="{h}" fill="url(#v)"/>'
    return svg_doc(w, h, '<rect width="100%" height="100%" fill="#0b1f45"/>' + ''.join(parts) + shafts + sh + vig)

# bridge: cable-stayed at dusk
def img_bridge(seed, w, h):
    r = random.Random(seed)
    hz = h * .62
    bg = sky_rect(w, h, [(0, '#0d2a5c'), (.5, '#3a78cf'), (.62, '#d9e7fa'), (.62, '#8fb2e2'), (1, '#10305f')], 'sk')
    clo = clouds(w, h, seed, 6, .05, .5, '#fff', .2)
    # water ripples
    wat = ''.join(f'<rect x="{r.uniform(0,w):.0f}" y="{r.uniform(hz+6,h):.0f}" width="{r.uniform(60,360):.0f}" height="2" fill="#fff" opacity="{r.uniform(.05,.2):.2f}"/>' for _ in range(70))
    # distant skyline
    sky = ''; x = 0
    while x < w:
        bw = r.uniform(18, 50); bh = r.uniform(20, 120)
        sky += f'<rect x="{x:.0f}" y="{hz-bh:.0f}" width="{bw:.0f}" height="{bh:.0f}" fill="#9db9e0" opacity=".75"/>'; x += bw + r.uniform(0, 6)
    deck_y = hz - 38
    towers = [w * .30, w * .72]; th = h * .58
    s = f'<rect x="0" y="{deck_y:.0f}" width="{w}" height="14" fill="#0b2150"/><rect x="0" y="{deck_y+14:.0f}" width="{w}" height="4" fill="#4d79c0" opacity=".6"/>'
    for tx in towers:
        s += f'<polygon points="{tx-16:.0f},{hz+30:.0f} {tx-5:.0f},{deck_y-th:.0f} {tx+5:.0f},{deck_y-th:.0f} {tx+16:.0f},{hz+30:.0f}" fill="#0b2150"/>'
        for i in range(14):
            yy = deck_y - th + 30 + i * 22
            for sgn in (-1, 1):
                for ex in (w * .02, w * .35 if tx == towers[0] else w * .65, ):
                    pass
            # cables to deck both sides
            for side in (-1, 1):
                tgt = tx + side * (60 + i * 38)
                s += f'<line x1="{tx:.0f}" y1="{yy:.0f}" x2="{tgt:.0f}" y2="{deck_y:.0f}" stroke="#e9f1ff" stroke-width="1.3" opacity=".75"/>'
        for xx in range(0, 3): pass
    s += f'<rect x="0" y="{hz+14:.0f}" width="{w}" height="{h-hz:.0f}" fill="url(#rf)" opacity=".4"/>'
    refl = '<linearGradient id="rf" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0b2150" stop-opacity=".5"/><stop offset="1" stop-color="#0b2150" stop-opacity="0"/></linearGradient>'
    return svg_doc(w, h, refl + bg + clo + sky + wat + s)

# datacenter: rows of racks, 1-point perspective with glowing strips
def img_datacenter(seed, w, h):
    cam = Cam(w, h, (0, 1.6, -4), 0, 0, 62); r = random.Random(seed); parts = []
    def P(*pts3, fill, stroke=None, op=None):
        pts = clip_poly_near(list(pts3), cam)
        if len(pts) >= 3: parts.append(poly(pts, fill, stroke, .7, op))
    D = 40; W2 = 5; Hh = 3.6
    P((-W2,0,-4),(W2,0,-4),(W2,0,D),(-W2,0,D), fill='#0b1f48')
    P((-W2,Hh,-4),(W2,Hh,-4),(W2,Hh,D),(-W2,Hh,D), fill='#071636')
    P((-W2,0,D),(W2,0,D),(W2,Hh,D),(-W2,Hh,D), fill='#2e6fd0')
    for side in (-1, 1):
        for k in range(20):
            z0 = -3 + k * 1.9
            for (xa, xb, tone) in ((side*1.0, side*2.3, '#12326a'), (side*3.2, side*4.5, '#0e2a5c')):
                x0, x1 = min(xa, xb), max(xa, xb)
                # rack front (facing aisle) approximated as quad towards centre
                fx = x0 if side > 0 else x1
                P((fx,0,z0),(fx,0,z0+1.5),(fx,2.5,z0+1.5),(fx,2.5,z0), fill=tone, stroke='#071636')
                for l in range(14):
                    y = .2 + l * .16
                    on = r.random()
                    c = '#69c0ff' if on > .55 else ('#2e7be8' if on > .2 else '#0a1e44')
                    P((fx,y,z0+.1),(fx,y,z0+1.4),(fx,y+.05,z0+1.4),(fx,y+.05,z0+.1), fill=c, op=.9)
    for k in range(10):
        z0 = -2 + k * 4
        P((-.12,Hh-.02,z0),(.12,Hh-.02,z0),(.12,Hh-.02,z0+2.4),(-.12,Hh-.02,z0+2.4), fill='#dff0ff', op=.95)
    glow = f'<radialGradient id="g" cx=".5" cy=".5" r=".6"><stop offset="0" stop-color="#4aa3ff" stop-opacity=".45"/><stop offset="1" stop-color="#4aa3ff" stop-opacity="0"/></radialGradient><rect width="{w}" height="{h}" fill="url(#g)"/>'
    v = f'<radialGradient id="v" cx=".5" cy=".5" r=".75"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#020a1c" stop-opacity=".7"/></radialGradient><rect width="{w}" height="{h}" fill="url(#v)"/>'
    return svg_doc(w, h, '<rect width="100%" height="100%" fill="#06122b"/>' + ''.join(parts) + glow + v)

# campus / low-rise horizontal slabs with louvres, level camera
def img_campus(seed, w, h):
    r = random.Random(seed); n = Noise(seed)
    bg = sky_rect(w, h, [(0, '#2d6fd0'), (.55, '#a9c9f1'), (.72, '#eaf2fd')], 'cs') + clouds(w, h, seed, 5, .02, .35, '#fff', .35)
    hz = h * .78; s = f'<rect y="{hz:.0f}" width="{w}" height="{h-hz:.0f}" fill="#d6dde8"/><rect y="{hz:.0f}" width="{w}" height="3" fill="#a7b4c8"/>'
    # slabs
    levels = [(w*.05, w*.95, hz-h*.10, h*.10), (w*.14, w*.80, hz-h*.26, h*.14), (w*.30, w*.90, hz-h*.42, h*.14)]
    for i, (x0, x1, top, hh) in enumerate(levels):
        s += f'<rect x="{x0:.0f}" y="{top:.0f}" width="{x1-x0:.0f}" height="{hh:.0f}" fill="#0f2b5c"/>'
        cols = int((x1-x0)/26)
        for c in range(cols):
            cx = x0 + c * (x1-x0)/cols; t = n.fbm(c*.2+i*3, i*5, 3)
            col = mix('#16366f', '#8fb7ec', t * .9)
            s += f'<rect x="{cx+2:.1f}" y="{top+hh*.14:.0f}" width="{(x1-x0)/cols-4:.1f}" height="{hh*.72:.0f}" fill="{col}"/>'
        s += f'<rect x="{x0-14:.0f}" y="{top-10:.0f}" width="{x1-x0+28:.0f}" height="12" fill="#f1f5fb"/><rect x="{x0-14:.0f}" y="{top+2:.0f}" width="{x1-x0+28:.0f}" height="4" fill="#9db2d4"/>'
    for i in range(14):
        x = r.uniform(0, w); rad = r.uniform(26, 58)
        s += f'<ellipse cx="{x:.0f}" cy="{hz-rad*.6:.0f}" rx="{rad:.0f}" ry="{rad*.9:.0f}" fill="#2a5f58" opacity=".85"/><rect x="{x-3:.0f}" y="{hz-rad*.3:.0f}" width="6" height="{rad*.3:.0f}" fill="#223b3a"/>'
    return svg_doc(w, h, bg + s)

# blueprint / engineering: blue sheet with plan lines (for services/blog)
def img_blueprint(seed, w, h, mode=0):
    r = random.Random(seed); s = f'<rect width="{w}" height="{h}" fill="#123a82"/>'
    g = ''.join(f'<line x1="{x}" y1="0" x2="{x}" y2="{h}" stroke="#7aa7ee" stroke-width=".8" opacity=".25"/>' for x in range(0, w, 40))
    g += ''.join(f'<line x1="0" y1="{y}" x2="{w}" y2="{y}" stroke="#7aa7ee" stroke-width=".8" opacity=".25"/>' for y in range(0, h, 40))
    s += g
    cx, cy = w * (.45 + r.uniform(-.1, .1)), h * (.5 + r.uniform(-.1, .1))
    st = 'fill="none" stroke="#e8f1ff" stroke-width="2.2"'
    if mode == 0:
        for i in range(5):
            rr = 60 + i * 55; s += f'<circle cx="{cx:.0f}" cy="{cy:.0f}" r="{rr}" {st} opacity="{.9-i*.15:.2f}"/>'
        s += f'<rect x="{cx-170:.0f}" y="{cy-110:.0f}" width="340" height="220" {st}/><line x1="{cx-170:.0f}" y1="{cy:.0f}" x2="{cx+170:.0f}" y2="{cy:.0f}" {st}/>'
    elif mode == 1:
        pts = [(cx-300+i*75, cy+ (math.sin(i*.9+seed)*90)) for i in range(9)]
        s += '<polyline points="' + ' '.join(f'{x:.0f},{y:.0f}' for x, y in pts) + f'" {st}/>'
        for x, y in pts: s += f'<circle cx="{x:.0f}" cy="{y:.0f}" r="9" fill="#123a82" stroke="#e8f1ff" stroke-width="2.2"/>'
        s += f'<rect x="{cx-320:.0f}" y="{cy+120:.0f}" width="640" height="14" fill="#e8f1ff" opacity=".85"/>'
    else:
        for i in range(6):
            s += f'<polygon points="{cx-250+i*30:.0f},{cy+130-i*20:.0f} {cx-60+i*30:.0f},{cy+130-i*20:.0f} {cx+40+i*30:.0f},{cy+60-i*20:.0f} {cx-150+i*30:.0f},{cy+60-i*20:.0f}" {st} opacity="{.95-i*.12:.2f}"/>'
    s += f'<g stroke="#e8f1ff" stroke-width="1.4" opacity=".7"><line x1="{w*.06:.0f}" y1="{h*.92:.0f}" x2="{w*.34:.0f}" y2="{h*.92:.0f}"/><line x1="{w*.06:.0f}" y1="{h*.9:.0f}" x2="{w*.06:.0f}" y2="{h*.94:.0f}"/><line x1="{w*.34:.0f}" y1="{h*.9:.0f}" x2="{w*.34:.0f}" y2="{h*.94:.0f}"/></g>'
    vg = f'<radialGradient id="v" cx=".5" cy=".5" r=".8"><stop offset=".5" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#04122e" stop-opacity=".6"/></radialGradient><rect width="{w}" height="{h}" fill="url(#v)"/>'
    return svg_doc(w, h, s + vg)

# ---------- raster pipeline --------------------------------------------------
JOBS = []  # (name, svg, w, h, extra widths)
def job(name, svg, w, h, widths=()): JOBS.append((name, svg, w, h, widths))

pal_day = dict(sky_top='#0c2f6b', sky_mid='#3a7ee0', sky_low='#eaf2fd', dark='#0a2552', light='#a8cbf6', mull='#10305f', dark_b='#06173a', light_b='#4a82d2', fog='#d4e4f8', fd='#a9c6ea', fl='#e1ecfa')
pal_dusk = dict(sky_top='#081c45', sky_mid='#2a5cb4', sky_low='#b9cff0', dark='#071b3f', light='#6d9fe2', mull='#0b2350', dark_b='#040f27', light_b='#2c5ca8', fog='#9fb9e0', fd='#86a6d6', fl='#c3d6f1')
pal_pale = dict(sky_top='#4b86d9', sky_mid='#9dc0ee', sky_low='#f4f8fe', dark='#143a78', light='#c6dcf8', mull='#1a447f', dark_b='#0c2a5c', light_b='#7aa6e0', fog='#e3edfa', fd='#c4d8f2', fl='#f0f5fc')

job('hero', img_hero(1400, 1700), 1400, 1700, (760,))
job('about-1', img_interior(3, 1000, 1250), 1000, 1250, (560,))
job('about-2', img_tower2(21, 640, 800, pal_pale, pitch=26, th=170, ang=-18, cam_z=-30, fl=40), 640, 800)
job('service-1', img_blueprint(5, 900, 1100, 0), 900, 1100)
job('service-2', img_tower2(31, 900, 1100, pal_day, pitch=34, ang=30, cam_z=-34), 900, 1100)
job('service-3', img_datacenter(7, 900, 1100), 900, 1100)
job('service-4', img_blueprint(8, 900, 1100, 1), 900, 1100)
job('service-5', img_interior(14, 900, 1100, table=True), 900, 1100)
job('project-1', img_tower2(41, 1600, 1000, pal_dusk, pitch=24, th=230, ang=22, cam_z=-46, fl=60), 1600, 1000, (900,))
job('project-2', img_datacenter(17, 1200, 900), 1200, 900, (640,))
job('project-3', img_bridge(9, 1200, 1100), 1200, 1100, (640,))
job('project-4', img_campus(5, 1200, 900), 1200, 900, (640,))
job('project-5', img_interior(8, 1200, 900, table=False), 1200, 900, (640,))
job('post-1', img_blueprint(12, 900, 600, 2), 900, 600)
job('post-2', img_campus(9, 900, 600), 900, 600)
job('post-3', img_tower2(51, 900, 600, pal_pale, pitch=20, th=200, ang=-26, cam_z=-52, fl=48), 900, 600)

def render_all(tmp):
    manifest = []
    for name, svg, w, h, widths in JOBS:
        path = os.path.join(tmp, name + '.svg'); open(path, 'w').write(svg); manifest.append({'name': name, 'w': w, 'h': h})
    js = f"""
const {{ chromium }} = require('{NODE_MODULES}/playwright-core');
(async () => {{
  const b = await chromium.launch({{ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] }});
  const m = {json.dumps(manifest)};
  for (const it of m) {{
    const p = await b.newPage({{ viewport: {{ width: it.w, height: it.h }} }});
    await p.goto('file://{tmp}/' + it.name + '.svg');
    await p.screenshot({{ path: '{tmp}/' + it.name + '.png' }});
    await p.close();
  }}
  await b.close();
}})();
"""
    open(os.path.join(tmp, 'render.js'), 'w').write(js)
    subprocess.check_call(['node', os.path.join(tmp, 'render.js')])

def grain(img, seed, amount=5.0):
    rng = np.random.default_rng(seed)
    a = np.asarray(img.convert('RGB')).astype(np.float32)
    noise = rng.normal(0, amount, a.shape[:2])[..., None]
    a = np.clip(a + noise, 0, 255).astype(np.uint8)
    return Image.fromarray(a)

if __name__ == '__main__':
    tmp = tempfile.mkdtemp(prefix='abira_img_')
    render_all(tmp)
    for i, (name, svg, w, h, widths) in enumerate(JOBS):
        im = Image.open(os.path.join(tmp, name + '.png')).convert('RGB')
        im = im.filter(ImageFilter.GaussianBlur(0.6))          # soften polygon edges -> photographic
        im = grain(im, i, 3.5)
        im.save(os.path.join(OUT, name + '.webp'), 'WEBP', quality=80, method=6)
        for tw in widths:
            th = round(h * tw / w)
            im.resize((tw, th), Image.LANCZOS).save(os.path.join(OUT, f'{name}-{tw}.webp'), 'WEBP', quality=80, method=6)
        print(name, w, h, os.path.getsize(os.path.join(OUT, name + '.webp')) // 1024, 'KB')
