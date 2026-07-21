// A part's display label ("3/1", "3/2", "3/3"...) is always computed from
// its position within item.parts — never read from a stored name field.
// This is the one place that logic lives; every component that shows a
// part's label calls this instead of rendering part.name directly.
export function partLabel(item, part) {
  if (!item?.parts?.length) return "";

  const index = item.parts.findIndex((p) => p._id === part._id);
  if (index === -1) return "";

  return `${item.parts.length}/${index + 1}`;
}
