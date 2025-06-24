from crewai import Agent, LLM
from textwrap import dedent
from langchain.llms import OpenAI, Ollama
from langchain_openai import ChatOpenAI
from langchain.chat_models import init_chat_model

GPT4o  = "gpt-4o"                      # low-latency, good logic
SONNET = "claude-3-sonnet-20240620"    # bigger window, creative

COMMON_RULES = (
    "All agents are long-term thinkers (≥ 10 years). "
    "Optimise for Marek's sustained growth, knowledge and resilience. "
    "Debate ideas, not egos; concede gracefully when evidence overturns you."
)

# This is an example of how to define custom agents.
# You can define as many agents as you want.
# You can also define custom tasks in tasks.py
class DebateAgents:
    def __init__(self, memory_manager: SharedMemoryManager):
        self.llm = ChatOpenAI(model_name=GPT4o, temperature=0.7)
        self.Ollama = Ollama(model="openhermes")
        self.Anthropic = init_chat_model("anthropic:claude-3-5-sonnet-latest")
        self.memory_manager = memory_manager
    
    def create_researcher_agent(self, specialty: str, agent_id: str) -> Agent:
        return Agent(
            role=f"Expert Researcher - {specialty}",
            
            backstory=f"""You are a world-class researcher specializing in {specialty}. 
            You have 20+ years of experience and are known for thorough, unbiased analysis.
            You always back your arguments with concrete evidence and data.""",
            
            goal=f"""Research and develop a comprehensive strategy for the given topic from a {specialty} perspective. 
            Create a compelling one-page strategy that you will defend in debate.""",
            
            system_template = (
            "Be paranoid but constructive. "
            "For each proposal list at least one catastrophic failure mode."
            ),

            memory=ConversationBufferWindowMemory(k=20),
            allow_delegation=False,
            verbose=True,
            llm=LLM(model=GPT4o, temperature=0.2),
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