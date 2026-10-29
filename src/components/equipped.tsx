export function Equipped({ ownerName }: { ownerName?: string }) {
  const label = ownerName ? `Đang dùng bởi ${ownerName}` : "Đang dùng";
  return (
    <span
      className="equipped-badge"
      role="img"
      aria-label={label}
      title={label}
    >
      E
    </span>
  );
}
