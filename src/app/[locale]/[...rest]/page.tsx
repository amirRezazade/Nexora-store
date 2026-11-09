import { notFound } from "next/navigation";

/** مسیرهای ناشناخته داخل locale → 404 محلی */
export default function CatchAllPage() {
  notFound();
}
