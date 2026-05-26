#!/usr/bin/env python3
"""Read The Nest calendar events from Supabase for Sonya/Hermes scheduled jobs.

Required environment variables:
  NEST_SUPABASE_URL
  NEST_SUPABASE_SERVICE_ROLE_KEY
  NEST_SUPABASE_OWNER_ID

Optional:
  NEST_SUPABASE_CALENDAR_TABLE=assistant_calendar_events

Example:
  python3 scripts/read_calendar_events.py --days 7 --pretty
"""

from __future__ import annotations

import argparse
import json
import os
import sys
from datetime import date, datetime, timedelta
from urllib.parse import urlencode
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError


DEFAULT_TABLE = "assistant_calendar_events"


def require_env(name: str) -> str:
    value = os.environ.get(name, "").strip()
    if not value:
        raise SystemExit(f"Missing required environment variable: {name}")
    return value


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Read The Nest calendar events from Supabase.")
    parser.add_argument("--date", default=date.today().isoformat(), help="Start date, YYYY-MM-DD. Default: today.")
    parser.add_argument("--days", type=int, default=1, help="Number of days to read. Default: 1.")
    parser.add_argument("--pretty", action="store_true", help="Print a readable agenda instead of raw JSON.")
    parser.add_argument("--include-notes", action="store_true", help="Include notes/location in pretty output.")
    return parser.parse_args()


def fetch_events(start: date, days: int) -> list[dict]:
    supabase_url = require_env("NEST_SUPABASE_URL").rstrip("/")
    service_key = require_env("NEST_SUPABASE_SERVICE_ROLE_KEY")
    owner_id = require_env("NEST_SUPABASE_OWNER_ID")
    table = os.environ.get("NEST_SUPABASE_CALENDAR_TABLE", DEFAULT_TABLE).strip() or DEFAULT_TABLE

    end = start + timedelta(days=max(days, 1) - 1)
    query = urlencode({
        "owner_id": f"eq.{owner_id}",
        "event_date": [f"gte.{start.isoformat()}", f"lte.{end.isoformat()}"],
        "order": "event_date.asc,start_time.asc",
        "select": "id,title,event_date,start_time,end_time,calendar,repeat_rule,reminder,location,notes,source,status,updated_at",
    }, doseq=True)
    url = f"{supabase_url}/rest/v1/{table}?{query}"
    request = Request(url, headers={
        "apikey": service_key,
        "Authorization": f"Bearer {service_key}",
        "Accept": "application/json",
    })

    try:
        with urlopen(request, timeout=30) as response:
            return json.loads(response.read().decode("utf-8"))
    except HTTPError as exc:
        body = exc.read().decode("utf-8", errors="replace")
        raise SystemExit(f"Supabase HTTP {exc.code}: {body}") from exc
    except URLError as exc:
        raise SystemExit(f"Could not reach Supabase: {exc.reason}") from exc


def print_pretty(events: list[dict], include_notes: bool) -> None:
    if not events:
        print("No calendar events found for that range.")
        return

    current_date = None
    for event in events:
        event_date = str(event.get("event_date") or "")
        if event_date != current_date:
            current_date = event_date
            try:
                label = datetime.strptime(event_date, "%Y-%m-%d").strftime("%A, %B %-d, %Y")
            except ValueError:
                label = event_date
            print(f"\n{label}")
        start = str(event.get("start_time", ""))[:5]
        end = str(event.get("end_time", ""))[:5]
        repeat = event.get("repeat_rule")
        repeat_label = f" · repeats {repeat}" if repeat and repeat != "none" else ""
        print(f"- {start}-{end} {event.get('title', '(untitled)')} [{event.get('calendar', 'other')}]{repeat_label}")
        if include_notes:
            location = event.get("location")
            notes = event.get("notes")
            if location:
                print(f"  Location: {location}")
            if notes:
                print(f"  Notes: {notes}")


def main() -> int:
    args = parse_args()
    try:
        start = datetime.strptime(args.date, "%Y-%m-%d").date()
    except ValueError as exc:
        raise SystemExit("--date must be YYYY-MM-DD") from exc

    events = fetch_events(start, args.days)
    if args.pretty:
        print_pretty(events, args.include_notes)
    else:
        print(json.dumps({"start_date": start.isoformat(), "days": args.days, "events": events}, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
