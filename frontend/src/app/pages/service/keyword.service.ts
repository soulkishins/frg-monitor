import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment/environment';
import { Page } from '../models/global.model';
import { KeywordRequest, KeywordResponse } from '../models/keyword.model';

@Injectable({
  providedIn: 'root'
})
export class KeywordService {
  private readonly baseUrl = `${environment.api_url}/palavra-chave`;

  constructor(private http: HttpClient) { }

  getKeywords(filters: {[param: string]: string | number} = {}): Observable<Page<KeywordResponse>> {
    return this.http.get<Page<KeywordResponse>>(this.baseUrl, { params: filters });
  }

  getKeyword(id: string): Observable<KeywordResponse> {
    return this.http.get<KeywordResponse>(`${this.baseUrl}/${id}`);
  }

  postKeyword(keyword: KeywordRequest): Observable<KeywordResponse> {
    return this.http.post<KeywordResponse>(this.baseUrl, keyword);
  }  

  putKeyword(id: string, keyword: KeywordRequest): Observable<KeywordResponse> {
      return this.http.put<KeywordResponse>(`${this.baseUrl}/${id}`, keyword);
  }

  deleteKeyword(id: string): Observable<KeywordResponse[]> {
    return this.http.delete<KeywordResponse[]>(`${this.baseUrl}/${id}`);
  }

}
