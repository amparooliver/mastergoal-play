"""
Heuristic AI Agent for Level 2 - Advanced strategic play
Enhanced version with improved decision-making and tactical awareness
"""

import time
import random
from typing import Any, Tuple, List, Optional
from agents.base_agent import BaseAgent, GameLogic


class HeuristicAgentLevel2(BaseAgent):
    """
    Advanced heuristic AI that uses multi-layered strategic analysis for Level 2.
    
    Enhanced Strategy:
    - Multi-factor move evaluation with weighted scoring
    - Dynamic pressure and control zone analysis
    - Adaptive quadrant-based positioning
    - Tactical passing and shooting decision-making
    - Defensive awareness and counter-positioning
    """
    
    def __init__(self, name: str, level: int, advanced: bool = True):
        """
        Initialize Level 2 Heuristic Agent.
        
        Args:
            name: Agent name for tournament identification
            level: Game level (should be 2)
            advanced: If True, uses full strategic analysis. If False, uses simpler approach
        """
        # Initialize base agent with standard logic
        super().__init__(name, level, GameLogic.STANDARD)
        
        self.advanced = advanced
        self.team = None
        
        # Field dimensions (assuming 15x11 grid)
        self.field_rows = 15
        self.field_cols = 11
        
        # Strategic weights for move evaluation
        self.WEIGHT_GOAL_OPPORTUNITY = 1000  # Immediate goal chance
        self.WEIGHT_GOAL_PROXIMITY = 50      # Distance to goal
        self.WEIGHT_BALL_CONTROL = 30        # Maintain ball possession
        self.WEIGHT_ADVANCEMENT = 25         # Progress towards goal
        self.WEIGHT_PASSING_LANE = 20        # Open passing options
        self.WEIGHT_DEFENSIVE = 15           # Defensive positioning
        self.WEIGHT_SPACE_CONTROL = 10       # Control of key areas
    
    def set_team(self, team: str):
        """Set the team this agent is playing as."""
        self.team = team
    
    def get_move(self, game_state: Any, time_limit: float = 60.0) -> Tuple[Any, float]:
        """
        Get the best move for current game state.
        
        Args:
            game_state: MastergoalGame instance
            time_limit: Maximum time allowed (seconds)
            
        Returns:
            Tuple of (move, thinking_time)
        """
        start_time = time.time()
        
        try:
            # Get all valid moves
            legal_moves = game_state.get_legal_moves()
            
            if not legal_moves:
                raise RuntimeError(f"No valid moves for {self.name}")
            
            # Apply advanced heuristic
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
    
    def reset(self):
        """
        Reset agent state between games.
        """
        self.games_played += 1
    
    def _select_heuristic_move(self, game, moves: List) -> Any:
        """
        Apply advanced heuristic rules to select best move.
        """
        # Separate moves into kicks and player movements
        kick_moves = [m for m in moves if m[0] == 'kick']
        player_moves = [m for m in moves if m[0] == 'move']
        
        # Priority 1: Immediate goal opportunity
        goal_moves = self._find_goal_moves(game, kick_moves)
        if goal_moves:
            return random.choice(goal_moves)
        
        # Priority 2: Use advanced evaluation if enabled
        if self.advanced:
            # Evaluate all kicks with scoring system
            if kick_moves:
                best_kick = self._evaluate_kicks_advanced(game, kick_moves)
                kick_score = self._score_kick(game, best_kick) if best_kick else 0
                
                # Evaluate best player move
                best_player_move = self._evaluate_moves_advanced(game, player_moves) if player_moves else None
                move_score = self._score_player_move(game, best_player_move) if best_player_move else 0
                
                # Choose between kick and move based on scores
                if kick_score > move_score and best_kick:
                    return best_kick
                elif best_player_move:
                    return best_player_move
                elif best_kick:
                    return best_kick
        
        # Priority 3: Simple advancing kick
        if kick_moves:
            advancing_kicks = self._find_advancing_kicks(game, kick_moves)
            if advancing_kicks:
                return self._select_best_advancing_kick(game, advancing_kicks)
        
        # Priority 4: Move player strategically towards ball
        if player_moves:
            strategic_move = self._get_strategic_player_move(game, player_moves)
            if strategic_move:
                return strategic_move
        
        # Fallback: random move
        return random.choice(moves)
    
    def _evaluate_kicks_advanced(self, game, kick_moves: List) -> Optional[Tuple]:
        """Evaluate all kicks using multi-factor scoring."""
        if not kick_moves:
            return None
        
        best_kick = None
        best_score = float('-inf')
        
        for kick in kick_moves:
            score = self._score_kick(game, kick)
            if score > best_score:
                best_score = score
                best_kick = kick
        
        return best_kick
    
    def _score_kick(self, game, kick_move: Tuple) -> float:
        """Score a kick based on multiple strategic factors."""
        _, from_pos, to_pos = kick_move
        score = 0.0
        
        # Factor 1: Distance to goal
        goal_row = 14 if game.current_team == game.LEFT else 0
        goal_center_col = 5
        distance_to_goal = abs(to_pos.row - goal_row) + abs(to_pos.col - goal_center_col)
        score += self.WEIGHT_GOAL_PROXIMITY * (15 - distance_to_goal)
        
        # Factor 2: Advancement towards goal
        current_ball_row = from_pos.row
        if game.current_team == game.LEFT:
            advancement = to_pos.row - current_ball_row
        else:
            advancement = current_ball_row - to_pos.row
        score += self.WEIGHT_ADVANCEMENT * advancement
        
        # Factor 3: Passing to teammate
        teammates_nearby = self._count_teammates_near(game, to_pos, distance=1)
        score += self.WEIGHT_PASSING_LANE * teammates_nearby * 2
        
        # Factor 4: Avoid opponent control
        opponents_nearby = self._count_opponents_near(game, to_pos, distance=1)
        score -= self.WEIGHT_BALL_CONTROL * opponents_nearby * 3
        
        # Factor 5: Space control - prefer center
        center_bonus = 2 - abs(to_pos.col - 5) / 5.0
        score += self.WEIGHT_SPACE_CONTROL * center_bonus
        
        # Factor 6: Clear shooting lanes
        if self._has_clear_path_to_goal(game, to_pos):
            score += self.WEIGHT_GOAL_OPPORTUNITY * 0.3
        
        # Factor 7: Quadrant positioning
        quadrant_bonus = self._evaluate_quadrant_value(game, to_pos)
        score += quadrant_bonus
        
        return score
    
    def _evaluate_moves_advanced(self, game, player_moves: List) -> Optional[Tuple]:
        """Evaluate all player moves using multi-factor scoring."""
        if not player_moves:
            return None
        
        best_move = None
        best_score = float('-inf')
        
        for move in player_moves:
            score = self._score_player_move(game, move)
            if score > best_score:
                best_score = score
                best_move = move
        
        return best_move
    
    def _score_player_move(self, game, player_move: Tuple) -> float:
        """Score a player move based on multiple strategic factors."""
        _, from_pos, to_pos = player_move
        score = 0.0
        ball_pos = game.ball.position
        
        # Factor 1: Distance to ball
        current_distance = from_pos.distance(ball_pos)
        new_distance = to_pos.distance(ball_pos)
        distance_improvement = current_distance - new_distance
        score += self.WEIGHT_BALL_CONTROL * distance_improvement * 5
        
        # Factor 2: Support positioning
        teammates_nearby = self._count_teammates_near(game, to_pos, distance=2)
        score += self.WEIGHT_PASSING_LANE * teammates_nearby
        
        # Factor 3: Defensive positioning
        if self._is_defensive_position_needed(game):
            defensive_value = self._evaluate_defensive_position(game, to_pos)
            score += self.WEIGHT_DEFENSIVE * defensive_value
        
        # Factor 4: Quadrant positioning
        quadrant_bonus = self._evaluate_quadrant_value(game, to_pos, for_player=True)
        score += quadrant_bonus
        
        # Factor 5: Adjacent to ball bonus
        if new_distance <= 1:
            score += self.WEIGHT_BALL_CONTROL * 5
        
        # Factor 6: Forward positioning
        if game.current_team == game.LEFT and to_pos.row > from_pos.row:
            score += self.WEIGHT_ADVANCEMENT * 2
        elif game.current_team == game.RIGHT and to_pos.row < from_pos.row:
            score += self.WEIGHT_ADVANCEMENT * 2
        
        # Factor 7: Avoid clustering
        if teammates_nearby > 2:
            score -= 5 * (teammates_nearby - 2)
        
        return score
    
    def _count_teammates_near(self, game, pos, distance: int = 1) -> int:
        """Count teammates within given distance."""
        from position import Position
        count = 0
        teammates = game.get_team_players(game.current_team)
        
        for teammate in teammates:
            if teammate.position.distance(pos) <= distance:
                count += 1
        
        return count
    
    def _count_opponents_near(self, game, pos, distance: int = 1) -> int:
        """Count opponents within given distance."""
        count = 0
        opponent_team = game.RIGHT if game.current_team == game.LEFT else game.LEFT
        opponents = game.get_team_players(opponent_team)
        
        for opponent in opponents:
            if opponent.position.distance(pos) <= distance:
                count += 1
        
        return count
    
    def _has_clear_path_to_goal(self, game, pos) -> bool:
        """Check if there's a clear path to goal."""
        goal_row = 14 if game.current_team == game.LEFT else 0
        goal_cols = [3, 4, 5, 6, 7]
        
        # Check shooting range
        if game.current_team == game.LEFT:
            if pos.row < 10:
                return False
        else:
            if pos.row > 4:
                return False
        
        # Check blocking opponents
        opponent_team = game.RIGHT if game.current_team == game.LEFT else game.LEFT
        opponents = game.get_team_players(opponent_team)
        
        blocking_opponents = 0
        for opponent in opponents:
            if game.current_team == game.LEFT:
                if opponent.position.row > pos.row and opponent.position.col in goal_cols:
                    blocking_opponents += 1
            else:
                if opponent.position.row < pos.row and opponent.position.col in goal_cols:
                    blocking_opponents += 1
        
        return blocking_opponents <= 1
    
    def _is_defensive_position_needed(self, game) -> bool:
        """Determine if defensive positioning is needed."""
        ball_pos = game.ball.position
        
        if game.current_team == game.LEFT:
            return ball_pos.row < 7
        else:
            return ball_pos.row > 7
    
    def _evaluate_defensive_position(self, game, pos) -> float:
        """Evaluate defensive positioning quality."""
        ball_pos = game.ball.position
        
        if game.current_team == game.LEFT:
            if pos.row < ball_pos.row:
                distance_to_ball = pos.distance(ball_pos)
                return 10.0 / (distance_to_ball + 1)
        else:
            if pos.row > ball_pos.row:
                distance_to_ball = pos.distance(ball_pos)
                return 10.0 / (distance_to_ball + 1)
        
        return 0.0
    
    def _evaluate_quadrant_value(self, game, pos, for_player: bool = False) -> float:
        """Evaluate strategic value of quadrant."""
        quadrant = self._get_quadrant(pos)
        ball_pos = game.ball.position
        ball_quadrant = self._get_quadrant(ball_pos)
        
        if quadrant == 0:
            return 0.0
        
        value = 0.0
        
        if quadrant == ball_quadrant:
            value += 5.0
        
        if game.current_team == game.LEFT:
            if quadrant in [3, 4]:
                value += 10.0
            if not for_player:
                target_quad = self._get_less_defended_quadrant(game, [3, 4])
                if quadrant == target_quad:
                    value += 8.0
        else:
            if quadrant in [1, 2]:
                value += 10.0
            if not for_player:
                target_quad = self._get_less_defended_quadrant(game, [1, 2])
                if quadrant == target_quad:
                    value += 8.0
        
        return value
    
    def _get_less_defended_quadrant(self, game, quadrants: List[int]) -> int:
        """Find quadrant with fewer opponents."""
        opponent_team = game.RIGHT if game.current_team == game.LEFT else game.LEFT
        opponents = game.get_team_players(opponent_team)
        
        quad_counts = {q: 0 for q in quadrants}
        
        for opponent in opponents:
            opp_quad = self._get_quadrant(opponent.position)
            if opp_quad in quad_counts:
                quad_counts[opp_quad] += 1
        
        return min(quad_counts, key=quad_counts.get)
    
    def _find_goal_moves(self, game, kick_moves: List) -> List:
        """Find kicks that score a goal."""
        goal_moves = []
        
        for move in kick_moves:
            _, _, to_pos = move
            
            if game.current_team == game.LEFT and game.is_goal_RIGHT(to_pos):
                goal_moves.append(move)
            elif game.current_team == game.RIGHT and game.is_goal_LEFT(to_pos):
                goal_moves.append(move)
        
        return goal_moves
    
    def _find_advancing_kicks(self, game, kick_moves: List) -> List:
        """Find kicks that advance towards goal."""
        current_ball_row = game.ball.position.row
        advancing_kicks = []
        
        for move in kick_moves:
            _, _, to_pos = move
            
            if game.current_team == game.LEFT:
                if to_pos.row > current_ball_row:
                    advancing_kicks.append(move)
            else:
                if to_pos.row < current_ball_row:
                    advancing_kicks.append(move)
        
        return advancing_kicks
    
    def _select_best_advancing_kick(self, game, advancing_kicks: List) -> Tuple:
        """Select best advancing kick."""
        if len(advancing_kicks) == 1:
            return advancing_kicks[0]
        
        best_kick = None
        best_score = float('-inf')
        
        for kick in advancing_kicks:
            _, _, to_pos = kick
            score = 0.0
            
            goal_row = 14 if game.current_team == game.LEFT else 0
            advancement = abs(goal_row - to_pos.row)
            score += (15 - advancement) * 3
            
            score += (5 - abs(to_pos.col - 5)) * 2
            
            teammates_nearby = self._count_teammates_near(game, to_pos, distance=2)
            score += teammates_nearby * 2
            
            opponents_nearby = self._count_opponents_near(game, to_pos, distance=1)
            score -= opponents_nearby * 3
            
            if score > best_score:
                best_score = score
                best_kick = kick
        
        return best_kick if best_kick else random.choice(advancing_kicks)
    
    def _get_strategic_player_move(self, game, player_moves: List) -> Optional[Tuple]:
        """Select best player move strategically."""
        if not self.advanced:
            return self._move_closest_to_ball(game, player_moves)
        
        ball_pos = game.ball.position
        ball_quadrant = self._get_quadrant(ball_pos)
        
        filtered_moves = self._filter_moves_by_zone(player_moves, ball_quadrant)
        
        if filtered_moves:
            return self._move_closest_to_ball(game, filtered_moves)
        
        return self._move_closest_to_ball(game, player_moves)
    
    def _get_quadrant(self, pos) -> int:
        """Get quadrant number for position."""
        row, col = pos.row, pos.col
        
        if 7 <= row <= 13:
            if 0 <= col <= 5:
                return 1
            elif 6 <= col <= 10:
                return 2
        elif 1 <= row <= 6:
            if 0 <= col <= 5:
                return 3
            elif 6 <= col <= 10:
                return 4
        
        return 0
    
    def _filter_moves_by_zone(self, player_moves: List, ball_quadrant: int) -> List:
        """Filter moves by relevant zones."""
        if ball_quadrant == 0:
            return player_moves
        
        filtered_moves = []
        
        if ball_quadrant in [1, 2]:
            relevant_quadrants = [1, 2]
        else:
            relevant_quadrants = [3, 4]
        
        for move in player_moves:
            _, from_pos, _ = move
            from_quadrant = self._get_quadrant(from_pos)
            
            if from_quadrant in relevant_quadrants or from_quadrant == 0:
                filtered_moves.append(move)
        
        return filtered_moves if filtered_moves else player_moves
    
    def _move_closest_to_ball(self, game, player_moves: List) -> Optional[Tuple]:
        """Find player move closest to ball."""
        ball_pos = game.ball.position
        best_move = None
        min_distance = float('inf')
        best_advancement = float('-inf')
        
        for move in player_moves:
            _, from_pos, to_pos = move
            new_distance = to_pos.distance(ball_pos)
            
            if game.current_team == game.LEFT:
                advancement = to_pos.row - from_pos.row
            else:
                advancement = from_pos.row - to_pos.row
            
            if new_distance < min_distance or (new_distance == min_distance and advancement > best_advancement):
                min_distance = new_distance
                best_advancement = advancement
                best_move = move
        
        return best_move