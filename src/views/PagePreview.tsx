import { Database, ListChecks } from "lucide-react";
import { findSection, type NavItem } from "../config/navigation";
import "./PagePreview.css";

/**
 * What a page shows until it's built: its purpose, what it will contain and which downloaded
 * datasets feed it (ids from data/sources.json).
 */
const PagePreview: React.FC<{ item: NavItem }> = ({ item }) => {
  const Icon = item.icon;
  const section = findSection(item.id)?.label;
  return (
    <article className="preview">
      <header className="preview__header">
        <span className="preview__icon" aria-hidden="true">
          <Icon size={24} strokeWidth={1.9} />
        </span>
        <div>
          {section && <p className="preview__eyebrow">{section}</p>}
          <h1>{item.label}</h1>
          <p className="preview__description">{item.description}</p>
        </div>
      </header>

      <p className="preview__status">
        <span className="preview__dot" aria-hidden="true" />
        In preparation: this is what the page will show.
      </p>

      <div className="preview__grid">
        <section className="preview__card">
          <h2>
            <ListChecks size={16} aria-hidden="true" />
            Planned
          </h2>
          <ul className="preview__list">
            {item.planned.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </section>

        {item.sources.length > 0 && (
          <section className="preview__card">
            <h2>
              <Database size={16} aria-hidden="true" />
              Data
            </h2>
            <ul className="preview__sources">
              {item.sources.map((s) => (
                <li key={s}>
                  <code>{s}</code>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </article>
  );
};

export default PagePreview;
