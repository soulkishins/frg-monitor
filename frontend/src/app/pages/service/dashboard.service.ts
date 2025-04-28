import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AdsReport, DashboardStats, SchedulerReport, SchedulerStatisticsReport, TopKeyword } from '../models/global.model';
import { environment } from '../../../environment/environment';

@Injectable({
    providedIn: 'root'
})
export class DashboardService {
    private readonly baseUrl = `${environment.api_url}/dashboard`;

    constructor(private http: HttpClient) {}

    getStats(): Observable<DashboardStats[]> {
        return this.http.get<DashboardStats[]>(this.baseUrl, { params: { dash_type: 'status' } });
    }

    getTopKeywords(): Observable<TopKeyword[]> {
        return this.http.get<TopKeyword[]>(`${this.baseUrl}`, { params: { dash_type: 'top_keywords' } });
    }

    getAdsReport(): Observable<AdsReport[]> {
        return this.http.get<AdsReport[]>(`${this.baseUrl}`, { params: { dash_type: 'ads_report' } });
    }

    getSchedulerStatisticsReport(): Observable<SchedulerStatisticsReport[]> {
        return this.http.get<SchedulerStatisticsReport[]>(`${this.baseUrl}`, { params: { dash_type: 'schedulers_statistics' } });
    }

    getSchedulerReport(): Observable<SchedulerReport[]> {
        return this.http.get<SchedulerReport[]>(`${this.baseUrl}`, { params: { dash_type: 'scheduler_counts' } });
    }
} 