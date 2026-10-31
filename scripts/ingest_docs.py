"""Ingest government scheme and crop-knowledge documents into Atlas.

Run from the backend environment so the ``app`` package is importable.
"""

import argparse
import asyncio
from pathlib import Path

from app.rag.ingest import ingest_documents


async def run(source_dir: Path, collection: str) -> int:
    """Ingest a document directory and return the number of chunks written."""

    return await ingest_documents(source_dir=source_dir, collection=collection)


def main() -> None:
    """Parse CLI arguments and start ingestion."""

    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", type=Path, default=Path("data/schemes_pdfs"))
    parser.add_argument("--collection", default="scheme_chunks")
    args = parser.parse_args()
    count = asyncio.run(run(args.source, args.collection))
    print(f"Ingested {count} chunks from {args.source}")


if __name__ == "__main__":
    main()
