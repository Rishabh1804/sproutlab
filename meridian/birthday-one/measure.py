import json
from fontTools.ttLib import TTFont
SRC="/mnt/skills/examples/canvas-design/canvas-fonts"
out={}
for fn,key in [("Gloock-Regular.ttf","Gloock"),("PoiretOne-Regular.ttf","PoiretOne")]:
    f=TTFont(f"{SRC}/{fn}")
    upm=f["head"].unitsPerEm
    cmap=f.getBestCmap(); hmtx=f["hmtx"]
    adv={}
    for ch in "ONEWinterdlaZVA":
        g=cmap.get(ord(ch))
        if g: adv[ch]=hmtx[g][0]/upm
    # cap height & ascender for baseline math
    os2=f["OS/2"]
    out[key]={"adv":adv,"capHeight":getattr(os2,"sCapHeight",700)/upm,
              "ascender":f["hhea"].ascender/upm,"descender":f["hhea"].descender/upm}
print(json.dumps(out,indent=1))
open("metrics.json","w").write(json.dumps(out))
