import base64, io, os
from fontTools.subset import Subsetter, Options
from fontTools.ttLib import TTFont

SRC = "/mnt/skills/examples/canvas-design/canvas-fonts"
CHARS = ("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
         " .,:;!?'’‘“”—–-·&()/@°*+")

FACES = [
    ("PoiretOne-Regular.ttf", "Poiret One", 400),
    ("Gloock-Regular.ttf",    "Gloock",     400),
    ("Jura-Light.ttf",        "Jura",       300),
    ("Jura-Medium.ttf",       "Jura",       500),
]

out = []
for fn, fam, wt in FACES:
    f = TTFont(os.path.join(SRC, fn))
    opts = Options()
    opts.layout_features = ["kern", "liga", "calt"]
    opts.desubroutinize = True
    opts.notdef_outline = False
    opts.recalc_bounds = True
    s = Subsetter(options=opts)
    s.populate(text=CHARS)
    s.subset(f)
    f.flavor = "woff2"
    buf = io.BytesIO()
    f.save(buf)
    b64 = base64.b64encode(buf.getvalue()).decode()
    print(f"{fn:32s} -> {len(buf.getvalue())/1024:6.1f} KB woff2")
    out.append(
        "@font-face{font-family:'%s';font-style:normal;font-weight:%d;font-display:block;"
        "src:url(data:font/woff2;base64,%s) format('woff2')}" % (fam, wt, b64)
    )

open("fonts.css", "w").write("\n".join(out) + "\n")
print("total fonts.css:", round(os.path.getsize("fonts.css")/1024, 1), "KB")
