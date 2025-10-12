"""
Dynamic Triangle Formation Heuristic for Level 3
Strategy: Creates dynamic triangular passing structures
Players form triangles around the ball for optimal passing options
"""

import time
import random
import math
from typing import Any, Tuple, List, Optional, Dict, Set
from agents.base_agent import BaseAgent, GameLogic


class HeuristicTriangleFormation(BaseAgent):
    """
    Dynamic Triangle Formation Heuristic for Level 3.
    
    Philosophy:
    - Form triangles around ball carrier for passing options
    - Maintain 3-player triangular structures in active zones
    - Use triangles to progress up the field
    - Goalkeeper acts as safety outlet
    - Overwhelm defense with geometric superiority
    
    Key Concepts:
    - Active Triangle: 3 nearest players to ball form triangle
    - Support Positions: 2 remaining players provide depth
    - Triangle Quality: Measured by angles and spacing
    - Progressive Triangles: Advance ball through connected triangles
    """
    
    def __init__(self, name: str, level: int, triangle_style: str = "fluid"):
        """
        Initialize Triangle Formation agent.
        
        Args:
            name: Agent identifier
            level: Game level (should be 3)
            triangle_style: "compact", "fluid", "wide"
        """
        super().__init__(name, level, GameLogic.STANDARD)
        self.team = None
        self.triangle_style = triangle_style
        
        # Field dimensions
        self.field_rows = 15
        self.field_cols = 11
        
        # Set triangle parameters based on style
        self._set_triangle_parameters(triangle_style)
    
    def _set_triangle_parameters(self, style: str):
        """Set triangle formation parameters."""
        if style == "compact":
            self.IDEAL_TRIANGLE_DISTANCE = 3.0  # Tight triangles
            self.TRIANGLE_TOLERANCE = 1.0
            self.MIN_ANGLE = 30  # Minimum angle in triangle
            self.SUPPORT_DISTANCE = 4.0
        elif style == "wide":
            self.IDEAL_TRIANGLE_DISTANCE = 5.0  # Wider triangles
            self.TRIANGLE_TOLERANCE = 1.5
            self.MIN_ANGLE = 25
            self.SUPPORT_DISTANCE = 6.0
        else:  # fluid
            self.IDEAL_TRIANGLE_DISTANCE = 4.0
            self.TRIANGLE_TOLERANCE = 1.2
            self.MIN_ANGLE = 30
            self.SUPPORT_DISTANCE = 5.0
    
    def set_team(self, team: str):
        """Set the team this agent is playing as."""
        self.team = team
    
    def get_move(self, game_state: Any, time_limit: float = 60.0) -> Tuple[Any, float]:
        """Get the best move using triangle formation."""
        start_time = time.time()
        
        try:
            legal_moves = game_state.get_legal_moves()
            
            if not legal_moves:
                raise RuntimeError(f"No valid moves for {self.name}")
            
            # Apply triangle formation heuristic
            move = self._select_triangle_move(game_state, legal_moves)
            
            thinking_time = time.time() - start_time
            self.total_thinking_time += thinking_time
            
            return move, thinking_time
            
        except Exception as e:
            thinking_time = time.time() - start_time
            print(f"Error in {self.name}.get_move: {e}")
            
            if legal_moves:
                return random.choice(legal_moves), thinking_time
            else:
                raise RuntimeError(f"No valid moves for {self.name}")
    
    def reset(self):
        """Reset agent state between games."""
        self.games_played += 1
    
    def _select_triangle_move(self, game, moves: List) -> Any:
        """Select move based on triangle formation principles."""
        # Separate moves
        kick_moves = [m for m in moves if m[0] == 'kick']
        player_moves = [m for m in moves if m[0] == 'move']
        
        # Priority 1: Immediate goal
        goal_moves = self._find_goal_moves(game, kick_moves)
        if goal_moves:
            return random.choice(goal_moves)
        
        # Analyze current formation
        ball_pos = game.ball.position
        teammates = game.get_team_players(game.current_team)
        
        # Identify active triangle (3 nearest to ball)
        active_players = self._get_active_triangle_players(teammates, ball_pos)
        support_players = [p for p in teammates if p not in active_players]
        
        # Evaluate triangle quality
        triangle_quality = self._evaluate_triangle_quality(active_players, ball_pos)
        
        # Priority 2: Triangle passing
        if kick_moves and triangle_quality > 0.6:
            # Good triangle: use it for progressive pass
            triangle_pass = self._select_triangle_pass(game, kick_moves, active_players, ball_pos)
            if triangle_pass:
                return triangle_pass
        
        # Priority 3: Form/improve triangle
        if player_moves:
            formation_move = self._select_triangle_formation_move(
                game, player_moves, active_players, support_players, ball_pos
            )
            if formation_move:
                return formation_move
        
        # Priority 4: Advance with ball through triangles
        if kick_moves:
            advancing_pass = self._select_advancing_triangle_pass(
                game, kick_moves, teammates, ball_pos
            )
            if advancing_pass:
                return advancing_pass
        
        # Fallback
        if kick_moves:
            return random.choice(kick_moves)
        return random.choice(moves)
    
    def _get_active_triangle_players(self, teammates: List, ball_pos) -> List:
        """Get 3 players closest to ball to form active triangle."""
        # Calculate distances
        player_distances = [(p, p.position.distance(ball_pos)) for p in teammates]
        
        # Sort by distance and take 3 closest
        player_distances.sort(key=lambda x: x[1])
        
        return [p for p, _ in player_distances[:3]]
    
    def _evaluate_triangle_quality(self, triangle_players: List, ball_pos) -> float:
        """
        Evaluate quality of triangle formation (0.0 to 1.0).
        
        Good triangles have:
        - Roughly equal side lengths
        - No obtuse angles (all angles > MIN_ANGLE)
        - Proper spacing (IDEAL_TRIANGLE_DISTANCE)
        """
        if len(triangle_players) < 3:
            return 0.0
        
        # Get positions
        p1 = triangle_players[0].position
        p2 = triangle_players[1].position
        p3 = triangle_players[2].position
        
        # Calculate side lengths
        d12 = p1.distance(p2)
        d23 = p2.distance(p3)
        d31 = p3.distance(p1)
        
        # Check spacing (prefer IDEAL_TRIANGLE_DISTANCE)
        avg_distance = (d12 + d23 + d31) / 3
        spacing_score = 1.0 - min(1.0, abs(avg_distance - self.IDEAL_TRIANGLE_DISTANCE) / self.IDEAL_TRIANGLE_DISTANCE)
        
        # Check angles (avoid degenerate triangles)
        angles = self._calculate_triangle_angles(d12, d23, d31)
        min_angle = min(angles)
        angle_score = min(1.0, min_angle / self.MIN_ANGLE) if min_angle > 0 else 0.0
        
        # Check if ball is near triangle
        ball_to_center = self._triangle_center(p1, p2, p3).distance(ball_pos)
        ball_proximity_score = 1.0 / (1.0 + ball_to_center)
        
        # Combined score
        quality = (spacing_score * 0.4 + angle_score * 0.4 + ball_proximity_score * 0.2)
        
        return quality
    
    def _calculate_triangle_angles(self, d12: float, d23: float, d31: float) -> List[float]:
        """Calculate all three angles of a triangle given side lengths."""
        angles = []
        
        # Use law of cosines: cos(C) = (a² + b² - c²) / (2ab)
        try:
            # Angle at vertex 1
            cos_angle1 = (d12**2 + d31**2 - d23**2) / (2 * d12 * d31)
            angle1 = math.degrees(math.acos(max(-1, min(1, cos_angle1))))
            
            # Angle at vertex 2
            cos_angle2 = (d12**2 + d23**2 - d31**2) / (2 * d12 * d23)
            angle2 = math.degrees(math.acos(max(-1, min(1, cos_angle2))))
            
            # Angle at vertex 3
            cos_angle3 = (d23**2 + d31**2 - d12**2) / (2 * d23 * d31)
            angle3 = math.degrees(math.acos(max(-1, min(1, cos_angle3))))
            
            angles = [angle1, angle2, angle3]
        except:
            angles = [60, 60, 60]  # Fallback to equilateral
        
        return angles
    
    def _triangle_center(self, p1, p2, p3):
        """Calculate centroid of triangle."""
        from position import Position
        center_row = (p1.row + p2.row + p3.row) / 3
        center_col = (p1.col + p2.col + p3.col) / 3
        return Position(int(center_row), int(center_col))
    
    def _select_triangle_pass(self, game, kick_moves: List, active_players: List, ball_pos) -> Optional[Tuple]:
        """
        Select pass within the triangle that advances play.
        """
        goal_row = 14 if game.current_team == game.LEFT else 0
        
        best_pass = None
        best_score = float('-inf')
        
        for move in kick_moves:
            _, _, to_pos = move
            
            # Check if pass lands near triangle player
            for player in active_players:
                if player.position.distance(to_pos) <= 1:
                    score = 0
                    
                    # Bonus for advancing
                    advancement = abs(player.position.row - goal_row) - abs(ball_pos.row - goal_row)
                    score += advancement * 5
                    
                    # Bonus if maintains triangle
                    if self._maintains_triangle(player, active_players, to_pos):
                        score += 15
                    
                    # Bonus for forward player
                    if game.current_team == game.LEFT:
                        if player.position.row > ball_pos.row:
                            score += 10
                    else:
                        if player.position.row < ball_pos.row:
                            score += 10
                    
                    if score > best_score:
                        best_score = score
                        best_pass = move
        
        return best_pass
    
    def _select_triangle_formation_move(self, game, player_moves: List, 
                                       active_players: List, support_players: List,
                                       ball_pos) -> Optional[Tuple]:
        """
        Select player move that improves triangle formation.
        """
        best_move = None
        best_improvement = float('-inf')
        
        for move in player_moves:
            _, from_pos, to_pos = move
            
            # Find which player is moving
            moving_player = None
            for p in active_players + support_players:
                if p.position.row == from_pos.row and p.position.col == from_pos.col:
                    moving_player = p
                    break
            
            if not moving_player:
                continue
            
            # Simulate move and evaluate triangle quality
            original_pos = moving_player.position
            moving_player.position = to_pos
            
            # Re-evaluate triangle
            if moving_player in active_players:
                new_quality = self._evaluate_triangle_quality(active_players, ball_pos)
                
                # Calculate improvement
                moving_player.position = original_pos
                old_quality = self._evaluate_triangle_quality(active_players, ball_pos)
                
                improvement = new_quality - old_quality
                
                # Bonus for getting closer to ball
                old_dist = original_pos.distance(ball_pos)
                new_dist = to_pos.distance(ball_pos)
                if new_dist < old_dist:
                    improvement += 0.1
                
            else:
                # Support player: maintain good support distance
                improvement = 0
                support_dist = to_pos.distance(ball_pos)
                
                if abs(support_dist - self.SUPPORT_DISTANCE) < 2.0:
                    improvement += 0.2
            
            # Restore position
            moving_player.position = original_pos
            
            if improvement > best_improvement:
                best_improvement = improvement
                best_move = move
        
        return best_move if best_improvement > 0 else None
    
    def _select_advancing_triangle_pass(self, game, kick_moves: List, 
                                       teammates: List, ball_pos) -> Optional[Tuple]:
        """
        Select pass that advances ball while finding teammate.
        """
        goal_row = 14 if game.current_team == game.LEFT else 0
        
        advancing_passes = []
        
        for move in kick_moves:
            _, _, to_pos = move
            
            # Check advancement
            current_distance = abs(ball_pos.row - goal_row)
            new_distance = abs(to_pos.row - goal_row)
            
            if new_distance < current_distance:
                # Check if teammate nearby
                for teammate in teammates:
                    if teammate.position.distance(to_pos) <= 2:
                        advancing_passes.append((move, current_distance - new_distance))
                        break
        
        if advancing_passes:
            # Choose pass with most advancement
            advancing_passes.sort(key=lambda x: -x[1])
            return advancing_passes[0][0]
        
        return None
    
    def _maintains_triangle(self, target_player, active_players: List, ball_new_pos) -> bool:
        """
        Check if passing to target_player maintains triangle structure.
        """
        # After pass, ball moves and triangle should reform around it
        other_players = [p for p in active_players if p != target_player]
        
        if len(other_players) < 2:
            return False
        
        # Check if other players are reasonably positioned for new triangle
        avg_distance = sum(p.position.distance(ball_new_pos) for p in other_players) / len(other_players)
        
        return abs(avg_distance - self.IDEAL_TRIANGLE_DISTANCE) < self.TRIANGLE_TOLERANCE * 2
    
    # Helper methods
    
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