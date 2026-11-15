# Schlaue Kinder – DE: automatische Kindervideos

Kanal: **Schlaue Kinder – DE** (@schlauekinder-de), Postey account_id **2385**, Plattform YOUTUBE.
Zielgruppe: Kinder 2–7 Jahre, Deutschland/Österreich/Schweiz. Sprache Deutsch.
Inhaber: Asdas. Rhythmus: Mo/Mi/Fr ein Video, 4–6 Minuten, 1920×1080, 16:9.
Alle Pfade unten sind relativ zu `kids/`.

## Grundregeln (immer)
- **Kindgerecht und sicher**: nichts Gruseliges, keine Gewalt, keine gefährlichen Nachahmungs-Handlungen, keine Werbung, keine Markennamen,
  keine echten Personen. Positive Botschaft, einfache Sätze, viel Wiederholung.
- **Nur eigene Inhalte**: keine bekannten Figuren (Peppa, Paw Patrol, …), keine fremden Lieder/Melodien/Texte. Bekannte Volkslieder
  (gemeinfrei, z. B. „Alle meine Entchen“) nur mit neu komponierter Musik.
- **Feste Figuren** aus `characters/characters.json` (Aussehen, Stimme, Farbe). Bilder immer mit dem Referenzbild
  (`sheet_openart_ref`) als visualReference erzeugen, damit die Figuren gleich aussehen.
- Jedes Video **muss** als „Speziell für Kinder“ hochgeladen werden (`youtube_made_for_kids: true`).
- Nie halb veröffentlichen. Wenn etwas Wesentliches fehlt: abbrechen, Grund in `log.md`, Push-Nachricht an Asdas.
- Credits sparen: vor jeder ElevenLabs-Generierung `estimate_only`, Generierungen **nie wiederholen** (kostet doppelt),
  `generations_count: 1`. OpenArt: höchstens 4 Bilder gleichzeitig (Plan-Limit) – Batches à 4.

## Ablauf eines Laufs

### 1. Thema
- `log.md` lesen: kein Thema/Lernziel der letzten 30 Tage wiederholen. Videoarten abwechseln:
  Lerngeschichte (Farben, Zahlen, Formen, ABC, Tiere, Gefühle, Jahreszeiten), Abenteuer, Tiergeschichte,
  Mitmach-/Bewegungslied, Einschlafgeschichte (ruhig, abends), Saison/Feiertag (Laternenumzug, Nikolaus, Weihnachten, Ostern …).
- Trends: WebSearch (mode standard, parallel) z. B. „beliebte Kinderlieder 2026“, „Kinder YouTube Trends Deutschland“,
  saisonale Anlässe der nächsten 14 Tage. Keine Zahlen erfinden – wenn keine Daten, nach Saison + Abwechslung wählen.
- Keyword-Ideen: `python3 ../tools/keywords.py "<begriff> für kinder" "<begriff> kinderlied"` (falls Netzwerk geht).

### 2. Drehbuch → `work/video.json`
Format: siehe `examples/regenbogen.json`. 4–6 Minuten gesamt:
- 14–22 Szenen. Szene 1 mit `title` (Videotitel als Titelkarte). Letzte Szene `outro: true`.
- Jede Story-Szene: `image`, `camera` (zoom_in | zoom_out | pan_left | pan_right | pan_up | pan_down – abwechseln),
  `prompt` (englische Bildbeschreibung, Figuren in GROSSBUCHSTABEN), `lines` [{who, text}] mit who ∈ narrator | lotti | brummo | pip.
  Sätze kurz (max. 12 Wörter), Fragen an die Kinder („Weißt du, welche Farbe …?“) mit kurzer Pause (eigene Zeile „…“ vermeiden,
  stattdessen `min_sec` der Szene erhöhen).
- **Ein Lied pro Video** (`kind: "song"`, 45–75 s, eigene Liedtexte, 2–4 Bilder, `bpm`), ideal nach dem Lernteil.
  Liedtext einfach, Reim, eingängiger Refrain, 8–16 Zeilen.
- 1–2 Szenen mit `clip` (bewegter Clip für einen Höhepunkt) – Budget beachten.
- `chapter` auf 4–7 Szenen. `thumbnail`: {image, top (1–2 Wörter), big (1–2 Wörter, GROSS), side, prompt}.
- Gesamte Sprechtexte ≈ 450–700 Wörter.

### 3. Bilder & Clips (OpenArt)
- Modell `nano-banana-2`, mode `image2image`, `aspectRatio 16:9`, `resolution 1K` (15 Credits; 2K = 30 Credits nur für Titelbild/Thumbnail),
  `visualReferences: [{"type":"image","id":"<sheet_openart_ref>","label":"character reference sheet"}]`.
  Prompt = Szenen-Prompt + Figurenbeschreibungen (`look`) + `world` + `style_prompt` +
  „Wide 16:9 framing, characters fully inside the frame, keep the lower fifth calm (space for subtitles).“
- Batches à 4 (`openart_generate_image_batch`), dann `openart_creation_get` bis COMPLETED.
- Clip: `wan3-0` image2video, 720p, 5 s, audio false (≈200 Credits), startFrame = resource-id des Szenenbilds.
- Kosten im Blick: Starter-Plan 4.000 Credits/Monat ≈ 13 Videos → **max. ≈ 300 Credits pro Video**
  (≈ 18 Bilder à 15 Credits mit `resolution 1K` oder 9 Bilder à 30 bei 2K, oder 1 Clip weniger). Lieber 1K + mehr Bilder.
  `openart_account_get` am Anfang: reicht das Guthaben nicht → abbrechen + Push.
- Alle URLs in `jobs/<slug>/assets.json` eintragen (Format siehe `jobs/regenbogen/assets.json`).

### 4. Stimmen, Lied (ElevenLabs)
- Ein Flow pro Video (`creative_create_flow`), Name = Videotitel.
- Pro Zeile ein `creative_generate_speech` (model `eleven_v4`, voice_id aus characters.json, generations_count 1).
- Lied: `creative_generate_in_flow` node_type music, model `eleven_music_v2_5`, dann `creative_update_node` mit
  `{"duration_seconds": <45–75>, "lyrics_type": "custom", "instrumental": false, "lyrics": "<Liedtext>"}` und `creative_run_flow_nodes`.
- generation_ids in assets.json (`el_gen`), `_el_flow` = flow_id.

### 5. Download & Bau
```
python3 tools/fetch.py jobs/<slug>/assets.json work/resolved.json
cd app && npm i --no-audit --no-fund && cd ..
python3 tools/build.py prepare
python3 tools/build.py stills     # work/sheet.jpg ansehen (Read): Untertitel lesbar? nichts Wichtiges verdeckt?
python3 tools/build.py thumb      # work/thumbnail.jpg ansehen
python3 tools/build.py render     # im Hintergrund starten, abwarten (≈ 1,5–3 × Videolänge)
python3 tools/qc.py 240 420       # muss PASS sein; work/qc_frames.jpg ansehen
```
- `work/resolved.json`: vorher alle `el_gen` mit `creative_get_generations` (je 4 IDs, flow_id = `_el_flow`) und alle
  `openart_history` mit `openart_creation_get` in frische URLs auflösen: `{"<id>": "<url>"}`.
- Figuren-Porträts (Sprech-Badge): beim ersten Lauf `characters/sheet.png` ansehen und für lotti/brummo/pip `crop`
  {cx, cy, size} (Anteile: Mittelpunkt x/y vom Bild, Größe = Anteil der Bildhöhe, Kopf + Schultern) eintragen, committen.
- Prüfe die Bilder (stills/qc_frames) **selbst**: Figuren erkennbar und konsistent, nichts Unheimliches, kein Text/Wasserzeichen im Bild.
  Fehlerhaftes Bild → einmal neu generieren (gleicher Prompt + „fix: …“), sonst die Szene mit einem anderen Bild zeigen.

### 6. Hochladen (Postey)
1. `cp work/final.mp4 outbox/<slug>.mp4`, commit, push auf `main`.
2. `upload_media` source_type `url`, url `https://raw.githubusercontent.com/karoyant-sketch/foxmoney-videos/main/kids/outbox/<slug>.mp4`, platform YOUTUBE.
3. `validate_post_content`, dann `create_post` (account_id 2385, platform YOUTUBE, ein content-Eintrag:
   youtube_title, text = Beschreibung, youtube_tags, youtube_category_id "1" (Film & Animation) bzw. "27" (Bildung) bei Lernvideos,
   youtube_privacy_status "public", **youtube_made_for_kids true**, media_urls [cdn_url]), idempotency_key = slug.
4. `publish_draft` (idempotency_key slug+"-pub"), `get_posts` bis PUBLISHED.
5. `git rm kids/outbox/<slug>.mp4`, Thumbnail nach `thumbnails/<slug>.jpg`, commit, push.
6. Thumbnail: Postey kann bei YouTube kein Thumbnail setzen → Link `https://raw.githubusercontent.com/karoyant-sketch/foxmoney-videos/main/kids/thumbnails/<slug>.jpg`
   in die Push-Nachricht, damit Asdas es in YouTube Studio setzt.

**SEO** (deutsch, ehrlich, kein Clickbait): Titel ≤ 70 Zeichen, Hauptbegriff vorne + Figur/Serie,
z. B. „Farben lernen mit Lotti 🌈 Regenbogen-Lied für Kinder | Schlaue Kinder“. Beschreibung: 2 Sätze worum es geht und was Kinder lernen,
Kapitel aus `work/chapters.txt`, Hinweis für Eltern, 3 Hashtags (#kinderlieder #lernenfürkinder #schlauekinder).
Tags 15–25 (< 480 Zeichen): Thema, „für kinder“, „kinderlied“, „kleinkind“, „kita“, „lernen“, Figurennamen, „schlaue kinder“.

### 7. Abschluss
- Zeile in `log.md`: `YYYY-MM-DD | Thema/Lernziel | Titel | Status/Link | Credits (OpenArt/ElevenLabs)`. Commit & push.
- Push-Nachricht (PushNotification) an Asdas auf Deutsch: Titel + YouTube-Link + Thumbnail-Link, oder Fehlergrund + was er tun muss.
