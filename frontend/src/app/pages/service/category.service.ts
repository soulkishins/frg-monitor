import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment/environment';
import { CategoryResponse, CategoryRequest } from '../../layout/models/category.model';

@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  private readonly baseUrl = `${environment.api_url}/categoria`;

  constructor(private http: HttpClient) { }

  getCategories(): Observable<CategoryResponse[]> {
    return this.http.get<CategoryResponse[]>(this.baseUrl);
  }

  getCategory(id: string): Observable<CategoryResponse> {
    return this.http.get<CategoryResponse>(`${this.baseUrl}/${id}`);
  }

  postCategory(category: CategoryRequest): Observable<CategoryResponse> {
    return this.http.post<CategoryResponse>(this.baseUrl, category);
  }  

  putCategory(id: string, category: CategoryRequest): Observable<CategoryResponse> {
    return this.http.put<CategoryResponse>(`${this.baseUrl}/${id}`, category);
  }

  deleteCategory(id: string): Observable<CategoryResponse[]> {
    return this.http.delete<CategoryResponse[]>(`${this.baseUrl}/${id}`);
  }

}
