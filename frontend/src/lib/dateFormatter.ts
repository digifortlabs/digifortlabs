/**
 * Formats a date string or Date object to DD/MM/YYYY
 */
export const formatDate = (dateString: string | Date | null | undefined): string => {
    if (!dateString) return '-';

    try {
        const date = new Date(dateString);
        // Check for invalid date
        if (isNaN(date.getTime())) return '-';

        return date.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    } catch (e) {
        return '-';
    }
};

/**
 * Formats a date string or Date object to DD/MM/YYYY, HH:MM AM/PM
 */
export const formatDateTime = (dateString: string | Date | null | undefined): string => {
    if (!dateString) return '-';

    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '-';

        return date.toLocaleString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        }).toUpperCase();
    } catch (e) {
        return '-';
    }
};
