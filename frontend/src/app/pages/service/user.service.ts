import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment/environment';
import { UserResponse, UserRequest } from '../models/user.model';
import { Page } from '../models/global.model';

@Injectable({
    providedIn: 'root'
})
export class UserService {
    private readonly baseUrl = `${environment.api_url}/usuario`;

    constructor(private http: HttpClient) {}

    getUsers(): Observable<Page<UserResponse>> {
        return this.http.get<Page<UserResponse>>(this.baseUrl);
    }

    getUser(id: string): Observable<UserResponse> {
        return this.http.get<UserResponse>(`${this.baseUrl}/${id}`);
    }

    postUser(user: UserRequest): Observable<UserResponse> {
        return this.http.post<UserResponse>(this.baseUrl, user);
    }

    putUser(id: string, user: UserRequest): Observable<UserResponse> {
        return this.http.put<UserResponse>(`${this.baseUrl}/${id}`, user);
    }

    deleteUser(id: string): Observable<void> {
        return this.http.delete<void>(`${this.baseUrl}/${id}`);
    }
} 