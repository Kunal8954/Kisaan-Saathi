"""Government scheme advisory request schema."""

from typing import Literal

from pydantic import BaseModel, Field


class SchemeAdviceRequest(BaseModel):
    """A farmer question to answer from the scheme document corpus."""

    question: str = Field(min_length=1, max_length=2_000)
    farmer_id: str | None = None
    state: str | None = None
    crop: str | None = None
    language: Literal["hi", "en"] = "hi"
    experience_mode: Literal["new_farmer", "experienced"] = "new_farmer"
