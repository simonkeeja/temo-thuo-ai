## Vibe
- Dieter Rams Functionalism × Blueprint Material — authoritative government-grade data platform with precision grid structure, blueprint-style dividers, and restrained typographic hierarchy

## Color
- Primary: #2D3E59
- On Primary: #FFFFFF
- Accent: #06B6D4
- On Accent: #0F172A
- Background: #0F172A
- Foreground: #F8FAFC
- Muted: #2E374D
- Border: #475569
- Secondary: #334155

## Typography
- Heading: Plus Jakarta Sans (family: PlusJakartaSans, weight: 700, url: https://resource-static.bj.bcebos.com/fonts-skill/PlusJakartaSans_PlusJakartaSans[wght].ttf)
- Body: Plus Jakarta Sans (family: PlusJakartaSans, weight: 400, url: https://resource-static.bj.bcebos.com/fonts-skill/PlusJakartaSans_PlusJakartaSans[wght].ttf)

## Visual Language
- Core visual signature: Blueprint-style hairline rule dividers and column separators (1px solid Border) applied to tables, section headers, and card edges — referencing engineering drawing grids rather than generic card outlines
- Material & depth: Two-tier dark surface (Background for page, Secondary/Muted for card/panel); no box-shadow — depth expressed purely through surface-brightness contrast; subtle top-border accent stripe (Accent, 2px) on active nav items
- Containers & buttons: Cards use Secondary fill, 0px border-radius on desktop panels (sharp-edged engineering aesthetic), 4px radius on modals/dialogs; CTA buttons use Primary fill; secondary actions use Muted fill + Foreground text; status badges use Accent fill with On Accent text
- Layout rhythm: Three-column sidebar + content grid; KPI stat cards anchor each dashboard section with oversized numeric type (heading scale); Accent appears only on active states, icon highlights, chart lines, and status indicators — never fills large zones

## Animation
- Entrance: data rows and KPI cards fade-in with 150ms ease-out stagger on first load
- Interaction: button press scale(0.97) 80ms; sidebar nav item active transition 120ms
- Scroll / transition: route change crossfade 200ms; table filter results slide-replace 150ms

## Forbidden
- No gradient backgrounds or frosted-glass overlays
- No rounded hero banners or large Primary/Accent color fill zones
- No decorative particle or glow effects behind data surfaces

## Additional Notes
- Login page: split-screen layout — left panel features a full-bleed Botswana agricultural landscape image with Temo-Thuo AI branding overlay; right panel contains the login form on a Secondary surface
- National Situation Room uses Background as the full-screen base with large KPI numerals in Foreground and Accent-colored live indicator dots
- Map/GIS components use dark tile base maps consistent with Background color
- Status color extensions for data (not primary palette): success #22C55E, warning #F59E0B, danger #EF4444 — used only for status badges and chart series, never for backgrounds
