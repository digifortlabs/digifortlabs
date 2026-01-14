export const toTitleCase = (str: string) => {
    return str.replace(/\b\w/g, c => c.toUpperCase());
};

export const toUpperCaseMRD = (str: string) => {
    return str.toUpperCase();
};
