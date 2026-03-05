#!/usr/bin/env python3
import random
import statistics
import time
import requests

BASE = "http://127.0.0.1:3011"
EMAIL = "otto@nassehi.no"
PASSWORD = "OttoKols!2026"


def post(s, path, payload):
    t = time.time()
    r = s.post(BASE + path, json=payload, timeout=30)
    return r, (time.time() - t) * 1000


def get(s, path):
    t = time.time()
    r = s.get(BASE + path, timeout=30)
    return r, (time.time() - t) * 1000


def main():
    s = requests.Session()
    r, _ = post(s, "/api/auth/login", {"email": EMAIL, "password": PASSWORD})
    if r.status_code != 200:
        r, _ = post(s, "/api/auth/register", {"email": EMAIL, "password": PASSWORD})
    if r.status_code != 200:
        raise SystemExit(f"Auth failed: {r.status_code} {r.text}")

    # Partial search check
    rs, _ = get(s, "/api/patients/search?q=OTTO-STRESS")
    if rs.status_code != 200:
        raise SystemExit("Search endpoint failed")

    # Lookup + export sample
    lookups = []
    exports = []
    for _ in range(30):
        code = f"OTTO-STRESS-{random.randint(1,10):02d}"
        r, dt = get(s, f"/api/patients?patientCode={code}")
        lookups.append(dt)
        if r.status_code != 200:
            raise SystemExit(f"Lookup failed for {code}")

    for i in range(1, 6):
        code = f"OTTO-STRESS-{i:02d}"
        r, _ = get(s, f"/api/patients?patientCode={code}")
        if r.status_code != 200:
            continue
        reviews = r.json().get("reviews", [])
        if not reviews:
            continue
        rid = reviews[0]["id"]
        for ep in (f"/api/reviews/{rid}/export/text", f"/api/reviews/{rid}/export/pdf"):
            re, dte = get(s, ep)
            exports.append(dte)
            if re.status_code != 200:
                raise SystemExit(f"Export failed: {ep}")

    print("OK")
    print(f"lookup avg={statistics.mean(lookups):.1f}ms p95={sorted(lookups)[int(0.95*len(lookups))-1]:.1f}ms")
    if exports:
        print(f"export avg={statistics.mean(exports):.1f}ms p95={sorted(exports)[int(0.95*len(exports))-1]:.1f}ms")


if __name__ == "__main__":
    main()
