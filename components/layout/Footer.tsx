import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-[#F9F9F9] border-t border-[#E5E5E5] mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-16 pb-8">

        {/* 4-column grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-10 mb-14">

          {/* About */}
          <div>
            <Link
              href="/"
              className="font-serif text-xl font-bold tracking-[0.25em] text-[#2A2A2A] uppercase block mb-4"
            >
              KAIVA
            </Link>
            <p className="text-[13px] text-[#555] leading-relaxed max-w-[220px]">
              Handmade artisanal jewelry crafted for every lifestyle moment.
              Premium quality, everyday luxury.
            </p>

            {/* Social icons — thin stroke SVGs */}
            <div className="flex gap-3 mt-6">
              <a
                href="#"
                aria-label="Instagram"
                className="h-8 w-8 flex items-center justify-center border border-[#DDDBD7] text-[#6B6B6B] hover:border-[#C5A059] hover:text-[#C5A059] transition-colors"
              >
                {/* Instagram icon */}
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                  <circle cx="12" cy="12" r="4" />
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                </svg>
              </a>
              <a
                href="#"
                aria-label="Pinterest"
                className="h-8 w-8 flex items-center justify-center border border-[#DDDBD7] text-[#6B6B6B] hover:border-[#C5A059] hover:text-[#C5A059] transition-colors"
              >
                {/* Pinterest P icon */}
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2C6.477 2 2 6.477 2 12c0 4.236 2.636 7.855 6.356 9.312-.088-.791-.167-2.005.035-2.868.181-.78 1.172-4.97 1.172-4.97s-.299-.598-.299-1.482c0-1.388.806-2.428 1.808-2.428.853 0 1.267.64 1.267 1.408 0 .858-.546 2.141-.828 3.33-.236.995.499 1.806 1.476 1.806 1.771 0 3.132-1.867 3.132-4.562 0-2.387-1.715-4.056-4.163-4.056-2.836 0-4.499 2.127-4.499 4.326 0 .856.33 1.775.741 2.276a.3.3 0 0 1 .069.285c-.075.313-.243.995-.276 1.134-.044.181-.147.219-.338.132-1.249-.581-2.03-2.407-2.03-3.874 0-3.154 2.292-6.052 6.608-6.052 3.469 0 6.165 2.473 6.165 5.776 0 3.447-2.173 6.22-5.19 6.22-1.013 0-1.966-.527-2.292-1.148l-.623 2.378c-.226.869-.835 1.958-1.244 2.621.937.29 1.931.446 2.962.446 5.523 0 10-4.477 10-10S17.523 2 12 2z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Shop With Us */}
          <div>
            <h4 className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#2A2A2A] mb-5">
              Shop With Us
            </h4>
            <ul className="space-y-3">
              {[
                ["All Jewellery", "/shop"],
                ["Necklaces", "/shop?category=necklace"],
                ["Earrings", "/shop?category=earring"],
                ["Rings", "/shop?category=ring"],
                ["Anklets", "/shop?category=anklet"],
                ["Handbands", "/shop?category=handband"],
              ].map(([label, href]) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-[13px] text-[#555] hover:text-[#C5A059] transition-colors"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Information */}
          <div>
            <h4 className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#2A2A2A] mb-5">
              Information
            </h4>
            <ul className="space-y-3">
              {[
                ["About Us", "#"],
                ["Shipping & Returns", "#"],
                ["Privacy Policy", "#"],
                ["Terms of Service", "#"],
                ["Care Instructions", "#"],
              ].map(([label, href]) => (
                <li key={label}>
                  <a
                    href={href}
                    className="text-[13px] text-[#555] hover:text-[#C5A059] transition-colors"
                  >
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#2A2A2A] mb-5">
              Contact
            </h4>
            <ul className="space-y-3">
              <li>
                <a
                  href="mailto:hello@kaiva.in"
                  className="text-[13px] text-[#555] hover:text-[#C5A059] transition-colors"
                >
                  hello@kaiva.in
                </a>
              </li>
              <li>
                <a
                  href="tel:+919999999999"
                  className="text-[13px] text-[#555] hover:text-[#C5A059] transition-colors"
                >
                  +91 99999 99999
                </a>
              </li>
              <li className="text-[13px] text-[#555] leading-relaxed pt-1">
                Mon – Sat, 10am – 6pm IST
              </li>
            </ul>
            <div>
              <Link
                href="/account"
                className="mt-4 inline-flex items-center text-[13px] text-[#555] hover:text-[#C5A059] transition-colors"
              >
                My Account →
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-[#E5E5E5] pt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-[11px] text-[#999] tracking-wide">
            © {new Date().getFullYear()} KAIVA. All rights reserved.
          </p>

          {/* Payment icons placeholder */}
          <div className="flex items-center gap-3">
            {["VISA", "UPI", "RuPay", "Razorpay"].map((method) => (
              <span
                key={method}
                className="text-[9px] font-semibold uppercase tracking-wider text-[#999] border border-[#E0E0E0] px-2 py-1"
              >
                {method}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
