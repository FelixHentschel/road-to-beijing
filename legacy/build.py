"""Road to Beijing 27 – kompletter Build in einem Schritt.

Ablauf: Rankings holen -> Deutsche, Nationen, bereinigte Linie, Status berechnen
-> Plausibilität prüfen -> Seite bauen. Bricht bei kaputten Daten ab, damit die
zuletzt gute Seite online bleibt.

  python build.py                    Live-Abruf, baut site/ und data/
  python build.py --raw raw/         offline aus gespeicherten HTML-Seiten
  python build.py --target artifact  eine Datei ohne lokale Schriften (Vorschau)
"""
import argparse, collections, datetime, html, json, os, re, shutil, sys, time, urllib.request

ROOT = os.path.dirname(os.path.abspath(__file__))
EVENTS = [("800m", "800 m", 56, "1:57,50", "1:43,00"),
          ("1500m", "1500 m", 56, "3:58,00", "3:30,00"),
          ("5000m", "5000 m", 42, "14:36,00", "12:50,00"),
          ("10000m", "10.000 m", 27, "30:40,00", "26:48,00"),
          ("3000msc", "3000 m Hindernis", 36, "9:06,50", "8:08,00"),
          ("marathon", "Marathon", 100, "2:23:20", "2:06:00")]
NEAR = 1.25          # "knapp dahinter": bis 25 % hinter der bereinigten Linie
MAX_PER_NATION = 3
MAX_PAGES = 15       # 1500 Plätze, reicht auch für den Marathon
MIN_ROWS = 400       # Plausibilität: weniger Zeilen = Seite kaputt oder geändert
RULES = ("Status nach der Linie mit Nationen-Limit (max. 3 pro Land). Knapp dahinter: bis 25 % "
         "hinter der Linie. Für Deutsche gilt zusätzlich die DLV-Norm, die für 2027 noch nicht "
         "veröffentlicht ist.")
UA = "Mozilla/5.0 (compatible; AuslaufenPodcast-RoadToBeijing/1.0; +https://auslaufen-podcast.de)"
ROW_RE = re.compile(r'<tr[^>]*data-athlete-url="[^"]*"[^>]*>(.*?)</tr>', re.S)
CELL_RE = re.compile(r'<td data-th="([^"]+)">(.*?)</td>', re.S)


def page_html(slug, sex, p, raw):
    fn = os.path.join(raw, f"{slug}_{sex}_{p}.html") if raw else None
    if fn and os.path.exists(fn):
        return open(fn, encoding="utf-8").read()
    if raw and not args.fetch_missing:
        return None
    url = f"https://worldathletics.org/world-rankings/{slug}/{sex}" + ("" if p == 1 else f"?page={p}")
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    for attempt in range(3):
        try:
            with urllib.request.urlopen(req, timeout=30) as r:
                t = r.read().decode("utf-8")
            time.sleep(0.5)  # höflich bleiben
            if fn:
                open(fn, "w", encoding="utf-8").write(t)
            return t
        except Exception as e:
            err = e; time.sleep(3 * (attempt + 1))
    raise SystemExit(f"Abruf fehlgeschlagen: {url} ({err})")


def parse(t):
    m = re.search(r"As of ([^<]+)<", t)
    rows = []
    for r in ROW_RE.findall(t):
        c = {k: html.unescape(re.sub(r"<[^>]+>", "", v)).strip() for k, v in CELL_RE.findall(r)}
        rows.append({"place": int(c["Rank"]), "name": " ".join(c["Competitor"].split()), "dob": c.get("DOB", ""),
                     "nat": c["Nat"], "score": int(c["score"]), "events": " ".join(c.get("EventList", "").split())})
    return (m.group(1).strip() if m else None), rows


def adjusted_cut(rows, field):
    seen, k = collections.Counter(), 0
    for r in sorted(rows, key=lambda r: r["place"]):
        seen[r["nat"]] += 1
        if seen[r["nat"]] <= MAX_PER_NATION:
            k += 1
            if k == field:
                return r["place"]
    return None


def build_event(slug, label, field, std_w, std_m, sex, raw):
    rows, asofs = [], set()
    for p in range(1, MAX_PAGES + 1):
        t = page_html(slug, sex, p, raw)
        if t is None:
            break
        a, r = parse(t)
        if not r:
            break
        asofs.add(a); rows += r
        cut = adjusted_cut(rows, field)
        if cut and p >= 5 and len([x for x in rows if x["nat"] == "GER"]) >= 3:
            break
    problems = []
    if len(rows) < MIN_ROWS: problems.append(f"nur {len(rows)} Zeilen")
    if len(asofs) != 1 or None in asofs: problems.append(f"Stand uneinheitlich {asofs}")
    cut = adjusted_cut(rows, field)
    if not cut: problems.append("bereinigte Linie nicht erreicht")
    if problems:
        raise SystemExit(f"Plausibilität {slug} {sex}: " + ", ".join(problems))
    infield = collections.Counter(r["nat"] for r in rows if r["place"] <= field)
    ger = [r for r in rows if r["nat"] == "GER"]
    for a in ger:
        a["gap"] = cut - a["place"]
        a["status"] = "in" if a["place"] <= cut else ("near" if a["place"] <= round(cut * NEAR) else "out")
        del a["nat"]
    return {"slug": slug, "label": label, "sex": sex, "asOf": asofs.pop(), "fieldSize": field,
            "standard": std_w if sex == "women" else std_m, "adjustedCut": cut,
            "checkedTo": len(rows), "athletes": ger[:8],
            "nations": [{"nat": n, "count": c} for n, c in infield.most_common(8)],
            "over3": sum(max(0, v - MAX_PER_NATION) for v in infield.values())}


def build_data(raw):
    events = [build_event(s, l, f, w, m, sex, raw) for s, l, f, w, m in EVENTS for sex in ("women", "men")]
    asof = {e["asOf"] for e in events}
    if len(asof) != 1:
        raise SystemExit(f"Disziplinen mit unterschiedlichem Stand: {asof}")
    total = sum(a["status"] == "in" for e in events for a in e["athletes"][:3])
    if total == 0:
        raise SystemExit("Kein einziger deutscher Startplatz – Daten vermutlich kaputt.")
    return {"asOf": asof.pop(), "rules": RULES, "germanInField": total, "events": events,
            "source": {"rankings": "https://worldathletics.org/world-rankings",
                       "quali": "https://assets.aws.worldathletics.org/document/6a156f9f527e379c9a3c765f.pdf"}}


FONT_FACES = [("Jost", 400, "normal", "jost-latin-400-normal"), ("Jost", 500, "normal", "jost-latin-500-normal"),
              ("Jost", 600, "normal", "jost-latin-600-normal"), ("Jost", 700, "normal", "jost-latin-700-normal"),
              ("Jost", 800, "normal", "jost-latin-800-normal"), ("Jost", 800, "italic", "jost-latin-800-italic"),
              ("JetBrains Mono", 500, "normal", "jetbrains-mono-latin-500-normal"),
              ("JetBrains Mono", 700, "normal", "jetbrains-mono-latin-700-normal")]
GOOGLE_FONTS = ('<link rel="preconnect" href="https://fonts.googleapis.com">\n<link rel="stylesheet" '
                'href="https://fonts.googleapis.com/css2?family=Jost:ital,wght@0,400;0,500;0,600;0,700;0,800;1,800'
                '&family=JetBrains+Mono:wght@500;700&display=swap">')


def js_json(obj):
    return json.dumps(obj, ensure_ascii=False).replace("</", "<\\/")


def render(data, nations, target):
    t = open(os.path.join(ROOT, "site_template.html"), encoding="utf-8").read()
    if target == "site":
        faces = "\n".join(f"@font-face{{font-family:'{f}';font-style:{s};font-weight:{w};font-display:swap;"
                          f"src:url(fonts/{n}.woff2) format('woff2')}}" for f, w, s, n in FONT_FACES)
        fonts = f'<link rel="preload" href="fonts/jost-latin-800-normal.woff2" as="font" type="font/woff2" crossorigin>\n<style>{faces}</style>'
    else:
        fonts = GOOGLE_FONTS
    body = (t.replace("__FONTS__", fonts).replace("__DATA__", js_json(data))
             .replace("__NATIONS__", js_json(nations)))
    if target == "artifact":
        return body
    title = re.search(r"<title>(.*?)</title>", body).group(1)
    body = re.sub(r"<title>.*?</title>\n?", "", body, count=1)
    body = body.replace('<meta name="claude:viewport-fit-sides" content="cover">\n', "")
    desc = ("Wer von den deutschen Läufer:innen wäre mit dem aktuellen World Ranking bei der WM in Peking 2027 "
            "dabei? 800 m bis Marathon, jede Woche neu.")
    return f"""<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{title}</title>
<meta name="description" content="{desc}">
<meta property="og:title" content="{title}">
<meta property="og:description" content="{desc}">
<meta property="og:type" content="website">
<meta property="og:url" content="https://quali.auslaufen-podcast.de/">
<link rel="canonical" href="https://quali.auslaufen-podcast.de/">
<style>:root{{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}}img{{max-width:100%}}[hidden]{{display:none!important}}</style>
</head>
<body>
{body}
</body>
</html>
"""


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--raw", help="Ordner mit gespeicherten Ranking-Seiten (offline)")
    ap.add_argument("--fetch-missing", action="store_true", help="fehlende Seiten nachladen und speichern")
    ap.add_argument("--target", choices=["site", "artifact"], default="site")
    ap.add_argument("--out", default=os.path.join(ROOT, "site"))
    ap.add_argument("--data", default=os.path.join(ROOT, "data"))
    args = ap.parse_args()

    data = build_data(args.raw)
    nations = json.load(open(os.path.join(ROOT, "nations.json"), encoding="utf-8"))

    os.makedirs(os.path.join(args.data, "history"), exist_ok=True)
    latest = os.path.join(args.data, "rankings.json")
    prev_asof = json.load(open(latest)).get("asOf") if os.path.exists(latest) else None
    json.dump(data, open(latest, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    stamp = datetime.datetime.strptime(data["asOf"], "%d %b %Y").strftime("%Y-%m-%d")
    json.dump(data, open(os.path.join(args.data, "history", f"{stamp}.json"), "w", encoding="utf-8"),
              ensure_ascii=False, indent=1)

    if args.target == "artifact":
        out = os.path.join(ROOT, "road-to-beijing.html")
        open(out, "w", encoding="utf-8").write(render(data, nations, "artifact"))
    else:
        os.makedirs(args.out, exist_ok=True)
        shutil.copytree(os.path.join(ROOT, "site_static"), args.out, dirs_exist_ok=True)
        open(os.path.join(args.out, "index.html"), "w", encoding="utf-8").write(render(data, nations, "site"))
        out = os.path.join(args.out, "index.html")

    changed = prev_asof != data["asOf"]
    if os.environ.get("GITHUB_OUTPUT"):
        open(os.environ["GITHUB_OUTPUT"], "a").write(f"changed={'true' if changed else 'false'}\nasof={stamp}\n")
    print(f"Stand {data['asOf']} | {data['germanInField']}/36 im Feld | neu: {changed} | {out}")
    for e in data["events"]:
        print(f"  {e['slug']:9} {e['sex']:6} Feld {e['fieldSize']:3} Linie {e['adjustedCut']:4} "
              f"geprüft {e['checkedTo']:4} | " + ", ".join(f"{a['place']} {a['status']}" for a in e["athletes"][:3]))
