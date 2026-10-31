"""Document ingestion for scheme and crop-knowledge corpora."""

from pathlib import Path

from pydantic import BaseModel, Field


class IngestedDocument(BaseModel):
    """A normalized document ready for chunking and embedding."""

    source_path: str
    title: str
    text: str
    metadata: dict[str, str] = Field(default_factory=dict)


async def load_documents(source_dir: Path) -> list[IngestedDocument]:
    """Load PDFs/text files and attach source metadata."""

    # TODO: parse PDFs with pypdf, OCR scans, and preserve page numbers.
    _ = source_dir
    raise NotImplementedError("Document loading is not implemented yet.")


async def chunk_documents(
    documents: list[IngestedDocument],
    chunk_size: int = 800,
    chunk_overlap: int = 120,
) -> list[IngestedDocument]:
    """Split documents into overlapping, citation-friendly chunks."""

    # TODO: use LangChain text splitters with Hindi-aware separators.
    _ = (documents, chunk_size, chunk_overlap)
    raise NotImplementedError("Document chunking is not implemented yet.")


async def ingest_documents(source_dir: Path, collection: str) -> int:
    """Load, chunk, embed, and upsert documents into MongoDB Atlas."""

    # TODO: write chunks plus embeddings to the configured Atlas collection.
    _ = (source_dir, collection)
    raise NotImplementedError("Document ingestion is not implemented yet.")
