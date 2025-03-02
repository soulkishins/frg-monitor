import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment/environment';
import { AdvertisementListDto, Advertisement } from '../models/advertisement.model';
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

}
