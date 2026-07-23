type Props = {
  className?: string;
};

export const Logo = ({ className }: Props) => {
  return (
    <img
      src="logo192.png"
      alt="Lazy Loaded Image"
      loading="lazy"
      className={className}
    />
  );
};
