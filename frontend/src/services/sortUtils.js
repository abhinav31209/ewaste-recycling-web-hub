const DEFAULT_SORT_FIELDS = [
  "updatedAt",
  "reviewedAt",
  "publishedAt",
  "fulfilledAt",
  "paidAt",
  "createdAt",
  "submittedAt",
];

export function getSortableTime(item, fields = DEFAULT_SORT_FIELDS) {
  for (const field of fields) {
    if (item?.[field]) {
      const time = new Date(item[field]).getTime();
      if (!Number.isNaN(time)) {
        return time;
      }
    }
  }

  return 0;
}

export function sortNewestFirst(items, fields = DEFAULT_SORT_FIELDS) {
  return [...(items || [])].sort((left, right) => {
    const timeDelta = getSortableTime(right, fields) - getSortableTime(left, fields);
    if (timeDelta !== 0) {
      return timeDelta;
    }

    const leftId = String(left?.id ?? "");
    const rightId = String(right?.id ?? "");
    return rightId.localeCompare(leftId);
  });
}
