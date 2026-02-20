#!/usr/bin/env python3
"""
Sonya API Client for The Nest
Use this to push study hour updates to Destynee's app
"""

import json
import sys
from datetime import datetime

def add_time_log(category, minutes):
    """Add a time log entry for Destynee's app"""
    update = {
        "type": "timeLog",
        "category": category,  # 'quals', 'dissertation', 'reports'
        "minutes": minutes,
        "timestamp": datetime.now().isoformat(),
        "note": f"Sonya logged {minutes} minutes of {category} study"
    }
    
    print(f"✅ Queued: {minutes} minutes of {category}")
    return update

def update_progress(category, value):
    """Update progress value (e.g., quals page number)"""
    update = {
        "type": "progress",
        "category": category,  # 'quals', 'dissertation', 'reports'
        "value": value,
        "timestamp": datetime.now().isoformat(),
        "note": f"Sonya updated {category} progress to {value}"
    }
    
    print(f"✅ Queued: {category} progress = {value}")
    return update

def main():
    if len(sys.argv) < 2:
        print("Usage:")
        print("  python3 sonya_api.py log <category> <minutes>")
        print("  python3 sonya_api.py progress <category> <value>")
        print("")
        print("Examples:")
        print("  python3 sonya_api.py log quals 150")
        print("  python3 sonya_api.py progress quals 450")
        sys.exit(1)
    
    command = sys.argv[1]
    
    if command == "log" and len(sys.argv) == 4:
        category = sys.argv[2]
        minutes = int(sys.argv[3])
        update = add_time_log(category, minutes)
        print(json.dumps(update, indent=2))
        
    elif command == "progress" and len(sys.argv) == 4:
        category = sys.argv[2]
        value = int(sys.argv[3])
        update = update_progress(category, value)
        print(json.dumps(update, indent=2))
        
    else:
        print("Invalid command or arguments")
        sys.exit(1)

if __name__ == "__main__":
    main()
