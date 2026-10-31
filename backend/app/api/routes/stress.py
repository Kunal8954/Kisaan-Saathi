"""Satellite crop-stress monitoring endpoint."""

from datetime import date
from typing import Annotated

from fastapi import APIRouter, HTTPException, Query, status

router = APIRouter(prefix="/stress", tags=["stress-monitor"])


@router.get("/{farm_id}", status_code=status.HTTP_501_NOT_IMPLEMENTED)
async def get_farm_stress(
    farm_id: str,
    start_date: Annotated[date | None, Query(description="Observation window start.")] = None,
    end_date: Annotated[date | None, Query(description="Observation window end.")] = None,
) -> None:
    """Return NDVI anomaly, NDMI, land-surface temperature, and soil moisture."""

    # TODO: fetch the farm polygon, query Earth Engine, and build a stress map.
    _ = (farm_id, start_date, end_date)
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Satellite stress monitoring is not implemented yet.",
    )
