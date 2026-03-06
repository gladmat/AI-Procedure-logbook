export interface Hospital {
  id: string;
  name: string;
  city: string;
  country: string;
}

export const HOSPITALS: Hospital[] = [
  // NZ
  {
    id: "waikato-hospital",
    name: "Waikato Hospital",
    city: "Hamilton",
    country: "NZ",
  },
  {
    id: "auckland-city-hospital",
    name: "Auckland City Hospital",
    city: "Auckland",
    country: "NZ",
  },
  {
    id: "middlemore-hospital",
    name: "Middlemore Hospital",
    city: "Auckland",
    country: "NZ",
  },
  {
    id: "christchurch-hospital",
    name: "Christchurch Hospital",
    city: "Christchurch",
    country: "NZ",
  },
  {
    id: "wellington-hospital",
    name: "Wellington Hospital",
    city: "Wellington",
    country: "NZ",
  },
  // Australia
  {
    id: "royal-melbourne-hospital",
    name: "Royal Melbourne Hospital",
    city: "Melbourne",
    country: "AU",
  },
  {
    id: "royal-prince-alfred-hospital",
    name: "Royal Prince Alfred Hospital",
    city: "Sydney",
    country: "AU",
  },
  {
    id: "royal-brisbane-and-womens-hospital",
    name: "Royal Brisbane and Women's Hospital",
    city: "Brisbane",
    country: "AU",
  },
  {
    id: "fiona-stanley-hospital",
    name: "Fiona Stanley Hospital",
    city: "Perth",
    country: "AU",
  },
  {
    id: "royal-adelaide-hospital",
    name: "Royal Adelaide Hospital",
    city: "Adelaide",
    country: "AU",
  },
  // UK
  {
    id: "st-andrews-centre-for-plastic-surgery",
    name: "St Andrew's Centre for Plastic Surgery, Broomfield Hospital",
    city: "Chelmsford",
    country: "UK",
  },
  {
    id: "queen-victoria-hospital",
    name: "Queen Victoria Hospital",
    city: "East Grinstead",
    country: "UK",
  },
  {
    id: "canniesburn-plastic-surgery-unit",
    name: "Canniesburn Plastic Surgery Unit",
    city: "Glasgow",
    country: "UK",
  },
  {
    id: "stoke-mandeville-hospital",
    name: "Stoke Mandeville Hospital",
    city: "Aylesbury",
    country: "UK",
  },
  {
    id: "salisbury-district-hospital",
    name: "Salisbury District Hospital",
    city: "Salisbury",
    country: "UK",
  },
  // DACH
  {
    id: "universitatsspital-zurich",
    name: "Universitätsspital Zürich",
    city: "Zürich",
    country: "CH",
  },
  {
    id: "inselspital-bern",
    name: "Inselspital Bern",
    city: "Bern",
    country: "CH",
  },
  {
    id: "charite-universitatsmedizin-berlin",
    name: "Charité – Universitätsmedizin Berlin",
    city: "Berlin",
    country: "DE",
  },
  {
    id: "bg-unfallklinik-ludwigshafen",
    name: "BG Unfallklinik Ludwigshafen",
    city: "Ludwigshafen",
    country: "DE",
  },
  {
    id: "medizinische-universitat-wien",
    name: "Medizinische Universität Wien",
    city: "Wien",
    country: "AT",
  },
];
