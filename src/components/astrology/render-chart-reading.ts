import type { BirthChartReading } from "../../lib/astrology/chart/interpretation";
import { formatChartPoint } from "../../lib/astrology/chart/interpretation";
import type { BirthChart } from "../../lib/astrology/chart/types";

export interface ChartReadingMetadata {
    localDate: string;
    localTime: string;
}

function escapeHtml(value: string): string {
    return value
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
}

export function renderChartReading(
    reading: BirthChartReading,
    chart: BirthChart,
    metadata: ChartReadingMetadata
): string {
    const place = [chart.birthplace.name, chart.birthplace.region, chart.birthplace.country]
        .filter(Boolean)
        .join(", ");
    const headlines = reading.headlines.map(item => `
        <article class="headline-card">
            <span>${escapeHtml(item.label)}</span>
            <strong>${escapeHtml(item.position)}</strong>
            <p>${escapeHtml(item.meaning)}</p>
        </article>`).join("");
    const legend = reading.legend.map(item => `
        <li><span class="legend-key legend-key--${escapeHtml(item.term.toLowerCase().split(" ")[0])}" aria-hidden="true"></span><strong>${escapeHtml(item.term)}</strong><span>${escapeHtml(item.meaning)}</span></li>`).join("");
    const placements = reading.placements.map(item => `
        <article class="placement-card">
            <header><span class="placement-symbol" aria-hidden="true">${escapeHtml(item.symbol)}</span><div><h3>${escapeHtml(item.name)} in ${escapeHtml(item.position.split(" ").at(-1) ?? "")}</h3><p>${escapeHtml(item.position)} · ${escapeHtml(item.houseLabel)}</p></div></header>
            <p class="placement-role">${escapeHtml(item.role)}</p>
            <p>${escapeHtml(item.interpretation)}</p>
        </article>`).join("");
    const aspects = reading.aspects.length
        ? `<ol class="aspect-list">${reading.aspects.map(item => `<li><span class="aspect-symbol" aria-hidden="true">${escapeHtml(item.symbol)}</span><div><strong>${escapeHtml(item.label)}</strong><small>${item.orb.toFixed(1)}° orb</small><p>${escapeHtml(item.interpretation)}</p></div></li>`).join("")}</ol>`
        : `<p class="empty-aspects">No major aspects were found within the supported orbs for this chart.</p>`;
    const planetRows = chart.planets.map(planet => `
        <tr><th scope="row">${escapeHtml(planet.name)}</th><td>${escapeHtml(formatChartPoint(planet))}</td><td>${planet.house ? `House ${planet.house}` : "—"}</td></tr>`).join("");

    return `
        <section class="chart-overview" aria-labelledby="chart-overview-title">
            <div class="section-heading"><p>Begin here</p><h2 id="chart-overview-title">Your chart at a glance</h2><p>These four points offer a clear doorway into the chart before you explore its finer detail.</p></div>
            <div class="headline-grid">${headlines}</div>
        </section>
        <aside class="chart-legend" aria-labelledby="chart-legend-title">
            <div><p>How to read the wheel</p><h2 id="chart-legend-title">Chart legend</h2></div>
            <ul>${legend}</ul>
        </aside>
        <section class="placement-readings" aria-labelledby="placement-title">
            <div class="section-heading"><p>What · how · where</p><h2 id="placement-title">Planet placements</h2><p>Each planet names a part of life, its sign describes how it may express itself, and its house points to where that theme may be encountered.</p></div>
            <div class="placement-grid">${placements}</div>
        </section>
        <section class="aspect-readings" aria-labelledby="aspect-title">
            <div class="section-heading"><p>Relationships in the chart</p><h2 id="aspect-title">Major aspects</h2><p>Tighter orbs appear first. They show where planetary themes cooperate, concentrate, or create useful tension.</p></div>
            ${aspects}
        </section>
        <details class="technical-details">
            <summary>Technical details</summary>
            <div class="technical-meta"><p><strong>Birthplace</strong><span>${escapeHtml(place)}</span></p><p><strong>Local birth time</strong><span>${escapeHtml(metadata.localDate)} at ${escapeHtml(metadata.localTime)}</span></p><p><strong>UTC instant</strong><span>${escapeHtml(chart.birthTimeUtc)}</span></p><p><strong>House system</strong><span>Placidus houses</span></p></div>
            <div class="table-scroll"><table class="planet-table"><thead><tr><th scope="col">Body</th><th scope="col">Position</th><th scope="col">House</th></tr></thead><tbody>${planetRows}</tbody></table></div>
        </details>
        <p class="chart-disclaimer">${escapeHtml(reading.disclaimer)}</p>`;
}
