"""
Territorial Control & Pressure Heuristic for Level 2
Strategy: Dominate field zones and apply constant pressure rather than direct goal-seeking
"""

import time
import random
from typing import Any, Tuple, List, Optional, Dict, Set
from agents.base_agent import BaseAgent, GameLogic


class HeuristicTerritorialControl(BaseAgent):
    """
    Territorial Control & Pressure Heuristic Agent.
    
    Core Philosophy:
    1. Control key field zones (not just advance ball)
    2. Apply pressure on opponent (limit their options)
    3. Create numerical superiority in active zones
    4. Maintain team shape and spacing
    5. Strike when opponent is disorganized
    
    Strategy Components:
    - Zone Control: Divide field into 9 zones (3x3 grid)
    - Pressure Maps: Track opponent threat levels
    - Formation Integrity: Maintain optimal spacing
    - Opportunistic Finishing: Strike when zones are controlled
    """
    
    def __init__(self, name: str, level: int, pressure_intensity: str = "high"):
        """
        Initialize Territorial Control agent.
        
        Args:
            name: Agent identifier
            level: Game level (should be 2)
            pressure_intensity: "low", "medium", "high" - affects aggression
        """
        super().__init__(name, level, GameLogic.STANDARD)
        self.team = None
        self.pressure_intensity = pressure_intensity
        
        # Field dimensions
        self.field_rows = 15
        self.field_cols = 11
        
        # Zone definitions (3x3 grid)
        # Zones: 0-2 (defensive), 3-5 (middle), 6-8 (attacking)
        self.zone_definitions = self._create_zone_map()
        
        # Tactical parameters based on pressure intensity
        self._set_tactical_parameters(pressure_intensity)
    
    def _set_tactical_parameters(self, intensity: str):
        """Set tactical parameters based on pressure intensity."""
        if intensity == "high":
            self.MIN_PLAYERS_FOR_PRESSURE = 1  # Aggressive pressing
            self.OPTIMAL_SPACING = 3.5  # Tighter formation
            self.PRESSURE_THRESHOLD = 2  # Press when 2+ opponents nearby
            self.CONTROL_BONUS = 25
            self.PRESSURE_BONUS = 30
        elif intensity == "medium":
            self.MIN_PLAYERS_FOR_PRESSURE = 2
            self.OPTIMAL_SPACING = 4.0
            self.PRESSURE_THRESHOLD = 3
            self.CONTROL_BONUS = 20
            self.PRESSURE_BONUS = 20
        else:  # low
            self.MIN_PLAYERS_FOR_PRESSURE = 2
            self.OPTIMAL_SPACING = 4.5
            self.PRESSURE_THRESHOLD = 3
            self.CONTROL_BONUS = 15
            self.PRESSURE_BONUS = 10
    
    def _create_zone_map(self) -> Dict[int, Dict]:
        """
        Create 9-zone map of the field (3x3 grid).
        
        Zones:
        6 | 7 | 8  <- Attacking third
        3 | 4 | 5  <- Middle third  
        0 | 1 | 2  <- Defensive third
        """
        zones = {}
        
        # Define zone boundaries
        row_splits = [0, 5, 10, 15]  # Rows: 0-4, 5-9, 10-14
        col_splits = [0, 3, 7, 11]   # Cols: 0-2, 3-6, 7-10
        
        zone_id = 0
        for row_idx in range(3):
            for col_idx in range(3):
                zones[zone_id] = {
                    'row_range': (row_splits[row_idx], row_splits[row_idx + 1]),
                    'col_range': (col_splits[col_idx], col_splits[col_idx + 1]),
                    'center': (
                        (row_splits[row_idx] + row_splits[row_idx + 1]) / 2,
                        (col_splits[col_idx] + col_splits[col_idx + 1]) / 2
                    )
                }
                zone_id += 1
        
        return zones
    
    def _get_position_zone(self, pos) -> int:
        """Get zone ID for a position."""
        for zone_id, zone_info in self.zone_definitions.items():
            row_min, row_max = zone_info['row_range']
            col_min, col_max = zone_info['col_range']
            
            if row_min <= pos.row < row_max and col_min <= pos.col < col_max:
                return zone_id
        
        return -1
    
    def set_team(self, team: str):
        """Set the team this agent is playing as."""
        self.team = team
    
    def get_move(self, game_state: Any, time_limit: float = 60.0) -> Tuple[Any, float]:
        """Get the best move using territorial control strategy."""
        start_time = time.time()
        
        try:
            legal_moves = game_state.get_legal_moves()
            
            if not legal_moves:
                raise RuntimeError(f"No valid moves for {self.name}")
            
            # Apply territorial control heuristic
            move = self._select_territorial_move(game_state, legal_moves)
            
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
        """Reset agent state between games."""
        self.games_played += 1
    
    def _select_territorial_move(self, game, moves: List) -> Any:
        """
        Select move based on territorial control principles.
        """
        # Analyze current game state
        state_analysis = self._analyze_game_state(game)
        
        # Separate moves
        kick_moves = [m for m in moves if m[0] == 'kick']
        player_moves = [m for m in moves if m[0] == 'move']
        
        # Priority 1: Immediate goal (always take it)
        goal_moves = self._find_goal_moves(game, kick_moves)
        if goal_moves:
            return random.choice(goal_moves)
        
        # Priority 2: Check if we should press or possess
        game_phase = self._determine_game_phase(game, state_analysis)
        
        if game_phase == "PRESS":
            # Aggressive: Apply pressure on ball
            move = self._select_pressing_move(game, moves, state_analysis)
            if move:
                return move
        
        elif game_phase == "CONTROL":
            # Controlled possession: Dominate zones methodically
            move = self._select_control_move(game, moves, state_analysis)
            if move:
                return move
        
        elif game_phase == "STRIKE":
            # Opportunistic: Zone is controlled, attack!
            move = self._select_striking_move(game, kick_moves, state_analysis)
            if move:
                return move
        
        # Fallback: Maintain formation and zone control
        if player_moves:
            return self._select_formation_move(game, player_moves, state_analysis)
        
        # Last resort
        return random.choice(moves)
    
    def _analyze_game_state(self, game) -> Dict:
        """Analyze current territorial control and pressure."""
        ball_pos = game.ball.position
        teammates = game.get_team_players(game.current_team)
        opponent_team = game.RIGHT if game.current_team == game.LEFT else game.LEFT
        opponents = game.get_team_players(opponent_team)
        
        # Zone control: count players in each zone
        zone_control = {i: {'teammates': 0, 'opponents': 0} for i in range(9)}
        
        for player in teammates:
            zone = self._get_position_zone(player.position)
            if zone >= 0:
                zone_control[zone]['teammates'] += 1
        
        for opponent in opponents:
            zone = self._get_position_zone(opponent.position)
            if zone >= 0:
                zone_control[zone]['opponents'] += 1
        
        # Ball zone
        ball_zone = self._get_position_zone(ball_pos)
        
        # Pressure on ball
        opponents_near_ball = sum(1 for opp in opponents if opp.position.distance(ball_pos) <= 2)
        teammates_near_ball = sum(1 for tm in teammates if tm.position.distance(ball_pos) <= 2)
        
        # Team spacing
        avg_spacing = self._calculate_team_spacing(teammates)
        
        return {
            'zone_control': zone_control,
            'ball_zone': ball_zone,
            'ball_pos': ball_pos,
            'opponents_near_ball': opponents_near_ball,
            'teammates_near_ball': teammates_near_ball,
            'avg_spacing': avg_spacing,
            'controlled_zones': sum(1 for z in zone_control.values() if z['teammates'] > z['opponents']),
            'threatened_zones': sum(1 for z in zone_control.values() if z['opponents'] > z['teammates'])
        }
    
    def _determine_game_phase(self, game, state: Dict) -> str:
        """
        Determine current game phase based on territorial control.
        
        Returns:
            "PRESS" - Apply pressure, win ball back
            "CONTROL" - Dominate zones, build play
            "STRIKE" - Attack with controlled zones
        """
        ball_zone = state['ball_zone']
        zone_control = state['zone_control']
        
        # Adjust zones based on team
        if game.current_team == game.LEFT:
            attacking_zones = [6, 7, 8]
            middle_zones = [3, 4, 5]
        else:
            attacking_zones = [0, 1, 2]
            middle_zones = [3, 4, 5]
        
        # Check if ball is in attacking third
        if ball_zone in attacking_zones:
            # Check if we control this zone
            if zone_control[ball_zone]['teammates'] >= zone_control[ball_zone]['opponents']:
                return "STRIKE"
            else:
                return "PRESS"  # Need to win ball back
        
        # Ball in middle third
        if ball_zone in middle_zones:
            # Check overall control
            if state['controlled_zones'] >= 5:
                return "CONTROL"  # We're dominating
            elif state['opponents_near_ball'] > state['teammates_near_ball']:
                return "PRESS"  # Under pressure
            else:
                return "CONTROL"
        
        # Ball in defensive third
        return "PRESS"  # Always press in defense
    
    def _select_pressing_move(self, game, moves: List, state: Dict) -> Optional[Tuple]:
        """Select move that applies maximum pressure on opponent."""
        ball_pos = state['ball_pos']
        
        # Prioritize moves that get closest to ball
        best_move = None
        best_pressure_score = float('-inf')
        
        for move in moves:
            move_type, from_pos, to_pos = move
            
            if move_type == 'move':
                # Calculate pressure applied
                new_distance = to_pos.distance(ball_pos)
                
                # Prefer getting very close (adjacent)
                if new_distance <= 1:
                    pressure_score = 100
                else:
                    pressure_score = 50 / (new_distance + 1)
                
                # Bonus for cutting passing lanes
                opponents = game.get_team_players(
                    game.RIGHT if game.current_team == game.LEFT else game.LEFT
                )
                for opp in opponents:
                    if self._is_between(to_pos, ball_pos, opp.position):
                        pressure_score += 20
                
                if pressure_score > best_pressure_score:
                    best_pressure_score = pressure_score
                    best_move = move
            
            elif move_type == 'kick':
                # If we can kick, clear danger or advance
                if self._is_clearing_kick(game, to_pos):
                    return move  # Immediate clear
        
        return best_move
    
    def _select_control_move(self, game, moves: List, state: Dict) -> Optional[Tuple]:
        """Select move that maximizes zone control and maintains shape."""
        zone_control = state['zone_control']
        ball_zone = state['ball_zone']
        
        # Find undercontrolled zones that need reinforcement
        target_zones = []
        
        # Prioritize zones adjacent to ball zone
        adjacent_zones = self._get_adjacent_zones(ball_zone)
        for zone_id in adjacent_zones:
            if zone_control[zone_id]['teammates'] <= zone_control[zone_id]['opponents']:
                target_zones.append(zone_id)
        
        # Evaluate moves
        best_move = None
        best_control_score = float('-inf')
        
        for move in moves:
            move_type, from_pos, to_pos = move
            
            if move_type == 'move':
                target_zone = self._get_position_zone(to_pos)
                control_score = 0
                
                # Bonus for reinforcing target zones
                if target_zone in target_zones:
                    control_score += self.CONTROL_BONUS
                
                # Bonus for maintaining spacing
                teammates = game.get_team_players(game.current_team)
                spacing_quality = self._evaluate_spacing_quality(to_pos, teammates)
                control_score += spacing_quality * 10
                
                # Bonus for advancing position gradually
                if game.current_team == game.LEFT:
                    control_score += (to_pos.row - from_pos.row) * 2
                else:
                    control_score += (from_pos.row - to_pos.row) * 2
                
                if control_score > best_control_score:
                    best_control_score = control_score
                    best_move = move
            
            elif move_type == 'kick':
                # Controlled pass to teammate in good position
                teammates = game.get_team_players(game.current_team)
                for teammate in teammates:
                    if teammate.position.distance(to_pos) <= 1:
                        # Check if teammate is in advanced position
                        tm_zone = self._get_position_zone(teammate.position)
                        if game.current_team == game.LEFT and tm_zone >= 6:
                            return move  # Good attacking pass
                        elif game.current_team == game.RIGHT and tm_zone <= 2:
                            return move
        
        return best_move
    
    def _select_striking_move(self, game, kick_moves: List, state: Dict) -> Optional[Tuple]:
        """Select attacking move when zones are controlled."""
        if not kick_moves:
            return None
        
        goal_row = 14 if game.current_team == game.LEFT else 0
        
        best_kick = None
        best_strike_score = float('-inf')
        
        for move in kick_moves:
            _, _, to_pos = move
            strike_score = 0
            
            # Distance to goal
            goal_distance = abs(to_pos.row - goal_row)
            strike_score += (15 - goal_distance) * 5
            
            # Center alignment
            center_distance = abs(to_pos.col - 5)
            strike_score += (5 - center_distance) * 3
            
            # Free from opponents
            opponents = game.get_team_players(
                game.RIGHT if game.current_team == game.LEFT else game.LEFT
            )
            opponents_near = sum(1 for opp in opponents if opp.position.distance(to_pos) <= 2)
            strike_score -= opponents_near * 10
            
            if strike_score > best_strike_score:
                best_strike_score = strike_score
                best_kick = move
        
        return best_kick
    
    def _select_formation_move(self, game, player_moves: List, state: Dict) -> Tuple:
        """Select move that maintains formation integrity."""
        teammates = game.get_team_players(game.current_team)
        ball_pos = state['ball_pos']
        
        best_move = None
        best_formation_score = float('-inf')
        
        for move in player_moves:
            _, from_pos, to_pos = move
            formation_score = 0
            
            # Spacing quality
            spacing_quality = self._evaluate_spacing_quality(to_pos, teammates)
            formation_score += spacing_quality * 15
            
            # Move towards ball (but maintain spacing)
            distance_to_ball = to_pos.distance(ball_pos)
            if 2 <= distance_to_ball <= 4:  # Optimal support distance
                formation_score += 20
            
            # Gradual advancement
            if game.current_team == game.LEFT:
                formation_score += (to_pos.row - from_pos.row) * 3
            else:
                formation_score += (from_pos.row - to_pos.row) * 3
            
            if formation_score > best_formation_score:
                best_formation_score = formation_score
                best_move = move
        
        return best_move if best_move else random.choice(player_moves)
    
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
    
    def _calculate_team_spacing(self, players: List) -> float:
        """Calculate average spacing between teammates."""
        if len(players) <= 1:
            return 0.0
        
        total_distance = 0
        count = 0
        
        for i, p1 in enumerate(players):
            for p2 in players[i+1:]:
                total_distance += p1.position.distance(p2.position)
                count += 1
        
        return total_distance / count if count > 0 else 0.0
    
    def _evaluate_spacing_quality(self, pos, teammates: List) -> float:
        """Evaluate how well a position maintains optimal spacing."""
        if not teammates:
            return 0.0
        
        distances = [pos.distance(tm.position) for tm in teammates]
        avg_distance = sum(distances) / len(distances)
        
        # Optimal spacing is around 3.5-4.5
        deviation = abs(avg_distance - self.OPTIMAL_SPACING)
        
        # Score: 0 to 10 based on deviation
        return max(0, 10 - deviation * 2)
    
    def _get_adjacent_zones(self, zone_id: int) -> List[int]:
        """Get adjacent zones to a given zone."""
        adjacent = []
        
        # 3x3 grid adjacency
        row = zone_id // 3
        col = zone_id % 3
        
        for dr in [-1, 0, 1]:
            for dc in [-1, 0, 1]:
                if dr == 0 and dc == 0:
                    continue
                
                new_row = row + dr
                new_col = col + dc
                
                if 0 <= new_row < 3 and 0 <= new_col < 3:
                    adjacent.append(new_row * 3 + new_col)
        
        return adjacent
    
    def _is_between(self, pos, point_a, point_b) -> bool:
        """Check if position is roughly between two points (intercepts pass)."""
        # Simple check: is pos closer to midpoint than either endpoint?
        mid_row = (point_a.row + point_b.row) / 2
        mid_col = (point_a.col + point_b.col) / 2
        
        from position import Position
        midpoint = Position(int(mid_row), int(mid_col))
        
        dist_to_mid = pos.distance(midpoint)
        dist_a_to_mid = point_a.distance(midpoint)
        
        return dist_to_mid < dist_a_to_mid * 0.7
    
    def _is_clearing_kick(self, game, to_pos) -> bool:
        """Check if kick clears ball away from danger."""
        # If ball is in defensive zone, kick to middle/attack is clearing
        ball_pos = game.ball.position
        
        if game.current_team == game.LEFT:
            # Clear if moving ball from rows 0-5 to 6+
            return ball_pos.row < 6 and to_pos.row >= 6
        else:
            # Clear if moving ball from rows 9-14 to 8-
            return ball_pos.row > 8 and to_pos.row <= 8