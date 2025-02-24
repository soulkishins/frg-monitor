import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment/environment';
import { CategoryResponse, Category, CategoryRequest } from '../../layout/models/category.model';

@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  private readonly baseUrl = `${environment.api_url}/categoria`;
  private readonly headers: HttpHeaders;

  constructor(private http: HttpClient) {
    this.headers = new HttpHeaders({
      'Authorization': 'e.eyJzdWIiOiJjMzVjNmE1YS0zMDAxLTcwMjQtNjdkMC1kNWZiYzI4YzE2NmIiLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwiaXNzIjoiaHR0cHM6XC9cL2NvZ25pdG8taWRwLnNhLWVhc3QtMS5hbWF6b25hd3MuY29tXC9zYS1lYXN0LTFfM1FBM3NoZDBmIiwicGhvbmVfbnVtYmVyX3ZlcmlmaWVkIjpmYWxzZSwiY29nbml0bzp1c2VybmFtZSI6ImMzNWM2YTVhLTMwMDEtNzAyNC02N2QwLWQ1ZmJjMjhjMTY2YiIsIm9yaWdpbl9qdGkiOiJhNjQ0OTI4My1mMzdkLTRlZDMtYmY2YS04NzNlOTBhODhhNDEiLCJhdWQiOiI0dmJmYW82NzFiNHZyamxwbzdsOHU0N2xiYyIsImV2ZW50X2lkIjoiNTQyZjU0YjMtN2U4NC00YTZiLWFkZjgtZmI1N2RhNTQ3NTE0IiwidG9rZW5fdXNlIjoiaWQiLCJhdXRoX3RpbWUiOjE3MzkyMzMyOTgsIm5hbWUiOiJCcnVubyBBbnR1bmVzIiwicGhvbmVfbnVtYmVyIjoiKzU1MTE5MzMzMzQ1NjciLCJleHAiOjE3MzkyMzY4OTgsImlhdCI6MTczOTIzMzI5OCwianRpIjoiNGFhM2NkMmYtM2JmMy00YjdiLThmMzctYjVhNDEyNmE2ZmRkIiwiZW1haWwiOiJicnVuby5iYWNzQGdtYWlsLmNvbSJ9.u',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': '*',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
      'Content-Type': 'application/json'
    });
  }

  getCategories(): Observable<CategoryResponse[]> {
    return this.http.get<CategoryResponse[]>(this.baseUrl, { headers: this.headers });
  }

  getCategory(id: string): Observable<CategoryResponse> {
    return this.http.get<CategoryResponse>(`${this.baseUrl}/${id}`, { headers: this.headers });
  }

  postCategory(category: CategoryRequest): Observable<CategoryResponse> {
    return this.http.post<CategoryResponse>(this.baseUrl, category, { headers: this.headers });
  }  

  putCategory(id: string, category: CategoryRequest): Observable<CategoryResponse> {
    return this.http.put<CategoryResponse>(`${this.baseUrl}/${id}`, category, { headers: this.headers });
  }

  deleteCategory(id: string): Observable<CategoryResponse[]> {
    return this.http.delete<CategoryResponse[]>(`${this.baseUrl}/${id}`, { headers: this.headers });
  }

}
