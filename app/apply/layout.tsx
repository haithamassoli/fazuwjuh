import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "تقديم استمارة — فَزَوِّجُوهُ",
  description: "خطوات تقديم استمارة الزواج في مبادرة «فَزَوِّجُوهُ»",
};

export default function ApplyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
