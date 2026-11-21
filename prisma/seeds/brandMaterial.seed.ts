import { PrismaClient } from "@prisma/client";


export async function BrandmaterialySeed(prisma: PrismaClient) {


    const material = [
        {
            "name": "Cotton",
            "order": 1
        },
        {
            "name": "Organic Cotton",
            "order": 2
        },
        {
            "name": "Linen",
            "order": 3
        },
        {
            "name": "Silk",
            "order": 4
        },
        {
            "name": "Wool",
            "order": 5
        },
        {
            "name": "Merino Wool",
            "order": 6
        },
        {
            "name": "Cashmere",
            "order": 7
        },
        {
            "name": "Mohair",
            "order": 8
        },
        {
            "name": "Alpaca",
            "order": 9
        },
        {
            "name": "Angora",
            "order": 10
        },
        {
            "name": "Leather",
            "order": 11
        },
        {
            "name": "Suede",
            "order": 12
        },
        {
            "name": "Shearling",
            "order": 13
        },
        {
            "name": "Fur",
            "order": 14
        },
        {
            "name": "Denim",
            "order": 15
        },
        {
            "name": "Hemp",
            "order": 16
        },
        {
            "name": "Bamboo",
            "order": 17
        },
        {
            "name": "Polyester",
            "order": 18
        },
        {
            "name": "Recycled Polyester",
            "order": 19
        },
        {
            "name": "Nylon",
            "order": 20
        },
        {
            "name": "Recycled Nylon",
            "order": 21
        },
        {
            "name": "Acrylic",
            "order": 22
        },
        {
            "name": "Elastane / Spandex",
            "order": 23
        },
        {
            "name": "Viscose",
            "order": 24
        },
        {
            "name": "Rayon",
            "order": 25
        },
        {
            "name": "Modal",
            "order": 26
        },
        {
            "name": "Lyocell / TENCEL",
            "order": 27
        },
        {
            "name": "Acetate",
            "order": 28
        },
        {
            "name": "Polyamide",
            "order": 29
        },
        {
            "name": "Polyurethane (PU)",
            "order": 30
        },
        {
            "name": "Faux Leather",
            "order": 31
        },
        {
            "name": "Faux Suede",
            "order": 32
        },
        {
            "name": "Faux Fur",
            "order": 33
        },
        {
            "name": "Fleece",
            "order": 34
        },
        {
            "name": "Velvet",
            "order": 35
        },
        {
            "name": "Corduroy",
            "order": 36
        },
        {
            "name": "Satin",
            "order": 37
        },
        {
            "name": "Chiffon",
            "order": 38
        },
        {
            "name": "Lace",
            "order": 39
        },
        {
            "name": "Jersey",
            "order": 40
        },
        {
            "name": "Tweed",
            "order": 41
        },
        {
            "name": "Canvas",
            "order": 42
        },
        {
            "name": "Mesh",
            "order": 43
        },
        {
            "name": "Neoprene",
            "order": 44
        },
        {
            "name": "PVC",
            "order": 45
        },
        {
            "name": "Rubber",
            "order": 46
        },
        {
            "name": "Plastic",
            "order": 47
        },
        {
            "name": "Metal",
            "order": 48
        },
        {
            "name": "Straw",
            "order": 49
        },
        {
            "name": "Raffia",
            "order": 50
        },
        {
            "name": "Sequins",
            "order": 51
        },
        {
            "name": "Mixed Materials",
            "order": 52
        },

        {
            "name": "Unidentified",
            "order": 53
        },
        {
            "name": "Other",
            "order": 54
        }
    ]


    const brands = [
        {
            "name": "032c",
            "order": 1
        },
        {
            "name": "1017 ALYX 9SM",
            "order": 2
        },
        {
            "name": "16Arlington",
            "order": 3
        },
        {
            "name": "2XU",
            "order": 4
        },
        {
            "name": "3.1 Phillip Lim",
            "order": 5
        },
        {
            "name": "6397",
            "order": 6
        },
        {
            "name": "7 For All Mankind",
            "order": 7
        },
        {
            "name": "A Bathing Ape (BAPE)",
            "order": 8
        },
        {
            "name": "A-Cold-Wall",
            "order": 9
        },
        {
            "name": "A.L.C.",
            "order": 10
        },
        {
            "name": "A.P.C.",
            "order": 11
        },
        {
            "name": "A.W.A.K.E. Mode",
            "order": 12
        },
        {
            "name": "Abercrombie & Fitch",
            "order": 13
        },
        {
            "name": "Acne Studios",
            "order": 14
        },
        {
            "name": "Adanola",
            "order": 15
        },
        {
            "name": "Ader Error",
            "order": 16
        },
        {
            "name": "Adidas",
            "order": 17
        },
        {
            "name": "Adidas by Stella McCartney",
            "order": 18
        },
        {
            "name": "Adidas Originals",
            "order": 19
        },
        {
            "name": "Adidas Y-3",
            "order": 20
        },
        {
            "name": "AG Jeans",
            "order": 21
        },
        {
            "name": "Agua Bendita",
            "order": 22
        },
        {
            "name": "Aimé Leon Dore",
            "order": 23
        },
        {
            "name": "Aje",
            "order": 24
        },
        {
            "name": "Aje Athletica",
            "order": 25
        },
        {
            "name": "Akira",
            "order": 26
        },
        {
            "name": "Alaïa",
            "order": 27
        },
        {
            "name": "Albaray",
            "order": 28
        },
        {
            "name": "Aldo",
            "order": 29
        },
        {
            "name": "Aleksandre Akhalkatsishvili",
            "order": 30
        },
        {
            "name": "Alemais",
            "order": 31
        },
        {
            "name": "Alexander McQueen",
            "order": 32
        },
        {
            "name": "Alexander Wang",
            "order": 33
        },
        {
            "name": "Alice + Olivia",
            "order": 34
        },
        {
            "name": "Alighieri",
            "order": 35
        },
        {
            "name": "Aligne",
            "order": 36
        },
        {
            "name": "Alix of Bohemia",
            "order": 37
        },
        {
            "name": "AllSaints",
            "order": 38
        },
        {
            "name": "Alo Yoga",
            "order": 39
        },
        {
            "name": "Altu",
            "order": 40
        },
        {
            "name": "Altuzarra",
            "order": 41
        },
        {
            "name": "Ambush",
            "order": 42
        },
        {
            "name": "American Eagle",
            "order": 43
        },
        {
            "name": "American Vintage",
            "order": 44
        },
        {
            "name": "AMI Paris",
            "order": 45
        },
        {
            "name": "Amina Muaddi",
            "order": 46
        },
        {
            "name": "Amiri",
            "order": 47
        },
        {
            "name": "Anine Bing",
            "order": 48
        },
        {
            "name": "Ann Demeulemeester",
            "order": 49
        },
        {
            "name": "Anna Sui",
            "order": 50
        },
        {
            "name": "Anthropologie",
            "order": 51
        },
        {
            "name": "Anti Social Social Club",
            "order": 52
        },
        {
            "name": "Anya Hindmarch",
            "order": 53
        },
        {
            "name": "Apricot",
            "order": 54
        },
        {
            "name": "Aquascutum",
            "order": 55
        },
        {
            "name": "Aquazzura",
            "order": 56
        },
        {
            "name": "Arc’teryx",
            "order": 57
        },
        {
            "name": "Area",
            "order": 58
        },
        {
            "name": "Arena",
            "order": 59
        },
        {
            "name": "Arket",
            "order": 60
        },
        {
            "name": "Armani Exchange",
            "order": 61
        },
        {
            "name": "Asics",
            "order": 62
        },
        {
            "name": "ASOS",
            "order": 63
        },
        {
            "name": "ASOS Design",
            "order": 64
        },
        {
            "name": "ASOS Edition",
            "order": 65
        },
        {
            "name": "Aspinal of London",
            "order": 66
        },
        {
            "name": "Astrid & Miyu",
            "order": 67
        },
        {
            "name": "Atlein",
            "order": 68
        },
        {
            "name": "ATP Atelier",
            "order": 69
        },
        {
            "name": "Attico",
            "order": 70
        },
        {
            "name": "Autry",
            "order": 71
        },
        {
            "name": "Avirex",
            "order": 72
        },
        {
            "name": "Awake NY",
            "order": 73
        },
        {
            "name": "AX Paris",
            "order": 74
        },
        {
            "name": "Axel Arigato",
            "order": 75
        },
        {
            "name": "AYBL",
            "order": 76
        },
        {
            "name": "ba&sh",
            "order": 77
        },
        {
            "name": "Babaton",
            "order": 78
        },
        {
            "name": "Baby Dior",
            "order": 79
        },
        {
            "name": "Balenciaga",
            "order": 80
        },
        {
            "name": "Balmain",
            "order": 81
        },
        {
            "name": "Banana Republic",
            "order": 82
        },
        {
            "name": "Baracuta",
            "order": 83
        },
        {
            "name": "Barba Napoli",
            "order": 84
        },
        {
            "name": "Barbour",
            "order": 85
        },
        {
            "name": "Barbour International",
            "order": 86
        },
        {
            "name": "Barker",
            "order": 87
        },
        {
            "name": "Baserange",
            "order": 88
        },
        {
            "name": "Bassike",
            "order": 89
        },
        {
            "name": "Batsheva",
            "order": 90
        },
        {
            "name": "Baukjen",
            "order": 91
        },
        {
            "name": "Beach Riot",
            "order": 92
        },
        {
            "name": "Beams",
            "order": 93
        },
        {
            "name": "Beams Plus",
            "order": 94
        },
        {
            "name": "Bec + Bridge",
            "order": 95
        },
        {
            "name": "Belstaff",
            "order": 96
        },
        {
            "name": "Belvest",
            "order": 97
        },
        {
            "name": "Ben Sherman",
            "order": 98
        },
        {
            "name": "Benetton",
            "order": 99
        },
        {
            "name": "Berghaus",
            "order": 100
        },
        {
            "name": "Berluti",
            "order": 101
        },
        {
            "name": "Bershka",
            "order": 102
        },
        {
            "name": "Betsey Johnson",
            "order": 103
        },
        {
            "name": "Beyond Yoga",
            "order": 104
        },
        {
            "name": "Biba",
            "order": 105
        },
        {
            "name": "Billionaire Boys Club",
            "order": 106
        },
        {
            "name": "Birkenstock",
            "order": 107
        },
        {
            "name": "Bluebella",
            "order": 108
        },
        {
            "name": "Bobo Choses",
            "order": 109
        },
        {
            "name": "Boden",
            "order": 110
        },
        {
            "name": "Boglioli",
            "order": 111
        },
        {
            "name": "Bonmarché",
            "order": 112
        },
        {
            "name": "Bonpoint",
            "order": 113
        },
        {
            "name": "Boohoo",
            "order": 114
        },
        {
            "name": "BoohooMAN",
            "order": 115
        },
        {
            "name": "BOSS",
            "order": 116
        },
        {
            "name": "BOSS Kidswear",
            "order": 117
        },
        {
            "name": "Bottega Veneta",
            "order": 118
        },
        {
            "name": "Boucheron",
            "order": 119
        },
        {
            "name": "Boux Avenue",
            "order": 120
        },
        {
            "name": "Brandy Melville",
            "order": 121
        },
        {
            "name": "Breitling",
            "order": 122
        },
        {
            "name": "Brian Dales",
            "order": 123
        },
        {
            "name": "Brioni",
            "order": 124
        },
        {
            "name": "Brooks Brothers",
            "order": 125
        },
        {
            "name": "Brooks Running",
            "order": 126
        },
        {
            "name": "Brunello Cucinelli",
            "order": 127
        },
        {
            "name": "Bulgari",
            "order": 128
        },
        {
            "name": "Burberry",
            "order": 129
        },
        {
            "name": "Burberry Kids",
            "order": 130
        },
        {
            "name": "Butter Goods",
            "order": 131
        },
        {
            "name": "By Far",
            "order": 132
        },
        {
            "name": "C&A",
            "order": 133
        },
        {
            "name": "Calvin Klein",
            "order": 134
        },
        {
            "name": "Calvin Klein Jeans",
            "order": 135
        },
        {
            "name": "Calzedonia",
            "order": 136
        },
        {
            "name": "Camilla",
            "order": 137
        },
        {
            "name": "Canada Goose",
            "order": 138
        },
        {
            "name": "Canali",
            "order": 139
        },
        {
            "name": "Canterbury",
            "order": 140
        },
        {
            "name": "Carhartt",
            "order": 141
        },
        {
            "name": "Carhartt WIP",
            "order": 142
        },
        {
            "name": "Carolina Herrera",
            "order": 143
        },
        {
            "name": "Carter’s",
            "order": 144
        },
        {
            "name": "Cartier",
            "order": 145
        },
        {
            "name": "Caruso",
            "order": 146
        },
        {
            "name": "Carvela",
            "order": 147
        },
        {
            "name": "Casablanca",
            "order": 148
        },
        {
            "name": "Casadei",
            "order": 149
        },
        {
            "name": "Casio",
            "order": 150
        },
        {
            "name": "Castore",
            "order": 151
        },
        {
            "name": "Cecilie Bahnsen",
            "order": 152
        },
        {
            "name": "Celine",
            "order": 153
        },
        {
            "name": "Cesare Attolini",
            "order": 154
        },
        {
            "name": "Cesare Paciotti",
            "order": 155
        },
        {
            "name": "Chanel",
            "order": 156
        },
        {
            "name": "Charles & Keith",
            "order": 157
        },
        {
            "name": "Charles Tyrwhitt",
            "order": 158
        },
        {
            "name": "Chaumet",
            "order": 159
        },
        {
            "name": "Cheaney",
            "order": 160
        },
        {
            "name": "Chi Chi London",
            "order": 161
        },
        {
            "name": "Chinatown Market",
            "order": 162
        },
        {
            "name": "Chloé",
            "order": 163
        },
        {
            "name": "Chopard",
            "order": 164
        },
        {
            "name": "Christian Dior",
            "order": 165
        },
        {
            "name": "Christian Louboutin",
            "order": 166
        },
        {
            "name": "Christopher Esber",
            "order": 167
        },
        {
            "name": "Christopher Kane",
            "order": 168
        },
        {
            "name": "Chrome Hearts",
            "order": 169
        },
        {
            "name": "Church’s",
            "order": 170
        },
        {
            "name": "Citizens of Humanity",
            "order": 171
        },
        {
            "name": "Clarks",
            "order": 172
        },
        {
            "name": "Clarks Originals",
            "order": 173
        },
        {
            "name": "Claudie Pierlot",
            "order": 174
        },
        {
            "name": "Closed",
            "order": 175
        },
        {
            "name": "Club L London",
            "order": 176
        },
        {
            "name": "Club Monaco",
            "order": 177
        },
        {
            "name": "Coach",
            "order": 178
        },
        {
            "name": "Coast",
            "order": 179
        },
        {
            "name": "Coccinelle",
            "order": 180
        },
        {
            "name": "Cole Buxton",
            "order": 181
        },
        {
            "name": "Collina Strada",
            "order": 182
        },
        {
            "name": "Colombo",
            "order": 183
        },
        {
            "name": "Columbia",
            "order": 184
        },
        {
            "name": "Comme des Garçons",
            "order": 185
        },
        {
            "name": "Common Projects",
            "order": 186
        },
        {
            "name": "Completedworks",
            "order": 187
        },
        {
            "name": "Converse",
            "order": 188
        },
        {
            "name": "Coperni",
            "order": 189
        },
        {
            "name": "Corneliani",
            "order": 190
        },
        {
            "name": "Corteiz",
            "order": 191
        },
        {
            "name": "COS",
            "order": 192
        },
        {
            "name": "Cotton On",
            "order": 193
        },
        {
            "name": "Cotton Traders",
            "order": 194
        },
        {
            "name": "Courrèges",
            "order": 195
        },
        {
            "name": "Craghoppers",
            "order": 196
        },
        {
            "name": "Crew Clothing",
            "order": 197
        },
        {
            "name": "Crockett & Jones",
            "order": 198
        },
        {
            "name": "Crocs",
            "order": 199
        },
        {
            "name": "Cult Gaia",
            "order": 200
        },
        {
            "name": "Cutler and Gross",
            "order": 201
        },
        {
            "name": "Cyberjammies",
            "order": 202
        },
        {
            "name": "Daily Paper",
            "order": 203
        },
        {
            "name": "Daisy London",
            "order": 204
        },
        {
            "name": "Damson Madder",
            "order": 205
        },
        {
            "name": "David Yurman",
            "order": 206
        },
        {
            "name": "DC Shoes",
            "order": 207
        },
        {
            "name": "Dear Frances",
            "order": 208
        },
        {
            "name": "Debenhams",
            "order": 209
        },
        {
            "name": "DeFacto",
            "order": 210
        },
        {
            "name": "Delvaux",
            "order": 211
        },
        {
            "name": "DeMellier",
            "order": 212
        },
        {
            "name": "Denim Tears",
            "order": 213
        },
        {
            "name": "Derek Rose",
            "order": 214
        },
        {
            "name": "Desigual",
            "order": 215
        },
        {
            "name": "Desmond & Dempsey",
            "order": 216
        },
        {
            "name": "Dickies",
            "order": 217
        },
        {
            "name": "Diesel",
            "order": 218
        },
        {
            "name": "Dime",
            "order": 219
        },
        {
            "name": "Dion Lee",
            "order": 220
        },
        {
            "name": "Dior",
            "order": 221
        },
        {
            "name": "Dior Homme",
            "order": 222
        },
        {
            "name": "DL1961",
            "order": 223
        },
        {
            "name": "Dôen",
            "order": 224
        },
        {
            "name": "Dolce & Gabbana",
            "order": 225
        },
        {
            "name": "Dolce & Gabbana Kids",
            "order": 226
        },
        {
            "name": "Doriani",
            "order": 227
        },
        {
            "name": "Dorothy Perkins",
            "order": 228
        },
        {
            "name": "Dr. Martens",
            "order": 229
        },
        {
            "name": "Dries Van Noten",
            "order": 230
        },
        {
            "name": "DSquared2",
            "order": 231
        },
        {
            "name": "Dune London",
            "order": 232
        },
        {
            "name": "Dynamite",
            "order": 233
        },
        {
            "name": "E. Marinella",
            "order": 234
        },
        {
            "name": "Eckhaus Latta",
            "order": 235
        },
        {
            "name": "Ecko Unltd.",
            "order": 236
        },
        {
            "name": "Eddie Bauer",
            "order": 237
        },
        {
            "name": "Edikted",
            "order": 238
        },
        {
            "name": "Edwin",
            "order": 239
        },
        {
            "name": "EGO",
            "order": 240
        },
        {
            "name": "Eleventy",
            "order": 241
        },
        {
            "name": "Elie Saab",
            "order": 242
        },
        {
            "name": "Emile et Rose",
            "order": 243
        },
        {
            "name": "Emilio Pucci",
            "order": 244
        },
        {
            "name": "Emporio Armani",
            "order": 245
        },
        {
            "name": "Erdem",
            "order": 246
        },
        {
            "name": "Eres",
            "order": 247
        },
        {
            "name": "Escada",
            "order": 248
        },
        {
            "name": "Esprit",
            "order": 249
        },
        {
            "name": "Etam",
            "order": 250
        },
        {
            "name": "Eton",
            "order": 251
        },
        {
            "name": "Etro",
            "order": 252
        },
        {
            "name": "Evans",
            "order": 253
        },
        {
            "name": "Evisu",
            "order": 254
        },
        {
            "name": "Eytys",
            "order": 255
        },
        {
            "name": "F&F",
            "order": 256
        },
        {
            "name": "Fabletics",
            "order": 257
        },
        {
            "name": "Faithfull the Brand",
            "order": 258
        },
        {
            "name": "Farm Rio",
            "order": 259
        },
        {
            "name": "FatFace",
            "order": 260
        },
        {
            "name": "Fear of God",
            "order": 261
        },
        {
            "name": "Fear of God Essentials",
            "order": 262
        },
        {
            "name": "Fedeli",
            "order": 263
        },
        {
            "name": "Fendi",
            "order": 264
        },
        {
            "name": "Fendi Kids",
            "order": 265
        },
        {
            "name": "Ferragamo",
            "order": 266
        },
        {
            "name": "Filippa K",
            "order": 267
        },
        {
            "name": "Filson",
            "order": 268
        },
        {
            "name": "Finamore 1925",
            "order": 269
        },
        {
            "name": "Finery London",
            "order": 270
        },
        {
            "name": "Fiorucci",
            "order": 271
        },
        {
            "name": "FitFlop",
            "order": 272
        },
        {
            "name": "Fleur du Mal",
            "order": 273
        },
        {
            "name": "Fossil",
            "order": 274
        },
        {
            "name": "Frame",
            "order": 275
        },
        {
            "name": "Frankies Bikinis",
            "order": 276
        },
        {
            "name": "Fred Perry",
            "order": 277
        },
        {
            "name": "Free People",
            "order": 278
        },
        {
            "name": "French Connection",
            "order": 279
        },
        {
            "name": "Frescobol Carioca",
            "order": 280
        },
        {
            "name": "Freya",
            "order": 281
        },
        {
            "name": "Frugi",
            "order": 282
        },
        {
            "name": "FUBU",
            "order": 283
        },
        {
            "name": "Furla",
            "order": 284
        },
        {
            "name": "G-Shock",
            "order": 285
        },
        {
            "name": "Gabriela Hearst",
            "order": 286
        },
        {
            "name": "Ganni",
            "order": 287
        },
        {
            "name": "GANT",
            "order": 288
        },
        {
            "name": "Gap",
            "order": 289
        },
        {
            "name": "Gap Baby",
            "order": 290
        },
        {
            "name": "Gap Kids",
            "order": 291
        },
        {
            "name": "Garage",
            "order": 292
        },
        {
            "name": "GCDS",
            "order": 293
        },
        {
            "name": "Gentle Monster",
            "order": 294
        },
        {
            "name": "George at ASDA",
            "order": 295
        },
        {
            "name": "Giambattista Valli",
            "order": 296
        },
        {
            "name": "Gianvito Rossi",
            "order": 297
        },
        {
            "name": "Gieves & Hawkes",
            "order": 298
        },
        {
            "name": "Giorgio Armani",
            "order": 299
        },
        {
            "name": "Giuseppe Zanotti",
            "order": 300
        },
        {
            "name": "Glassons",
            "order": 301
        },
        {
            "name": "GmbH",
            "order": 302
        },
        {
            "name": "Golden Goose",
            "order": 303
        },
        {
            "name": "Golf Wang",
            "order": 304
        },
        {
            "name": "Goyard",
            "order": 305
        },
        {
            "name": "Gran Sasso",
            "order": 306
        },
        {
            "name": "Grenson",
            "order": 307
        },
        {
            "name": "Gucci",
            "order": 308
        },
        {
            "name": "Gucci Kids",
            "order": 309
        },
        {
            "name": "Gunne Sax",
            "order": 310
        },
        {
            "name": "Gymshark",
            "order": 311
        },
        {
            "name": "H&M",
            "order": 312
        },
        {
            "name": "H&M Baby",
            "order": 313
        },
        {
            "name": "H&M Kids",
            "order": 314
        },
        {
            "name": "H&M Studio",
            "order": 315
        },
        {
            "name": "Haglöfs",
            "order": 316
        },
        {
            "name": "Halara",
            "order": 317
        },
        {
            "name": "Harris Tweed",
            "order": 318
        },
        {
            "name": "Harris Wharf London",
            "order": 319
        },
        {
            "name": "Havaianas",
            "order": 320
        },
        {
            "name": "Hawes & Curtis",
            "order": 321
        },
        {
            "name": "Heidi Klein",
            "order": 322
        },
        {
            "name": "Hellstar",
            "order": 323
        },
        {
            "name": "Helly Hansen",
            "order": 324
        },
        {
            "name": "Helmut Lang",
            "order": 325
        },
        {
            "name": "Hemp Tailor",
            "order": 326
        },
        {
            "name": "Hermès",
            "order": 327
        },
        {
            "name": "Heron Preston",
            "order": 328
        },
        {
            "name": "Hobbs",
            "order": 329
        },
        {
            "name": "Hogan",
            "order": 330
        },
        {
            "name": "Hoka",
            "order": 331
        },
        {
            "name": "Holland & Sherry",
            "order": 332
        },
        {
            "name": "Hollister",
            "order": 333
        },
        {
            "name": "Holzweiler",
            "order": 334
        },
        {
            "name": "Hoodrich",
            "order": 335
        },
        {
            "name": "House",
            "order": 336
        },
        {
            "name": "House of CB",
            "order": 337
        },
        {
            "name": "HUF",
            "order": 338
        },
        {
            "name": "HUGO",
            "order": 339
        },
        {
            "name": "Human Made",
            "order": 340
        },
        {
            "name": "Hunter",
            "order": 341
        },
        {
            "name": "Hunza G",
            "order": 342
        },
        {
            "name": "Hush",
            "order": 343
        },
        {
            "name": "I Saw It First",
            "order": 344
        },
        {
            "name": "Iceberg",
            "order": 345
        },
        {
            "name": "Icecream",
            "order": 346
        },
        {
            "name": "Il Gufo",
            "order": 347
        },
        {
            "name": "In The Style",
            "order": 348
        },
        {
            "name": "Intimissimi",
            "order": 349
        },
        {
            "name": "Isabel Marant",
            "order": 350
        },
        {
            "name": "Isabel Marant Étoile",
            "order": 351
        },
        {
            "name": "Issey Miyake",
            "order": 352
        },
        {
            "name": "J Brand",
            "order": 353
        },
        {
            "name": "J.Crew",
            "order": 354
        },
        {
            "name": "J.Crew Collection",
            "order": 355
        },
        {
            "name": "Jacadi",
            "order": 356
        },
        {
            "name": "Jack & Jones",
            "order": 357
        },
        {
            "name": "Jack Wolfskin",
            "order": 358
        },
        {
            "name": "Jacquemus",
            "order": 359
        },
        {
            "name": "Jaded London",
            "order": 360
        },
        {
            "name": "Jaeger",
            "order": 361
        },
        {
            "name": "Jigsaw",
            "order": 362
        },
        {
            "name": "Jil Sander",
            "order": 363
        },
        {
            "name": "Jimmy Choo",
            "order": 364
        },
        {
            "name": "Joe Browns",
            "order": 365
        },
        {
            "name": "John Lewis",
            "order": 366
        },
        {
            "name": "John Lobb",
            "order": 367
        },
        {
            "name": "John Smedley",
            "order": 368
        },
        {
            "name": "JoJo Maman Bébé",
            "order": 369
        },
        {
            "name": "Jordan",
            "order": 370
        },
        {
            "name": "Joseph",
            "order": 371
        },
        {
            "name": "Joules",
            "order": 372
        },
        {
            "name": "JW Anderson",
            "order": 373
        },
        {
            "name": "JW Pei",
            "order": 374
        },
        {
            "name": "Karen Millen",
            "order": 375
        },
        {
            "name": "Karl Kani",
            "order": 376
        },
        {
            "name": "Karrimor",
            "order": 377
        },
        {
            "name": "Kate Spade",
            "order": 378
        },
        {
            "name": "Keds",
            "order": 379
        },
        {
            "name": "Kenzo",
            "order": 380
        },
        {
            "name": "Kenzo Kids",
            "order": 381
        },
        {
            "name": "KG Kurt Geiger",
            "order": 382
        },
        {
            "name": "Khaite",
            "order": 383
        },
        {
            "name": "Kiabi",
            "order": 384
        },
        {
            "name": "Kiko Kostadinov",
            "order": 385
        },
        {
            "name": "Kissy Kissy",
            "order": 386
        },
        {
            "name": "Kith",
            "order": 387
        },
        {
            "name": "Kiton",
            "order": 388
        },
        {
            "name": "KNWLS",
            "order": 389
        },
        {
            "name": "Komodo",
            "order": 390
        },
        {
            "name": "Konges Sløjd",
            "order": 391
        },
        {
            "name": "Koton",
            "order": 392
        },
        {
            "name": "Kurt Geiger",
            "order": 393
        },
        {
            "name": "Kwaidan Editions",
            "order": 394
        },
        {
            "name": "L.L.Bean",
            "order": 395
        },
        {
            "name": "La DoubleJ",
            "order": 396
        },
        {
            "name": "La Perla",
            "order": 397
        },
        {
            "name": "Lacoste",
            "order": 398
        },
        {
            "name": "Lands’ End",
            "order": 399
        },
        {
            "name": "Lanvin",
            "order": 400
        },
        {
            "name": "Lardini",
            "order": 401
        },
        {
            "name": "Laura Ashley",
            "order": 402
        },
        {
            "name": "Lauren Ralph Lauren",
            "order": 403
        },
        {
            "name": "Lavish Alice",
            "order": 404
        },
        {
            "name": "LC Waikiki",
            "order": 405
        },
        {
            "name": "Le Specs",
            "order": 406
        },
        {
            "name": "Lee",
            "order": 407
        },
        {
            "name": "Lee Cooper",
            "order": 408
        },
        {
            "name": "Lemaire",
            "order": 409
        },
        {
            "name": "Les Benjamins",
            "order": 410
        },
        {
            "name": "Leset",
            "order": 411
        },
        {
            "name": "Levi’s",
            "order": 412
        },
        {
            "name": "Levi’s Vintage Clothing",
            "order": 413
        },
        {
            "name": "Liewood",
            "order": 414
        },
        {
            "name": "Linda Farrow",
            "order": 415
        },
        {
            "name": "Lioness",
            "order": 416
        },
        {
            "name": "Lipsy",
            "order": 417
        },
        {
            "name": "Little Mistress",
            "order": 418
        },
        {
            "name": "LK Bennett",
            "order": 419
        },
        {
            "name": "Loake",
            "order": 420
        },
        {
            "name": "Loewe",
            "order": 421
        },
        {
            "name": "Longchamp",
            "order": 422
        },
        {
            "name": "Longines",
            "order": 423
        },
        {
            "name": "Loro Piana",
            "order": 424
        },
        {
            "name": "Love Stories",
            "order": 425
        },
        {
            "name": "LoveShackFancy",
            "order": 426
        },
        {
            "name": "Low Classic",
            "order": 427
        },
        {
            "name": "Luciano Barbera",
            "order": 428
        },
        {
            "name": "Lucien Pellat-Finet",
            "order": 429
        },
        {
            "name": "Lucy & Yak",
            "order": 430
        },
        {
            "name": "Ludovic de Saint Sernin",
            "order": 431
        },
        {
            "name": "Luli Fama",
            "order": 432
        },
        {
            "name": "Lulu Guinness",
            "order": 433
        },
        {
            "name": "Lululemon",
            "order": 434
        },
        {
            "name": "Lyle & Scott",
            "order": 435
        },
        {
            "name": "M&S Autograph",
            "order": 436
        },
        {
            "name": "M&S Collection",
            "order": 437
        },
        {
            "name": "Mackintosh",
            "order": 438
        },
        {
            "name": "Madewell",
            "order": 439
        },
        {
            "name": "Magda Butrym",
            "order": 440
        },
        {
            "name": "Maharishi",
            "order": 441
        },
        {
            "name": "Maine New England",
            "order": 442
        },
        {
            "name": "Maison Kitsuné",
            "order": 443
        },
        {
            "name": "Maison Margiela",
            "order": 444
        },
        {
            "name": "Maje",
            "order": 445
        },
        {
            "name": "Mamas & Papas",
            "order": 446
        },
        {
            "name": "Mango",
            "order": 447
        },
        {
            "name": "Mango Man",
            "order": 448
        },
        {
            "name": "Mango Teen",
            "order": 449
        },
        {
            "name": "Manolo Blahnik",
            "order": 450
        },
        {
            "name": "Mansur Gavriel",
            "order": 451
        },
        {
            "name": "Marc by Marc Jacobs",
            "order": 452
        },
        {
            "name": "Marc Jacobs",
            "order": 453
        },
        {
            "name": "Marchesa",
            "order": 454
        },
        {
            "name": "Marina Rinaldi",
            "order": 455
        },
        {
            "name": "Marine Serre",
            "order": 456
        },
        {
            "name": "Marks & Spencer",
            "order": 457
        },
        {
            "name": "Marni",
            "order": 458
        },
        {
            "name": "Martine Rose",
            "order": 459
        },
        {
            "name": "Massimo Dutti",
            "order": 460
        },
        {
            "name": "Matalan",
            "order": 461
        },
        {
            "name": "Mavi",
            "order": 462
        },
        {
            "name": "Max & Co.",
            "order": 463
        },
        {
            "name": "Max Mara",
            "order": 464
        },
        {
            "name": "Mayoral",
            "order": 465
        },
        {
            "name": "ME+EM",
            "order": 466
        },
        {
            "name": "Mejuri",
            "order": 467
        },
        {
            "name": "Melissa Odabash",
            "order": 468
        },
        {
            "name": "Merc London",
            "order": 469
        },
        {
            "name": "Merrell",
            "order": 470
        },
        {
            "name": "Meshki",
            "order": 471
        },
        {
            "name": "Michael Kors",
            "order": 472
        },
        {
            "name": "Michael Kors Watches",
            "order": 473
        },
        {
            "name": "Mini Boden",
            "order": 474
        },
        {
            "name": "Mini Rodini",
            "order": 475
        },
        {
            "name": "Mint Velvet",
            "order": 476
        },
        {
            "name": "Missguided",
            "order": 477
        },
        {
            "name": "Missoma",
            "order": 478
        },
        {
            "name": "Missoni",
            "order": 479
        },
        {
            "name": "Misspap",
            "order": 480
        },
        {
            "name": "Miu Miu",
            "order": 481
        },
        {
            "name": "MM6 Maison Margiela",
            "order": 482
        },
        {
            "name": "Molo",
            "order": 483
        },
        {
            "name": "Moncler",
            "order": 484
        },
        {
            "name": "Moncler Enfant",
            "order": 485
        },
        {
            "name": "Moncler Grenoble",
            "order": 486
        },
        {
            "name": "Monday Swimwear",
            "order": 487
        },
        {
            "name": "Monica Vinader",
            "order": 488
        },
        {
            "name": "Monki",
            "order": 489
        },
        {
            "name": "Monsoon",
            "order": 490
        },
        {
            "name": "Montane",
            "order": 491
        },
        {
            "name": "Moon Boot",
            "order": 492
        },
        {
            "name": "Mori",
            "order": 493
        },
        {
            "name": "Motel Rocks",
            "order": 494
        },
        {
            "name": "Mother Denim",
            "order": 495
        },
        {
            "name": "Mothercare",
            "order": 496
        },
        {
            "name": "Motivi",
            "order": 497
        },
        {
            "name": "Mountain Equipment",
            "order": 498
        },
        {
            "name": "Moynat",
            "order": 499
        },
        {
            "name": "MP Activewear",
            "order": 500
        },
        {
            "name": "Mugler",
            "order": 501
        },
        {
            "name": "Mulberry",
            "order": 502
        },
        {
            "name": "Myprotein",
            "order": 503
        },
        {
            "name": "Nadine Merabi",
            "order": 504
        },
        {
            "name": "Nanushka",
            "order": 505
        },
        {
            "name": "Napapijri",
            "order": 506
        },
        {
            "name": "Nasty Gal",
            "order": 507
        },
        {
            "name": "Neighborhood",
            "order": 508
        },
        {
            "name": "Nensi Dojaka",
            "order": 509
        },
        {
            "name": "New Balance",
            "order": 510
        },
        {
            "name": "New Look",
            "order": 511
        },
        {
            "name": "New Yorker",
            "order": 512
        },
        {
            "name": "Next",
            "order": 513
        },
        {
            "name": "Next Baby",
            "order": 514
        },
        {
            "name": "Next Kids",
            "order": 515
        },
        {
            "name": "Nike",
            "order": 516
        },
        {
            "name": "Nike Sportswear",
            "order": 517
        },
        {
            "name": "NikeLab",
            "order": 518
        },
        {
            "name": "Noah",
            "order": 519
        },
        {
            "name": "Nobody’s Child",
            "order": 520
        },
        {
            "name": "Noisy May",
            "order": 521
        },
        {
            "name": "Nudie Jeans",
            "order": 522
        },
        {
            "name": "Nvgtn",
            "order": 523
        },
        {
            "name": "Oakley",
            "order": 524
        },
        {
            "name": "Oasis",
            "order": 525
        },
        {
            "name": "Obey",
            "order": 526
        },
        {
            "name": "Object",
            "order": 527
        },
        {
            "name": "Odd Muse",
            "order": 528
        },
        {
            "name": "Off-White",
            "order": 529
        },
        {
            "name": "Oh Polly",
            "order": 530
        },
        {
            "name": "Old Navy",
            "order": 531
        },
        {
            "name": "Oliver Goldsmith",
            "order": 532
        },
        {
            "name": "Oliver Peoples",
            "order": 533
        },
        {
            "name": "Olivia von Halle",
            "order": 534
        },
        {
            "name": "Omega",
            "order": 535
        },
        {
            "name": "On",
            "order": 536
        },
        {
            "name": "Oner Active",
            "order": 537
        },
        {
            "name": "Only",
            "order": 538
        },
        {
            "name": "Orlebar Brown",
            "order": 539
        },
        {
            "name": "Orsay",
            "order": 540
        },
        {
            "name": "Orvis",
            "order": 541
        },
        {
            "name": "Oscar de la Renta",
            "order": 542
        },
        {
            "name": "OshKosh B’gosh",
            "order": 543
        },
        {
            "name": "Osprey",
            "order": 544
        },
        {
            "name": "Outdoor Voices",
            "order": 545
        },
        {
            "name": "OVS",
            "order": 546
        },
        {
            "name": "Oysho",
            "order": 547
        },
        {
            "name": "Ozwald Boateng",
            "order": 548
        },
        {
            "name": "P.E Nation",
            "order": 549
        },
        {
            "name": "Paige",
            "order": 550
        },
        {
            "name": "Pal Zileri",
            "order": 551
        },
        {
            "name": "Palace",
            "order": 552
        },
        {
            "name": "Palm Angels",
            "order": 553
        },
        {
            "name": "Paloma Wool",
            "order": 554
        },
        {
            "name": "Panache",
            "order": 555
        },
        {
            "name": "Pandora",
            "order": 556
        },
        {
            "name": "Parfois",
            "order": 557
        },
        {
            "name": "Paris Texas",
            "order": 558
        },
        {
            "name": "Patagonia",
            "order": 559
        },
        {
            "name": "Patta",
            "order": 560
        },
        {
            "name": "Paul & Shark",
            "order": 561
        },
        {
            "name": "Paul Smith",
            "order": 562
        },
        {
            "name": "Peacocks",
            "order": 563
        },
        {
            "name": "Pendleton",
            "order": 564
        },
        {
            "name": "Pennyblack",
            "order": 565
        },
        {
            "name": "People Tree",
            "order": 566
        },
        {
            "name": "Per Una",
            "order": 567
        },
        {
            "name": "Persol",
            "order": 568
        },
        {
            "name": "Peter Do",
            "order": 569
        },
        {
            "name": "Petit Bateau",
            "order": 570
        },
        {
            "name": "Phase Eight",
            "order": 571
        },
        {
            "name": "Philipp Plein",
            "order": 572
        },
        {
            "name": "Phipps",
            "order": 573
        },
        {
            "name": "Piacenza Cashmere",
            "order": 574
        },
        {
            "name": "Pieces",
            "order": 575
        },
        {
            "name": "Pigeon Organics",
            "order": 576
        },
        {
            "name": "Pimkie",
            "order": 577
        },
        {
            "name": "Pinko",
            "order": 578
        },
        {
            "name": "Pleasures",
            "order": 579
        },
        {
            "name": "Pleats Please Issey Miyake",
            "order": 580
        },
        {
            "name": "Polar Skate Co.",
            "order": 581
        },
        {
            "name": "Polène",
            "order": 582
        },
        {
            "name": "Polo Ralph Lauren",
            "order": 583
        },
        {
            "name": "Polo Ralph Lauren Kids",
            "order": 584
        },
        {
            "name": "Polo Sport",
            "order": 585
        },
        {
            "name": "Popflex",
            "order": 586
        },
        {
            "name": "Popsy",
            "order": 587
        },
        {
            "name": "Prada",
            "order": 588
        },
        {
            "name": "Pretty Green",
            "order": 589
        },
        {
            "name": "Pretty Lavish",
            "order": 590
        },
        {
            "name": "PrettyLittleThing",
            "order": 591
        },
        {
            "name": "Primark",
            "order": 592
        },
        {
            "name": "Princess Polly",
            "order": 593
        },
        {
            "name": "Principles",
            "order": 594
        },
        {
            "name": "Pringle of Scotland",
            "order": 595
        },
        {
            "name": "Proenza Schouler",
            "order": 596
        },
        {
            "name": "Promod",
            "order": 597
        },
        {
            "name": "Public Desire",
            "order": 598
        },
        {
            "name": "Pull & Bear",
            "order": 599
        },
        {
            "name": "Puma",
            "order": 600
        },
        {
            "name": "Pursue Fitness",
            "order": 601
        },
        {
            "name": "Quay Australia",
            "order": 602
        },
        {
            "name": "Quiksilver",
            "order": 603
        },
        {
            "name": "Quiz",
            "order": 604
        },
        {
            "name": "Rab",
            "order": 605
        },
        {
            "name": "Rabanne",
            "order": 606
        },
        {
            "name": "Radley London",
            "order": 607
        },
        {
            "name": "Rag & Bone",
            "order": 608
        },
        {
            "name": "Rails",
            "order": 609
        },
        {
            "name": "Ralph Lauren Collection",
            "order": 610
        },
        {
            "name": "Ralph Lauren Kids",
            "order": 611
        },
        {
            "name": "Ralph Lauren Purple Label",
            "order": 612
        },
        {
            "name": "Rat & Boa",
            "order": 613
        },
        {
            "name": "Ray-Ban",
            "order": 614
        },
        {
            "name": "Réalisation Par",
            "order": 615
        },
        {
            "name": "Red Herring",
            "order": 616
        },
        {
            "name": "Reebok",
            "order": 617
        },
        {
            "name": "Reformation",
            "order": 618
        },
        {
            "name": "Regatta",
            "order": 619
        },
        {
            "name": "Reiss",
            "order": 620
        },
        {
            "name": "Rejina Pyo",
            "order": 621
        },
        {
            "name": "René Caovilla",
            "order": 622
        },
        {
            "name": "Replay",
            "order": 623
        },
        {
            "name": "Represent",
            "order": 624
        },
        {
            "name": "Reserved",
            "order": 625
        },
        {
            "name": "Rhude",
            "order": 626
        },
        {
            "name": "Richard James",
            "order": 627
        },
        {
            "name": "Rick Owens",
            "order": 628
        },
        {
            "name": "Rinascimento",
            "order": 629
        },
        {
            "name": "Ripndip",
            "order": 630
        },
        {
            "name": "River Island",
            "order": 631
        },
        {
            "name": "Rixo",
            "order": 632
        },
        {
            "name": "Roberto Cavalli",
            "order": 633
        },
        {
            "name": "Roger Vivier",
            "order": 634
        },
        {
            "name": "Róhe",
            "order": 635
        },
        {
            "name": "Roksanda",
            "order": 636
        },
        {
            "name": "Roland Mouret",
            "order": 637
        },
        {
            "name": "Rolex",
            "order": 638
        },
        {
            "name": "Roman",
            "order": 639
        },
        {
            "name": "Roman Originals",
            "order": 640
        },
        {
            "name": "Romwe",
            "order": 641
        },
        {
            "name": "Rotate",
            "order": 642
        },
        {
            "name": "Rouje",
            "order": 643
        },
        {
            "name": "RRL",
            "order": 644
        },
        {
            "name": "Rubinacci",
            "order": 645
        },
        {
            "name": "Russell & Bromley",
            "order": 646
        },
        {
            "name": "Ryderwear",
            "order": 647
        },
        {
            "name": "S.S. Daley",
            "order": 648
        },
        {
            "name": "Sacai",
            "order": 649
        },
        {
            "name": "Saint Laurent",
            "order": 650
        },
        {
            "name": "Salomon",
            "order": 651
        },
        {
            "name": "Sam Edelman",
            "order": 652
        },
        {
            "name": "Sandro",
            "order": 653
        },
        {
            "name": "Sandy Liang",
            "order": 654
        },
        {
            "name": "Santoni",
            "order": 655
        },
        {
            "name": "Sartorio Napoli",
            "order": 656
        },
        {
            "name": "Saucony",
            "order": 657
        },
        {
            "name": "Savage X Fenty",
            "order": 658
        },
        {
            "name": "Scabal",
            "order": 659
        },
        {
            "name": "Schiaparelli",
            "order": 660
        },
        {
            "name": "Schott NYC",
            "order": 661
        },
        {
            "name": "Schutz",
            "order": 662
        },
        {
            "name": "Scotch & Soda",
            "order": 663
        },
        {
            "name": "Seafolly",
            "order": 664
        },
        {
            "name": "Seasalt Cornwall",
            "order": 665
        },
        {
            "name": "Seiko",
            "order": 666
        },
        {
            "name": "Selected Femme",
            "order": 667
        },
        {
            "name": "Selected Homme",
            "order": 668
        },
        {
            "name": "Self-Portrait",
            "order": 669
        },
        {
            "name": "Sergio Rossi",
            "order": 670
        },
        {
            "name": "Sézane",
            "order": 671
        },
        {
            "name": "Shein",
            "order": 672
        },
        {
            "name": "Shona Joy",
            "order": 673
        },
        {
            "name": "Shushu/Tong",
            "order": 674
        },
        {
            "name": "Simmi London",
            "order": 675
        },
        {
            "name": "Simone Rocha",
            "order": 676
        },
        {
            "name": "Simply Be",
            "order": 677
        },
        {
            "name": "Sinsay",
            "order": 678
        },
        {
            "name": "Sir.",
            "order": 679
        },
        {
            "name": "Sisley",
            "order": 680
        },
        {
            "name": "Sister Jane",
            "order": 681
        },
        {
            "name": "Sisterhood",
            "order": 682
        },
        {
            "name": "Skall Studio",
            "order": 683
        },
        {
            "name": "Skims",
            "order": 684
        },
        {
            "name": "Solid & Striped",
            "order": 685
        },
        {
            "name": "Sophia Webster",
            "order": 686
        },
        {
            "name": "Sorel",
            "order": 687
        },
        {
            "name": "Sp5der",
            "order": 688
        },
        {
            "name": "Spanx",
            "order": 689
        },
        {
            "name": "Speedo",
            "order": 690
        },
        {
            "name": "Sportmax",
            "order": 691
        },
        {
            "name": "Springfield",
            "order": 692
        },
        {
            "name": "St. John",
            "order": 693
        },
        {
            "name": "Staud",
            "order": 694
        },
        {
            "name": "Stefano Ricci",
            "order": 695
        },
        {
            "name": "Stella McCartney",
            "order": 696
        },
        {
            "name": "Stella McCartney Kids",
            "order": 697
        },
        {
            "name": "Steve Madden",
            "order": 698
        },
        {
            "name": "Stone Island",
            "order": 699
        },
        {
            "name": "Stradivarius",
            "order": 700
        },
        {
            "name": "Strathberry",
            "order": 701
        },
        {
            "name": "Stuart Weitzman",
            "order": 702
        },
        {
            "name": "Studio Nicholson",
            "order": 703
        },
        {
            "name": "Stüssy",
            "order": 704
        },
        {
            "name": "Sunflower",
            "order": 705
        },
        {
            "name": "Sunspel",
            "order": 706
        },
        {
            "name": "Superdry",
            "order": 707
        },
        {
            "name": "Superga",
            "order": 708
        },
        {
            "name": "Supreme",
            "order": 709
        },
        {
            "name": "Swarovski",
            "order": 710
        },
        {
            "name": "Swatch",
            "order": 711
        },
        {
            "name": "Sweaty Betty",
            "order": 712
        },
        {
            "name": "T.M.Lewin",
            "order": 713
        },
        {
            "name": "TAG Heuer",
            "order": 714
        },
        {
            "name": "Tala",
            "order": 715
        },
        {
            "name": "Tally Weijl",
            "order": 716
        },
        {
            "name": "Tartine et Chocolat",
            "order": 717
        },
        {
            "name": "Ted Baker",
            "order": 718
        },
        {
            "name": "Telfar",
            "order": 719
        },
        {
            "name": "Tezenis",
            "order": 720
        },
        {
            "name": "The Animals Observatory",
            "order": 721
        },
        {
            "name": "The Hundreds",
            "order": 722
        },
        {
            "name": "The Kooples",
            "order": 723
        },
        {
            "name": "The Little White Company",
            "order": 724
        },
        {
            "name": "The North Face",
            "order": 725
        },
        {
            "name": "The Row",
            "order": 726
        },
        {
            "name": "The White Company",
            "order": 727
        },
        {
            "name": "Theory",
            "order": 728
        },
        {
            "name": "Thom Browne",
            "order": 729
        },
        {
            "name": "Thom Sweeney",
            "order": 730
        },
        {
            "name": "Thomas Pink",
            "order": 731
        },
        {
            "name": "Thomas Sabo",
            "order": 732
        },
        {
            "name": "Thought",
            "order": 733
        },
        {
            "name": "Thrasher",
            "order": 734
        },
        {
            "name": "Tibi",
            "order": 735
        },
        {
            "name": "Tiffany & Co.",
            "order": 736
        },
        {
            "name": "Timberland",
            "order": 737
        },
        {
            "name": "Tissot",
            "order": 738
        },
        {
            "name": "Toga",
            "order": 739
        },
        {
            "name": "Tom Ford",
            "order": 740
        },
        {
            "name": "Tommy Hilfiger",
            "order": 741
        },
        {
            "name": "Tommy Hilfiger Kids",
            "order": 742
        },
        {
            "name": "Tommy Jeans",
            "order": 743
        },
        {
            "name": "TOMS",
            "order": 744
        },
        {
            "name": "Topman",
            "order": 745
        },
        {
            "name": "Topshop",
            "order": 746
        },
        {
            "name": "Tory Burch",
            "order": 747
        },
        {
            "name": "Toteme",
            "order": 748
        },
        {
            "name": "Trapstar",
            "order": 749
        },
        {
            "name": "Trespass",
            "order": 750
        },
        {
            "name": "Triangl",
            "order": 751
        },
        {
            "name": "Tricker’s",
            "order": 752
        },
        {
            "name": "Triumph",
            "order": 753
        },
        {
            "name": "True Religion",
            "order": 754
        },
        {
            "name": "Trussardi",
            "order": 755
        },
        {
            "name": "Tu Clothing",
            "order": 756
        },
        {
            "name": "Turnbull & Asser",
            "order": 757
        },
        {
            "name": "TYR",
            "order": 758
        },
        {
            "name": "UGG",
            "order": 759
        },
        {
            "name": "Ulla Johnson",
            "order": 760
        },
        {
            "name": "Under Armour",
            "order": 761
        },
        {
            "name": "Undercover",
            "order": 762
        },
        {
            "name": "Uniqlo",
            "order": 763
        },
        {
            "name": "Uniqlo U",
            "order": 764
        },
        {
            "name": "United Colors of Benetton",
            "order": 765
        },
        {
            "name": "Urban Outfitters",
            "order": 766
        },
        {
            "name": "Valentino",
            "order": 767
        },
        {
            "name": "Valentino Garavani",
            "order": 768
        },
        {
            "name": "Valextra",
            "order": 769
        },
        {
            "name": "Van Cleef & Arpels",
            "order": 770
        },
        {
            "name": "Vans",
            "order": 771
        },
        {
            "name": "Vaquera",
            "order": 772
        },
        {
            "name": "Varley",
            "order": 773
        },
        {
            "name": "Veja",
            "order": 774
        },
        {
            "name": "Vero Moda",
            "order": 775
        },
        {
            "name": "Veronica Beard",
            "order": 776
        },
        {
            "name": "Versace",
            "order": 777
        },
        {
            "name": "Vetements",
            "order": 778
        },
        {
            "name": "Victoria Beckham",
            "order": 779
        },
        {
            "name": "Victoria’s Secret",
            "order": 780
        },
        {
            "name": "Victoria’s Secret PINK",
            "order": 781
        },
        {
            "name": "Vila",
            "order": 782
        },
        {
            "name": "Vilebrequin",
            "order": 783
        },
        {
            "name": "Vince",
            "order": 784
        },
        {
            "name": "Vince Camuto",
            "order": 785
        },
        {
            "name": "Vivienne Westwood",
            "order": 786
        },
        {
            "name": "Volcom",
            "order": 787
        },
        {
            "name": "Vuori",
            "order": 788
        },
        {
            "name": "Wacoal",
            "order": 789
        },
        {
            "name": "Wales Bonner",
            "order": 790
        },
        {
            "name": "Wallis",
            "order": 791
        },
        {
            "name": "Warehouse",
            "order": 792
        },
        {
            "name": "Weekday",
            "order": 793
        },
        {
            "name": "Weekend Max Mara",
            "order": 794
        },
        {
            "name": "Whistles",
            "order": 795
        },
        {
            "name": "White Fox Boutique",
            "order": 796
        },
        {
            "name": "White Stuff",
            "order": 797
        },
        {
            "name": "Wilfred",
            "order": 798
        },
        {
            "name": "Women’s Best",
            "order": 799
        },
        {
            "name": "Women’secret",
            "order": 800
        },
        {
            "name": "Woolrich",
            "order": 801
        },
        {
            "name": "Wrangler",
            "order": 802
        },
        {
            "name": "WTAPS",
            "order": 803
        },
        {
            "name": "Y-3",
            "order": 804
        },
        {
            "name": "Y/Project",
            "order": 805
        },
        {
            "name": "Yohji Yamamoto",
            "order": 806
        },
        {
            "name": "Yours Clothing",
            "order": 807
        },
        {
            "name": "Yuhan Wang",
            "order": 808
        },
        {
            "name": "Yumi",
            "order": 809
        },
        {
            "name": "Yuzefi",
            "order": 810
        },
        {
            "name": "Zadig & Voltaire",
            "order": 811
        },
        {
            "name": "Zankov",
            "order": 812
        },
        {
            "name": "Zara",
            "order": 813
        },
        {
            "name": "Zara Baby",
            "order": 814
        },
        {
            "name": "Zara Kids",
            "order": 815
        },
        {
            "name": "Zara Man",
            "order": 816
        },
        {
            "name": "Zegna",
            "order": 817
        },
        {
            "name": "Zegna Sport",
            "order": 818
        },
        {
            "name": "Zimmermann",
            "order": 819
        },
        {
            "name": "Zuhair Murad",
            "order": 820
        },
        {
            "name": "Unbranded",
            "order": 821
        },
        {
            "name": "Unknown Brand",
            "order": 822
        },
        {
            "name": "Other",
            "order": 823
        }
    ]

    const materials = await prisma.material.createMany({
        data: material,
        skipDuplicates: true
    });

    const brandsCreated = await prisma.brand.createMany({
        data: brands,
        skipDuplicates: true
    });

    console.log(materials.count, "materials created");
    console.log(brandsCreated.count, "brand created");
}