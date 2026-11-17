import { ArrowUpRight, ChevronDown, CloudSun, Construction, Database, Droplets, HardDriveDownload, TrainFront } from "lucide-react";
import GermanyMap from "../components/GermanyMap/GermanyMap";
import { ALL_ITEMS, findItem, NAVIGATION, type NavItem } from "../config/navigation";
import "./Overview.css";

interface OverviewProps {
  onSelect: (id: string) => void;
}

const section = (id: string) => NAVIGATION.find((s) => s.id === id)!.items;

/**
 * A gentle placeholder curve per page, so the theme cards don't all look the same. Deterministic
 * (seeded by the page id) and drawn in grey: it stands for "a trend goes here", not for data.
 */
const placeholderTrend = (seed: string, width = 120, height = 32, points = 9): string => {
  let h = 2166136261;
  for (const c of seed) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  const ys = Array.from({ length: points }, (_, i) => {
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    const noise = ((h >>> 0) % 1000) / 1000;
    return height * (0.25 + 0.5 * (0.55 * noise + 0.45 * (0.5 + 0.5 * Math.sin(i / 1.6))));
  });
  return ys.map((y, i) => `${i ? "L" : "M"}${((i / (points - 1)) * width).toFixed(1)},${y.toFixed(1)}`).join("");
};

/** A link card to a page: the whole card is clickable and keeps the URL in sync. */
const CardLink: React.FC<{ item: NavItem; onSelect: (id: string) => void; className?: string; children: React.ReactNode }> = ({
  item,
  onSelect,
  className,
  children,
}) => (
  <a
    href={`#/${item.id}`}
    className={`ovCard ${className ?? ""}`}
    aria-label={`${item.label}: ${item.description}`}
    onClick={(e) => {
      e.preventDefault();
      onSelect(item.id);
    }}
  >
    {children}
  </a>
);

const Skeleton: React.FC<{ width?: string; className?: string }> = ({ width = "60%", className }) => (
  <span className={`skeleton ${className ?? ""}`} style={{ width }} aria-hidden="true" />
);

const SectionHeader: React.FC<{ title: string; note?: string }> = ({ title, note }) => (
  <div className="ovSection__header">
    <h2>{title}</h2>
    {note && <span className="ovSection__note">{note}</span>}
  </div>
);

const Overview: React.FC<OverviewProps> = ({ onSelect }) => {
  const overview = findItem("overview")!;
  const journeys = [...section("explore").filter((i) => i.id !== "overview"), ...section("decide")];
  const themes = section("themes");
  const live = findItem("live")!;
  const sources = findItem("sources")!;
  // Datasets feeding at least one page (ids from data/sources.json).
  const datasetCount = new Set(ALL_ITEMS.flatMap((t) => t.sources)).size;

  return (
    <div className="overview">
      <header className="overview__header">
        <p className="overview__eyebrow">Explore</p>
        <h1>{overview.label}</h1>
        <p className="overview__lead">
          Germany's 400 districts and 16 states, compared across everything the state publishes about them.
        </p>
        <ul className="overview__facts" aria-label="At a glance">
          <li>
            <strong>400</strong> districts
          </li>
          <li>
            <strong>16</strong> states
          </li>
          <li>
            <strong>{themes.length}</strong> themes
          </li>
          <li>
            <strong>{datasetCount}</strong> datasets
          </li>
          <li className="overview__offline">
            <HardDriveDownload size={14} aria-hidden="true" /> Works offline
          </li>
        </ul>
      </header>

      {/* ---- Map + ranking ---------------------------------------------------------------- */}
      <section className="ovHero" aria-label="Map of Germany">
        <div className="ovHero__map ovPanel">
          <div className="ovToolbar">
            <button type="button" className="ovSelect" disabled title="Coming soon">
              <span className="ovSelect__label">Indicator</span>
              <span className="ovSelect__value">Unemployment rate</span>
              <ChevronDown size={16} aria-hidden="true" />
            </button>
            <div className="ovSegmented" role="group" aria-label="Level">
              <button type="button" className="ovSegmented__item ovSegmented__item--active" disabled>
                Districts
              </button>
              <button type="button" className="ovSegmented__item" disabled>
                States
              </button>
            </div>
          </div>

          <GermanyMap className="ovHero__germany" />

          <div className="ovLegend" aria-hidden="true">
            <span className="ovLegend__bar" />
            <span className="ovLegend__labels">
              <span>Low</span>
              <span>High</span>
            </span>
          </div>
        </div>

        <aside className="ovHero__side">
          <div className="ovPanel ovRanking">
            <div className="ovPanel__title">
              <span>Highest</span>
              <span className="ovPill">Preview</span>
            </div>
            <ol>
              {[78, 64, 70, 58, 66].map((w, i) => (
                <li key={i}>
                  <span className="ovRanking__rank">{i + 1}</span>
                  <Skeleton width={`${w}%`} />
                  <Skeleton width="34px" className="skeleton--value" />
                </li>
              ))}
            </ol>
          </div>
          <div className="ovPanel ovRanking">
            <div className="ovPanel__title">
              <span>Lowest</span>
            </div>
            <ol>
              {[62, 74, 55, 69, 60].map((w, i) => (
                <li key={i}>
                  <span className="ovRanking__rank">{400 - i}</span>
                  <Skeleton width={`${w}%`} />
                  <Skeleton width="34px" className="skeleton--value" />
                </li>
              ))}
            </ol>
          </div>
          <div className="ovPanel ovSelected">
            <p className="ovSelected__title">Pick a district</p>
            <p className="ovSelected__text">Click the map to see a district's value, its rank and how it compares with its state.</p>
          </div>
        </aside>
      </section>

      {/* ---- Explore & decide ------------------------------------------------------------- */}
      <section className="ovSection">
        <SectionHeader title="Explore & decide" />
        <div className="ovGrid ovGrid--journeys">
          {journeys.map((item) => {
            const Icon = item.icon;
            return (
              <CardLink key={item.id} item={item} onSelect={onSelect} className="ovJourney">
                <span className="ovCard__icon">
                  <Icon size={20} strokeWidth={1.9} aria-hidden="true" />
                </span>
                <span className="ovCard__body">
                  <span className="ovCard__title">{item.label}</span>
                  <span className="ovCard__text">{item.description}</span>
                  <span className="ovCard__figure">{item.keyFigure}</span>
                </span>
                <ArrowUpRight size={18} className="ovCard__arrow" aria-hidden="true" />
              </CardLink>
            );
          })}
        </div>
      </section>

      {/* ---- Themes ------------------------------------------------------------------------ */}
      <section className="ovSection">
        <SectionHeader title="Themes" note="Values and trends appear as each theme is built" />
        <div className="ovGrid ovGrid--themes">
          {themes.map((item) => {
            const Icon = item.icon;
            return (
              <CardLink key={item.id} item={item} onSelect={onSelect} className="ovTheme">
                <span className="ovTheme__top">
                  <span className="ovCard__icon ovCard__icon--small">
                    <Icon size={18} strokeWidth={1.9} aria-hidden="true" />
                  </span>
                  <span className="ovCard__title">{item.label}</span>
                  <ArrowUpRight size={16} className="ovCard__arrow" aria-hidden="true" />
                </span>
                <span className="ovTheme__figure">{item.keyFigure}</span>
                <span className="ovTheme__value">
                  <Skeleton width="46%" className="skeleton--big" />
                  <svg className="ovTheme__trend" viewBox="0 0 120 32" preserveAspectRatio="none" aria-hidden="true">
                    <path d={placeholderTrend(item.id)} />
                  </svg>
                </span>
                <span className="ovTheme__footer">
                  <Database size={13} aria-hidden="true" />
                  {item.sources.length} {item.sources.length === 1 ? "dataset" : "datasets"}
                </span>
              </CardLink>
            );
          })}
        </div>
      </section>

      {/* ---- Live + sources ---------------------------------------------------------------- */}
      <section className="ovSection">
        <SectionHeader title="Right now & behind the numbers" />
        <div className="ovGrid ovGrid--bottom">
          <CardLink item={live} onSelect={onSelect} className="ovLive">
            <span className="ovLive__head">
              <span className="ovLive__dot" aria-hidden="true" />
              <span className="ovCard__title">{live.label}</span>
              <span className="ovPill ovPill--muted">Needs internet</span>
              <ArrowUpRight size={18} className="ovCard__arrow" aria-hidden="true" />
            </span>
            <span className="ovLive__tiles">
              {[
                { icon: CloudSun, label: "Weather" },
                { icon: Droplets, label: "River levels" },
                { icon: TrainFront, label: "Departures" },
                { icon: Construction, label: "Roadworks" },
              ].map(({ icon: TileIcon, label }) => (
                <span key={label} className="ovLive__tile">
                  <TileIcon size={18} strokeWidth={1.9} aria-hidden="true" />
                  <span className="ovLive__label">{label}</span>
                  <Skeleton width="70%" />
                </span>
              ))}
            </span>
          </CardLink>

          <CardLink item={sources} onSelect={onSelect} className="ovSources">
            <span className="ovLive__head">
              <span className="ovCard__icon ovCard__icon--small">
                <sources.icon size={18} strokeWidth={1.9} aria-hidden="true" />
              </span>
              <span className="ovCard__title">{sources.label}</span>
              <ArrowUpRight size={18} className="ovCard__arrow" aria-hidden="true" />
            </span>
            <span className="ovSources__stats">
              <span>
                <strong>{datasetCount}</strong>
                <small>datasets</small>
              </span>
              <span>
                <strong>105 MB</strong>
                <small>offline, map included</small>
              </span>
            </span>
            <span className="ovCard__text">{sources.description}</span>
          </CardLink>
        </div>
      </section>
    </div>
  );
};

export default Overview;
