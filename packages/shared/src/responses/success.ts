export interface SuccessResponse<T> {
  success: true;
  data: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    [key: string]: any;
  };
}

export const createSuccessResponse = <T>(
  data: T,
  meta?: SuccessResponse<T>['meta']
): SuccessResponse<T> => ({
  success: true,
  data,
  ...(meta && { meta })
});

export const createPaginatedResponse = <T>(
  data: T[],
  total: number,
  page: number,
  limit: number
): SuccessResponse<T[]> => ({
  success: true,
  data,
  meta: {
    page,
    limit,
    total,
    pages: Math.ceil(total / limit)
  }
}); 