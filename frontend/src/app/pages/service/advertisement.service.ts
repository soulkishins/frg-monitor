import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment/environment';
import { AdvertisementListDto, Advertisement, AdvertisementExport } from '../models/advertisement.model';
import { Page } from '../models/global.model';

@Injectable({
  providedIn: 'root'
})
export class AdvertisementService {
  private readonly baseUrl = `${environment.api_url}/anuncio`;

  constructor(private http: HttpClient) { }

  getAdvertisements(filters: {[param: string]: string | number}): Observable<Page<AdvertisementListDto>> {
    return this.http.get<Page<AdvertisementListDto>>(this.baseUrl, { params: filters });
  }

  getAdvertisement(id: string): Observable<Advertisement> {
    return this.http.get<Advertisement>(`${this.baseUrl}/${id}`);
  }

  reportAdvertisements(ids: string[], status: string): Observable<void> {
    return this.http.patch<void>(`${this.baseUrl}`, { ids, status });
  }

  exportAdvertisements(ids?: string[]): Observable<AdvertisementExport> {
    if (ids) {
      return this.http.post<AdvertisementExport>(`${this.baseUrl}/export`, { ids });
    }
    return this.http.get<AdvertisementExport>(`${this.baseUrl}/export`);
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

}
