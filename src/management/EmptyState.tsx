type Props = {
  message: string;
};

export const EmptyState = ({ message }: Props) => {
  return (
    <div className="flex items-center justify-center text-center text-sm text-text-muted-light dark:text-text-muted-dark
      border border-dashed border-gray-300 dark:border-gray-600 rounded-md p-8">
      {message}
    </div>
  );
};
