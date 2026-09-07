export default function ErrorPanel({ message }: { message: string }) {
  return (
    <div className="rounded-sm border border-sg-panel-2 bg-sg-panel px-4 py-3">
      <p className="text-sm">{message}</p>
      <a href="" className="mt-2 inline-block text-sm text-sg-cyan">
        Retry
      </a>
    </div>
  );
}
