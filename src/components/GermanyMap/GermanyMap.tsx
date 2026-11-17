import { useState } from "react";
import { GERMANY_PATH, GERMANY_VIEWBOX, STATE_SHAPES } from "../../assets/germanyShapes";
import "./GermanyMap.css";

/**
 * Germany and its 16 states as inline SVG (from VG1000, see scripts/map/overview_svg.py). Needs no
 * basemap or request, so it renders instantly and offline. A placeholder until the district
 * choropleth arrives: states highlight on hover and show their name.
 */
const GermanyMap: React.FC<{ className?: string }> = ({ className }) => {
  const [hovered, setHovered] = useState<string | null>(null);
  const name = STATE_SHAPES.find((s) => s.ags === hovered)?.name;

  return (
    <figure className={`germanyMap${className ? ` ${className}` : ""}`}>
      <svg viewBox={GERMANY_VIEWBOX} role="img" aria-label="Map of Germany with its 16 states">
        <defs>
          <pattern id="germanyMap-hatch" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="7" className="germanyMap__hatch" />
          </pattern>
        </defs>
        <path d={GERMANY_PATH} className="germanyMap__shadow" />
        <g>
          {STATE_SHAPES.map((s) => (
            <path
              key={s.ags}
              d={s.d}
              className={`germanyMap__state${hovered === s.ags ? " germanyMap__state--hover" : ""}`}
              onMouseEnter={() => setHovered(s.ags)}
              onMouseLeave={() => setHovered((h) => (h === s.ags ? null : h))}
            >
              <title>{s.name}</title>
            </path>
          ))}
        </g>
        <path d={GERMANY_PATH} className="germanyMap__hatchLayer" />
        <path d={GERMANY_PATH} className="germanyMap__border" />
      </svg>
      <figcaption className="germanyMap__caption" aria-live="polite">
        {name ?? "Hover a state"}
      </figcaption>
    </figure>
  );
};

export default GermanyMap;
