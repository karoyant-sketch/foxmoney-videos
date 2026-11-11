"""Set a custom YouTube thumbnail via the official YouTube Data API v3 (thumbnails.set).

Needs three environment variables in the cloud environment (claude.ai/code → Umgebung → Umgebungsvariablen):
  YT_CLIENT_ID, YT_CLIENT_SECRET, YT_REFRESH_TOKEN   (OAuth client of Asdas' own Google Cloud project,
  scope https://www.googleapis.com/auth/youtube.upload)

  python3 tools/yt_thumbnail.py <videoId or YouTube URL> work/thumbnail.jpg

Exit code 0 = thumbnail set, 2 = credentials missing, 1 = API error (message printed).
"""
import json
import os
import re
import sys
import urllib.parse
import urllib.request


def video_id(s: str) -> str:
    m = re.search(r"(?:v=|youtu\.be/|shorts/|/live/)([A-Za-z0-9_-]{11})", s)
    return m.group(1) if m else s.strip()


def access_token() -> str:
    data = urllib.parse.urlencode({
        "client_id": os.environ["YT_CLIENT_ID"],
        "client_secret": os.environ["YT_CLIENT_SECRET"],
        "refresh_token": os.environ["YT_REFRESH_TOKEN"],
        "grant_type": "refresh_token",
    }).encode()
    with urllib.request.urlopen("https://oauth2.googleapis.com/token", data=data, timeout=30) as r:
        return json.loads(r.read())["access_token"]


def main() -> int:
    if not all(os.environ.get(k) for k in ("YT_CLIENT_ID", "YT_CLIENT_SECRET", "YT_REFRESH_TOKEN")):
        print("YouTube-API-Zugangsdaten fehlen (YT_CLIENT_ID / YT_CLIENT_SECRET / YT_REFRESH_TOKEN).")
        return 2
    vid, img = video_id(sys.argv[1]), sys.argv[2]
    body = open(img, "rb").read()
    if len(body) > 2_000_000:
        print("Thumbnail > 2 MB – bitte mit niedrigerer JPEG-Qualität neu rendern.")
        return 1
    req = urllib.request.Request(
        f"https://www.googleapis.com/upload/youtube/v3/thumbnails/set?videoId={vid}&uploadType=media",
        data=body,
        method="POST",
        headers={"Authorization": f"Bearer {access_token()}", "Content-Type": "image/jpeg"},
    )
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            print("Thumbnail gesetzt:", json.loads(r.read()).get("items", [{}])[0].get("maxres", {}).get("url", "ok"))
            return 0
    except urllib.error.HTTPError as e:
        print("YouTube-API-Fehler", e.code, e.read().decode()[:500])
        return 1


if __name__ == "__main__":
    sys.exit(main())
