import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { giftIcon } from "@/lib/icons";

export function CategoryIcon({
  icon,
  imageUrl,
  className,
}: {
  icon: string;
  imageUrl?: string | null;
  className?: string;
}) {
  if (imageUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={imageUrl} alt="" className="h-full w-full object-cover" />
    );
  }
  return <FontAwesomeIcon icon={giftIcon(icon)} className={className} />;
}
