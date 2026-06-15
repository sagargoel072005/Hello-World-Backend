const mongoose = require("mongoose");
const validator = require("validator");
const jwt = require("jsonwebtoken");

const userSchema = new mongoose.Schema(
    {
        firstName: {
            type: String,
            required: true,
            index: true,
            minLength: 2,
            maxLength: 20,
        },
        lastName: { type: String },
        emailId: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            validate(value) {
                if (!validator.isEmail(value)) throw new Error("Invalid Email Id: " + value);
            },
        },
        password: {
            type: String,
            required: function () { return this.authProvider === "local"; },
            validate(value) {
                if (this.authProvider === "google") return true;
                if (!validator.isStrongPassword(value)) throw new Error("Invalid Password: " + value);
            },
        },
        authProvider: {
            type: String,
            enum: ["local", "google"],
            default: "local",
        },

        // ── Photos ─────────────────────────────
        photoUrl: { type: String, default: "" },
        coverPhotoUrl: { type: String, default: "" },

        // ── Personal ────────────────────────────
        age: { type: Number, min: 18 },
        gender: {
            type: String,
            enum: { values: ["male", "female", "other"], message: "{VALUE} is not a valid gender" },
        },
        phone: { type: String, default: "" },
        about: { type: String, default: "Hello, I am a developer" },
        headline: { type: String, default: "" }, // e.g. "Full-Stack Dev @ Google"

        // ── Job Preferences ─────────────────────
        openToWork: { type: Boolean, default: false },
        jobType: { type: String, default: "" }, // Full-time, Contract, etc.
        expectedSalary: { type: String, default: "" }, // e.g. "12 LPA"
        preferredLanguages: { type: [String], default: [] },

        // ── Work ────────────────────────────────
        company: { type: String, default: "" },
        location: { type: String, default: "" },
        portfolio: { type: String, default: "" },

        // ── Coding Platforms ────────────────────
        githubId: { type: String, default: "" },
        linkedIn: { type: String, default: "" },
        twitterId: { type: String, default: "" },
        leetcodeId: { type: String, default: "" },
        codechefId: { type: String, default: "" },
        codeforcesId: { type: String, default: "" },
        hackerRankId: { type: String, default: "" },
        kaggleId: { type: String, default: "" },
        mediumId: { type: String, default: "" },
        devToId: { type: String, default: "" },
        npmId: { type: String, default: "" },

        // ── Skills ──────────────────────────────
        skills: {
            type: [String],
            validate: {
                validator: (s) => s.length <= 10,
                message: "Maximum 10 skills allowed.",
            },
        },

        // ── Experience ──────────────────────────
        experience: {
            type: [
                {
                    title: { type: String, required: true },
                    company: { type: String, required: true },
                    location: { type: String, default: "" },
                    employmentType: { type: String, default: "" }, // Full-time, Internship …
                    startDate: { type: String, default: "" },
                    endDate: { type: String, default: "" },
                    current: { type: Boolean, default: false },
                    description: { type: String, default: "" },
                },
            ],
            default: [],
            validate: {
                validator: (arr) => arr.length <= 20,
                message: "Maximum 20 experience entries allowed.",
            },
        },
    isPremium: {
      type: Boolean,
      default: false,
    },

    membershipType: {
      type: String,
    },

        // ── Projects ────────────────────────────
        projects: {
            type: [
                {
                    name: { type: String, required: true },
                    url: { type: String, default: "" },
                    description: { type: String, default: "" },
                },
            ],
            default: [],
            validate: {
                validator: (arr) => arr.length <= 10,
                message: "Maximum 10 projects allowed.",
            },
        },

        // ── Certifications ───────────────────────
        certifications: {
            type: [
                {
                    name: { type: String, required: true },
                    issuer: { type: String, default: "" },
                    year: { type: String, default: "" },
                },
            ],
            default: [],
            validate: {
                validator: (arr) => arr.length <= 10,
                message: "Maximum 10 certifications allowed.",
            },
        },

        // ── Academic Qualifications ──────────────
        academicQualifications: {
            tenth: {
                school: { type: String, default: "" },
                board: { type: String, default: "" },
                percentage: { type: Number, min: 0, max: 100 },
            },
            twelfth: {
                school: { type: String, default: "" },
                board: { type: String, default: "" },
                percentage: { type: Number, min: 0, max: 100 },
            },
            ug: {
                college: { type: String, default: "" },
                degree: { type: String, default: "" },
                branch: { type: String, default: "" },
                sgpa: { type: Number, min: 0, max: 10 },
            },
            pg: {
                college: { type: String, default: "" },
                degree: { type: String, default: "" },
                branch: { type: String, default: "" },
                sgpa: { type: Number, min: 0, max: 10 },
            },
        },

        // ── Resume ──────────────────────────────
        resumeUrl: { type: String, default: "" },
        resumePublicId: { type: String, default: "" }, // Cloudinary public_id for deletion

        // ── OAuth (GitHub) ───────────────────────
        githubToken: { type: String },
        githubUsername: { type: String },
        githubProfileUrl: { type: String },
    },
    { timestamps: true }
);

userSchema.index({ fromUserId: 1, toUserId: 1 });

userSchema.methods.getJWT = async function () {
    const token = await jwt.sign({ _id: this._id }, process.env.JWT_TOKEN, {
        expiresIn: "1d",
    });
    return token;
};

const UserModel = mongoose.model("User", userSchema);
module.exports = UserModel;