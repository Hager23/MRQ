import * as SecureStore from 'expo-secure-store';
// IMPORTANT: Replace this with your actual Replit app URL
const API_BASE_URL = 'https://your-replit-app.replit.dev';

interface TokenResponse {
  accessToken: string;
  refreshToken: string;
}

interface LoginResponse extends TokenResponse {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
  };
  client: {
    id: string;
    companyName: string;
    tier: string;
    hasCompletedOnboarding: boolean;
  };
}

class ApiClient {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  async init() {
    this.accessToken = await SecureStore.getItemAsync('accessToken');
    this.refreshToken = await SecureStore.getItemAsync('refreshToken');
  }

  async login(email: string, password: string): Promise<LoginResponse> {
    const res = await fetch(`${API_BASE_URL}/api/mobile/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || 'Login failed');
    }

    const data: LoginResponse = await res.json();
    await this.setTokens(data.accessToken, data.refreshToken);
    return data;
  }

  async logout() {
    this.accessToken = null;
    this.refreshToken = null;
    await SecureStore.deleteItemAsync('accessToken');
    await SecureStore.deleteItemAsync('refreshToken');
  }

  private async setTokens(access: string, refresh: string) {
    this.accessToken = access;
    this.refreshToken = refresh;
    await SecureStore.setItemAsync('accessToken', access);
    await SecureStore.setItemAsync('refreshToken', refresh);
  }

  private async refreshAccessToken(): Promise<boolean> {
    if (!this.refreshToken) return false;

    try {
      const res = await fetch(`${API_BASE_URL}/api/mobile/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: this.refreshToken }),
      });

      if (!res.ok) return false;

      const data: TokenResponse = await res.json();
      await this.setTokens(data.accessToken, data.refreshToken);
      return true;
    } catch {
      return false;
    }
  }

  async fetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    if (!this.accessToken) {
      throw new Error('Not authenticated');
    }

    const makeRequest = async (token: string) => {
      return fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          ...options.headers,
        },
      });
    };

    let res = await makeRequest(this.accessToken);
    if (res.status === 401) {
      const refreshed = await this.refreshAccessToken();
      if (refreshed && this.accessToken) {
        res = await makeRequest(this.accessToken);
      } else {
        await this.logout();
        throw new Error('Session expired');
      }
    }

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || 'Request failed');
    }

    return res.json();
  }

  isAuthenticated(): boolean {
    return !!this.accessToken;
  }
}

export const apiClient = new ApiClient();

export interface Lead {
  assignmentId: string;
  id: string;
  contactName: string;
  renovationType: string;
  region: string;
  projectDescription: string;
  stage: string;
  notes: string;
  isRevealed: boolean;
  contactPhone: string;
  contactEmail: string;
  createdAt: string;
}

export interface UserProfile {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  client: {
    id: string;
    companyName: string;
    tier: string;
    hasCompletedOnboarding: boolean;
  };
  credits: {
    allocated: number;
    used: number;
    remaining: number;
  };
}
