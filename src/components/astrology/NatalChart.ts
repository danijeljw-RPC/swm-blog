import { calculateBirthChart } from "../../lib/astrology/chart/calculate-birth-chart";
import { renderBirthChartSvg } from "../../lib/astrology/chart/render/render-svg";
import { buildBirthChartReading } from "../../lib/astrology/chart/interpretation";
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
    form.addEventListener("submit", async event => {
        event.preventDefault();

        statusEl.textContent = "";
        statusEl.hidden = true;
        downloadButton.hidden = true;

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
