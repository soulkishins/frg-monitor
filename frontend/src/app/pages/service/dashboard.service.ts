import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AdsReport, DashboardStats, TopKeyword } from '../models/global.model';
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

} 