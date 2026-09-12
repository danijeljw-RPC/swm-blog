import { calculateBirthChart } from "../../lib/astrology/chart/calculate-birth-chart";
import { renderBirthChartSvg } from "../../lib/astrology/chart/render/render-svg";
import type { BirthChart } from "../../lib/astrology/chart/types";
import type { PlaceSearchResult } from "../../lib/astrology/location/types";

export interface BirthChartFormPlace {
    id: number;
    name: string;
    region: string | null;
    country: string;
    latitude: number;
    longitude: number;
    timezone: string;
}

const aspectSymbols: Record<string, string> = {
    Conjunction: "☌",
    Sextile: "⚹",
    Square: "□",
    Trine: "△",
    Opposition: "☍"
};

function placeFromResult(place: PlaceSearchResult): BirthChartFormPlace {
    return {
        id: place.id,
        name: place.name,
        region: place.region,
        country: place.country,
        latitude: place.latitude,
        longitude: place.longitude,
        timezone: place.timezone
    };
}

function formatPoint(point: {
    sign: string;
    degree: number;
    minute: number;
}): string {
    return `${point.degree}°${point.minute
        .toString()
        .padStart(2, "0")}' ${point.sign}`;
}

function renderSummary(chart: BirthChart): string {
    const planetRows = chart.planets
        .map(planet => `
            <tr>
                <td>${planet.name}</td>
                <td>${formatPoint(planet)}</td>
                <td>House ${planet.house ?? "—"}</td>
            </tr>
        `)
        .join("");

    const aspectRows = chart.aspects
        .map(aspect => `
            <li>
                <span class="aspect-symbol">${aspectSymbols[aspect.type] ?? ""}</span>
                ${aspect.from} ${aspect.type.toLowerCase()} ${aspect.to}
                <small>orb ${aspect.orb.toFixed(1)}°</small>
            </li>
        `)
        .join("");

    return `
        <div class="chart-headline">
            <div>
                <span>Ascendant</span>
                <strong>${formatPoint(chart.ascendant)}</strong>
            </div>
            <div>
                <span>Midheaven</span>
                <strong>${formatPoint(chart.midheaven)}</strong>
            </div>
        </div>
        <table class="planet-table">
            <thead>
                <tr><th>Body</th><th>Position</th><th>House</th></tr>
            </thead>
            <tbody>${planetRows}</tbody>
        </table>
        <ul class="aspect-list">${aspectRows}</ul>
    `;
}

export interface BirthChartFormElements {
    form: HTMLFormElement;
    placeInput: HTMLInputElement;
    placeField: HTMLInputElement;
    dateField: HTMLInputElement;
    timeField: HTMLInputElement;
    submitButton: HTMLButtonElement;
    statusEl: HTMLElement;
    chartArt: HTMLElement;
    chartSummary: HTMLElement;
}

export function initBirthChartForm({
    form,
    placeField,
    dateField,
    timeField,
    submitButton,
    statusEl,
    chartArt,
    chartSummary
}: BirthChartFormElements): void {
    form.addEventListener("submit", async event => {
        event.preventDefault();

        statusEl.textContent = "";
        statusEl.hidden = true;

        if (!placeField.value) {
            statusEl.textContent = "Choose a place from the suggestions list.";
            statusEl.hidden = false;
            return;
        }

        if (!dateField.value || !timeField.value) {
            statusEl.textContent = "Enter both a date and a time of birth.";
            statusEl.hidden = false;
            return;
        }

        let place: BirthChartFormPlace;

        try {
            place = placeFromResult(JSON.parse(placeField.value));
        } catch {
            statusEl.textContent = "Choose a place from the suggestions list.";
            statusEl.hidden = false;
            return;
        }

        submitButton.disabled = true;
        submitButton.textContent = "Calculating…";

        try {
            const chart = await calculateBirthChart({
                date: dateField.value,
                time: timeField.value,
                place
            });

            chartArt.innerHTML = renderBirthChartSvg(chart);
            chartSummary.innerHTML = renderSummary(chart);
            chartArt.hidden = false;
            chartSummary.hidden = false;
        } catch (error) {
            statusEl.textContent =
                error instanceof Error
                    ? error.message
                    : "Something went wrong calculating this chart.";
            statusEl.hidden = false;
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = "Generate birth chart";
        }
    });
}
