from crewai import Agent, Task, Crew
from langchain_openai import ChatOpenAI
from langchain.memory import ConversationBufferWindowMemory
from langchain.schema import BaseMemory
from typing import List, Dict, Any
from dataclasses import dataclass
import json
import asyncio

from agents import DebateTasks
from tasks import DebateAgents

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
    def __init__(self, num_agents: int = 6):
        self.num_agents = num_agents
        self.memory_manager = SharedMemoryManager()
        self.agent_factory = DebateAgents(self.memory_manager)
        self.task_factory = DebateTasks(self.memory_manager)
        self.agents = []
        self.specialties = [
            "Economic Analysis", "Social Impact", "Technical Implementation",
            "Environmental Considerations", "Policy & Regulation", "Market Dynamics"
        ][:num_agents]
    
    async def initialize_agents(self):
        """Create all agents for the debate"""
        for i, specialty in enumerate(self.specialties):
            agent_id = f"agent_{i+1}"
            research_agent = self.agent_factory.create_researcher_agent(specialty, agent_id)
            debate_agent = self.agent_factory.create_debate_agent(specialty, agent_id)
            
            self.agents.append({
                'id': agent_id,
                'specialty': specialty,
                'researcher': research_agent,
                'debater': debate_agent
            })
    
    async def run_research_phase(self, topic: str):
        """Phase 1: All agents research and create strategies"""
        print(f"🔬 Starting Research Phase for topic: {topic}")
        
        strategies = {}
        research_crews = []
        
        for agent_data in self.agents:
            task = self.task_factory.research_task(
                agent_data['researcher'], 
                topic, 
                agent_data['specialty']
            )
            crew = Crew(
                agents=[agent_data['researcher']],
                tasks=[task],
                verbose=True
            )
            research_crews.append((crew, agent_data['specialty']))
        
        # Execute research in parallel
        for crew, specialty in research_crews:
            result = crew.kickoff()
            strategies[specialty] = result
            self.memory_manager.update_global_context(f"strategy_{specialty}", result)
        
        return strategies
    
    async def run_embodiment_phase(self, strategies: Dict[str, str]):
        """Phase 2: Agents study each other's strategies"""
        print("🎭 Starting Perspective Embodiment Phase")
        
        for agent_data in self.agents:
            other_strategies = {k: v for k, v in strategies.items() 
                             if k != agent_data['specialty']}
            
            task = self.task_factory.perspective_embodiment_task(
                agent_data['debater'], 
                other_strategies
            )
            crew = Crew(
                agents=[agent_data['debater']],
                tasks=[task],
                verbose=True
            )
            result = crew.kickoff()
            self.memory_manager.update_global_context(
                f"embodiment_{agent_data['specialty']}", result
            )
    
    async def run_debate_phase(self):
        """Phase 3: Structured debate with questions and responses"""
        print("⚔️ Starting Debate Phase")
        
        round_num = 1
        
        # Each agent questions each other agent
        for questioner_data in self.agents:
            for target_data in self.agents:
                if questioner_data['id'] != target_data['id']:
                    print(f"\n--- Round {round_num}: {questioner_data['specialty']} questions {target_data['specialty']} ---")
                    
                    # Generate question
                    question_task = self.task_factory.debate_question_task(
                        questioner_data['debater'],
                        target_data['specialty'],
                        round_num
                    )
                    question_crew = Crew(
                        agents=[questioner_data['debater']],
                        tasks=[question_task],
                        verbose=True
                    )
                    question = question_crew.kickoff()
                    
                    # Log question
                    self.memory_manager.add_to_debate_history(
                        questioner_data['specialty'], 
                        f"QUESTION: {question}", 
                        round_num
                    )
                    
                    # Generate response
                    response_task = self.task_factory.debate_response_task(
                        target_data['debater'],
                        question,
                        questioner_data['specialty']
                    )
                    response_crew = Crew(
                        agents=[target_data['debater']],
                        tasks=[response_task],
                        verbose=True
                    )
                    response = response_crew.kickoff()
                    
                    # Log response
                    self.memory_manager.add_to_debate_history(
                        target_data['specialty'], 
                        f"RESPONSE: {response}", 
                        round_num
                    )
                    
                    round_num += 1
    
    async def run_full_debate(self, topic: str):
        """Run the complete debate process"""
        await self.initialize_agents()
        
        # Phase 1: Research
        strategies = await self.run_research_phase(topic)
        
        # Phase 2: Embodiment
        await self.run_embodiment_phase(strategies)
        
        # Phase 3: Debate
        await self.run_debate_phase()
        
        # Return final results
        return {
            'strategies': strategies,
            'debate_history': self.memory_manager.debate_history,
            'global_context': self.memory_manager.global_context
        }

# Usage example
async def main():
    debate_topic = "Should AI development be regulated by government agencies or self-regulated by the industry?"
    
    orchestrator = DebateOrchestrator(num_agents=6)
    results = await orchestrator.run_full_debate(debate_topic)
    
    print("\n" + "="*50)
    print("DEBATE COMPLETE!")
    print("="*50)
    print(f"Total debate rounds: {len(results['debate_history'])}")
    print(f"Strategies developed: {len(results['strategies'])}")

if __name__ == "__main__":
    asyncio.run(main())