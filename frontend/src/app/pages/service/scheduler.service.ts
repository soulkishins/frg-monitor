import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment/environment';
import { Page } from '../models/global.model';
import { SchedulerResponse, SchedulerRequest, SchedulerBrand } from '../models/scheduler.model';

@Injectable({
  providedIn: 'root'
})
export class SchedulerService {
  private readonly baseUrl = `${environment.api_url}/agendamento`;

  constructor(private http: HttpClient) { }

  getSchedulers(filters: {[param: string]: string | number} = {}): Observable<Page<SchedulerResponse>> {
    return this.http.get<Page<SchedulerResponse>>(this.baseUrl, { params: filters });
  }

  getSchedulerByBrand(filters: {[param: string]: string | number} = {}): Observable<Page<SchedulerBrand>> {
    return this.http.get<Page<SchedulerBrand>>(`${this.baseUrl}`, { params: filters });
  }

  putScheduler(scheduler: SchedulerRequest, schedulerId: string): Observable<Page<SchedulerBrand>> {
    return this.http.put<Page<SchedulerBrand>>(`${this.baseUrl}/${schedulerId}`, scheduler);
  }

  postScheduler(scheduler: SchedulerRequest): Observable<Page<SchedulerBrand>> {
    return this.http.post<Page<SchedulerBrand>>(`${this.baseUrl}`, scheduler);
  }

  deleteScheduler(schedulerId: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${schedulerId}`);
  }

  startCrawler(msg: any): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}`, msg);
  }
  
}
