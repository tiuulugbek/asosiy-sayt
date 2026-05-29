#!/usr/bin/env python3
"""
Send a daily acoustic.uz traffic report to Telegram.

The script reads configuration from /var/www/acoustic.uz/.env by default.
It uses only Python standard library modules so it can run from cron without
installing project dependencies.
"""

from __future__ import annotations

import argparse
import gzip
import html
import json
import os
import re
import sys
import urllib.parse
import urllib.request
from collections import Counter, defaultdict
from dataclasses import dataclass
from datetime import date, datetime, timedelta
from glob import glob
from pathlib import Path


PROJECT_DIR = Path(__file__).resolve().parents[1]
DEFAULT_ENV_FILE = PROJECT_DIR / ".env"
DEFAULT_LOG_GLOB = "/var/log/nginx/acoustic.uz.access.log*"
FALLBACK_LOG_GLOB = "/var/log/nginx/access.log*"

LOG_RE = re.compile(
    r'^(?P<ip>\S+) \S+ \S+ \[(?P<time>[^\]]+)\] '
    r'"(?P<method>\S+) (?P<path>\S+) (?P<proto>[^"]+)" '
    r'(?P<status>\d{3}) (?P<size>\S+) "(?P<ref>[^"]*)" "(?P<ua>[^"]*)"'
)

BOT_RE = re.compile(
    r"bot|crawler|spider|slurp|bingpreview|facebookexternalhit|whatsapp|"
    r"telegrambot|curl|wget|python-requests|go-http-client|node|postman|"
    r"insomnia|uptimerobot|headless|monitor|scanner|bytespider|petalbot|"
    r"ahrefs|semrush|mj12bot|yandex",
    re.I,
)

ASSET_RE = re.compile(
    r"\.(?:js|css|png|jpe?g|gif|svg|ico|webp|woff2?|ttf|eot|map|txt|xml)$",
    re.I,
)
INTERNAL_RE = re.compile(r"^/(?:_next/|next/|favicon\.ico|robots\.txt|sitemap\.xml)")
ADMIN_RE = re.compile(r"^/(?:assets/|version\.json|login|dashboard|admin)(?:/|$)")


@dataclass
class RequestRow:
    ip: str
    dt: datetime
    method: str
    path: str
    status: str
    referrer: str
    user_agent: str


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Send daily acoustic.uz traffic report")
    parser.add_argument("--date", help="Report date in YYYY-MM-DD format. Default: yesterday")
    parser.add_argument("--today", action="store_true", help="Report today's traffic instead of yesterday")
    parser.add_argument("--env-file", default=str(DEFAULT_ENV_FILE), help="Path to .env file")
    parser.add_argument("--dry-run", action="store_true", help="Print report instead of sending it")
    return parser.parse_args()


def load_env(path: Path) -> dict[str, str]:
    values = dict(os.environ)
    if not path.exists():
        return values

    for raw_line in path.read_text(encoding="utf-8", errors="replace").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip().strip('"').strip("'")
        if key:
            values[key] = value
    return values


def report_date(value: str | None, today: bool = False) -> date:
    if value:
        return datetime.strptime(value, "%Y-%m-%d").date()
    if today:
        return datetime.now().date()
    return (datetime.now() - timedelta(days=1)).date()


def open_log(path: str):
    if path.endswith(".gz"):
        return gzip.open(path, "rt", encoding="utf-8", errors="replace")
    return open(path, "rt", encoding="utf-8", errors="replace")


def candidate_logs(log_glob: str) -> list[str]:
    return sorted(glob(log_glob))


def parse_log_time(value: str) -> datetime:
    return datetime.strptime(value.split()[0], "%d/%b/%Y:%H:%M:%S")


def read_rows(paths: list[str], target: date) -> list[RequestRow]:
    rows: list[RequestRow] = []
    seen: set[tuple[str, datetime, str, str, str, str, str]] = set()
    for path in paths:
        try:
            with open_log(path) as handle:
                for line in handle:
                    match = LOG_RE.match(line)
                    if not match:
                        continue

                    dt = parse_log_time(match.group("time"))
                    if dt.date() != target:
                        continue

                    row = RequestRow(
                        ip=match.group("ip"),
                        dt=dt,
                        method=match.group("method"),
                        path=match.group("path"),
                        status=match.group("status"),
                        referrer=match.group("ref"),
                        user_agent=match.group("ua"),
                    )
                    key = (
                        row.ip,
                        row.dt,
                        row.method,
                        row.path,
                        row.status,
                        row.referrer,
                        row.user_agent,
                    )
                    if key in seen:
                        continue
                    seen.add(key)
                    rows.append(row)
        except FileNotFoundError:
            continue
    return rows


def clean_path(path: str) -> str:
    return path.split("?", 1)[0]


def is_bot(row: RequestRow) -> bool:
    return bool(BOT_RE.search(row.user_agent))


def is_public_page(row: RequestRow) -> bool:
    path = clean_path(row.path)
    if row.method not in {"GET", "HEAD"}:
        return False
    if is_bot(row):
        return False
    if path.startswith("/api/") or path == "/api":
        return False
    if INTERNAL_RE.search(path) or ASSET_RE.search(path) or ADMIN_RE.search(path):
        return False
    if int(row.status) >= 500:
        return False
    return True


def session_count(rows: list[RequestRow]) -> int:
    by_visitor: dict[tuple[str, str], list[datetime]] = defaultdict(list)
    for row in rows:
        by_visitor[(row.ip, row.user_agent)].append(row.dt)

    sessions = 0
    for visits in by_visitor.values():
        previous: datetime | None = None
        for current in sorted(visits):
            if previous is None or current - previous > timedelta(minutes=30):
                sessions += 1
            previous = current
    return sessions


def build_summary(rows: list[RequestRow]) -> dict[str, object]:
    public_pages = [row for row in rows if is_public_page(row)]
    bots = [row for row in rows if is_bot(row)]
    statuses = Counter(row.status for row in public_pages)
    paths = Counter(clean_path(row.path) for row in public_pages)
    referrers = Counter(
        urllib.parse.urlparse(row.referrer).netloc
        for row in public_pages
        if row.referrer and row.referrer != "-"
    )

    return {
        "raw_requests": len(rows),
        "bot_requests": len(bots),
        "pageviews": len(public_pages),
        "visits": session_count(public_pages),
        "unique_ips": len({row.ip for row in public_pages}),
        "top_pages": paths.most_common(7),
        "top_referrers": referrers.most_common(5),
        "status_200": statuses.get("200", 0),
        "status_404": statuses.get("404", 0),
        "status_5xx": sum(count for status, count in statuses.items() if status.startswith("5")),
    }


def fmt_number(value: object) -> str:
    return f"{int(value):,}".replace(",", " ")


def parse_optional_date(value: str | None) -> date | None:
    if not value:
        return None
    return datetime.strptime(value, "%Y-%m-%d").date()


def format_list(items: list[tuple[str, int]], empty: str, limit: int = 5) -> str:
    if not items:
        return empty
    lines = []
    for index, (name, count) in enumerate(items[:limit], start=1):
        lines.append(f"{index}. {html.escape(name or '-')}: <b>{fmt_number(count)}</b>")
    return "\n".join(lines)


def build_message(target: date, summary: dict[str, object]) -> str:
    top_pages = format_list(summary["top_pages"], "Ma'lumot yo'q", limit=5)

    return f"""<b>acoustic.uz kunlik hisobot</b>
Sana: <b>{target.strftime('%d.%m.%Y')}</b>

Tashriflar: <b>{fmt_number(summary['visits'])}</b>
Ko'rishlar: <b>{fmt_number(summary['pageviews'])}</b>
Unique IP: <b>{fmt_number(summary['unique_ips'])}</b>
404 xatolar: <b>{fmt_number(summary['status_404'])}</b>
5xx xatolar: <b>{fmt_number(summary['status_5xx'])}</b>

<b>Top sahifalar:</b>
{top_pages}

#Acousticuz
"""


def send_telegram(token: str, chat_ids: list[str], message: str) -> None:
    if not token:
        raise RuntimeError("TRAFFIC_REPORT_BOT_TOKEN .env faylda to'ldirilmagan")
    if not chat_ids:
        raise RuntimeError("TRAFFIC_REPORT_GROUP_ID .env faylda to'ldirilmagan")

    for chat_id in chat_ids:
        payload = urllib.parse.urlencode(
            {
                "chat_id": chat_id,
                "text": message,
                "parse_mode": "HTML",
                "disable_web_page_preview": "true",
            }
        ).encode()
        url = f"https://api.telegram.org/bot{token}/sendMessage"
        request = urllib.request.Request(url, data=payload, method="POST")
        with urllib.request.urlopen(request, timeout=20) as response:
            body = json.loads(response.read().decode("utf-8"))
            if not body.get("ok"):
                raise RuntimeError(f"Telegram send failed for chat_id={chat_id}: {body}")


def main() -> int:
    args = parse_args()
    env = load_env(Path(args.env_file))
    target = report_date(args.date, args.today)
    log_glob = env.get("TRAFFIC_REPORT_LOG_GLOB", DEFAULT_LOG_GLOB)
    primary_logs = candidate_logs(log_glob)
    fallback_logs = candidate_logs(FALLBACK_LOG_GLOB)
    include_fallback_until = parse_optional_date(
        env.get("TRAFFIC_REPORT_INCLUDE_FALLBACK_UNTIL")
    )

    logs = primary_logs
    if include_fallback_until and target <= include_fallback_until:
        logs = primary_logs + fallback_logs

    rows = read_rows(logs, target)
    if not rows and log_glob != FALLBACK_LOG_GLOB:
        # New dedicated logs start empty after nginx reload. Use the old shared
        # access.log only for historical dates where the dedicated log has no rows.
        rows = read_rows(fallback_logs, target)
    summary = build_summary(rows)
    message = build_message(target, summary)

    if args.dry_run:
        print(message)
        return 0

    report_token = env.get("TRAFFIC_REPORT_BOT_TOKEN") or env.get("TELEGRAM_BOT_TOKEN", "")
    report_chat_ids = env.get("TRAFFIC_REPORT_GROUP_ID") or env.get("TELEGRAM_CHAT_ID", "")
    chat_ids = [
        item.strip()
        for item in report_chat_ids.split(",")
        if item.strip()
    ]
    send_telegram(report_token, chat_ids, message)
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:
        print(f"daily-traffic-report error: {exc}", file=sys.stderr)
        raise SystemExit(1)
