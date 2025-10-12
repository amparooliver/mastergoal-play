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
      
      // Check if response is ok before parsing
      if (!response.ok) {
        let errorMessage = `API Error: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          // If parsing error response fails, use default message
        }
        throw new Error(errorMessage);
      }
      
      // Check if response has content before parsing JSON
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      } else {
        return null;
      }
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
    return this.request(`/api/game/${gameId}/state`, {
      method: 'GET',
    });
  }

  async makeMove(gameId, move) {
    return this.request(`/api/game/${gameId}/move`, {
      method: 'POST',
      body: JSON.stringify(move),
    });
  }

  async getLegalMoves(gameId) {
    return this.request(`/api/game/${gameId}/legal-moves`, {
      method: 'GET',
    });
  }

  async restartGame(gameId) {
    return this.request(`/api/game/${gameId}/restart`, {
      method: 'POST',
    });
  }

  async getStatistics() {
    return this.request('/api/statistics', {
      method: 'GET',
    });
  }

  async getAvailableAgents() {
    return this.request('/api/agents', {
      method: 'GET',
    });
  }

  // Health check endpoint
  async healthCheck() {
    return this.request('/api/health', {
      method: 'GET',
    });
  }
}

export default new GameAPI();