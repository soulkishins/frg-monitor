import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment/environment';
import { AdvertisementListDto, Advertisement } from '../models/advertisement.model';

@Injectable({
  providedIn: 'root'
})
export class AdvertisementService {
  private readonly baseUrl = `${environment.api_url}/anuncio`;

  constructor(private http: HttpClient) { }

  getAdvertisements(): Observable<AdvertisementListDto[]> {
    return this.http.get<AdvertisementListDto[]>(this.baseUrl);
  }

  getAdvertisement(id: string): Observable<Advertisement> {
    return this.http.get<Advertisement>(`${this.baseUrl}/${id}`);
  }

}
