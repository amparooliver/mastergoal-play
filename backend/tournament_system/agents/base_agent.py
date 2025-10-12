"""
Base Agent Interface for Tournament System
Provides a unified interface for all agent types regardless of underlying game logic.
"""

from abc import ABC, abstractmethod
from typing import Any, Tuple, Optional
from enum import Enum


class GameLogic(Enum):
    """Enumeration of supported game logic systems"""
    STANDARD = "standard"  # mastergoalGame.py
    ALPHAZERO = "alphazero"  # mastergoalLogic.py


class BaseAgent(ABC):
    """
    Abstract base class for all tournament agents.
    Each agent must implement these methods to participate in the tournament.
    """
    
    def __init__(self, name: str, level: int, logic_type: GameLogic):
        """
        Initialize base agent.
        
        Args:
            name: Unique identifier for the agent
            level: Game level (1, 2, or 3)
            logic_type: Which game logic this agent natively uses
        """
        self.name = name
        self.level = level
        self.logic_type = logic_type
        self.games_played = 0
        self.total_thinking_time = 0.0
        
    @abstractmethod
    def get_move(self, game_state: Any, time_limit: float = 60.0) -> Tuple[Any, float]:
        """
        Get the agent's move for the current game state.
        
        Args:
            game_state: Current game state (type depends on logic_type)
            time_limit: Maximum time allowed for this move in seconds
            
        Returns:
            Tuple of (move, thinking_time):
                - move: The selected move in the format expected by the game logic
                - thinking_time: Actual time taken to compute the move
        """
        pass
    
    @abstractmethod
    def reset(self):
        """
        Reset agent state between games.
        Called before each new game starts.
        """
        pass
    
    def get_stats(self) -> dict:
        """
        Get agent statistics.
        
        Returns:
            Dictionary with agent statistics
        """
        return {
            'name': self.name,
            'level': self.level,
            'logic_type': self.logic_type.value,
            'games_played': self.games_played,
            'total_thinking_time': self.total_thinking_time,
            'avg_thinking_time': self.total_thinking_time / self.games_played if self.games_played > 0 else 0.0
        }
    
    def __str__(self) -> str:
        return f"{self.name} (Level {self.level}, {self.logic_type.value})"
    
    def __repr__(self) -> str:
        return f"<{self.__class__.__name__}: {self.name}>"


class AgentMetadata:
    """
    Metadata container for agent configuration and performance tracking.
    """
    
    def __init__(self, 
                 name: str,
                 agent_type: str,
                 level: int,
                 config: dict,
                 description: str = ""):
        """
        Initialize agent metadata.
        
        Args:
            name: Agent identifier
            agent_type: Type of agent (e.g., "alphazero", "mcts", "minimax")
            level: Game level
            config: Configuration dictionary specific to agent type
            description: Optional description
        """
        self.name = name
        self.agent_type = agent_type
        self.level = level
        self.config = config
        self.description = description
        
        # Performance tracking
        self.wins = 0
        self.losses = 0
        self.draws = 0
        self.wins_as_left = 0
        self.wins_as_right = 0
        self.total_moves = 0
        self.total_time = 0.0
        self.timeouts = 0
        
    def record_game_result(self, won: bool, draw: bool, played_as_left: bool, 
                          moves: int, time: float, timeout: bool = False):
        """Record results from a single game."""
        if draw:
            self.draws += 1
        elif won:
            self.wins += 1
            if played_as_left:
                self.wins_as_left += 1
            else:
                self.wins_as_right += 1
        else:
            self.losses += 1
            
        self.total_moves += moves
        self.total_time += time
        if timeout:
            self.timeouts += 1
    
    def get_summary(self) -> dict:
        """Get performance summary."""
        total_games = self.wins + self.losses + self.draws
        return {
            'name': self.name,
            'type': self.agent_type,
            'level': self.level,
            'total_games': total_games,
            'wins': self.wins,
            'losses': self.losses,
            'draws': self.draws,
            'win_rate': self.wins / total_games if total_games > 0 else 0.0,
            'wins_as_left': self.wins_as_left,
            'wins_as_right': self.wins_as_right,
            'avg_moves_per_game': self.total_moves / total_games if total_games > 0 else 0.0,
            'avg_time_per_game': self.total_time / total_games if total_games > 0 else 0.0,
            'timeouts': self.timeouts,
            'config': self.config,
            'description': self.description
        }