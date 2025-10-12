#!/usr/bin/env python3
"""
Main Tournament Runner Script
Run round-robin tournaments for Mastergoal agents across different levels.

Usage:
    python run_tournament.py --level 1 --games 10
    python run_tournament.py --level 2 --games 20 --output custom_results
    python run_tournament.py --quick-test
"""

import argparse
import sys
from pathlib import Path

# CRÍTICO: Añadir directorio actual al path para imports
sys.path.insert(0, str(Path(__file__).parent))

# Imports del sistema (sin puntos relativos)
from tournament.manager import TournamentManager
from agents.alphazero_agent import AlphaZeroAgent
from agents.mcts_minimax_random import MCTSStandardAgent, MinimaxAgent, RandomAgent
from agents.heuristic_agent import HeuristicAgent
from agents.heuristic_agent_level2 import HeuristicAgentLevel2
from agents.heuristic_agent_level2_territorial import HeuristicTerritorialControl


def register_level1_agents(manager: TournamentManager):
    """Register agents for Level 1 tournament."""
    print("\nRegistering Level 1 agents...")
    
    # AlphaZero Agent
   # try:
       # az_agent = AlphaZeroAgent(
         #   name="AlphaZero17_02_L1",
          #  level=1,
           # checkpoint_path=r"C:\Users\Amparo\Documents\AAA-TESTING-AGENTS\tournament-system-Mastergoal\best.pth.tar",  # ACTUALIZAR RUTA
          #  num_mcts_sims=200,
          # cpuct=2.0,
           # temp=0.0
        #)
       # manager.register_agent(
          # agent=az_agent,
          #  agent_type="alphazero",
          #  config={
          #      'num_mcts_sims': 400,
          #      'cpuct': 2.0,
           #     'temperature': 0.0
           # },
            #description="AlphaZero with 400 MCTS simulations"
        #)
    #except Exception as e:
        #print(f"Warning: Failed to register AlphaZero: {e}")

    try:
        az_agent = AlphaZeroAgent(
            name="AlphaZero12_03_L1",
            level=1,
            checkpoint_path=r"C:\Users\Amparo\Documents\AAA-TESTING-AGENTS\tournament-system-Mastergoal\12_03\best.pth.tar",  # ACTUALIZAR RUTA
            num_mcts_sims=400,
            cpuct=2.0,
            temp=0.0
        )
        manager.register_agent(
            agent=az_agent,
            agent_type="alphazero",
            config={
                'num_mcts_sims': 400,
                'cpuct': 2.0,
                'temperature': 0.0
            },
            description="AlphaZero with 400 MCTS simulations"
        )
    except Exception as e:
        print(f"Warning: Failed to register AlphaZero: {e}")
    
    # MCTS Agent
  #  try:
     #   mcts_agent = MCTSStandardAgent(
    #        name="MCTS_L1",
     #       level=1,
      #      iterations=400,
      #      exploration_constant=2.0,
      #      num_threads=2,
      #      use_opening_book=True
     #   )
     #   manager.register_agent(
     #       agent=mcts_agent,
     #       agent_type="mcts",
     #       config={
     #           'iterations': 400,
     #           'exploration_constant': 2.0,
     #           'num_threads': 2,
     #           'use_opening_book': True
     #       },
     #       description="MCTS with 400 iterations, UCT selection"
     #   )
   # except Exception as e:
     #   print(f"Warning: Failed to register MCTS: {e}")
    
    # Minimax Agent (Evolutionary)
   # try:
    #    minimax_agent = MinimaxAgent(
    #        name="M1P2",
   #         level=1,
    #        weights_file=r"C:\Users\Amparo\Documents\AAA-TESTING-AGENTS\tournament-system-Mastergoal\weights\M1P2.json",  # ACTUALIZAR RUTA
  #          depth=None  # Will be loaded from file
   #     )
    #    manager.register_agent(
     #       agent=minimax_agent,
      #      agent_type="minimax",
      #      config={
      #          'weights_source': 'evolutionary',
      #          'depth': minimax_agent.depth
      #      },
      #      description="M1P2"
     #   )
    #except Exception as e:
     #   print(f"Warning: Failed to register Minimax: {e}")

    try:
        minimax_agent = MinimaxAgent(
            name="M1P3",
            level=1,
            weights_file=r"C:\Users\Amparo\Documents\AAA-TESTING-AGENTS\tournament-system-Mastergoal\weights\M1P3.json",  # ACTUALIZAR RUTA
            depth=None  # Will be loaded from file
        )
        manager.register_agent(
            agent=minimax_agent,
            agent_type="minimax",
            config={
                'weights_source': 'evolutionary',
                'depth': minimax_agent.depth
            },
            description="M1P3"
        )
    except Exception as e:
        print(f"Warning: Failed to register Minimax: {e}")
    
    # Heuristic Agent
    try:
        heuristic_agent = HeuristicAgent(
            name="Heuristic_L1",
            level=1
        )
        manager.register_agent(
            agent=heuristic_agent,
            agent_type="heuristic",
            config={},
            description="Rule-based heuristic agent"
        )
    except Exception as e:
        print(f"Warning: Failed to register Heuristic: {e}")
    
    # Random Agent
  #  try:
     #   random_agent = RandomAgent(
     #       name="Random_L1",
     #       level=1
      #  )
       # manager.register_agent(
      #      agent=random_agent,
      #      agent_type="random",
      #      config={},
      #      description="Random move selection baseline"
     #   )
  #  except Exception as e:
    #    print(f"Warning: Failed to register Random: {e}")


def register_level2_agents(manager: TournamentManager):
    """Register agents for Level 2 tournament."""
    print("\nRegistering Level 2 agents...")
        
    # Minimax Agents (different depths/weights)
    minimax_configs = [
        ("Minimax_D3_L2", r"C:\Users\Amparo\Documents\AAA-TESTING-AGENTS\tournament-system-Mastergoal\weights\M2P3.json")
    ]
    
    for name, weights_file in minimax_configs:
        try:
            minimax_agent = MinimaxAgent(
                name=name,
                level=2,
                weights_file=weights_file
            )
            manager.register_agent(
                agent=minimax_agent,
                agent_type="minimax",
                config={'depth': minimax_agent.depth},
                description=f"Minimax depth {minimax_agent.depth}"
            )
        except Exception as e:
            print(f"Warning: Failed to register {name}: {e}")
    
    # Random Agent
    try:
        random_agent = RandomAgent(
            name="Random_L2",
            level=2
        )
        manager.register_agent(
            agent=random_agent,
            agent_type="random",
            config={},
            description="Random baseline"
        )
    except Exception as e:
        print(f"Warning: Failed to register Random: {e}")

    try:
            heuristic_agent = HeuristicAgentLevel2(
                name="HeuristicAdvanced_L2",
                level=2,
                advanced=True
            )
            manager.register_agent(
                agent=heuristic_agent,
                agent_type="heuristic",
                config={'advanced': True},
                description="Advanced multi-factor heuristic with weighted scoring"
            )
            print("  ✓ Registered HeuristicAdvanced_L2")
    except Exception as e:
        print(f"Warning: Failed to register Heuristic Advanced: {e}")

    # Territorial Control Agent - High Pressure
    try:
        
        territorial_high = HeuristicTerritorialControl(
            name="Territorial_High_L2",
            level=2,
            pressure_intensity="high"
        )
        manager.register_agent(
            agent=territorial_high,
            agent_type="heuristic",
            config={
                'strategy': 'territorial_control',
                'pressure_intensity': 'high',
                'zones': '3x3_grid'
            },
            description="Territorial control with high-pressure gegenpressing"
        )
        print("  ✓ Registered Territorial_High_L2")
    except Exception as e:
        print(f"Warning: Failed to register Territorial High Pressure: {e}")


def register_level3_agents(manager: TournamentManager):
    """Register agents for Level 3 tournament."""
    print("\nRegistering Level 3 agents...")

    
    minimax_configs = [
        ("Minimax_D3_L3", r"C:\Users\Amparo\Documents\AAA-TESTING-AGENTS\tournament-system-Mastergoal\weights\M3P3.json")
    ]
    
    for name, weights_file in minimax_configs:
        try:
            minimax_agent = MinimaxAgent(
                name=name,
                level=3,
                weights_file=weights_file
            )
            manager.register_agent(
                agent=minimax_agent,
                agent_type="minimax",
                config={'depth': minimax_agent.depth},
                description=f"Minimax depth {minimax_agent.depth}"
            )
        except Exception as e:
            print(f"Warning: Failed to register {name}: {e}")
    
        # Role-Based - Defensive
    try:
        from agents.heuristics_roles_l3 import HeuristicRoleBased
        
        role_defensive = HeuristicRoleBased(
            name="RoleBased_Defensive_L3",
            level=3,
            playstyle="defensive"
        )
        manager.register_agent(
            agent=role_defensive,
            agent_type="heuristic",
            config={
                'strategy': 'role_based',
                'playstyle': 'defensive',
                'roles': '5_players_with_goalkeeper'
            },
            description="Role-based coordination with defensive playstyle"
        )
        print("  ✓ Registered RoleBased_Defensive_L3")
    except Exception as e:
        print(f"Warning: Failed to register RoleBased Defensive: {e}")
    
    # Role-Based - Balanced
    try:
        from agents.heuristics_roles_l3 import HeuristicRoleBased
        
        role_balanced = HeuristicRoleBased(
            name="RoleBased_Balanced_L3",
            level=3,
            playstyle="balanced"
        )
        manager.register_agent(
            agent=role_balanced,
            agent_type="heuristic",
            config={
                'strategy': 'role_based',
                'playstyle': 'balanced',
                'roles': '5_players_with_goalkeeper'
            },
            description="Role-based coordination with balanced playstyle"
        )
        print("  ✓ Registered RoleBased_Balanced_L3")
    except Exception as e:
        print(f"Warning: Failed to register RoleBased Balanced: {e}")
    
    # Role-Based - Offensive
    try:
        from agents.heuristics_roles_l3 import HeuristicRoleBased
        
        role_offensive = HeuristicRoleBased(
            name="RoleBased_Offensive_L3",
            level=3,
            playstyle="offensive"
        )
        manager.register_agent(
            agent=role_offensive,
            agent_type="heuristic",
            config={
                'strategy': 'role_based',
                'playstyle': 'offensive',
                'roles': '5_players_with_goalkeeper'
            },
            description="Role-based coordination with offensive playstyle"
        )
        print("  ✓ Registered RoleBased_Offensive_L3")
    except Exception as e:
        print(f"Warning: Failed to register RoleBased Offensive: {e}")
    
    # ===== NEW: Triangle Formation Agents =====
    
    # Triangle Formation - Compact
    try:
        from agents.heuristic_triangle_l3 import HeuristicTriangleFormation
        
        triangle_compact = HeuristicTriangleFormation(
            name="Triangle_Compact_L3",
            level=3,
            triangle_style="compact"
        )
        manager.register_agent(
            agent=triangle_compact,
            agent_type="heuristic",
            config={
                'strategy': 'triangle_formation',
                'style': 'compact',
                'ideal_distance': 3.0
            },
            description="Triangle formation with compact spacing"
        )
        print("  ✓ Registered Triangle_Compact_L3")
    except Exception as e:
        print(f"Warning: Failed to register Triangle Compact: {e}")
    
    # Triangle Formation - Fluid
    try:
        from agents.heuristic_triangle_l3 import HeuristicTriangleFormation
        
        triangle_fluid = HeuristicTriangleFormation(
            name="Triangle_Fluid_L3",
            level=3,
            triangle_style="fluid"
        )
        manager.register_agent(
            agent=triangle_fluid,
            agent_type="heuristic",
            config={
                'strategy': 'triangle_formation',
                'style': 'fluid',
                'ideal_distance': 4.0
            },
            description="Triangle formation with fluid spacing"
        )
        print("  ✓ Registered Triangle_Fluid_L3")
    except Exception as e:
        print(f"Warning: Failed to register Triangle Fluid: {e}")
    
    # Triangle Formation - Wide
    try:
        from agents.heuristic_triangle_l3 import HeuristicTriangleFormation
        
        triangle_wide = HeuristicTriangleFormation(
            name="Triangle_Wide_L3",
            level=3,
            triangle_style="wide"
        )
        manager.register_agent(
            agent=triangle_wide,
            agent_type="heuristic",
            config={
                'strategy': 'triangle_formation',
                'style': 'wide',
                'ideal_distance': 5.0
            },
            description="Triangle formation with wide spacing"
        )
        print("  ✓ Registered Triangle_Wide_L3")
    except Exception as e:
        print(f"Warning: Failed to register Triangle Wide: {e}")
    
    # Random Agent
    try:
        random_agent = RandomAgent(
            name="Random_L3",
            level=3
        )
        manager.register_agent(
            agent=random_agent,
            agent_type="random",
            config={},
            description="Random baseline"
        )
    except Exception as e:
        print(f"Warning: Failed to register Random: {e}")


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(description='Run Mastergoal Tournament')
    
    parser.add_argument('--level', type=int, choices=[1, 2, 3],
                       help='Game level (1, 2, or 3)')
    parser.add_argument('--games', type=int, default=10,
                       help='Games per matchup (must be even, default: 10)')
    parser.add_argument('--time-limit', type=float, default=100.0,
                       help='Time limit per move in seconds (default: 60)')
    parser.add_argument('--max-moves', type=int, default=200,
                       help='Maximum moves per game (default: 200)')
    parser.add_argument('--output', type=str, default='tournament_results',
                       help='Output directory (default: tournament_results)')
    parser.add_argument('--quick-test', action='store_true',
                       help='Quick test mode (4 games, level 1)')
    parser.add_argument('--all-levels', action='store_true',
                       help='Run tournaments for all levels')
    
    args = parser.parse_args()
    
    # Quick test mode
    if args.quick_test:
        print("\n" + "="*80)
        print("QUICK TEST MODE")
        print("="*80)
        args.level = 1
        args.games = 4
        args.output = 'test_results'
    
    # Validate games per matchup
    if args.games % 2 != 0:
        print(f"Error: games must be even (got {args.games})")
        print(f"Setting to {args.games + 1}")
        args.games += 1
    
    # Run tournament for specified levels
    if args.all_levels:
        levels = [1, 2, 3]
    elif args.level:
        levels = [args.level]
    else:
        print("Error: Must specify --level or --all-levels")
        sys.exit(1)
    
    for level in levels:
        print("\n" + "="*80)
        print(f"STARTING LEVEL {level} TOURNAMENT")
        print("="*80)
        
        # Create tournament manager
        manager = TournamentManager(
            level=level,
            games_per_matchup=args.games,
            time_limit_per_move=args.time_limit,
            max_moves_per_game=args.max_moves,
            output_dir=args.output
        )
        
        # Register agents based on level
        if level == 1:
            register_level1_agents(manager)
        elif level == 2:
            register_level2_agents(manager)
        elif level == 3:
            register_level3_agents(manager)
        
        # Check if we have enough agents
        if len(manager.agents) < 2:
            print(f"Error: Need at least 2 agents for level {level}, only {len(manager.agents)} registered")
            continue
        
        # Run tournament
        try:
            results = manager.run_tournament()
            print(f"\n✓ Level {level} tournament completed successfully!")
            print(f"  Results saved to: {manager.output_dir}")
        except Exception as e:
            print(f"\n✗ Error running level {level} tournament: {e}")
            import traceback
            traceback.print_exc()
            continue
    
    print("\n" + "="*80)
    print("ALL TOURNAMENTS COMPLETED")
    print("="*80)


if __name__ == "__main__":
    main()