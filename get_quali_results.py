#!/usr/bin/env python3
"""
Fetch final Qualifying order from OpenF1
with support for latest race meeting keys and improved error handling.
"""

import argparse, sys, requests, pandas as pd
from datetime import datetime, timedelta, timezone
from typing import List, Dict, Optional, Tuple

BASE = "https://api.openf1.org/v1"


# ── helpers ──────────────────────────────────────────────────────────────────
def get_json(endpoint: str, **params) -> List[Dict]:
    try:
        r = requests.get(f"{BASE}/{endpoint}", params=params, timeout=15)
        r.raise_for_status()
        return r.json()
    except requests.exceptions.RequestException as e:
        print(f"Error fetching data from {endpoint}: {str(e)}", file=sys.stderr)
        return []


def get_latest_qualifying_session_key_from_api() -> Optional[int]:
    """
    Fetches all completed qualifying sessions for the current year directly from the API
    and returns the session_key of the most recent one based on session_key.
    """
    try:
        # Use timezone-aware UTC now
        current_year = datetime.now(timezone.utc).year
        print(f"Attempting to find latest qualifying session for year {current_year} from API sessions endpoint...", file=sys.stderr)
        
        sessions = get_json("sessions", year=current_year, session_name="Qualifying")
        
        if sessions:
            # Corrected sorting: Prioritize meeting_key (descending), then session_key (descending as tie-breaker)
            # Ensure meeting_key and session_key exist before attempting to sort
            valid_sessions = [s for s in sessions if 'meeting_key' in s and 'session_key' in s]
            if not valid_sessions:
                print(f"No sessions with valid 'meeting_key' and 'session_key' found for year {current_year}.", file=sys.stderr)
                return None

            sorted_sessions = sorted(
                valid_sessions,
                key=lambda s: (s['meeting_key'], s['session_key']),
                reverse=True
            )
            
            if not sorted_sessions:
                print(f"Sorting resulted in no sessions for year {current_year}.", file=sys.stderr)
                return None

            latest_session = sorted_sessions[0]
            
            # Optional: Add a sanity check for date_end if needed, but problem description
            # indicates API only returns past/completed sessions for this query.
            # Example:
            # latest_session_end_str = latest_session.get('date_end')
            # if latest_session_end_str:
            #     latest_session_end = datetime.fromisoformat(latest_session_end_str.replace('Z', '+00:00'))
            #     if latest_session_end > datetime.now(timezone.utc):
            #         print(f"Warning: Latest session found ({latest_session['session_key']}) appears to be in the future. Check API behavior.", file=sys.stderr)
            #         # Potentially look for the next one in sorted_sessions or handle as error
            
            print(f"Found latest qualifying session via API: Name: {latest_session.get('session_name', 'N/A')} at {latest_session.get('location', 'N/A')}, Session Key: {latest_session['session_key']}", file=sys.stderr)
            return latest_session['session_key']
        else:
            print(f"No qualifying sessions found for year {current_year} via API direct sessions query.", file=sys.stderr)
            return None
    except Exception as e:
        print(f"Error in get_latest_qualifying_session_key_from_api: {str(e)}", file=sys.stderr)
        return None


def get_latest_meeting() -> Optional[int]:
    """Get the most recent or next upcoming race meeting key."""
    try:
        # Get current time in UTC
        now = datetime.now(timezone.utc)
        
        print(f"Old method: Trying to find meetings around current date {now.isoformat()}", file=sys.stderr)
        meetings = get_json("meetings", date=now.isoformat())
        
        if not meetings:
            # If no meetings found, try next 2 weeks (this part might fetch future, unhelpful meetings)
            future = now + timedelta(days=14)
            print(f"Old method: No meetings found, trying next 2 weeks from {future.isoformat()}", file=sys.stderr)
            meetings = get_json("meetings", date=future.isoformat())
        
        if meetings:
            # This old method might pick a "Pre-Season Testing" or other non-race meeting if it's closest.
            # The new method is more targeted.
            print(f"Old method: Found meeting {meetings[0].get('meeting_name', 'N/A')} with key {meetings[0]['meeting_key']}", file=sys.stderr)
            return meetings[0]["meeting_key"]
        
        print("Old method: No upcoming meetings found via meetings endpoint", file=sys.stderr)
        return None
    except Exception as e:
        print(f"Error getting latest meeting (old method): {str(e)}", file=sys.stderr)
        return None


def get_meeting_by_date(race_date: str) -> Optional[int]:
    """Find meeting key for a specific race date by looking for qualifying sessions first."""
    try:
        # Check if this is a future date
        race_datetime = datetime.strptime(race_date, '%Y-%m-%d').replace(tzinfo=timezone.utc)
        now = datetime.now(timezone.utc)
        if race_datetime > now:
            print(f"Race date {race_date} is in the future. No qualifying data available yet.", file=sys.stderr)
            return None

        # Try to find a qualifying session that starts on the given date
        print(f"Attempting to find qualifying session starting on {race_date} to get meeting_key.", file=sys.stderr)
        
        year_to_check = race_date.split('-')[0] # Assuming YYYY-MM-DD

        # Query for all qualifying sessions in that year, then filter by date_start matching race_date
        all_sessions_for_year = get_json("sessions", year=year_to_check, session_name="Qualifying")

        if all_sessions_for_year:
            for session in all_sessions_for_year:
                # Check if the date_start string (e.g., "2024-02-29T10:00:00") begins with the race_date string ("2024-02-29")
                if session.get("date_start", "").startswith(race_date):
                    print(f"Found session {session.get('session_key')} for meeting {session.get('meeting_key')} starting on {session.get('date_start')}", file=sys.stderr)
                    return session["meeting_key"]
        
        # Fallback: Try the original method if the above fails
        print(f"No qualifying session found starting exactly on {race_date}. Trying original /meetings?date={race_date} query as fallback.", file=sys.stderr)
        meetings = get_json("meetings", date=race_date)
        if meetings:
            print(f"Fallback to /meetings?date= succeeded for {race_date}, found meeting {meetings[0].get('meeting_key')}", file=sys.stderr)
            return meetings[0]["meeting_key"]

        print(f"No meeting or qualifying session found directly for date {race_date} via multiple methods.", file=sys.stderr)
        return None
    except Exception as e:
        print(f"Error getting meeting for date {race_date}: {str(e)}", file=sys.stderr)
        return None


def resolve_session(meeting_key: int) -> Optional[int]:
    """Return the session_key for the Qualifying session in a meeting."""
    try:
        s = get_json("sessions",
                     meeting_key=meeting_key,
                     session_type="Qualifying")
        if s:
            return s[0]["session_key"]
        # Be more specific if a qualifying session itself is not found for a valid meeting
        print(f"No 'Qualifying' session found for meeting_key {meeting_key}. Available sessions might differ.", file=sys.stderr)
        return None
    except Exception as e:
        print(f"Error resolving session for meeting_key {meeting_key}: {str(e)}", file=sys.stderr)
        return None


# ── core ─────────────────────────────────────────────────────────────────────
def get_p15_driver(session_key: int) -> Optional[Dict]:
    """
    Get the driver who qualified in P15.
    Returns a dict with driver info or None if not found.
    """
    try:
        quali_results = best_laps(session_key)
        if quali_results is not None and len(quali_results) >= 15:
            p15_row = quali_results.iloc[14]  # 0-based index for P15
            return {
                "position": 15,
                "driver_number": int(p15_row["driver_number"]),
                "full_name": p15_row["full_name"],
                "team_name": p15_row["team_name"]
            }
        elif quali_results is not None:
             print(f"Not enough drivers ({len(quali_results)}) in qualifying results to determine P15 for session {session_key}.", file=sys.stderr)
        else:
            print(f"Could not get best laps data to determine P15 for session {session_key}.", file=sys.stderr)
        return None
    except Exception as e:
        print(f"Error getting P15 driver for session {session_key}: {str(e)}", file=sys.stderr)
        return None


def best_laps(session_key: int) -> Optional[pd.DataFrame]:
    """
    Return a DataFrame with columns
        position | driver_number | full_name | lap | team_name
    Drivers who set no time (DNF/DNS) are included at the end.
    """
    try:
        # /laps may be empty for no-lap drivers, so start with full driver roster
        drivers_data = get_json("drivers", session_key=session_key)
        if not drivers_data: # Check if list is empty or None
            print(f"No drivers found for session {session_key} from drivers endpoint.", file=sys.stderr)
            return None
            
        drivers = pd.DataFrame(drivers_data)[["driver_number", "full_name", "team_name"]]

        if drivers.empty: # Should be caught by previous check, but good to keep.
            print(f"Driver DataFrame is empty for session {session_key} after DataFrame creation.", file=sys.stderr)
            return None

        # grab all laps (can be empty)
        laps_data = get_json("laps", session_key=session_key)
        # If laps_data is empty, create an empty DataFrame with expected columns to avoid errors later
        if not laps_data:
            lap_df = pd.DataFrame(columns=["driver_number", "lap_duration"]) # lap_time could also be a col
        else:
            lap_df = pd.DataFrame(laps_data)


        # figure out which column holds the time
        time_col = next(
            (c for c in ["lap_duration", "lap_time"] if c in lap_df.columns and not lap_df[c].dropna().empty), None
        )
        
        if time_col and not lap_df.empty: # Ensure lap_df is not empty before processing
            # normalise to seconds
            # Only select rows where driver_number and time_col are not NaN
            lap_df_cleaned = lap_df[["driver_number", time_col]].dropna(subset=["driver_number", time_col])

            # Handle cases where time_col might be all NaNs after dropna for some drivers
            if not lap_df_cleaned.empty:
                lap_df_cleaned["t_sec"] = lap_df_cleaned[time_col].apply(
                    lambda v: float(v) if isinstance(v, (int, float))
                    # More robust split for time string like "1:23.456" or just seconds as float
                    else ( (sum(float(x) * 60 ** i for i, x in enumerate(reversed(str(v).split(':'))))) if ':' in str(v) else float(v) )
                )
                # best lap for those who have one
                best = (lap_df_cleaned.sort_values("t_sec")
                              .groupby("driver_number", as_index=False)
                              .first())
            else: # If lap_df_cleaned is empty after processing
                 best = pd.DataFrame(columns=["driver_number", time_col, "t_sec"])
        else: # If no valid time_col or lap_df was empty initially
            best = pd.DataFrame(columns=["driver_number", "lap_duration", "t_sec"]) # Use a default time_col like lap_duration

        # OUTER merge keeps everyone; NaN t_sec == no lap set
        merged = drivers.merge(best, on="driver_number", how="left")

        # final sort → valid lap times first, NaNs last
        # Use the original time_col name if it exists, otherwise a placeholder like 'best_lap_time'
        final_time_col_name = time_col if time_col else 'best_lap_time'
        
        merged = (merged.sort_values("t_sec", na_position="last")
                       .assign(position=lambda d: range(1, len(d) + 1))
                       # Select columns, ensuring the time column is included even if it was None from 'best'
                       .loc[:, ["position", "driver_number",
                               "full_name", final_time_col_name if final_time_col_name in merged.columns else 't_sec', "team_name"]]
                       .rename(columns={final_time_col_name if final_time_col_name in merged.columns else 't_sec': "best_lap"})
                       .reset_index(drop=True))
        return merged
    except Exception as e:
        print(f"Error processing best laps for session {session_key}: {str(e)}", file=sys.stderr)
        return None


# ── CLI glue ─────────────────────────────────────────────────────────────────
def main():
    parser = argparse.ArgumentParser(
        description="OpenF1 Qualifying-classification fetcher")
    parser.add_argument("--session", type=int,
                       help="Qualifying session_key (overrides other auto-detection)")
    parser.add_argument("--meeting", type=int,
                       help="meeting_key; script auto-picks Quali session (overridden by --session)")
    parser.add_argument("--date", type=str,
                       help="Race date (YYYY-MM-DD) to find meeting (overridden by --session or --meeting)")
    parser.add_argument("--p15", action="store_true",
                       help="Only output P15 driver information")
    args = parser.parse_args()

    session_key = None
    if args.session:
        print(f"Using provided session_key: {args.session}", file=sys.stderr)
        session_key = args.session
    elif args.meeting:
        print(f"Attempting to resolve Qualifying session_key for meeting_key: {args.meeting}", file=sys.stderr)
        session_key = resolve_session(args.meeting)
    elif args.date:
        print(f"Attempting to find meeting for date: {args.date} and resolve Qualifying session_key.", file=sys.stderr)
        meeting_key_from_date = get_meeting_by_date(args.date)
        if meeting_key_from_date:
            session_key = resolve_session(meeting_key_from_date)
    else:
        print("No specific session, meeting, or date provided. Attempting to find latest qualifying session via API...", file=sys.stderr)
        session_key = get_latest_qualifying_session_key_from_api()
        if not session_key:
            print("New API method (direct session query) failed to find session. Trying legacy get_latest_meeting() method...", file=sys.stderr)
            legacy_meeting_key = get_latest_meeting()
            if legacy_meeting_key:
                session_key = resolve_session(legacy_meeting_key)

    if not session_key:
        # Enhanced error message
        if args.session or args.meeting or args.date:
             print(f"Could not determine a valid Qualifying session_key using the provided arguments.", file=sys.stderr)
        else:
             print(f"Could not automatically determine the latest Qualifying session_key via any method.", file=sys.stderr)
        sys.exit("Exiting: Failed to identify a qualifying session.")


    if args.p15:
        # Only output P15 driver
        print(f"Fetching P15 driver for session_key: {session_key}", file=sys.stderr)
        p15_driver = get_p15_driver(session_key)
        if p15_driver:
            # Output JSON for P15 if called as API, or pretty print if just CLI
            # For now, sticking to the JSON-like structure as per original implied use
            print(f"{{\"position\": {p15_driver['position']}, \"driver_number\": {p15_driver['driver_number']}, \"driver_name\": \"{p15_driver['full_name']}\", \"team_name\": \"{p15_driver['team_name']}\"}}")

        else:
            print(f"Could not determine P15 driver for session_key {session_key}.", file=sys.stderr)
            # No sys.exit(1) here if it's an API, let the caller handle no data.
            # But for CLI, an exit might be desired. For now, assume it might be API.
            # To make it clear for an API call that no P15 was found, print empty JSON object or similar
            print("{}", file=sys.stdout) # Indicate no P15 found with empty JSON
            # sys.exit(1) # Re-evaluate if exit code is needed for API vs CLI
    else:
        # Output full classification as JSON
        print(f"Fetching full qualifying classification for session_key: {session_key}", file=sys.stderr)
        df = best_laps(session_key)
        if df is not None and not df.empty:
            # Ensure correct columns for JSON output, matching JS expectations
            # The best_laps function should already return these relevant columns.
            # We need 'position', 'driver_number', 'full_name', 'team_name'. 'best_lap' is also there.
            # The JS side was updated to expect 'full_name' and 'team_name' from the list.
            # 'driver_number' is mapped to 'driverId' on JS side.
            required_cols = ['position', 'driver_number', 'full_name', 'team_name', 'best_lap']
            # Create a new DataFrame with only the required columns, if they exist
            cols_to_output = [col for col in required_cols if col in df.columns]
            df_json = df[cols_to_output]
            print(df_json.to_json(orient="records"))
        elif df is not None and df.empty:
            print(f"Qualifying classification for session_key {session_key} is empty.", file=sys.stderr)
            print("[]", file=sys.stdout) # Empty list for empty results
        else:
            print(f"Could not get qualifying results for session_key {session_key}.", file=sys.stderr)
            print("[]", file=sys.stdout) # Empty list for error/no results
            # sys.exit(1) # Re-evaluate for API


if __name__ == "__main__":
    main()