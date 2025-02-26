import { inject } from '@angular/core';
import { HttpInterceptorFn } from '@angular/common/http';
import { CognitoService } from './cognito.service';
import { from, switchMap } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {

    const cognitoService = inject(CognitoService);
    const token = cognitoService.retrieveSession();

    return from(token).pipe(
        switchMap(token => {
          const clonedRequest = req.clone({
            setHeaders: { Authorization: `Bearer ${token.getIdToken().getJwtToken()}` }
          });
          return next(clonedRequest);
        })
      );
}
