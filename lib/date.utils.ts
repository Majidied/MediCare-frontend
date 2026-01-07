/**
 * Date utility functions to handle local timezone formatting
 * Prevents date offset issues caused by UTC conversion
 */

/**
 * Get a date string in YYYY-MM-DD format using local timezone
 * This avoids the timezone offset issue that occurs with toISOString()
 * 
 * @param date - The date to format (defaults to current date)
 * @returns Date string in YYYY-MM-DD format
 */
export function getLocalDateString(date: Date = new Date()): string {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')

    return `${year}-${month}-${day}`
}

/**
 * Get the current date in YYYY-MM-DD format using local timezone
 * 
 * @returns Today's date string in YYYY-MM-DD format
 */
export function getTodayLocalDateString(): string {
    return getLocalDateString(new Date())
}
