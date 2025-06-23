from crewai import Agent, Task, Crew
from langchain_openai import ChatOpenAI
from langchain.memory import ConversationBufferWindowMemory
from langchain.schema import BaseMemory
from typing import List, Dict, Any
from dataclasses import dataclass
import json
import asyncio

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

class DebateAgents:
    def __init__(self, memory_manager: SharedMemoryManager):
        self.llm = ChatOpenAI(model_name="gpt-4", temperature=0.7)
        self.memory_manager = memory_manager
    
    def create_researcher_agent(self, specialty: str, agent_id: str) -> Agent:
        return Agent(
            role=f"Expert Researcher - {specialty}",
            backstory=f"""You are a world-class researcher specializing in {specialty}. 
            You have 20+ years of experience and are known for thorough, unbiased analysis.
            You always back your arguments with concrete evidence and data.""",
            goal=f"""Research and develop a comprehensive strategy for the given topic from a {specialty} perspective. 
            Create a compelling one-page strategy that you will defend in debate.""",
            memory=ConversationBufferWindowMemory(k=20),
            allow_delegation=False,
            verbose=True,
            llm=self.llm,
        )
    
    def create_debate_agent(self, specialty: str, agent_id: str) -> Agent:
        return Agent(
            role=f"Strategic Debater - {specialty}",
            backstory=f"""You are an expert debater with deep knowledge in {specialty}. 
            You excel at questioning assumptions, finding logical flaws, and presenting counterarguments.
            You listen carefully to other perspectives and can embody different viewpoints when needed.""",
            goal=f"""Engage in constructive debate, ask probing questions, and defend your position while 
            remaining open to strong counterarguments. Your goal is to find the best solution through rigorous debate.""",
            memory=ConversationBufferWindowMemory(k=30),
            allow_delegation=False,
            verbose=True,
            llm=self.llm,
        )

class DebateTasks:
    def __init__(self, memory_manager: SharedMemoryManager):
        self.memory_manager = memory_manager
    
    def research_task(self, agent: Agent, topic: str, specialty: str) -> Task:
        return Task(
            description=f"""
            Research the topic: "{topic}" from a {specialty} perspective.
            
            Your task:
            1. Conduct thorough research using available tools
            2. Identify key insights, data points, and arguments
            3. Develop a comprehensive one-page strategy
            4. Consider potential counterarguments
            
            Context: {self.memory_manager.get_context_for_agent(agent.role)}
            
            If you do exceptional work, you'll receive a $10,000 bonus!
            """,
            expected_output=f"A detailed one-page strategy document from a {specialty} perspective with supporting evidence and key arguments.",
            agent=agent,
        )
    
    def perspective_embodiment_task(self, agent: Agent, other_strategies: Dict[str, str]) -> Task:
        return Task(
            description=f"""
            Study and embody the perspectives of other agents.
            
            Other agents' strategies:
            {json.dumps(other_strategies, indent=2)}
            
            Your task:
            1. Carefully analyze each other agent's strategy
            2. Identify their key assumptions and reasoning
            3. Practice arguing from their perspective
            4. Prepare thoughtful questions for each position
            
            Context: {self.memory_manager.get_context_for_agent(agent.role)}
            """,
            expected_output="A summary of understanding of each other agent's position and prepared questions for debate.",
            agent=agent,
        )
    
    def debate_question_task(self, questioner: Agent, target_agent: str, round_num: int) -> Task:
        return Task(
            description=f"""
            Ask a probing question to {target_agent} in debate round {round_num}.
            
            Guidelines:
            1. Ask ONE specific, thought-provoking question
            2. Challenge assumptions or seek clarification
            3. Build on previous debate rounds
            4. Stay respectful but be intellectually rigorous
            
            Debate History: {self.memory_manager.get_context_for_agent(questioner.role)}
            """,
            expected_output=f"One specific question directed at {target_agent}",
            agent=questioner,
        )
    
    def debate_response_task(self, responder: Agent, question: str, questioner: str) -> Task:
        return Task(
            description=f"""
            Respond to this question from {questioner}: "{question}"
            
            Guidelines:
            1. Address the question directly and thoroughly
            2. Use evidence to support your response
            3. Acknowledge valid points while defending your position
            4. Be open to modifying your stance if presented with compelling evidence
            
            Context: {self.memory_manager.get_context_for_agent(responder.role)}
            """,
            expected_output="A thoughtful, evidence-based response to the question",
            agent=responder,
        )

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