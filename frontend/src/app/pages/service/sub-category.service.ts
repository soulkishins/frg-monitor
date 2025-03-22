import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment/environment';
import { SubCategoryResponse, SubCategoryRequest } from '../models/sub-category.model';
import { Page } from '../models/global.model';

@Injectable({
  providedIn: 'root'
})
export class SubCategoryService {
  private readonly baseUrl = `${environment.api_url}/sub-categoria`;

  constructor(private http: HttpClient) { }

  getSubCategories(params?: { limit?: number; offset?: number; sort?: string }): Observable<Page<SubCategoryResponse>> {
    let httpParams = new HttpParams();
    
    if (params) {
      if (params.limit) httpParams = httpParams.set('limit', params.limit.toString());
      if (params.offset) httpParams = httpParams.set('offset', params.offset.toString());
      if (params.sort) httpParams = httpParams.set('sort', params.sort);
    }
    
    return this.http.get<Page<SubCategoryResponse>>(this.baseUrl, { params: httpParams });
  }

  getSubCategory(subCategoryId: string): Observable<SubCategoryResponse> {
    const url = `${this.baseUrl}/${subCategoryId}`;
    return this.http.get<SubCategoryResponse>(url);
  }

  postSubCategory(subCategory: SubCategoryRequest): Observable<SubCategoryResponse> {
    const url = `${this.baseUrl}`;
    return this.http.post<SubCategoryResponse>(url, subCategory);
  }  

  putSubCategory(subCategoryId: string, subCategory: SubCategoryRequest): Observable<SubCategoryResponse> {
    const url = `${this.baseUrl}/${subCategoryId}`;
    return this.http.put<SubCategoryResponse>(url, subCategory);
  }

  deleteSubCategory(subCategoryId: string): Observable<SubCategoryResponse[]> {
    const url = `${this.baseUrl}/${subCategoryId}`;
    return this.http.delete<SubCategoryResponse[]>(url);
  }

}
