export type ApiSuccess<T> = {
  data: T;
  meta?: {
    requestId?: string;
  };
};

export type ApiList<T> = {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
  };
  meta?: {
    requestId?: string;
  };
};

export type ApiFailure = {
  error: {
    code: string;
    message: string;
    details?: unknown;
    requestId?: string;
  };
};
