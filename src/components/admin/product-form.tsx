"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, X, Save, ImageIcon, Upload } from "lucide-react";
import type { Product } from "@/db/schema";
import { BUSINESS } from "@/lib/business";
import { saveProduct } from "@/app/admin/actions";

const COLOR_OPTIONS = [
  "Red", "Maroon", "Black", "White", "Gold", "Blue", "Pink", "Brown",
  "Green", "Silver", "Purple", "Peach",
];
const SIZE_OPTIONS = ["XS", "S", "M", "L", "XL", "XXL", "Custom"];
const STOCK_IMAGES = [
  ...Array.from({ length: 12 }, (_, i) => `/images/products/p${String(i + 1).padStart(2, "0")}.jpg`),
  "/images/products/b13.jpg",
  "/images/products/b14.jpg",
  "/images/hero.jpg",
];

function Toggle({ on, onClick, label, hint }: { on: boolean; onClick: () => void; label: string; hint?: string }) {
  return (
    <button type="button" onClick={onClick} className="flex items-center gap-3 text-left">
      <span className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${on ? "bg-burgundy" : "bg-ink/20"}`}>
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${on ? "left-5.5" : "left-0.5"}`} />
      </span>
      <span>
        <span className="block text-sm font-bold text-ink">{label}</span>
        {hint && <span className="block text-xs text-ink-soft">{hint}</span>}
      </span>
    </button>
  );
}

export function ProductForm({ product }: { product?: Product }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState(product?.name ?? "");
  const [slug, setSlug] = useState(product?.slug ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [fabric, setFabric] = useState(product?.fabric ?? "Lawn");
  const [category, setCategory] = useState<string>(product?.category ?? "Formal");
  const [price, setPrice] = useState(product?.price?.toString() ?? "");
  const [compareAt, setCompareAt] = useState(product?.compareAtPrice?.toString() ?? "");
  const [colors, setColors] = useState<string[]>(product?.colors ?? []);
  const [sizes, setSizes] = useState<string[]>(product?.sizes ?? ["S", "M", "L", "Custom"]);
  const [images, setImages] = useState<string[]>(product?.images ?? []);
  const [uploading, setUploading] = useState(false);
  const [featured, setFeatured] = useState(product?.featured ?? false);
  const [active, setActive] = useState(product?.active ?? true);
  function toggleList(list: string[], value: string, setter: (v: string[]) => void) {
    setter(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  }
  async function uploadImages(files: FileList | null) {
    if (!files?.length) return;
    setError(null);
    setUploading(true);
    try {
      const selected = Array.from(files);
      if (images.length + selected.length > 5) throw new Error("A dress can have up to 5 photos.");
      const values = await Promise.all(selected.map(async (file) => {
        if (file.type.startsWith("image/")) {
          const bitmap = await createImageBitmap(file);
          const scale = Math.min(1, 1000 / bitmap.width, 1400 / bitmap.height);
          const canvas = document.createElement("canvas");
          canvas.width = Math.max(1, Math.round(bitmap.width * scale));
          canvas.height = Math.max(1, Math.round(bitmap.height * scale));
          canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
          bitmap.close();
          // Keep Server Action requests reliable on mobile and Vercel. Reduce
          // quality until each stored data URL is below roughly 650 KB.
          for (const quality of [0.62, 0.5, 0.4, 0.3]) {
            const encoded = canvas.toDataURL("image/webp", quality);
            if (encoded.length <= 680_000 || quality === 0.3) return encoded;
          }
          throw new Error(`${file.name} could not be compressed enough.`);
        }
        if (!/^(video\/mp4|video\/webm|video\/quicktime)$/i.test(file.type)) throw new Error(`${file.name} is not a supported image or video.`);
        if (file.size > 1_500_000) throw new Error(`${file.name} is too large. Videos must be under 1.5 MB.`);
        return await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result));
          reader.onerror = () => reject(new Error(`Could not read ${file.name}.`));
          reader.readAsDataURL(file);
        });
      }));
      const nextImages = [...images, ...values];
      const encodedSize = nextImages.reduce((total, value) => total + value.length, 0);
      if (encodedSize > 3_200_000) {
        throw new Error("These files are too large together. Please choose fewer or smaller images (maximum about 3 MB total).");
      }
      setImages(nextImages);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not process the selected media.");
    } finally {
      setUploading(false);
    }
  }
  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    start(async () => {
      try {
        const res = await saveProduct({
          id: product?.id,
          name,
          slug,
          description,
          fabric,
          category: category as (typeof BUSINESS.categories)[number],
          price: parseInt(price.replace(/\D/g, ""), 10),
          compareAtPrice: compareAt ? parseInt(compareAt.replace(/\D/g, ""), 10) : null,
          colors,
          sizes,
          images,
          featured,
          active,
        });
        if (!res.ok) throw new Error(res.error);
        router.push("/admin/products");
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Please check all fields and try again.");
      }
    });
  }
  return (
    <form onSubmit={submit} className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <div className="space-y-6">
          <div className="card space-y-5 p-7">
            <div className="grid gap-5 sm:grid-cols-2">
              <div><label className="label" htmlFor="pf-name">Dress name</label><input id="pf-name" required value={name} onChange={(e) => setName(e.target.value)} className="field" placeholder="e.g. Noor Velvet Ensemble" /></div>
              <div><label className="label" htmlFor="pf-slug">URL slug (optional)</label><input id="pf-slug" value={slug} onChange={(e) => setSlug(e.target.value)} className="field" placeholder="auto-generated from name" /></div>
            </div>
            <div><label className="label" htmlFor="pf-desc">Description</label><textarea id="pf-desc" required rows={4} value={description} onChange={(e) => setDescription(e.target.value)} className="field resize-none" placeholder="Fabric, work, fit, occasion — sell the feeling." /></div>
            <div className="grid gap-5 sm:grid-cols-3">
              <div><label className="label" htmlFor="pf-fabric">Fabric</label><input id="pf-fabric" required value={fabric} onChange={(e) => setFabric(e.target.value)} className="field" /></div>
              <div><label className="label" htmlFor="pf-price">Price (PKR)</label><input id="pf-price" required inputMode="numeric" value={price} onChange={(e) => setPrice(e.target.value)} className="field" placeholder="14500" /></div>
              <div><label className="label" htmlFor="pf-compare-at">Compare-at (optional)</label><input id="pf-compare-at" inputMode="numeric" value={compareAt} onChange={(e) => setCompareAt(e.target.value)} className="field" placeholder="16800" /></div>
            </div>
            <div><label className="label">Category</label><div className="flex flex-wrap gap-2">{BUSINESS.categories.map((c) => <button type="button" key={c} onClick={() => setCategory(c)} className={`chip ${category === c ? "chip-active" : ""}`}>{c}</button>)}</div></div>
            <div><label className="label">Colours</label><div className="flex flex-wrap gap-2">{COLOR_OPTIONS.map((c) => <button type="button" key={c} onClick={() => toggleList(colors, c, setColors)} className={`chip ${colors.includes(c) ? "chip-active" : ""}`}>{c}</button>)}</div></div>
            <div><label className="label">Available sizes</label><div className="flex flex-wrap gap-2">{SIZE_OPTIONS.map((s) => <button type="button" key={s} onClick={() => toggleList(sizes, s, setSizes)} className={`chip ${sizes.includes(s) ? "chip-active" : ""}`}>{s}</button>)}</div></div>
          </div>
        </div>
        <div className="space-y-6">
          <div className="card p-7">
            <p className="label flex items-center gap-2"><ImageIcon className="h-3.5 w-3.5" /> Gallery images</p>
            <label className="mt-3 flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-ink/25 px-4 py-4 text-sm font-semibold text-ink transition-colors hover:border-burgundy hover:text-burgundy">
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {uploading ? "Preparing media…" : "Choose image or video from your device"}
              <input id="pf-media-upload" type="file" accept="image/*,video/mp4,video/webm,video/quicktime" multiple disabled={uploading || images.length >= 5} onChange={(event) => { void uploadImages(event.currentTarget.files); event.currentTarget.value = ""; }} className="sr-only" />
            </label>
            <p className="mt-2 text-xs text-ink/55">Choose up to 5 images or supported videos. The first item is the cover.</p>
            <label htmlFor="pf-media-upload" className="btn-dark mt-3 flex w-full cursor-pointer items-center justify-center gap-2 px-4" aria-label="Add image or video from device"><Plus className="h-4 w-4" /> Add media</label>
            <div className="mt-4 grid grid-cols-3 gap-2">
              {images.map((img, i) => (
                <div key={img + i} className="group relative aspect-[3/4] overflow-hidden rounded-lg border border-ink/10">
                  {img.startsWith("data:video/") || /\.(mp4|webm|mov)(?:$|\?)/i.test(img) ? <video src={img} controls muted playsInline className="h-full w-full object-cover" /> : <><img src={img} alt="" className="h-full w-full object-cover" /></>}
                  {i === 0 && <span className="absolute top-1 left-1 rounded bg-burgundy px-1.5 py-0.5 text-[9px] font-bold text-cream">COVER</span>}
                  <button type="button" onClick={() => setImages(images.filter((x) => x !== img))} className="absolute top-1 right-1 rounded-full bg-ink/70 p-1 text-cream opacity-0 transition-opacity group-hover:opacity-100" aria-label="Remove"><X className="h-3 w-3" /></button>
                </div>
              ))}
              {images.length === 0 && <p className="col-span-3 rounded-lg border border-dashed border-ink/20 p-4 text-center text-xs text-ink/40">No images yet — add at least one.</p>}
            </div>
            <p className="label mt-5">Quick pick from library</p>
            <div className="thin-scroll grid max-h-52 grid-cols-4 gap-2 overflow-y-auto pr-1">{STOCK_IMAGES.map((img) => <button type="button" key={img} onClick={() => !images.includes(img) && images.length < 5 && setImages([...images, img])} className={`aspect-[3/4] overflow-hidden rounded-lg border-2 transition-all ${images.includes(img) ? "border-burgundy opacity-50" : "border-transparent hover:border-burgundy/50"}`}><img src={img} alt="" className="h-full w-full object-cover" loading="lazy" /></button>)}</div>
          </div>
          <div className="card space-y-5 p-7"><Toggle on={active} onClick={() => setActive(!active)} label="Live in shop" hint="Customers can see and order this dress" /><Toggle on={featured} onClick={() => setFeatured(!featured)} label="Featured" hint="Shown on the homepage signature rack" /></div>
        </div>
      </div>
      {error && <p className="rounded-xl bg-burgundy/10 px-4 py-3 text-sm font-semibold text-burgundy">{error}</p>}
      <div className="flex gap-3"><button type="submit" disabled={pending} className="btn-primary">{pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}{product ? "Save Changes" : "Publish Dress"}</button><button type="button" onClick={() => router.push("/admin/products")} className="btn-ghost">Cancel</button></div>
    </form>
  );
}
