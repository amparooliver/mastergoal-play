"""
AlphaZero Agent Wrapper
Wraps the trained AlphaZero model with MCTS for tournament play.
"""

import time
import numpy as np
import torch
from typing import Any, Tuple
from agents.base_agent import BaseAgent, GameLogic
import sys
from pathlib import Path
# Add root directory to path to find MCTS.py
root_dir = Path(__file__).parent.parent
if str(root_dir) not in sys.path:
    sys.path.insert(0, str(root_dir))

# Now import MCTS
from MCTS import MCTS


class AlphaZeroAgent(BaseAgent):
    """
    Agent using trained AlphaZero neural network with MCTS.
    Natively works with mastergoalLogic.py (AlphaZero logic).
    """
    
    def __init__(self, 
                 name: str,
                 level: int,
                 checkpoint_path: str,
                 num_mcts_sims: int = 400,
                 cpuct: float = 2.0,
                 temp: float = 0.0):
        """
        Initialize AlphaZero agent.
        
        Args:
            name: Agent identifier
            level: Game level (1, 2, or 3)
            checkpoint_path: Path to the trained model checkpoint
            num_mcts_sims: Number of MCTS simulations per move
            cpuct: Exploration constant for MCTS
            temp: Temperature for action selection (0 = deterministic)
        """
        super().__init__(name, level, GameLogic.ALPHAZERO)
        
        self.checkpoint_path = checkpoint_path
        self.num_mcts_sims = num_mcts_sims
        self.cpuct = cpuct
        self.temp = temp
        
        # Import AlphaZero components
        try:
            # Adjust import paths based on your project structure
            from mastergoal.MastergoalGame import MastergoalGame
            from mastergoal.NNet import NNetWrapper, args as nnet_args
            from MCTS import MCTS
            from utils import dotdict
            
            # Create game instance
            self.game = MastergoalGame()
            
            # Load neural network
            self.nnet = NNetWrapper(self.game)
            
            # Load checkpoint
            checkpoint_dir = checkpoint_path.rsplit('/', 1)[0] if '/' in checkpoint_path else '.'
            checkpoint_file = checkpoint_path.rsplit('/', 1)[-1] if '/' in checkpoint_path else checkpoint_path
            
            self.nnet.load_checkpoint(checkpoint_dir, checkpoint_file)
            
            # Set up MCTS args
            from utils import dotdict
            self.mcts_args = dotdict({
                'numMCTSSims': num_mcts_sims,
                'cpuct': cpuct
            })
            
            # Create MCTS instance
            self.mcts = MCTS(self.game, self.nnet, self.mcts_args)
            
            self.initialized = True
            
        except ImportError as e:
            raise ImportError(f"Failed to import AlphaZero components: {e}")
        except Exception as e:
            raise RuntimeError(f"Failed to initialize AlphaZero agent: {e}")
    
    def get_move(self, game_state: Any, time_limit: float = 60.0) -> Tuple[int, float]:
        """
        Get move using AlphaZero MCTS.
        
        Args:
            game_state: MastergoalBoard instance (from mastergoalLogic.py)
            time_limit: Maximum time allowed (seconds)
            
        Returns:
            Tuple of (action_index, thinking_time)
                - action_index: Integer index of the selected action (0-527)
                - thinking_time: Time taken to compute the move
        """
        start_time = time.time()
        
        try:
            # Get action probabilities from MCTS
            action_probs = self.mcts.getActionProb(game_state, temp=self.temp)
            
            # Select action (argmax for deterministic play)
            if self.temp == 0:
                action = np.argmax(action_probs)
            else:
                action = np.random.choice(len(action_probs), p=action_probs)
            
            thinking_time = time.time() - start_time
            
            # Check time limit
            if thinking_time > time_limit:
                print(f"Warning: {self.name} exceeded time limit: {thinking_time:.2f}s > {time_limit}s")
            
            self.total_thinking_time += thinking_time
            
            return int(action), thinking_time
            
        except Exception as e:
            thinking_time = time.time() - start_time
            print(f"Error in {self.name}.get_move: {e}")
            
            # Fallback: return random valid move
            valid_moves = game_state.getValidMoves().flatten()
            valid_indices = np.where(valid_moves == 1)[0]
            
            if len(valid_indices) > 0:
                action = np.random.choice(valid_indices)
                return int(action), thinking_time
            else:
                raise RuntimeError(f"No valid moves available for {self.name}")
    
    def reset(self):
        """Reset MCTS tree between games."""
        # Recreate MCTS instance to clear tree
        self.mcts = MCTS(self.game, self.nnet, self.mcts_args)
        self.games_played += 1
    
    def get_stats(self) -> dict:
        """Get agent statistics including AlphaZero-specific info."""
        stats = super().get_stats()
        stats.update({
            'agent_type': 'alphazero',
            'num_mcts_sims': self.num_mcts_sims,
            'cpuct': self.cpuct,
            'temperature': self.temp,
            'checkpoint': self.checkpoint_path
        })
        return stats