import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment/environment';
import { BrandResponse, BrandRequest } from '../models/brand.model';
import { Page } from '../models/global.model';
@Injectable({
  providedIn: 'root'
})
export class BrandService {
  private readonly baseUrl = `${environment.api_url}/marca`;

  constructor(private http: HttpClient) {}

  getBrands(params?: { limit: number; offset: number; sort: string }): Observable<Page<BrandResponse>> {
    let url = this.baseUrl;
    
    if (params) {
      const queryParams = new URLSearchParams({
        limit: params.limit.toString(),
        offset: params.offset.toString(),
        sort: params.sort
      });
      url += `?${queryParams.toString()}`;
    }
    
    return this.http.get<Page<BrandResponse>>(url);
  }

  getBrand(id: string): Observable<BrandResponse> {
    const url = `${this.baseUrl}/${id}`;
    return this.http.get<BrandResponse>(url);
  }

  postBrand(brand: BrandRequest): Observable<BrandResponse> {
    const url = `${this.baseUrl}`;
    return this.http.post<BrandResponse>(url, brand);
  }  

  putBrand(id: string, brand: BrandRequest): Observable<BrandResponse> {
    const url = `${this.baseUrl}/${id}`;
    return this.http.put<BrandResponse>(url, brand);
  }

  deleteBrand(id: string): Observable<BrandResponse[]> {
    const url = `${this.baseUrl}/${id}`;
    return this.http.delete<BrandResponse[]>(url);
  }

}
