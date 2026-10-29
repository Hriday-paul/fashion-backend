-- CreateTable
CREATE TABLE "charitable_organizations" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "legalName" TEXT NOT NULL,
    "registrationNumber" TEXT,
    "registrationCountry" TEXT NOT NULL,
    "registeredAddress" TEXT,
    "authorizedPersonName" TEXT NOT NULL,
    "authorizedPersonRole" TEXT NOT NULL,
    "registrationDocumentKey" TEXT,
    "authorizationDocumentKey" TEXT,

    CONSTRAINT "charitable_organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "charity_shops" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "shopName" TEXT NOT NULL,
    "operatorType" TEXT NOT NULL,
    "legalBusinessName" TEXT,
    "businessRegistrationNumber" TEXT,
    "registrationCountry" TEXT,
    "charityRegistrationNumber" TEXT,
    "charityRelationship" TEXT,
    "authorizationDocumentKey" TEXT,
    "registrationDocumentKey" TEXT,

    CONSTRAINT "charity_shops_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "eco_friendly_stores" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "storeName" TEXT NOT NULL,
    "legalBusinessName" TEXT,
    "businessRegistrationNumber" TEXT,
    "registrationCountry" TEXT,
    "sustainabilityDescription" TEXT NOT NULL,
    "certificationName" TEXT,
    "certificationIssuer" TEXT,
    "certificationNumber" TEXT,
    "certificationDocumentKey" TEXT,

    CONSTRAINT "eco_friendly_stores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "celebrities" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "legalName" TEXT NOT NULL,
    "publicName" TEXT NOT NULL,
    "profession" TEXT,
    "officialWebsite" TEXT,
    "officialProfileUrls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "identityDocumentKey" TEXT,
    "publicIdentityEvidenceKey" TEXT,

    CONSTRAINT "celebrities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ambassadors" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "ambassadorType" TEXT NOT NULL,
    "representedBrand" TEXT,
    "representedOrganization" TEXT,
    "authorizationDocumentKey" TEXT,
    "agreementVersion" TEXT,
    "agreementAcceptedAt" TIMESTAMP(3),

    CONSTRAINT "ambassadors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "professional_sellers" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "legalBusinessName" TEXT NOT NULL,
    "tradingName" TEXT,
    "businessType" TEXT NOT NULL,
    "businessRegistrationNumber" TEXT,
    "registrationCountry" TEXT NOT NULL,
    "registeredAddress" TEXT,
    "registrationDocumentKey" TEXT,
    "taxIdentificationNumber" TEXT,

    CONSTRAINT "professional_sellers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "charitable_organizations_userId_key" ON "charitable_organizations"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "charity_shops_userId_key" ON "charity_shops"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "eco_friendly_stores_userId_key" ON "eco_friendly_stores"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "celebrities_userId_key" ON "celebrities"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ambassadors_userId_key" ON "ambassadors"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "professional_sellers_userId_key" ON "professional_sellers"("userId");

-- AddForeignKey
ALTER TABLE "charitable_organizations" ADD CONSTRAINT "charitable_organizations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "charity_shops" ADD CONSTRAINT "charity_shops_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eco_friendly_stores" ADD CONSTRAINT "eco_friendly_stores_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "celebrities" ADD CONSTRAINT "celebrities_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ambassadors" ADD CONSTRAINT "ambassadors_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "professional_sellers" ADD CONSTRAINT "professional_sellers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
