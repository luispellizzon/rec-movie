export const languageNames: Record<string, string> = {
    fi: "Finnish",
    en: "English",
    fr: "French",
    de: "German",
    he: "Hebrew",
    es: "Spanish",
    zh: "Chinese",
    ja: "Japanese",
    da: "Danish",
    ko: "Korean",
    pl: "Polish",
    sv: "Swedish",
    it: "Italian",
    bs: "Bosnian",
    hi: "Hindi",
    ru: "Russian",
    no: "Norwegian",
    pt: "Portuguese",
    nl: "Dutch",
    el: "Greek",
    cs: "Czech",
    bn: "Bengali",
    cn: "Chinese (Old Code)",
    tn: "Tswana",
    sr: "Serbian",
    mn: "Mongolian",
    et: "Estonian",
    uk: "Ukrainian",
    is: "Icelandic",
    ca: "Catalan",
    ro: "Romanian",
    se: "Northern Sami",
    ps: "Pashto",
    th: "Thai",
    hu: "Hungarian",
    xx: "Unknown",
    tr: "Turkish",
    vi: "Vietnamese",
    sh: "Serbo-Croatian",
    fa: "Persian",
    ht: "Haitian Creole",
    bg: "Bulgarian",
    zu: "Zulu",
    ar: "Arabic",
    mr: "Marathi",
    ku: "Kurdish",
    bo: "Tibetan",
    ta: "Tamil",
    tl: "Tagalog",
    kk: "Kazakh"
};


export const parseMovie = (content: string, id: number) => {
    const titleMatch = content.match(/Title:\s*(.*?)\./s);
    const overviewMatch = content.match(/Overview:\s*(.*?)\s*Genres:/s);
    const genresMatch = content.match(/Genres:\s*(.*?)\./s);
    const yearMatch = content.match(/Year:\s*(\d{4})/);
    const runtimeMatch = content.match(/Runtime:\s*([\d.]+)/);
    const languageMatch = content.match(/Language:\s*(\w{2})/);
    const directorMatch = content.match(/Director:\s*(.*?)\./s);
    const countriesMatch = content.match(/Countries:\s*(.*?)\./s);

    const popularityMatch = content.match(/Popularity:\s*([0-9]+(?:\.[0-9]+)?)/);
    const ratingMatch = content.match(/Rating:\s*([0-9]+(?:\.[0-9]+)?)/);

    const posterMatch = content.match(/Poster:\s*(https:\/\/.*)$/m);

    function parsePythonList(text: string | undefined): string[] {
        if (!text) return [];
        try {
            const json = text
                .replace(/'/g, '"')   // convert Python to JSON
                .trim();
            return JSON.parse(json);
        } catch {
            return [];
        }
    }
    // ---------------------------------------------------

    return {
        id,
        title: titleMatch?.[1]?.trim() ?? "Unknown",
        description: overviewMatch?.[1]?.trim() ?? "",
        genres: parsePythonList(genresMatch?.[1]),
        year: yearMatch ? Number(yearMatch[1]) : null,
        duration: runtimeMatch ? Number(runtimeMatch[1]) : null,
        language: languageMatch ? languageMatch[1] : "",
        popularity: popularityMatch ? Number(popularityMatch[1]) : null,
        rating: ratingMatch ? Number(ratingMatch[1]) : null,
        poster: posterMatch ? posterMatch[1] : "",
        director: directorMatch ? directorMatch[1] : "",
        countries: parsePythonList(countriesMatch?.[1]),
    };
};

