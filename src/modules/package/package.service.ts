import { Package } from "../../../generated/prisma/client";
import prisma from "../../shared/prisma";

const createPackage = async (payload: Package) => {
    const res = await prisma.package.create({ data: payload });
    return res;
}

const UpdatePackage = async (packId: string, payload: Partial<Package>) => {

    const { isDeleted, ...moreFields } = payload;

    const res = await prisma.package.update({
        where: { id: packId },
        data: moreFields
    });
    return res;
}
const DeletePackage = async (packId: string) => {

    const res = await prisma.package.update({
        where: { id: packId },
        data: { isDeleted: true }
    });
    return res;
}

const allPackages = async () => {
    const res = await prisma.package.findMany({ where: { isDeleted: false } });
    return res;
}

export const packageService = {
    createPackage,
    allPackages,
    UpdatePackage,
    DeletePackage
}