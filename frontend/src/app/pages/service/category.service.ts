import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment/environment';
import { CategoryResponse, CategoryRequest } from '../models/category.model';
import { Page } from '../models/global.model';

@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  private readonly baseUrl = `${environment.api_url}/categoria`;

  constructor(private http: HttpClient) { }

  getCategories(params?: { limit?: number; offset?: number; sort?: string }): Observable<Page<CategoryResponse>> {
    let httpParams = new HttpParams();
    
    if (params) {
      if (params.limit) httpParams = httpParams.set('limit', params.limit.toString());
      if (params.offset) httpParams = httpParams.set('offset', params.offset.toString());
      if (params.sort) httpParams = httpParams.set('sort', params.sort);
    }
    
    return this.http.get<Page<CategoryResponse>>(this.baseUrl, { params: httpParams });
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
