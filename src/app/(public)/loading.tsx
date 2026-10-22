export default function Loading() {
  return (
    <div className="bg-paper py-10">
      <div className="wrap grid gap-4">
        <div className="h-10 w-48 animate-pulse bg-white" />
        <div className="h-16 w-full max-w-xl animate-pulse bg-white" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, index) => (
            <div key={index} className="h-80 animate-pulse bg-white" />
          ))}
        </div>
      </div>
    </div>
  );
}
