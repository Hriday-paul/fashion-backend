import { PrismaClient } from "@prisma/client";


export async function CategorySeed(prisma: PrismaClient) {

    const categories = [
        {
            "id": "41d8b967-f722-4e78-89f9-45f07e21d433",
            "name": "Men",
            "parentId": null
        },
        {
            "id": "7ef186f7-98bf-4af0-a5de-c71647b891eb",
            "name": "Clothing",
            "parentId": "41d8b967-f722-4e78-89f9-45f07e21d433"
        },
        {
            "id": "8be7363c-255b-43a8-93a8-956583958592",
            "name": "Women",
            "parentId": null
        },
        {
            "id": "1d487cfe-ed2c-4115-a9ea-0f207f769bd2",
            "name": "Clothing",
            "parentId": "8be7363c-255b-43a8-93a8-956583958592"
        },
        {
            "id": "d0ad388a-39f9-458c-84e1-b221ef991183",
            "name": "Kids & Babies",
            "parentId": null
        },
        {
            "id": "933ae067-ece7-406e-b58f-f8af602f123b",
            "name": "Shoes",
            "parentId": "d0ad388a-39f9-458c-84e1-b221ef991183"
        },
        {
            "id": "7701d798-834c-4bf7-9407-5c0cdf07752a",
            "name": "Shoes",
            "parentId": "8be7363c-255b-43a8-93a8-956583958592"
        },
        {
            "id": "56c2eb4e-e9c9-475f-aa08-566ee1bc1d81",
            "name": "Shoes",
            "parentId": "41d8b967-f722-4e78-89f9-45f07e21d433"
        },
        {
            "id": "06483a85-93cf-4648-8b43-80e2579ac82a",
            "name": "Trainers & sneakers",
            "parentId": "7701d798-834c-4bf7-9407-5c0cdf07752a"
        },
        {
            "id": "8b92ec82-0b79-450c-9790-9ca43a10f9fb",
            "name": "Boots",
            "parentId": "7701d798-834c-4bf7-9407-5c0cdf07752a"
        },
        {
            "id": "8a9fa695-778e-4ce2-bc65-27b60ecc03a7",
            "name": "Heels",
            "parentId": "7701d798-834c-4bf7-9407-5c0cdf07752a"
        },
        {
            "id": "ce9a5a58-89ec-4539-bbf1-e361d9d8df3c",
            "name": "Sandals",
            "parentId": "7701d798-834c-4bf7-9407-5c0cdf07752a"
        },
        {
            "id": "d5a1eb35-3151-4da4-94e1-b2aee12815db",
            "name": "Flats & loafers",
            "parentId": "7701d798-834c-4bf7-9407-5c0cdf07752a"
        },
        {
            "id": "f46ccb7e-22ef-4a6a-bb55-6ab39265b3fd",
            "name": "Slippers",
            "parentId": "7701d798-834c-4bf7-9407-5c0cdf07752a"
        },
        {
            "id": "d6bc1bf3-403b-4fa3-acaf-290de0ae582e",
            "name": "Wedges / espadrilles",
            "parentId": "7701d798-834c-4bf7-9407-5c0cdf07752a"
        },
        {
            "id": "0d4faec7-6762-4675-8854-135b4d5a38b7",
            "name": "Underwear, Swim & Sports",
            "parentId": "1d487cfe-ed2c-4115-a9ea-0f207f769bd2"
        },
        {
            "id": "7a82e002-41ea-48b5-89f6-795e4b439274",
            "name": "Tops & Outerwear (Non-suit)",
            "parentId": "7ef186f7-98bf-4af0-a5de-c71647b891eb"
        },
        {
            "id": "a7dcd9c7-cfbb-47ee-994a-abad97e2c273",
            "name": "T-shirts",
            "parentId": "7a82e002-41ea-48b5-89f6-795e4b439274"
        },
        {
            "id": "64a3d4a2-65e8-4487-8915-0fdeaec0b957",
            "name": "Polo shirts",
            "parentId": "7a82e002-41ea-48b5-89f6-795e4b439274"
        },
        {
            "id": "556299d3-c90c-4638-8078-bdb537167b77",
            "name": "Casual shirts",
            "parentId": "7a82e002-41ea-48b5-89f6-795e4b439274"
        },
        {
            "id": "23fb07e3-a451-4fde-8cfc-fa4db45fbfd3",
            "name": "Jumpers & sweaters",
            "parentId": "7a82e002-41ea-48b5-89f6-795e4b439274"
        },
        {
            "id": "6a7a8031-0ab2-4a21-96b6-a23b8ac0cb59",
            "name": "Cardigans",
            "parentId": "7a82e002-41ea-48b5-89f6-795e4b439274"
        },
        {
            "id": "ecf8a70b-8cae-4860-a1f3-4c2d4654b55a",
            "name": "Hoodies & sweatshirts",
            "parentId": "7a82e002-41ea-48b5-89f6-795e4b439274"
        },
        {
            "id": "a25613fb-1f53-4d82-991d-4df7f81d6d7e",
            "name": "Casual jackets (denim, bomber, lightweight)",
            "parentId": "7a82e002-41ea-48b5-89f6-795e4b439274"
        },
        {
            "id": "21af6e7f-76ca-4bfd-9770-33a54eb308e8",
            "name": "Casual coats (parkas, puffers, raincoats)",
            "parentId": "7a82e002-41ea-48b5-89f6-795e4b439274"
        },
        {
            "id": "6dc1a35f-d25b-473c-9a3a-eda4c91e6941",
            "name": "Joggers / track bottoms",
            "parentId": "7a82e002-41ea-48b5-89f6-795e4b439274"
        },
        {
            "id": "e8939402-17b5-4978-8955-f81624a8cc5f",
            "name": "Casual shorts",
            "parentId": "7a82e002-41ea-48b5-89f6-795e4b439274"
        },
        {
            "id": "2ecd150a-ace1-4096-bede-d792fa6f7a01",
            "name": "Loungewear & pyjamas",
            "parentId": "7a82e002-41ea-48b5-89f6-795e4b439274"
        },
        {
            "id": "6df402ee-0f01-4cbe-b7c0-3234832fca8e",
            "name": "Sports tops & shorts",
            "parentId": "7a82e002-41ea-48b5-89f6-795e4b439274"
        },
        {
            "id": "199fb83c-351b-4a25-b69d-04fefff4cc50",
            "name": "Formal / Dress Shirts",
            "parentId": "7ef186f7-98bf-4af0-a5de-c71647b891eb"
        },
        {
            "id": "9ffaac2f-53dc-4f49-9586-c30f68f73731",
            "name": "Blazers & Suit Jackets",
            "parentId": "7ef186f7-98bf-4af0-a5de-c71647b891eb"
        },
        {
            "id": "8a64c262-92d0-440a-be14-036ec86f73c8",
            "name": "Jeans",
            "parentId": "7ef186f7-98bf-4af0-a5de-c71647b891eb"
        },
        {
            "id": "b7e93257-6c6a-451d-b870-c633484adee9",
            "name": "Casual Trousers / Chinos",
            "parentId": "7ef186f7-98bf-4af0-a5de-c71647b891eb"
        },
        {
            "id": "ffa49d9d-6591-4bb6-95fc-b423e78f41a3",
            "name": "Suit Trousers / Formal Trousers",
            "parentId": "7ef186f7-98bf-4af0-a5de-c71647b891eb"
        },
        {
            "id": "16b34b3a-151e-42e7-9a4d-9efd19a1539f",
            "name": "Underwear, Swim & Sports",
            "parentId": "7ef186f7-98bf-4af0-a5de-c71647b891eb"
        },
        {
            "id": "f2769c59-7d05-4a15-8c55-340abd753052",
            "name": "Underpants / boxers / briefs",
            "parentId": "16b34b3a-151e-42e7-9a4d-9efd19a1539f"
        },
        {
            "id": "072bdeee-069e-423a-b404-b3d976474d1c",
            "name": "Vests / undershirts",
            "parentId": "16b34b3a-151e-42e7-9a4d-9efd19a1539f"
        },
        {
            "id": "fd2c57c4-3ae6-4a22-b558-6a54d9c70fc0",
            "name": "Swim shorts / trunks",
            "parentId": "16b34b3a-151e-42e7-9a4d-9efd19a1539f"
        },
        {
            "id": "5e6039e1-9288-481c-b529-91052ab98c33",
            "name": "Base layers / sports leggings",
            "parentId": "16b34b3a-151e-42e7-9a4d-9efd19a1539f"
        },
        {
            "id": "b36c260b-59da-4bce-9159-a1f1d2719cf7",
            "name": "Trainers & sneakers",
            "parentId": "56c2eb4e-e9c9-475f-aa08-566ee1bc1d81"
        },
        {
            "id": "9d4cafcf-0362-4925-8580-08fcbdbad74a",
            "name": "Boots",
            "parentId": "56c2eb4e-e9c9-475f-aa08-566ee1bc1d81"
        },
        {
            "id": "bc118dc5-6048-490d-beb5-8dc652800b98",
            "name": "Smart shoes",
            "parentId": "56c2eb4e-e9c9-475f-aa08-566ee1bc1d81"
        },
        {
            "id": "d0acbe1b-9fab-4dfc-8001-01edc2391911",
            "name": "Loafers",
            "parentId": "56c2eb4e-e9c9-475f-aa08-566ee1bc1d81"
        },
        {
            "id": "2bfe00bf-e199-42b4-a4d8-235de341209c",
            "name": "Sandals",
            "parentId": "56c2eb4e-e9c9-475f-aa08-566ee1bc1d81"
        },
        {
            "id": "1c2422fd-a710-4093-98a3-6d3964e9bc15",
            "name": "Slippers",
            "parentId": "56c2eb4e-e9c9-475f-aa08-566ee1bc1d81"
        },
        {
            "id": "38dcc432-ea86-401b-905d-bc3df8fca867",
            "name": "General Clothing (Tops, Dresses, Skirts, Tailored Trousers)",
            "parentId": "1d487cfe-ed2c-4115-a9ea-0f207f769bd2"
        },
        {
            "id": "8cf66eda-7f15-488a-bd6e-9f701bc9ca1f",
            "name": "Blazers & Suit Jackets",
            "parentId": "1d487cfe-ed2c-4115-a9ea-0f207f769bd2"
        },
        {
            "id": "02543d80-e296-4da3-b761-fa21cf67bb9b",
            "name": "Jeans",
            "parentId": "1d487cfe-ed2c-4115-a9ea-0f207f769bd2"
        },
        {
            "id": "a937a19d-4200-4d14-aaea-c75165cd882f",
            "name": "Tailored / Suit Trousers",
            "parentId": "1d487cfe-ed2c-4115-a9ea-0f207f769bd2"
        },
        {
            "id": "226d342a-03d3-4486-b08d-d210fa233761",
            "name": "T-shirts & basic tops",
            "parentId": "38dcc432-ea86-401b-905d-bc3df8fca867"
        },
        {
            "id": "59eecd4b-71e9-49e7-95fc-536f61e57651",
            "name": "Shirts & blouses",
            "parentId": "38dcc432-ea86-401b-905d-bc3df8fca867"
        },
        {
            "id": "3875ee1a-610a-485a-9e35-dbacf737091a",
            "name": "Jumpers & sweaters",
            "parentId": "38dcc432-ea86-401b-905d-bc3df8fca867"
        },
        {
            "id": "60f541bc-9f23-4ef6-8e6c-fa87c07394dc",
            "name": "Cardigans",
            "parentId": "38dcc432-ea86-401b-905d-bc3df8fca867"
        },
        {
            "id": "5d859afe-b6e9-4e31-9b52-2e485268f7dd",
            "name": "Hoodies & sweatshirts",
            "parentId": "38dcc432-ea86-401b-905d-bc3df8fca867"
        },
        {
            "id": "2646db9b-345d-4132-ad85-4b9c9ea946d2",
            "name": "Dresses (all types)",
            "parentId": "38dcc432-ea86-401b-905d-bc3df8fca867"
        },
        {
            "id": "868314a7-83d2-43cc-9678-9b432bc00704",
            "name": "Jumpsuits & playsuits",
            "parentId": "38dcc432-ea86-401b-905d-bc3df8fca867"
        },
        {
            "id": "4a77de90-ebc2-4d40-a758-2756af89325f",
            "name": "Skirts",
            "parentId": "38dcc432-ea86-401b-905d-bc3df8fca867"
        },
        {
            "id": "4543e56b-b43a-4fc5-b6fd-341ed5c4febe",
            "name": "Tailored trousers (non-jeans)",
            "parentId": "38dcc432-ea86-401b-905d-bc3df8fca867"
        },
        {
            "id": "f82bbfd1-1a6b-4d19-99b8-04ef92b4ca35",
            "name": "Smart shorts",
            "parentId": "38dcc432-ea86-401b-905d-bc3df8fca867"
        },
        {
            "id": "9cda1ed8-b1ec-4031-b772-c134b951e840",
            "name": "Sports tops & leggings",
            "parentId": "38dcc432-ea86-401b-905d-bc3df8fca867"
        },
        {
            "id": "09157327-5d94-4935-b025-1dda79507574",
            "name": "Loungewear & pyjamas",
            "parentId": "38dcc432-ea86-401b-905d-bc3df8fca867"
        },
        {
            "id": "1c66773c-768b-4379-affd-eee5522ac63f",
            "name": "Bras & bralettes (v1 simple)",
            "parentId": "0d4faec7-6762-4675-8854-135b4d5a38b7"
        },
        {
            "id": "b247c0d8-49af-4e2a-865b-be7cdc243259",
            "name": "Briefs, thongs, knickers",
            "parentId": "0d4faec7-6762-4675-8854-135b4d5a38b7"
        },
        {
            "id": "1ae24688-42b3-43c9-843f-6b2463802871",
            "name": "Bodysuits",
            "parentId": "0d4faec7-6762-4675-8854-135b4d5a38b7"
        },
        {
            "id": "e179df94-3183-40d2-a318-51f1cb4817a8",
            "name": "Shapewear",
            "parentId": "0d4faec7-6762-4675-8854-135b4d5a38b7"
        },
        {
            "id": "8d93a5a7-8ff7-4878-a030-7dffb0e4cc87",
            "name": "Sports bras",
            "parentId": "0d4faec7-6762-4675-8854-135b4d5a38b7"
        },
        {
            "id": "cf292c2c-cee6-41c6-ab7d-1e3ffc8e575e",
            "name": "Sports leggings",
            "parentId": "0d4faec7-6762-4675-8854-135b4d5a38b7"
        },
        {
            "id": "a824d175-840d-4b41-8b18-63d385999fe4",
            "name": "Swimwear (bikinis, swimsuits, beachwear)",
            "parentId": "0d4faec7-6762-4675-8854-135b4d5a38b7"
        },
        {
            "id": "91a2daca-106e-488f-8694-bab4c9a36c97",
            "name": "Loungewear & pyjamas",
            "parentId": "0d4faec7-6762-4675-8854-135b4d5a38b7"
        },
        {
            "id": "bd301d0e-d966-4ab6-a72f-f5691eee4f22",
            "name": "Clothing",
            "parentId": "d0ad388a-39f9-458c-84e1-b221ef991183"
        },
        {
            "id": "71b44271-0294-4e65-ab14-4a7af4950658",
            "name": "Babies (0–24 months)",
            "parentId": "bd301d0e-d966-4ab6-a72f-f5691eee4f22"
        },
        {
            "id": "833d1ab2-b9c5-4c13-a965-ade18ee7b3ea",
            "name": "Kids (2–16 years)",
            "parentId": "bd301d0e-d966-4ab6-a72f-f5691eee4f22"
        },
        {
            "id": "122a4099-0e11-467a-bae3-ce6676af988b",
            "name": "Bodysuits / onesies",
            "parentId": "71b44271-0294-4e65-ab14-4a7af4950658"
        },
        {
            "id": "6cebf338-23df-4709-be71-1ef72caa1e95",
            "name": "Sleepsuits / rompers",
            "parentId": "71b44271-0294-4e65-ab14-4a7af4950658"
        },
        {
            "id": "7fa33f98-ac30-4bca-a9cd-998f4e68805a",
            "name": "Tops & T-shirts",
            "parentId": "71b44271-0294-4e65-ab14-4a7af4950658"
        },
        {
            "id": "7fd3f4a0-d3d8-468b-acba-cafa4eca94a7",
            "name": "Knitwear & cardigans",
            "parentId": "71b44271-0294-4e65-ab14-4a7af4950658"
        },
        {
            "id": "2b52d342-9ecd-404f-a8ed-4816df4e9370",
            "name": "Trousers / leggings",
            "parentId": "71b44271-0294-4e65-ab14-4a7af4950658"
        },
        {
            "id": "1a726a13-6d6c-4f94-a113-15336e2fb95f",
            "name": "Dungarees & overalls",
            "parentId": "71b44271-0294-4e65-ab14-4a7af4950658"
        },
        {
            "id": "28883268-27cd-42e6-9853-abe995de1f72",
            "name": "Shorts",
            "parentId": "71b44271-0294-4e65-ab14-4a7af4950658"
        },
        {
            "id": "ab81d683-307b-40ca-a027-437ad53179fe",
            "name": "Dresses & skirts",
            "parentId": "71b44271-0294-4e65-ab14-4a7af4950658"
        },
        {
            "id": "6b7853fe-5e66-4dd3-956d-a8262d828efc",
            "name": "Jackets & snowsuits",
            "parentId": "71b44271-0294-4e65-ab14-4a7af4950658"
        },
        {
            "id": "1ad6320b-3185-4017-ba09-39edaa568581",
            "name": "Sets & outfits",
            "parentId": "71b44271-0294-4e65-ab14-4a7af4950658"
        },
        {
            "id": "6d701ba8-cab8-4ec5-83e8-f31c8547fc1e",
            "name": "Pyjamas & nightwear",
            "parentId": "71b44271-0294-4e65-ab14-4a7af4950658"
        },
        {
            "id": "ff97e014-5905-4137-9e2e-7b76514a1a9b",
            "name": "Swimwear",
            "parentId": "71b44271-0294-4e65-ab14-4a7af4950658"
        },
        {
            "id": "b02060e4-0cf8-4bc4-8218-5a8210b046ef",
            "name": "Tops & T-shirts",
            "parentId": "833d1ab2-b9c5-4c13-a965-ade18ee7b3ea"
        },
        {
            "id": "3b4d63d1-b8cf-4aef-adbc-cf9bd0eb01f5",
            "name": "Shirts & blouses",
            "parentId": "833d1ab2-b9c5-4c13-a965-ade18ee7b3ea"
        },
        {
            "id": "ddea4f41-2a61-44d2-b477-8d95155e4113",
            "name": "Jumpers & knitwear",
            "parentId": "833d1ab2-b9c5-4c13-a965-ade18ee7b3ea"
        },
        {
            "id": "777641e3-8850-4d4c-99b0-39cabe64f3f6",
            "name": "Hoodies & sweatshirts",
            "parentId": "833d1ab2-b9c5-4c13-a965-ade18ee7b3ea"
        },
        {
            "id": "614c3154-8dd6-46d9-b0f1-9d6a13b8756e",
            "name": "Cardigans",
            "parentId": "833d1ab2-b9c5-4c13-a965-ade18ee7b3ea"
        },
        {
            "id": "13a52b7d-0a6a-4975-8458-f6eab606bd10",
            "name": "Dresses",
            "parentId": "833d1ab2-b9c5-4c13-a965-ade18ee7b3ea"
        },
        {
            "id": "7483f515-ad0f-4dc6-8029-2a5e7f1dbc9b",
            "name": "Skirts",
            "parentId": "833d1ab2-b9c5-4c13-a965-ade18ee7b3ea"
        },
        {
            "id": "43b26f0f-92b8-420a-907f-e8f7d9d8c42b",
            "name": "Jeans",
            "parentId": "833d1ab2-b9c5-4c13-a965-ade18ee7b3ea"
        },
        {
            "id": "e224690a-81be-4e0f-ba4b-a765bf983f0c",
            "name": "Trousers & chinos",
            "parentId": "833d1ab2-b9c5-4c13-a965-ade18ee7b3ea"
        },
        {
            "id": "529842ea-7955-47e4-995c-185fcfd65697",
            "name": "Leggings",
            "parentId": "833d1ab2-b9c5-4c13-a965-ade18ee7b3ea"
        },
        {
            "id": "c4abcfe4-8a94-4c40-8d81-adc924ce7f0a",
            "name": "Shorts",
            "parentId": "833d1ab2-b9c5-4c13-a965-ade18ee7b3ea"
        },
        {
            "id": "468b9602-ba96-4bfc-86dc-794462644002",
            "name": "Dungarees & overalls",
            "parentId": "833d1ab2-b9c5-4c13-a965-ade18ee7b3ea"
        },
        {
            "id": "00a71813-ad71-4d70-b3ef-cadeba4fbfce",
            "name": "Tracksuits & joggers",
            "parentId": "833d1ab2-b9c5-4c13-a965-ade18ee7b3ea"
        },
        {
            "id": "8ce474fa-9fd7-4fca-a391-38046d0d714f",
            "name": "Sets & outfits",
            "parentId": "833d1ab2-b9c5-4c13-a965-ade18ee7b3ea"
        },
        {
            "id": "a36ac5c9-eca1-4333-9e15-b9359af3d89c",
            "name": "Jackets & coats",
            "parentId": "833d1ab2-b9c5-4c13-a965-ade18ee7b3ea"
        },
        {
            "id": "50c61160-39d3-4d3f-8eb1-a243ad4832ef",
            "name": "Sportswear",
            "parentId": "833d1ab2-b9c5-4c13-a965-ade18ee7b3ea"
        },
        {
            "id": "fa137cf2-942c-492d-947c-fe30717a0080",
            "name": "Pyjamas & nightwear",
            "parentId": "833d1ab2-b9c5-4c13-a965-ade18ee7b3ea"
        },
        {
            "id": "b044acbd-1f87-4cad-bffd-fe43e6620f82",
            "name": "Swimwear",
            "parentId": "833d1ab2-b9c5-4c13-a965-ade18ee7b3ea"
        },
        {
            "id": "79d87e28-8245-425a-b906-c40f665362dd",
            "name": "Socks & tights",
            "parentId": "833d1ab2-b9c5-4c13-a965-ade18ee7b3ea"
        },
        {
            "id": "e9e5a2ab-3c3c-4069-8da1-197b288d96c5",
            "name": "Trainers",
            "parentId": "933ae067-ece7-406e-b58f-f8af602f123b"
        },
        {
            "id": "bcbc9089-2193-4a07-ace0-1d371b5d954d",
            "name": "School shoes",
            "parentId": "933ae067-ece7-406e-b58f-f8af602f123b"
        },
        {
            "id": "86be352e-a15a-433f-9cda-438c1ba38063",
            "name": "Boots",
            "parentId": "933ae067-ece7-406e-b58f-f8af602f123b"
        },
        {
            "id": "cdc0ca7a-5343-409c-9928-d0af19364c44",
            "name": "Sandals",
            "parentId": "933ae067-ece7-406e-b58f-f8af602f123b"
        },
        {
            "id": "45252721-462b-4e3d-a3a4-bddb9c81d047",
            "name": "Wellies",
            "parentId": "933ae067-ece7-406e-b58f-f8af602f123b"
        },
        {
            "id": "a8e28eb3-970c-4e4e-8817-bc87906cf47b",
            "name": "Slippers",
            "parentId": "933ae067-ece7-406e-b58f-f8af602f123b"
        }
    ]

    const cats = await prisma.category.createMany({
        data: categories,
        skipDuplicates: true
    });

    console.log(cats.count, "categories created");
}