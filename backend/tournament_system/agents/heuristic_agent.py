"""
Heuristic Agent - Rule-based strategy
Uses predefined heuristic rules to select moves without search.
Works with standard game logic (mastergoalGame.py).
"""

import time
import random
from typing import Any, Tuple, List
from agents.base_agent import BaseAgent, GameLogic


class HeuristicAgent(BaseAgent):
    """
    Rule-based agent using heuristic move selection.
    
    Heuristic Priority (from highest to lowest):
    1. Score a goal if possible
    2. Advance ball towards opponent's goal
    3. Pass to better-positioned teammate
    4. Move player closer to ball
    5. Defensive positioning
    6. Random valid move (fallback)
    """
    
    def __init__(self, name: str, level: int):
        """
        Initialize Heuristic agent.
        
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
        Select move using heuristic rules.
        
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
            
            # Apply heuristic rules
            move = self._select_heuristic_move(game_state, legal_moves)
            
            thinking_time = time.time() - start_time
            self.total_thinking_time += thinking_time
            
            return move, thinking_time
            
        except Exception as e:
            thinking_time = time.time() - start_time
            print(f"Error in {self.name}.get_move: {e}")
            
            # Fallback: random move
            if legal_moves:
                return random.choice(legal_moves), thinking_time
            else:
                raise RuntimeError(f"No valid moves for {self.name}")
    
    def _select_heuristic_move(self, game, moves: List) -> Any:
        """
        Apply heuristic rules to select best move.
        
        Rules applied in priority order:
        1. Goal-scoring opportunities
        2. Ball advancement towards goal
        3. Passes to better-positioned teammates
        4. Player movement towards ball
        5. Defensive positioning
        6. Random from remaining
        """
        # Separate moves into kicks and player movements
        kick_moves = [m for m in moves if m[0] == 'kick']
        player_moves = [m for m in moves if m[0] == 'move']
        
        # Rule 1: Try to score a goal
        goal_moves = self._find_goal_moves(game, kick_moves)
        if goal_moves:
            return random.choice(goal_moves)
        
        # Rule 2: Advance ball towards opponent's goal
        if kick_moves:
            advancing_kicks = self._find_advancing_kicks(game, kick_moves)
            if advancing_kicks:
                return random.choice(advancing_kicks)
        
        # Rule 3: Pass to better-positioned teammate (level 2+)
        if self.level >= 2 and kick_moves:
            pass_moves = self._find_good_passes(game, kick_moves)
            if pass_moves:
                return random.choice(pass_moves)
        
        # Rule 4: Move player closer to ball
        if player_moves:
            approaching_moves = self._find_ball_approaching_moves(game, player_moves)
            if approaching_moves:
                return random.choice(approaching_moves)
        
        # Rule 5: Defensive positioning
        if player_moves:
            defensive_moves = self._find_defensive_moves(game, player_moves)
            if defensive_moves:
                return random.choice(defensive_moves)
        
        # Fallback: random move
        return random.choice(moves)
    
    def _find_goal_moves(self, game, kick_moves: List) -> List:
        """Find kicks that score a goal."""
        goal_moves = []
        
        for move in kick_moves:
            _, _, to_pos = move
            
            # Check if this position is a goal for our team
            if self.team == game.LEFT and game.is_goal_RIGHT(to_pos):
                goal_moves.append(move)
            elif self.team == game.RIGHT and game.is_goal_LEFT(to_pos):
                goal_moves.append(move)
        
        return goal_moves
    
    def _find_advancing_kicks(self, game, kick_moves: List) -> List:
        """Find kicks that advance ball towards opponent's goal."""
        current_ball_row = game.ball.position.row
        advancing_kicks = []
        
        for move in kick_moves:
            _, _, to_pos = move
            
            # Calculate advancement
            if self.team == game.LEFT:
                # LEFT advances towards row 14 (opponent's goal)
                if to_pos.row > current_ball_row:
                    advancing_kicks.append(move)
            else:
                # RIGHT advances towards row 0 (opponent's goal)
                if to_pos.row < current_ball_row:
                    advancing_kicks.append(move)
        
        return advancing_kicks
    
    def _find_good_passes(self, game, kick_moves: List) -> List:
        """Find passes to well-positioned teammates."""
        good_passes = []
        
        teammates = game.get_team_players(self.team)
        opponent_goal_row = 14 if self.team == game.LEFT else 0
        
        for move in kick_moves:
            _, _, to_pos = move
            
            # Check if any teammate is adjacent to target position
            for teammate in teammates:
                if teammate.position.is_adjacent(to_pos):
                    # Prefer passes to teammates closer to opponent goal
                    teammate_distance_to_goal = abs(teammate.position.row - opponent_goal_row)
                    
                    if teammate_distance_to_goal < 7:  # Closer than midfield
                        good_passes.append(move)
                        break
        
        return good_passes
    
    def _find_ball_approaching_moves(self, game, player_moves: List) -> List:
        """Find player moves that get closer to the ball."""
        ball_pos = game.ball.position
        approaching_moves = []
        
        for move in player_moves:
            _, from_pos, to_pos = move
            
            current_distance = from_pos.distance(ball_pos)
            new_distance = to_pos.distance(ball_pos)
            
            # Move gets us closer to ball
            if new_distance < current_distance:
                approaching_moves.append(move)
        
        return approaching_moves
    
    def _find_defensive_moves(self, game, player_moves: List) -> List:
        """Find moves that improve defensive positioning."""
        defensive_moves = []
        
        # Get our goal position
        our_goal_row = 0 if self.team == game.LEFT else 14
        ball_row = game.ball.position.row
        
        for move in player_moves:
            _, from_pos, to_pos = move
            
            # If ball is in our half, move towards it defensively
            if self.team == game.LEFT:
                if ball_row < 7:  # Ball in our half
                    # Move closer to ball while staying between ball and goal
                    if to_pos.row < ball_row and to_pos.row > our_goal_row:
                        defensive_moves.append(move)
            else:
                if ball_row > 7:  # Ball in our half
                    if to_pos.row > ball_row and to_pos.row < our_goal_row:
                        defensive_moves.append(move)
        
        return defensive_moves
    
    def reset(self):
        """Reset between games."""
        self.games_played += 1
    
    def get_stats(self) -> dict:
        """Get agent statistics."""
        stats = super().get_stats()
        stats.update({
            'agent_type': 'heuristic'
        })
        return stats