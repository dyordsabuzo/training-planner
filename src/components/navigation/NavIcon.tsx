import { IconProp } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

export const NavIcon = ({ icon, label }: { icon: IconProp; label: string }) => {
  return (
    <div className="flex flex-col gap-2">
      <FontAwesomeIcon size="lg" icon={icon} />
      <div className="text-xs">{label}</div>
    </div>
  );
};
