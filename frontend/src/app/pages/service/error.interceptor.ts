import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
    return next(req).pipe(
        catchError((error: HttpErrorResponse) => {
            let errorMsg = 'Ocorreu um erro desconhecido!';

            if (error.status === 401) {
                errorMsg = 'Não autorizado. Faça login novamente!';
            } else if (error.status === 404) {
                errorMsg = 'Recurso não encontrado!';
            } else if (error.status === 500) {
                errorMsg = 'Erro interno do servidor!';
            }

            console.error(errorMsg);
            return throwError(() => new Error(errorMsg));
        })
    );
};
