export interface PlaceSearchResult {
    id: number;
    name: string;
    region: string | null;
    country: string;
    countryCode: string;

    latitude: number;
    longitude: number;

    timezone: string;
    population: number;
}
