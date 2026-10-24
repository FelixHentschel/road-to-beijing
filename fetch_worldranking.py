"""Zusatzquelle, nur als Hinweis: Deutsche im World Ranking (öffentliche HTML-Seiten).

Bestimmt NICHT den Quali-Status. Dient nur dazu, auf der Seite zu zeigen, wer im World Ranking
steht, aber noch nicht auf der offiziellen Road-to-Liste.

  python fetch_worldranking.py   ->  data/raw_wr/<slug>_<sex>.json
"""
import html, json, os, re, sys, time, urllib.request

ROOT = os.path.dirname(os.path.abspath(__file__))
EVENTS = ["800m", "1500m", "5000m", "10000m", "3000msc", "marathon"]
PAGES = 5  # Top 500 reichen für alle realistischen Kandidat:innen
UA = "Mozilla/5.0 (compatible; AuslaufenPodcast-RoadToBeijing/1.0; +https://auslaufen-podcast.de)"
ROW_RE = re.compile(r'<tr[^>]*data-athlete-url="[^"]*"[^>]*>(.*?)</tr>', re.S)
CELL_RE = re.compile(r'<td data-th="([^"]+)">(.*?)</td>', re.S)


def get(url):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    for attempt in range(3):
        try:
            with urllib.request.urlopen(req, timeout=30) as r:
                return r.read().decode("utf-8")
        except Exception as e:
            err = e
            time.sleep(3 * (attempt + 1))
    raise SystemExit(f"Abruf fehlgeschlagen: {url} ({err})")


def main(out_dir):
    os.makedirs(out_dir, exist_ok=True)
    for slug in EVENTS:
        for sex in ("women", "men"):
            ger, asof, rows = [], None, 0
            for p in range(1, PAGES + 1):
                t = get(f"https://worldathletics.org/world-rankings/{slug}/{sex}" + ("" if p == 1 else f"?page={p}"))
                m = re.search(r"As of ([^<]+)<", t)
                asof = asof or (m.group(1).strip() if m else None)
                for r in ROW_RE.findall(t):
                    c = {k: html.unescape(re.sub(r"<[^>]+>", "", v)).strip() for k, v in CELL_RE.findall(r)}
                    rows += 1
                    if c.get("Nat") == "GER":
                        ger.append({"place": int(c["Rank"]), "name": " ".join(c["Competitor"].split()), "score": int(c["score"])})
                time.sleep(0.5)
            if rows < 300 or not asof:
                sys.exit(f"World Ranking {slug} {sex} unplausibel ({rows} Zeilen, Stand {asof})")
            json.dump({"asOf": asof, "athletes": ger}, open(os.path.join(out_dir, f"{slug}_{sex}.json"), "w", encoding="utf-8"),
                      ensure_ascii=False, indent=1)
            print(f"  {slug:9} {sex:6} Stand {asof} | {len(ger)} Deutsche in den Top {rows}")


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, "data", "raw_wr"))
