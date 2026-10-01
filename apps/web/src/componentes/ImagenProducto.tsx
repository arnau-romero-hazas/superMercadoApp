type Props = { url: string | null; nombre: string };

export const ImagenProducto = ({ url, nombre }: Props) =>
  url === null ? (
    <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-sm font-semibold text-slate-400">
      {nombre.charAt(0).toUpperCase()}
    </div>
  ) : (
    <img src={url} alt="" loading="lazy" className="size-11 shrink-0 rounded-lg bg-white object-contain" />
  );
