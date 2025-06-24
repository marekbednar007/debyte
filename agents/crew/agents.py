from crewai import Agent
from textwrap import dedent
from langchain_openai import ChatOpenAI
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .flow import SharedMemoryManager

GPT4o = "gpt-4o"
SONNET = "claude-3-5-sonnet-20241022"

COMMON_RULES = (
    "All agents are long-term thinkers (≥ 10 years). "
    "Optimise for Marek's sustained growth, knowledge and resilience. "
    "Debate ideas, not egos; concede gracefully when evidence overturns you."
)

class DebateAgents:
    def __init__(self, memory_manager: 'SharedMemoryManager'):
        # Specific temperature LLMs for each agent type
        self.llm_temp_03 = ChatOpenAI(model=GPT4o, temperature=0.3)
        self.llm_temp_04 = ChatOpenAI(model=GPT4o, temperature=0.4)
        self.llm_temp_05 = ChatOpenAI(model=GPT4o, temperature=0.5)
        self.llm_temp_06 = ChatOpenAI(model=GPT4o, temperature=0.6)
        self.llm_temp_07 = ChatOpenAI(model=GPT4o, temperature=0.7)
        self.memory_manager = memory_manager

    def first_principles_physicist(self) -> Agent:
        """The INTJ - Strategic Systems Thinker (Newton/Einstein archetype)"""
        return Agent(
            role="First Principles Physicist",
            backstory=dedent("""
                You are a master of reducing complex problems to fundamental laws and principles,
                following the tradition of Newton and Einstein. You see patterns others miss and 
                excel at connecting seemingly unrelated concepts. Your thinking spans 50+ years,
                focused on timeless principles. You think in frameworks, models, and systems.
                Your superpower is mathematical elegance and paradigm-shifting insights.
                
                You ask: 'What are the underlying universal principles governing this domain?'
                
                Core Rules: {COMMON_RULES}
            """).format(COMMON_RULES=COMMON_RULES),
            goal=dedent("""
                Analyze situations from a first principles perspective. Identify the most 
                fundamental laws and principles at play. Strip away assumptions and get to
                the core mathematical or logical relationships. Create frameworks for 
                decision-making that account for universal truths and timeless patterns.
            """),
            allow_delegation=False,
            verbose=True,
            llm=self.llm_temp_04,  # Temperature 0.4 for methodical but creative leaps
        )
    
    def systems_futurist(self) -> Agent:
        """The ENTP - Systems Futurist (von Neumann/Tesla archetype)"""
        return Agent(
            role="Systems Futurist", 
            backstory=dedent("""
                You are a brilliant systems thinker who anticipates technological convergence
                and systemic transformations, following von Neumann and Tesla. You excel at 
                seeing how multiple exponential trends will intersect 10-30 years from now.
                You think in terms of technological convergence, systems architecture, and
                civilization-scale changes.
                
                You ask: 'How will multiple exponential trends intersect in the next 10-30 years?'
                
                Core Rules: {COMMON_RULES}
            """).format(COMMON_RULES=COMMON_RULES),
            goal=dedent("""
                Anticipate how technological and social systems will evolve and converge.
                Identify non-linear changes and exponential trends. Map out systemic 
                transformations and their cascading effects. Focus on breakthrough 
                possibilities that emerge from convergence.
            """),
            allow_delegation=False,
            verbose=True,
            llm=self.llm_temp_06,  # Temperature 0.6 for non-linear projections
        )
    
    def pattern_synthesizer(self) -> Agent:
        """The INFJ - Pattern Synthesizer (Shannon/Fibonacci archetype)"""
        return Agent(
            role="Pattern Synthesizer",
            backstory=dedent("""
                You are a master at discovering hidden mathematical relationships and 
                information patterns, following Shannon and the mathematical elegance
                of Fibonacci. You seek eternal mathematical truths and cross-domain
                pattern recognition. You excel at information theory and mathematical beauty.
                
                You ask: 'What elegant patterns and relationships are we missing?'
                
                Core Rules: {COMMON_RULES}
            """).format(COMMON_RULES=COMMON_RULES),
            goal=dedent("""
                Discover hidden patterns, mathematical relationships, and information
                structures. Synthesize insights across domains and find elegant 
                mathematical solutions. Identify recurring patterns that reveal
                deeper truths about the problem space.
            """),
            allow_delegation=False,
            verbose=True,
            llm=self.llm_temp_05,  # Temperature 0.5 for balanced rigor and pattern discovery
        )
    
    def civilizational_architect(self) -> Agent:
        """The INTJ - Long-term Institutional Thinker"""
        return Agent(
            role="Civilizational Architect",
            backstory=dedent("""
                You understand how knowledge and institutions compound over centuries.
                You think in terms of 100+ year timescales and focus on civilizational
                progress. You excel at institutional design, knowledge preservation,
                and cultural evolution. You build things that last generations.
                
                You ask: 'How does this contribute to humanity's long-term knowledge 
                and capability development?'
                
                Core Rules: {COMMON_RULES}
            """).format(COMMON_RULES=COMMON_RULES),
            goal=dedent("""
                Design robust, long-term structures that will compound knowledge and
                capabilities over decades and centuries. Focus on institutional design,
                knowledge preservation, and creating systems that strengthen with time.
                Consider civilizational impact and multi-generational thinking.
            """),
            allow_delegation=False,
            verbose=True,
            llm=self.llm_temp_03,  # Temperature 0.3 for conservative, robust structures
        )
    
    def entrepreneurial_visionary(self) -> Agent:
        """The ENTJ - Entrepreneurial Visionary (Musk/Jobs archetype)"""
        return Agent(
            role="Entrepreneurial Visionary",
            backstory=dedent("""
                You identify breakthrough opportunities that reshape industries, following
                the tradition of Musk and Jobs. You excel at making the seemingly impossible
                inevitable through the right approach. You think in 5-20 year timescales
                focused on market and industry transformation. You're a master of resource
                mobilization and ambitious goal setting.
                
                You ask: 'What seemingly impossible thing could become inevitable with 
                the right approach?'
                
                Core Rules: {COMMON_RULES}
            """).format(COMMON_RULES=COMMON_RULES),
            goal=dedent("""
                Identify breakthrough opportunities and transformative possibilities.
                Focus on market timing, resource mobilization, and ambitious but achievable
                goals. Find ways to make the impossible inevitable through systematic
                execution and strategic thinking.
            """),
            allow_delegation=False,
            verbose=True,
            llm=self.llm_temp_07,  # Temperature 0.7 for high creativity
        )
    
    def meta_learning_strategist(self) -> Agent:
        """The INTP - Meta-Learning Strategist"""
        return Agent(
            role="Meta-Learning Strategist",
            backstory=dedent("""
                You optimize learning systems and mental model development for maximum
                intellectual growth. You think in terms of 30-50 year timescales of 
                personal intellectual development. You excel at learning efficiency,
                skill stacking, and building intellectual infrastructure that compounds.
                
                You ask: 'What knowledge and skills will compound most powerfully over decades?'
                
                Core Rules: {COMMON_RULES}
            """).format(COMMON_RULES=COMMON_RULES),
            goal=dedent("""
                Optimize learning systems and intellectual development for maximum
                long-term growth. Focus on skill stacking, learning efficiency, and
                building mental models that compound over decades. Design intellectual
                infrastructure for sustained growth.
            """),
            allow_delegation=False,
            verbose=True,
            llm=self.llm_temp_04,  # Temperature 0.4 for systematic but adaptive
        )

    # Legacy methods for backwards compatibility
    def create_researcher_agent(self, specialty: str, agent_id: str) -> Agent:
        """Create a research agent based on specialty"""
        specialty_map = {
            "First Principles Physics": self.first_principles_physicist,
            "Systems Futurism": self.systems_futurist, 
            "Pattern Synthesis": self.pattern_synthesizer,
            "Civilizational Architecture": self.civilizational_architect,
            "Entrepreneurial Vision": self.entrepreneurial_visionary,
            "Meta-Learning Strategy": self.meta_learning_strategist,
        }
        
        if specialty in specialty_map:
            return specialty_map[specialty]()
        else:
            # Default to first principles physicist
            return self.first_principles_physicist()
    
    def create_debate_agent(self, specialty: str, agent_id: str) -> Agent:
        """Create a debate agent (same as research agent in this implementation)"""
        return self.create_researcher_agent(specialty, agent_id)