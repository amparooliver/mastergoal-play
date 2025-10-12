"""
Game Manager - Handles game state and move execution
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'tournament_system'))

from mastergoalGame import MastergoalGame
from position import Position


class GameManager:
    """Manages game instances and state"""
    
    def create_game(self, level):
        """Create a new game instance"""
        return MastergoalGame(level)
    
    def get_game_state(self, game):
        """Get current game state in JSON-serializable format"""
        # Get basic game state
        state = game.get_game_state()
        
        # Convert to frontend-friendly format
        players = []
        for team, player_id, row, col, is_goalkeeper in state['players']:
            players.append({
                'team': team,
                'id': player_id,
                'position': {'row': row, 'col': col},
                'isGoalkeeper': is_goalkeeper
            })
        
        # Get legal moves for current player
        legal_moves = []
        raw_moves = game.get_legal_moves()
        
        for move in raw_moves:
            move_type, from_pos, to_pos = move
            legal_moves.append({
                'type': move_type,
                'from': {'row': from_pos.row, 'col': from_pos.col},
                'to': {'row': to_pos.row, 'col': to_pos.col}
            })
        
        return {
            'level': state['level'],
            'currentTeam': state['current_team'],
            'score': {
                'LEFT': state['LEFT_goals'],
                'RIGHT': state['RIGHT_goals']
            },
            'ball': {
                'row': state['ball_position'][0],
                'col': state['ball_position'][1]
            },
            'players': players,
            'passesCount': state['passes_count'],
            'turnCount': state['turn_count'],
            'skipNextTurn': state['skip_next_turn'],
            'legalMoves': legal_moves,
            'boardDimensions': {
                'rows': game.ROWS,
                'cols': game.COLS
            }
        }
    
    def execute_move(self, game, move_type, from_pos_dict, to_pos_dict):
        """
        Execute a move on the game
        Returns (success, message)
        """
        try:
            # Convert position dicts to Position objects
            from_pos = Position(from_pos_dict['row'], from_pos_dict['col'])
            to_pos = Position(to_pos_dict['row'], to_pos_dict['col'])
            
            # Check if move is legal
            legal_moves = game.get_legal_moves()
            move = (move_type, from_pos, to_pos)
            
            if move not in legal_moves:
                return False, "Illegal move"
            
            # Execute the move
            if move_type == 'move':
                result = game.execute_move(from_pos, to_pos)
            else:  # kick
                result = game.execute_kick(to_pos)
            
            if result:
                return True, "Move executed successfully"
            else:
                return False, "Move execution failed"
                
        except Exception as e:
            return False, f"Error executing move: {str(e)}"
    
    def check_game_status(self, game):
        """Check if game has ended and who won"""
        result = game.is_game_over()
        
        if result == 1:  # LEFT won
            return {'ended': True, 'winner': 'LEFT'}
        elif result == -1:  # RIGHT won
            return {'ended': True, 'winner': 'RIGHT'}
        elif result == 0.1:  # Draw
            return {'ended': True, 'winner': 'DRAW'}
        else:
            return {'ended': False, 'winner': None}
    
    def get_legal_moves(self, game):
        """Get all legal moves in frontend format"""
        legal_moves = []
        raw_moves = game.get_legal_moves()
        
        for move in raw_moves:
            move_type, from_pos, to_pos = move
            legal_moves.append({
                'type': move_type,
                'from': {'row': from_pos.row, 'col': from_pos.col},
                'to': {'row': to_pos.row, 'col': to_pos.col}
            })
        
        return legal_moves