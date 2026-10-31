"""Dev heatmap server: field polygon -> NDVI heatmap PNG from Copernicus Data Space.

Run (from the backend folder, venv active):
    python -m uvicorn heatmap_server:app --port 8001 --reload

Needs two environment variables, kept in a local backend/.env file that is
NEVER committed:
    CDSE_CLIENT_ID=sh-...
    CDSE_CLIENT_SECRET=...
Create them in the Copernicus Data Space Sentinel Hub dashboard
(https://shapps.dataspace.copernicus.eu/dashboard/#/ -> Settings -> OAuth clients).
"""
import base64
import math
import os
import time
from datetime import date

import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

load_dotenv()

TOKEN_URL = "https://identity.dataspace.copernicus.eu/auth/realms/CDSE/protocol/openid-connect/token"
PROCESS_URL = "https://sh.dataspace.copernicus.eu/api/v1/process"
MAX_HECTARES = 500   # protects your free processing quota
MAX_DAYS = 90        # longest date range accepted
MAX_PIXELS = 1500    # max image width/height

app = FastAPI(title="Kisan Saathi heatmap (dev)")
# Dev only: open CORS so the HTML file can call this. Before deploying,
# restrict allow_origins to your site and require a logged-in user.
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["GET", "POST"], allow_headers=["*"])

EVALSCRIPT = """//VERSION=3
function setup() {
  return {
    input: [{ bands: ["B04", "B08", "SCL", "dataMask"] }],
    output: { bands: 4 },
    mosaicking: "ORBIT"
  };
}
function mix(a, b, f) {
  return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f];
}
function color(v) {
  var red = [215, 48, 39], yellow = [254, 224, 139], green = [26, 152, 80];
  var lo = 0.1, mid = 0.4, hi = 0.75;
  if (v <= lo) return red;
  if (v < mid) return mix(red, yellow, (v - lo) / (mid - lo));
  if (v < hi) return mix(yellow, green, (v - mid) / (hi - mid));
  return green;
}
function evaluatePixel(samples) {
  var vals = [];
  for (var i = 0; i < samples.length; i++) {
    var s = samples[i];
    if (s.dataMask === 0) continue;
    // skip cloud shadow (3), cloud (8, 9), cirrus (10) and snow (11)
    if (s.SCL === 3 || s.SCL === 8 || s.SCL === 9 || s.SCL === 10 || s.SCL === 11) continue;
    var d = s.B08 + s.B04;
    if (d <= 0) continue;
    vals.push((s.B08 - s.B04) / d);
  }
  if (vals.length === 0) return [0, 0, 0, 0];
  vals.sort(function (a, b) { return a - b; });
  var c = color(vals[Math.floor(vals.length / 2)]);
  return [c[0] / 255, c[1] / 255, c[2] / 255, 1];
}
"""

_token = {"value": None, "exp": 0.0}


class HeatmapRequest(BaseModel):
    polygon: dict
    date_from: date
    date_to: date


def ring_stats(ring):
    """Return bbox (south, west, north, east), area in m2, width m, height m."""
    lons = [p[0] for p in ring]
    lats = [p[1] for p in ring]
    west, east, south, north = min(lons), max(lons), min(lats), max(lats)
    mx = 111_320 * math.cos(math.radians((south + north) / 2))
    my = 110_540
    pts = [((x - west) * mx, (y - south) * my) for x, y in ring]
    area = abs(sum(x1 * y2 - x2 * y1 for (x1, y1), (x2, y2) in zip(pts, pts[1:] + pts[:1]))) / 2
    return (south, west, north, east), area, (east - west) * mx, (north - south) * my


async def get_token(client: httpx.AsyncClient) -> str:
    if _token["value"] and time.time() < _token["exp"] - 60:
        return _token["value"]
    client_id = os.getenv("CDSE_CLIENT_ID")
    client_secret = os.getenv("CDSE_CLIENT_SECRET")
    if not client_id or not client_secret:
        raise HTTPException(500, "Server is missing CDSE_CLIENT_ID or CDSE_CLIENT_SECRET in .env")
    r = await client.post(TOKEN_URL, data={
        "grant_type": "client_credentials",
        "client_id": client_id,
        "client_secret": client_secret,
    })
    if r.status_code != 200:
        raise HTTPException(502, "Copernicus login failed. Check the client id and secret.")
    j = r.json()
    _token["value"] = j["access_token"]
    _token["exp"] = time.time() + j.get("expires_in", 300)
    return _token["value"]


@app.get("/health")
def health():
    return {"ok": True}


@app.post("/heatmap")
async def heatmap(req: HeatmapRequest):
    geom = req.polygon
    if geom.get("type") != "Polygon" or not geom.get("coordinates"):
        raise HTTPException(400, "polygon must be a GeoJSON Polygon")
    ring = geom["coordinates"][0]
    if len(ring) < 4 or any(len(p) < 2 or not (-180 <= p[0] <= 180 and -90 <= p[1] <= 90) for p in ring):
        raise HTTPException(400, "polygon needs at least 3 valid [lng, lat] points")
    days = (req.date_to - req.date_from).days
    if days < 0 or days > MAX_DAYS:
        raise HTTPException(400, f"date range must be 0 to {MAX_DAYS} days")

    (south, west, north, east), area_m2, w_m, h_m = ring_stats(ring)
    if area_m2 / 10_000 > MAX_HECTARES:
        raise HTTPException(400, f"field is larger than {MAX_HECTARES} ha")
    width = max(10, min(MAX_PIXELS, math.ceil(w_m / 10)))
    height = max(10, min(MAX_PIXELS, math.ceil(h_m / 10)))

    payload = {
        "input": {
            "bounds": {
                "bbox": [west, south, east, north],
                "geometry": geom,
                "properties": {"crs": "http://www.opengis.net/def/crs/OGC/1.3/CRS84"},
            },
            "data": [{
                "type": "sentinel-2-l2a",
                "dataFilter": {
                    "timeRange": {"from": f"{req.date_from}T00:00:00Z", "to": f"{req.date_to}T23:59:59Z"},
                    "maxCloudCoverage": 80,
                },
            }],
        },
        "output": {"width": width, "height": height,
                   "responses": [{"identifier": "default", "format": {"type": "image/png"}}]},
        "evalscript": EVALSCRIPT,
    }

    async with httpx.AsyncClient(timeout=120) as client:
        token = await get_token(client)
        r = await client.post(PROCESS_URL, json=payload,
                              headers={"Authorization": f"Bearer {token}", "Accept": "image/png"})
    if r.status_code == 401:
        _token["value"] = None
        raise HTTPException(502, "Copernicus rejected the token. Check that the OAuth client was created on the Copernicus Data Space dashboard.")
    if r.status_code != 200:
        raise HTTPException(502, f"Copernicus returned an error ({r.status_code})")

    return {
        "image_base64": base64.b64encode(r.content).decode(),
        "bounds": [[south, west], [north, east]],
        "summary": {"text": f"Sentinel-2 NDVI (median of clear pixels), {req.date_from} to {req.date_to}. "
                            "Empty areas mean clouds or no pass; try a longer date range."},
    }
