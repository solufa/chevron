import { Logo } from './Logo'

export const TextsArea = () => (
  <main className="flex flex-col items-center justify-center pt-10 pb-4">
    <div className="scale-150 text-[4rem] leading-[1.15]">
      <Logo />
    </div>
    <p className="my-[1em] text-center text-[2.5rem] leading-[1.5] font-bold">
      人流データプラットフォーム
    </p>
  </main>
)
