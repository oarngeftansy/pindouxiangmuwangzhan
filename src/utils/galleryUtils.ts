const GALLERY_KEY = 'bead_gallery_v1';

export interface GalleryItem {
  id: string;
  createdAt: number;
  title: string;
  thumbnailUrl: string;    // data URL (ironing/HD render result)
  gridWidth: number;
  gridHeight: number;
  beadCount: number;       // 已填充的豆子数
  colorCount: number;      // 使用的颜色种数
  ironingMethod?: string;  // 熨烫方式描述
}

export function getGallery(): GalleryItem[] {
  try {
    const raw = localStorage.getItem(GALLERY_KEY);
    return raw ? (JSON.parse(raw) as GalleryItem[]) : [];
  } catch {
    return [];
  }
}

export function addToGallery(
  item: Omit<GalleryItem, 'id' | 'createdAt' | 'title'>,
): GalleryItem {
  const gallery = getGallery();
  const newItem: GalleryItem = {
    ...item,
    id: Date.now().toString(),
    createdAt: Date.now(),
    title: `作品 #${gallery.length + 1}`,
  };
  gallery.unshift(newItem);
  localStorage.setItem(GALLERY_KEY, JSON.stringify(gallery));
  return newItem;
}

export function removeFromGallery(id: string): void {
  const gallery = getGallery().filter((item) => item.id !== id);
  localStorage.setItem(GALLERY_KEY, JSON.stringify(gallery));
}

export function updateGalleryTitle(id: string, title: string): void {
  const gallery = getGallery().map((item) =>
    item.id === id ? { ...item, title } : item,
  );
  localStorage.setItem(GALLERY_KEY, JSON.stringify(gallery));
}
