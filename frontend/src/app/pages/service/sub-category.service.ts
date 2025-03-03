import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment/environment';
import { SubCategoryResponse, SubCategoryRequest, SubCategoriesResponse } from '../models/sub-category.model';

@Injectable({
  providedIn: 'root'
})
export class SubCategoryService {
  private readonly baseUrl = `${environment.api_url}/sub-categoria`;

  constructor(private http: HttpClient) { }

  getSubCategories(): Observable<SubCategoriesResponse> {
    const url = `${this.baseUrl}`;
    return this.http.get<SubCategoriesResponse>(url);
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
