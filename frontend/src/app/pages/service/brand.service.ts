import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment/environment';
import { BrandResponse, Brand, BrandRequest } from '../../layout/models/brand.model';

@Injectable({
  providedIn: 'root'
})
export class BrandService {
  private readonly baseUrl = `${environment.api_url}/cliente`;
  private readonly headers: HttpHeaders;

  constructor(private http: HttpClient) {
    this.headers = new HttpHeaders({
      'Authorization': 'e.eyJzdWIiOiJjMzVjNmE1YS0zMDAxLTcwMjQtNjdkMC1kNWZiYzI4YzE2NmIiLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwiaXNzIjoiaHR0cHM6XC9cL2NvZ25pdG8taWRwLnNhLWVhc3QtMS5hbWF6b25hd3MuY29tXC9zYS1lYXN0LTFfM1FBM3NoZDBmIiwicGhvbmVfbnVtYmVyX3ZlcmlmaWVkIjpmYWxzZSwiY29nbml0bzp1c2VybmFtZSI6ImMzNWM2YTVhLTMwMDEtNzAyNC02N2QwLWQ1ZmJjMjhjMTY2YiIsIm9yaWdpbl9qdGkiOiJhNjQ0OTI4My1mMzdkLTRlZDMtYmY2YS04NzNlOTBhODhhNDEiLCJhdWQiOiI0dmJmYW82NzFiNHZyamxwbzdsOHU0N2xiYyIsImV2ZW50X2lkIjoiNTQyZjU0YjMtN2U4NC00YTZiLWFkZjgtZmI1N2RhNTQ3NTE0IiwidG9rZW5fdXNlIjoiaWQiLCJhdXRoX3RpbWUiOjE3MzkyMzMyOTgsIm5hbWUiOiJCcnVubyBBbnR1bmVzIiwicGhvbmVfbnVtYmVyIjoiKzU1MTE5MzMzMzQ1NjciLCJleHAiOjE3MzkyMzY4OTgsImlhdCI6MTczOTIzMzI5OCwianRpIjoiNGFhM2NkMmYtM2JmMy00YjdiLThmMzctYjVhNDEyNmE2ZmRkIiwiZW1haWwiOiJicnVuby5iYWNzQGdtYWlsLmNvbSJ9.u',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': '*',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
      'Content-Type': 'application/json'
    });
  }

  getBrands(clientId: string): Observable<BrandResponse[]> {
    const url = `${this.baseUrl}/${clientId}/marca`;
    return this.http.get<BrandResponse[]>(url, { headers: this.headers });
  }

  getBrand(clientId: string, id: string): Observable<BrandResponse> {
    const url = `${this.baseUrl}/${clientId}/marca/${id}`;
    return this.http.get<BrandResponse>(url, { headers: this.headers });
  }

  postBrand(clientId: string, brand: BrandRequest): Observable<BrandResponse> {
    const url = `${this.baseUrl}/${clientId}/marca`;
    return this.http.post<BrandResponse>(url, brand, { headers: this.headers });
  }  

  putBrand(clientId: string, id: string, brand: BrandRequest): Observable<BrandResponse> {
    const url = `${this.baseUrl}/${clientId}/marca/${id}`;
    return this.http.put<BrandResponse>(url, brand, { headers: this.headers });
  }

  deleteBrand(clientId: string, id: string): Observable<BrandResponse[]> {
    const url = `${this.baseUrl}/${clientId}/marca/${id}`;
    return this.http.delete<BrandResponse[]>(url, { headers: this.headers });
  }

}
