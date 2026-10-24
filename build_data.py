"""Macht aus den offiziellen Road-to-Listen den Datensatz für Seite und Carousel.

Single Point of Truth: data/raw/<eventId>.json (World Athletics, Road to Beijing 27).
Hier wird nichts nachgerechnet, nur übersetzt und für Deutschland zusammengefasst.

  python build_data.py   ->  data/roadto.json, data/history/<datum>.json, web/src/data/*.json
"""
import collections, datetime, hashlib, json, os, sys, unicodedata
from zoneinfo import ZoneInfo
from fetch_roadto import EVENTS, page_url

ROOT = os.path.dirname(os.path.abspath(__file__))
LABEL = {"800m": "800 m", "1500m": "1500 m", "5000m": "5000 m", "10000m": "10.000 m",
         "3000msc": "3000 m Hindernis", "marathon": "Marathon"}
NEAR = 10  # Nachrücker:innen bis Platz 10 gelten als „knapp dahinter“
LIMIT = 3
WR_SHOW = 5  # so viele Deutsche aus dem World Ranking als Hinweis


def key(name):
    return unicodedata.normalize("NFC", " ".join(name.split())).casefold()


def path_of(q):
    by = q["qualifiedBy"]
    if by == "Qualified by Entry Standard": return "norm"
    if by.startswith("In World Rankings quota"): return "ranking"
    if by == "Next best by World Rankings": return "nachruecker"
    if by == "Qualified": return "wildcard"
    if "Area champion" in by: return "kontinent"
    if by == "Qualified by Designated Competition": return "label"
    return "sonst"


def de_num(s):
    return s.replace(".", ",") if s and ":" in s and s.count(":") == 1 else s


def event(eid, raw, wr):
    slug, sex, field, _ = EVENTS[eid]
    qs = raw["qualifications"]
    qualified = [q for q in qs if q["qualified"]]
    rank_scores = [q["score"] for q in qualified if path_of(q) == "ranking" and q["score"]]
    cut = min(rank_scores) if rank_scores else None
    # offizielle Nachrückerliste: nicht qualifiziert und nicht durchs eigene Nationen-Limit blockiert
    waiting = [q for q in qs if not q["qualified"] and (q["countryPosition"] or 0) <= LIMIT
               and path_of(q) in ("ranking", "nachruecker", "norm", "label")]
    wpos = {id(q): i + 1 for i, q in enumerate(waiting)}
    ger = []
    for q in qs:
        if q["countryCode"] != "GER": continue
        p = path_of(q)
        if q["qualified"]: status = "in"
        elif (q["countryPosition"] or 0) > LIMIT: status = "limit"
        elif wpos.get(id(q), 999) <= NEAR: status = "near"
        else: status = "out"
        ger.append({"name": q["name"], "status": status, "path": p, "pos": q["qualificationPosition"],
                    "wait": wpos.get(id(q)), "countryPos": q["countryPosition"], "score": q["score"],
                    "result": de_num(q["result"]), "wrPlace": q["place"], "label": q["label"],
                    "gap": (q["score"] - cut) if (q["score"] and cut) else None,
                    "where": ", ".join(x for x in (q["venue"], q["date"]) if x) or None})
    by_nat = collections.defaultdict(lambda: [0, 0])
    for q in qs:
        if q["qualified"]: by_nat[q["countryCode"]][0] += 1
        elif (q["countryPosition"] or 0) > LIMIT and path_of(q) in ("ranking", "norm", "label"):
            by_nat[q["countryCode"]][1] += 1
    nations = sorted(([n, a, b] for n, (a, b) in by_nat.items()), key=lambda x: (-(x[1] + x[2]), -x[1], x[0]))[:8]
    paths = collections.Counter(path_of(q) for q in qualified)
    on_list = {key(q["name"]) for q in qs}
    not_yet = [a for a in (wr or {}).get("athletes", []) if key(a["name"]) not in on_list][:WR_SHOW]
    return {"slug": slug, "sex": sex, "label": LABEL[slug], "eventId": eid, "url": page_url(eid),
            "fieldSize": raw["entryNumber"], "standard": de_num(raw["entryStandard"]),
            "window": f"{raw['firstQualificationDay']} – {raw['lastQualificationDay']}",
            "assigned": len(qualified), "paths": dict(paths), "cutScore": cut,
            "listLength": len(qs), "blocked": sum(b for _, _, b in nations),
            "athletes": ger, "notYet": not_yet, "nations": [{"nat": n, "in": a, "blocked": b} for n, a, b in nations]}


if __name__ == "__main__":
    raw_dir = os.path.join(ROOT, "data", "raw")
    wr_dir = os.path.join(ROOT, "data", "raw_wr")
    events, h, wr_asof = [], hashlib.sha256(), None
    for eid in EVENTS:
        raw = json.load(open(os.path.join(raw_dir, f"{eid}.json"), encoding="utf-8"))
        slug, sex = EVENTS[eid][:2]
        wr_path = os.path.join(wr_dir, f"{slug}_{sex}.json")
        wr = json.load(open(wr_path, encoding="utf-8")) if os.path.exists(wr_path) else None
        wr_asof = wr_asof or (wr or {}).get("asOf")
        h.update(json.dumps(raw["qualifications"], sort_keys=True).encode())
        h.update(json.dumps(wr, sort_keys=True).encode())
        events.append(event(eid, raw, wr))
    total = sum(sum(a["status"] == "in" for a in e["athletes"]) for e in events)
    fingerprint = h.hexdigest()[:16]
    latest = os.path.join(ROOT, "data", "roadto.json")
    prev = json.load(open(latest)) if os.path.exists(latest) else {}
    changed = prev.get("fingerprint") != fingerprint
    today = datetime.datetime.now(ZoneInfo("Europe/Berlin")).date().isoformat()
    data = {"fetched": today if changed else prev.get("fetched", today), "fingerprint": fingerprint,
            "germanInField": total, "wrAsOf": wr_asof, "maxPerNation": LIMIT, "near": NEAR, "events": events,
            "source": "https://worldathletics.org/stats-zone/road-to/7216591"}
    os.makedirs(os.path.join(ROOT, "data", "history"), exist_ok=True)
    for path in (latest, os.path.join(ROOT, "data", "history", f"{data['fetched']}.json")):
        json.dump(data, open(path, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    web = os.path.join(ROOT, "web", "src", "data")
    if os.path.isdir(os.path.dirname(web)):
        os.makedirs(web, exist_ok=True)
        json.dump(data, open(os.path.join(web, "roadto.json"), "w", encoding="utf-8"), ensure_ascii=False)
        json.dump(json.load(open(os.path.join(ROOT, "nations.json"), encoding="utf-8")),
                  open(os.path.join(web, "nations.json"), "w", encoding="utf-8"), ensure_ascii=False)
    if os.environ.get("GITHUB_OUTPUT"):
        open(os.environ["GITHUB_OUTPUT"], "a").write(f"changed={'true' if changed else 'false'}\nstand={data['fetched']}\n")
    print(f"Stand {data['fetched']} | {total}/36 qualifiziert | geändert: {changed}")
    for e in events:
        print(f"  {e['label']:17} {e['sex']:5} {e['assigned']:3}/{e['fieldSize']:3} vergeben | " +
              ("" if not e["notYet"] else "WR: " + "/".join(a["name"].split()[-1] for a in e["notYet"][:3]) + " | ") + ", ".join(f"{a['name'].split()[-1]} {a['status']}" + (f"#{a['pos']}" if a['pos'] else f" N{a['wait']}" if a['wait'] else "")
                        for a in e["athletes"][:4]))
