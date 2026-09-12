export interface Point {
    x: number;
    y: number;
}

export function polarToCartesian(
    longitude: number,
    radius: number,
    centerX: number,
    centerY: number
): Point {
    const radians = (longitude - 90) * Math.PI / 180;

    return {
        x: centerX + radius * Math.cos(radians),
        y: centerY + radius * Math.sin(radians)
    };
}
