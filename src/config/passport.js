const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("../models/user");

passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: "/auth/google/callback"
        },
        async (accessToken, refreshToken, profile, done) => {

            try {

                const email = profile.emails[0].value;

                let user = await User.findOne({ emailId: email });

                if (!user) {

                    user = new User({
                        firstName: profile.name.givenName,
                        lastName: profile.name.familyName,
                        emailId: email,
                        profilePhoto: profile.photos[0].value,
                        password: "Google@@#$%^&*87654321"
                    });

                    await user.save();

                }

                return done(null, user);

            } catch (err) {
                return done(err, null);
            }

        }
    )
);

module.exports = passport;