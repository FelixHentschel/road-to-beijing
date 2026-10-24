"""Erzeugt die Carousel-Slides ausschließlich aus data/roadto.json – denselben Daten wie die Website.

  python gen_carousel.py            schreibt carousel/project/*.dc.html neu
"""
import datetime, json, os, re, sys

ROOT = os.path.dirname(os.path.abspath(__file__))
PROJ = os.path.join(ROOT, "carousel", "project")
FILES = {"800m": "S800", "1500m": "S1500", "5000m": "S5000", "10000m": "S10000", "3000msc": "Ssc", "marathon": "Smar"}
SEX = {"women": "Frauen", "men": "Männer"}
ORDER = {"in": 0, "near": 1, "limit": 2, "out": 3}


def nm(n):
    return " ".join("-".join(s[:1] + s[1:].lower() for s in w.split("-")) if w.isupper() and len(w) > 1 else w
                    for w in n.split())


def js(s):
    return str(s).replace("\\", "\\\\").replace("'", "\\'")


def place(a):
    return str(a["pos"]) if a["pos"] else (f"N{a['wait']}" if a["wait"] else "–")


def detail(a):
    if a["path"] == "norm" and a["result"]:
        return f"Norm: {a['result']}"
    if a["status"] == "limit":
        return f"Nr. {a['countryPos']} unter den Deutschen"
    if a["score"]:
        gap = a["gap"]
        g = "" if gap is None else (", auf der Linie" if gap == 0 else f", {gap} Pkt. Puffer" if gap > 0 else f", {-gap} Pkt. bis zur Linie")
        return f"{a['score']} Punkte{g}"
    return a["label"] or ""


def top3(e):
    return e["athletes"][:3]  # Reihenfolge der offiziellen Liste


data = json.load(open(os.path.join(ROOT, "data", "roadto.json"), encoding="utf-8"))
stand = datetime.date.fromisoformat(data["fetched"]).strftime("%d.%m.%Y")
ev = {(e["slug"], e["sex"]): e for e in data["events"]}


def sub(pattern, repl, text, label):
    new, n = re.subn(pattern, repl, text, flags=re.S)
    if n != 1:
        sys.exit(f"Vorlage passt nicht ({label}): {n} Treffer")
    return new


for slug, fn in FILES.items():
    path = os.path.join(PROJ, fn + ".dc.html")
    t = open(path, encoding="utf-8").read()
    groups = []
    for sex in ("women", "men"):
        e = ev[(slug, sex)]
        rows = [f"row('{place(a)}', '{js(nm(a['name']))}', '{js(detail(a))}', '{a['status']}')" for a in top3(e)]
        if not rows:
            who = "Noch keine Deutsche" if sex == "women" else "Noch kein Deutscher"
            rows = [f"row('–', '{who} auf der Liste', 'Gezählt wird erst ab Beginn des Quali-Zeitraums', 'none')"]
        groups.append(f"{{ sex: '{SEX[sex]}', norm: '{e['standard']}', rows: [{', '.join(rows)}] }}")
    t = sub(r"return \{ groups: \[\n.*?\n\] \};", "return { groups: [\n" + ",\n".join(groups) + "\n] };", t, fn + " Gruppen")
    w, m = ev[(slug, "women")], ev[(slug, "men")]
    t = sub(r'color: #de1b1b">\d+</span><br>vergeben [0-9 /]+</div>',
            f'color: #de1b1b">{w["fieldSize"]}</span><br>vergeben {w["assigned"]} / {m["assigned"]}</div>', t, fn + " Feld")
    t = sub(r"Stand \d\d\.\d\d\.\d{4}", f"Stand {stand}", t, fn + " Stand")
    open(path, "w", encoding="utf-8").write(t)

for fn in ("Main", "Outro"):
    path = os.path.join(PROJ, fn + ".dc.html")
    t = sub(r"Stand \d\d\.\d\d\.\d{4}", f"Stand {stand}", open(path, encoding="utf-8").read(), fn + " Stand")
    if fn == "Main":
        t = sub(r'line-height: 0\.9">\d+<span style="color: #9aa0a6; font-size: 60px"> / 36',
                f'line-height: 0.9">{data["germanInField"]}<span style="color: #9aa0a6; font-size: 60px"> / 36', t, "Cover-Zahl")
    open(path, "w", encoding="utf-8").write(t)

# Kontrolle: jeder Wert auf den Slides muss aus den Daten kommen
bad = 0
for slug, fn in FILES.items():
    t = open(os.path.join(PROJ, fn + ".dc.html"), encoding="utf-8").read()
    rows = re.findall(r"row\('([^']*)', '((?:[^'\\]|\\.)+)', '((?:[^'\\]|\\.)*)', '(\w+)'\)", t)
    want = []
    for sex in ("women", "men"):
        want += [(place(a), nm(a["name"]), a["status"]) for a in top3(ev[(slug, sex)])] or [None]
    for r, w in zip(rows, want):
        if w is None:
            bad += r[3] != "none"
        else:
            bad += (r[0], r[1].replace("\\'", "'"), r[3]) != w
    bad += len(rows) != len(want)
print(f"Carousel Stand {stand}: {data['germanInField']}/36 | Abweichungen: {bad}")
sys.exit(1 if bad else 0)
