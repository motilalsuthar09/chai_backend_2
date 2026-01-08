import { asyncHandler } from '../utils/asyncHandler.js'
import { ApiError } from '../utils/apiError.js'
import { User } from '../models/user.model.js'
import { uploadOnCloudinary } from '../utils/cloudinary.js'
import { ApiResponse } from '../utils/ApiResponce.js'

const registerUser = asyncHandler(async (req, res) => {
  /*
  get data
  validate data
  check if user exits :username or email
  check for image and avatar
  if image then upload data from server to cloudinary ,check for successfull uploadation
  create user object - create entry in db
  submit data to mongo db
  remove pass and refresh token field from response
  check for user creation
  return response
  */

  const { fullname, username, email, password } = req.body
  console.log("email", email, password)

  const existedUser = User.findOne({
    $or: [{ username }, { email }]
  })

  if (existedUser) {
    throw new ApiError(409, "user with email or username already exits")
  }

  const avatarLocalpath = req.files?.avatar[0]?.path
  const coverImageLocalpath1 = req.files?.coverImage[0]?.path

  if (!avatarLocalpath) {
    throw new ApiError(400, "avatar file is required")
  }

  const avatar = await uploadOnCloudinary(avatarLocalpath)
  const coverImage1 = await uploadOnCloudinary(coverImageLocalpath1)

  if (!avatar) {
    throw new ApiError(400, "avatar file is required")
  }

  const user = await User.create({
    fullname,
    avatar: avatar.url,
    username: username.toLowerCase,
    coverImage: coverImage1?.url || "",
    email,
    password
  })

  // type-1 : cause one database request
  // const createdUser = await User.findById(user._id).select(
  //   "-password -refreshToken"
  // )

  // type-2 no extra db request
  // convert to plain object
  const createdUser = user.toObject()
  delete createdUser.password
  delete createdUser.refreshToken

  if (!createdUser) {
    throw new ApiError(500, "something went wrong while registering the user")
  }

  return res.status(201).json(
    new ApiResponse(200, createdUser, "user registered successfully")
  )

  // either we can do validation by these ways or we can use express js middleware express-validator

  // one way
  // if (fullname === "" || username === "" || email.trim() === "" || password.trim() === "") {
  //   throw new ApiError(400, "all fileds are required")
  // }

  // another way
  // if (
  //   [fullname, email, username, password].some((field) => field?.trim() === "")
  // ) {
  //   throw new ApiError(400, "all fields are required")
  // }
})

export { registerUser }