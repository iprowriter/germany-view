import { MapPin, Menu, X } from "lucide-react";
import { useState } from "react";
import { NAVIGATION, type NavItem } from "../../config/navigation";
import "./Sidebar.css";

interface SidebarProps {
  /** Id of the page shown. */
  current: string;
  onSelect: (id: string) => void;
}

/**
 * The app's navigation: Explore, Decide, the twelve GovData themes, and Live now / Sources at the
 * bottom. On narrow screens it collapses behind a menu button.
 */
const Sidebar: React.FC<SidebarProps> = ({ current, onSelect }) => {
  const [open, setOpen] = useState(false);

  const select = (item: NavItem) => {
    onSelect(item.id);
    setOpen(false);
  };

  return (
    <aside className={`sidebar${open ? " sidebar--open" : ""}`}>
      <span className="tricolor" aria-hidden="true" />
      <div className="sidebar__brand">
        <span className="sidebar__mark" aria-hidden="true">
          <MapPin size={18} strokeWidth={2.25} />
        </span>
        <span className="sidebar__name">
          <span className="sidebar__title">Germany View</span>
          <span className="sidebar__subtitle">Open data · 400 districts</span>
        </span>
        <button
          type="button"
          className="sidebar__toggle"
          aria-expanded={open}
          aria-controls="sidebar-nav"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((o) => !o)}
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      <nav id="sidebar-nav" className="sidebar__nav" aria-label="Main">
        {NAVIGATION.map((section) => (
          <div key={section.id} className={`sidebar__section sidebar__section--${section.id}`}>
            {section.label && <h2 className="sidebar__heading">{section.label}</h2>}
            <ul>
              {section.items.map((item) => {
                const Icon = item.icon;
                const active = item.id === current;
                return (
                  <li key={item.id}>
                    <a
                      href={`#/${item.id}`}
                      className={`sidebar__item${active ? " sidebar__item--active" : ""}`}
                      aria-current={active ? "page" : undefined}
                      title={item.description}
                      onClick={(e) => {
                        e.preventDefault();
                        select(item);
                      }}
                    >
                      <Icon size={18} aria-hidden="true" />
                      <span>{item.label}</span>
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;
