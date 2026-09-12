import { jsPDF } from "jspdf";
import type { BirthChartReading } from "./interpretation";
import type { BirthChart } from "./types";

export interface BirthChartPdfInput {
    chart: BirthChart;
    reading: BirthChartReading;
    localDate: string;
    localTime: string;
    pageUrl: string;
}

const palette = {
    ink: [38, 25, 45] as const,
    muted: [93, 80, 97] as const,
    gold: [169, 136, 83] as const,
    rose: [174, 84, 103] as const,
    ivory: [248, 244, 235] as const,
    line: [216, 204, 184] as const
};

export function birthChartPdfFilename(placeName: string, date: string): string {
    const place = placeName
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "") || "chart";
    const safeDate = /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : "undated";
    return `birth-chart-${place}-${safeDate}.pdf`;
}

function polar(longitude: number, radius: number, cx: number, cy: number) {
    const radians = (longitude - 90) * Math.PI / 180;
    return { x: cx + radius * Math.cos(radians), y: cy + radius * Math.sin(radians) };
}

function drawChart(doc: jsPDF, chart: BirthChart, cx: number, cy: number, radius: number): void {
    doc.setDrawColor(...palette.ink);
    doc.setLineWidth(0.7);
    doc.circle(cx, cy, radius);
    doc.circle(cx, cy, radius * 0.66);

    doc.setDrawColor(...palette.line);
    doc.setLineWidth(0.25);
    for (const house of chart.houses) {
        const point = polar(house.longitude, radius, cx, cy);
        doc.line(cx, cy, point.x, point.y);
    }

    const byName = new Map(chart.planets.map(planet => [planet.name, planet]));
    for (const aspect of chart.aspects) {
        const from = byName.get(aspect.from);
        const to = byName.get(aspect.to);
        if (!from || !to) continue;
        const a = polar(from.longitude, radius * 0.52, cx, cy);
        const b = polar(to.longitude, radius * 0.52, cx, cy);
        const flowing = aspect.type === "Trine" || aspect.type === "Sextile";
        const joining = aspect.type === "Conjunction";
        const aspectColor = flowing ? palette.gold : joining ? palette.muted : palette.rose;
        doc.setDrawColor(aspectColor[0], aspectColor[1], aspectColor[2]);
        doc.setLineWidth(0.3);
        doc.line(a.x, a.y, b.x, b.y);
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.5);
    doc.setTextColor(...palette.ink);
    for (const planet of chart.planets) {
        const point = polar(planet.longitude, radius * 0.81, cx, cy);
        doc.setFillColor(...palette.ivory);
        doc.setDrawColor(...palette.gold);
        doc.circle(point.x, point.y, 4.2, "FD");
        doc.text(planet.name.slice(0, 3).toUpperCase(), point.x, point.y + 1, { align: "center" });
    }
}

export function createBirthChartPdf(input: BirthChartPdfInput): Uint8Array {
    const { chart, reading } = input;
    const doc = new jsPDF({ unit: "mm", format: "a4", compress: false });
    const width = 210;
    const height = 297;
    const margin = 18;
    const contentWidth = width - margin * 2;
    let y = 20;

    const paintPage = () => {
        doc.setFillColor(...palette.ivory);
        doc.rect(0, 0, width, height, "F");
    };
    const addPage = () => {
        doc.addPage();
        paintPage();
        y = 20;
    };
    const ensure = (needed: number) => {
        if (y + needed > height - 20) addPage();
    };
    const heading = (text: string, level: 1 | 2 = 2) => {
        ensure(level === 1 ? 18 : 13);
        doc.setFont("times", "normal");
        doc.setTextColor(...palette.ink);
        doc.setFontSize(level === 1 ? 25 : 17);
        doc.text(text, margin, y);
        y += level === 1 ? 10 : 8;
        doc.setDrawColor(...palette.gold);
        doc.setLineWidth(0.45);
        doc.line(margin, y, level === 1 ? width - margin : margin + 34, y);
        y += 6;
    };
    const paragraph = (text: string, options: { bold?: boolean; muted?: boolean; gap?: number } = {}) => {
        doc.setFont("helvetica", options.bold ? "bold" : "normal");
        const textColor = options.muted ? palette.muted : palette.ink;
        doc.setTextColor(textColor[0], textColor[1], textColor[2]);
        doc.setFontSize(9.5);
        const lines = doc.splitTextToSize(text, contentWidth) as string[];
        ensure(lines.length * 4.8 + (options.gap ?? 3));
        doc.text(lines, margin, y);
        y += lines.length * 4.8 + (options.gap ?? 3);
    };
    const place = [chart.birthplace.name, chart.birthplace.region, chart.birthplace.country].filter(Boolean).join(", ");

    paintPage();
    doc.setTextColor(...palette.gold);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text("SISTERS WITH MIRRORS", margin, y);
    y += 12;
    heading("Birth Chart Guide", 1);
    paragraph(`${input.localDate} at ${input.localTime} · ${place}`, { bold: true });
    paragraph("A personal map for symbolic reflection", { muted: true });
    drawChart(doc, chart, width / 2, 143, 56);
    y = 210;
    paragraph("How to read this guide", { bold: true });
    paragraph("A planet describes what part of life is speaking, its sign describes how that theme may be expressed, and its house describes where it may be encountered. Aspect lines show relationships between those themes.", { muted: true });
    paragraph(reading.disclaimer, { muted: true });

    addPage();
    heading("Your chart at a glance", 1);
    paragraph("Begin with these four placements before moving into the finer detail.", { muted: true, gap: 7 });
    for (const item of reading.headlines) {
        ensure(24);
        paragraph(`${item.label} · ${item.position}`, { bold: true, gap: 2 });
        paragraph(item.meaning, { muted: true, gap: 7 });
    }
    heading("Chart legend");
    for (const item of reading.legend) {
        paragraph(`${item.term}: ${item.meaning}`, { gap: 2 });
    }

    addPage();
    heading("Planet placements", 1);
    paragraph("Read each placement as what, how, and where - an invitation to reflection rather than a fixed verdict.", { muted: true, gap: 7 });
    for (const item of reading.placements) {
        ensure(34);
        paragraph(`${item.name} · ${item.position} · ${item.houseLabel}`, { bold: true, gap: 2 });
        paragraph(item.role, { muted: true, gap: 2 });
        paragraph(item.interpretation, { gap: 7 });
    }

    heading("Major aspects", 1);
    if (!reading.aspects.length) {
        paragraph("No major aspects were found within the supported orbs for this chart.", { muted: true });
    } else {
        for (const item of reading.aspects) {
            ensure(23);
            paragraph(`${item.label} · ${item.orb.toFixed(1)} degree orb`, { bold: true, gap: 2 });
            paragraph(item.interpretation, { muted: true, gap: 6 });
        }
    }

    heading("Technical notes", 1);
    paragraph(`Local birth time: ${input.localDate} at ${input.localTime}`);
    paragraph(`Birthplace: ${place}`);
    paragraph(`UTC instant: ${chart.birthTimeUtc}`);
    paragraph("House system: Placidus houses");
    paragraph("The chart includes the Sun, Moon, Mercury, Venus, Mars, Jupiter, Saturn, Uranus, Neptune, Pluto, and Chiron. Supported major aspects are conjunction, sextile, square, trine, and opposition.", { muted: true });
    paragraph(reading.disclaimer, { muted: true });
    doc.setTextColor(...palette.gold);
    doc.textWithLink("Return to the Birth Chart", margin, y + 3, { url: input.pageUrl });

    const pages = doc.getNumberOfPages();
    for (let page = 1; page <= pages; page += 1) {
        doc.setPage(page);
        doc.setDrawColor(...palette.line);
        doc.line(margin, height - 14, width - margin, height - 14);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7);
        doc.setTextColor(...palette.muted);
        doc.text("Sisters with Mirrors · Birth Chart Guide", margin, height - 9);
        doc.text(`Page ${page}`, width - margin, height - 9, { align: "right" });
    }

    return new Uint8Array(doc.output("arraybuffer"));
}

export function downloadBirthChartPdf(input: BirthChartPdfInput): void {
    const bytes = createBirthChartPdf(input);
    const blob = new Blob([bytes as BlobPart], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = birthChartPdfFilename(input.chart.birthplace.name, input.localDate);
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 0);
}
