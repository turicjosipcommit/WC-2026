const PAGE_SIZE = 1000;

type PaginatedResult<T> = {
  data: T[] | null;
  error: { message: string } | null;
};

export async function fetchAllPaginated<T>(
  fetchPage: (range: { from: number; to: number }) => PromiseLike<PaginatedResult<T>>
): Promise<T[]> {
  const rows: T[] = [];

  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await fetchPage({ from, to: from + PAGE_SIZE - 1 });

    if (error) {
      throw new Error(error.message);
    }

    if (!data?.length) {
      break;
    }

    rows.push(...data);

    if (data.length < PAGE_SIZE) {
      break;
    }
  }

  return rows;
}
