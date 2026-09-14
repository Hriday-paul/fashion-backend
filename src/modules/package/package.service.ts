// import { Package } from "../../../generated/prisma/client";
import prisma from "../../shared/prisma";

const createPackage = async (payload: any) => {
    // const res = await prisma.package.create({ data: payload });
    return ;
}

const UpdatePackage = async (packId: string, payload: Partial<any>) => {

    const { isDeleted, ...moreFields } = payload;

    // const res = await prisma.package.update({
    //     where: { id: packId },
    //     data: moreFields
    // });
    return ;
}
const DeletePackage = async (packId: string) => {

    // const res = await prisma.package.update({
    //     where: { id: packId },
    //     data: { isDeleted: true }
    // });
    return ;
}

const allPackages = async () => {
    // const res = await prisma.package.findMany({ where: { isDeleted: false } });
    return ;
}

export const packageService = {
    createPackage,
    allPackages,
    UpdatePackage,
    DeletePackage
}