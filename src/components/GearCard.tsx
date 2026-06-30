type Product = {
  id: number;
  name: string;
  category: string;
  product_type: 'gear' | 'hardware';
  shopee_url?: string | null;
  lazada_url?: string | null;
  amazon_url?: string | null;
  image_url?: string | null;
  estimated_price_thb?: number | string | null;
};

type GearCardProps = {
  product: Product;
};

const categoryMap: Record<string, string> = {
  mouse: 'Mouse',
  keyboard: 'Keyboard',
  headset: 'Headset',
  mousepad: 'Mousepad',
  monitor: 'Monitor',
  gpu: 'GPU',
  cpu: 'CPU',
  hardware: 'Hardware'
};

function getCategorySvg(category: string) {
  const cat = category.toLowerCase();
  if (cat === 'mouse') {
    return (
      <svg className="h-10 w-10 text-zinc-700 opacity-40 group-hover:opacity-60 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <rect x="5" y="2" width="14" height="20" rx="7" />
        <path d="M12 2v10M5 12h14" />
      </svg>
    );
  }
  if (cat === 'keyboard') {
    return (
      <svg className="h-10 w-10 text-zinc-700 opacity-40 group-hover:opacity-60 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <rect x="2" y="4" width="20" height="16" rx="3" />
        <path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M6 12h.01M10 12h.01M14 12h.01M18 12h.01M7 16h10" />
      </svg>
    );
  }
  if (cat === 'headset') {
    return (
      <svg className="h-10 w-10 text-zinc-700 opacity-40 group-hover:opacity-60 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path d="M3 14c0-4.97 4.03-9 9-9s9 4.03 9 9M3 14h3v5H3v-5Zm15 0h3v5h-3v-5Z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (cat === 'mousepad') {
    return (
      <svg className="h-10 w-10 text-zinc-700 opacity-40 group-hover:opacity-60 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="M6 9h12M6 13h12" />
      </svg>
    );
  }
  if (cat === 'monitor') {
    return (
      <svg className="h-10 w-10 text-zinc-700 opacity-40 group-hover:opacity-60 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <rect x="2" y="3" width="20" height="14" rx="2" />
        <path d="M8 21h8M12 17v4" />
      </svg>
    );
  }
  if (cat === 'gpu' || cat === 'cpu' || cat === 'hardware') {
    return (
      <svg className="h-10 w-10 text-zinc-700 opacity-40 group-hover:opacity-60 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <rect x="5" y="5" width="14" height="14" rx="2" />
        <path d="M9 1v4M15 1v4M9 19v4M15 19v4M1 9h4M1 15h4M19 9h4M19 15h4M9 9h6v6H9z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  return (
    <svg className="h-10 w-10 text-zinc-700 opacity-40 group-hover:opacity-60 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function GearCard({ product }: GearCardProps) {
  const categoryLabel = categoryMap[product.category.toLowerCase()] || product.category;

  const formattedPrice = product.estimated_price_thb
    ? `฿${Number(product.estimated_price_thb).toLocaleString()}`
    : null;

  const hasLinks = product.shopee_url || product.lazada_url || product.amazon_url;

  return (
    <div className="bg-card backdrop-blur-[8px] border border-border-custom rounded-2xl flex flex-col hover:border-border-hover hover:bg-[#1A1A24]/40 transition-all duration-300 group overflow-hidden">
      {/* Image area */}
      <div className="relative w-full aspect-square bg-[#0D0D14] flex items-center justify-center p-4 border-b border-border-custom">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          getCategorySvg(product.category)
        )}
        {/* Category badge */}
        <span className="absolute top-2 left-2 text-[8px] font-bold uppercase tracking-wider text-zinc-500 bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded font-mono border border-white/5">
          {categoryLabel}
        </span>
      </div>

      {/* Info */}
      <div className="p-3.5 flex flex-col flex-1">
        <h4 className="text-xs font-bold text-white font-display group-hover:text-accent transition-colors duration-300 line-clamp-2 leading-tight">
          {product.name}
        </h4>
        {formattedPrice && (
          <p className="text-[10px] text-zinc-500 mt-1 font-mono">
            Est. {formattedPrice}
          </p>
        )}

        {/* Links */}
        {hasLinks && (
          <div className="mt-auto pt-3 flex gap-1.5 font-mono">
            {product.shopee_url && (
              <a
                href={product.shopee_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 text-center text-[9px] font-semibold py-1.5 rounded-lg bg-transparent border border-[#ee4d2d]/25 text-[#ee4d2d] hover:bg-[#ee4d2d]/10 hover:border-[#ee4d2d]/50 transition-all duration-200"
              >
                Shopee
              </a>
            )}
            {product.lazada_url && (
              <a
                href={product.lazada_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 text-center text-[9px] font-semibold py-1.5 rounded-lg bg-transparent border border-accent/25 text-accent hover:bg-accent/10 hover:border-accent/50 transition-all duration-200"
              >
                Lazada
              </a>
            )}
            {product.amazon_url && (
              <a
                href={product.amazon_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 text-center text-[9px] font-semibold py-1.5 rounded-lg bg-transparent border border-white/10 text-zinc-300 hover:bg-white/5 hover:border-white/20 transition-all duration-200"
              >
                Amazon
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
