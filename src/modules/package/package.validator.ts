import { check } from "express-validator";

export const addPackageValidator = [
    check('name').trim().not().isEmpty().withMessage('name is required'),
    check('duration').not().isEmpty().withMessage('duration is required').isInt({min : 0}).withMessage("duration must be numaric").toInt(),
    check('price').not().isEmpty().withMessage('price is required').isInt({min : 0}).withMessage("price must be numaric").toInt(),
    check('add_count').not().isEmpty().withMessage('add_count is required').isInt({min : 0}).withMessage("add_count must be numaric").toInt(),
    check('bumpup_count').not().isEmpty().withMessage('bumpup_count is required').isInt({min : 0}).withMessage("bumpup_count must be numaric").toInt(),
    check('feature_count').not().isEmpty().withMessage('feature_count is required').isInt({min : 0}).withMessage("feature_count must be numaric").toInt(),
]