import Image from "next/image";

export function ComingSoon({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-16 text-center">
      <Image
        src="/mascot/owlert-default.png"
        alt="Owlert mascot"
        width={96}
        height={96}
        className="h-24 w-24"
      />
      <h1 className="text-lg font-semibold text-navy">{title}</h1>
      <p className="max-w-sm text-sm text-slate-500">{description}</p>
    </div>
  );
}
