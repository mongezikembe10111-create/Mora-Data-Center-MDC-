import { publicPath } from "@/lib/public-path";

export default function BrandLogo({
  compact = false,
  className = "",
  light = true,
}: {
  compact?: boolean;
  className?: string;
  light?: boolean;
}) {
  return (
    <span
      className={`public-square-brand ${light ? "brand-light" : "brand-dark"} ${className}`}
    >
      <img
        className="public-square-brand-mark"
        src={publicPath("/brand/public-square-mark.svg")}
        width={52}
        height={52}
        alt=""
        aria-hidden="true"
      />
      {!compact && (
        <span className="public-square-brand-name">
          <span>The</span>
          <strong>
            Public Square<span className="brand-lime-dot">.</span>
          </strong>
        </span>
      )}
      {compact && <span className="sr-only">The Public Square</span>}
    </span>
  );
}
