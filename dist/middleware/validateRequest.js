import { validationResult } from "express-validator";
export const validateRequest = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json({
            error: "Invalid request payload",
            details: errors.array(),
        });
        return;
    }
    next();
};
