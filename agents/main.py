import os
import sys
import asyncio
import argparse
import warnings
from decouple import config

# Suppress deprecation warnings from Google packages
warnings.filterwarnings("ignore", message="pkg_resources is deprecated", category=UserWarning)

# Configure environment variables
try:
    openai_key = config("OPENAI_API_KEY")
    anthropic_key = config("ANTHROPIC_API_KEY", default="")
    
    # Validate API keys
    if not openai_key or openai_key == "your_openai_api_key_here":
        print("❌ OPENAI_API_KEY not set or is placeholder. Please add your actual API key to agents/.env")
        sys.exit(1)
    
    os.environ["OPENAI_API_KEY"] = openai_key
    os.environ["ANTHROPIC_API_KEY"] = anthropic_key
    
    print("✅ API keys loaded successfully")
    
except Exception as e:
    print(f"❌ Failed to load API keys: {e}")
    print("Please ensure you have a proper .env file in the agents/ directory with:")
    print("OPENAI_API_KEY=your_actual_openai_key")
    print("ANTHROPIC_API_KEY=your_actual_anthropic_key")
    sys.exit(1)

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
        print(f"🔄 Max iterations: {args.max_iterations}")
        
        # Set API URL if provided
        if args.api_url:
            os.environ['DEBATE_API_URL'] = args.api_url
            print(f"🌐 API URL set to: {args.api_url}")
        
        # Create orchestrator with database integration
        print("🏗️ Creating debate orchestrator...")
        orchestrator = DebateOrchestrator()
        
        # Override history manager with database integration
        print("🗄️ Setting up database integration...")
        db_manager = DatabaseIntegratedHistoryManager()
        # Set the debate ID from command line
        db_manager.db_adapter.current_debate_id = args.debate_id
        print(f"✅ Database manager configured with debate ID: {args.debate_id}")
        orchestrator.history_manager = db_manager
        
        # Run the debate
        print("🚀 Starting debate execution...")
        try:
            results = await orchestrator.run_full_debate(args.topic, args.max_iterations)
            print(f"✅ Debate completed successfully!")
            print(f"📁 Results saved to: {results.get('session_folder', 'Unknown')}")
            return 0
        except Exception as e:
            print(f"❌ Debate failed: {e}")
            import traceback
            traceback.print_exc()
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
        # Check if stdin is available for interactive mode
        if not sys.stdin.isatty():
            print("🤖 No interactive terminal detected - running in headless mode")
            cli = DebateCLI(headless_mode=True)
        else:
            cli = DebateCLI()
        await cli.run()

if __name__ == "__main__":
    try:
        exit_code = asyncio.run(main())
        exit(exit_code or 0)
    except KeyboardInterrupt:
        print("\n👋 Shutting down...")
        exit(0)
    except Exception as e:
        print(f"❌ Fatal error: {e}")
        exit(1)