const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

class GameAPI {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('API Request failed:', error);
      throw error;
    }
  }

  // Game endpoints
  async createGame(config) {
    return this.request('/api/game/new', {
      method: 'POST',
      body: JSON.stringify(config),
    });
  }

  async getGameState(gameId) {
    return this.request(`/api/game/${gameId}/state`);
  }

  async makeMove(gameId, move) {
    return this.request(`/api/game/${gameId}/move`, {
      method: 'POST',
      body: JSON.stringify(move),
    });
  }

  async getLegalMoves(gameId) {
    return this.request(`/api/game/${gameId}/legal-moves`);
  }

  async restartGame(gameId) {
    return this.request(`/api/game/${gameId}/restart`, {
      method: 'POST',
    });
  }

  async getStatistics() {
    return this.request('/api/statistics');
  }

  async getAvailableAgents() {
    return this.request('/api/agents');
  }
}

export default new GameAPI();