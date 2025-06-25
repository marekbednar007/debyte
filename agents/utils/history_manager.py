import os
import json
import datetime
from typing import Dict, Any, List
from pathlib import Path

class ChatHistoryManager:
    """Manages chat history storage for debate sessions"""
    
    def __init__(self, base_path: str = None):
        self.base_path = base_path or "/Users/marekbednar/Desktop/Codesmith/Sideprojects/debyte/agents/chat_history"
        self.current_session_folder = None
        
    def create_session_folder(self, topic: str) -> str:
        """Create a new session folder for the current debate topic"""
        # Clean topic for folder name
        clean_topic = "".join(c for c in topic if c.isalnum() or c in (' ', '-', '_')).rstrip()
        clean_topic = clean_topic.replace(' ', '_')[:50]  # Limit length
        
        # Add timestamp
        timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        folder_name = f"{timestamp}_{clean_topic}"
        
        self.current_session_folder = os.path.join(self.base_path, folder_name)
        os.makedirs(self.current_session_folder, exist_ok=True)
        
        # Create session metadata
        metadata = {
            "topic": topic,
            "timestamp": timestamp,
            "folder_name": folder_name,
            "created_at": datetime.datetime.now().isoformat()
        }
        
        with open(os.path.join(self.current_session_folder, "session_metadata.json"), 'w') as f:
            json.dump(metadata, f, indent=2)
            
        return self.current_session_folder
    
    def save_agent_round(self, agent_name: str, round_num: int, content: str, phase: str = "debate"):
        """Save an agent's output for a specific round"""
        if not self.current_session_folder:
            raise ValueError("No session folder created. Call create_session_folder first.")
        
        filename = f"{agent_name.lower().replace(' ', '_')}_{phase}_round{round_num}.txt"
        filepath = os.path.join(self.current_session_folder, filename)
        
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(f"Agent: {agent_name}\n")
            f.write(f"Phase: {phase}\n")
            f.write(f"Round: {round_num}\n")
            f.write(f"Timestamp: {datetime.datetime.now().isoformat()}\n")
            f.write("-" * 80 + "\n\n")
            f.write(content)
    
    def save_phase_summary(self, phase_name: str, phase_data: Dict[str, Any]):
        """Save summary data for a complete phase"""
        if not self.current_session_folder:
            raise ValueError("No session folder created. Call create_session_folder first.")
        
        filename = f"phase_{phase_name.lower().replace(' ', '_')}_summary.json"
        filepath = os.path.join(self.current_session_folder, filename)
        
        # Ensure all data is JSON serializable
        serializable_data = self._make_json_serializable(phase_data)
        
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(serializable_data, f, indent=2, ensure_ascii=False)
    
    def save_final_report(self, report_data: Dict[str, Any]):
        """Save the final debate report"""
        if not self.current_session_folder:
            raise ValueError("No session folder created. Call create_session_folder first.")
        
        # Save as both JSON and formatted text
        serializable_data = self._make_json_serializable(report_data)
        
        # JSON version
        with open(os.path.join(self.current_session_folder, "final_report.json"), 'w', encoding='utf-8') as f:
            json.dump(serializable_data, f, indent=2, ensure_ascii=False)
        
        # Formatted text version
        with open(os.path.join(self.current_session_folder, "final_report.txt"), 'w', encoding='utf-8') as f:
            f.write("DEBATE SESSION FINAL REPORT\n")
            f.write("=" * 80 + "\n\n")
            f.write(f"Topic: {report_data.get('topic', 'Unknown')}\n")
            f.write(f"Consensus Reached: {report_data.get('consensus_reached', False)}\n")
            f.write(f"Iterations Completed: {report_data.get('iterations_completed', 0)}\n\n")
            
            if 'final_strategies' in report_data:
                f.write("FINAL STRATEGIES:\n")
                f.write("=" * 50 + "\n\n")
                for agent_name, strategy in report_data['final_strategies'].items():
                    f.write(f"{agent_name}:\n")
                    f.write("-" * len(agent_name) + "\n")
                    f.write(str(strategy) + "\n\n")
            
            if 'voting_results' in report_data and report_data['voting_results']:
                f.write("VOTING RESULTS:\n")
                f.write("=" * 50 + "\n\n")
                voting = report_data['voting_results']
                if 'votes' in voting:
                    for agent_name, vote in voting['votes'].items():
                        f.write(f"{agent_name}'s vote:\n")
                        f.write(str(vote) + "\n\n")
    
    def save_debate_exchange(self, round_num: int, questioner: str, responder: str, 
                           question: str, response: str):
        """Save a specific debate exchange"""
        if not self.current_session_folder:
            raise ValueError("No session folder created. Call create_session_folder first.")
        
        filename = f"debate_round_{round_num:02d}_{questioner.lower().replace(' ', '_')}_to_{responder.lower().replace(' ', '_')}.txt"
        filepath = os.path.join(self.current_session_folder, filename)
        
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(f"DEBATE EXCHANGE - Round {round_num}\n")
            f.write("=" * 50 + "\n\n")
            f.write(f"Questioner: {questioner}\n")
            f.write(f"Responder: {responder}\n")
            f.write(f"Timestamp: {datetime.datetime.now().isoformat()}\n\n")
            f.write("QUESTION:\n")
            f.write("-" * 20 + "\n")
            f.write(str(question) + "\n\n")
            f.write("RESPONSE:\n")
            f.write("-" * 20 + "\n")
            f.write(str(response) + "\n")
    
    def _make_json_serializable(self, obj: Any) -> Any:
        """Convert object to JSON serializable format"""
        if isinstance(obj, dict):
            return {k: self._make_json_serializable(v) for k, v in obj.items()}
        elif isinstance(obj, list):
            return [self._make_json_serializable(item) for item in obj]
        elif hasattr(obj, '__dict__'):
            return self._make_json_serializable(obj.__dict__)
        elif hasattr(obj, 'raw'):
            return str(obj.raw)
        elif hasattr(obj, 'content'):
            return str(obj.content)
        else:
            return str(obj)
    
    def get_session_summary(self) -> Dict[str, Any]:
        """Get summary of current session"""
        if not self.current_session_folder:
            return {}
        
        files = os.listdir(self.current_session_folder)
        return {
            "session_folder": self.current_session_folder,
            "total_files": len(files),
            "file_types": {
                "txt_files": len([f for f in files if f.endswith('.txt')]),
                "json_files": len([f for f in files if f.endswith('.json')])
            },
            "files": files
        }
