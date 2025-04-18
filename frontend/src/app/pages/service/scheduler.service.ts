import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment/environment';
import { Page } from '../models/global.model';
import { KeywordRequest, KeywordResponse } from '../models/keyword.model';
import { SchedulerResponse, SchedulerRequest } from '../models/scheduler.model';

@Injectable({
  providedIn: 'root'
})
export class SchedulerService {
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

  startCrawler(msg: any): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}`, msg);
  }

  getSchedulers(filters: {[param: string]: string | number} = {}): Observable<Page<SchedulerResponse>> {
    return this.http.get<Page<SchedulerResponse>>(`${this.baseUrl}`, { params: filters });
  }

  getScheduler(id: string): Observable<SchedulerResponse> {
    return this.http.get<SchedulerResponse>(`${this.baseUrl}/${id}`);
  }

  postScheduler(scheduler: SchedulerRequest): Observable<SchedulerResponse> {
    return this.http.post<SchedulerResponse>(this.baseUrl, scheduler);
  }

  putScheduler(id: string, scheduler: SchedulerRequest): Observable<SchedulerResponse> {
    return this.http.put<SchedulerResponse>(`${this.baseUrl}/${id}`, scheduler);
  }

  deleteScheduler(id: string): Observable<SchedulerResponse[]> {
    return this.http.delete<SchedulerResponse[]>(`${this.baseUrl}/${id}`);
  }
}
