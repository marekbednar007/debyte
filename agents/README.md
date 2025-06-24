# AI Board of Directors - Debate System

A sophisticated AI debate system that simulates a board of long-term thinking advisors to help you make better decisions.

## Overview

This system creates 6 specialized AI agents that debate complex topics to provide you with well-rounded, thoroughly analyzed advice:

### The Board Members

1. **First Principles Physicist** (Newton/Einstein archetype)

   - Core Function: Reducing complex problems to fundamental laws and principles
   - Perspective: "What are the underlying universal principles governing this domain?"
   - Temperature: 0.4 (methodical but allows for creative leaps)

2. **Systems Futurist** (von Neumann/Tesla archetype)

   - Core Function: Anticipating technological convergence and systemic transformations
   - Perspective: "How will multiple exponential trends intersect 10-30 years from now?"
   - Temperature: 0.6 (needs creativity for non-linear projections)

3. **Pattern Synthesizer** (Shannon/Fibonacci archetype)

   - Core Function: Discovering hidden mathematical relationships and information patterns
   - Perspective: "What elegant patterns and relationships are we missing?"
   - Temperature: 0.5 (balanced between rigor and pattern discovery)

4. **Civilizational Architect**

   - Core Function: Understanding how knowledge and institutions compound over centuries
   - Perspective: "How does this contribute to humanity's long-term knowledge and capability development?"
   - Temperature: 0.3 (conservative, focused on robust long-term structures)

5. **Entrepreneurial Visionary** (Musk/Jobs archetype)

   - Core Function: Identifying breakthrough opportunities that reshape industries
   - Perspective: "What seemingly impossible thing could become inevitable with the right approach?"
   - Temperature: 0.7 (high creativity for breakthrough thinking)

6. **Meta-Learning Strategist**
   - Core Function: Optimizing learning systems and mental model development
   - Perspective: "What knowledge and skills will compound most powerfully over decades?"
   - Temperature: 0.4 (systematic but adaptive)

## The 7-Step Debate Process

1. **Research Phase**: Each agent conducts thorough research and develops a comprehensive strategy (up to 2100 words)
2. **Presentation Phase**: All agents present their strategies without interruption
3. **Embodiment Phase**: Each agent studies and embodies other agents' perspectives to truly understand them
4. **Adjustment Phase**: Agents adjust their argumentation based on new understanding
5. **Debate Phase**: Structured debate with questions and responses between all agents
6. **Voting Phase**: If convinced by another's argument, agents vote for the best approach
7. **Iteration**: Repeat steps 4-6 until consensus is reached or maximum iterations completed

## Installation

1. **Install Python dependencies:**

   ```bash
   cd agents
   pip install -r requirements.txt
   ```

2. **Set up environment variables:**

   ```bash
   cp .env.example .env
   # Edit .env and add your OpenAI API key
   ```

3. **Required API Keys:**
   - OpenAI API key (required for GPT-4)
   - Anthropic API key (optional, for future Claude integration)

## Usage

### Interactive CLI Mode

Run the interactive command-line interface:

```bash
cd agents
python3 main.py
```

The CLI will guide you through:

- Selecting a debate topic
- Configuring debate settings
- Running the full debate process
- Viewing detailed results

### Example Topics

- "Should I leave my corporate job to start my own company?"
- "What's the best investment strategy for the next 20 years?"
- "How should I structure my learning to maximize long-term growth?"
- "What career path will be most valuable in an AI-driven future?"
- "Should I focus on depth or breadth in my skill development?"

### Programmatic Usage

```python
from crew.flow import DebateOrchestrator

async def run_debate():
    orchestrator = DebateOrchestrator()
    results = await orchestrator.run_full_debate(
        topic="Your question here",
        max_iterations=3
    )
    return results
```

## Project Structure

```
agents/
├── main.py                 # Entry point
├── requirements.txt        # Python dependencies
├── .env.example           # Environment variables template
├── crew/
│   ├── agents.py          # Agent definitions
│   ├── tasks.py           # Task definitions
│   └── flow.py            # Orchestration logic
└── utils/
    └── cli.py             # Command-line interface
```

## Features

- **Diverse Cognitive Styles**: 6 agents with complementary thinking patterns and temperature settings
- **Structured Multi-Phase Process**: Ensures thorough analysis and consideration
- **Intellectual Humility**: Agents can change their minds and vote for others' approaches
- **Memory Persistence**: Shared context maintained across all debate phases
- **Consensus Mechanism**: Democratic voting with synthesis of best ideas
- **Interactive CLI**: User-friendly command-line interface
- **Detailed Results**: Complete debate history and reasoning trails

## Configuration

### Agent Temperatures

Each agent uses specific temperature settings optimized for their thinking style:

- Civilizational Architect: 0.3 (conservative, robust)
- First Principles Physicist: 0.4 (methodical but creative)
- Meta-Learning Strategist: 0.4 (systematic but adaptive)
- Pattern Synthesizer: 0.5 (balanced)
- Systems Futurist: 0.6 (creative projections)
- Entrepreneurial Visionary: 0.7 (high creativity)

### Debate Settings

- **Max Iterations**: Number of debate cycles (default: 3)
- **Consensus Threshold**: 67% agreement needed for consensus
- **Strategy Length**: Maximum 2100 words per strategy (A4 page equivalent)

## Common Use Cases

1. **Career Decisions**: Major career transitions, skill development planning
2. **Investment Strategy**: Long-term financial planning and investment approaches
3. **Learning Optimization**: Educational paths and skill acquisition strategies
4. **Business Strategy**: Product development, market entry, competitive positioning
5. **Personal Development**: Goal setting, habit formation, life optimization

## Troubleshooting

### Common Issues

1. **Import Errors**: Ensure you're running from the `agents/` directory
2. **API Key Issues**: Check that your OpenAI API key is correctly set in `.env`
3. **Rate Limits**: The system makes multiple API calls; ensure adequate rate limits
4. **Memory Issues**: Large debates may consume significant memory

### Debug Mode

Run with verbose output:

```bash
python3 main.py --verbose
```

## Future Enhancements

- [ ] Web interface for easier interaction
- [ ] Integration with additional LLM providers
- [ ] Persistent debate history and analysis
- [ ] Custom agent personalities and expertise areas
- [ ] Multi-language support
- [ ] Advanced consensus mechanisms

## Contributing

This is a personal development tool focused on improving decision-making through structured AI debate. Feel free to customize the agents and debate process for your specific needs.

## License

Personal use project - customize as needed for your own development.
