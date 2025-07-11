from crewai import Agent, Task, Crew
from langchain_openai import ChatOpenAI
from typing import List, Dict, Any
from dataclasses import dataclass
import json
import asyncio
import time
import sys
import os

# Add parent directory to path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from .agents import DebateAgents
from .tasks import DebateTasks
from utils.db_adapter import DatabaseIntegratedHistoryManager

@dataclass
class DebateContext:
    """Shared context for all agents"""
    topic: str
    research_phase_complete: bool = False
    strategies: Dict[str, str] = None
    debate_rounds: List[Dict] = None
    shared_knowledge: List[str] = None
    
    def __post_init__(self):
        if self.strategies is None:
            self.strategies = {}
        if self.debate_rounds is None:
            self.debate_rounds = []
        if self.shared_knowledge is None:
            self.shared_knowledge = []

class SharedMemoryManager:
    """Manages shared memory across all agents"""
    def __init__(self):
        self.global_context = {}
        self.agent_memories = {}
        self.debate_history = []
    
    def update_global_context(self, key: str, value: Any):
        self.global_context[key] = value
    
    def get_global_context(self) -> Dict:
        return self.global_context
    
    def add_to_debate_history(self, speaker: str, message: str, round_num: int):
        self.debate_history.append({
            'speaker': speaker,
            'message': message,
            'round': round_num,
            'timestamp': asyncio.get_event_loop().time()
        })
    
    def get_context_for_agent(self, agent_name: str) -> str:
        """Get formatted context for a specific agent"""
        context = f"Global Context: {json.dumps(self.global_context, indent=2)}\n\n"
        context += f"Recent Debate History:\n"
        for entry in self.debate_history[-10:]:  # Last 10 entries
            context += f"Round {entry['round']} - {entry['speaker']}: {entry['message']}\n"
        return context

class DebateOrchestrator:
    def __init__(self):
        self.memory_manager = SharedMemoryManager()
        self.agent_factory = DebateAgents(self.memory_manager)
        self.task_factory = DebateTasks(self.memory_manager)
        self.history_manager = DatabaseIntegratedHistoryManager()
        self.agents = []
        
        # The 6 specialized agents for the board of long-term thinkers
        self.agent_configs = [
            {
                'name': 'First Principles Physicist',
                'method': 'first_principles_physicist',
                'specialty': 'First Principles Physics'
            },
            {
                'name': 'Systems Futurist',
                'method': 'systems_futurist',
                'specialty': 'Systems Futurism'
            },
            {
                'name': 'Pattern Synthesizer',
                'method': 'pattern_synthesizer',
                'specialty': 'Pattern Synthesis'
            },
            {
                'name': 'Civilizational Architect',
                'method': 'civilizational_architect',
                'specialty': 'Civilizational Architecture'
            },
            {
                'name': 'Entrepreneurial Visionary',
                'method': 'entrepreneurial_visionary',
                'specialty': 'Entrepreneurial Vision'
            },
            {
                'name': 'Meta-Learning Strategist',
                'method': 'meta_learning_strategist',
                'specialty': 'Meta-Learning Strategy'
            }
        ]
    
    async def initialize_agents(self):
        """Create all agents for the debate"""
        # Clear any existing agents to avoid duplicates
        self.agents = []
        
        for config in self.agent_configs:
            agent_method = getattr(self.agent_factory, config['method'])
            agent = agent_method()
            
            self.agents.append({
                'name': config['name'],
                'specialty': config['specialty'],
                'agent': agent
            })
        
        print(f"✅ Initialized {len(self.agents)} board members:")
        for agent in self.agents:
            print(f"  - {agent['name']} ({agent['specialty']})")
    
    async def run_research_phase(self, topic: str):
        """Phase 1: All agents research and create strategies (Rule 1)"""
        print(f"🔬 Phase 1: Research Phase for topic: {topic}")
        print("Each agent will develop a strategy (< 900 words)")
        
        strategies = {}
        
        for agent_data in self.agents:
            print(f"  → {agent_data['name']} researching...")
            start_time = time.time()
            
            task = self.task_factory.research_task(
                agent_data['agent'], 
                topic, 
                agent_data['specialty']
            )
            crew = Crew(
                agents=[agent_data['agent']],
                tasks=[task],
                verbose=True  # Enable verbose output to see progress
            )
            
            print(f"    ⏱️  Starting research for {agent_data['name']}...")
            result = crew.kickoff()
            elapsed = time.time() - start_time
            print(f"    ✅ {agent_data['name']} completed research in {elapsed:.1f}s")
            
            # Handle CrewOutput object properly
            if hasattr(result, 'raw') or hasattr(result, 'content'):
                # Try to extract content from CrewOutput object
                strategy_content = getattr(result, 'raw', str(result))
            else:
                strategy_content = str(result)
            
            # Show a preview of the content
            preview = strategy_content[:200] + "..." if len(strategy_content) > 200 else strategy_content
            print(f"    📄 Strategy preview: {preview}")
            
            strategies[agent_data['name']] = strategy_content
            self.memory_manager.update_global_context(f"strategy_{agent_data['name']}", strategy_content)
            
            # Save to history
            self.history_manager.save_agent_round(
                agent_data['name'], 1, strategy_content, "research"
            )
            print(f"    💾 Saved strategy to database")
        
        # Save phase summary
        self.history_manager.save_phase_summary("research", strategies)
        return strategies
    
    async def run_presentation_phase(self, strategies: Dict[str, str]):
        """Phase 2: Present strategies without interruption (Rule 2)"""
        print("🎤 Phase 2: Strategy Presentation Phase")
        print("Each agent presents their strategy without interruption")
        
        presentations = {}
        for agent_data in self.agents:
            strategy = strategies[agent_data['name']]
            print(f"\n--- {agent_data['name']} presenting ---")
            # Don't print full strategy in CLI - save it to history instead
            print(f"Strategy saved to history files...")
            
            # Log the presentation
            self.memory_manager.add_to_debate_history(
                agent_data['name'], 
                f"PRESENTATION: {strategy}", 
                0
            )
            
            presentations[agent_data['name']] = strategy
            # Save presentation to history
            self.history_manager.save_agent_round(
                agent_data['name'], 1, strategy, "presentation"
            )
        
        # Save phase summary
        self.history_manager.save_phase_summary("presentation", presentations)
        print("✅ All presentations complete")
        return presentations
    
    async def run_embodiment_phase(self, strategies: Dict[str, str]):
        """Phase 3: Agents embody each other's perspectives (Rule 3)"""
        print("🎭 Phase 3: Perspective Embodiment Phase")
        print("Each agent reflects on others' views and presents opposing views as their own")
        
        embodiments = {}
        
        for agent_data in self.agents:
            print(f"  → {agent_data['name']} embodying other perspectives...")
            
            other_strategies = {k: v for k, v in strategies.items() 
                             if k != agent_data['name']}
            
            task = self.task_factory.perspective_embodiment_task(
                agent_data['agent'], 
                other_strategies
            )
            crew = Crew(
                agents=[agent_data['agent']],
                tasks=[task],
                verbose=False  # Reduce verbose output
            )
            
            result = crew.kickoff()
            embodiment_content = str(result)
            embodiments[agent_data['name']] = embodiment_content
            self.memory_manager.update_global_context(f"embodiment_{agent_data['name']}", embodiment_content)
            
            # Save to history
            self.history_manager.save_agent_round(
                agent_data['name'], 1, embodiment_content, "embodiment"
            )
        
        # Save phase summary
        self.history_manager.save_phase_summary("embodiment", embodiments)
        return embodiments
    
    async def run_adjustment_phase(self, strategies: Dict[str, str], embodiments: Dict[str, str]):
        """Phase 4: Adjust argumentation based on new understanding (Rule 4)"""
        print("🔄 Phase 4: Strategy Adjustment Phase")
        print("Each agent adjusts their strategy considering other agents' perspectives")
        
        revised_strategies = {}
        
        for agent_data in self.agents:
            print(f"  → {agent_data['name']} adjusting strategy...")
            
            # Create revision task that considers other strategies directly
            task = self.task_factory.strategy_revision_task_simplified(
                agent_data['agent'],
                strategies,  # Pass all strategies instead of embodiments
                strategies[agent_data['name']]
            )
            crew = Crew(
                agents=[agent_data['agent']],
                tasks=[task],
                verbose=False  # Reduce verbose output
            )
            
            result = crew.kickoff()
            revised_content = str(result)
            revised_strategies[agent_data['name']] = revised_content
            self.memory_manager.update_global_context(f"revised_{agent_data['name']}", revised_content)
            
            # Save to history
            self.history_manager.save_agent_round(
                agent_data['name'], 1, revised_content, "adjustment"
            )
        
        # Save phase summary
        self.history_manager.save_phase_summary("adjustment", revised_strategies)
        return revised_strategies
    
    async def run_debate_phase(self, revised_strategies: Dict[str, str]):
        """Phase 5: Structured debate with questions and responses (Rule 5)"""
        print("⚔️ Phase 5: Debate Phase")
        print("Each agent prepares questions and engages in structured debate")
        
        debate_results = []
        round_num = 1
        
        # Each agent questions each other agent once
        for questioner in self.agents:
            for responder in self.agents:
                if questioner['name'] != responder['name']:
                    print(f"\n--- Round {round_num}: {questioner['name']} → {responder['name']} ---")
                    
                    # Generate question
                    question_task = self.task_factory.debate_question_task(
                        questioner['agent'],
                        responder['name'],
                        round_num
                    )
                    question_crew = Crew(
                        agents=[questioner['agent']],
                        tasks=[question_task],
                        verbose=False  # Reduce verbose output
                    )
                    question = question_crew.kickoff()
                    question_content = str(question)
                    
                    # Generate response
                    response_task = self.task_factory.debate_response_task(
                        responder['agent'],
                        question_content,
                        questioner['name']
                    )
                    response_crew = Crew(
                        agents=[responder['agent']],
                        tasks=[response_task],
                        verbose=False  # Reduce verbose output
                    )
                    response = response_crew.kickoff()
                    response_content = str(response)
                    
                    debate_entry = {
                        'round': round_num,
                        'questioner': questioner['name'],
                        'responder': responder['name'],
                        'question': question_content,
                        'response': response_content
                    }
                    
                    debate_results.append(debate_entry)
                    
                    # Save debate exchange to history
                    self.history_manager.save_debate_exchange(
                        round_num, questioner['name'], responder['name'],
                        question_content, response_content
                    )
                    
                    # Don't print full debate content to CLI - just confirmation
                    print(f"  ✅ Exchange saved to history files")
                    
                    round_num += 1
        
        # Save phase summary
        self.history_manager.save_phase_summary("debate", {
            "total_rounds": len(debate_results),
            "debate_summary": "Full debate details saved in individual exchange files"
        })
        return debate_results
    
    async def run_voting_phase(self, debate_results: List[Dict]):
        """Phase 6: Voting and consensus building (Rule 6 & 7)"""
        print("🗳️ Phase 6: Voting Phase")
        print("Each agent votes for the best approach")
        
        votes = {}
        final_positions = {}
        
        for agent_data in self.agents:
            print(f"  → {agent_data['name']} casting vote...")
            
            # Create voting task
            task = self.task_factory.voting_task(
                agent_data['agent'],
                debate_results,
                [a['name'] for a in self.agents]
            )
            crew = Crew(
                agents=[agent_data['agent']],
                tasks=[task],
                verbose=False  # Reduce verbose output
            )
            
            result = crew.kickoff()
            vote_content = str(result)
            votes[agent_data['name']] = vote_content
            final_positions[agent_data['name']] = vote_content
            
            # Save vote to history
            self.history_manager.save_agent_round(
                agent_data['name'], 1, vote_content, "voting"
            )
        
        # Analyze votes for consensus
        consensus_result = self._analyze_consensus(votes)
        
        voting_results = {
            'votes': votes,
            'final_positions': final_positions,
            'consensus': consensus_result
        }
        
        # Save phase summary
        self.history_manager.save_phase_summary("voting", voting_results)
        
        return voting_results
    
    async def run_collaborative_report_phase(self, final_strategies: Dict[str, str], voting_results: Dict):
        """Phase 7: Generate collaborative final report that all agents agree on"""
        print("📝 Phase 7: Collaborative Final Report Generation")
        print("All agents collaborate to create a unified final report")
        
        # Use the first agent as the lead writer (all agents will agree on the final report)
        lead_agent = self.agents[0]
        
        # Determine winning strategy for context
        winning_strategy = "Systems approach with integrated perspectives"
        if voting_results and 'consensus' in voting_results and voting_results['consensus']['winning_agent']:
            winning_strategy = f"{voting_results['consensus']['winning_agent']}'s approach"
        
        print(f"  → {lead_agent['name']} drafting collaborative report...")
        
        # Create collaborative final report task
        task = self.task_factory.collaborative_final_report_task(
            lead_agent['agent'],
            winning_strategy,
            final_strategies,
            voting_results['votes'] if voting_results else {},
            self.history_manager.current_session_folder
        )
        crew = Crew(
            agents=[lead_agent['agent']],
            tasks=[task],
            verbose=False  # Reduce verbose output
        )
        
        result = crew.kickoff()
        collaborative_report = str(result)
        
        # Save collaborative report to history
        self.history_manager.save_agent_round(
            "Board Collective", 1, collaborative_report, "final_report"
        )
        
        # Also save as a special final report file
        final_report_path = os.path.join(
            self.history_manager.current_session_folder,
            "FINAL_COLLABORATIVE_REPORT.txt"
        )
        with open(final_report_path, 'w', encoding='utf-8') as f:
            f.write("BOARD OF DIRECTORS - COLLABORATIVE FINAL REPORT\n")
            f.write("=" * 80 + "\n\n")
            f.write(collaborative_report)
        
        return collaborative_report
    
    async def run_collaborative_report_phase(self, final_strategies: Dict[str, str], 
                                           voting_results: Dict[str, Any]) -> str:
        """Phase 7: Generate collaborative final report that all agents agree on"""
        print("📝 Phase 7: Collaborative Final Report Generation")
        print("All agents collaborating to create a unified final report")
        
        # Determine winning strategy
        winning_agent = voting_results['consensus'].get('winning_agent', 'No clear winner')
        winning_strategy = final_strategies.get(winning_agent, "No winning strategy identified")
        
        # Have all agents collaborate on a final report
        print("  → All agents contributing to unified final report...")
        
        # Use the first agent as the primary writer, but include context from all
        primary_agent = self.agents[0]['agent']
        
        task = self.task_factory.collaborative_final_report_task(
            primary_agent,
            winning_strategy,
            final_strategies,
            voting_results['votes'],
            self.history_manager.current_session_folder
        )
        
        crew = Crew(
            agents=[agent_data['agent'] for agent_data in self.agents],  # All agents participate
            tasks=[task],
            verbose=False
        )
        
        result = crew.kickoff()
        final_report = str(result)
        
        # Save the collaborative report
        self.history_manager.save_agent_round(
            "Board Collective", 1, final_report, "final_report"
        )
        
        # Save as special final report file
        if self.history_manager.current_session_folder:
            with open(os.path.join(self.history_manager.current_session_folder, "FINAL_COLLABORATIVE_REPORT.txt"), 'w', encoding='utf-8') as f:
                f.write("BOARD OF DIRECTORS - COLLABORATIVE FINAL REPORT\n")
                f.write("=" * 80 + "\n\n")
                f.write("This report represents the unified wisdom and consensus of all board members.\n")
                f.write("All agents have contributed to and agreed upon these recommendations.\n\n")
                f.write("=" * 80 + "\n\n")
                f.write(final_report)
        
        return final_report
    
    def _analyze_consensus(self, votes: Dict[str, str]) -> Dict:
        """Analyze votes to determine if consensus is reached"""
        # This is a simplified consensus analysis
        # In a real implementation, you'd parse the vote content more carefully
        
        vote_counts = {}
        for voter, vote_content in votes.items():
            # Extract the voted agent from the content (simplified)
            # In practice, you'd need better parsing
            for agent_name in [a['name'] for a in self.agents]:
                if agent_name.lower() in vote_content.lower() and agent_name != voter:
                    vote_counts[agent_name] = vote_counts.get(agent_name, 0) + 1
                    break
        
        if vote_counts:
            winner = max(vote_counts, key=vote_counts.get)
            consensus_reached = vote_counts[winner] >= len(self.agents) * 0.67  # 67% threshold
        else:
            winner = None
            consensus_reached = False
        
        return {
            'consensus_reached': consensus_reached,
            'winning_agent': winner,
            'vote_distribution': vote_counts,
            'total_votes': len(votes)
        }
    
    async def run_full_debate(self, topic: str, max_iterations: int = 3):
        """Run the complete debate process following the 7-step rule"""
        print(f"🎯 Starting Complete Board Debate Session")
        print(f"Topic: {topic}")
        print("=" * 80)
        
        # Initialize history manager and create session folder
        session_folder = self.history_manager.create_session_folder(topic)
        print(f"📁 Session history will be saved to: {session_folder}")
        
        await self.initialize_agents()
        
        # Phase 1: Research (Rule 1)
        strategies = await self.run_research_phase(topic)
        
        # Phase 2: Presentation (Rule 2)
        presentations = await self.run_presentation_phase(strategies)
        
        # Phase 3: Embodiment (Rule 3) - TEMPORARILY DISABLED FOR SPEED
        # embodiments = await self.run_embodiment_phase(strategies)
        embodiments = {}  # Empty for now to maintain compatibility
        
        # Iterative process for Rules 4-7
        iteration = 1
        consensus_reached = False
        final_voting_results = None
        final_revised_strategies = strategies
        
        while iteration <= max_iterations and not consensus_reached:
            print(f"\n🔄 Starting Iteration {iteration}")
            print("=" * 50)
            
            # Phase 4: Adjustment (Rule 4)
            revised_strategies = await self.run_adjustment_phase(strategies, embodiments)
            final_revised_strategies = revised_strategies
            
            # Phase 5: Debate (Rule 5)
            debate_results = await self.run_debate_phase(revised_strategies)
            
            # Phase 6: Voting (Rule 6)
            voting_results = await self.run_voting_phase(debate_results)
            final_voting_results = voting_results
            consensus_reached = voting_results['consensus']['consensus_reached']
            
            if consensus_reached:
                print(f"🎉 CONSENSUS REACHED in iteration {iteration}!")
                print(f"Winning approach: {voting_results['consensus']['winning_agent']}")
                break
            else:
                print(f"❌ No consensus in iteration {iteration}. Continuing...")
                # Update strategies for next iteration
                strategies = revised_strategies
                iteration += 1
        
        if not consensus_reached:
            print(f"⏰ Maximum iterations ({max_iterations}) reached without consensus")
            print("Proceeding with best available result for collaborative report...")
        
        # Phase 7: Collaborative Final Report (Always run this, regardless of consensus)
        print(f"\n📝 Generating Collaborative Final Report")
        print("=" * 50)
        collaborative_report = await self.run_collaborative_report_phase(
            final_revised_strategies, 
            final_voting_results
        )
        
        # Prepare final report with complete data
        final_report = {
            'topic': topic,
            'session_folder': session_folder,
            'final_strategies': final_revised_strategies,
            'collaborative_report': collaborative_report,
            'debate_history': self.memory_manager.debate_history,
            'voting_results': final_voting_results,
            'consensus_reached': consensus_reached,
            'iterations_completed': iteration - 1,
            'global_context': dict(self.memory_manager.global_context),
            'summary': {
                'total_agents': len(self.agents),
                'total_debate_rounds': len(self.memory_manager.debate_history) if hasattr(self.memory_manager, 'debate_history') else 0,
                'session_files': self.history_manager.get_session_summary()
            }
        }
        
        # Save final report to history
        self.history_manager.save_final_report(final_report)
        
        # Print concise summary to CLI (not full text)
        print("\n" + "="*80)
        print("DEBATE SESSION COMPLETE!")
        print("="*80)
        print(f"📁 Full results saved to: {session_folder}")
        print(f"🤖 Agents participated: {len(self.agents)}")
        print(f"🔄 Iterations completed: {iteration - 1}")
        print(f"🎯 Consensus reached: {consensus_reached}")
        
        if consensus_reached and final_voting_results:
            print(f"🏆 Winning approach: {final_voting_results['consensus']['winning_agent']}")
        
        # Show the beginning of the collaborative report
        print(f"\n📋 COLLABORATIVE FINAL REPORT (Preview):")
        print("-" * 50)
        if collaborative_report:
            report_preview = collaborative_report[:500] + "..." if len(collaborative_report) > 500 else collaborative_report
            print(report_preview)
            print(f"\n📖 Full collaborative report saved as: FINAL_COLLABORATIVE_REPORT.txt")
        
        # Show abbreviated individual strategies
        print(f"\n📋 INDIVIDUAL FINAL STRATEGIES (Preview):")
        print("-" * 50)
        for agent_name, strategy in final_revised_strategies.items():
            strategy_preview = str(strategy)[:150] + "..." if len(str(strategy)) > 150 else str(strategy)
            print(f"\n{agent_name}: {strategy_preview}")
        
        # Show voting summary
        if final_voting_results and 'votes' in final_voting_results:
            print(f"\n🗳️ VOTING SUMMARY (Preview):")
            print("-" * 50)
            for agent_name, vote in final_voting_results['votes'].items():
                vote_preview = str(vote)[:100] + "..." if len(str(vote)) > 100 else str(vote)
                print(f"{agent_name}: {vote_preview}")
        
        print(f"\n📖 Complete details in folder: {session_folder}")
        print("🌟 Main deliverable: FINAL_COLLABORATIVE_REPORT.txt")
        
        return final_report

# Usage example
async def main():
    debate_topic = "Should AI development be regulated by government agencies or self-regulated by the industry?"
    
    orchestrator = DebateOrchestrator()
    results = await orchestrator.run_full_debate(debate_topic)
    
    print("\n" + "="*50)
    print("DEBATE COMPLETE!")
    print("="*50)
    print(f"Total debate rounds: {len(results['debate_history'])}")
    print(f"Strategies developed: {len(results['final_strategies'])}")

if __name__ == "__main__":
    asyncio.run(main())
    