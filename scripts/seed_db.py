"""Seed MongoDB Atlas with development farmer/farm fixtures.

This script is a stub; it must never seed production databases.
"""

import asyncio


async def seed() -> None:
    """Insert development fixtures for farmers, farms, and places."""

    # TODO: read fixtures from data/samples, upsert repositories, and print a summary.
    raise NotImplementedError("Database seeding is not implemented yet.")


def main() -> None:
    """Run the async seeding entry point."""

    asyncio.run(seed())


if __name__ == "__main__":
    main()
