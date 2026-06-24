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
  mouse: '🖱️ Mouse',
  keyboard: '⌨️ Keyboard',
  headset: '🎧 Headset',
  mousepad: '🟪 Mousepad',
  monitor: '🖥️ Monitor',
  gpu: '🔌 GPU',
  cpu: '⚙️ CPU',
  hardware: '💾 Hardware'
};

export default function GearCard({ product }: GearCardProps) {
  const categoryLabel = categoryMap[product.category.toLowerCase()] || product.category;
  
  // Format price (Thai Baht format is fine since it's the estimated local price, but we can write "Est. Price: ฿X,XXX")
  const formattedPrice = product.estimated_price_thb
    ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'THB', maximumFractionDigits: 0 }).format(
        Number(product.estimated_price_thb)
      )
    : null;

  return (
    <div className="bg-card backdrop-blur-[8px] border border-border-custom p-6 rounded-lg flex flex-col justify-between hover:border-border-hover hover:bg-[#1A1A24]/40 hover:scale-[1.02] transition-all duration-300 group">
      <div>
        <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 bg-white/5 px-2 py-0.5 rounded font-mono">
          {categoryLabel}
        </span>
        <h4 className="text-base font-bold text-white mt-4 font-display group-hover:text-accent transition-colors duration-300 line-clamp-2">
          {product.name}
        </h4>
        {formattedPrice && (
          <p className="text-xs text-zinc-500 mt-1 font-mono">
            Est. Price: {formattedPrice}
          </p>
        )}
      </div>

      {/* Affiliate Links - Outline Button style */}
      <div className="mt-6 flex flex-col gap-2 font-mono">
        {product.shopee_url && (
          <a
            href={product.shopee_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full text-[11px] font-semibold py-2 px-4 rounded bg-transparent border border-[#ee4d2d]/30 text-[#ee4d2d] hover:bg-[#ee4d2d]/10 hover:border-[#ee4d2d] transition-all duration-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#ee4d2d]"
          >
            Buy on Shopee
          </a>
        )}
        {product.lazada_url && (
          <a
            href={product.lazada_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full text-[11px] font-semibold py-2 px-4 rounded bg-transparent border border-accent/30 text-accent hover:bg-accent/10 hover:border-accent hover:shadow-[0_0_15px_rgba(245,158,11,0.15)] transition-all duration-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
          >
            Buy on Lazada
          </a>
        )}
        {product.amazon_url && (
          <a
            href={product.amazon_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full text-[11px] font-semibold py-2 px-4 rounded bg-transparent border border-white/10 text-[#FAFAFA] hover:bg-white/5 hover:border-white/20 transition-all duration-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white"
          >
            Buy on Amazon
          </a>
        )}
        {!product.shopee_url && !product.lazada_url && !product.amazon_url && (
          <span className="text-xs text-zinc-600 text-center italic py-2">
            No links available
          </span>
        )}
      </div>
    </div>
  );
}
