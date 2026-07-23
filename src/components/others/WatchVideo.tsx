import { faPlayCircle } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

type Props = {
  videoLink: string;
};

export const WatchVideo = ({ videoLink }: Props) => {
  return (
    <div className={`flex justify-center mb-4`}>
      <a
        className={`
                    no-underline text-white bg-blue-500 hover:bg-blue-400 font-medium 
                    rounded-md text-sm px-5 py-2
                    flex items-center gap-2
                  `}
        target="_blank"
        rel="noreferrer"
        href={videoLink}
      >
        Watch video
        <FontAwesomeIcon
          icon={faPlayCircle}
          className={`text-white-500 text-xl`}
        />
      </a>
    </div>
  );
};
