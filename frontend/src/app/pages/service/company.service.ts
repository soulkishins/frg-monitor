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

  getClients(params: { limit?: number; offset?: number; sort?: string; status?: string } = {}): Observable<Page<CompanyResponse>> {
    let url = this.baseUrl;
    const queryParams = new URLSearchParams();
    
    if (params.limit) queryParams.append('page.limit', params.limit.toString());
    if (params.offset) queryParams.append('page.offset', params.offset.toString());
    if (params.sort) queryParams.append('page.sort', params.sort);
    if (params.status) queryParams.append('st_status', params.status);

    const queryString = queryParams.toString();
    if (queryString) {
      url += `?${queryString}`;
    }

    return this.http.get<Page<CompanyResponse>>(url);
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
