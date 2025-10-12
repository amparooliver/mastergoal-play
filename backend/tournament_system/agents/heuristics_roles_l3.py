"""
Role-Based Coordination Heuristic for Level 3
Strategy: Each player has a specific role (Goalkeeper, Defenders, Midfielders, Forwards)
Players coordinate based on their assigned roles and responsibilities
"""

import time
import random
from typing import Any, Tuple, List, Optional, Dict
from agents.base_agent import BaseAgent, GameLogic


class HeuristicRoleBased(BaseAgent):
    """
    Role-Based Coordination Heuristic for Level 3.
    
    Philosophy:
    - Assign specific roles to each player based on position
    - Each role has distinct responsibilities and priorities
    - Coordinate movement based on role relationships
    - Maintain team structure while attacking/defending
    
    Roles (5 players):
    - Goalkeeper (1): Last line of defense, rarely moves
    - Defenders (2): Protect defensive third, support attacks
    - Midfielders (2): Link defense and attack, high mobility
    - Forwards: Most advanced players prioritize when ball is forward
    
    Strategy adapts based on ball position and game state.
    """
    
    def __init__(self, name: str, level: int, playstyle: str = "balanced"):
        """
        Initialize Role-Based agent.
        
        Args:
            name: Agent identifier
            level: Game level (should be 3)
            playstyle: "defensive", "balanced", "offensive"
        """
        super().__init__(name, level, GameLogic.STANDARD)
        self.team = None
        self.playstyle = playstyle
        
        # Field dimensions
        self.field_rows = 15
        self.field_cols = 11
        
        # Role assignments (will be set based on initial positions)
        self.player_roles = {}  # {player_id: role}
        
        # Set tactical parameters based on playstyle
        self._set_playstyle_parameters(playstyle)
    
    def _set_playstyle_parameters(self, playstyle: str):
        """Set tactical parameters based on playstyle."""
        if playstyle == "defensive":
            self.DEFENSIVE_LINE = 5  # How far back defenders stay
            self.PRESS_THRESHOLD = 4  # How close before pressing
            self.FORWARD_SUPPORT = 0.3  # Less forward support
            self.GOALKEEPER_MOBILITY = 0.2  # GK rarely moves
        elif playstyle == "offensive":
            self.DEFENSIVE_LINE = 7
            self.PRESS_THRESHOLD = 6
            self.FORWARD_SUPPORT = 0.7
            self.GOALKEEPER_MOBILITY = 0.4
        else:  # balanced
            self.DEFENSIVE_LINE = 6
            self.PRESS_THRESHOLD = 5
            self.FORWARD_SUPPORT = 0.5
            self.GOALKEEPER_MOBILITY = 0.3
    
    def set_team(self, team: str):
        """Set the team this agent is playing as."""
        self.team = team
    
    def get_move(self, game_state: Any, time_limit: float = 60.0) -> Tuple[Any, float]:
        """Get the best move using role-based coordination."""
        start_time = time.time()
        
        try:
            legal_moves = game_state.get_legal_moves()
            
            if not legal_moves:
                raise RuntimeError(f"No valid moves for {self.name}")
            
            # Assign roles if first move
            if not self.player_roles:
                self._assign_roles(game_state)
            
            # Apply role-based heuristic
            move = self._select_role_based_move(game_state, legal_moves)
            
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
        self.player_roles = {}  # Clear role assignments
    
    def _assign_roles(self, game):
        """
        Assign roles to players based on initial positions.
        
        Roles for 5 players:
        - 1 Goalkeeper (most defensive position)
        - 2 Defenders (defensive third)
        - 2 Midfielders/Forwards (middle/attacking third)
        """
        teammates = game.get_team_players(game.current_team)
        
        # Sort by defensive position
        if game.current_team == game.LEFT:
            # LEFT defends row 0, attacks row 14
            sorted_players = sorted(teammates, key=lambda p: p.position.row)
        else:
            # RIGHT defends row 14, attacks row 0
            sorted_players = sorted(teammates, key=lambda p: -p.position.row)
        
        # Assign roles
        for i, player in enumerate(sorted_players):
            if i == 0:
                self.player_roles[player.player_id] = "goalkeeper"
            elif i <= 2:
                self.player_roles[player.player_id] = "defender"
            else:
                self.player_roles[player.player_id] = "midfielder"
    
    def _select_role_based_move(self, game, moves: List) -> Any:
        """Select move based on role-based coordination."""
        # Separate moves
        kick_moves = [m for m in moves if m[0] == 'kick']
        player_moves = [m for m in moves if m[0] == 'move']
        
        # Priority 1: Immediate goal
        goal_moves = self._find_goal_moves(game, kick_moves)
        if goal_moves:
            return random.choice(goal_moves)
        
        # Analyze game state
        ball_pos = game.ball.position
        game_phase = self._determine_game_phase(game, ball_pos)
        
        # Priority 2: Role-based decisions
        if game_phase == "ATTACKING":
            move = self._select_attacking_move(game, moves, kick_moves, player_moves)
            if move:
                return move
        
        elif game_phase == "DEFENDING":
            move = self._select_defensive_move(game, player_moves, kick_moves)
            if move:
                return move
        
        elif game_phase == "TRANSITION":
            move = self._select_transition_move(game, moves, kick_moves, player_moves)
            if move:
                return move
        
        # Fallback
        return random.choice(moves)
    
    def _determine_game_phase(self, game, ball_pos) -> str:
        """Determine current game phase based on ball position."""
        if game.current_team == game.LEFT:
            if ball_pos.row >= 10:
                return "ATTACKING"
            elif ball_pos.row <= 4:
                return "DEFENDING"
            else:
                return "TRANSITION"
        else:
            if ball_pos.row <= 4:
                return "ATTACKING"
            elif ball_pos.row >= 10:
                return "DEFENDING"
            else:
                return "TRANSITION"
    
    def _select_attacking_move(self, game, all_moves, kick_moves, player_moves) -> Optional[Tuple]:
        """
        Attacking phase: Forwards lead, Midfielders support, Defenders hold.
        """
        ball_pos = game.ball.position
        
        # Priority 1: Aggressive kicks towards goal
        if kick_moves:
            goal_area_kicks = []
            goal_row = 14 if game.current_team == game.LEFT else 0
            
            for move in kick_moves:
                _, _, to_pos = move
                distance_to_goal = abs(to_pos.row - goal_row)
                if distance_to_goal <= 3:  # Very close to goal
                    goal_area_kicks.append(move)
            
            if goal_area_kicks:
                # Choose kick with best angle
                return self._select_best_angle_kick(game, goal_area_kicks)
        
        # Priority 2: Forward players advance with ball
        forward_advances = []
        for move in player_moves:
            _, from_pos, to_pos = move
            
            # Get player at from_pos
            player = self._get_player_at(game, from_pos)
            if player:
                role = self.player_roles.get(player.player_id, "midfielder")
                
                # Forwards and midfielders can advance
                if role in ["midfielder", "forward"]:
                    # Check if move gets closer to ball and advances
                    if to_pos.distance(ball_pos) <= from_pos.distance(ball_pos):
                        if game.current_team == game.LEFT:
                            if to_pos.row > from_pos.row:
                                forward_advances.append(move)
                        else:
                            if to_pos.row < from_pos.row:
                                forward_advances.append(move)
        
        if forward_advances:
            return random.choice(forward_advances)
        
        # Priority 3: Support positioning
        if kick_moves:
            return self._select_support_kick(game, kick_moves)
        
        return None
    
    def _select_defensive_move(self, game, player_moves, kick_moves) -> Optional[Tuple]:
        """
        Defensive phase: Goalkeeper guards, Defenders press, Midfielders recover.
        """
        ball_pos = game.ball.position
        
        # Priority 1: Clear ball away from danger
        if kick_moves:
            clearing_kicks = []
            for move in kick_moves:
                _, _, to_pos = move
                
                # Good clearing kick moves ball away from own goal
                if game.current_team == game.LEFT:
                    if to_pos.row > ball_pos.row + 3:  # Clear forward
                        clearing_kicks.append(move)
                else:
                    if to_pos.row < ball_pos.row - 3:
                        clearing_kicks.append(move)
            
            if clearing_kicks:
                return random.choice(clearing_kicks)
        
        # Priority 2: Defenders intercept
        defender_intercepts = []
        for move in player_moves:
            _, from_pos, to_pos = move
            
            player = self._get_player_at(game, from_pos)
            if player:
                role = self.player_roles.get(player.player_id, "midfielder")
                
                # Defenders and midfielders press the ball
                if role in ["defender", "midfielder"]:
                    new_distance = to_pos.distance(ball_pos)
                    if new_distance <= 2:  # Get very close
                        defender_intercepts.append(move)
        
        if defender_intercepts:
            return random.choice(defender_intercepts)
        
        # Priority 3: Goalkeeper positioning
        goalkeeper_moves = []
        for move in player_moves:
            _, from_pos, to_pos = move
            
            player = self._get_player_at(game, from_pos)
            if player:
                role = self.player_roles.get(player.player_id, "midfielder")
                
                if role == "goalkeeper":
                    # GK should stay near goal but position between ball and goal
                    goalkeeper_moves.append(move)
        
        if goalkeeper_moves:
            return self._select_best_goalkeeper_position(game, goalkeeper_moves)
        
        return None
    
    def _select_transition_move(self, game, all_moves, kick_moves, player_moves) -> Optional[Tuple]:
        """
        Transition phase: Quick passes, maintain shape, advance gradually.
        """
        ball_pos = game.ball.position
        
        # Priority 1: Quick forward pass to advanced teammate
        if kick_moves:
            teammates = game.get_team_players(game.current_team)
            
            for move in kick_moves:
                _, _, to_pos = move
                
                # Check if pass to teammate in good position
                for teammate in teammates:
                    if teammate.position.distance(to_pos) <= 1:
                        role = self.player_roles.get(teammate.player_id, "midfielder")
                        
                        # Prefer passing to forwards/midfielders
                        if role in ["midfielder", "forward"]:
                            # Check if teammate is ahead
                            if game.current_team == game.LEFT:
                                if teammate.position.row > ball_pos.row:
                                    return move
                            else:
                                if teammate.position.row < ball_pos.row:
                                    return move
        
        # Priority 2: Maintain formation while advancing
        formation_moves = []
        for move in player_moves:
            _, from_pos, to_pos = move
            
            player = self._get_player_at(game, from_pos)
            if player:
                role = self.player_roles.get(player.player_id, "midfielder")
                
                # Everyone except goalkeeper can advance gradually
                if role != "goalkeeper":
                    # Move towards ball while maintaining spacing
                    if to_pos.distance(ball_pos) <= from_pos.distance(ball_pos):
                        formation_moves.append(move)
        
        if formation_moves:
            return random.choice(formation_moves)
        
        return None
    
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
    
    def _get_player_at(self, game, pos) -> Optional[Any]:
        """Get player at specific position."""
        teammates = game.get_team_players(game.current_team)
        for player in teammates:
            if player.position.row == pos.row and player.position.col == pos.col:
                return player
        return None
    
    def _select_best_angle_kick(self, game, kicks: List) -> Tuple:
        """Select kick with best angle to goal."""
        goal_center_col = 5
        best_kick = None
        best_score = float('-inf')
        
        for kick in kicks:
            _, _, to_pos = kick
            
            # Prefer central kicks
            angle_score = 10 - abs(to_pos.col - goal_center_col)
            
            if angle_score > best_score:
                best_score = angle_score
                best_kick = kick
        
        return best_kick if best_kick else random.choice(kicks)
    
    def _select_support_kick(self, game, kicks: List) -> Tuple:
        """Select kick that finds teammate in good position."""
        teammates = game.get_team_players(game.current_team)
        
        for kick in kicks:
            _, _, to_pos = kick
            
            for teammate in teammates:
                if teammate.position.distance(to_pos) <= 1:
                    return kick
        
        return random.choice(kicks)
    
    def _select_best_goalkeeper_position(self, game, gk_moves: List) -> Tuple:
        """Select best goalkeeper positioning move."""
        ball_pos = game.ball.position
        goal_row = 0 if game.current_team == game.LEFT else 14
        goal_center_col = 5
        
        best_move = None
        best_score = float('-inf')
        
        for move in gk_moves:
            _, from_pos, to_pos = move
            
            # GK should be between ball and goal center
            score = 0
            
            # Penalty for moving too far from goal
            distance_from_goal = abs(to_pos.row - goal_row)
            score -= distance_from_goal * 2
            
            # Bonus for aligning with ball column
            alignment = 5 - abs(to_pos.col - ball_pos.col)
            score += alignment
            
            if score > best_score:
                best_score = score
                best_move = move
        
        return best_move if best_move else random.choice(gk_moves)