export interface ServiceResponse<T = any> {
  data?: T;
  success: boolean;
  message?: string;
  errors?: any[];
}

export interface IPaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface IParams {
  [key: string]: string | number | boolean | undefined | null;
}
export type TMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

// Updated abstract class
export abstract class HttpServiceAbstract<T> {
  protected abstract getList<R = T[]>(
    route: string,
    params?: IParams,
    options?: RequestInit,
  ): Promise<ServiceResponse<IPaginatedResponse<R>>>;

  protected abstract get<R = T>(
    route: string,
    params?: IParams,
    options?: RequestInit,
  ): Promise<ServiceResponse<R>>;

  protected abstract post<R = T>(
    route: string,
    body: any,
    params?: IParams,
    options?: RequestInit,
  ): Promise<ServiceResponse<R>>;

  protected abstract put<R = T>(
    route: string,
    body: any,
    params?: IParams,
    options?: RequestInit,
  ): Promise<ServiceResponse<R>>;

  protected abstract patch<R = T>(
    route: string,
    body: any,
    params?: IParams,
    options?: RequestInit,
  ): Promise<ServiceResponse<R>>;

  protected abstract delete<R = T>(
    route: string,
    params?: IParams,
    options?: RequestInit,
  ): Promise<ServiceResponse<R>>;

  // Utility method for paginated responses
  protected abstract getPaginated<R = T>(
    route: string,
    params?: IParams,
    options?: RequestInit,
  ): Promise<ServiceResponse<IPaginatedResponse<R>>>;
}
