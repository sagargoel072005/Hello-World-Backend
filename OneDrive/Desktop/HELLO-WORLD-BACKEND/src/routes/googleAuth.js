const express = require("express");
const passport = require("passport");

const googleAuthRouter = express.Router();

googleAuthRouter.get(
    "/auth/google",
    passport.authenticate("google", { scope: ["profile", "email"] })
);

googleAuthRouter.get(
    "/auth/google/callback",
    passport.authenticate("google", { session: false }),
    async (req, res) => {

        const user = req.user;

        const token = await user.getJWT();

        res.cookie("token", token, {
            expires: new Date(Date.now() + 8 * 3600000)
        });

        res.redirect(process.env.FRONTEND_URL + "/feed");

    }
);

module.exports = googleAuthRouter;