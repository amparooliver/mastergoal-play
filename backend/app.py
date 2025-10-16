"""
Mastergoal Web API - Main Flask Application
Handles game management and AI agent integration
"""

import os
import sys
import json
import uuid
import traceback
from datetime import datetime
from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.exceptions import BadRequest

# Add tournament system to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'tournament_system'))

# Import game manager and AI manager
from game_manager import GameManager
from ai_manager import AIManager
from config import Config

# Create Flask app
app = Flask(__name__)
app.config.from_object(Config)

# Configure CORS
CORS(app, resources={
    r"/api/*": {
        "origins": Config.ALLOWED_ORIGINS,
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})

# Initialize managers
game_manager = GameManager()
ai_manager = AIManager()

# Store active games (in production, use Redis or database)
active_games = {}

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint for monitoring"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.utcnow().isoformat(),
        'active_games': len(active_games)
    })

@app.route('/api/game/new', methods=['POST'])
def new_game():
    """Create a new game session"""
    try:
        data = request.json
        
        # Validate input
        level = data.get('level', 1)
        difficulty = data.get('difficulty', 'medium')
        player_color = data.get('playerColor', 'LEFT')
        timer_enabled = data.get('timerEnabled', False)
        timer_minutes = data.get('timerMinutes', 10)
        mode = data.get('mode', 'pve')  # 'pve' or 'pvp'
        max_turns_enabled = data.get('maxTurnsEnabled', False)
        max_turns = data.get('maxTurns')
        
        if level not in [1, 2, 3]:
            return jsonify({'error': 'Invalid level'}), 400
        
        if difficulty not in ['easy', 'medium', 'hard']:
            return jsonify({'error': 'Invalid difficulty'}), 400
        
        if player_color not in ['LEFT', 'RIGHT']:
            return jsonify({'error': 'Invalid player color'}), 400
        
        # Generate game ID
        game_id = str(uuid.uuid4())
        
        # Create game instance
        game = game_manager.create_game(level)
        
        # Initialize AI only for PvE mode
        ai_agent = None
        ai_color = None
        if mode == 'pve':
            ai_agent = ai_manager.get_agent(level, difficulty)
            ai_color = 'RIGHT' if player_color == 'LEFT' else 'LEFT'
        
        # Store game session
        active_games[game_id] = {
            'game': game,
            'ai_agent': ai_agent,
            'ai_color': ai_color,
            'player_color': player_color,
            'level': level,
            'difficulty': difficulty,
            'timer_enabled': timer_enabled,
            'timer_minutes': timer_minutes,
            'mode': mode,
            'max_turns_enabled': bool(max_turns_enabled),
            'max_turns': int(max_turns) if (max_turns_enabled and isinstance(max_turns, (int, float))) else None,
            'win_goals': 2,  # default: play to 2 goals unless overridden in future
            'start_time': datetime.utcnow().isoformat(),
            'move_history': [],
            'status': 'active'
        }
        
        # Get initial game state
        game_state = game_manager.get_game_state(game)
        
        return jsonify({
            'success': True,
            'gameId': game_id,
            'gameState': game_state,
            'playerColor': player_color,
            'aiColor': ai_color,
            'mode': mode,
            'maxTurnsEnabled': bool(max_turns_enabled),
            'maxTurns': active_games[game_id]['max_turns']
        })
        
    except Exception as e:
        app.logger.error(f"Error creating game: {str(e)}")
        return jsonify({'error': 'Failed to create game'}), 500

@app.route('/api/game/<game_id>/state', methods=['GET'])
def get_game_state(game_id):
    """Get current game state"""
    if game_id not in active_games:
        return jsonify({'error': 'Game not found'}), 404
    
    try:
        session = active_games[game_id]
        game = session['game']

        # If it's AI's turn when fetching state, let AI play now so the client sees the move
        last_ai_move_payload = None
        ai_moves = []
        if session.get('mode', 'pve') == 'pve' and session.get('ai_agent') is not None and game.current_team == session.get('ai_color'):
            ai_agent = session['ai_agent']
            chain_limit = 10
            while game.current_team == session['ai_color'] and chain_limit > 0:
                chain_limit -= 1
                ai_move = ai_manager.get_ai_move(ai_agent, game, session['ai_color'])
                if not ai_move:
                    break
                ai_move_type, ai_from_pos, ai_to_pos = ai_move
                success, _ = game_manager.execute_move(
                    game, ai_move_type,
                    {'row': ai_from_pos.row, 'col': ai_from_pos.col},
                    {'row': ai_to_pos.row, 'col': ai_to_pos.col}
                )
                if not success:
                    break
                last_ai_move_payload = {
                    'player': session['ai_color'],
                    'moveType': ai_move_type,
                    'from': {'row': ai_from_pos.row, 'col': ai_from_pos.col},
                    'to': {'row': ai_to_pos.row, 'col': ai_to_pos.col},
                    'timestamp': datetime.utcnow().isoformat()
                }
                session['move_history'].append(last_ai_move_payload)
                ai_moves.append(last_ai_move_payload)

                # Stop chaining if game ends
                game_status = game_manager.check_game_status(
                    game,
                    win_goals=session.get('win_goals'),
                    max_turns_enabled=session.get('max_turns_enabled', False),
                    max_turns=session.get('max_turns')
                )
                if game_status['ended']:
                    session['status'] = 'completed'
                    session['winner'] = game_status['winner']
                    break

        game_state = game_manager.get_game_state(game)
        
        return jsonify({
            'success': True,
            'gameState': game_state,
            'status': session['status'],
            'moveHistory': session['move_history'],
            'aiMoves': ai_moves,
            'lastAiMove': last_ai_move_payload
        })
        
    except Exception as e:
        app.logger.error(f"Error getting game state: {str(e)}")
        return jsonify({'error': 'Failed to get game state'}), 500

@app.route('/api/game/<game_id>/move', methods=['POST'])
def make_move(game_id):
    """Make a player move"""
    if game_id not in active_games:
        return jsonify({'error': 'Game not found'}), 404
    
    try:
        session = active_games[game_id]
        
        if session['status'] != 'active':
            return jsonify({'error': 'Game is not active'}), 400
        
        data = request.json
        move_type = data.get('moveType')  # 'move' or 'kick'
        from_pos = data.get('fromPos')  # {'row': x, 'col': y}
        to_pos = data.get('toPos')  # {'row': x, 'col': y}
        
        if not all([move_type, from_pos, to_pos]):
            return jsonify({'error': 'Invalid move data'}), 400
        
        # Enforce turn ownership: only the human player may call this endpoint
        game = session['game']
        if session.get('mode', 'pve') == 'pve':
            if game.current_team != session.get('player_color'):
                return jsonify({'error': 'Not your turn'}), 400
        
        # Execute player move
        # Snapshot pre-move for extra-turn detection and goal detection
        prev_team = game.current_team
        prev_turn = game.turn_count
        prev_level = game.level
        prev_left_goals = game.LEFT_goals
        prev_right_goals = game.RIGHT_goals

        success, message = game_manager.execute_move(
            game, move_type, from_pos, to_pos
        )
        
        if not success:
            return jsonify({
                'success': False,
                'error': message
            }), 400
        
        # Record move
        session['move_history'].append({
            'player': session['player_color'],
            'moveType': move_type,
            'from': from_pos,
            'to': to_pos,
            'timestamp': datetime.utcnow().isoformat()
        })

        # Detect if an extra turn was granted by special tile (level 3 rule)
        extra_turn = False
        try:
            if move_type == 'kick' and prev_level >= 3:
                # Import here to avoid circular import issues
                from position import Position as _Pos
                to_pos_obj = _Pos(to_pos['row'], to_pos['col'])
                # Use engine's helper to check if destination is a special tile for the moving team
                if game.is_special_tile(to_pos_obj, prev_team):
                    # If special tile was hit, rule grants an extra turn to the same team
                    # Depending on whether it was a pass, current_team may remain the same immediately,
                    # or be restored after internal end_turn handling. Either way, flag it.
                    extra_turn = True
        except Exception:
            extra_turn = False
        
        # Check game end with overrides
        win_goals = session.get('win_goals')
        max_turns_enabled = session.get('max_turns_enabled', False)
        max_turns = session.get('max_turns')
        game_status = game_manager.check_game_status(
            game,
            win_goals=win_goals,
            max_turns_enabled=max_turns_enabled,
            max_turns=max_turns
        )
        if game_status['ended']:
            session['status'] = 'completed'
            session['winner'] = game_status['winner']
            
            return jsonify({
                'success': True,
                'gameState': game_manager.get_game_state(game),
                'gameEnded': True,
                'winner': game_status['winner'],
                'extraTurn': extra_turn,
                'goalScored': 'LEFT' if game.LEFT_goals > prev_left_goals else ('RIGHT' if game.RIGHT_goals > prev_right_goals else None)
            })

        # If the player's move scored a goal, do NOT immediately trigger AI; let client show goal modal
        goal_scored = (game.LEFT_goals > prev_left_goals) or (game.RIGHT_goals > prev_right_goals)
        if goal_scored:
            return jsonify({
                'success': True,
                'gameState': game_manager.get_game_state(game),
                'gameEnded': False,
                'winner': None,
                'aiMoves': [],
                'lastAiMove': None,
                'extraTurn': extra_turn,
                'goalScored': 'LEFT' if game.LEFT_goals > prev_left_goals else 'RIGHT'
            })
        
        # AI turn: allow chained AI actions until turn passes or game ends
        ai_moves = []
        # Do not trigger AI if an extra turn (special tile) was granted to the human
        if game.current_team == session['ai_color'] and not extra_turn:
            ai_agent = session['ai_agent']
            # Safety cap to avoid infinite loops due to unexpected states
            chain_limit = 10
            while game.current_team == session['ai_color'] and chain_limit > 0:
                chain_limit -= 1
                ai_move = ai_manager.get_ai_move(ai_agent, game, session['ai_color'])
                if not ai_move:
                    break
                ai_move_type, ai_from_pos, ai_to_pos = ai_move
                success, _ = game_manager.execute_move(
                    game, ai_move_type,
                    {'row': ai_from_pos.row, 'col': ai_from_pos.col},
                    {'row': ai_to_pos.row, 'col': ai_to_pos.col}
                )
                if not success:
                    break
                payload = {
                    'player': session['ai_color'],
                    'moveType': ai_move_type,
                    'from': {'row': ai_from_pos.row, 'col': ai_from_pos.col},
                    'to': {'row': ai_to_pos.row, 'col': ai_to_pos.col},
                    'timestamp': datetime.utcnow().isoformat()
                }
                session['move_history'].append(payload)
                ai_moves.append(payload)
                game_status = game_manager.check_game_status(
                    game,
                    win_goals=win_goals,
                    max_turns_enabled=max_turns_enabled,
                    max_turns=max_turns
                )
                if game_status['ended']:
                    session['status'] = 'completed'
                    session['winner'] = game_status['winner']
                    break
        
        # Return updated state
        return jsonify({
            'success': True,
            'gameState': game_manager.get_game_state(game),
            'gameEnded': game_status['ended'],
            'winner': game_status.get('winner'),
            'aiMoves': ai_moves,
            'lastAiMove': ai_moves[-1] if ai_moves else None,
            'extraTurn': extra_turn,
            'goalScored': None
        })
        
    except Exception as e:
        app.logger.error(f"Error making move: {str(e)}\n{traceback.format_exc()}")
        return jsonify({'error': 'Failed to make move'}), 500

@app.route('/api/game/<game_id>/legal-moves', methods=['GET'])
def get_legal_moves(game_id):
    """Get all legal moves for current player"""
    if game_id not in active_games:
        return jsonify({'error': 'Game not found'}), 404
    
    try:
        session = active_games[game_id]
        game = session['game']
        
        legal_moves = game_manager.get_legal_moves(game)
        
        return jsonify({
            'success': True,
            'legalMoves': legal_moves,
            'currentTeam': game.current_team
        })
        
    except Exception as e:
        app.logger.error(f"Error getting legal moves: {str(e)}")
        return jsonify({'error': 'Failed to get legal moves'}), 500

@app.route('/api/game/<game_id>/restart', methods=['POST'])
def restart_game(game_id):
    """Restart a game with same settings"""
    if game_id not in active_games:
        return jsonify({'error': 'Game not found'}), 404
    
    try:
        session = active_games[game_id]
        
        # Create new game with same settings
        new_game = game_manager.create_game(session['level'])
        new_ai_agent = None
        if session.get('mode', 'pve') == 'pve':
            new_ai_agent = ai_manager.get_agent(session['level'], session['difficulty'])
        
        # Reset session
        session['game'] = new_game
        session['ai_agent'] = new_ai_agent
        session['move_history'] = []
        session['status'] = 'active'
        session['start_time'] = datetime.utcnow().isoformat()
        
        if 'winner' in session:
            del session['winner']
        
        return jsonify({
            'success': True,
            'gameState': game_manager.get_game_state(new_game)
        })
        
    except Exception as e:
        app.logger.error(f"Error restarting game: {str(e)}")
        return jsonify({'error': 'Failed to restart game'}), 500

@app.route('/api/agents', methods=['GET'])
def get_available_agents():
    """Get list of available AI agents by level and difficulty"""
    return jsonify({
        'agents': ai_manager.get_available_agents()
    })

@app.route('/api/statistics', methods=['GET'])
def get_statistics():
    """Get game statistics"""
    stats = {
        'totalGames': len(active_games),
        'activeGames': sum(1 for g in active_games.values() if g['status'] == 'active'),
        'completedGames': sum(1 for g in active_games.values() if g['status'] == 'completed'),
        'levelDistribution': {},
        'difficultyDistribution': {}
    }
    
    for session in active_games.values():
        level = f"level_{session['level']}"
        stats['levelDistribution'][level] = stats['levelDistribution'].get(level, 0) + 1
        
        diff = session['difficulty']
        stats['difficultyDistribution'][diff] = stats['difficultyDistribution'].get(diff, 0) + 1
    
    return jsonify(stats)

# Error handlers
@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    app.logger.error(f"Internal error: {str(error)}")
    return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    # For local development
    app.run(debug=True, host='0.0.0.0', port=5000)



