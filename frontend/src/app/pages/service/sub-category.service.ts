import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment/environment';
import { SubCategoryResponse, SubCategory, SubCategoryRequest } from '../../layout/models/sub-category.model';

@Injectable({
  providedIn: 'root'
})
export class SubCategoryService {
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

  getSubCategories(categoryId: string): Observable<SubCategoryResponse[]> {
    const url = `${this.baseUrl}/${categoryId}/sub-categoria`;
    return this.http.get<SubCategoryResponse[]>(url, { headers: this.headers });
  }

  getSubCategory(categoryId: string, subCategoryId: string): Observable<SubCategoryResponse> {
    const url = `${this.baseUrl}/${categoryId}/sub-categoria/${subCategoryId}`;
    return this.http.get<SubCategoryResponse>(url, { headers: this.headers });
  }

  postSubCategory(categoryId: string, subCategory: SubCategoryRequest): Observable<SubCategoryResponse> {
    const url = `${this.baseUrl}/${categoryId}/sub-categoria`;
    return this.http.post<SubCategoryResponse>(url, subCategory, { headers: this.headers });
  }  

  putSubCategory(categoryId: string, subCategoryId: string, subCategory: SubCategoryRequest): Observable<SubCategoryResponse> {
    const url = `${this.baseUrl}/${categoryId}/sub-categoria/${subCategoryId}`;
    return this.http.put<SubCategoryResponse>(url, subCategory, { headers: this.headers });
  }

  deleteSubCategory(categoryId: string, subCategoryId: string): Observable<SubCategoryResponse[]> {
    const url = `${this.baseUrl}/${categoryId}/sub-categoria/${subCategoryId}`;
    return this.http.delete<SubCategoryResponse[]>(url, { headers: this.headers });
  }

}
