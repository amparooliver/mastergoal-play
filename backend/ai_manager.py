"""
AI Manager - Manages AI agents for different difficulties
Save this file as: backend/ai_manager.py
"""

import sys
import os
import time
sys.path.append(os.path.join(os.path.dirname(__file__), 'tournament_system'))

from agents.mcts_minimax_random import MCTSStandardAgent, MinimaxAgent, RandomAgent
from agents.heuristic_agent import HeuristicAgent
from agents.heuristic_agent_level2 import HeuristicAgentLevel2
from agents.heuristic_agent_level2_territorial import HeuristicTerritorialControl


class AIManager:
    """Manages AI agents for the game"""
    
    def __init__(self):
        # Define agent configurations for each level and difficulty
        # Based on your tournament rankings
        self.agent_configs = {
            1: {  # Level 1 configurations
                'easy': {
                    'type': 'random',
                    'name': 'Random_L1'
                },
                'medium': {
                    'type': 'heuristic',
                    'name': 'Heuristic_L1'
                },
                'hard': {
                    'type': 'minimax',
                    'name': 'M1P2',
                    'weights_file': 'weights/M1P2.json'
                }
            },
            2: {  # Level 2 configurations
                'easy': {
                    'type': 'territorial',
                    'name': 'Territorial_High_L2',
                    'pressure': 'high'
                },
                'medium': {
                    'type': 'minimax',
                    'name': 'M2P3',
                    'weights_file': 'weights/M2P3.json'
                },
                'hard': {
                    'type': 'heuristic_advanced',
                    'name': 'HeuristicAdvanced_L2'
                }
            },
            3: {  # Level 3 configurations
                'easy': {
                    'type': 'random',
                    'name': 'Random_L3'
                },
                'medium': {
                    'type': 'heuristic',
                    'name': 'Heuristic_L3'
                },
                'hard': {
                    'type': 'mcts',
                    'name': 'MCTS_L3',
                    'iterations': 100  # Reduced for web performance
                }
            }
        }
    
    def get_agent(self, level, difficulty):
        """
        Get an AI agent for the specified level and difficulty
        
        Args:
            level: Game level (1, 2, or 3)
            difficulty: Difficulty setting ('easy', 'medium', or 'hard')
            
        Returns:
            An initialized agent instance
        """
        if level not in self.agent_configs:
            raise ValueError(f"Invalid level: {level}")
        
        if difficulty not in self.agent_configs[level]:
            raise ValueError(f"Invalid difficulty for level {level}: {difficulty}")
        
        config = self.agent_configs[level][difficulty]
        agent_type = config['type']
        
        try:
            if agent_type == 'random':
                return RandomAgent(name=config['name'], level=level)
            
            elif agent_type == 'heuristic':
                return HeuristicAgent(name=config['name'], level=level)
            
            elif agent_type == 'heuristic_advanced':
                return HeuristicAgentLevel2(
                    name=config['name'],
                    level=level,
                    advanced=True
                )
            
            elif agent_type == 'territorial':
                return HeuristicTerritorialControl(
                    name=config['name'],
                    level=level,
                    pressure_intensity=config['pressure']
                )
            
            elif agent_type == 'minimax':
                # Build the full path to the weights file
                weights_path = os.path.join(
                    os.path.dirname(__file__),
                    'tournament_system',
                    config['weights_file']
                )
                return MinimaxAgent(
                    name=config['name'],
                    level=level,
                    weights_file=weights_path
                )
            
            elif agent_type == 'mcts':
                return MCTSStandardAgent(
                    name=config['name'],
                    level=level,
                    iterations=config.get('iterations', 100),
                    exploration_constant=2.0,
                    num_threads=1,  # Single thread for web to avoid issues
                    use_opening_book=True
                )
            
            else:
                raise ValueError(f"Unknown agent type: {agent_type}")
                
        except Exception as e:
            print(f"Error creating agent {config['name']}: {e}")
            print(f"Falling back to random agent")
            # Fallback to random agent if there's any error
            return RandomAgent(name=f"Fallback_Random_L{level}", level=level)
    
    def get_ai_move(self, agent, game, team):
        """
        Get AI move with timeout protection
        
        Args:
            agent: The AI agent instance
            game: Current game state
            team: Team the AI is playing as ('LEFT' or 'RIGHT')
            
        Returns:
            A move tuple or None if no move available
        """
        try:
            # Set the team for the agent if it supports it
            if hasattr(agent, 'set_team'):
                agent.set_team(team)
            
            # Get move with 5 second timeout for web performance
            move, thinking_time = agent.get_move(game, time_limit=5.0)
            
            print(f"AI {agent.name} took {thinking_time:.2f}s to decide")
            
            return move
            
        except Exception as e:
            print(f"Error getting AI move from {agent.name}: {e}")
            # Return a random legal move as fallback
            import random
            legal_moves = game.get_legal_moves()
            if legal_moves:
                fallback_move = random.choice(legal_moves)
                print(f"Using random fallback move: {fallback_move}")
                return fallback_move
            return None
    
    def get_available_agents(self):
        """
        Get list of all available agents organized by level and difficulty
        
        Returns:
            Dictionary with agent information
        """
        available = {}
        
        for level, difficulties in self.agent_configs.items():
            available[f"level_{level}"] = {}
            for difficulty, config in difficulties.items():
                available[f"level_{level}"][difficulty] = {
                    'name': config['name'],
                    'type': config['type'],
                    'description': self._get_agent_description(config['type'])
                }
        
        return available
    
    def _get_agent_description(self, agent_type):
        """
        Get human-readable description for agent type
        
        Args:
            agent_type: Type of agent
            
        Returns:
            Description string
        """
        descriptions = {
            'random': 'Makes random legal moves - Good for beginners',
            'heuristic': 'Rule-based strategic play - Balanced difficulty',
            'heuristic_advanced': 'Advanced multi-factor heuristic with weighted scoring - Challenging',
            'territorial': 'Territorial control and pressure strategy - Zone domination',
            'minimax': 'Minimax algorithm with evolutionary weights - Strong tactical play',
            'mcts': 'Monte Carlo Tree Search algorithm - Very strong strategic play'
        }
        return descriptions.get(agent_type, 'AI agent')


# Test function to verify AI manager works
if __name__ == "__main__":
    print("Testing AI Manager...")
    manager = AIManager()
    
    # Test getting agents for each level/difficulty
    for level in [1, 2, 3]:
        print(f"\nLevel {level} agents:")
        for difficulty in ['easy', 'medium', 'hard']:
            try:
                agent = manager.get_agent(level, difficulty)
                print(f"  {difficulty}: {agent.name} ({agent.__class__.__name__})")
            except Exception as e:
                print(f"  {difficulty}: Error - {e}")
    
    # Test getting available agents
    print("\nAvailable agents:")
    agents = manager.get_available_agents()
    for level_key, difficulties in agents.items():
        print(f"\n{level_key}:")
        for diff, info in difficulties.items():
            print(f"  {diff}: {info['name']} - {info['description']}")