import { faPlayCircle } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

type Props = {
  videoLink: string;
};

export const WatchVideo = ({ videoLink }: Props) => {
  return (
    <div className={`flex justify-center mb-4`}>
      <a
        className="no-underline text-white bg-primary hover:bg-primary-700 font-medium
                    rounded-md text-sm px-5 min-h-11 py-2
                    flex items-center gap-2
                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        target="_blank"
        rel="noreferrer"
        href={videoLink}
      >
        Watch video
        <FontAwesomeIcon icon={faPlayCircle} className="text-xl" />
      </a>
    </div>
  );
};
