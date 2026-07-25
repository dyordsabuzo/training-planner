type Props = {
  photoUrl?: string | undefined | null;
  label?: string | undefined | null;
};
export const ProfileIcon = ({ photoUrl, label }: Props) => {
  if (photoUrl) {
    return <img src={photoUrl} alt="user" className="w-10 h-10 rounded-full" />;
  }

  return (
    <div
      className={`
                    w-10 h-10 rounded-full border border-1 flex
                    place-content-center items-center font-bold
                    bg-primary text-white text-xl
                    `}
    >
      {label}
    </div>
  );
};
