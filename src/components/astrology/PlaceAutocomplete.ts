import { searchPlaces } from "../../lib/astrology/location/search";
import type { PlaceSearchResult } from "../../lib/astrology/location/types";

export interface PlaceAutocompleteOptions {
    input: HTMLInputElement;
    resultsContainer: HTMLElement;
    hiddenField: HTMLInputElement;
    onSelect?: (place: PlaceSearchResult | null) => void;
}

const DEBOUNCE_MS = 250;

export function initPlaceAutocomplete({
    input,
    resultsContainer,
    hiddenField,
    onSelect
}: PlaceAutocompleteOptions): void {
    let debounceTimer: ReturnType<typeof setTimeout> | undefined;
    let controller: AbortController | undefined;
    let results: PlaceSearchResult[] = [];

    function clearSelection(): void {
        hiddenField.value = "";
        onSelect?.(null);
    }

    function closeResults(): void {
        resultsContainer.replaceChildren();
        resultsContainer.hidden = true;
    }

    function labelFor(place: PlaceSearchResult): string {
        return [place.name, place.region, place.country]
            .filter(Boolean)
            .join(", ");
    }

    function renderResults(): void {
        if (results.length === 0) {
            closeResults();
            return;
        }

        resultsContainer.replaceChildren();

        for (const place of results) {
            const option = document.createElement("button");
            option.type = "button";
            option.className = "place-option";
            option.setAttribute("role", "option");

            const label = document.createElement("span");
            label.className = "place-option-label";
            label.textContent = [place.name, place.region]
                .filter(Boolean)
                .join(", ");

            const country = document.createElement("small");
            country.textContent = place.country;

            option.appendChild(label);
            option.appendChild(country);

            option.addEventListener("click", () => {
                input.value = labelFor(place);
                hiddenField.value = JSON.stringify(place);
                onSelect?.(place);
                closeResults();
            });

            resultsContainer.appendChild(option);
        }

        resultsContainer.hidden = false;
    }

    input.addEventListener("input", () => {
        clearSelection();

        const query = input.value.trim();

        if (debounceTimer) {
            clearTimeout(debounceTimer);
        }

        if (query.length < 2) {
            closeResults();
            return;
        }

        debounceTimer = setTimeout(async () => {
            controller?.abort();
            controller = new AbortController();

            try {
                results = await searchPlaces(query, controller.signal);
                renderResults();
            } catch (error) {
                if ((error as Error).name !== "AbortError") {
                    closeResults();
                }
            }
        }, DEBOUNCE_MS);
    });

    input.addEventListener("blur", () => {
        setTimeout(closeResults, 150);
    });

    input.addEventListener("focus", () => {
        if (results.length > 0) {
            resultsContainer.hidden = false;
        }
    });
}
