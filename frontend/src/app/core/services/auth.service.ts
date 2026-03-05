import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AuthService {

  private resolveToken(): string {
    return localStorage.getItem('jwt')
        || localStorage.getItem('token')
        || localStorage.getItem('access_token')
        || localStorage.getItem('authToken')
        || localStorage.getItem('id_token')
        || sessionStorage.getItem('jwt')
        || sessionStorage.getItem('token')
        || sessionStorage.getItem('access_token')
        || '';
  }

  private decode(): any {
    const token = this.resolveToken();
    if (!token) {
      console.warn('[AuthService] ⚠️ Aucun token trouvé dans le storage');
      return {};
    }
    try {
      const payload = token.split('.')[1];
      return JSON.parse(atob(payload));
    } catch {
      console.error('[AuthService] ⚠️ Échec du décodage du token');
      return {};
    }
  }

  getUserId(): string {
    const p = this.decode();
    const id = p?.userId || p?.id || p?.sub || '';
    console.log('[AuthService] getUserId =', id, '| payload complet =', p);
    return id;
  }

  getUserName(): string {
    const p = this.decode();
    const firstName = p?.firstName || '';
    const lastName  = p?.lastName  || '';
    const fullName  = (firstName + ' ' + lastName).trim();
    return fullName || p?.name || p?.preferred_username || p?.username || 'Utilisateur Inconnu';
  }

  getUserImage(): string {
    const p = this.decode();
    return p?.image || p?.picture || p?.avatar || '/assets/images/users/user-dummy-img.jpg';
  }

  getToken(): string {
    return this.resolveToken();
  }

  isLoggedIn(): boolean {
    return !!this.resolveToken();
  }
}
