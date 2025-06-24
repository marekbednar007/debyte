"""
CLI interface for the AI Board of Directors debate system
"""
import asyncio
import sys
import os
from textwrap import dedent
from decouple import config

# Add the parent directory to the path so we can import from crew
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Set up OpenAI API key from environment
os.environ["OPENAI_API_KEY"] = config("OPENAI_API_KEY")

from crew.flow import DebateOrchestrator


class DebateCLI:
    def __init__(self):
        self.orchestrator = DebateOrchestrator()
    
    def display_banner(self):
        print(dedent("""
        ╔═══════════════════════════════════════════════════════════════╗
        ║                    AI BOARD OF DIRECTORS                      ║
        ║                     Debate System v1.0                       ║
        ╚═══════════════════════════════════════════════════════════════╝
        
        Welcome to your personal board of long-term thinking advisors!
        
        Your Board Members:
        • First Principles Physicist - Universal laws & mathematical elegance
        • Systems Futurist - Technological convergence & exponential trends  
        • Pattern Synthesizer - Hidden patterns & mathematical relationships
        • Civilizational Architect - Long-term institutional thinking
        • Entrepreneurial Visionary - Breakthrough opportunities & market timing
        • Meta-Learning Strategist - Learning optimization & skill stacking
        
        """))
    
    def get_user_input(self):
        print("=" * 70)
        print("📝 DEBATE TOPIC SELECTION")
        print("=" * 70)
        
        # Provide some example topics
        examples = [
            "Should I leave my corporate job to start my own company?",
            "What's the best investment strategy for the next 20 years?",
            "How should I structure my learning to maximize long-term growth?",
            "What career path will be most valuable in an AI-driven future?",
            "Should I focus on depth or breadth in my skill development?"
        ]
        
        print("Example topics you could explore:")
        for i, example in enumerate(examples, 1):
            print(f"  {i}. {example}")
        
        print("\nOr enter your own question/decision/topic:")
        print("-" * 50)
        
        topic = input("Enter your debate topic: ").strip()
        
        if not topic:
            print("❌ Please enter a topic to debate!")
            return self.get_user_input()
        
        return topic
    
    def get_debate_settings(self):
        print("\n" + "=" * 70)
        print("⚙️  DEBATE SETTINGS")
        print("=" * 70)
        
        try:
            max_iterations = int(input("Maximum debate iterations (default 3): ") or "3")
        except ValueError:
            max_iterations = 3
        
        return {
            'max_iterations': max_iterations
        }
    
    async def run_debate_session(self, topic: str, settings: dict):
        """Run the actual debate session"""
        print(f"\n🚀 Starting debate session...")
        print(f"Topic: {topic}")
        print(f"Max iterations: {settings['max_iterations']}")
        
        try:
            results = await self.orchestrator.run_full_debate(
                topic=topic,
                max_iterations=settings['max_iterations']
            )
            
            self.display_results(results)
            return results
            
        except Exception as e:
            print(f"❌ Error during debate: {str(e)}")
            print(f"Error type: {type(e)}")
            import traceback
            print(f"Traceback: {traceback.format_exc()}")
            print("Please check your API keys and try again.")
            return None
    
    def display_results(self, results):
        """Display the final debate results"""
        print("\n" + "=" * 80)
        print("🎯 DEBATE RESULTS")
        print("=" * 80)
        
        if results['consensus_reached']:
            print(f"✅ CONSENSUS ACHIEVED!")
            if results['voting_results']:
                winner = results['voting_results']['consensus']['winning_agent']
                print(f"🏆 Winning Approach: {winner}")
                
                vote_dist = results['voting_results']['consensus']['vote_distribution']
                print(f"\n📊 Vote Distribution:")
                for agent, votes in vote_dist.items():
                    print(f"  • {agent}: {votes} votes")
        else:
            print("⏰ No consensus reached within the iteration limit")
            print("The board provided their best analysis but couldn't agree on a single approach")
        
        print(f"\n📈 Debate Statistics:")
        print(f"  • Iterations completed: {results['iterations_completed']}")
        print(f"  • Total debate rounds: {len(results['debate_history'])}")
        print(f"  • Strategies developed: {len(results['final_strategies'])}")
        
        # Ask if user wants to see detailed results
        show_details = input("\nWould you like to see detailed results? (y/n): ").lower() == 'y'
        if show_details:
            self.display_detailed_results(results)
    
    def display_detailed_results(self, results):
        """Display detailed debate results"""
        print("\n" + "=" * 80)
        print("📋 DETAILED RESULTS")
        print("=" * 80)
        
        # Show final strategies
        print("\n🎯 FINAL STRATEGIES:")
        print("-" * 50)
        for agent_name, strategy in results['final_strategies'].items():
            print(f"\n{agent_name}:")
            print(f"{strategy[:300]}..." if len(strategy) > 300 else strategy)
        
        # Show voting details if available
        if results['voting_results']:
            print("\n🗳️  VOTING DETAILS:")
            print("-" * 50)
            for agent_name, vote in results['voting_results']['votes'].items():
                print(f"\n{agent_name}'s vote:")
                print(f"{vote[:200]}..." if len(vote) > 200 else vote)
    
    async def run(self):
        """Main CLI loop"""
        self.display_banner()
        
        while True:
            try:
                # Get user input
                topic = self.get_user_input()
                settings = self.get_debate_settings()
                
                # Run debate
                results = await self.run_debate_session(topic, settings)
                
                if results:
                    print("\n" + "=" * 70)
                    again = input("Would you like to start another debate? (y/n): ").lower()
                    if again != 'y':
                        break
                        
            except KeyboardInterrupt:
                print("\n\n👋 Thanks for using the AI Board of Directors!")
                break
            except Exception as e:
                print(f"❌ Unexpected error: {str(e)}")
                continue
        
        print("\n🎯 Session complete. Thanks for thinking deeply!")


async def main():
    """Entry point for the CLI"""
    cli = DebateCLI()
    await cli.run()


if __name__ == "__main__":
    asyncio.run(main())