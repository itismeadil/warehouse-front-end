// A part's display label ("3/1", "3/2", "3/3"...) is always computed from
// its position within the item's FULL part list — never read from a
// stored name field. The full list is the item's own `parts` followed by
// any `sharedParts` it's linked to (e.g. legs/bottom shared with another
// color of the same item): both count toward the total and both get a
// slot in the sequence, so linking a shared part renumbers everything.
// e.g. an item with 2 owned parts showing "1/2", "2/2" becomes "1/3",
// "2/3", "3/3" the moment a shared part is added — it is never left
// numbered separately from the owned parts.
// This is the one place this logic lives; every component that shows a
// part's label calls this instead of rendering part.name directly.
export function combinedParts(item) {
  return [...(item?.parts || []), ...(item?.sharedParts || [])];
}

export function partLabel(item, part) {
  const all = combinedParts(item);
  if (!all.length) return "";

  const index = all.findIndex((p) => p._id === part._id);
  if (index === -1) return "";

  return `${all.length}/${index + 1}`;
}
