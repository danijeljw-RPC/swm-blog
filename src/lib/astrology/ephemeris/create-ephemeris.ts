import { SwissEphemeris } from "@swisseph/browser";

let instance: Promise<SwissEphemeris> | undefined;

export function getSwissEphemeris(): Promise<SwissEphemeris> {
    instance ??= (async () => {
        const swe = new SwissEphemeris();
        await swe.init();

        // Chiron (and Swiss Ephemeris house/obliquity calculations) require
        // the standard ephemeris data files even when planets use Moshier.
        // Loaded once per session from jsDelivr into the WASM virtual FS.
        await swe.loadStandardEphemeris();

        return swe;
    })();

    return instance;
}
