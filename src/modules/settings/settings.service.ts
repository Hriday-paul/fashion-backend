import { Setting } from "../../../generated/prisma/client";
import { SettingKey } from "../../../generated/prisma/enums";
import prisma from "../../shared/prisma";

const singleSettingItem = async (key: SettingKey) => {
    const data = await prisma.setting.findFirst({where : {key}})
    return data ?? {key, value : null}
}

const updateSettingItem = async (payload: Setting) => {
    const { key, value } = payload

    const result = await prisma.setting.upsert({
        where : {key},
        create : {
            key,
            value
        },
        update : {
            key,
            value
        }
    })

    return result
}

export const settingService = {
    singleSettingItem,
    updateSettingItem
}