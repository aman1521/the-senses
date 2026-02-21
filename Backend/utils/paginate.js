export function paginate({ page=1, limit=20 }){
  page = Math.max(1, Number(page)); limit = Math.min(200, Math.max(1, Number(limit)));
  const skip = (page-1)*limit; return { skip, limit, page };
}
