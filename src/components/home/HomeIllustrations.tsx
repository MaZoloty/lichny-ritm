import type { SVGProps } from "react";

type IllustrationProps = SVGProps<SVGSVGElement> & {
  className?: string;
};

export function PlantSceneIllustration({ className, ...props }: IllustrationProps) {
  return (
    <svg
      viewBox="0 0 220 190"
      fill="none"
      aria-hidden="true"
      className={className}
      {...props}
    >
      <ellipse cx="116" cy="164" rx="86" ry="13" fill="#D8C7FF" opacity="0.2" />
      <path
        d="M29 142c38-12 88-11 150 4v13H29v-17Z"
        fill="#EDE4FF"
        opacity="0.75"
      />
      <rect
        x="77"
        y="126"
        width="96"
        height="22"
        rx="6"
        transform="rotate(-5 77 126)"
        fill="#D8C7FF"
      />
      <rect
        x="82"
        y="117"
        width="96"
        height="22"
        rx="6"
        transform="rotate(-5 82 117)"
        fill="#F3EDFF"
      />
      <path
        d="M82 128.5c28-3 58-6 95-9"
        stroke="white"
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.75"
      />
      <path
        d="M62 111h29v20a14.5 14.5 0 0 1-14.5 14.5A14.5 14.5 0 0 1 62 131v-20Z"
        fill="#EADFFF"
      />
      <path
        d="M91 117h5c7 0 12 5 12 12s-5 12-12 12h-5"
        stroke="#C7B4F6"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <path
        d="M142 83c-10 11-15 22-15 35"
        stroke="#97C98C"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M155 61c-8 14-12 34-12 61"
        stroke="#97C98C"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M173 79c-17 10-27 23-31 41"
        stroke="#97C98C"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M139 67c11 3 20 15 17 28-12-2-21-12-17-28Z"
        fill="#BFE2AC"
        opacity="0.85"
      />
      <path
        d="M155 40c13 9 19 24 14 40-14-7-20-21-14-40Z"
        fill="#BFE2AC"
        opacity="0.85"
      />
      <path
        d="M185 69c-1 14-11 25-26 28 0-15 10-25 26-28Z"
        fill="#D4EBC9"
        opacity="0.9"
      />
      <path
        d="M174 100c-8 10-20 14-33 10 8-11 20-15 33-10Z"
        fill="#BFE2AC"
        opacity="0.8"
      />
      <path
        d="M128 95c10 2 17 10 17 21-11-1-18-9-17-21Z"
        fill="#D4EBC9"
      />
      <path
        d="M131 116h49l-8 42h-33l-8-42Z"
        fill="#F5EBD8"
      />
      <path
        d="M135 116h41"
        stroke="#FFF8EA"
        strokeWidth="7"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function BankCardIllustration({ className, ...props }: IllustrationProps) {
  return (
    <svg viewBox="0 0 130 92" fill="none" aria-hidden="true" className={className} {...props}>
      <ellipse cx="66" cy="76" rx="46" ry="8" fill="#CDB3FF" opacity="0.22" />
      <rect x="29" y="34" width="78" height="42" rx="10" transform="rotate(-13 29 34)" fill="#CDB3FF" />
      <rect x="37" y="41" width="38" height="6" rx="3" transform="rotate(-13 37 41)" fill="#EBDDFF" />
      <rect x="83" y="48" width="17" height="12" rx="4" transform="rotate(-13 83 48)" fill="#FFF0B8" opacity="0.9" />
      <rect x="22" y="48" width="76" height="39" rx="10" transform="rotate(-13 22 48)" fill="#E9DDFF" opacity="0.72" />
    </svg>
  );
}

export function HabitProgressIllustration({ className, ...props }: IllustrationProps) {
  return (
    <svg viewBox="0 0 130 110" fill="none" aria-hidden="true" className={className} {...props}>
      <circle cx="78" cy="61" r="42" fill="#E8F4E6" opacity="0.9" />
      <circle cx="78" cy="61" r="29" stroke="#CDECCB" strokeWidth="10" />
      <path d="M78 32a29 29 0 0 1 28 36" stroke="#9EDDA5" strokeWidth="10" strokeLinecap="round" />
      <circle cx="78" cy="61" r="19" fill="#9EDDA5" />
      <path d="m69 61 6 6 13-15" stroke="white" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M105 83c-6 8-15 10-23 6 6-8 15-10 23-6Z" fill="#BFE2AC" opacity="0.8" />
    </svg>
  );
}

export function GoalMountainIllustration({ className, ...props }: IllustrationProps) {
  return (
    <svg viewBox="0 0 140 108" fill="none" aria-hidden="true" className={className} {...props}>
      <path d="M9 93c24-36 42-54 55-54s31 18 55 54H9Z" fill="#D8C7FF" />
      <path d="M51 93c20-30 35-45 46-45 10 0 23 15 40 45H51Z" fill="#B996F6" opacity="0.72" />
      <path d="M63 39 51 56l12-5 8 5-8-17Z" fill="#F6F1FF" opacity="0.78" />
      <path d="M95 48 84 63l11-5 8 5-8-15Z" fill="#F6F1FF" opacity="0.82" />
      <path d="M37 89c22-2 34-16 51-14 10 1 16 7 22 13" stroke="#F7F0FF" strokeWidth="7" strokeLinecap="round" />
      <path d="M95 22v37" stroke="#8B5CF6" strokeWidth="4" strokeLinecap="round" />
      <path d="M97 22c11 0 14 5 23 3v20c-10 3-15-4-23-3V22Z" fill="#F08C82" />
    </svg>
  );
}

export function SavingsJarIllustration({ className, ...props }: IllustrationProps) {
  return (
    <svg viewBox="0 0 130 112" fill="none" aria-hidden="true" className={className} {...props}>
      <ellipse cx="68" cy="96" rx="42" ry="8" fill="#BFDDF4" opacity="0.22" />
      <rect x="45" y="24" width="44" height="72" rx="18" fill="#DFF1FB" opacity="0.78" stroke="#CBE6F8" strokeWidth="2" />
      <rect x="38" y="19" width="58" height="13" rx="6.5" fill="#F8FDFF" stroke="#CBE6F8" strokeWidth="2" />
      <circle cx="47" cy="84" r="12" fill="#F0C3A9" />
      <circle cx="65" cy="83" r="12" fill="#F5D0B6" />
      <circle cx="82" cy="84" r="12" fill="#E8BFA9" />
      <path d="M94 65c-9 8-18 10-28 6 7-9 17-12 28-6Z" fill="#9FD2B0" opacity="0.75" />
      <path d="M96 49c-11 6-20 6-28 0 10-7 19-7 28 0Z" fill="#BFE2AC" opacity="0.72" />
      <path d="M73 92c8-18 18-31 29-38" stroke="#86B996" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function DebtPaymentIllustration({ className, ...props }: IllustrationProps) {
  return (
    <svg viewBox="0 0 116 96" fill="none" aria-hidden="true" className={className} {...props}>
      <rect x="32" y="16" width="58" height="68" rx="16" fill="#FCEAE6" />
      <rect x="38" y="28" width="45" height="7" rx="3.5" fill="#F4B1A7" opacity="0.55" />
      <rect x="38" y="43" width="31" height="6" rx="3" fill="#F4B1A7" opacity="0.35" />
      <rect x="38" y="56" width="38" height="6" rx="3" fill="#F4B1A7" opacity="0.35" />
      <circle cx="34" cy="74" r="13" fill="#FFF8EF" stroke="#F0C3B9" strokeWidth="2" />
      <path d="M28 74h12" stroke="#D77C70" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
