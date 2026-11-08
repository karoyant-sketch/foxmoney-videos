"""Kostenlose YouTube-Keyword-Recherche für FOXMONEY.

Quellen (gratis, ohne API-Key):
  * YouTube-Autocomplete (suggestqueries.google.com, ds=yt) – echte Suchbegriffe,
    die Leute auf YouTube eintippen. Je früher ein Vorschlag erscheint und je öfter
    er bei Varianten auftaucht, desto stärker wird gesucht.
  * Google Trends (trends.google.com via pytrends) – relatives Suchinteresse
    der letzten 7 Tage auf YouTube in Deutschland.

Benötigt freigegebene Domains: suggestqueries.google.com, trends.google.com
Aufruf:  python3 tools/keywords.py "binance hack" "bitcoin" > keywords.json
"""
import json
import string
import sys
import time
import urllib.parse
import urllib.request
from collections import defaultdict

UA = "Mozilla/5.0 (FOXMONEY keyword tool)"


def suggest(q: str, lang: str = "de", gl: str = "DE") -> list[str]:
    url = (
        "https://suggestqueries.google.com/complete/search?client=firefox&ds=yt"
        f"&hl={lang}&gl={gl}&q={urllib.parse.quote(q)}"
    )
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    try:
        with urllib.request.urlopen(req, timeout=10) as r:
            data = json.loads(r.read().decode("utf-8", "replace"))
        return [s.lower() for s in data[1]]
    except Exception as e:  # network blocked or rate-limited
        print(f"[suggest] {q!r}: {e}", file=sys.stderr)
        return []


def expand(seed: str) -> dict[str, float]:
    """Score = Summe aus (Position-gewichteten) Treffern über alle Varianten."""
    score: dict[str, float] = defaultdict(float)
    variants = [seed, f"{seed} "] + [f"{seed} {c}" for c in string.ascii_lowercase] + [
        f"was ist {seed}", f"{seed} deutsch", f"{seed} news", f"{seed} prognose", f"{seed} erklärt",
    ]
    for v in variants:
        for pos, s in enumerate(suggest(v)):
            score[s] += 1.0 / (1 + pos * 0.3)
        time.sleep(0.15)
    return score


def trends(terms: list[str]) -> dict[str, int]:
    try:
        from pytrends.request import TrendReq
    except ImportError:
        return {}
    out: dict[str, int] = {}
    try:
        py = TrendReq(hl="de-DE", tz=-60)
        for i in range(0, len(terms), 5):
            chunk = terms[i : i + 5]
            py.build_payload(chunk, timeframe="now 7-d", geo="DE", gprop="youtube")
            df = py.interest_over_time()
            for t in chunk:
                out[t] = int(df[t].mean()) if t in df else 0
            time.sleep(1)
    except Exception as e:
        print(f"[trends] {e}", file=sys.stderr)
    return out


def main(seeds: list[str]) -> None:
    total: dict[str, float] = defaultdict(float)
    for s in seeds:
        for k, v in expand(s).items():
            total[k] += v
    ranked = sorted(total.items(), key=lambda kv: -kv[1])[:40]
    top_terms = [k for k, _ in ranked[:10]]
    result = {
        "seeds": seeds,
        "keywords": [{"keyword": k, "autocomplete_score": round(v, 2)} for k, v in ranked],
        "youtube_trends_de_7d": trends(top_terms),
        "source_ok": bool(ranked),
    }
    json.dump(result, sys.stdout, ensure_ascii=False, indent=1)


if __name__ == "__main__":
    main(sys.argv[1:] or ["bitcoin"])
