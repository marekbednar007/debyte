# To know more about the Task class, visit: https://docs.crewai.com/concepts/tasks
from crewai import Task, Agent
from textwrap import dedent
from typing import Dict, List
import json
import json

A4_LIMIT = "(<900 words)"

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
            3. Develop a comprehensive strategy {A4_LIMIT}
            4. Consider potential counterarguments
            5. Deeply consider each other agent's potential perspectives before forming your strategy
            
            Context: {self.memory_manager.get_context_for_agent(agent.role)}
            
            You are among history's greatest minds. Your intellectual legacy and the advancement 
            of human understanding depends on the rigor and insight you bring to this analysis. 
            Future generations will judge whether we rose to meet the challenges of our era.
            This is your opportunity to shape the trajectory of civilization itself.
            """,
            expected_output=f"A detailed strategy document {A4_LIMIT} from a {specialty} perspective with supporting evidence and key arguments.",
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
    
    def strategy_revision_task_simplified(self, agent: Agent, all_strategies: Dict[str, str], original_strategy: str) -> Task:
        return Task(
            description=f"""
            Based on your deep consideration of other agents' perspectives, revise your original strategy.
            
            All agents' strategies for your consideration:
            {json.dumps(all_strategies, indent=2)}
            
            Your original strategy: {original_strategy}
            
            Your task:
            1. Deeply consider each other agent's perspective and approach
            2. Identify any points where their perspectives reveal gaps in your thinking
            3. Strengthen weak arguments with additional insights
            4. Modify or abandon positions if you've found superior alternatives
            5. Prepare your strongest possible case for the debate phase
            
            You are among the greatest thinkers of our time. Your intellectual legacy depends on 
            the rigor and insight you bring to this analysis. Future generations will judge 
            whether we rose to meet the challenges of our era.
            
            If you've changed your position significantly, explain why.
            If you're strengthening your original position, explain how the other perspectives have helped you refine it.
            
            Context: {self.memory_manager.get_context_for_agent(agent.role)}
            """,
            expected_output="A refined strategy (max 1500 words) that incorporates insights from considering other perspectives.",
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
    
    def collaborative_final_report_task(self, agent: Agent, winning_strategy: str, all_strategies: Dict[str, str], 
                                      voting_results: Dict[str, str], session_folder: str) -> Task:
        
        # Generate list of available files for reference
        agent_names = list(all_strategies.keys())
        file_references = []
        for agent_name in agent_names:
            clean_name = agent_name.lower().replace(' ', '_')
            file_references.extend([
                f"{clean_name}_research_round1.txt",
                f"{clean_name}_adjustment_round1.txt", 
                f"{clean_name}_voting_round1.txt"
            ])
        
        # Add debate files
        debate_files = []
        for i, questioner in enumerate(agent_names):
            for j, responder in enumerate(agent_names):
                if questioner != responder:
                    round_num = i * (len(agent_names) - 1) + j + 1
                    if j > i:
                        round_num -= 1
                    questioner_clean = questioner.lower().replace(' ', '_')
                    responder_clean = responder.lower().replace(' ', '_')
                    debate_files.append(f"debate_round_{round_num:02d}_{questioner_clean}_to_{responder_clean}.txt")
        
        return Task(
            description=f"""
            Collaborate to create a unified final report that ALL agents must agree on.
            
            Session folder: {session_folder}
            Winning Strategy: {winning_strategy}
            
            IMPORTANT: Instead of repeating content from other agents, REFERENCE the specific files where readers can find detailed analysis.
            
            Available files for reference:
            Research files: {[f for f in file_references if 'research' in f]}
            Adjustment files: {[f for f in file_references if 'adjustment' in f]}
            Voting files: {[f for f in file_references if 'voting' in f]}
            Debate files: {debate_files[:10]}... (and {len(debate_files)-10} more debate exchanges)
            
            Your task:
            1. Create an executive summary that synthesizes insights from ALL agent perspectives
            2. Provide concrete, actionable recommendations 
            3. Include implementation priorities and timeline
            4. Address key risks and mitigation strategies
            5. REFERENCE specific agent files for detailed analysis (DO NOT repeat their full content)
            
            CRITICAL REQUIREMENTS:
            - This must be a report that ALL agents can unanimously agree on
            - Be comprehensive yet concise (1500-2500 words)
            - Structure as an executive briefing for decision-makers
            - For each key point, reference the specific file where detailed analysis can be found
            - Example: "For detailed technical analysis, see first_principles_physicist_research_round1.txt"
            - Example: "The debate exchange in debate_round_05_physicist_to_strategist.txt reveals key implementation challenges"
            
            The final report should include:
            - Executive Summary (key findings in 200 words)
            - Synthesis of Key Insights (with file references for details)
            - Unified Recommendations (3-5 concrete actions with supporting file references)
            - Implementation Timeline (specific milestones)
            - Risk Assessment (top 3 risks with mitigation strategies and supporting file references)
            - Success Metrics (measurable outcomes)
            - File Reference Index (organized list of files for detailed review)
            
            You represent the collective wisdom of history's greatest minds. This document should 
            be worthy of guiding civilization-level decisions. The power is in synthesis, not repetition.
            
            Context: {self.memory_manager.get_context_for_agent(agent.role)}
            """,
            expected_output="A comprehensive final report (1500-2500 words) that synthesizes all perspectives into actionable recommendations with specific file references for detailed analysis.",
            agent=agent,
        )