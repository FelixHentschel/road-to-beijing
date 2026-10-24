"""Liest die offiziellen „Road to Beijing 27“-Listen von World Athletics.

Öffnet die öffentlichen Seiten im Browser (Playwright) und speichert die Liste, die
die Seite selbst lädt. Kein direkter API-Zugriff.

  python fetch_roadto.py            schreibt data/raw/<eventId>.json
"""
import json, os, sys, time
from playwright.sync_api import sync_playwright

ROOT = os.path.dirname(os.path.abspath(__file__))
COMP = 7216591
EVENTS = {  # eventId: (slug, sex, erwartete Feldgröße, Name bei World Athletics)
    10229512: ("800m", "women", 56, "Women's 800 Metres"),
    10229501: ("800m", "men", 56, "Men's 800 Metres"),
    10229513: ("1500m", "women", 56, "Women's 1500 Metres"),
    10229502: ("1500m", "men", 56, "Men's 1500 Metres"),
    10229514: ("5000m", "women", 42, "Women's 5000 Metres"),
    10229609: ("5000m", "men", 42, "Men's 5000 Metres"),
    10229521: ("10000m", "women", 27, "Women's 10,000 Metres"),
    10229610: ("10000m", "men", 27, "Men's 10,000 Metres"),
    10229524: ("3000msc", "women", 36, "Women's 3000 Metres Steeplechase"),
    10229614: ("3000msc", "men", 36, "Men's 3000 Metres Steeplechase"),
    10229534: ("marathon", "women", 100, "Women's Marathon"),
    10229634: ("marathon", "men", 100, "Men's Marathon"),
}
UA = "Mozilla/5.0 (compatible; AuslaufenPodcast-RoadToBeijing/1.0; +https://auslaufen-podcast.de)"


def page_url(eid):
    return f"https://worldathletics.org/stats-zone/road-to/{COMP}?eventId={eid}"


def fetch_all(out_dir):
    os.makedirs(out_dir, exist_ok=True)
    problems = []
    with sync_playwright() as p:
        browser = p.chromium.launch()
        ctx = browser.new_context(user_agent=UA)
        for eid, (slug, sex, field, name) in EVENTS.items():
            got = None
            for attempt in range(3):
                page = ctx.new_page()
                box = {}

                def on_response(r, eid=eid):
                    pd = r.request.post_data or ""
                    if "graphql" in r.url and "GetChampionshipQualifications" in pd and f'"eventId":"{eid}"' in pd.replace(" ", ""):
                        try:
                            box["d"] = r.json()["data"]["getChampionshipQualifications"]
                        except Exception:
                            pass

                page.on("response", on_response)
                try:
                    page.goto(page_url(eid), wait_until="networkidle", timeout=90000)
                    page.wait_for_timeout(1500)
                except Exception as e:
                    box["err"] = str(e)
                page.close()
                got = box.get("d")
                if got:
                    break
                time.sleep(5 * (attempt + 1))
            if not got:
                problems.append(f"{name}: keine Liste geladen")
                continue
            # Plausibilität
            if got.get("disciplineName") != name: problems.append(f"{name}: falsche Disziplin {got.get('disciplineName')}")
            if got.get("entryNumber") != field: problems.append(f"{name}: Feldgröße {got.get('entryNumber')} statt {field}")
            qs = got.get("qualifications") or []
            if len(qs) < 10: problems.append(f"{name}: nur {len(qs)} Einträge")
            if not any(q.get("qualified") for q in qs): problems.append(f"{name}: niemand qualifiziert")
            json.dump(got, open(os.path.join(out_dir, f"{eid}.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
            print(f"  {name:34} Feld {got['entryNumber']:3} | Liste {len(qs):4} | qualifiziert {sum(q['qualified'] for q in qs):3}")
            time.sleep(1)
        browser.close()
    if problems:
        sys.exit("Abbruch, Daten unplausibel:\n  " + "\n  ".join(problems))


if __name__ == "__main__":
    fetch_all(sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, "data", "raw"))
