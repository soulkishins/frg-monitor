import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment/environment';
import { BrandResponse, BrandRequest } from '../models/brand.model';

@Injectable({
  providedIn: 'root'
})
export class BrandService {
  private readonly baseUrl = `${environment.api_url}/cliente`;

  constructor(private http: HttpClient) {}

  getBrands(clientId: string): Observable<BrandResponse[]> {
    const url = `${this.baseUrl}/${clientId}/marca`;
    return this.http.get<BrandResponse[]>(url);
  }

  getBrand(clientId: string, id: string): Observable<BrandResponse> {
    const url = `${this.baseUrl}/${clientId}/marca/${id}`;
    return this.http.get<BrandResponse>(url);
  }

  postBrand(clientId: string, brand: BrandRequest): Observable<BrandResponse> {
    const url = `${this.baseUrl}/${clientId}/marca`;
    return this.http.post<BrandResponse>(url, brand);
  }  

  putBrand(clientId: string, id: string, brand: BrandRequest): Observable<BrandResponse> {
    const url = `${this.baseUrl}/${clientId}/marca/${id}`;
    return this.http.put<BrandResponse>(url, brand);
  }

  deleteBrand(clientId: string, id: string): Observable<BrandResponse[]> {
    const url = `${this.baseUrl}/${clientId}/marca/${id}`;
    return this.http.delete<BrandResponse[]>(url);
  }

}
