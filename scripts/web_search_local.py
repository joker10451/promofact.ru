#!/usr/bin/env python3
"""Локальный веб-поиск через DuckDuckGo HTML (без API-ключа).

Использование:
  python scripts/web_search_local.py "запрос" [limit]

Выводит JSON-список {title, url, snippet}.
"""
import sys
import json
import urllib.parse
import urllib.request
import re
import html


def search(query: str, limit: int = 8) -> list[dict]:
    url = "https://html.duckduckgo.com/html/?q=" + urllib.parse.quote(query)
    req = urllib.request.Request(
        url,
        headers={
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36"
        },
    )
    with urllib.request.urlopen(req, timeout=15) as r:
        body = r.read().decode("utf-8", "ignore")

    results = []
    title_re = re.compile(
        r'<a[^>]+class="result__a"[^>]*href="([^"]+)"[^>]*>(.*?)</a>', re.S
    )
    snippet_re = re.compile(
        r'<a[^>]+class="result__snippet"[^>]*>(.*?)</a>', re.S
    )

    titles = title_re.findall(body)
    snippets = snippet_re.findall(body)

    for i, (href, title) in enumerate(titles[:limit]):
        m = re.search(r"uddg=([^&]+)", href)
        real = urllib.parse.unquote(m.group(1)) if m else href
        snippet = ""
        if i < len(snippets):
            snippet = html.unescape(re.sub(r"<[^>]+>", "", snippets[i])).strip()
        results.append(
            {
                "title": html.unescape(re.sub(r"<[^>]+>", "", title)).strip(),
                "url": real,
                "snippet": snippet,
            }
        )
    return results


if __name__ == "__main__":
    q = sys.argv[1] if len(sys.argv) > 1 else ""
    lim = int(sys.argv[2]) if len(sys.argv) > 2 else 8
    if not q:
        print("usage: web_search_local.py \"query\" [limit]")
        sys.exit(1)
    print(json.dumps(search(q, lim), ensure_ascii=False, indent=2))
