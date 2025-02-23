import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment/environment';
import { CompanyResponse, Company, CompanyRequest } from '../../layout/models/company.model';

@Injectable({
  providedIn: 'root'
})
export class CompanyService {
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

  getClients(): Observable<CompanyResponse[]> {
    const clientHeaders = this.headers.set('operationId', 'client.list');
    return this.http.get<CompanyResponse[]>(this.baseUrl, { headers: clientHeaders });
  }

  getClient(id: string): Observable<CompanyResponse> {
    const clientHeaders = this.headers.set('operationId', 'client.read');
    return this.http.get<CompanyResponse>(`${this.baseUrl}/${id}`, { headers: clientHeaders });
  }

  postClient(client: CompanyRequest): Observable<CompanyResponse> {
    const clientHeaders = this.headers.set('operationId', 'client.create');
    return this.http.post<CompanyResponse>(`${this.baseUrl}`, client, { headers: clientHeaders });
  }  

  putClient(id: string, client: CompanyRequest): Observable<CompanyResponse> {
    const clientHeaders = this.headers.set('operationId', 'client.update');
    return this.http.put<CompanyResponse>(`${this.baseUrl}/${id}`, client, { headers: clientHeaders });
  }

  deleteClient(client: Company): Observable<CompanyResponse[]> {
    const clientHeaders = this.headers.set('operationId', 'client.delete');
    return this.http.delete<CompanyResponse[]>(`${this.baseUrl}/${client.id}`, { headers: clientHeaders });
  }

}
