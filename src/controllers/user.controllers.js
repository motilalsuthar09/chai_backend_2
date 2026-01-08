import { asyncHandler } from '../utils/asyncHandler.js'
import { ApiError } from '../utils/apiError.js'
import { User } from '../models/user.model.js'
import { uploadOnCloudinary } from '../utils/cloudinary.js'
import { ApiResponse } from '../utils/ApiResponce.js'

const registerUser = asyncHandler(async (req, res, next) => {
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
  // console.log("email", email, password)
  // console.log(req.files.coverImage[0]);
  // console.log(req.files.avatar[0]);
  // console.log('req.body:-',req.body);
  
  const existedUser = await User.findOne({
    $or: [{ username }, { email }]
  })

  if (existedUser) {
    throw new ApiError(409, "user with email or username already exits")
  }

  const avatarLocalpath = req.files?.avatar[0]?.path
  // const coverImageLocalpath = req.files?.coverImage[0]?.path; 
  // upper line works when coverimage is uploaded but will not works when coverimage is not uploaded

  let coverImageLocalpath;
  if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
    coverImageLocalpath = req.files.coverImage[0].path;
  }
  // console.log('req.files:',req.files);
  

  if (!avatarLocalpath) {
    throw new ApiError(400, "avatar file is required")
  }

  const avatar = await uploadOnCloudinary(avatarLocalpath)
  const coverImage1 = await uploadOnCloudinary(coverImageLocalpath)

  if (!avatar) {
    throw new ApiError(400, "avatar file is required")
  }

  const user = await User.create({
    fullname,
    avatar: avatar.url,
    username: username.toLowerCase(),
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

  /* alternative
    const user = new User({
    fullname,
    avatar: avatar.url,
    username: username.toLowerCase(),
    coverImage: coverImage1?.url || "",
    email,
    password
  })
  
  await user.save()
  user.password = undefined
  user.refreshToken = undefined
  */



  if (!createdUser) {
    throw new ApiError(500, "something went wrong while registering the user")
  }

  // console.log(createdUser)
  return res.status(201).json(
    new ApiResponse(201, createdUser, "user registered successfully")
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