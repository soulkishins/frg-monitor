import { Injectable } from '@angular/core';
import { CognitoUserPool, CognitoUser, AuthenticationDetails, CognitoUserSession, ClientMetadata, CognitoUserAttribute } from 'amazon-cognito-identity-js';
import { environment } from '../../../environment/environment';

@Injectable({
  providedIn: 'root'
})
export class CognitoService {
  private userPool: CognitoUserPool;
  private currentCognitoUser: CognitoUser | undefined = undefined;

  constructor() {
    this.userPool = new CognitoUserPool({
      UserPoolId: environment.userPoolId,
      ClientId: environment.clientId
    });
  }

  retrieveUser(): CognitoUser | null {
    return this.userPool.getCurrentUser();
  }

  retrieveSession(): Promise<CognitoUserSession> {
    const cognitoUser = this.userPool.getCurrentUser();

    if (!cognitoUser) {
      return Promise.reject('No user is currently logged in.');
    }

    return new Promise((resolve, reject) => {
      cognitoUser.getSession((err: any, session: any) => {
        if (err) {
          reject(err);
        } else if (session.isValid()) {
          resolve(session);
        } else {
          reject('Session is not valid.');
        }
      });
    });
  }

  login(username: string, password: string, rememberMe: boolean): Promise<CognitoUserSession> {
    const authenticationDetails = new AuthenticationDetails({
      Username: username,
      Password: password,
    });

    const userData = {
      Username: username,
      Pool: this.userPool
    };

    const cognitoUser = new CognitoUser(userData);
    this.currentCognitoUser = cognitoUser;

    return new Promise((resolve, reject) => {
      cognitoUser.authenticateUser(authenticationDetails, {
        onSuccess: (session) => {
          // Pega os tokens
          const idToken = session.getIdToken().getJwtToken();
          const refreshToken = session.getRefreshToken().getToken();

          if (rememberMe) {
            // Salva no localStorage para lembrar o usuário
            localStorage.setItem('cognitoIdToken', idToken);
            localStorage.setItem('cognitoRefreshToken', refreshToken);
          } else {
            // Salva no sessionStorage para expirar quando o navegador for fechado
            sessionStorage.setItem('cognitoIdToken', idToken);
            sessionStorage.setItem('cognitoRefreshToken', refreshToken);
          }
          resolve(session);
        },
        onFailure: (err) => reject(err),
        mfaRequired: (codeDeliveryDetails) => {
          // Notificar a UI que o MFA é necessário
          console.log('MFA necessário, código enviado para:', codeDeliveryDetails);
          reject({ mfaRequired: true, codeDeliveryDetails });
        }
      });
    });
  }

  verifyMfaCode(code: string, rememberMe: boolean): Promise<CognitoUserSession> {
    if (!this.currentCognitoUser) {
      return Promise.reject('Nenhum usuário em processo de autenticação.');
    }

    return new Promise((resolve, reject) => {
      if (!this.currentCognitoUser) {
        reject({'error': 'No User in current state.'});
        return;
      }
      this.currentCognitoUser.sendMFACode(code, {
        onSuccess: (session) => {
          // Pega os tokens
          const idToken = session.getIdToken().getJwtToken();
          const refreshToken = session.getRefreshToken().getToken();

          if (rememberMe) {
            // Salva no localStorage para lembrar o usuário
            localStorage.setItem('cognitoIdToken', idToken);
            localStorage.setItem('cognitoRefreshToken', refreshToken);
          } else {
            // Salva no sessionStorage para expirar quando o navegador for fechado
            sessionStorage.setItem('cognitoIdToken', idToken);
            sessionStorage.setItem('cognitoRefreshToken', refreshToken);
          }
          resolve(session);
        },
        onFailure: (err) => reject(err),
      });
    });
  }

  forgotPassword(username: string): Promise<void> {
    const userData = {
      Username: username,
      Pool: this.userPool
    };

    const cognitoUser = new CognitoUser(userData);

    return new Promise((resolve, reject) => {
      cognitoUser.forgotPassword({
        onSuccess: () => resolve(),
        onFailure: (err) => reject(err),
      });
    });
  }

  confirmPassword(username: string, verificationCode: string, newPassword: string): Promise<void> {
    const userData = {
      Username: username,
      Pool: this.userPool
    };

    const cognitoUser = new CognitoUser(userData);

    return new Promise((resolve, reject) => {
      cognitoUser.confirmPassword(verificationCode, newPassword, {
        onSuccess: () => resolve(),
        onFailure: (err) => reject(err),
      });
    });
  }

  signUp(username: string, password: string, attributes: CognitoUserAttribute[], clientAttributes?: ClientMetadata): Promise<any> {
    return new Promise((resolve, reject) => {
      this.userPool.signUp(username, password, attributes, [], (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      }, clientAttributes);
    });
  }

  confirmSignUp(username: string, verificationCode: string, clientAttributes?: ClientMetadata): Promise<any> {
    const userData = {
      Username: username,
      Pool: this.userPool
    };

    const cognitoUser = new CognitoUser(userData);

    return new Promise((resolve, reject) => {
      cognitoUser.confirmRegistration(verificationCode, false,
        (error: any, success: any) => {
          if (error)
            reject(error);
          else
            resolve(success)
      }, clientAttributes);
    });
  }

  resendCode(username: string, clientAttributes?: ClientMetadata): Promise<any> {
    const userData = {
      Username: username,
      Pool: this.userPool
    };

    const cognitoUser = new CognitoUser(userData);

    return new Promise((resolve, reject) => {
      cognitoUser.resendConfirmationCode(
        (error: any, success: any) => {
          if (error)
            reject(error);
          else
            resolve(success)
      }, clientAttributes);
    });
  }

  refreshSession(): Promise<CognitoUserSession> {
    const cognitoUser = this.userPool.getCurrentUser();

    if (!cognitoUser) {
      return Promise.reject('No user is currently logged in.');
    }

    return new Promise((resolve, reject) => {
      cognitoUser.getSession((err: any, session: any) => {
        if (err) {
          reject(err);
        } else if (session.isValid()) {
          cognitoUser.refreshSession(session.getRefreshToken(), (err, newSession) => {
            if (err) {
              reject(err);
            } else {
              resolve(newSession);
            }
          });
        } else {
          reject('Session is not valid.');
        }
      });
    });
  }

  restoreSession() {
    return new Promise((resolve, reject) => {
      const storedRefreshToken = localStorage.getItem('cognitoRefreshToken') || sessionStorage.getItem('cognitoRefreshToken');
      if (!storedRefreshToken) {
        return reject('Nenhuma sessão encontrada.');
      }

      const user = this.userPool.getCurrentUser();
      if (!user) {
        return reject('Usuário não encontrado.');
      }

      user.getSession((err: any, session: any) => {
        if (err) {
          console.error('Erro ao restaurar sessão:', err);
          return reject(err);
        }

        console.log('Sessão restaurada:', session);
        resolve(session);
      });
    });
  }

  logout(): void {
    const cognitoUser = this.userPool.getCurrentUser();
    if (cognitoUser) {
      cognitoUser.signOut();
      localStorage.removeItem('cognitoIdToken');
      localStorage.removeItem('cognitoRefreshToken');
      sessionStorage.removeItem('cognitoIdToken');
      sessionStorage.removeItem('cognitoRefreshToken');
    }
  }
}
