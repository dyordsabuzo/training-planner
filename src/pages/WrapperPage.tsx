type Props = {
  children?: React.ReactNode;
  className?: string;
};

const WrapperPage: React.FC<Props> = ({ children, className }) => {
  return (
    <div className="grid place-content-center pb-20 px-2">
      <div className={`flex flex-col gap-2 p-2 w-full mx-auto ${className ?? "max-w-[25rem]"}`}>
        {children}
      </div>
    </div>
  );
};

export default WrapperPage;
