"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserModel = exports.RoleEnum = exports.GenderEnum = void 0;
const mongoose_1 = require("mongoose");
var GenderEnum;
(function (GenderEnum) {
    GenderEnum["male"] = "male";
    GenderEnum["female"] = "female";
})(GenderEnum || (exports.GenderEnum = GenderEnum = {}));
var RoleEnum;
(function (RoleEnum) {
    RoleEnum["user"] = "user";
    RoleEnum["admin"] = "admin";
})(RoleEnum || (exports.RoleEnum = RoleEnum = {}));
const userSchema = new mongoose_1.Schema({
    firstName: { type: String, required: true, minLength: 2, maxLength: 25, trim: true },
    lastName: { type: String, required: true, minLength: 2, maxLength: 25, trim: true },
    email: { type: String, required: true, trim: true, unique: true },
    phoneNumber: { type: String, required: true },
    gender: { type: String, enum: GenderEnum, required: true },
    address: { type: String },
    password: { type: String, required: true },
    confirmEmailOtp: { type: String },
    confirmedAt: { type: Date },
    resetPasswordOtp: { type: String },
    changeCredentialTime: { type: Date },
    role: { type: String, enum: RoleEnum, default: RoleEnum.user },
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});
userSchema.virtual("username").set(function (value) {
    const [firstName, lastName] = value.split(" ") || [];
    this.set({ firstName, lastName });
}).get(function () {
    return this.firstName + " " + this.lastName;
});
exports.UserModel = mongoose_1.models.User || (0, mongoose_1.model)("User", userSchema);
