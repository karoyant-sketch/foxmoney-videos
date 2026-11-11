# FOXMONEY – automatische YouTube-Videos

Kanal: **FOXMONEY – Geld Verdienen Online!** (@foxmoney_de), Posty/Postey account_id **2385**, Plattform YOUTUBE.
Nische: Krypto & Finanzen, Sprache Deutsch, Zielgruppe Deutschland/Österreich/Schweiz.
Der Inhaber (Asdas) hat angeordnet: 3 Videos pro Woche, **vollautomatisch veröffentlichen, ohne Rückfrage**.

## Ablauf eines Laufs (in dieser Reihenfolge)

### 1. Thema finden
- `topics.md` lesen – kein Thema der letzten 30 Tage wiederholen.
- WebSearch (mode standard, mehrere Suchen parallel): aktuelle Krypto-/Finanz-News der letzten 72 h
  (z. B. „Bitcoin news“, „Krypto News heute“, „Ethereum news“, „Börse news heute“, „Fed Zinsen“, „ETF Bitcoin“).
- Thema wählen, das gerade trendet **und** sich mit Zahlen/Grafiken erklären lässt.
- Abwechseln: News-Erklärung, Kurs-Analyse, Wissen/Erklärvideo (z. B. „Was ist …“), Spar-/Geld-Tipps.
- Fakten mit WebFetch an mindestens 2 Quellen prüfen. Keine Zahl aus dem Gedächtnis. Nichts erfinden.

### 2. Keyword-Recherche (kostenlos)
```
python3 tools/keywords.py "<hauptbegriff>" "<zweitbegriff>" > work/keywords.json
```
Liefert YouTube-Suchvorschläge (Autocomplete-Score) und Google-Trends (YouTube, DE, 7 Tage).
Falls `source_ok` false ist (Netzwerk): Keywords aus Schlagzeilen/Suchergebnissen ableiten und im Log vermerken.
- Titel (max. 70 Zeichen sichtbar, max. 100): stärkstes Keyword **vorne**, Zahl/Emotion, kein Clickbait-Versprechen, das das Video nicht hält.
- Beschreibung: erste 2 Sätze enthalten Haupt- und Neben-Keywords natürlich; dann Kapitel (aus `work/chapters.txt`),
  Kommentar-Frage, Abo-Hinweis, Quellen mit Datum, Disclaimer, 3 Hashtags.
- Tags: 15–25, Gesamtlänge < 480 Zeichen, Mischung aus Short- und Long-Tail, immer „foxmoney“.

### 3. Skript & Szenen → `work/video.json`
Format siehe `examples/binance-hack.json`, Szenentypen siehe `SCENES.md`.
- 10–13 Szenen, Gesamt 2–3 Minuten (≈ 330–420 Wörter Sprechertext).
- Szene 1 = `hook` (starke Zahl/Frage in < 8 s). Letzte Szene = `outro` mit Kommentarfrage.
- Jede Szene hat `voice` (deutscher Sprechertext, kurze Sätze, du-Form, zahlen ausgeschrieben, wo die Aussprache sonst unklar wäre,
  keine eckigen Klammern) und passende Grafik-Felder. Mindestens 6 verschiedene Szenentypen pro Video.
- `chapter` auf 6–9 Szenen setzen (jedes Kapitel ≥ 10 s).
- `seed` = Slug des Themas (eigene Kamerafahrt **und eigene Musik** pro Video).
- **Karikatur-Figuren:** in 5–7 Szenen ein `character` setzen (siehe SCENES.md) – passend zur Aussage
  (z. B. Hacker beim Angriff, geschockter Trader beim Kurssturz, besorgte Anlegerin bei Verlusten, Banker bei Zahlen,
  Moderator `host` beim Erklären/Nachdenken). `hook` und `outro` haben automatisch den Moderator.
  Optional `say` = kurze Sprechblase (max. 6 Wörter). Nicht in Szenen mit sehr vollem Layout (`cards` mit 4+, `dates`, `link`).
- Untertitel werden automatisch aus `voice` erzeugt. Hintergrundmusik wird automatisch erzeugt und unter der Stimme leiser gemacht
  (`music_volume` 0.12–0.2, Standard 0.16). Liegt eine eigene lizenzierte Musikdatei in `app/public/music/`, wird diese genommen.
- **Thumbnail (sehr wichtig für Klicks):** Feld `thumbnail` in video.json:
  `{"top": "2–3 WÖRTER", "big": "ZAHL/KERN", "bottom": "1–2 WÖRTER!", "color": "red|green|orange|yellow", "arrow": "down|up|none", "character": {"kind": "...", "mood": "shocked|happy|worried|angry"}, "coin": "₿|Ξ|€|$"|false}`.
  Max. ~6 Wörter gesamt, GROSSBUCHSTABEN, eine Emotion, eine Zahl, passt zum Titel (nicht wiederholen, ergänzen).
  Rot+Pfeil runter bei Crash/Verlust, Grün+Pfeil hoch bei Rallye, Orange bei Erklärvideos.
- Pflicht: „Keine Anlageberatung“ im Outro-Sprechertext und im `disclaimer`. Keine Kauf-/Verkaufsempfehlung.

### 4. Stimme mit ElevenLabs
- Stimme: **Marcel – Calm Knowledge Narrator** (ruhige, warme Doku-Erzählerstimme), voice_id `OZx5F3Qe8k5AOBgRq4N0`, Modell `eleven_v4`.
- Ton: Doku-Erzähler – ruhig, klar, spannend erzählt, nicht marktschreierisch.
- Zuerst Kosten prüfen: `creative_generate_speech` mit `estimate_only: true` für den gesamten Text.
  Reichen die Credits nicht → **abbrechen**, nichts hochladen, Push-Nachricht an Asdas: „ElevenLabs-Credits leer – Video <Thema> nicht erstellt“.
- Dann `creative_create_flow` und pro Szene **ein** `creative_generate_speech` (generations_count 1, gleiche flow_id).
  Niemals einen Aufruf wiederholen, um es „nochmal zu versuchen“ – das kostet doppelt.
- `creative_get_flow_run_status` pollen bis fertig, `content_url` jeder Szene mit curl laden:
  `curl -sSL -o work/voice/NN.mp3 "<content_url>"` (NN = 01, 02, … in Szenenreihenfolge). Die URLs laufen nach ~2 h ab.

### 5. Video bauen
```
cd app && npm i --no-audit --no-fund && cd ..
python3 tools/build.py prepare     # Audio + Timeline, schreibt work/chapters.txt
python3 tools/build.py stills      # work/sheet.jpg ansehen (Read) – Überlappungen/abgeschnittener Text? → video.json anpassen, erneut
python3 tools/build.py thumb       # work/thumbnail.jpg ansehen (Read) – Text lesbar, nichts überdeckt? sonst anpassen
python3 tools/build.py render      # ~25–30 min, Ergebnis work/final.mp4 (< 100 MB)
```
Rendern im Hintergrund starten und abwarten. Danach 6 Frames mit ffmpeg ziehen und prüfen, Ton mit volumedetect prüfen (nicht stumm).

### 6. Hochladen & veröffentlichen (Postey)
1. `cp work/final.mp4 outbox/<slug>.mp4`, committen, auf `main` pushen.
2. `upload_media` source_type `url`, url `https://raw.githubusercontent.com/karoyant-sketch/foxmoney-videos/main/outbox/<slug>.mp4`, platform YOUTUBE.
3. `validate_post_content`, dann `create_post` (account_id 2385, platform YOUTUBE, ein content-Eintrag mit
   youtube_title, text = Beschreibung, youtube_tags, youtube_category_id "27", youtube_privacy_status "public",
   media_urls = [cdn_url]) mit idempotency_key = slug.
4. `publish_draft` (platforms ["YOUTUBE"], idempotency_key = slug + "-pub"). Status mit `get_posts` prüfen bis PUBLISHED
   (PUBLISHING ist noch nicht live).
5. `git rm outbox/<slug>.mp4`, committen, pushen (Repo klein halten).
6. Thumbnail: `cp work/thumbnail.jpg thumbnails/<slug>.jpg`, committen, pushen. Postey kann bei YouTube kein Thumbnail setzen.
   Wenn im Lauf ein Browser auf Asdas' Computer erreichbar ist (Built-in-Browser-Tools vorhanden), in YouTube Studio
   beim Video „Thumbnail hochladen“ setzen. Sonst in der Push-Nachricht den Link
   `https://raw.githubusercontent.com/karoyant-sketch/foxmoney-videos/main/thumbnails/<slug>.jpg` mitschicken.

### 7. Abschluss
- Zeile in `topics.md` anhängen: `YYYY-MM-DD | Thema | Titel | Status` – committen & pushen.
- Push-Nachricht an Asdas: Titel + Link bzw. Fehlergrund.
- Bei jedem Fehler: nichts halb veröffentlichen; Fehlergrund in `topics.md` und in der Push-Nachricht.

## Regeln
- Keine Fotos realer Personen, keine Logos/Marken-Grafiken von Firmen nachbauen (nur Namen als Text).
- Keine Liedtexte, keine fremden Texte wörtlich übernehmen.
- Ehrlich bleiben: Prognosen nur als „Warnsignal/Szenario“, nie als sicher.
