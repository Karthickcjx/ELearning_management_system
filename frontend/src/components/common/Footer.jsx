import { Link } from "react-router-dom";
import { Facebook, Instagram, Linkedin } from "lucide-react";

const FOOTER_COLUMNS = [
  {
    title: "Product",
    links: [
      { label: "Web Development", to: "/courses" },
      { label: "Data Science", to: "/courses" },
      { label: "Cloud Engineering", to: "/courses" },
      { label: "Design", to: "/courses" },
    ],
  },
  {
    title: "Learn",
    links: [
      { label: "Backend Developer", to: "/courses" },
      { label: "AI Engineer", to: "/courses" },
      { label: "DevOps Engineer", to: "/courses" },
      { label: "Product Analyst", to: "/courses" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About Us", to: "/" },
      { label: "Teach on EduVerse", to: "/" },
      { label: "Contact", to: "/" },
      { label: "Help & Support", to: "/" },
    ],
  },
  {
    title: "Connect",
    links: [
      { label: "Blog", to: "/" },
      { label: "Community", to: "/" },
      { label: "Careers", to: "/" },
      { label: "Press", to: "/" },
    ],
  },
];

const SOCIAL_LINKS = [
  { Icon: Facebook, label: "Facebook", href: "/" },
  { Icon: Instagram, label: "Instagram", href: "/" },
  { Icon: Linkedin, label: "LinkedIn", href: "/" },
];

function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="w-full bg-slate-900 text-slate-300">
      <div className="max-w-container-xl mx-auto px-6 py-12">
        <div className="mx-auto max-w-5xl">
          <div className="grid grid-cols-2 gap-x-10 gap-y-8 md:grid-cols-4 lg:gap-x-16">
            {FOOTER_COLUMNS.map((column) => (
              <div key={column.title} className="min-w-0">
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-white">
                  {column.title}
                </h3>
                <ul>
                  {column.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        to={link.to}
                        className="block py-1 text-sm text-slate-400 transition-colors hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60 rounded"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <p className="mt-10 text-xs text-slate-500">
            Built for learners, by learners.
          </p>

          <div className="mt-8 flex flex-col gap-3 border-t border-slate-800 pt-8 md:flex-row md:items-center md:justify-between">
            <p className="text-sm text-slate-400">
              &copy; {year} EduVerse. All rights reserved.
            </p>
            <div className="flex items-center gap-2" aria-label="Social links">
              {SOCIAL_LINKS.map(({ Icon, label, href }) => (
                <Link
                  key={label}
                  to={href}
                  aria-label={label}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-400 transition-colors hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                >
                  <Icon size={20} />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
