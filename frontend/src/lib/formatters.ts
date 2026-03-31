export const toTitleCase = (str: string) => {
    return str.replace(/\b\w/g, c => c.toUpperCase());
};

export const toUpperCaseMRD = (str: string) => {
    return str.toUpperCase();
};

export const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 2
    }).format(amount);
};
