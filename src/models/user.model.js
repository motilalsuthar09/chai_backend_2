import mongoose from 'mongoose'
const userSchema = new mongoose.Schema({
    username: {
        type: String,
        require: true,
        unique: true,
        lowercase: true,
        trim: true,
        index: true
    },
    email: {
        type: String,
        require: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    fullname: {
        type: String,
        require: true,
        trim: true,
        index: true
    },
    avatar: {
        type: String,
        require: true,
    },
    coverImage: {
        type: string
    },
    watchHistory: [{
        type: Schema.Types.ObjectId,
        ref: "Video"
    }],
    password: {
        type: string,
        required: [true, "password is required"]
    },
    refreshToken: {
        type: string
    }
}, { timestamps: true })

userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) {
        return next()
    }
    this.password = bcrypt.hash(this.password, 10)
    next()
})

userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password)
}

userSchema.methods.generateAccessToken = async function () {
    return await jwt.sign({
        _id: this._id,
        email: this.email,
        username: this.username,
        fullname: this.fullname
    }, process.env.ATS, {
        expiresIn: process.env.ATE
    })
}


userSchema.methods.generateRefreshToken = async function () {
    return await jwt.sign({
        _id: this._id,
    }, process.env.RTS, {
        expiresIn: process.env.RTE
    })
}
export const User = mongoose.model("User", userSchema)