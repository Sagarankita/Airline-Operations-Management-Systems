const parsePagination = (query) => {
  const page   = Math.max(1, parseInt(query.page)  || 1);
  const limit  = Math.min(100, Math.max(1, parseInt(query.limit) || 10));
  const offset = (page - 1) * limit;
  return { page, limit, offset };
};

const paginationMeta = (total, page, limit) => ({
  page:       Number(page),
  limit:      Number(limit),
  total:      Number(total),
  totalPages: Math.ceil(Number(total) / Number(limit)),
});

module.exports = { parsePagination, paginationMeta };
