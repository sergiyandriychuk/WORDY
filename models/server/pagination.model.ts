export interface Pagination<T = any> {
  items: T[];
  pages: number;
  total: number;
}
