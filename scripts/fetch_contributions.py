#!/usr/bin/env python3
"""Fetch a GitHub user's contribution calendar (last year) into a JSON file for Hugo.

Usage: GH_TOKEN=... python3 scripts/fetch_contributions.py <username> data/contributions.json

Never fails the build: if there's no token or the request fails, it prints why and exits 0,
and the home page simply renders without the activity underlay.
"""
import json
import os
import sys
import urllib.request

QUERY = """
query($login: String!) {
  user(login: $login) {
    contributionsCollection {
      contributionCalendar {
        totalContributions
        weeks { contributionDays { date contributionCount weekday } }
      }
    }
  }
}
"""


def main():
    if len(sys.argv) != 3:
        print(__doc__)
        return
    user, out = sys.argv[1], sys.argv[2]
    token = os.environ.get("GH_TOKEN")
    if not token:
        print("fetch_contributions: no GH_TOKEN set, skipping")
        return
    req = urllib.request.Request(
        "https://api.github.com/graphql",
        data=json.dumps({"query": QUERY, "variables": {"login": user}}).encode(),
        headers={"Authorization": f"bearer {token}", "Content-Type": "application/json", "User-Agent": "hugo-site"},
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            payload = json.load(resp)
    except Exception as e:  # network, auth, rate limit…
        print(f"fetch_contributions: request failed ({e}), skipping")
        return
    if payload.get("errors") or not (payload.get("data") or {}).get("user"):
        print(f"fetch_contributions: API error {payload.get('errors')}, skipping")
        return
    cal = payload["data"]["user"]["contributionsCollection"]["contributionCalendar"]
    weeks = [
        [{"date": d["date"], "count": d["contributionCount"], "weekday": d["weekday"]} for d in w["contributionDays"]]
        for w in cal["weeks"]
    ]
    os.makedirs(os.path.dirname(out) or ".", exist_ok=True)
    with open(out, "w") as f:
        json.dump({"user": user, "total": cal["totalContributions"], "weeks": weeks}, f)
    print(f"fetch_contributions: {cal['totalContributions']} contributions over {len(weeks)} weeks → {out}")


if __name__ == "__main__":
    main()
