#!/usr/bin/env python3
"""
Fetch and print the final classification of an F1 race
using the public OpenF1 API.

Default race = Imola 2025 (meeting_key 1260, session_key 9987).
You can override with --session <session_key> or --meeting <meeting_key>.
When only meeting_key is provided the script picks the Race session within it.
"""

import argparse
import datetime as dt
import sys
from typing import List, Dict

import pandas as pd
import requests


OPENF1_BASE = "https://api.openf1.org/v1"


def get_json(endpoint: str, **params) -> List[Dict]:
    """Helper for GET requests with basic error handling."""
    url = f"{OPENF1_BASE}/{endpoint}"
    r = requests.get(url, params=params, timeout=15)
    r.raise_for_status()
    return r.json()


def resolve_session(meeting_key: int) -> int:
    """Return the session_key for the Race session of a meeting."""
    sessions = get_json("sessions", meeting_key=meeting_key, session_type="Race")
    if not sessions:
        sys.exit(f"No Race session found for meeting_key={meeting_key}")
    return sessions[0]["session_key"]


def final_positions(session_key: int) -> pd.DataFrame:
    """
    Return DataFrame with columns:
        position | driver_number | full_name | team_name
    """

    # 1️⃣ full /position stream
    pos = get_json("position", session_key=session_key)
    if not pos:
        sys.exit(f"No /position data returned for session_key={session_key}")

    pos_df = (
        pd.DataFrame(pos)
        .sort_values("date")           # chronological
        .groupby("driver_number")
        .tail(1)                       # last row per driver = final place
        [["driver_number", "position"]]
    )

    # 2️⃣ driver metadata (now using full_name)
    drv_df = pd.DataFrame(
        get_json("drivers", session_key=session_key)
    )[["driver_number", "full_name", "team_name"]]

    # 3️⃣ merge, sort, and re-order
    return (
        pos_df.merge(drv_df, on="driver_number")
        .sort_values("position")
        .loc[:, ["position", "driver_number", "full_name", "team_name"]]
        .reset_index(drop=True)
    )


def main() -> None:
    parser = argparse.ArgumentParser(description="OpenF1 race classification fetcher")
    parser.add_argument(
        "--session",
        type=int,
        help="session_key of the Race session (overrides --meeting)",
    )
    parser.add_argument(
        "--meeting",
        type=int,
        help="meeting_key; script auto-picks the Race session inside that meeting",
    )
    args = parser.parse_args()

    # Defaults
    meeting_key_default = 1260
    session_key_default = 9987

    if args.session:
        session_key = args.session
    elif args.meeting:
        session_key = resolve_session(args.meeting)
    else:
        session_key = session_key_default

    df = final_positions(session_key)
    print("\nFinal Classification")
    print(df.to_string(index=False,
                   header=["Pos", "#", "Driver", "Team"]))


if __name__ == "__main__":
    main()