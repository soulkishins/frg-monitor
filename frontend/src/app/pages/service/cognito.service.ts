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

  login(username: string, password: string): Promise<CognitoUserSession> {
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
        onSuccess: (session) => resolve(session),
        onFailure: (err) => reject(err),
        mfaRequired: (codeDeliveryDetails) => {
          // Notificar a UI que o MFA é necessário
          console.log('MFA necessário, código enviado para:', codeDeliveryDetails);
          reject({ mfaRequired: true, codeDeliveryDetails });
        }
      });
    });
  }

  verifyMfaCode(code: string): Promise<CognitoUserSession> {
    if (!this.currentCognitoUser) {
      return Promise.reject('Nenhum usuário em processo de autenticação.');
    }

    return new Promise((resolve, reject) => {
      if (!this.currentCognitoUser) {
        reject({'error': 'No User in current state.'});
        return;
      }
      this.currentCognitoUser.sendMFACode(code, {
        onSuccess: (session) => resolve(session),
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

  logout(): void {
    const cognitoUser = this.userPool.getCurrentUser();
    if (cognitoUser) {
      cognitoUser.signOut();
    }
  }
}
