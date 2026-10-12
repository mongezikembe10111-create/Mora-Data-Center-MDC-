#!/usr/bin/env python3
"""Check civic source pages for review; never silently publish changed deadlines.

Usage: python scripts/civic-refresh.py --output /tmp/mora-civic-refresh.json
Uses Python's standard library, HTTPS certificate verification, and no accounts.
The report is evidence for an editor to review, not an automatic data update.
"""

import argparse
import concurrent.futures
import datetime
import hashlib
import json
import pathlib
import urllib.error
import urllib.request
from html.parser import HTMLParser

ROOT = pathlib.Path(__file__).resolve().parent.parent


class PublicText(HTMLParser):
    def __init__(self):
        super().__init__()
        self.parts = []
        self.links = []
        self.skip = 0

    def handle_starttag(self, tag, attributes):
        attributes = dict(attributes)
        if tag in ("script", "style"):
            self.skip += 1
        if tag == "a" and attributes.get("href"):
            self.links.append(attributes["href"])

    def handle_endtag(self, tag):
        if tag in ("script", "style"):
            self.skip = max(0, self.skip - 1)

    def handle_data(self, data):
        if not self.skip and data.strip():
            self.parts.append(" ".join(data.split()))


def check(source):
    request = urllib.request.Request(
        source["url"], headers={"User-Agent": "Mozilla/5.0 (MORA civic source check)"}
    )
    result = {"id": source["id"], "url": source["url"]}
    try:
        with urllib.request.urlopen(request, timeout=25) as response:
            data = response.read(8 * 1024 * 1024 + 1)
            if len(data) > 8 * 1024 * 1024:
                raise ValueError("Source exceeds 8 MiB review limit")
            digest = hashlib.sha256(data).hexdigest()
            result.update(
                status=response.status,
                finalUrl=response.url,
                sha256=digest,
                changed=digest != source.get("sha256"),
                contentType=response.headers.get("Content-Type"),
            )
            if "html" in (response.headers.get("Content-Type") or "").lower():
                parser = PublicText()
                parser.feed(data.decode("utf-8", errors="replace"))
                result["text"] = "\n".join(parser.parts)[:60000]
                result["links"] = list(dict.fromkeys(parser.links))
    except (urllib.error.URLError, TimeoutError, ValueError) as error:
        result["error"] = str(error)
        if isinstance(error, urllib.error.HTTPError):
            result["status"] = error.code
    return result


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", default="/tmp/mora-civic-refresh.json")
    parser.add_argument("--source", help="Check a single source ID instead of all sources")
    args = parser.parse_args()
    snapshot = json.loads((ROOT / "data/raw/civic-sources-2026-10-12.json").read_text())
    selected = snapshot["sources"]
    if args.source:
        selected = [entry for entry in selected if entry["id"] == args.source]
        if not selected:
            parser.error("Unknown source ID")
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as executor:
        results = list(executor.map(check, selected))
    report = {
        "checkedAt": datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=2), "SAST")).isoformat(),
        "timezone": "Africa/Johannesburg",
        "publishedSnapshotChanged": False,
        "instruction": "Review source changes, resolve conflicting deadlines, and update the curated snapshot and evidence together. A changed page hash may be a rotating menu or featured member, not a changed consultation.",
        "results": results,
    }
    destination = pathlib.Path(args.output)
    destination.parent.mkdir(parents=True, exist_ok=True)
    destination.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n")
    successes = sum(entry.get("status") == 200 for entry in results)
    changed = sum(entry.get("changed", False) for entry in results)
    print(f"Checked {len(results)} civic sources: {successes} successful, {changed} changed hashes.")
    print(f"Review report: {destination}. The published snapshot has not been changed.")


if __name__ == "__main__":
    main()
