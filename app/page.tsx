import Link from "next/link";

export default function Home() {
  return (
    <>
      {/* الصفحة الرئيسية */}
      <h1 className="sr-only">فَزَوِّجُوهُ — وساطة زواج شرعي في الأردن</h1>
      <style>{`
        @media (prefers-reduced-motion: no-preference) {
          .hero-fade-up {
            animation: fazuwjuh-hero-fade-up 300ms ease-out both;
          }
        }
        @keyframes fazuwjuh-hero-fade-up {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      <section className="hero-fade-up border-b border-sand bg-paper">
        <div className="mx-auto max-w-3xl px-6 py-20 text-center sm:py-28">
          <div className="border-t border-b border-sand py-10 sm:py-14">
            <p className="font-display text-2xl leading-relaxed text-ink sm:text-4xl md:text-5xl">
              إِذَا جَاءَكُمْ مَنْ تَرْضَوْنَ دِينَهُ وَخُلُقَهُ فَزَوِّجُوهُ
            </p>
            <p className="mt-6 text-sm font-medium text-khaki">
              حديث شريف — أخرجه الترمذي
            </p>
          </div>

          <p className="mx-auto mt-10 max-w-xl text-base leading-7 text-ink">
            وساطة زواج شرعي في الأردن، بخصوصية كاملة: الاسم والهاتف لا
            يظهران للعموم، ولا تواصل مباشر بين الطرفين في أي مرحلة. كل شيء
            يمرّ عبر إدارة المبادرة.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/browse"
              className="inline-flex h-12 min-w-44 items-center justify-center rounded-md bg-olive px-6 text-base font-medium text-paper transition-colors hover:bg-olive-deep focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-olive"
            >
              تصفّح الاستمارات
            </Link>
            <Link
              href="/apply"
              className="inline-flex h-12 min-w-44 items-center justify-center rounded-md border border-sand px-6 text-base font-medium text-ink transition-colors hover:bg-sand-light focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-olive"
            >
              قدّم استمارتك
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-paper">
        <div className="mx-auto max-w-3xl px-6 py-16 sm:py-20">
          <header>
            <p className="text-sm font-medium text-khaki">الآلية</p>
            <h2 className="mt-1 flex items-baseline gap-4 font-sans text-2xl font-bold text-ink sm:text-3xl">
              كيف تعمل المنصة؟
              <span aria-hidden="true" className="h-px flex-1 bg-sand" />
            </h2>
          </header>

          <ol className="mt-10 grid gap-8 sm:grid-cols-2">
            <li className="flex gap-4">
              <span className="font-display text-2xl text-olive">١</span>
              <p className="text-base leading-7 text-ink">
                قدّم استمارتك ببياناتك وشروط من ترضاه شريكًا.
              </p>
            </li>
            <li className="flex gap-4">
              <span className="font-display text-2xl text-olive">٢</span>
              <p className="text-base leading-7 text-ink">
                تُراجعها الإدارة وتُنشر دون اسمك وهاتفك.
              </p>
            </li>
            <li className="flex gap-4">
              <span className="font-display text-2xl text-olive">٣</span>
              <p className="text-base leading-7 text-ink">
                يصل اهتمام من يراك مناسبًا إلى الإدارة.
              </p>
            </li>
            <li className="flex gap-4">
              <span className="font-display text-2xl text-olive">٤</span>
              <p className="text-base leading-7 text-ink">
                وساطة عبر المحادثة حتى إعلان التوافق.
              </p>
            </li>
          </ol>
        </div>
      </section>

      <section className="border-t border-sand bg-sand-light">
        <div className="mx-auto max-w-3xl px-6 py-14 text-center sm:py-16">
          <h2 className="font-sans text-xl font-bold text-ink">
            الخصوصية أولًا
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-ink">
            لا حسابات مطلوبة للتصفح؛ يمكنك مطالعة الاستمارات المنشورة بحرّية.
            التسجيل يتيح لك تقديم استمارتك والمحادثة مع إدارة المبادرة.
          </p>
        </div>
      </section>
    </>
  );
}
