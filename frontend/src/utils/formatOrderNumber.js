// Format order number with role prefix
// Bu- for buyer, Sl- for seller
export function formatOrderNumber(orderNumber, role = "buyer") {
    if (!orderNumber) return "-";
    // Replace H2H- prefix with role-based prefix
    const prefix = role === "seller" ? "Sl" : "Bu";
    return orderNumber.replace(/^H2H-/, `${prefix}-`);
}
