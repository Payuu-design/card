import { CARD_FIRST_DIGIT_ALLOWED } from "../config/constants.js";

export function validateExpMonth(month) {
    if(!month) return false;
    month = String(month);
    const monthNumber = Number(month);
    return /^\d{1,2}$/.test(month) && monthNumber >= 1 && monthNumber <= 12;
}

export function validateExpYear(year) {
    if(!year) return false;
    year = String(year);
    return /^\d{4}$/.test(year) && Number(year) >= new Date().getFullYear();
}

export function validateCardNumber(card) {
    if(!card) return false;
    card = String(card);
    return /^\d{16}$/.test(card) && CARD_FIRST_DIGIT_ALLOWED.includes(Number(card[0]));
}

export function cardIsWestern(card) {
    return String(card)[1] >= 5;
}

export function parseOwnerName(owner) {
    return owner.toLowerCase().split(' ').map((name) => name[0].toUpperCase() + name.slice(1)).join(' ');
}
