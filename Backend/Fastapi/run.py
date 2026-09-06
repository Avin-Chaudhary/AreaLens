import os
import sys
from pathlib import Path

import uvicorn
from dotenv import load_dotenv


BASE_DIR = Path(__file__).resolve().parent

if len(sys.argv) != 2 or sys.argv[1] not in ("dev", "prod"):
    print("Usage: python run.py [dev|prod]")
    sys.exit(1)

mode = sys.argv[1]

if mode == "dev":
    load_dotenv(BASE_DIR / ".env.development", override=True)

    host = "127.0.0.1"
    reload = True

else:
    # Production values come from Render's Environment Variables.
    host = "0.0.0.0"
    reload = False


port = int(os.getenv("PORT", "8000"))

if __name__ == "__main__":
    uvicorn.run(
        "server:app",
        host="127.0.0.1",
        port=8000,
        reload=reload,
    )