import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Scheduler } from 'rxjs';
import { environment } from '../../../environment/environment';
import { Page } from '../models/global.model';
import { KeywordRequest, KeywordResponse } from '../models/keyword.model';
import { SchedulerResponse, SchedulerRequest, SchedulerKeyword } from '../models/scheduler.model';

@Injectable({
  providedIn: 'root'
})
export class SchedulerService {
  private readonly baseUrl = `${environment.api_url}/agendamento`;

  constructor(private http: HttpClient) { }

  getSchedulers(filters: {[param: string]: string | number} = {}): Observable<Page<SchedulerResponse>> {
    return this.http.get<Page<SchedulerResponse>>(this.baseUrl, { params: filters });
  }

  getSchedulerByKeyword(filters: {[param: string]: string | number} = {}): Observable<Page<SchedulerKeyword>> {
    return this.http.get<Page<SchedulerKeyword>>(`${this.baseUrl}`, { params: filters });
  }

  putScheduler(scheduler: SchedulerRequest, schedulerId: string): Observable<Page<SchedulerKeyword>> {
    return this.http.put<Page<SchedulerKeyword>>(`${this.baseUrl}/${schedulerId}`, scheduler);
  }

  postScheduler(scheduler: SchedulerRequest): Observable<Page<SchedulerKeyword>> {
    return this.http.post<Page<SchedulerKeyword>>(`${this.baseUrl}`, scheduler);
  }
  
}
