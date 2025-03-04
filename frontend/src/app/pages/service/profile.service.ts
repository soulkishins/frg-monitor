import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment/environment';
import { UserResponse, UserRequest } from '../models/user.model';
import { Page } from '../models/global.model';

@Injectable({
    providedIn: 'root'
})
export class ProfileService {
    private readonly baseUrl = `${environment.api_url}/perfil`;

    constructor(private http: HttpClient) {}

    getUsers(filters: {[param: string]: string | number}): Observable<Page<UserResponse>> {
        return this.http.get<Page<UserResponse>>(this.baseUrl, { params: filters });
    }
} 