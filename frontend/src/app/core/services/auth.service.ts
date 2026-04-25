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
    if (fullName) return fullName;
    if (p?.name && p.name !== 'Utilisateur Inconnu') return p.name;
    if (p?.preferred_username) return p.preferred_username;
    if (p?.username) return p.username;
    // ✅ FIX: utiliser la partie avant @ du sub (email) comme fallback
    const sub = p?.sub || '';
    if (sub) return sub.includes('@') ? sub.split('@')[0] : sub;
    return 'Utilisateur';
  }

  getUserImage(): string {
    const p = this.decode();
    return p?.image || p?.picture || p?.avatar || '';
  }

  getToken(): string {
    return this.resolveToken();
  }

  isLoggedIn(): boolean {
    return !!this.resolveToken();
  }
}
