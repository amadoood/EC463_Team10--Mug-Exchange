export const SERVER_URL = "https://ec463-diallo-amado.onrender.com";
//export const SERVER_URL = "http://localhost:3000";

// Each coffee has a global menu entry
export const coffees = [
  { id: "Black Coffee",                 label: "Black Coffee",                 blurb: "Classic hot coffee",                                      price: 4.19, emoji: "☕" },
  { id: "Decaf Black Coffee",           label: "Decaf Black Coffee",           blurb: "Classic hot coffee, minus the caffeine",                  price: 4.19, emoji: "☕" },
  { id: "Black Coffee w/ Cream",        label: "Black Coffee w/ Creamer",      blurb: "Classic hot coffee with creamer",                         price: 5.25, emoji: "☕" },
  { id: "Decaf Black Coffee w/ Cream",  label: "Decaf Black Coffee w/ Cream",  blurb: "Classic hot coffee with creamer, minus the caffeine",     price: 5.25, emoji: "☕" },
  //{ id: "Matcha Latte",               label: "Matcha Latte",              blurb: "Ceremonial grade matcha with steamed oat milk",           price: 5.25, emoji: "🍵" },
  //{ id: "Cortado",                    label: "Cortado",                   blurb: "Equal parts espresso and warm milk, no foam",             price: 4.00, emoji: "☕" },
];

// Real coordinates around BU / Kenmore area Boston
// Each cafe has its own menu subset
export const cafes = [
  {
    id: "gsu-starbucks",
    name: "Starbucks @ GSU",
    area: "Boston University",
    address: "775 Commonwealth Ave, Boston",
    dist: "0.1 mi",
    mugs: 14,
    lat: 42.35105145014871,
    lng: -71.10903023360551,
    menu: ["Iced Cappuchino", "Pecan Crunch Oatmilk Latte", "Espresso", "Cold Brew"],
  },  
  {
    id: "pavement",
    name: "Pavement Coffeehouse",
    area: "Commonwealth Ave",
    address: "736 Commonwealth Ave, Boston",
    dist: "0.3 mi",
    mugs: 8,
    lat: 42.34991986265836,
    lng: -71.10727664951213,
    menu: ["Iced Cappuchino", "Cold Brew", "Matcha Latte", "Cortado"],
  }, 
  {
    id: "bluebottle",
    name: "Saxby's at BU",
    area: "Boston University",
    address: "665 Commonwealth Ave, Boston",
    dist: "0.7 mi",
    mugs: 0,
    lat: 42.35024275463619,
    lng: -71.10314002716507,
    menu: ["Espresso", "Cold Brew", "Cortado"],
  }, 
  {
    id: "cfa",
    name: "Cafe 472",
    area: "Kenmore Sq",
    address: "472 Commonwealth Ave, Boston",
    dist: "0.4 mi",
    mugs: 5,
    lat: 42.34895964885412,
    lng: -71.09359768395947,
    menu: ["Iced Cappuchino", "Matcha Latte", "Espresso"],
  },  
  {
    id: "tatte",
    name: "Tatte Bakery & Café",
    area: "Brookline Ave",
    address: "1003 Beacon St, Brookline",
    dist: "0.6 mi",
    mugs: 10,
    lat: 42.34572790,
    lng: -71.10686204,
    menu: ["Iced Cappuchino", "Pecan Crunch Oatmilk Latte", "Matcha Latte", "Cold Brew"],
  },  
  {
    id: "ogawa",
    name: "Caffè Nero",
    area: "Packard's Corner",
    address: "1047 Commonwealth Ave, Boston",
    dist: "0.9 mi",
    mugs: 6,
    lat: 42.35258273330155,
    lng: -71.12267835173266,
    menu: ["Espresso", "Cortado", "Cold Brew", "Matcha Latte"],
  }, 
];

export const STATUS_META = {
  IN_PROGRESS:  { label: "In Progress" },
  READY_PICKUP: { label: "Ready Pickup" },
  MUG_RETURNED: { label: "Returned" },
};
