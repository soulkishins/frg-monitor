import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { map, Observable, Subject } from 'rxjs';
import { environment } from '../../../environment/environment';
import { AdvertisementListDto, Advertisement, AdvertisementExport, AdvertisementHistory } from '../models/advertisement.model';
import { Page } from '../models/global.model';
import { CognitoService } from './cognito.service';

@Injectable({
  providedIn: 'root'
})
export class AdvertisementService {
  private readonly baseUrl = `${environment.api_url}/anuncio`;

  constructor(private http: HttpClient, private cognitoService: CognitoService) { }

  getAdvertisements(filters: {[param: string]: string | number}): Observable<Page<AdvertisementListDto>> {
    return this.http.get<Page<AdvertisementListDto>>(this.baseUrl, { params: filters });
  }

  getAdvertisement(id: string): Observable<Advertisement> {
    return this.http.get<Advertisement>(`${this.baseUrl}/${id}`);
  }

  getAdvertisementHistory(id: string): Observable<AdvertisementHistory[]> {
    return this.http.get<AdvertisementHistory[]>(`${this.baseUrl}/${id}/historico`);
  }

  updateStatusAdvertisements(ids: string[], status: string): Observable<void> {
    return this.http.patch<void>(`${this.baseUrl}`, { ids, status });
  }

  exportAdvertisements(key: string, ids?: string[]): Observable<AdvertisementExport> {
    let result: Subject<AdvertisementExport> = new Subject();
    this.cognitoService.retrieveSession()
      .then(session => {
        const user = session.getIdToken().payload['email'];
        if (!user) {
          result.error('Usuário não encontrado');
          result.complete();
          return;
        }
        const response = this.http.post<AdvertisementExport>(`${this.baseUrl}/exportacao`, {
          key, ids: ids || ['ALL'],
          user
        });
        response.subscribe(result);
      })
      .catch(err => {
        result.error(err);
        result.complete();
      });
    return result
  }

  getReport(file: string): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/relatorio/`, { responseType: 'blob', params: { file: file }, headers: { 'accept': 'application/octet-stream' } });
  }

  getReportStatus(file: string): Observable<string> {
    return this.http.head<void>(`${this.baseUrl}/exportacao/`, {observe: 'response', params: { key: file }})
    .pipe(
      map((response: HttpResponse<void>) => response.headers.get('x-export-status') || response.headers.get('X-Export-Status') || 'PENDING')
    );
  }

  getStatuses(all: boolean = false): { label: string, value: string, color?: string }[] {
    const statuses = [
        { label: 'Novo', value: 'NEW', color: 'info' },
        { label: 'Erro de Leitura', value: 'ERROR', color: 'danger' },
        { label: 'Para Denuciar', value: 'REPORT', color: 'warn' },
        { label: 'Denuciado', value: 'REPORTED', color: 'secondary' },
        { label: 'Revisão Manual', value: 'INVALIDATE', color: 'contrast' },
    ];
    if (all) {
      return [
        { label: 'Todos', value: 'ALL' },
        ...statuses
      ];
    }
    return statuses;
  }

  getActions(): { label: string, value: string }[] {
    return [
      { label: 'Anúncio Localizado', value: 'CRAWLER_CREATED' },
      { label: 'Anúncio Atualizado', value: 'CRAWLER_UPDATED' },
      { label: 'Marcado para Denúncia', value: 'USER_REPORT' },
      { label: 'Denúncia Exportada', value: 'USER_REPORTED' },
      { label: 'Denúncia Exportada Manual', value: 'USER_EXPORT' },
      { label: 'Revisão Manual', value: 'USER_INVALIDATE' },
    ];
  }

  getPhotoUrl(platform: string, platformID: string, photo: string): string {
    return `${environment.api_url}/anuncio/imagem?plataform=${platform}&plataform_id=${platformID}&file=${photo}`;
  }

}
