import { SelectQueryBuilder } from 'typeorm';

export interface PaginationParams {
  page?: number | string;
  limit?: number | string;
  sort?: string;
  order?: 'asc' | 'desc' | 'ASC' | 'DESC' | string;
}

export interface NormalizedPagination {
  page: number;
  limit: number;
  offset: number;
  sort?: string;
  order: 'ASC' | 'DESC';
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

const MAX_LIMIT = 500;
const DEFAULT_LIMIT = 50;

export function normalizePagination(p: PaginationParams = {}): NormalizedPagination {
  const limitNum = Number(p.limit ?? DEFAULT_LIMIT);
  const limit = Math.min(
    Math.max(Number.isFinite(limitNum) && limitNum > 0 ? limitNum : DEFAULT_LIMIT, 1),
    MAX_LIMIT,
  );
  const pageNum = Number(p.page ?? 1);
  const page = Math.max(Number.isFinite(pageNum) && pageNum > 0 ? pageNum : 1, 1);
  const order = (String(p.order ?? 'DESC').toUpperCase() === 'ASC' ? 'ASC' : 'DESC') as
    | 'ASC'
    | 'DESC';
  return { page, limit, offset: (page - 1) * limit, sort: p.sort, order };
}

export async function paginateQB<T extends object>(
  qb: SelectQueryBuilder<T>,
  p: PaginationParams,
  defaultSortColumn: string,
  allowedSortColumns?: ReadonlyArray<string>,
): Promise<Paginated<T>> {
  const np = normalizePagination(p);
  const sort =
    np.sort && (!allowedSortColumns || allowedSortColumns.includes(np.sort))
      ? np.sort
      : defaultSortColumn;
  const aliasedSort = sort.includes('.') ? sort : `${qb.alias}.${sort}`;
  qb.orderBy(aliasedSort, np.order).skip(np.offset).take(np.limit);
  const [items, total] = await qb.getManyAndCount();
  return { items, total, page: np.page, limit: np.limit };
}

export function parseBool(v: string | undefined): boolean | undefined {
  if (v === undefined || v === null || v === '') return undefined;
  if (v === 'true' || v === '1') return true;
  if (v === 'false' || v === '0') return false;
  return undefined;
}

export function parseNumberOrUndefined(v: string | undefined): number | undefined {
  if (v === undefined || v === null || v === '') return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

export function buildIlikeOr<T extends object>(
  qb: SelectQueryBuilder<T>,
  q: string | undefined,
  columns: ReadonlyArray<string>,
  paramName = 'q',
): SelectQueryBuilder<T> {
  if (!q || !q.trim() || columns.length === 0) return qb;
  const needle = `%${q.trim().toLowerCase()}%`;
  qb.andWhere(
    `(${columns
      .map((c) => `LOWER(COALESCE(${qb.alias}.${c}::text, '')) LIKE :${paramName}`)
      .join(' OR ')})`,
    { [paramName]: needle },
  );
  return qb;
}
