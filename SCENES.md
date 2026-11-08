# Szenentypen für `work/video.json`

Gemeinsame Felder: `type`, `voice` (Sprechertext), optional `chapter`, `kicker` (kleine Zeile oben), `title` (große Überschrift, `\n` = Zeilenumbruch).
Farben: `red`, `green`, `orange`, `blue`, `yellow`. Zahlen animiert: `countTo` + `decimals` + `prefix`/`suffix`, sonst `text`.

| type | Wofür | Felder |
|---|---|---|
| `hook` | Einstieg, riesige Zahl/Wort | `kicker`, `countTo`/`text`, `prefix`, `suffix`, `decimals`, `line`, `sub`, `color` |
| `stat` | eine Kennzahl groß mit Icon | `kicker`, `icon` (Emoji), `countTo`/`text`, `label`, `note`, `color` |
| `bars` | 2–5 Werte vergleichen | `bars:[{label, value, display, color}]`, `callout` (z. B. „×4,2“), `calloutSub` |
| `yearbars` | Zeitreihe mit +/− Balken | `data:[{label, value, display?}]`, `highlight:[labels]`, `badge`, `note` |
| `chart` | Kerzenchart (Kursverlauf) | `points:[Zahlen]` (12–35 Werte, letzter = aktueller Kurs), `priceLabel`, `ticks:[{sym, val, up}]` |
| `cards` | 2–6 Gründe/Fakten | `cards:[{icon, title, sub, color?}]` |
| `flows` | Zu-/Abflüsse, Summe | `lock?:{title, sub, icon}`, `rows:[{label, countTo, decimals, prefix, suffix, up}]`, `total:{label, countTo,…}`, `note` |
| `dates` | Termine/Kalender | `items:[{top, big, title, sub, color?}]` (2–4) |
| `compare` | schlecht vs. gut | `left:{title, icon, points[]}` (rot ❌), `right:{…}` (grün ✅), `slogan` |
| `link` | Verbindung A → B (Ursache, Herkunft) | `from`, `to`, `stamp`, `stat:{countTo, suffix, label}` |
| `vault` | Tresor/Wallet öffnet sich, Coins fliegen | `label`, `sublabel`, `info:{title, text}` |
| `steps` | Anleitung, nummeriert | `steps:[text]` (3–5) |
| `outro` | Abo-Aufruf | `question`, `disclaimer` |

## Karikatur-Figuren (`character`, in jeder Szene möglich)

```json
"character": {"kind": "trader", "mood": "shocked", "side": "right", "say": "Was ist da los?"}
```
- `kind`: `host` (Moderator, orange, spricht), `hacker` (Kapuze), `banker` (Anzug, Brille), `investor` (Anlegerin), `trader` (Headset)
- `mood`: `happy`, `explaining`, `shocked`, `worried`, `thinking`, `angry`
- `side`: `right` oder `left` – die Szene rückt automatisch zur anderen Seite (80 %).
- `"character": false` schaltet den automatischen Moderator in hook/outro ab.

## 3D
`bars` sind 3D-Säulen, `hook` hat rotierende 3D-Münzen, `vault` wirft 3D-Münzen, im Hintergrund schweben 3D-Münzen/Würfel,
und die Kamera kippt bei jedem Szenenwechsel durch den Raum – alles automatisch.

## Video-Felder
`title`, `seed`, `music_volume` (0.12–0.2), `captions` (Standard an; `false` = aus).
