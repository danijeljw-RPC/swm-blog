import { calculateBirthChart } from "../../lib/astrology/chart/calculate-birth-chart";
import { renderBirthChartSvg } from "../../lib/astrology/chart/render/render-svg";
import { buildBirthChartReading } from "../../lib/astrology/chart/interpretation";
import type { BirthChartReading } from "../../lib/astrology/chart/interpretation";
import { downloadBirthChartPdf } from "../../lib/astrology/chart/pdf";
import type { BirthChart } from "../../lib/astrology/chart/types";
import type { PlaceSearchResult } from "../../lib/astrology/location/types";
import { renderChartReading } from "./render-chart-reading";

export interface BirthChartFormPlace {
    id: number;
    name: string;
    region: string | null;
    country: string;
    latitude: number;
    longitude: number;
    timezone: string;
}

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
    downloadButton: HTMLButtonElement;
}

export function initBirthChartForm({
    form,
    placeField,
    dateField,
    timeField,
    submitButton,
    statusEl,
    chartArt,
    chartSummary,
    downloadButton
}: BirthChartFormElements): void {
    let downloadable: {
        chart: BirthChart;
        reading: BirthChartReading;
        localDate: string;
        localTime: string;
    } | null = null;

    downloadButton.addEventListener("click", async () => {
        if (!downloadable) return;
        const originalLabel = downloadButton.textContent;
        downloadButton.disabled = true;
        downloadButton.setAttribute("aria-busy", "true");
        downloadButton.textContent = "Preparing guide…";
        await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
        try {
            downloadBirthChartPdf({
                ...downloadable,
                pageUrl: new URL("/astrology/birth-chart/", window.location.origin).href
            });
        } catch {
            statusEl.textContent = "Your chart is still available, but the PDF could not be created. Please try again.";
            statusEl.hidden = false;
        } finally {
            downloadButton.disabled = false;
            downloadButton.removeAttribute("aria-busy");
            downloadButton.textContent = originalLabel;
        }
    });

    form.addEventListener("submit", async event => {
        event.preventDefault();

        statusEl.textContent = "";
        statusEl.hidden = true;
        downloadButton.hidden = true;
        downloadable = null;

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
            const reading = buildBirthChartReading(chart);

            chartArt.innerHTML = renderBirthChartSvg(chart);
            chartSummary.innerHTML = renderChartReading(reading, chart, {
                localDate: dateField.value,
                localTime: timeField.value
            });
            chartArt.hidden = false;
            chartSummary.hidden = false;
            downloadable = {
                chart,
                reading,
                localDate: dateField.value,
                localTime: timeField.value
            };
            downloadButton.hidden = false;
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
