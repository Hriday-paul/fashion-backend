import { PrismaClient } from "@prisma/client";


export async function SizeSeed(prisma: PrismaClient) {

    const ltrSizes = [
        {
            "title": "XXXS",
            "UK": "XXXS",
            "US": "XXXS",
            "EU": "XXXS",
            "FR": "XXXS",
            "IT": "XXXS"
        },
        {
            "title": "XXS",
            "UK": "XXS",
            "US": "XXS",
            "EU": "XXS",
            "FR": "XXS",
            "IT": "XXS"
        },
        {
            "title": "XS",
            "UK": "XS",
            "US": "XS",
            "EU": "XS",
            "FR": "XS",
            "IT": "XS"
        },
        {
            "title": "S",
            "UK": "S",
            "US": "S",
            "EU": "S",
            "FR": "S",
            "IT": "S"
        },
        {
            "title": "M",
            "UK": "M",
            "US": "M",
            "EU": "M",
            "FR": "M",
            "IT": "M"
        },
        {
            "title": "L",
            "UK": "L",
            "US": "L",
            "EU": "L",
            "FR": "L",
            "IT": "L"
        },
        {
            "title": "XL",
            "UK": "XL",
            "US": "XL",
            "EU": "XL",
            "FR": "XL",
            "IT": "XL"
        },
        {
            "title": "XXL",
            "UK": "XXL",
            "US": "XXL",
            "EU": "XXL",
            "FR": "XXL",
            "IT": "XXL"
        },
        {
            "title": "XXXL",
            "UK": "XXXL",
            "US": "XXXL",
            "EU": "XXXL",
            "FR": "XXXL",
            "IT": "XXXL"
        },
        {
            "title": "4XL",
            "UK": "4XL",
            "US": "4XL",
            "EU": "4XL",
            "FR": "4XL",
            "IT": "4XL"
        },
        {
            "title": "5XL",
            "UK": "5XL",
            "US": "5XL",
            "EU": "5XL",
            "FR": "5XL",
            "IT": "5XL"
        },
        {
            "title": "One Size",
            "UK": "One Size",
            "US": "One Size",
            "EU": "One Size",
            "FR": "One Size",
            "IT": "One Size"
        }
    ];

    // Womens Clothings
    const womensClothing = [
        {
            "title": "0",
            "UK": "4",
            "US": "0",
            "EU": "32",
            "FR": "32",
            "IT": "36"
        },
        {
            "title": "2",
            "UK": "6",
            "US": "2",
            "EU": "34",
            "FR": "34",
            "IT": "38"
        },
        {
            "title": "4",
            "UK": "8",
            "US": "4",
            "EU": "36",
            "FR": "36",
            "IT": "40"
        },
        {
            "title": "6",
            "UK": "10",
            "US": "6",
            "EU": "38",
            "FR": "38",
            "IT": "42"
        },
        {
            "title": "8",
            "UK": "12",
            "US": "8",
            "EU": "40",
            "FR": "40",
            "IT": "44"
        },
        {
            "title": "10",
            "UK": "14",
            "US": "10",
            "EU": "42",
            "FR": "42",
            "IT": "46"
        },
        {
            "title": "12",
            "UK": "16",
            "US": "12",
            "EU": "44",
            "FR": "44",
            "IT": "48"
        },
        {
            "title": "14",
            "UK": "18",
            "US": "14",
            "EU": "46",
            "FR": "46",
            "IT": "50"
        },
        {
            "title": "16",
            "UK": "20",
            "US": "16",
            "EU": "48",
            "FR": "48",
            "IT": "52"
        },
        {
            "title": "18",
            "UK": "22",
            "US": "18",
            "EU": "50",
            "FR": "50",
            "IT": "54"
        },
        {
            "title": "20",
            "UK": "24",
            "US": "20",
            "EU": "52",
            "FR": "52",
            "IT": "56"
        },
        {
            "title": "22",
            "UK": "26",
            "US": "22",
            "EU": "54",
            "FR": "54",
            "IT": "58"
        },
        {
            "title": "24",
            "UK": "28",
            "US": "24",
            "EU": "56",
            "FR": "56",
            "IT": "60"
        },
        {
            "title": "26",
            "UK": "30",
            "US": "26",
            "EU": "58",
            "FR": "58",
            "IT": "62"
        },
        {
            "title": "28",
            "UK": "32",
            "US": "28",
            "EU": "60",
            "FR": "60",
            "IT": "64"
        }
    ]

    //mens tailoring
    const mensTaloring = [
        {
            "title": "32",
            "UK": "32",
            "US": "32",
            "EU": "42",
            "FR": "42",
            "IT": "42"
        },
        {
            "title": "34",
            "UK": "34",
            "US": "34",
            "EU": "44",
            "FR": "44",
            "IT": "44"
        },
        {
            "title": "36",
            "UK": "36",
            "US": "36",
            "EU": "46",
            "FR": "46",
            "IT": "46"
        },
        {
            "title": "38",
            "UK": "38",
            "US": "38",
            "EU": "48",
            "FR": "48",
            "IT": "48"
        },
        {
            "title": "40",
            "UK": "40",
            "US": "40",
            "EU": "50",
            "FR": "50",
            "IT": "50"
        },
        {
            "title": "42",
            "UK": "42",
            "US": "42",
            "EU": "52",
            "FR": "52",
            "IT": "52"
        },
        {
            "title": "44",
            "UK": "44",
            "US": "44",
            "EU": "54",
            "FR": "54",
            "IT": "54"
        },
        {
            "title": "46",
            "UK": "46",
            "US": "46",
            "EU": "56",
            "FR": "56",
            "IT": "56"
        },
        {
            "title": "48",
            "UK": "48",
            "US": "48",
            "EU": "58",
            "FR": "58",
            "IT": "58"
        },
        {
            "title": "50",
            "UK": "50",
            "US": "50",
            "EU": "60",
            "FR": "60",
            "IT": "60"
        },
        {
            "title": "52",
            "UK": "52",
            "US": "52",
            "EU": "62",
            "FR": "62",
            "IT": "62"
        },
        {
            "title": "54",
            "UK": "54",
            "US": "54",
            "EU": "64",
            "FR": "64",
            "IT": "64"
        },
        {
            "title": "56",
            "UK": "56",
            "US": "56",
            "EU": "66",
            "FR": "66",
            "IT": "66"
        },
        {
            "title": "58",
            "UK": "58",
            "US": "58",
            "EU": "68",
            "FR": "68",
            "IT": "68"
        },
        {
            "title": "60",
            "UK": "60",
            "US": "60",
            "EU": "70",
            "FR": "70",
            "IT": "70"
        }
    ]

    //mens formal
    const mansFormalShirt = [
        {
            "title": "13 in",
            "UK": "13 in",
            "US": "13 in",
            "EU": "33 cm",
            "FR": "33 cm",
            "IT": "33 cm"
        },
        {
            "title": "13.5 in",
            "UK": "13.5 in",
            "US": "13.5 in",
            "EU": "34 cm",
            "FR": "34 cm",
            "IT": "34 cm"
        },
        {
            "title": "14 in",
            "UK": "14 in",
            "US": "14 in",
            "EU": "36 cm",
            "FR": "36 cm",
            "IT": "36 cm"
        },
        {
            "title": "14.5 in",
            "UK": "14.5 in",
            "US": "14.5 in",
            "EU": "37 cm",
            "FR": "37 cm",
            "IT": "37 cm"
        },
        {
            "title": "15 in",
            "UK": "15 in",
            "US": "15 in",
            "EU": "38 cm",
            "FR": "38 cm",
            "IT": "38 cm"
        },
        {
            "title": "15.5 in",
            "UK": "15.5 in",
            "US": "15.5 in",
            "EU": "39 cm",
            "FR": "39 cm",
            "IT": "39 cm"
        },
        {
            "title": "16 in",
            "UK": "16 in",
            "US": "16 in",
            "EU": "41 cm",
            "FR": "41 cm",
            "IT": "41 cm"
        },
        {
            "title": "16.5 in",
            "UK": "16.5 in",
            "US": "16.5 in",
            "EU": "42 cm",
            "FR": "42 cm",
            "IT": "42 cm"
        },
        {
            "title": "17 in",
            "UK": "17 in",
            "US": "17 in",
            "EU": "43 cm",
            "FR": "43 cm",
            "IT": "43 cm"
        },
        {
            "title": "17.5 in",
            "UK": "17.5 in",
            "US": "17.5 in",
            "EU": "44 cm",
            "FR": "44 cm",
            "IT": "44 cm"
        },
        {
            "title": "18 in",
            "UK": "18 in",
            "US": "18 in",
            "EU": "46 cm",
            "FR": "46 cm",
            "IT": "46 cm"
        },
        {
            "title": "18.5 in",
            "UK": "18.5 in",
            "US": "18.5 in",
            "EU": "47 cm",
            "FR": "47 cm",
            "IT": "47 cm"
        },
        {
            "title": "19 in",
            "UK": "19 in",
            "US": "19 in",
            "EU": "48 cm",
            "FR": "48 cm",
            "IT": "48 cm"
        },
        {
            "title": "19.5 in",
            "UK": "19.5 in",
            "US": "19.5 in",
            "EU": "50 cm",
            "FR": "50 cm",
            "IT": "50 cm"
        },
        {
            "title": "20 in",
            "UK": "20 in",
            "US": "20 in",
            "EU": "51 cm",
            "FR": "51 cm",
            "IT": "51 cm"
        }
    ]

    //men pants
    const menPants = [
        {
            "title": "W26/L28",
            "UK": "W26/L28",
            "US": "W26/L28",
            "EU": "W66/L71",
            "FR": "W66/L71",
            "IT": "W66/L71"
        },
        {
            "title": "W26/L30",
            "UK": "W26/L30",
            "US": "W26/L30",
            "EU": "W66/L76",
            "FR": "W66/L76",
            "IT": "W66/L76"
        },
        {
            "title": "W26/L32",
            "UK": "W26/L32",
            "US": "W26/L32",
            "EU": "W66/L81",
            "FR": "W66/L81",
            "IT": "W66/L81"
        },
        {
            "title": "W26/L34",
            "UK": "W26/L34",
            "US": "W26/L34",
            "EU": "W66/L86",
            "FR": "W66/L86",
            "IT": "W66/L86"
        },
        {
            "title": "W26/L36",
            "UK": "W26/L36",
            "US": "W26/L36",
            "EU": "W66/L91",
            "FR": "W66/L91",
            "IT": "W66/L91"
        },
        {
            "title": "W28/L28",
            "UK": "W28/L28",
            "US": "W28/L28",
            "EU": "W71/L71",
            "FR": "W71/L71",
            "IT": "W71/L71"
        },
        {
            "title": "W28/L30",
            "UK": "W28/L30",
            "US": "W28/L30",
            "EU": "W71/L76",
            "FR": "W71/L76",
            "IT": "W71/L76"
        },
        {
            "title": "W28/L32",
            "UK": "W28/L32",
            "US": "W28/L32",
            "EU": "W71/L81",
            "FR": "W71/L81",
            "IT": "W71/L81"
        },
        {
            "title": "W28/L34",
            "UK": "W28/L34",
            "US": "W28/L34",
            "EU": "W71/L86",
            "FR": "W71/L86",
            "IT": "W71/L86"
        },
        {
            "title": "W28/L36",
            "UK": "W28/L36",
            "US": "W28/L36",
            "EU": "W71/L91",
            "FR": "W71/L91",
            "IT": "W71/L91"
        },
        {
            "title": "W30/L28",
            "UK": "W30/L28",
            "US": "W30/L28",
            "EU": "W76/L71",
            "FR": "W76/L71",
            "IT": "W76/L71"
        },
        {
            "title": "W30/L30",
            "UK": "W30/L30",
            "US": "W30/L30",
            "EU": "W76/L76",
            "FR": "W76/L76",
            "IT": "W76/L76"
        },
        {
            "title": "W30/L32",
            "UK": "W30/L32",
            "US": "W30/L32",
            "EU": "W76/L81",
            "FR": "W76/L81",
            "IT": "W76/L81"
        },
        {
            "title": "W30/L34",
            "UK": "W30/L34",
            "US": "W30/L34",
            "EU": "W76/L86",
            "FR": "W76/L86",
            "IT": "W76/L86"
        },
        {
            "title": "W30/L36",
            "UK": "W30/L36",
            "US": "W30/L36",
            "EU": "W76/L91",
            "FR": "W76/L91",
            "IT": "W76/L91"
        },
        {
            "title": "W32/L28",
            "UK": "W32/L28",
            "US": "W32/L28",
            "EU": "W81/L71",
            "FR": "W81/L71",
            "IT": "W81/L71"
        },
        {
            "title": "W32/L30",
            "UK": "W32/L30",
            "US": "W32/L30",
            "EU": "W81/L76",
            "FR": "W81/L76",
            "IT": "W81/L76"
        },
        {
            "title": "W32/L32",
            "UK": "W32/L32",
            "US": "W32/L32",
            "EU": "W81/L81",
            "FR": "W81/L81",
            "IT": "W81/L81"
        },
        {
            "title": "W32/L34",
            "UK": "W32/L34",
            "US": "W32/L34",
            "EU": "W81/L86",
            "FR": "W81/L86",
            "IT": "W81/L86"
        },
        {
            "title": "W32/L36",
            "UK": "W32/L36",
            "US": "W32/L36",
            "EU": "W81/L91",
            "FR": "W81/L91",
            "IT": "W81/L91"
        },
        {
            "title": "W34/L28",
            "UK": "W34/L28",
            "US": "W34/L28",
            "EU": "W86/L71",
            "FR": "W86/L71",
            "IT": "W86/L71"
        },
        {
            "title": "W34/L30",
            "UK": "W34/L30",
            "US": "W34/L30",
            "EU": "W86/L76",
            "FR": "W86/L76",
            "IT": "W86/L76"
        },
        {
            "title": "W34/L32",
            "UK": "W34/L32",
            "US": "W34/L32",
            "EU": "W86/L81",
            "FR": "W86/L81",
            "IT": "W86/L81"
        },
        {
            "title": "W34/L34",
            "UK": "W34/L34",
            "US": "W34/L34",
            "EU": "W86/L86",
            "FR": "W86/L86",
            "IT": "W86/L86"
        },
        {
            "title": "W34/L36",
            "UK": "W34/L36",
            "US": "W34/L36",
            "EU": "W86/L91",
            "FR": "W86/L91",
            "IT": "W86/L91"
        },
        {
            "title": "W36/L28",
            "UK": "W36/L28",
            "US": "W36/L28",
            "EU": "W91/L71",
            "FR": "W91/L71",
            "IT": "W91/L71"
        },
        {
            "title": "W36/L30",
            "UK": "W36/L30",
            "US": "W36/L30",
            "EU": "W91/L76",
            "FR": "W91/L76",
            "IT": "W91/L76"
        },
        {
            "title": "W36/L32",
            "UK": "W36/L32",
            "US": "W36/L32",
            "EU": "W91/L81",
            "FR": "W91/L81",
            "IT": "W91/L81"
        },
        {
            "title": "W36/L34",
            "UK": "W36/L34",
            "US": "W36/L34",
            "EU": "W91/L86",
            "FR": "W91/L86",
            "IT": "W91/L86"
        },
        {
            "title": "W36/L36",
            "UK": "W36/L36",
            "US": "W36/L36",
            "EU": "W91/L91",
            "FR": "W91/L91",
            "IT": "W91/L91"
        },
        {
            "title": "W38/L28",
            "UK": "W38/L28",
            "US": "W38/L28",
            "EU": "W97/L71",
            "FR": "W97/L71",
            "IT": "W97/L71"
        },
        {
            "title": "W38/L30",
            "UK": "W38/L30",
            "US": "W38/L30",
            "EU": "W97/L76",
            "FR": "W97/L76",
            "IT": "W97/L76"
        },
        {
            "title": "W38/L32",
            "UK": "W38/L32",
            "US": "W38/L32",
            "EU": "W97/L81",
            "FR": "W97/L81",
            "IT": "W97/L81"
        },
        {
            "title": "W38/L34",
            "UK": "W38/L34",
            "US": "W38/L34",
            "EU": "W97/L86",
            "FR": "W97/L86",
            "IT": "W97/L86"
        },
        {
            "title": "W38/L36",
            "UK": "W38/L36",
            "US": "W38/L36",
            "EU": "W97/L91",
            "FR": "W97/L91",
            "IT": "W97/L91"
        },
        {
            "title": "W40/L28",
            "UK": "W40/L28",
            "US": "W40/L28",
            "EU": "W102/L71",
            "FR": "W102/L71",
            "IT": "W102/L71"
        },
        {
            "title": "W40/L30",
            "UK": "W40/L30",
            "US": "W40/L30",
            "EU": "W102/L76",
            "FR": "W102/L76",
            "IT": "W102/L76"
        },
        {
            "title": "W40/L32",
            "UK": "W40/L32",
            "US": "W40/L32",
            "EU": "W102/L81",
            "FR": "W102/L81",
            "IT": "W102/L81"
        },
        {
            "title": "W40/L34",
            "UK": "W40/L34",
            "US": "W40/L34",
            "EU": "W102/L86",
            "FR": "W102/L86",
            "IT": "W102/L86"
        },
        {
            "title": "W40/L36",
            "UK": "W40/L36",
            "US": "W40/L36",
            "EU": "W102/L91",
            "FR": "W102/L91",
            "IT": "W102/L91"
        },
        {
            "title": "W42/L28",
            "UK": "W42/L28",
            "US": "W42/L28",
            "EU": "W107/L71",
            "FR": "W107/L71",
            "IT": "W107/L71"
        },
        {
            "title": "W42/L30",
            "UK": "W42/L30",
            "US": "W42/L30",
            "EU": "W107/L76",
            "FR": "W107/L76",
            "IT": "W107/L76"
        },
        {
            "title": "W42/L32",
            "UK": "W42/L32",
            "US": "W42/L32",
            "EU": "W107/L81",
            "FR": "W107/L81",
            "IT": "W107/L81"
        },
        {
            "title": "W42/L34",
            "UK": "W42/L34",
            "US": "W42/L34",
            "EU": "W107/L86",
            "FR": "W107/L86",
            "IT": "W107/L86"
        },
        {
            "title": "W42/L36",
            "UK": "W42/L36",
            "US": "W42/L36",
            "EU": "W107/L91",
            "FR": "W107/L91",
            "IT": "W107/L91"
        },
        {
            "title": "W44/L28",
            "UK": "W44/L28",
            "US": "W44/L28",
            "EU": "W112/L71",
            "FR": "W112/L71",
            "IT": "W112/L71"
        },
        {
            "title": "W44/L30",
            "UK": "W44/L30",
            "US": "W44/L30",
            "EU": "W112/L76",
            "FR": "W112/L76",
            "IT": "W112/L76"
        },
        {
            "title": "W44/L32",
            "UK": "W44/L32",
            "US": "W44/L32",
            "EU": "W112/L81",
            "FR": "W112/L81",
            "IT": "W112/L81"
        },
        {
            "title": "W44/L34",
            "UK": "W44/L34",
            "US": "W44/L34",
            "EU": "W112/L86",
            "FR": "W112/L86",
            "IT": "W112/L86"
        },
        {
            "title": "W44/L36",
            "UK": "W44/L36",
            "US": "W44/L36",
            "EU": "W112/L91",
            "FR": "W112/L91",
            "IT": "W112/L91"
        },
        {
            "title": "W46/L28",
            "UK": "W46/L28",
            "US": "W46/L28",
            "EU": "W117/L71",
            "FR": "W117/L71",
            "IT": "W117/L71"
        },
        {
            "title": "W46/L30",
            "UK": "W46/L30",
            "US": "W46/L30",
            "EU": "W117/L76",
            "FR": "W117/L76",
            "IT": "W117/L76"
        },
        {
            "title": "W46/L32",
            "UK": "W46/L32",
            "US": "W46/L32",
            "EU": "W117/L81",
            "FR": "W117/L81",
            "IT": "W117/L81"
        },
        {
            "title": "W46/L34",
            "UK": "W46/L34",
            "US": "W46/L34",
            "EU": "W117/L86",
            "FR": "W117/L86",
            "IT": "W117/L86"
        },
        {
            "title": "W46/L36",
            "UK": "W46/L36",
            "US": "W46/L36",
            "EU": "W117/L91",
            "FR": "W117/L91",
            "IT": "W117/L91"
        }
    ]

    //women pants
    const womenPents = [
        { "title": "W23/L28", "UK": "W23/L28 in", "US": "W23/L28 in", "EU": "W58/L71 cm", "FR": "W58/L71 cm", "IT": "W58/L71 cm" },
        { "title": "W23/L30", "UK": "W23/L30 in", "US": "W23/L30 in", "EU": "W58/L76 cm", "FR": "W58/L76 cm", "IT": "W58/L76 cm" },
        { "title": "W23/L32", "UK": "W23/L32 in", "US": "W23/L32 in", "EU": "W58/L81 cm", "FR": "W58/L81 cm", "IT": "W58/L81 cm" },
        { "title": "W23/L34", "UK": "W23/L34 in", "US": "W23/L34 in", "EU": "W58/L86 cm", "FR": "W58/L86 cm", "IT": "W58/L86 cm" },
        { "title": "W23/L36", "UK": "W23/L36 in", "US": "W23/L36 in", "EU": "W58/L91 cm", "FR": "W58/L91 cm", "IT": "W58/L91 cm" },

        { "title": "W24/L28", "UK": "W24/L28 in", "US": "W24/L28 in", "EU": "W61/L71 cm", "FR": "W61/L71 cm", "IT": "W61/L71 cm" },
        { "title": "W24/L30", "UK": "W24/L30 in", "US": "W24/L30 in", "EU": "W61/L76 cm", "FR": "W61/L76 cm", "IT": "W61/L76 cm" },
        { "title": "W24/L32", "UK": "W24/L32 in", "US": "W24/L32 in", "EU": "W61/L81 cm", "FR": "W61/L81 cm", "IT": "W61/L81 cm" },
        { "title": "W24/L34", "UK": "W24/L34 in", "US": "W24/L34 in", "EU": "W61/L86 cm", "FR": "W61/L86 cm", "IT": "W61/L86 cm" },
        { "title": "W24/L36", "UK": "W24/L36 in", "US": "W24/L36 in", "EU": "W61/L91 cm", "FR": "W61/L91 cm", "IT": "W61/L91 cm" },

        { "title": "W25/L28", "UK": "W25/L28 in", "US": "W25/L28 in", "EU": "W64/L71 cm", "FR": "W64/L71 cm", "IT": "W64/L71 cm" },
        { "title": "W25/L30", "UK": "W25/L30 in", "US": "W25/L30 in", "EU": "W64/L76 cm", "FR": "W64/L76 cm", "IT": "W64/L76 cm" },
        { "title": "W25/L32", "UK": "W25/L32 in", "US": "W25/L32 in", "EU": "W64/L81 cm", "FR": "W64/L81 cm", "IT": "W64/L81 cm" },
        { "title": "W25/L34", "UK": "W25/L34 in", "US": "W25/L34 in", "EU": "W64/L86 cm", "FR": "W64/L86 cm", "IT": "W64/L86 cm" },
        { "title": "W25/L36", "UK": "W25/L36 in", "US": "W25/L36 in", "EU": "W64/L91 cm", "FR": "W64/L91 cm", "IT": "W64/L91 cm" },

        { "title": "W26/L28", "UK": "W26/L28 in", "US": "W26/L28 in", "EU": "W66/L71 cm", "FR": "W66/L71 cm", "IT": "W66/L71 cm" },
        { "title": "W26/L30", "UK": "W26/L30 in", "US": "W26/L30 in", "EU": "W66/L76 cm", "FR": "W66/L76 cm", "IT": "W66/L76 cm" },
        { "title": "W26/L32", "UK": "W26/L32 in", "US": "W26/L32 in", "EU": "W66/L81 cm", "FR": "W66/L81 cm", "IT": "W66/L81 cm" },
        { "title": "W26/L34", "UK": "W26/L34 in", "US": "W26/L34 in", "EU": "W66/L86 cm", "FR": "W66/L86 cm", "IT": "W66/L86 cm" },
        { "title": "W26/L36", "UK": "W26/L36 in", "US": "W26/L36 in", "EU": "W66/L91 cm", "FR": "W66/L91 cm", "IT": "W66/L91 cm" },

        { "title": "W27/L28", "UK": "W27/L28 in", "US": "W27/L28 in", "EU": "W69/L71 cm", "FR": "W69/L71 cm", "IT": "W69/L71 cm" },
        { "title": "W27/L30", "UK": "W27/L30 in", "US": "W27/L30 in", "EU": "W69/L76 cm", "FR": "W69/L76 cm", "IT": "W69/L76 cm" },
        { "title": "W27/L32", "UK": "W27/L32 in", "US": "W27/L32 in", "EU": "W69/L81 cm", "FR": "W69/L81 cm", "IT": "W69/L81 cm" },
        { "title": "W27/L34", "UK": "W27/L34 in", "US": "W27/L34 in", "EU": "W69/L86 cm", "FR": "W69/L86 cm", "IT": "W69/L86 cm" },
        { "title": "W27/L36", "UK": "W27/L36 in", "US": "W27/L36 in", "EU": "W69/L91 cm", "FR": "W69/L91 cm", "IT": "W69/L91 cm" },

        { "title": "W28/L28", "UK": "W28/L28 in", "US": "W28/L28 in", "EU": "W71/L71 cm", "FR": "W71/L71 cm", "IT": "W71/L71 cm" },
        { "title": "W28/L30", "UK": "W28/L30 in", "US": "W28/L30 in", "EU": "W71/L76 cm", "FR": "W71/L76 cm", "IT": "W71/L76 cm" },
        { "title": "W28/L32", "UK": "W28/L32 in", "US": "W28/L32 in", "EU": "W71/L81 cm", "FR": "W71/L81 cm", "IT": "W71/L81 cm" },
        { "title": "W28/L34", "UK": "W28/L34 in", "US": "W28/L34 in", "EU": "W71/L86 cm", "FR": "W71/L86 cm", "IT": "W71/L86 cm" },
        { "title": "W28/L36", "UK": "W28/L36 in", "US": "W28/L36 in", "EU": "W71/L91 cm", "FR": "W71/L91 cm", "IT": "W71/L91 cm" },

        { "title": "W29/L28", "UK": "W29/L28 in", "US": "W29/L28 in", "EU": "W74/L71 cm", "FR": "W74/L71 cm", "IT": "W74/L71 cm" },
        { "title": "W29/L30", "UK": "W29/L30 in", "US": "W29/L30 in", "EU": "W74/L76 cm", "FR": "W74/L76 cm", "IT": "W74/L76 cm" },
        { "title": "W29/L32", "UK": "W29/L32 in", "US": "W29/L32 in", "EU": "W74/L81 cm", "FR": "W74/L81 cm", "IT": "W74/L81 cm" },
        { "title": "W29/L34", "UK": "W29/L34 in", "US": "W29/L34 in", "EU": "W74/L86 cm", "FR": "W74/L86 cm", "IT": "W74/L86 cm" },
        { "title": "W29/L36", "UK": "W29/L36 in", "US": "W29/L36 in", "EU": "W74/L91 cm", "FR": "W74/L91 cm", "IT": "W74/L91 cm" },

        { "title": "W30/L28", "UK": "W30/L28 in", "US": "W30/L28 in", "EU": "W76/L71 cm", "FR": "W76/L71 cm", "IT": "W76/L71 cm" },
        { "title": "W30/L30", "UK": "W30/L30 in", "US": "W30/L30 in", "EU": "W76/L76 cm", "FR": "W76/L76 cm", "IT": "W76/L76 cm" },
        { "title": "W30/L32", "UK": "W30/L32 in", "US": "W30/L32 in", "EU": "W76/L81 cm", "FR": "W76/L81 cm", "IT": "W76/L81 cm" },
        { "title": "W30/L34", "UK": "W30/L34 in", "US": "W30/L34 in", "EU": "W76/L86 cm", "FR": "W76/L86 cm", "IT": "W76/L86 cm" },
        { "title": "W30/L36", "UK": "W30/L36 in", "US": "W30/L36 in", "EU": "W76/L91 cm", "FR": "W76/L91 cm", "IT": "W76/L91 cm" },

        { "title": "W31/L28", "UK": "W31/L28 in", "US": "W31/L28 in", "EU": "W79/L71 cm", "FR": "W79/L71 cm", "IT": "W79/L71 cm" },
        { "title": "W31/L30", "UK": "W31/L30 in", "US": "W31/L30 in", "EU": "W79/L76 cm", "FR": "W79/L76 cm", "IT": "W79/L76 cm" },
        { "title": "W31/L32", "UK": "W31/L32 in", "US": "W31/L32 in", "EU": "W79/L81 cm", "FR": "W79/L81 cm", "IT": "W79/L81 cm" },
        { "title": "W31/L34", "UK": "W31/L34 in", "US": "W31/L34 in", "EU": "W79/L86 cm", "FR": "W79/L86 cm", "IT": "W79/L86 cm" },
        { "title": "W31/L36", "UK": "W31/L36 in", "US": "W31/L36 in", "EU": "W79/L91 cm", "FR": "W79/L91 cm", "IT": "W79/L91 cm" },

        { "title": "W32/L28", "UK": "W32/L28 in", "US": "W32/L28 in", "EU": "W81/L71 cm", "FR": "W81/L71 cm", "IT": "W81/L71 cm" },
        { "title": "W32/L30", "UK": "W32/L30 in", "US": "W32/L30 in", "EU": "W81/L76 cm", "FR": "W81/L76 cm", "IT": "W81/L76 cm" },
        { "title": "W32/L32", "UK": "W32/L32 in", "US": "W32/L32 in", "EU": "W81/L81 cm", "FR": "W81/L81 cm", "IT": "W81/L81 cm" },
        { "title": "W32/L34", "UK": "W32/L34 in", "US": "W32/L34 in", "EU": "W81/L86 cm", "FR": "W81/L86 cm", "IT": "W81/L86 cm" },
        { "title": "W32/L36", "UK": "W32/L36 in", "US": "W32/L36 in", "EU": "W81/L91 cm", "FR": "W81/L91 cm", "IT": "W81/L91 cm" },

        { "title": "W33/L28", "UK": "W33/L28 in", "US": "W33/L28 in", "EU": "W84/L71 cm", "FR": "W84/L71 cm", "IT": "W84/L71 cm" },
        { "title": "W33/L30", "UK": "W33/L30 in", "US": "W33/L30 in", "EU": "W84/L76 cm", "FR": "W84/L76 cm", "IT": "W84/L76 cm" },
        { "title": "W33/L32", "UK": "W33/L32 in", "US": "W33/L32 in", "EU": "W84/L81 cm", "FR": "W84/L81 cm", "IT": "W84/L81 cm" },
        { "title": "W33/L34", "UK": "W33/L34 in", "US": "W33/L34 in", "EU": "W84/L86 cm", "FR": "W84/L86 cm", "IT": "W84/L86 cm" },
        { "title": "W33/L36", "UK": "W33/L36 in", "US": "W33/L36 in", "EU": "W84/L91 cm", "FR": "W84/L91 cm", "IT": "W84/L91 cm" },

        { "title": "W34/L28", "UK": "W34/L28 in", "US": "W34/L28 in", "EU": "W86/L71 cm", "FR": "W86/L71 cm", "IT": "W86/L71 cm" },
        { "title": "W34/L30", "UK": "W34/L30 in", "US": "W34/L30 in", "EU": "W86/L76 cm", "FR": "W86/L76 cm", "IT": "W86/L76 cm" },
        { "title": "W34/L32", "UK": "W34/L32 in", "US": "W34/L32 in", "EU": "W86/L81 cm", "FR": "W86/L81 cm", "IT": "W86/L81 cm" },
        { "title": "W34/L34", "UK": "W34/L34 in", "US": "W34/L34 in", "EU": "W86/L86 cm", "FR": "W86/L86 cm", "IT": "W86/L86 cm" },
        { "title": "W34/L36", "UK": "W34/L36 in", "US": "W34/L36 in", "EU": "W86/L91 cm", "FR": "W86/L91 cm", "IT": "W86/L91 cm" },

        { "title": "W35/L28", "UK": "W35/L28 in", "US": "W35/L28 in", "EU": "W89/L71 cm", "FR": "W89/L71 cm", "IT": "W89/L71 cm" },
        { "title": "W35/L30", "UK": "W35/L30 in", "US": "W35/L30 in", "EU": "W89/L76 cm", "FR": "W89/L76 cm", "IT": "W89/L76 cm" },
        { "title": "W35/L32", "UK": "W35/L32 in", "US": "W35/L32 in", "EU": "W89/L81 cm", "FR": "W89/L81 cm", "IT": "W89/L81 cm" },
        { "title": "W35/L34", "UK": "W35/L34 in", "US": "W35/L34 in", "EU": "W89/L86 cm", "FR": "W89/L86 cm", "IT": "W89/L86 cm" },
        { "title": "W35/L36", "UK": "W35/L36 in", "US": "W35/L36 in", "EU": "W89/L91 cm", "FR": "W89/L91 cm", "IT": "W89/L91 cm" },

        { "title": "W36/L28", "UK": "W36/L28 in", "US": "W36/L28 in", "EU": "W91/L71 cm", "FR": "W91/L71 cm", "IT": "W91/L71 cm" },
        { "title": "W36/L30", "UK": "W36/L30 in", "US": "W36/L30 in", "EU": "W91/L76 cm", "FR": "W91/L76 cm", "IT": "W91/L76 cm" },
        { "title": "W36/L32", "UK": "W36/L32 in", "US": "W36/L32 in", "EU": "W91/L81 cm", "FR": "W91/L81 cm", "IT": "W91/L81 cm" },
        { "title": "W36/L34", "UK": "W36/L34 in", "US": "W36/L34 in", "EU": "W91/L86 cm", "FR": "W91/L86 cm", "IT": "W91/L86 cm" },
        { "title": "W36/L36", "UK": "W36/L36 in", "US": "W36/L36 in", "EU": "W91/L91 cm", "FR": "W91/L91 cm", "IT": "W91/L91 cm" }
    ]

    //men shoes
    const menShoes = [
        { "title": "3", "UK": "3", "US": "4", "EU": "35", "FR": "35", "IT": "35" },
        { "title": "3.5", "UK": "3.5", "US": "4.5", "EU": "35.5", "FR": "35.5", "IT": "35.5" },
        { "title": "4", "UK": "4", "US": "5", "EU": "36", "FR": "36", "IT": "36" },
        { "title": "4.5", "UK": "4.5", "US": "5.5", "EU": "37", "FR": "37", "IT": "37" },
        { "title": "5", "UK": "5", "US": "6", "EU": "37.5", "FR": "37.5", "IT": "37.5" },
        { "title": "5.5", "UK": "5.5", "US": "6.5", "EU": "38", "FR": "38", "IT": "38" },
        { "title": "6", "UK": "6", "US": "7", "EU": "38.5", "FR": "38.5", "IT": "38.5" },
        { "title": "6.5", "UK": "6.5", "US": "7.5", "EU": "39", "FR": "39", "IT": "39" },
        { "title": "7", "UK": "7", "US": "8", "EU": "40", "FR": "40", "IT": "40" },
        { "title": "7.5", "UK": "7.5", "US": "8.5", "EU": "41", "FR": "41", "IT": "41" },
        { "title": "8", "UK": "8", "US": "9", "EU": "42", "FR": "42", "IT": "42" },
        { "title": "8.5", "UK": "8.5", "US": "9.5", "EU": "42.5", "FR": "42.5", "IT": "42.5" },
        { "title": "9", "UK": "9", "US": "10", "EU": "43", "FR": "43", "IT": "43" },
        { "title": "9.5", "UK": "9.5", "US": "10.5", "EU": "44", "FR": "44", "IT": "44" },
        { "title": "10", "UK": "10", "US": "11", "EU": "44.5", "FR": "44.5", "IT": "44.5" },
        { "title": "10.5", "UK": "10.5", "US": "11.5", "EU": "45", "FR": "45", "IT": "45" },
        { "title": "11", "UK": "11", "US": "12", "EU": "46", "FR": "46", "IT": "46" },
        { "title": "11.5", "UK": "11.5", "US": "12.5", "EU": "46.5", "FR": "46.5", "IT": "46.5" },
        { "title": "12", "UK": "12", "US": "13", "EU": "47", "FR": "47", "IT": "47" },
        { "title": "12.5", "UK": "12.5", "US": "13.5", "EU": "47.5", "FR": "47.5", "IT": "47.5" },
        { "title": "13", "UK": "13", "US": "14", "EU": "48", "FR": "48", "IT": "48" },
        { "title": "13.5", "UK": "13.5", "US": "14.5", "EU": "48.5", "FR": "48.5", "IT": "48.5" },
        { "title": "14", "UK": "14", "US": "15", "EU": "49", "FR": "49", "IT": "49" },
        { "title": "14.5", "UK": "14.5", "US": "15.5", "EU": "49.5", "FR": "49.5", "IT": "49.5" },
        { "title": "15", "UK": "15", "US": "16", "EU": "50", "FR": "50", "IT": "50" }
    ]

    //women shoes
    const womenShoes = [
        { "title": "UK 2", "UK": "2", "US": "4", "EU": "35", "FR": "35", "IT": "35" },
        { "title": "UK 2.5", "UK": "2.5", "US": "4.5", "EU": "35.5", "FR": "35.5", "IT": "35.5" },
        { "title": "UK 3", "UK": "3", "US": "5", "EU": "36", "FR": "36", "IT": "36" },
        { "title": "UK 3.5", "UK": "3.5", "US": "5.5", "EU": "36.5", "FR": "36.5", "IT": "36.5" },
        { "title": "UK 4", "UK": "4", "US": "6", "EU": "37", "FR": "37", "IT": "37" },
        { "title": "UK 4.5", "UK": "4.5", "US": "6.5", "EU": "37.5", "FR": "37.5", "IT": "37.5" },
        { "title": "UK 5", "UK": "5", "US": "7", "EU": "38", "FR": "38", "IT": "38" },
        { "title": "UK 5.5", "UK": "5.5", "US": "7.5", "EU": "38.5", "FR": "38.5", "IT": "38.5" },
        { "title": "UK 6", "UK": "6", "US": "8", "EU": "39", "FR": "39", "IT": "39" },
        { "title": "UK 6.5", "UK": "6.5", "US": "8.5", "EU": "40", "FR": "40", "IT": "40" },
        { "title": "UK 7", "UK": "7", "US": "9", "EU": "40.5", "FR": "40.5", "IT": "40.5" },
        { "title": "UK 7.5", "UK": "7.5", "US": "9.5", "EU": "41", "FR": "41", "IT": "41" },
        { "title": "UK 8", "UK": "8", "US": "10", "EU": "42", "FR": "42", "IT": "42" },
        { "title": "UK 8.5", "UK": "8.5", "US": "10.5", "EU": "42.5", "FR": "42.5", "IT": "42.5" },
        { "title": "UK 9", "UK": "9", "US": "11", "EU": "43", "FR": "43", "IT": "43" },
        { "title": "UK 9.5", "UK": "9.5", "US": "11.5", "EU": "43.5", "FR": "43.5", "IT": "43.5" },
        { "title": "UK 10", "UK": "10", "US": "12", "EU": "44", "FR": "44", "IT": "44" }
    ]

    //kids shoes
    const kidsShoes = [
        { "title": "UK 1", "UK": "1", "US": "1.5", "EU": "33", "FR": "33", "IT": "33" },
        { "title": "UK 1.5", "UK": "1.5", "US": "2", "EU": "33.5", "FR": "33.5", "IT": "33.5" },
        { "title": "UK 2", "UK": "2", "US": "2.5", "EU": "34", "FR": "34", "IT": "34" },
        { "title": "UK 2.5", "UK": "2.5", "US": "3", "EU": "35", "FR": "35", "IT": "35" },
        { "title": "UK 3", "UK": "3", "US": "3.5", "EU": "35.5", "FR": "35.5", "IT": "35.5" },
        { "title": "UK 3.5", "UK": "3.5", "US": "4", "EU": "36", "FR": "36", "IT": "36" },
        { "title": "UK 4", "UK": "4", "US": "4.5", "EU": "36.5", "FR": "36.5", "IT": "36.5" },
        { "title": "UK 4.5", "UK": "4.5", "US": "5", "EU": "37.5", "FR": "37.5", "IT": "37.5" },
        { "title": "UK 5", "UK": "5", "US": "5.5", "EU": "38", "FR": "38", "IT": "38" },
        { "title": "UK 5.5", "UK": "5.5", "US": "6", "EU": "38.5", "FR": "38.5", "IT": "38.5" },
        { "title": "UK 6", "UK": "6", "US": "6.5", "EU": "39", "FR": "39", "IT": "39" }
    ]

    //women bras & lingerie
    const women_BRAS_LINGERIE = [
        { "title": "28AA", "UK": "28AA", "US": "28AA", "EU": "60AA", "FR": "75AA", "IT": "0AA" },
        { "title": "28A", "UK": "28A", "US": "28A", "EU": "60A", "FR": "75A", "IT": "0A" },
        { "title": "28B", "UK": "28B", "US": "28B", "EU": "60B", "FR": "75B", "IT": "0B" },
        { "title": "28C", "UK": "28C", "US": "28C", "EU": "60C", "FR": "75C", "IT": "0C" },
        { "title": "28D", "UK": "28D", "US": "28D", "EU": "60D", "FR": "75D", "IT": "0D" },
        { "title": "28DD", "UK": "28DD", "US": "28DD", "EU": "60E", "FR": "75E", "IT": "0E" },
        { "title": "28E", "UK": "28E", "US": "28DDD", "EU": "60F", "FR": "75F", "IT": "0F" },
        { "title": "28F", "UK": "28F", "US": "28G", "EU": "60G", "FR": "75G", "IT": "0G" },
        { "title": "28FF", "UK": "28FF", "US": "28H", "EU": "60H", "FR": "75H", "IT": "0H" },
        { "title": "28G", "UK": "28G", "US": "28I", "EU": "60I", "FR": "75I", "IT": "0I" },
        { "title": "28GG", "UK": "28GG", "US": "28J", "EU": "60J", "FR": "75J", "IT": "0J" },
        { "title": "28H", "UK": "28H", "US": "28K", "EU": "60K", "FR": "75K", "IT": "0K" },
        { "title": "28HH", "UK": "28HH", "US": "28L", "EU": "60L", "FR": "75L", "IT": "0L" },
        { "title": "28J", "UK": "28J", "US": "28M", "EU": "60M", "FR": "75M", "IT": "0M" },
        { "title": "28JJ", "UK": "28JJ", "US": "28N", "EU": "60N", "FR": "75N", "IT": "0N" },
        { "title": "28K", "UK": "28K", "US": "28O", "EU": "60O", "FR": "75O", "IT": "0O" },

        { "title": "30AA", "UK": "30AA", "US": "30AA", "EU": "65AA", "FR": "80AA", "IT": "1AA" },
        { "title": "30A", "UK": "30A", "US": "30A", "EU": "65A", "FR": "80A", "IT": "1A" },
        { "title": "30B", "UK": "30B", "US": "30B", "EU": "65B", "FR": "80B", "IT": "1B" },
        { "title": "30C", "UK": "30C", "US": "30C", "EU": "65C", "FR": "80C", "IT": "1C" },
        { "title": "30D", "UK": "30D", "US": "30D", "EU": "65D", "FR": "80D", "IT": "1D" },
        { "title": "30DD", "UK": "30DD", "US": "30DD", "EU": "65E", "FR": "80E", "IT": "1E" },
        { "title": "30E", "UK": "30E", "US": "30DDD", "EU": "65F", "FR": "80F", "IT": "1F" },
        { "title": "30F", "UK": "30F", "US": "30G", "EU": "65G", "FR": "80G", "IT": "1G" },
        { "title": "30FF", "UK": "30FF", "US": "30H", "EU": "65H", "FR": "80H", "IT": "1H" },
        { "title": "30G", "UK": "30G", "US": "30I", "EU": "65I", "FR": "80I", "IT": "1I" },
        { "title": "30GG", "UK": "30GG", "US": "30J", "EU": "65J", "FR": "80J", "IT": "1J" },
        { "title": "30H", "UK": "30H", "US": "30K", "EU": "65K", "FR": "80K", "IT": "1K" },
        { "title": "30HH", "UK": "30HH", "US": "30L", "EU": "65L", "FR": "80L", "IT": "1L" },
        { "title": "30J", "UK": "30J", "US": "30M", "EU": "65M", "FR": "80M", "IT": "1M" },
        { "title": "30JJ", "UK": "30JJ", "US": "30N", "EU": "65N", "FR": "80N", "IT": "1N" },
        { "title": "30K", "UK": "30K", "US": "30O", "EU": "65O", "FR": "80O", "IT": "1O" },

        { "title": "32AA", "UK": "32AA", "US": "32AA", "EU": "70AA", "FR": "85AA", "IT": "2AA" },
        { "title": "32A", "UK": "32A", "US": "32A", "EU": "70A", "FR": "85A", "IT": "2A" },
        { "title": "32B", "UK": "32B", "US": "32B", "EU": "70B", "FR": "85B", "IT": "2B" },
        { "title": "32C", "UK": "32C", "US": "32C", "EU": "70C", "FR": "85C", "IT": "2C" },
        { "title": "32D", "UK": "32D", "US": "32D", "EU": "70D", "FR": "85D", "IT": "2D" },
        { "title": "32DD", "UK": "32DD", "US": "32DD", "EU": "70E", "FR": "85E", "IT": "2E" },
        { "title": "32E", "UK": "32E", "US": "32DDD", "EU": "70F", "FR": "85F", "IT": "2F" },
        { "title": "32F", "UK": "32F", "US": "32G", "EU": "70G", "FR": "85G", "IT": "2G" },
        { "title": "32FF", "UK": "32FF", "US": "32H", "EU": "70H", "FR": "85H", "IT": "2H" },
        { "title": "32G", "UK": "32G", "US": "32I", "EU": "70I", "FR": "85I", "IT": "2I" },
        { "title": "32GG", "UK": "32GG", "US": "32J", "EU": "70J", "FR": "85J", "IT": "2J" },
        { "title": "32H", "UK": "32H", "US": "32K", "EU": "70K", "FR": "85K", "IT": "2K" },
        { "title": "32HH", "UK": "32HH", "US": "32L", "EU": "70L", "FR": "85L", "IT": "2L" },
        { "title": "32J", "UK": "32J", "US": "32M", "EU": "70M", "FR": "85M", "IT": "2M" },
        { "title": "32JJ", "UK": "32JJ", "US": "32N", "EU": "70N", "FR": "85N", "IT": "2N" },
        { "title": "32K", "UK": "32K", "US": "32O", "EU": "70O", "FR": "85O", "IT": "2O" },

        { "title": "34AA", "UK": "34AA", "US": "34AA", "EU": "75AA", "FR": "90AA", "IT": "3AA" },
        { "title": "34A", "UK": "34A", "US": "34A", "EU": "75A", "FR": "90A", "IT": "3A" },
        { "title": "34B", "UK": "34B", "US": "34B", "EU": "75B", "FR": "90B", "IT": "3B" },
        { "title": "34C", "UK": "34C", "US": "34C", "EU": "75C", "FR": "90C", "IT": "3C" },
        { "title": "34D", "UK": "34D", "US": "34D", "EU": "75D", "FR": "90D", "IT": "3D" },
        { "title": "34DD", "UK": "34DD", "US": "34DD", "EU": "75E", "FR": "90E", "IT": "3E" },
        { "title": "34E", "UK": "34E", "US": "34DDD", "EU": "75F", "FR": "90F", "IT": "3F" },
        { "title": "34F", "UK": "34F", "US": "34G", "EU": "75G", "FR": "90G", "IT": "3G" },
        { "title": "34FF", "UK": "34FF", "US": "34H", "EU": "75H", "FR": "90H", "IT": "3H" },
        { "title": "34G", "UK": "34G", "US": "34I", "EU": "75I", "FR": "90I", "IT": "3I" },
        { "title": "34GG", "UK": "34GG", "US": "34J", "EU": "75J", "FR": "90J", "IT": "3J" },
        { "title": "34H", "UK": "34H", "US": "34K", "EU": "75K", "FR": "90K", "IT": "3K" },
        { "title": "34HH", "UK": "34HH", "US": "34L", "EU": "75L", "FR": "90L", "IT": "3L" },
        { "title": "34J", "UK": "34J", "US": "34M", "EU": "75M", "FR": "90M", "IT": "3M" },
        { "title": "34JJ", "UK": "34JJ", "US": "34N", "EU": "75N", "FR": "90N", "IT": "3N" },
        { "title": "34K", "UK": "34K", "US": "34O", "EU": "75O", "FR": "90O", "IT": "3O" },

        { "title": "36AA", "UK": "36AA", "US": "36AA", "EU": "80AA", "FR": "95AA", "IT": "4AA" },
        { "title": "36A", "UK": "36A", "US": "36A", "EU": "80A", "FR": "95A", "IT": "4A" },
        { "title": "36B", "UK": "36B", "US": "36B", "EU": "80B", "FR": "95B", "IT": "4B" },
        { "title": "36C", "UK": "36C", "US": "36C", "EU": "80C", "FR": "95C", "IT": "4C" },
        { "title": "36D", "UK": "36D", "US": "36D", "EU": "80D", "FR": "95D", "IT": "4D" },
        { "title": "36DD", "UK": "36DD", "US": "36DD", "EU": "80E", "FR": "95E", "IT": "4E" },
        { "title": "36E", "UK": "36E", "US": "36DDD", "EU": "80F", "FR": "95F", "IT": "4F" },
        { "title": "36F", "UK": "36F", "US": "36G", "EU": "80G", "FR": "95G", "IT": "4G" },
        { "title": "36FF", "UK": "36FF", "US": "36H", "EU": "80H", "FR": "95H", "IT": "4H" },
        { "title": "36G", "UK": "36G", "US": "36I", "EU": "80I", "FR": "95I", "IT": "4I" },
        { "title": "36GG", "UK": "36GG", "US": "36J", "EU": "80J", "FR": "95J", "IT": "4J" },
        { "title": "36H", "UK": "36H", "US": "36K", "EU": "80K", "FR": "95K", "IT": "4K" },
        { "title": "36HH", "UK": "36HH", "US": "36L", "EU": "80L", "FR": "95L", "IT": "4L" },
        { "title": "36J", "UK": "36J", "US": "36M", "EU": "80M", "FR": "95M", "IT": "4M" },
        { "title": "36JJ", "UK": "36JJ", "US": "36N", "EU": "80N", "FR": "95N", "IT": "4N" },
        { "title": "36K", "UK": "36K", "US": "36O", "EU": "80O", "FR": "95O", "IT": "4O" },

        { "title": "38AA", "UK": "38AA", "US": "38AA", "EU": "85AA", "FR": "100AA", "IT": "5AA" },
        { "title": "38A", "UK": "38A", "US": "38A", "EU": "85A", "FR": "100A", "IT": "5A" },
        { "title": "38B", "UK": "38B", "US": "38B", "EU": "85B", "FR": "100B", "IT": "5B" },
        { "title": "38C", "UK": "38C", "US": "38C", "EU": "85C", "FR": "100C", "IT": "5C" },
        { "title": "38D", "UK": "38D", "US": "38D", "EU": "85D", "FR": "100D", "IT": "5D" },
        { "title": "38DD", "UK": "38DD", "US": "38DD", "EU": "85E", "FR": "100E", "IT": "5E" },
        { "title": "38E", "UK": "38E", "US": "38DDD", "EU": "85F", "FR": "100F", "IT": "5F" },
        { "title": "38F", "UK": "38F", "US": "38G", "EU": "85G", "FR": "100G", "IT": "5G" },
        { "title": "38FF", "UK": "38FF", "US": "38H", "EU": "85H", "FR": "100H", "IT": "5H" },
        { "title": "38G", "UK": "38G", "US": "38I", "EU": "85I", "FR": "100I", "IT": "5I" },
        { "title": "38GG", "UK": "38GG", "US": "38J", "EU": "85J", "FR": "100J", "IT": "5J" },
        { "title": "38H", "UK": "38H", "US": "38K", "EU": "85K", "FR": "100K", "IT": "5K" },
        { "title": "38HH", "UK": "38HH", "US": "38L", "EU": "85L", "FR": "100L", "IT": "5L" },
        { "title": "38J", "UK": "38J", "US": "38M", "EU": "85M", "FR": "100M", "IT": "5M" },
        { "title": "38JJ", "UK": "38JJ", "US": "38N", "EU": "85N", "FR": "100N", "IT": "5N" },
        { "title": "38K", "UK": "38K", "US": "38O", "EU": "85O", "FR": "100O", "IT": "5O" },

        { "title": "40AA", "UK": "40AA", "US": "40AA", "EU": "90AA", "FR": "105AA", "IT": "6AA" },
        { "title": "40A", "UK": "40A", "US": "40A", "EU": "90A", "FR": "105A", "IT": "6A" },
        { "title": "40B", "UK": "40B", "US": "40B", "EU": "90B", "FR": "105B", "IT": "6B" },
        { "title": "40C", "UK": "40C", "US": "40C", "EU": "90C", "FR": "105C", "IT": "6C" },
        { "title": "40D", "UK": "40D", "US": "40D", "EU": "90D", "FR": "105D", "IT": "6D" },
        { "title": "40DD", "UK": "40DD", "US": "40DD", "EU": "90E", "FR": "105E", "IT": "6E" },
        { "title": "40E", "UK": "40E", "US": "40DDD", "EU": "90F", "FR": "105F", "IT": "6F" },
        { "title": "40F", "UK": "40F", "US": "40G", "EU": "90G", "FR": "105G", "IT": "6G" },
        { "title": "40FF", "UK": "40FF", "US": "40H", "EU": "90H", "FR": "105H", "IT": "6H" },
        { "title": "40G", "UK": "40G", "US": "40I", "EU": "90I", "FR": "105I", "IT": "6I" },
        { "title": "40GG", "UK": "40GG", "US": "40J", "EU": "90J", "FR": "105J", "IT": "6J" },
        { "title": "40H", "UK": "40H", "US": "40K", "EU": "90K", "FR": "105K", "IT": "6K" },
        { "title": "40HH", "UK": "40HH", "US": "40L", "EU": "90L", "FR": "105L", "IT": "6L" },
        { "title": "40J", "UK": "40J", "US": "40M", "EU": "90M", "FR": "105M", "IT": "6M" },
        { "title": "40JJ", "UK": "40JJ", "US": "40N", "EU": "90N", "FR": "105N", "IT": "6N" },
        { "title": "40K", "UK": "40K", "US": "40O", "EU": "90O", "FR": "105O", "IT": "6O" },

        { "title": "42AA", "UK": "42AA", "US": "42AA", "EU": "95AA", "FR": "110AA", "IT": "7AA" },
        { "title": "42A", "UK": "42A", "US": "42A", "EU": "95A", "FR": "110A", "IT": "7A" },
        { "title": "42B", "UK": "42B", "US": "42B", "EU": "95B", "FR": "110B", "IT": "7B" },
        { "title": "42C", "UK": "42C", "US": "42C", "EU": "95C", "FR": "110C", "IT": "7C" },
        { "title": "42D", "UK": "42D", "US": "42D", "EU": "95D", "FR": "110D", "IT": "7D" },
        { "title": "42DD", "UK": "42DD", "US": "42DD", "EU": "95E", "FR": "110E", "IT": "7E" },
        { "title": "42E", "UK": "42E", "US": "42DDD", "EU": "95F", "FR": "110F", "IT": "7F" },
        { "title": "42F", "UK": "42F", "US": "42G", "EU": "95G", "FR": "110G", "IT": "7G" },
        { "title": "42FF", "UK": "42FF", "US": "42H", "EU": "95H", "FR": "110H", "IT": "7H" },
        { "title": "42G", "UK": "42G", "US": "42I", "EU": "95I", "FR": "110I", "IT": "7I" },
        { "title": "42GG", "UK": "42GG", "US": "42J", "EU": "95J", "FR": "110J", "IT": "7J" },
        { "title": "42H", "UK": "42H", "US": "42K", "EU": "95K", "FR": "110K", "IT": "7K" },
        { "title": "42HH", "UK": "42HH", "US": "42L", "EU": "95L", "FR": "110L", "IT": "7L" },
        { "title": "42J", "UK": "42J", "US": "42M", "EU": "95M", "FR": "110M", "IT": "7M" },
        { "title": "42JJ", "UK": "42JJ", "US": "42N", "EU": "95N", "FR": "110N", "IT": "7N" },
        { "title": "42K", "UK": "42K", "US": "42O", "EU": "95O", "FR": "110O", "IT": "7O" },

        { "title": "44AA", "UK": "44AA", "US": "44AA", "EU": "100AA", "FR": "115AA", "IT": "8AA" },
        { "title": "44A", "UK": "44A", "US": "44A", "EU": "100A", "FR": "115A", "IT": "8A" },
        { "title": "44B", "UK": "44B", "US": "44B", "EU": "100B", "FR": "115B", "IT": "8B" },
        { "title": "44C", "UK": "44C", "US": "44C", "EU": "100C", "FR": "115C", "IT": "8C" },
        { "title": "44D", "UK": "44D", "US": "44D", "EU": "100D", "FR": "115D", "IT": "8D" },
        { "title": "44DD", "UK": "44DD", "US": "44DD", "EU": "100E", "FR": "115E", "IT": "8E" },
        { "title": "44E", "UK": "44E", "US": "44DDD", "EU": "100F", "FR": "115F", "IT": "8F" },
        { "title": "44F", "UK": "44F", "US": "44G", "EU": "100G", "FR": "115G", "IT": "8G" },
        { "title": "44FF", "UK": "44FF", "US": "44H", "EU": "100H", "FR": "115H", "IT": "8H" },
        { "title": "44G", "UK": "44G", "US": "44I", "EU": "100I", "FR": "115I", "IT": "8I" },
        { "title": "44GG", "UK": "44GG", "US": "44J", "EU": "100J", "FR": "115J", "IT": "8J" },
        { "title": "44H", "UK": "44H", "US": "44K", "EU": "100K", "FR": "115K", "IT": "8K" },
        { "title": "44HH", "UK": "44HH", "US": "44L", "EU": "100L", "FR": "115L", "IT": "8L" },
        { "title": "44J", "UK": "44J", "US": "44M", "EU": "100M", "FR": "115M", "IT": "8M" },
        { "title": "44JJ", "UK": "44JJ", "US": "44N", "EU": "100N", "FR": "115N", "IT": "8N" },
        { "title": "44K", "UK": "44K", "US": "44O", "EU": "100O", "FR": "115O", "IT": "8O" }
    ]

    //hats
    const hats = [
        { "title": "XS", "UK": "XS", "US": "6 5/8 - 6 3/4", "EU": "53-54", "FR": "53-54", "IT": "53-54" },
        { "title": "S", "UK": "S", "US": "6 7/8 - 7", "EU": "55-56", "FR": "55-56", "IT": "55-56" },
        { "title": "M", "UK": "M", "US": "7 1/8 - 7 1/4", "EU": "57-58", "FR": "57-58", "IT": "57-58" },
        { "title": "L", "UK": "L", "US": "7 3/8 - 7 1/2", "EU": "59-60", "FR": "59-60", "IT": "59-60" },
        { "title": "XL", "UK": "XL", "US": "7 5/8 - 7 3/4", "EU": "61-62", "FR": "61-62", "IT": "61-62" },
        { "title": "One Size", "UK": "One Size", "US": "One Size", "EU": "One Size", "FR": "One Size", "IT": "One Size" },
        { "title": "Adjustable", "UK": "Adjustable", "US": "Adjustable", "EU": "Adjustable", "FR": "Adjustable", "IT": "Adjustable" }
    ]

    //belts
    const belts = [
        { "title": "XS", "UK": "XS", "US": "XS", "EU": "60-70 cm", "FR": "60-70 cm", "IT": "60-70 cm" },
        { "title": "S", "UK": "S", "US": "S", "EU": "70-80 cm", "FR": "70-80 cm", "IT": "70-80 cm" },
        { "title": "M", "UK": "M", "US": "M", "EU": "80-90 cm", "FR": "80-90 cm", "IT": "80-90 cm" },
        { "title": "L", "UK": "L", "US": "L", "EU": "90-100 cm", "FR": "90-100 cm", "IT": "90-100 cm" },
        { "title": "XL", "UK": "XL", "US": "XL", "EU": "100-110 cm", "FR": "100-110 cm", "IT": "100-110 cm" },
        { "title": "24 in", "UK": "24 in", "US": "24 in", "EU": "60 cm", "FR": "60 cm", "IT": "60 cm" },
        { "title": "25 in", "UK": "25 in", "US": "25 in", "EU": "63.5 cm", "FR": "63.5 cm", "IT": "63.5 cm" },
        { "title": "26 in", "UK": "26 in", "US": "26 in", "EU": "66 cm", "FR": "66 cm", "IT": "66 cm" },
        { "title": "27 in", "UK": "27 in", "US": "27 in", "EU": "68.5 cm", "FR": "68.5 cm", "IT": "68.5 cm" },
        { "title": "28 in", "UK": "28 in", "US": "28 in", "EU": "71 cm", "FR": "71 cm", "IT": "71 cm" },
        { "title": "29 in", "UK": "29 in", "US": "29 in", "EU": "74 cm", "FR": "74 cm", "IT": "74 cm" },
        { "title": "30 in", "UK": "30 in", "US": "30 in", "EU": "76 cm", "FR": "76 cm", "IT": "76 cm" },
        { "title": "31 in", "UK": "31 in", "US": "31 in", "EU": "79 cm", "FR": "79 cm", "IT": "79 cm" },
        { "title": "32 in", "UK": "32 in", "US": "32 in", "EU": "81 cm", "FR": "81 cm", "IT": "81 cm" },
        { "title": "33 in", "UK": "33 in", "US": "33 in", "EU": "84 cm", "FR": "84 cm", "IT": "84 cm" },
        { "title": "34 in", "UK": "34 in", "US": "34 in", "EU": "86 cm", "FR": "86 cm", "IT": "86 cm" },
        { "title": "35 in", "UK": "35 in", "US": "35 in", "EU": "89 cm", "FR": "89 cm", "IT": "89 cm" },
        { "title": "36 in", "UK": "36 in", "US": "36 in", "EU": "91 cm", "FR": "91 cm", "IT": "91 cm" },
        { "title": "37 in", "UK": "37 in", "US": "37 in", "EU": "94 cm", "FR": "94 cm", "IT": "94 cm" },
        { "title": "38 in", "UK": "38 in", "US": "38 in", "EU": "97 cm", "FR": "97 cm", "IT": "97 cm" },
        { "title": "39 in", "UK": "39 in", "US": "39 in", "EU": "99 cm", "FR": "99 cm", "IT": "99 cm" },
        { "title": "40 in", "UK": "40 in", "US": "40 in", "EU": "102 cm", "FR": "102 cm", "IT": "102 cm" },
        { "title": "41 in", "UK": "41 in", "US": "41 in", "EU": "104 cm", "FR": "104 cm", "IT": "104 cm" },
        { "title": "42 in", "UK": "42 in", "US": "42 in", "EU": "107 cm", "FR": "107 cm", "IT": "107 cm" },
        { "title": "43 in", "UK": "43 in", "US": "43 in", "EU": "109 cm", "FR": "109 cm", "IT": "109 cm" },
        { "title": "44 in", "UK": "44 in", "US": "44 in", "EU": "112 cm", "FR": "112 cm", "IT": "112 cm" },
        { "title": "45 in", "UK": "45 in", "US": "45 in", "EU": "114 cm", "FR": "114 cm", "IT": "114 cm" },
        { "title": "46 in", "UK": "46 in", "US": "46 in", "EU": "117 cm", "FR": "117 cm", "IT": "117 cm" },
        { "title": "47 in", "UK": "47 in", "US": "47 in", "EU": "119 cm", "FR": "119 cm", "IT": "119 cm" },
        { "title": "48 in", "UK": "48 in", "US": "48 in", "EU": "122 cm", "FR": "122 cm", "IT": "122 cm" }
    ]

    //rings
    const rings = [
        { "title": "A", "UK": "A", "US": "1/2", "EU": "38", "FR": "-2", "IT": "-2" },
        { "title": "A½", "UK": "A½", "US": "3/4", "EU": "38", "FR": "-2", "IT": "-2" },
        { "title": "B", "UK": "B", "US": "1", "EU": "39", "FR": "-1", "IT": "-1" },
        { "title": "B½", "UK": "B½", "US": "1 1/4", "EU": "40", "FR": "0", "IT": "0" },
        { "title": "C", "UK": "C", "US": "1 1/2", "EU": "40", "FR": "0", "IT": "0" },
        { "title": "C½", "UK": "C½", "US": "1 3/4", "EU": "41", "FR": "1", "IT": "1" },
        { "title": "D", "UK": "D", "US": "2", "EU": "41", "FR": "1", "IT": "1" },
        { "title": "D½", "UK": "D½", "US": "2 1/4", "EU": "42", "FR": "2", "IT": "2" },
        { "title": "E", "UK": "E", "US": "2 1/2", "EU": "43", "FR": "3", "IT": "3" },
        { "title": "E½", "UK": "E½", "US": "2 3/4", "EU": "43", "FR": "3", "IT": "3" },
        { "title": "F", "UK": "F", "US": "3", "EU": "44", "FR": "4", "IT": "4" },
        { "title": "F½", "UK": "F½", "US": "3 1/4", "EU": "45", "FR": "5", "IT": "5" },
        { "title": "G", "UK": "G", "US": "3 1/2", "EU": "45", "FR": "5", "IT": "5" },
        { "title": "G½", "UK": "G½", "US": "3 1/2", "EU": "46", "FR": "6", "IT": "6" },
        { "title": "H", "UK": "H", "US": "3 3/4", "EU": "46", "FR": "6", "IT": "6" },
        { "title": "H½", "UK": "H½", "US": "4", "EU": "47", "FR": "7", "IT": "7" },
        { "title": "I", "UK": "I", "US": "4 1/4", "EU": "48", "FR": "8", "IT": "8" },
        { "title": "I½", "UK": "I½", "US": "4 1/2", "EU": "48", "FR": "8", "IT": "8" },
        { "title": "J", "UK": "J", "US": "4 3/4", "EU": "49", "FR": "9", "IT": "9" },
        { "title": "J½", "UK": "J½", "US": "5", "EU": "49", "FR": "9", "IT": "9" },
        { "title": "K", "UK": "K", "US": "5 1/4", "EU": "50", "FR": "10", "IT": "10" },
        { "title": "K½", "UK": "K½", "US": "5 1/2", "EU": "51", "FR": "11", "IT": "11" },
        { "title": "L", "UK": "L", "US": "5 3/4", "EU": "51", "FR": "11", "IT": "11" },
        { "title": "L½", "UK": "L½", "US": "6", "EU": "52", "FR": "12", "IT": "12" },
        { "title": "M", "UK": "M", "US": "6 1/4", "EU": "53", "FR": "13", "IT": "13" },
        { "title": "M½", "UK": "M½", "US": "6 1/2", "EU": "53", "FR": "13", "IT": "13" },
        { "title": "N", "UK": "N", "US": "6 3/4", "EU": "54", "FR": "14", "IT": "14" },
        { "title": "N½", "UK": "N½", "US": "7", "EU": "54", "FR": "14", "IT": "14" },
        { "title": "O", "UK": "O", "US": "7 1/4", "EU": "55", "FR": "15", "IT": "15" },
        { "title": "O½", "UK": "O½", "US": "7 1/2", "EU": "56", "FR": "16", "IT": "16" },
        { "title": "P", "UK": "P", "US": "7 3/4", "EU": "56", "FR": "16", "IT": "16" },
        { "title": "P½", "UK": "P½", "US": "8", "EU": "57", "FR": "17", "IT": "17" },
        { "title": "Q", "UK": "Q", "US": "8 1/4", "EU": "57", "FR": "17", "IT": "17" },
        { "title": "Q½", "UK": "Q½", "US": "8 1/2", "EU": "58", "FR": "18", "IT": "18" },
        { "title": "R", "UK": "R", "US": "8 3/4", "EU": "59", "FR": "19", "IT": "19" },
        { "title": "R½", "UK": "R½", "US": "9", "EU": "59", "FR": "19", "IT": "19" },
        { "title": "S", "UK": "S", "US": "9 1/4", "EU": "60", "FR": "20", "IT": "20" },
        { "title": "S½", "UK": "S½", "US": "9 1/2", "EU": "61", "FR": "21", "IT": "21" },
        { "title": "T", "UK": "T", "US": "9 3/4", "EU": "61", "FR": "21", "IT": "21" },
        { "title": "T½", "UK": "T½", "US": "10", "EU": "62", "FR": "22", "IT": "22" },
        { "title": "U", "UK": "U", "US": "10", "EU": "62", "FR": "22", "IT": "22" },
        { "title": "U½", "UK": "U½", "US": "10 1/4", "EU": "63", "FR": "23", "IT": "23" },
        { "title": "V", "UK": "V", "US": "10 1/2", "EU": "64", "FR": "24", "IT": "24" },
        { "title": "V½", "UK": "V½", "US": "10 3/4", "EU": "64", "FR": "24", "IT": "24" },
        { "title": "W", "UK": "W", "US": "11", "EU": "65", "FR": "25", "IT": "25" },
        { "title": "W½", "UK": "W½", "US": "11 1/4", "EU": "65", "FR": "25", "IT": "25" },
        { "title": "X", "UK": "X", "US": "11 1/2", "EU": "66", "FR": "26", "IT": "26" },
        { "title": "X½", "UK": "X½", "US": "11 3/4", "EU": "67", "FR": "27", "IT": "27" },
        { "title": "Y", "UK": "Y", "US": "12", "EU": "67", "FR": "27", "IT": "27" },
        { "title": "Y½", "UK": "Y½", "US": "12 1/4", "EU": "68", "FR": "28", "IT": "28" },
        { "title": "Z", "UK": "Z", "US": "12 1/2", "EU": "69", "FR": "29", "IT": "29" }
    ]

    // const cats = await prisma.category.createMany({
    //     data: categories,
    //     skipDuplicates: true
    // });

    // console.log(cats.count, "Sizescreated");
}