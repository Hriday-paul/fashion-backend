
import type { Request } from "express";
import { UAParser } from "ua-parser-js";
import crypto from "crypto";

export const BuildFingerPrint = (req: Request): string => {
    if (!req?.headers) {
        throw new Error(
            "BuildFingerPrint: Request or headers are undefined"
        );
    }

    const userAgent = req.headers["user-agent"] ?? "";
    const { device, os, browser } = UAParser(userAgent);

    const forwardedFor = req.headers["x-forwarded-for"];

    const forwardedIp =
        typeof forwardedFor === "string"
            ? forwardedFor.split(",")[0]?.trim()
            : undefined;

    const ip =
        forwardedIp ||
        req.socket?.remoteAddress ||
        "unknown";

    const raw = [
        ip,
        browser.name || "",
        browser.version || "",
        os.name || "",
        os.version || "",
        device.type || "desktop",
        device.vendor || "",
        device.model || "",
    ].join(":");

    return crypto
        .createHash("sha256")
        .update(raw)
        .digest("hex");
};
