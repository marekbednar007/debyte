import os
import asyncio
import argparse
from decouple import config

# Configure environment variables
os.environ["OPENAI_API_KEY"] = config("OPENAI_API_KEY")
os.environ["ANTHROPIC_API_KEY"] = config("ANTHROPIC_API_KEY", default="")

# Import after setting environment variables
from utils.cli import DebateCLI
from crew.flow import DebateOrchestrator
from utils.db_adapter import DatabaseIntegratedHistoryManager

async def main():
    """Main entry point for the AI Board of Directors system"""
    parser = argparse.ArgumentParser(description='AI Board of Directors Debate System')
    parser.add_argument('--topic', type=str, help='Debate topic')
    parser.add_argument('--debate-id', type=str, help='Database debate session ID')
    parser.add_argument('--max-iterations', type=int, default=3, help='Maximum debate iterations')
    parser.add_argument('--api-url', type=str, help='Backend API URL')
    parser.add_argument('--watch', action='store_true', help='Watch mode for development')
    
    args = parser.parse_args()
    
    # If specific topic provided, run headless debate
    if args.topic and args.debate_id:
        print(f"🤖 Starting headless debate for: {args.topic}")
        print(f"📊 Database ID: {args.debate_id}")
        
        # Set API URL if provided
        if args.api_url:
            os.environ['DEBATE_API_URL'] = args.api_url
        
        # Create orchestrator with database integration
        orchestrator = DebateOrchestrator()
        
        # Override history manager with database integration
        orchestrator.history_manager = DatabaseIntegratedHistoryManager()
        
        # Run the debate
        try:
            results = await orchestrator.run_full_debate(args.topic, args.max_iterations)
            print(f"✅ Debate completed successfully!")
            print(f"📁 Results saved to: {results.get('session_folder', 'Unknown')}")
            return 0
        except Exception as e:
            print(f"❌ Debate failed: {e}")
            return 1
    
    # If watch mode, just exit (for development)
    elif args.watch:
        print("👀 Watch mode - agents are ready for backend requests")
        # Keep process alive for development
        try:
            while True:
                await asyncio.sleep(60)
        except KeyboardInterrupt:
            print("\n👋 Shutting down agents...")
            return 0
    
    # Otherwise run CLI interface
    else:
        cli = DebateCLI()
        await cli.run()

if __name__ == "__main__":
    exit_code = asyncio.run(main())
    exit(exit_code or 0)