type Props = {
  children?: React.ReactNode;
  className?: string;
  outerClassName?: string;
};

const WrapperPage: React.FC<Props> = ({ children, className, outerClassName }) => {
  return (
    <div className={`grid place-content-center px-2 ${outerClassName ?? "pb-20"}`}>
      <div className={`flex flex-col gap-2 p-2 w-full mx-auto ${className ?? "max-w-[25rem]"}`}>
        {children}
      </div>
    </div>
  );
};

export default WrapperPage;
