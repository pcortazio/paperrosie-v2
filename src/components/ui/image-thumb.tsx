type ImageThumbProps = {
  imageUrl?: string | null;
};

export function ImageThumb({ imageUrl }: ImageThumbProps) {
  return (
    <div
      aria-hidden="true"
      className="size-full bg-zinc-50 bg-cover bg-center"
      style={imageUrl ? { backgroundImage: `url(${imageUrl})` } : undefined}
    />
  );
}
