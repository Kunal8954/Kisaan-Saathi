"""Meko Data Platform client for knowledge-base uploads and semantic search."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any
from urllib.parse import quote

import httpx

from app.config import get_settings
from app.rag.retriever import RetrievedDocument


class MekoClient:
    """Use Meko as the persistent RAG store."""

    def __init__(self) -> None:
        settings = get_settings()
        if not settings.meko_api_key:
            raise RuntimeError("MEKO_API_KEY is not configured.")
        self._settings = settings
        auth_value = "Bearer " + settings.meko_api_key
        self._headers = {"Authorization": auth_value}

    async def _datapack_id(self) -> str:
        """Use configured datapack or the account's default datapack."""
        if self._settings.meko_datapack_id:
            return self._settings.meko_datapack_id
        try:
            async with httpx.AsyncClient(
                base_url=self._settings.meko_base_url, timeout=30
            ) as client:
                response = await client.get("/datapacks?limit=100", headers=self._headers)
        except httpx.RequestError as exc:
            raise RuntimeError(f"Meko datapack lookup failed: {exc}") from exc
        if response.status_code >= 400:
            raise RuntimeError(
                f"Meko datapack lookup error ({response.status_code}): {response.text}"
            )
        items = response.json().get("data", {}).get("items", [])
        default = next(
            (item for item in items if item.get("datapack_name") == "meko_default_datapack"),
            None,
        )
        if not default or not default.get("datapack_id"):
            raise RuntimeError("No Meko datapack found. Set MEKO_DATAPACK_ID.")
        return str(default["datapack_id"])

    async def upload_file(self, path: Path) -> dict[str, Any]:
        """Upload one source file to the configured Meko knowledge base."""
        if not path.is_file():
            raise FileNotFoundError(f"Knowledge file does not exist: {path}")
        datapack_id = await self._datapack_id()
        endpoint = f"/datapacks/{quote(datapack_id, safe='')}/knowledge-bases/upload"
        try:
            async with httpx.AsyncClient(
                base_url=self._settings.meko_base_url, timeout=60
            ) as client:
                response = await client.post(
                    endpoint,
                    headers=self._headers,
                    files={"file": (path.name, path.read_bytes())},
                )
        except httpx.RequestError as exc:
            raise RuntimeError(f"Meko upload failed: {exc}") from exc
        if response.status_code >= 400:
            raise RuntimeError(f"Meko upload error ({response.status_code}): {response.text}")
        result: dict[str, Any] = response.json()
        return result

    async def search(self, query: str, top_k: int = 5) -> list[RetrievedDocument]:
        """Run Meko's knowledgebase_search MCP tool and normalize citations."""
        if not query.strip():
            raise ValueError("query must not be empty.")
        if top_k < 1:
            raise ValueError("top_k must be greater than zero.")
        datapack_id = await self._datapack_id()
        initialize = {
            "jsonrpc": "2.0",
            "id": 1,
            "method": "initialize",
            "params": {
                "protocolVersion": "2025-03-26",
                "capabilities": {},
                "clientInfo": {"name": "kisan-saathi", "version": "0.1.0"},
            },
        }
        call = {
            "jsonrpc": "2.0",
            "id": 2,
            "method": "tools/call",
            "params": {
                "name": "knowledgebase_search",
                "arguments": {
                    "query": query,
                    "datapack_id": datapack_id,
                    "limit": top_k,
                },
            },
        }
        headers = {
            **self._headers,
            "Content-Type": "application/json",
            "Accept": "application/json, text/event-stream",
        }
        try:
            async with httpx.AsyncClient(timeout=60) as client:
                init_response = await client.post(
                    self._settings.meko_mcp_url, headers=headers, json=initialize
                )
                init_response.raise_for_status()
                session_id = init_response.headers.get("mcp-session-id")
                if session_id:
                    headers["Mcp-Session-Id"] = session_id
                response = await client.post(
                    self._settings.meko_mcp_url, headers=headers, json=call
                )
        except httpx.RequestError as exc:
            raise RuntimeError(f"Meko search failed: {exc}") from exc
        if response.status_code >= 400:
            raise RuntimeError(f"Meko search error ({response.status_code}): {response.text}")
        payload = _parse_mcp_response(response.text)
        if "error" in payload:
            raise RuntimeError(f"Meko search error: {payload['error']}")
        return _normalize_hits(payload, top_k)


def _parse_mcp_response(text: str) -> dict[str, Any]:
    """Parse JSON or server-sent JSON returned by streamable MCP HTTP."""
    for line in reversed(text.splitlines()):
        candidate = line.removeprefix("data:").strip()
        if candidate:
            try:
                value = json.loads(candidate)
            except json.JSONDecodeError:
                continue
            if isinstance(value, dict):
                return value
    try:
        value = json.loads(text)
    except json.JSONDecodeError as exc:
        raise RuntimeError("Meko returned an unreadable MCP response.") from exc
    if not isinstance(value, dict):
        raise RuntimeError("Meko returned an invalid MCP response.")
    return value


def _normalize_hits(payload: dict[str, Any], top_k: int) -> list[RetrievedDocument]:
    """Convert Meko tool content into citation-ready results."""
    result = payload.get("result", payload)
    content = result.get("content", []) if isinstance(result, dict) else []
    candidates: list[Any] = []
    for item in content:
        if isinstance(item, dict) and item.get("type") == "text":
            try:
                decoded = json.loads(item.get("text", ""))
            except json.JSONDecodeError:
                continue
            candidates.extend(
                decoded.get("results", decoded if isinstance(decoded, list) else [])
            )
    if not candidates and isinstance(result, dict):
        candidates = result.get("results", [])
    documents: list[RetrievedDocument] = []
    for index, hit in enumerate(candidates[:top_k]):
        if not isinstance(hit, dict) or not hit.get("text"):
            continue
        identifier = str(hit.get("id") or hit.get("document_id") or f"meko-{index}")
        raw_score = hit.get("score")
        if raw_score is None:
            raw_score = hit.get("similarity", 0.0)
        try:
            score_val = float(raw_score)
        except (TypeError, ValueError):
            score_val = 0.0

        documents.append(
            RetrievedDocument(
                document_id=identifier,
                chunk_id=identifier,
                text=str(hit["text"]),
                source=str(hit.get("source") or hit.get("document_name") or identifier),
                score=score_val,
                metadata=hit,
            )
        )
    return documents


async def ingest_to_meko(source_dir: Path) -> int:
    """Upload supported source files; Meko performs chunking and indexing."""
    if not source_dir.is_dir():
        raise FileNotFoundError(f"Document directory does not exist: {source_dir}")
    client = MekoClient()
    paths = [
        path
        for path in sorted(source_dir.rglob("*"))
        if path.is_file() and path.suffix.lower() in {".txt", ".md", ".pdf", ".json", ".csv"}
    ]
    for path in paths:
        await client.upload_file(path)
    return len(paths)
