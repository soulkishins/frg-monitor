import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment/environment';
import { BrandResponse, BrandRequest } from '../models/brand.model';

@Injectable({
  providedIn: 'root'
})
export class BrandService {
  private readonly baseUrl = `${environment.api_url}/marca`;

  constructor(private http: HttpClient) {}

  getBrands(): Observable<BrandResponse[]> {
    const url = `${this.baseUrl}`;
    return this.http.get<BrandResponse[]>(url);
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
