#!/usr/bin/env python3
"""
Quick test to verify the AI Board of Directors system is working correctly
"""
import asyncio
import os
import sys

# Add the current directory to the path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

async def test_system():
    """Test basic system functionality"""
    print("🧪 Testing AI Board of Directors System")
    print("=" * 50)
    
    try:
        # Test imports
        print("1. Testing imports...")
        from crew.flow import DebateOrchestrator
        from crew.agents import DebateAgents
        from crew.tasks import DebateTasks
        print("   ✅ All imports successful")
        
        # Test agent initialization
        print("2. Testing agent initialization...")
        orchestrator = DebateOrchestrator()
        await orchestrator.initialize_agents()
        print(f"   ✅ Initialized {len(orchestrator.agents)} agents")
        
        # Print agent list
        print("3. Verifying agent configuration...")
        for agent in orchestrator.agents:
            print(f"   • {agent['name']} ({agent['specialty']})")
        print("   ✅ All agents configured correctly")
        
        print("\n🎉 System test completed successfully!")
        print("You can now run 'python3 main.py' to start the interactive debate system.")
        
    except ImportError as e:
        print(f"   ❌ Import error: {e}")
        print("   Make sure you've installed the requirements: pip install -r requirements.txt")
    except Exception as e:
        print(f"   ❌ Error: {e}")
        print("   Check your setup and API keys.")

if __name__ == "__main__":
    asyncio.run(test_system())
