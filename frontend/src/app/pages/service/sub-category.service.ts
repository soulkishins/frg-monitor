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

  getSubCategories(filters: {[param: string]: string | number} = {}): Observable<Page<SubCategoryResponse>> {
    return this.http.get<Page<SubCategoryResponse>>(this.baseUrl, { params: filters });
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
