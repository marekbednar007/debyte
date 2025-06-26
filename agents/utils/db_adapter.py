"""
MongoDB adapter for the debate system
Handles saving debate data from Python to MongoDB
"""
import json
import requests
from typing import Dict, Any, Optional, List
from datetime import datetime
import os
from pathlib import Path

class MongoDBAdapter:
    """Adapter to save debate data to MongoDB via REST API"""
    
    def __init__(self, api_base_url: str = None):
        self.api_base_url = api_base_url or os.getenv('DEBATE_API_URL', 'http://localhost:3001/api')
        self.current_debate_id = None
    
    def create_debate_session(self, topic: str, session_folder: str) -> Optional[str]:
        """Create a new debate session in MongoDB"""
        try:
            payload = {
                'topic': topic,
                'sessionFolder': session_folder,
                'participatingAgents': [
                    'First Principles Physicist',
                    'Systems Futurist', 
                    'Pattern Synthesizer',
                    'Civilizational Architect',
                    'Entrepreneurial Visionary',
                    'Meta-Learning Strategist'
                ]
            }
            
            response = requests.post(f"{self.api_base_url}/debates", json=payload)
            response.raise_for_status()
            
            data = response.json()
            self.current_debate_id = data.get('_id')
            print(f"✅ Created debate session in MongoDB: {self.current_debate_id}")
            return self.current_debate_id
            
        except Exception as e:
            print(f"❌ Failed to create debate session in MongoDB: {e}")
            return None
    
    def save_agent_output(self, agent_name: str, phase: str, round_number: int, 
                         content: str, metadata: Dict = None) -> bool:
        """Save agent output to MongoDB"""
        if not self.current_debate_id:
            print("❌ No active debate session")
            return False
            
        try:
            payload = {
                'debateId': self.current_debate_id,
                'agentName': agent_name,
                'phase': phase,
                'roundNumber': round_number,
                'content': content,
                'metadata': metadata or {}
            }
            
            print(f"🔄 Sending agent output to {self.api_base_url}/agent-outputs")
            print(f"   Agent: {agent_name}, Phase: {phase}, Round: {round_number}")
            print(f"   Content length: {len(content)} characters")
            print(f"   Content preview: {content[:100]}..." if len(content) > 100 else f"   Content: {content}")
            
            response = requests.post(f"{self.api_base_url}/agent-outputs", json=payload, timeout=30)
            
            print(f"   Response status: {response.status_code}")
            if response.status_code != 200:
                print(f"   Response content: {response.text}")
            
            response.raise_for_status()
            
            print(f"✅ Saved {agent_name} {phase} output to MongoDB")
            return True
            
        except Exception as e:
            print(f"❌ Failed to save agent output to MongoDB: {e}")
            print(f"   Response: {getattr(response, 'text', 'No response')}")
            import traceback
            traceback.print_exc()
            return False
    
    def save_debate_exchange(self, round_number: int, questioner: str, responder: str,
                           question: str, response: str) -> bool:
        """Save debate exchange to MongoDB"""
        if not self.current_debate_id:
            print("❌ No active debate session")
            return False
            
        try:
            payload = {
                'debateId': self.current_debate_id,
                'roundNumber': round_number,
                'questioner': questioner,
                'responder': responder,
                'question': question,
                'response': response
            }
            
            response = requests.post(f"{self.api_base_url}/debate-exchanges", json=payload)
            response.raise_for_status()
            
            print(f"✅ Saved debate exchange {questioner}→{responder} to MongoDB")
            return True
            
        except Exception as e:
            print(f"❌ Failed to save debate exchange to MongoDB: {e}")
            return False
    
    def complete_debate_session(self, voting_results: List[Dict], consensus_analysis: Dict,
                               final_report: Dict = None) -> bool:
        """Complete the debate session with final results"""
        if not self.current_debate_id:
            print("❌ No active debate session")
            return False
            
        try:
            payload = {
                'votingResults': voting_results,
                'consensusAnalysis': consensus_analysis,
                'finalReport': final_report
            }
            
            response = requests.put(f"{self.api_base_url}/debates/{self.current_debate_id}/complete", 
                                  json=payload)
            response.raise_for_status()
            
            print(f"✅ Completed debate session in MongoDB: {self.current_debate_id}")
            return True
            
        except Exception as e:
            print(f"❌ Failed to complete debate session in MongoDB: {e}")
            return False
    
    def update_phase(self, phase: str, iteration: int = None) -> bool:
        """Update the current phase of the debate"""
        if not self.current_debate_id:
            return False
            
        try:
            payload = {'currentPhase': phase}
            if iteration is not None:
                payload['currentIteration'] = iteration
                
            response = requests.patch(f"{self.api_base_url}/debates/{self.current_debate_id}", 
                                    json=payload)
            response.raise_for_status()
            return True
            
        except Exception as e:
            print(f"❌ Failed to update debate phase: {e}")
            return False
    
    def get_debate_session(self, debate_id: str = None) -> Optional[Dict]:
        """Get debate session data"""
        debate_id = debate_id or self.current_debate_id
        if not debate_id:
            return None
            
        try:
            response = requests.get(f"{self.api_base_url}/debates/{debate_id}")
            response.raise_for_status()
            return response.json()
            
        except Exception as e:
            print(f"❌ Failed to get debate session: {e}")
            return None

class DatabaseIntegratedHistoryManager:
    """Extended history manager that also saves to MongoDB"""
    
    def __init__(self, base_path: str = None):
        from utils.history_manager import ChatHistoryManager
        self.file_manager = ChatHistoryManager(base_path)
        self.db_adapter = MongoDBAdapter()
        self.current_session_folder = None
    
    @property
    def current_session_folder(self):
        """Get the current session folder from the file manager"""
        return self.file_manager.current_session_folder
    
    @current_session_folder.setter
    def current_session_folder(self, value):
        """Set the current session folder (mainly for initialization)"""
        self._current_session_folder = value
        
    def create_session_folder(self, topic: str) -> str:
        """Create session folder and MongoDB entry (or use existing session)"""
        # Create file system folder
        session_folder = self.file_manager.create_session_folder(topic)
        
        # Only create MongoDB session if we don't already have a debate ID
        if not self.db_adapter.current_debate_id:
            print(f"🆕 No existing debate ID, creating new MongoDB session...")
            debate_id = self.db_adapter.create_debate_session(topic, session_folder)
        else:
            print(f"♻️ Using existing debate ID: {self.db_adapter.current_debate_id}")
            # TODO: Optionally update the session folder in the existing session
        
        return session_folder
    
    def save_agent_round(self, agent_name: str, round_num: int, content: str, phase: str = "debate"):
        """Save to both file system and MongoDB"""
        # Save to file system
        self.file_manager.save_agent_round(agent_name, round_num, content, phase)
        
        # Save to MongoDB
        self.db_adapter.save_agent_output(agent_name, phase, round_num, content)
    
    def save_debate_exchange(self, round_num: int, questioner: str, responder: str, 
                           question: str, response: str):
        """Save debate exchange to both systems"""
        # Save to file system
        self.file_manager.save_debate_exchange(round_num, questioner, responder, question, response)
        
        # Save to MongoDB
        self.db_adapter.save_debate_exchange(round_num, questioner, responder, question, response)
    
    def save_final_report(self, report_data: Dict[str, Any]):
        """Save final report to both systems"""
        # Save to file system
        self.file_manager.save_final_report(report_data)
        
        # Prepare data for MongoDB
        voting_results = []
        if 'voting_results' in report_data and 'votes' in report_data['voting_results']:
            for voter, vote_content in report_data['voting_results']['votes'].items():
                # Parse voted agent from content (simplified - you might want to improve this)
                voted_for = "Unknown"
                for agent in ['First Principles Physicist', 'Systems Futurist', 'Pattern Synthesizer',
                             'Civilizational Architect', 'Entrepreneurial Visionary', 'Meta-Learning Strategist']:
                    if agent.lower() in str(vote_content).lower() and agent != voter:
                        voted_for = agent
                        break
                
                voting_results.append({
                    'voterAgent': voter,
                    'votedForAgent': voted_for,
                    'reasoning': str(vote_content),
                    'timestamp': datetime.utcnow().isoformat()
                })
        
        consensus_analysis = {
            'consensusReached': report_data.get('consensus_reached', False),
            'winningAgent': report_data.get('voting_results', {}).get('consensus', {}).get('winning_agent'),
            'voteDistribution': {},
            'consensusPercentage': 0,
            'totalVotes': len(voting_results)
        }
        
        final_report = None
        if 'final_strategies' in report_data:
            final_report = {
                'content': json.dumps(report_data['final_strategies'], indent=2),
                'collaborativelyApproved': True
            }
        
        # Save to MongoDB
        self.db_adapter.complete_debate_session(voting_results, consensus_analysis, final_report)
    
    def update_phase(self, phase: str, iteration: int = None):
        """Update the current phase"""
        self.db_adapter.update_phase(phase, iteration)
    
    def save_phase_summary(self, phase_name: str, phase_data: Dict[str, Any]):
        """Save phase summary to both file system and database"""
        # Save to file system
        self.file_manager.save_phase_summary(phase_name, phase_data)
        
        # Update phase in database
        self.db_adapter.update_phase(phase_name)
    
    def get_session_summary(self) -> Dict[str, Any]:
        """Get summary from both file system and database"""
        file_summary = self.file_manager.get_session_summary()
        db_summary = self.db_adapter.get_debate_session()
        
        return {
            'file_system': file_summary,
            'database': db_summary
        }
