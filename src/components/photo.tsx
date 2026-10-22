import Image from "next/image";

export function Photo({
  src,
  alt,
  priority = false,
  sizes,
  className = "",
}: {
  src: string;
  alt: string;
  priority?: boolean;
  sizes: string;
  className?: string;
}) {
  const fit = `object-cover ${className}`.trim();
  if (src.startsWith("/")) {
    return <Image src={src} alt={alt} fill priority={priority} sizes={sizes} className={fit} />;
  }
  return (
    // External photos are admin-provided and may not be on an allowed image host.
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} className={`absolute inset-0 h-full w-full ${fit}`} />
  );
}

export function PhotoFrame({
  src,
  alt,
  priority = false,
  sizes,
  className = "aspect-[4/3]",
}: {
  src?: string | null;
  alt: string;
  priority?: boolean;
  sizes: string;
  className?: string;
}) {
  return (
    <div className={`card-media relative overflow-hidden bg-panel ${className}`}>
      {src ? (
        <Photo src={src} alt={alt} priority={priority} sizes={sizes} />
      ) : (
        <div className="absolute inset-0 grid place-items-center bg-[linear-gradient(160deg,#171a1f,#0b0d10)] px-4 text-center">
          <span className="display text-3xl text-white/80">Fotografija sledi</span>
        </div>
      )}
    </div>
  );
}
