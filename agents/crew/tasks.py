# To know more about the Task class, visit: https://docs.crewai.com/concepts/tasks
from crewai import Task, Agent
from textwrap import dedent
from typing import Dict
import json

A4_LIMIT = "(<2100 words)"

class DebateTasks:
    def __init__(self, memory_manager):
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