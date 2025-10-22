export function parsePagination(query) {
  const page = Math.max(1, parseInt(query.page ?? '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(query.limit ?? '20', 10)));
  return { page, limit, skip: (page - 1) * limit };
}

export function parseDateRange(query) {
  const { dateFrom, dateTo } = query;
  const filter = {};
  if (dateFrom || dateTo) {
    filter.dateUtc = {};
    if (dateFrom) filter.dateUtc.$gte = new Date(dateFrom);
    if (dateTo) filter.dateUtc.$lte = new Date(dateTo);
  }
  return filter;
}
