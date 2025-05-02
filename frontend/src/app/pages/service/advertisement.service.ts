import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { map, Observable, Subject } from 'rxjs';
import { environment } from '../../../environment/environment';
import { AdvertisementListDto, Advertisement, AdvertisementExport, AdvertisementHistory, AdvertisementProduct, AdvertisementProductPostRequest, AdvertisementProductPutRequest, AdvertisementProductHistoryPostRequest } from '../models/advertisement.model';
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

  qualifyAdvertisements(params: {advertisements: string[], scheduler_id: string, scheduler_date: string, ai: boolean}): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/qualificar`, params);
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
        { label: 'Para Revisão', value: 'MANUAL', color: 'contrast' },
        { label: 'Revisado', value: 'REVIEWED', color: 'contrast' },
        { label: 'Invalidado', value: 'INVALIDATE', color: 'contrast' },
        { label: 'Inserido', value: 'INSERTED', color: 'info' },
        { label: 'Atualizado', value: 'UPDATED', color: 'info' },
        { label: 'Excluído', value: 'DELETED', color: 'danger' },
        { label: 'Marcado Localizado', value: 'AR', color: 'info' },
        { label: 'Marcado Não Localizado', value: 'NR', color: 'info' },
        { label: 'Automático', value: 'AI', color: 'info' },
        { label: 'Inclusão Manual', value: 'MI', color: 'info' },
        { label: 'Marcado Conciliação Manual', value: 'MR', color: 'info' },
        { label: 'Marcado Erro', value: 'ER', color: 'danger' },
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
      { label: 'Anúncio Em Revisão', value: 'USER_MANUAL' },
      { label: 'Anúncio Revisado', value: 'USER_REVIEWED' },
      { label: 'Anúncio Invalidado', value: 'USER_INVALIDATE' },
      { label: 'Denúncia Exportada Manual', value: 'USER_EXPORT' },
      { label: 'Anúncio Conciliado', value: 'CRAWLER_RECONCILE' },
    ];
  }

  getPhotoUrl(platform: string, platformID: string, photo: string): string {
    return `${environment.api_url}/anuncio/imagem?plataform=${platform}&plataform_id=${platformID}&file=${photo}`;
  }

  postAdvertisementProduct(id: string, params: AdvertisementProductPostRequest): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/${id}/produto`, params);
  }

  getAdvertisementProduct(id: string): Observable<Page<AdvertisementProduct>> {
    return this.http.get<Page<AdvertisementProduct>>(`${this.baseUrl}/${id}/produto`);
  }

  putAdvertisementProduct(id: string, id_product: string, varity_seq: string, params: AdvertisementProductPutRequest): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/${id}/produto/${id_product}/variedade/${varity_seq}`, params);
  }

  deleteAdvertisementProduct(id: string, id_product: string, varity_seq: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}/produto/${id_product}/variedade/${varity_seq}`);
  }

  postAdvertisementProductHistory(id: string, params: AdvertisementProductHistoryPostRequest): Observable<void> {
    return this.http.patch<void>(`${this.baseUrl}/${id}/produto`, params);
  }
}
