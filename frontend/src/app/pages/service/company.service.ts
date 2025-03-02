import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment/environment';
import { CompanyResponse, Company, CompanyRequest } from '../models/company.model';
import { Page } from '../models/global.model';

@Injectable({
  providedIn: 'root'
})
export class CompanyService {
  private readonly baseUrl = `${environment.api_url}/cliente`;

  constructor(private http: HttpClient) { }

  getClients(): Observable<Page<CompanyResponse>> {
    return this.http.get<Page<CompanyResponse>>(this.baseUrl);
  }

  getClient(id: string): Observable<CompanyResponse> {
    return this.http.get<CompanyResponse>(`${this.baseUrl}/${id}`);
  }

  postClient(client: CompanyRequest): Observable<CompanyResponse> {
    return this.http.post<CompanyResponse>(`${this.baseUrl}`, client);
  }  

  putClient(id: string, client: CompanyRequest): Observable<CompanyResponse> {
    return this.http.put<CompanyResponse>(`${this.baseUrl}/${id}`, client);
  }

  deleteClient(client: Company): Observable<CompanyResponse[]> {
    return this.http.delete<CompanyResponse[]>(`${this.baseUrl}/${client.id}`);
  }

}
