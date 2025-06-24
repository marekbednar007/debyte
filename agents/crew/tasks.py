# To know more about the Task class, visit: https://docs.crewai.com/concepts/tasks
from crewai import Task, Agent
from textwrap import dedent
from typing import Dict, List
import json
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
            2. Use specific evidence or examples to support your response
            3. Acknowledge any valid points in the question
            4. Clarify your position if there was misunderstanding
            5. Be open to modifying your view if the question reveals flaws
            6. Ask a follow-up question if needed for clarification
            
            Length: 200-400 words maximum
            Tone: Professional, respectful, intellectually honest
            
            If this question has genuinely changed your mind about something,
            say so explicitly and explain why.
            
            Context: {self.memory_manager.get_context_for_agent(responder.role)}
            """,
            expected_output="A direct, thoughtful response to the debate question",
            agent=responder,
        )
    
    def strategy_revision_task(self, agent: Agent, embodiment_insights: str, original_strategy: str) -> Task:
        return Task(
            description=f"""
            Based on your understanding of other perspectives, revise your original strategy.
            
            Your embodiment insights: {embodiment_insights}
            
            Your original strategy: {original_strategy}
            
            Your task:
            1. Review your original strategy critically
            2. Identify any points where other perspectives have valid concerns
            3. Strengthen weak arguments with additional research if needed
            4. Modify or abandon positions if you've found better alternatives
            5. Prepare your strongest possible case for the debate phase
            
            If you've changed your position significantly, explain why.
            If you're sticking with your original position, explain why other perspectives haven't swayed you.
            
            Context: {self.memory_manager.get_context_for_agent(agent.role)}
            """,
            expected_output="A refined strategy (max 1500 words) that incorporates lessons learned from other perspectives.",
            agent=agent,
        )
    
    def voting_task(self, agent: Agent, debate_results: List[Dict], all_agent_names: List[str]) -> Task:
        return Task(
            description=f"""
            After the complete debate, cast your vote for the best overall approach.
            
            Complete debate history: {debate_results}
            
            Available agents to vote for: {all_agent_names}
            
            Your task:
            1. Review all strategies and debate exchanges
            2. Identify which approach has the strongest overall case
            3. Consider which agent presented the most compelling evidence
            4. Be willing to vote for another agent if their approach is superior
            5. Explain your reasoning clearly
            
            IMPORTANT: 
            - You can vote for yourself if you genuinely believe your approach is best
            - You can vote for another agent if their arguments convinced you
            - Be intellectually honest - the goal is finding the best solution, not winning
            
            Format your response as:
            "I vote for [AGENT NAME] because [detailed reasoning]"
            
            Context: {self.memory_manager.get_context_for_agent(agent.role)}
            """,
            expected_output="A clear vote with detailed reasoning for why that approach is best.",
            agent=agent,
        )