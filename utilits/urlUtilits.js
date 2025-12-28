/**
 * разные полезные утилиты по работе с сслыками, адресом хоста и тд
 */

/**
 * 
 * @param {*} urlString - https://domen.name/local:300
 * @returns  - domen.name
 */
export function extractHost(urlString) {
  try {
    return new URL(urlString).hostname;
  } catch {
    return urlString; // fallback
  }
}