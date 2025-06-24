import os
from crewai import Agent, Task, Crew, Process
from langchain_openai import ChatOpenAI
from decouple import config

from textwrap import dedent
from agents import DebateAgents
from tasks import DebateTasks

# Install duckduckgo-search for this example:
# !pip install -U duckduckgo-search

from langchain.tools import DuckDuckGoSearchRun

search_tool = DuckDuckGoSearchRun()

os.environ["OPENAI_API_KEY"] = config("OPENAI_API_KEY")
os.environ["ANTHROPIC_API_KEY"] = config("ANTHROPIC_API_KEY")

# This is the main class that you will use to define your custom crew.
# You can define as many agents and tasks as you want in agents.py and tasks.py

class CustomCrew:
    def __init__(self, var1, var2):
        self.var1 = var1
        self.var2 = var2

    def run(self):
        # Define your custom agents and tasks in agents.py and tasks.py
        agents = DebateAgents()
        tasks = DebateTasks()

        # Define your custom agents and tasks here
        reseracher_agent = agents.create_researcher_agent()
        debate_agent = agents.create_debate_agent()

        # Custom tasks include agent name and variables as input
        custom_task_1 = tasks.task_1_name(
            reseracher_agent,
            self.var1,
            self.var2,
        )

        custom_task_2 = tasks.task_2_name(
            debate_agent,
        )

        # Define your custom crew here
        crew = Crew(
            agents=[reseracher_agent, debate_agent],
            tasks=[custom_task_1, custom_task_2],
            verbose=True,
        )

        result = crew.kickoff()
        return result


# This is the main function that you will use to run your custom crew.
if __name__ == "__main__":
    print("## Welcome to Crew AI Template")
    print("-------------------------------")
    var1 = input(dedent("""Enter variable 1: """))
    var2 = input(dedent("""Enter variable 2: """))

    custom_crew = CustomCrew(var1, var2)
    result = custom_crew.run()
    print("\n\n########################")
    print("## Here is you custom crew run result:")
    print("########################\n")
    print(result)