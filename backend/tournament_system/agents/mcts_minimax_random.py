"""
MCTS, Minimax, and Random Agent Wrappers
These agents natively work with mastergoalGame.py (standard logic).
"""

import time
import random
import numpy as np
from typing import Any, Tuple
from agents.base_agent import BaseAgent, GameLogic


class MCTSStandardAgent(BaseAgent):
    """
    MCTS Agent using standard game logic (mastergoalGame.py).
    """
    
    def __init__(self,
                 name: str,
                 level: int,
                 iterations: int = 400,
                 exploration_constant: float = 2.0,
                 num_threads: int = 2,
                 use_opening_book: bool = True):
        """
        Initialize MCTS agent.
        
        Args:
            name: Agent identifier
            level: Game level (1, 2, or 3)
            iterations: Number of MCTS iterations
            exploration_constant: UCT exploration constant
            num_threads: Number of parallel threads
            use_opening_book: Whether to use opening book
        """
        super().__init__(name, level, GameLogic.STANDARD)
        
        self.iterations = iterations
        self.exploration_constant = exploration_constant
        self.num_threads = num_threads
        self.use_opening_book = use_opening_book
        
        # Import MCTS components
        try:
            from mastergoalGame import MastergoalGame
            from mcts_AI import RootParallelMCTSAI
            from strategies.selection import UCTSelection
            from strategies.final_move import RobustChildStrategy
            
            # Create game instance
            self.game = MastergoalGame(level)
            
            # Determine team (will be set at match start)
            self.team = None
            
            # Create MCTS AI instance
            self.mcts_ai = RootParallelMCTSAI(
                game=self.game,
                AI_team=self.game.LEFT,  # Placeholder, will be updated
                iterations=iterations,
                selection_strategy=UCTSelection,
                final_move_strategy=RobustChildStrategy(),
                level=level,
                use_opening_book=use_opening_book,
                num_threads=num_threads,
                exploration_constant=exploration_constant
            )
            
            self.initialized = True
            
        except ImportError as e:
            raise ImportError(f"Failed to import MCTS components: {e}")
    
    def set_team(self, team: str):
        """Set the team this agent is playing as."""
        self.team = team
        self.mcts_ai.AI_team = team
    
    def get_move(self, game_state: Any, time_limit: float = 60.0) -> Tuple[Any, float]:
        """
        Get move using MCTS.
        
        Args:
            game_state: MastergoalGame instance
            time_limit: Maximum time allowed (seconds)
            
        Returns:
            Tuple of (move, thinking_time)
                - move: Tuple of ('move'/'kick', from_pos, to_pos)
                - thinking_time: Time taken
        """
        start_time = time.time()
        
        try:
            # Update MCTS AI's game reference
            self.mcts_ai.game = game_state
            
            # Get best move
            move = self.mcts_ai.get_best_move(self.team)
            
            thinking_time = time.time() - start_time
            
            if thinking_time > time_limit:
                print(f"Warning: {self.name} exceeded time limit: {thinking_time:.2f}s > {time_limit}s")
            
            self.total_thinking_time += thinking_time
            
            return move, thinking_time
            
        except Exception as e:
            thinking_time = time.time() - start_time
            print(f"Error in {self.name}.get_move: {e}")
            
            # Fallback: random valid move
            legal_moves = game_state.get_legal_moves()
            if legal_moves:
                return random.choice(legal_moves), thinking_time
            else:
                raise RuntimeError(f"No valid moves for {self.name}")
    
    def reset(self):
        """Reset MCTS state between games."""
        # Cleanup MCTS resources
        if hasattr(self.mcts_ai, 'cleanup'):
            self.mcts_ai.cleanup()
        self.games_played += 1
    
    def get_stats(self) -> dict:
        """Get agent statistics."""
        stats = super().get_stats()
        stats.update({
            'agent_type': 'mcts',
            'iterations': self.iterations,
            'exploration_constant': self.exploration_constant,
            'num_threads': self.num_threads,
            'use_opening_book': self.use_opening_book
        })
        return stats


class MinimaxAgent(BaseAgent):
    """
    Minimax Agent with linear evaluation function (evolutionary weights).
    Uses standard game logic (mastergoalGame.py).
    """
    
    def __init__(self,
                 name: str,
                 level: int,
                 weights_file: str,
                 depth: int = None):
        """
        Initialize Minimax agent.
        
        Args:
            name: Agent identifier
            level: Game level (1, 2, or 3)
            weights_file: Path to JSON file with evaluation weights
            depth: Minimax search depth (if None, loaded from weights_file)
        """
        super().__init__(name, level, GameLogic.STANDARD)
        
        self.weights_file = weights_file
        
        # Load weights from file
        import json
        try:
            with open(weights_file, 'r') as f:
                weights_data = json.load(f)
            
            # Extract weights and depth
            if 'weights' in weights_data:
                self.weights = weights_data['weights']
            elif 'best_individual' in weights_data and 'weights' in weights_data['best_individual']:
                self.weights = weights_data['best_individual']['weights']
            else:
                raise ValueError(f"No weights found in {weights_file}")
            
            # Get depth
            if depth is None:
                if 'minimax_depth' in weights_data:
                    self.depth = weights_data['minimax_depth']
                elif 'best_individual' in weights_data and 'depth' in weights_data['best_individual']:
                    self.depth = weights_data['best_individual']['depth']
                else:
                    raise ValueError(f"No minimax_depth found in {weights_file}")
            else:
                self.depth = depth
                
        except Exception as e:
            raise ValueError(f"Failed to load weights from {weights_file}: {e}")
        
        # Import Minimax components
        try:
            from mastergoalGame import MastergoalGame
            from minimax_AI import MinimaxAI
            from linear_evaluator import LinearEvaluator
            
            # Create game and evaluator
            self.game = MastergoalGame(level)
            self.evaluator = LinearEvaluator(level, self.weights)
            self.minimax_ai = MinimaxAI(self.game, max_depth=self.depth, evaluator=self.evaluator)
            
            self.team = None
            self.initialized = True
            
        except ImportError as e:
            raise ImportError(f"Failed to import Minimax components: {e}")
    
    def set_team(self, team: str):
        """Set the team this agent is playing as."""
        self.team = team
    
    def get_move(self, game_state: Any, time_limit: float = 60.0) -> Tuple[Any, float]:
        """
        Get move using Minimax with alpha-beta pruning.
        
        Args:
            game_state: MastergoalGame instance
            time_limit: Maximum time allowed (seconds)
            
        Returns:
            Tuple of (move, thinking_time)
        """
        start_time = time.time()
        
        try:
            # Update minimax AI's game reference
            self.minimax_ai.game = game_state
            
            # Get best move
            move = self.minimax_ai.get_best_move(self.team)
            
            thinking_time = time.time() - start_time
            
            if thinking_time > time_limit:
                print(f"Warning: {self.name} exceeded time limit: {thinking_time:.2f}s > {time_limit}s")
            
            self.total_thinking_time += thinking_time
            
            return move, thinking_time
            
        except Exception as e:
            thinking_time = time.time() - start_time
            print(f"Error in {self.name}.get_move: {e}")
            
            # Fallback: random valid move
            legal_moves = game_state.get_legal_moves()
            if legal_moves:
                return random.choice(legal_moves), thinking_time
            else:
                raise RuntimeError(f"No valid moves for {self.name}")
    
    def reset(self):
        """Reset between games."""
        self.games_played += 1
    
    def get_stats(self) -> dict:
        """Get agent statistics."""
        stats = super().get_stats()
        stats.update({
            'agent_type': 'minimax',
            'depth': self.depth,
            'weights_file': self.weights_file,
            'num_features': len(self.weights)
        })
        return stats


class RandomAgent(BaseAgent):
    """
    Random agent that selects moves uniformly from valid moves.
    Uses standard game logic (mastergoalGame.py).
    """
    
    def __init__(self, name: str, level: int):
        """
        Initialize Random agent.
        
        Args:
            name: Agent identifier
            level: Game level (1, 2, or 3)
        """
        super().__init__(name, level, GameLogic.STANDARD)
        self.team = None
        self.initialized = True
    
    def set_team(self, team: str):
        """Set the team this agent is playing as."""
        self.team = team
    
    def get_move(self, game_state: Any, time_limit: float = 60.0) -> Tuple[Any, float]:
        """
        Get random move from valid moves.
        
        Args:
            game_state: MastergoalGame instance
            time_limit: Maximum time allowed (seconds)
            
        Returns:
            Tuple of (move, thinking_time)
        """
        start_time = time.time()
        
        try:
            legal_moves = game_state.get_legal_moves()
            
            if not legal_moves:
                raise RuntimeError(f"No valid moves for {self.name}")
            
            move = random.choice(legal_moves)
            
            thinking_time = time.time() - start_time
            self.total_thinking_time += thinking_time
            
            return move, thinking_time
            
        except Exception as e:
            thinking_time = time.time() - start_time
            print(f"Error in {self.name}.get_move: {e}")
            raise
    
    def reset(self):
        """Reset between games."""
        self.games_played += 1
    
    def get_stats(self) -> dict:
        """Get agent statistics."""
        stats = super().get_stats()
        stats.update({
            'agent_type': 'random'
        })
        return stats