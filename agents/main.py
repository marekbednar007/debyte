import os
import asyncio
from decouple import config

# Configure environment variables
os.environ["OPENAI_API_KEY"] = config("OPENAI_API_KEY")
os.environ["ANTHROPIC_API_KEY"] = config("ANTHROPIC_API_KEY", default="")

# Import after setting environment variables
from utils.cli import DebateCLI

async def main():
    """Main entry point for the AI Board of Directors system"""
    cli = DebateCLI()
    await cli.run()

if __name__ == "__main__":
    asyncio.run(main())