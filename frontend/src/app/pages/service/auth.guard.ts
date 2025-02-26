import { CanMatchFn } from '@angular/router';
import { CanActivateFn } from '@angular/router';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { CognitoUserSession } from 'amazon-cognito-identity-js';
import { CognitoService } from './cognito.service';

export const canMatchGuard: CanMatchFn = (route, segments) => {
  console.log('Guard | canMatchGuard Initiate');

  const router = inject(Router);
  const cognitoService = inject(CognitoService);

  return new Promise((resolve, reject) => {
    cognitoService
    .retrieveSession()
    .then(current => thenSession(current, cognitoService, router, resolve))
    .catch(() => catchAll(router, resolve));
  });
};

export const canActivateGuard: CanActivateFn = (route, state) => {
  console.log('Guard | canActivateGuard Initiate');

  const router = inject(Router);
  const cognitoService = inject(CognitoService);

  return new Promise((resolve, reject) => {
    cognitoService
    .retrieveSession()
    .then(current => thenSession(current, cognitoService, router, resolve))
    .catch(() => catchAll(router, resolve));
  });
};

function thenSession(current: CognitoUserSession, cognitoService: CognitoService, router: Router, resolve: any) {
  console.log('Guard | Has Current Session', current != null && current != undefined);
  if (!current) {
    router.navigate(['/auth/login']);
    resolve(false);
    return;
  }
  console.log('Guard | Validate Current Session', current.isValid);
  if (current.isValid()) {
    resolve(true);
    return;
  }
  cognitoService
  .refreshSession()
  .then(session => resolve(thenRefresh(session, router)))
  .catch(() => catchAll(router, resolve));
}

function thenRefresh(session: CognitoUserSession, router: Router): boolean {
  console.log('Guard | Validate Renew Session', session.isValid);
  if (!session.isValid()) {
    router.navigate(['/auth/login']);
    return false;
  }
  return true;
}

function catchAll(router: Router, resolve: any) {
  router.navigate(['/auth/login']);
  resolve(false);
}