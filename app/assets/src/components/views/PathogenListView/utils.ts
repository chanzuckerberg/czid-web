const sortBy = (key: string | number) => {
  return (a, b) => (a[key] > b[key] ? 1 : b[key] > a[key] ? -1 : 0);
};

const groupBy = (key, acc, item) => {
  if (!acc[key]) {
    acc[key] = [];
  }
  acc[key].push(item);
  return acc;
};

type ItemType = {
  name: string;
  category: string;
}[];

export function categorizeItems<T extends Readonly<ItemType>>(
  items: Readonly<ItemType>,
): T {
  const alphabetizedItems = Array.from(items).sort(sortBy("name"));
  return alphabetizedItems.reduce(
    (acc, item) => groupBy(item.category, acc, item),
    {},
  );
}
