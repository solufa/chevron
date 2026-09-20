const chevronClasses =
  "relative inline-block box-border h-[22px] w-[22px] before:absolute before:top-[7px] before:block before:box-border before:h-2 before:w-2 before:rotate-45 before:content-[''] after:absolute after:top-[7px] after:block after:box-border after:h-2 after:w-2 after:rotate-45 after:content-['']"

export const Logo = () => (
  <span className="font-bold">
    <i
      aria-hidden="true"
      className={`${chevronClasses} [transform:translate(-15%,-50%)_scale(4.5)] before:left-[6px] before:border-b-2 before:border-l-2 after:left-[11px] after:border-b-2 after:border-l-2`}
    />{' '}
    CHE<span className="text-[120%] text-[#06c]">V</span>RON{' '}
    <i
      aria-hidden="true"
      className={`${chevronClasses} [transform:translate(20%,-50%)_scale(4.5)] before:right-[6px] before:border-t-2 before:border-r-2 after:right-[11px] after:border-t-2 after:border-r-2`}
    />
  </span>
)
