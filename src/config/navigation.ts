/**
 * The sidebar: every page of the app, in three sections. The Themes section is the GovData
 * (DCAT-AP.de) categories, so the app is organised the way German open data is published.
 *
 * `sources` are dataset ids from data/sources.json that feed the page (checked by navigation.test.ts
 * against that file, when it exists). `planned` lists what the page will show; until a page is built
 * the app shows it as a preview.
 */
import type { LucideIcon } from "lucide-react";
import {
  ArrowLeftRight,
  Banknote,
  Building2,
  Compass,
  FlaskConical,
  GraduationCap,
  HeartPulse,
  House,
  Info,
  Landmark,
  Leaf,
  Map,
  MapPin,
  Radio,
  Scale,
  TrainFront,
  Users,
  Wheat,
  Zap,
} from "lucide-react";

export interface NavItem {
  /** Stable id, used in the URL (#/<id>). For themes: the GovData category slug from data/sources.json. */
  id: string;
  label: string;
  icon: LucideIcon;
  /** One sentence: what the page answers. */
  description: string;
  /** The headline number its Overview card will show (all pages except the Overview itself). */
  keyFigure?: string;
  planned: readonly string[];
  sources: readonly string[];
}

export interface NavSection {
  id: "explore" | "decide" | "themes" | "footer";
  /** Shown above the items; the footer has none. */
  label: string | null;
  items: readonly NavItem[];
}

export const NAVIGATION: readonly NavSection[] = [
  {
    id: "explore",
    label: "Explore",
    items: [
      {
        id: "overview",
        label: "Overview",
        icon: Map,
        description: "All 400 districts on one map, coloured by any indicator from any category.",
        planned: ["District map coloured by a chosen indicator", "States as an outline layer", "Indicator picker grouped by category"],
        sources: ["boundaries.vg1000", "inkar.2025"],
      },
      {
        id: "profile",
        label: "Profile",
        icon: MapPin,
        description: "One state or district across all twelve categories.",
        keyFigure: "Rank on ~560 indicators",
        planned: ["Rank on every indicator", "Trends since 1995 where available", "How it compares with its state and Germany"],
        sources: ["inkar.2025", "zensus2022.regional"],
      },
      {
        id: "compare",
        label: "Compare",
        icon: ArrowLeftRight,
        description: "Two to four places side by side, plus the most similar districts.",
        keyFigure: "Most similar districts",
        planned: ["Side-by-side indicators", "“Most similar districts” across standardised indicators"],
        sources: ["inkar.2025", "zensus2022.regional"],
      },
    ],
  },
  {
    id: "decide",
    label: "Decide",
    items: [
      {
        id: "where-to-live",
        label: "Where to live",
        icon: Compass,
        description: "Weight what matters to you and get a ranking of districts, with every number traced to its source.",
        keyFigure: "Your best-matching districts",
        planned: ["Sliders for rent, safety, schools, air, transport and jobs", "Live ranking with explanations"],
        sources: ["inkar.2025", "zensus2022.grid_1km", "justice.pks2025", "environment.uba_air"],
      },
      {
        id: "rent-housing",
        label: "Rent & housing",
        icon: House,
        description: "Rents, vacancy and ownership from the 2022 census, on a 1 km grid.",
        keyFigure: "Average net rent per m²",
        planned: ["Average net rent per m² on a 1 km grid", "Vacancy and ownership rates", "Heating type and energy source"],
        sources: ["zensus2022.grid_1km", "zensus2022.regional"],
      },
    ],
  },
  {
    id: "themes",
    label: "Themes",
    items: [
      {
        id: "population-society",
        label: "Population & society",
        icon: Users,
        description: "Who lives where: population, age, origin, households and deprivation.",
        keyFigure: "Residents",
        planned: ["Population and density", "Age structure", "Households", "Socioeconomic deprivation (GISD)"],
        sources: ["zensus2022.regional", "inkar.2025", "society.gisd"],
      },
      {
        id: "education-culture-sport",
        label: "Education, culture & sport",
        icon: GraduationCap,
        description: "Schools, school-leaving qualifications and education levels.",
        keyFigure: "School leavers with Abitur",
        planned: ["All schools by type", "School leavers by qualification", "Distance to the nearest primary school"],
        sources: ["education.jedeschule", "inkar.2025", "zensus2022.regional"],
      },
      {
        id: "health",
        label: "Health",
        icon: HeartPulse,
        description: "Hospitals, doctors and care.",
        keyFigure: "GPs per 100,000 residents",
        planned: ["Hospitals and rehab clinics", "Doctors and GPs per resident", "Care homes and people in need of care"],
        sources: ["health.krankenhausverzeichnis", "inkar.2025"],
      },
      {
        id: "justice-safety",
        label: "Justice & public safety",
        icon: Scale,
        description: "Recorded crime by offence type, and road safety.",
        keyFigure: "Offences per 100,000 residents",
        planned: ["Crime rate per 100,000 residents by offence type", "Large cities compared", "Road deaths"],
        sources: ["justice.pks2025", "inkar.2025"],
      },
      {
        id: "economy-finance",
        label: "Economy & finance",
        icon: Banknote,
        description: "Jobs, income, output and public money.",
        keyFigure: "Unemployment rate",
        planned: ["Unemployment", "Household income", "GDP per resident", "Municipal debt and tax revenue"],
        sources: ["inkar.2025"],
      },
      {
        id: "energy",
        label: "Energy",
        icon: Zap,
        description: "How people charge, drive and heat.",
        keyFigure: "Public charging points",
        planned: ["Public charging points per district", "Electric and hybrid cars", "Heating type and energy source"],
        sources: ["energy.ladesaeulen", "inkar.2025", "zensus2022.grid_1km"],
      },
      {
        id: "environment",
        label: "Environment",
        icon: Leaf,
        description: "Air, water, climate and land use.",
        keyFigure: "Annual mean NO₂",
        planned: ["Air quality 2016–2025", "Bathing water quality", "Climate since 1881", "Land use and green space"],
        sources: ["environment.uba_air", "environment.bathing_water", "environment.dwd_climate", "inkar.2025"],
      },
      {
        id: "transport",
        label: "Transport",
        icon: TrainFront,
        description: "Getting around: public transport, cars and road accidents.",
        keyFigure: "Road accidents with injuries",
        planned: ["Public transport stops and departures", "Reach of motorways and long-distance stations", "Road accidents 2025"],
        sources: ["transport.unfallatlas_2025", "inkar.2025"],
      },
      {
        id: "agriculture-food",
        label: "Agriculture & food",
        icon: Wheat,
        description: "Farmland, forest and what farming leaves behind.",
        keyFigure: "Share of farmland",
        planned: ["Farmland and forest share", "Nitrogen surplus"],
        sources: ["inkar.2025"],
      },
      {
        id: "science-technology",
        label: "Science & technology",
        icon: FlaskConical,
        description: "Universities, students and broadband.",
        keyFigure: "Households with broadband",
        planned: ["Students per district", "Broadband coverage"],
        sources: ["inkar.2025"],
      },
      {
        id: "government-public-sector",
        label: "Government & public sector",
        icon: Landmark,
        description: "Elections and public finances.",
        keyFigure: "Turnout, federal election 2025",
        planned: ["Federal election 2025 by district", "Turnout", "Public finances"],
        sources: ["government.btw2025", "inkar.2025"],
      },
      {
        id: "regions-cities",
        label: "Regions & cities",
        icon: Building2,
        description: "Settlement structure, East and West, and history in place.",
        keyFigure: "Stolpersteine recorded",
        planned: ["Urban and rural districts", "East and West since 1990", "Stolpersteine"],
        sources: ["inkar.2025", "history.stolpersteine"],
      },
    ],
  },
  {
    id: "footer",
    label: null,
    items: [
      {
        id: "live",
        label: "Live now",
        icon: Radio,
        description: "Weather, river levels, departures and roadworks for the selected place, when online.",
        keyFigure: "Weather now",
        planned: ["Weather (DWD)", "River levels (PEGELONLINE)", "Autobahn roadworks", "Departures (DB)"],
        sources: [],
      },
      {
        id: "sources",
        label: "Sources & coverage",
        icon: Info,
        description: "Every dataset with its publisher, licence and which places it covers.",
        keyFigure: "Datasets with licence and coverage",
        planned: ["All datasets from data/sources.json", "Coverage per district", "Licences and attribution"],
        sources: [],
      },
    ],
  },
];

export const ALL_ITEMS: readonly NavItem[] = NAVIGATION.flatMap((s) => s.items);

export const DEFAULT_PAGE = "overview";

export const findItem = (id: string): NavItem | undefined => ALL_ITEMS.find((i) => i.id === id);

/** The section a page belongs to ("Themes" for Health). */
export const findSection = (id: string): NavSection | undefined => NAVIGATION.find((s) => s.items.some((i) => i.id === id));
