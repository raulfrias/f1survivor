#!/usr/bin/env python3
"""
Fetch final Qualifying order from OpenF1
(default = Imola 2025, meeting_key 1260).
"""

import argparse, sys, requests, pandas as pd
from typing import List, Dict

BASE = "https://api.openf1.org/v1"


# ── helpers ──────────────────────────────────────────────────────────────────
def get_json(endpoint: str, **params) -> List[Dict]:
    r = requests.get(f"{BASE}/{endpoint}", params=params, timeout=15)
    r.raise_for_status()
    return r.json()


def resolve_session(meeting_key: int) -> int:
    """Return the session_key for the Qualifying session in a meeting."""
    s = get_json("sessions",
                 meeting_key=meeting_key,
                 session_type="Qualifying")
    if not s:
        sys.exit(f"No Qualifying session found for meeting_key {meeting_key}")
    return s[0]["session_key"]


# ── core ─────────────────────────────────────────────────────────────────────
def best_laps(session_key: int) -> pd.DataFrame:
    """
    Return a DataFrame with columns
        position | driver_number | full_name | lap | team_name
    Drivers who set no time (DNF/DNS) are included at the end.
    """
    # /laps may be empty for no-lap drivers, so start with full driver roster
    drivers = pd.DataFrame(
        get_json("drivers", session_key=session_key)
    )[["driver_number", "full_name", "team_name"]]

    # grab all laps (can be empty)
    laps = get_json("laps", session_key=session_key)
    lap_df = pd.DataFrame(laps)

    # figure out which column holds the time
    time_col = next(
        (c for c in ["lap_duration", "lap_time"] if c in lap_df.columns), None
    )
    if time_col:
        # normalise to seconds
        lap_df = lap_df[["driver_number", time_col]].dropna()
        lap_df["t_sec"] = lap_df[time_col].apply(
            lambda v: float(v) if isinstance(v, (int, float))
            else (int(v.split(":")[0]) * 60 + float(v.split(":")[1]))
        )

        # best lap for those who have one
        best = (lap_df.sort_values("t_sec")
                        .groupby("driver_number", as_index=False)
                        .first())
    else:
        best = pd.DataFrame(columns=["driver_number", time_col, "t_sec"])

    # OUTER merge keeps everyone; NaN t_sec == no lap set
    merged = drivers.merge(best, on="driver_number", how="left")

    # final sort → valid lap times first, NaNs last
    merged = (merged.sort_values("t_sec", na_position="last")
                    .assign(position=lambda d: range(1, len(d) + 1))
                    .loc[:, ["position", "driver_number",
                             "full_name", time_col, "team_name"]]
                    .rename(columns={time_col: "best_lap"})
                    .reset_index(drop=True))
    return merged


# ── CLI glue ─────────────────────────────────────────────────────────────────
def main():
    parser = argparse.ArgumentParser(
        description="OpenF1 Qualifying-classification fetcher")
    parser.add_argument("--session", type=int,
                        help="Qualifying session_key (overrides --meeting)")
    parser.add_argument("--meeting", type=int,
                        help="meeting_key; script auto-picks Quali session")
    args = parser.parse_args()

    DEFAULT_MEETING = 1260          # Imola 2025
    session_key = (args.session if args.session
                   else resolve_session(args.meeting or DEFAULT_MEETING))

    df = best_laps(session_key)
    print("\nFinal Qualifying Classification")
    print(df.to_string(index=False,
                       header=["Pos", "#", "Driver", "Best Lap", "Team"]))


if __name__ == "__main__":
    main()