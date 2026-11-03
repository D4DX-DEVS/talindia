/** Third-party photographs used as atmosphere. Each needs its credit shown on the site (footer). */
export interface PhotoCredit {
  title: string;
  creator: string;
  license: string;
  licenseUrl: string;
  page: string;
}

export const placeCredits: PhotoCredit[] = [
  {
    title: "Sunset in Kozhikode beach",
    creator: "Davidjose365",
    license: "CC BY-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0",
    page: "https://commons.wikimedia.org/wiki/File:Sunset_in_Kozhikode_beach.jpg",
  },
  {
    title: "Dubai Skyline mit Burj Khalifa",
    creator: "Tim Reckmann",
    license: "CC BY 2.0",
    licenseUrl: "https://creativecommons.org/licenses/by/2.0/",
    page: "https://commons.wikimedia.org/w/index.php?curid=82789105",
  },
];
