import { teamBadgeUrl } from "@/lib/livescore/team-badge";

type TeamLabelProps = {
  name: string;
  img?: string | null;
  align?: "left" | "right";
  className?: string;
};

export function TeamLabel({
  name,
  img,
  align = "left",
  className = "",
}: TeamLabelProps) {
  const badgeUrl = teamBadgeUrl(img);
  const isRight = align === "right";

  return (
    <span
      className={`flex min-w-0 items-center gap-2 ${isRight ? "flex-row-reverse text-right" : ""} ${className}`}
    >
      {badgeUrl ? (
        <img
          src={badgeUrl}
          alt=""
          width={24}
          height={24}
          className="h-6 w-6 shrink-0 object-contain"
          loading="lazy"
        />
      ) : null}
      <span className="truncate">{name}</span>
    </span>
  );
}
