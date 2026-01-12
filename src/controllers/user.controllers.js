import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/apiError.js';
import { User } from '../models/user.model.js';
import { uploadOnCloudinary } from '../utils/cloudinary.js';
import { ApiResponse } from '../utils/ApiResponce.js';
import { trusted } from 'mongoose';
import { response } from 'express';
import jwt from "jsonwebtoken"
import fs from 'fs'
const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId)
    const refreshToken = user.generateRefreshToken()
    const AccessToken = user.generateAccessToken()

    user.refreshToken = refreshToken
    await user.save({ validationBeforeSave: false })

    return { AccessToken, refreshToken }

  } catch (error) {
    throw new ApiError(500, "sonething went wrong whil generating access and refresh token ")
  }
}
const registerUser = asyncHandler(async (req, res, next) => {
  /*
    Steps:
    1. Get data from request body
    2. Validate data
    3. Check if user exists (username or email)
    4. Check for image and avatar
    5. If image then upload data from server to Cloudinary, check for successful upload
    6. Create user object - create entry in DB
    7. Submit data to MongoDB
    8. Remove password and refreshToken field from response
    9. Check for user creation
    10. Return response
  */

  const { fullname, username, email, password } = req.body;

  // Check if user already exists
  const existedUser = await User.findOne({
    $or: [{ username }, { email }]
  });

  if (existedUser) {
    throw new ApiError(409, 'User with email or username already exists');
  }

  // Handle avatar
  const avatarLocalpath = req.files?.avatar?.[0]?.path;

  // Handle cover image safely
  let coverImageLocalpath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalpath = req.files.coverImage[0].path;
  }

  if (!avatarLocalpath) {
    throw new ApiError(400, 'Avatar file is required');
  }

  // Upload to Cloudinary
  const avatar = await uploadOnCloudinary(avatarLocalpath);
  const coverImage1 = await uploadOnCloudinary(coverImageLocalpath);

  if (!avatar) {
    throw new ApiError(400, 'Avatar file is required');
  }

  // Create user
  const user = await User.create({
    fullname,
    avatar: avatar.url,
    username: username.toLowerCase(),
    coverImage: coverImage1?.url || '',
    email,
    password
  });

  // Convert to plain object and remove sensitive fields
  const createdUser = user.toObject();
  delete createdUser.password;
  delete createdUser.refreshToken;

  if (!createdUser) {
    throw new ApiError(500, 'Something went wrong while registering the user');
  }

  // Return response
  return res.status(201).json(
    new ApiResponse(201, createdUser, 'User registered successfully')
  );

  /*
    Alternative validation examples:
    if (fullname === "" || username === "" || email.trim() === "" || password.trim() === "") {
      throw new ApiError(400, "All fields are required");
    }

    if ([fullname, email, username, password].some((field) => field?.trim() === "")) {
      throw new ApiError(400, "All fields are required");
    }
  */

});

const loginUser = asyncHandler(async (req, res) => {
  // email and password from frontend or postman
  //email or username
  //find the user
  // validation password mathces or not or email exits or not
  //genrate access and refresh token
  //send cookie
  //send reponse

  // extra
  // check the referesh token if same then direct login else logins
  // if matches then login else give error 

  const { email, username, password } = req.body

  if (!username && !email) {
    throw new ApiError(400, "username or password required")
  }

  const user = await User.findOne({
    $or: [{ username }, { email }]
  })

  if (!user) {
    throw new ApiError(400, "user does not exist")
  }

  const isPasswordValid = await user.isPasswordCorrect(password)


  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user cardentials")
  }

  const { AccessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);

  // type:1
  // const loggedInUser = await user.findById(user._id).select("-password -refreshToken")

  // tpye-2
  const loggedInUser = user.toObject()
  delete loggedInUser.password
  delete loggedInUser.refreshToken

  const options = {
    httpOnly: true,
    secure: trusted
    // by wrting these two frontend can not medifiy cookie only server can modify cookie ... by default frontend can modify 
  }

  return res
    .status(200)
    .cookie("accessToken", AccessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(200,
        {
          user: loggedInUser, AccessToken, refreshToken
        },
        "User logged in successfully")
    )
})


const LogoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined
      }
    },
    {
      new: true
    }
  )

  const options = {
    httpOnly: true,
    secure: true
  }

  return res.status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User Logged Out"))
})

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unathorized Request");
  }

  try {
    const decodedToken = jwt.verify(incomingRefreshToken, process.env.RTS)

    const user = await User.findById(decodedToken?._id)

    if (!user) {
      throw new ApiError(401, "Invalid Refresh Token");
    }

    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Refresh token is expired or used")
    }

    const options = {
      httpOnly: true,
      secure: true
    }

    const { AccessToken, RefreshToken } = await generateAccessAndRefreshTokens(user._id)


    return res
      .status(200)
      .cookie("accessToken", AccessToken, options)
      .cookie("refreshToken", RefreshToken, options)
      .json(
        new ApiResponse(200,
          { AccessToken, RefreshToken },
          "AccessToken Refreshed Successfully"
        )
      )
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid Refresh Token")
  }
})


const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPass, newPass } = req.body

  const user = await User.findById(req.user?._id)

  const isPasswordCorrectVar = await user.isPasswordCorrect(oldPass)

  if (!isPasswordCorrectVar) {
    throw new ApiError(400, "invalid old password")
  }

  user.password = newPass

  await user.save({ validateBeforeSave: false })

  return res.status(200).json(new ApiResponse(200, {}, "password changes successfully"))
})

const getCurrentUser = asyncHandler(async (req, res) => {
  return res.status(200).json(200, req.user, "current user fetched successfully")
})

const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullname, email } = req.body
  if (!fullname || !email) {
    throw new ApiError(400, "all fields are required")
  }

  const user = await User.findByIdAndUpdate(req.user?._id,
    {
      $set: {
        fullname,
        email: email //both way are correct
      }
    },
    { new: true }
  ).select("-password")

  return res.status(200)
    .json(new ApiResponse(200, user, "account details updated successfully"))
})

const updateUserAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path

  if (!avatarLocalPath) {
    throw new ApiError(400, "avatar file is missing")
  }

  //delete old image 

  fs.unlinkSync(avatarLocalPath)

  const avatar = await uploadOnCloudinary(avatarLocalPath)

  if (!avatar) {
    throw new ApiError(400, "Error while uploading on avatar")
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        avatar: avatar.url
      }
    },
    {
      new: true
    }
  ).select("-password")

  return res.status(200)
    .json(new ApiResponse(200, user, "avatar updated successfully"))
})

const updateUserCoverImage = asyncHandler(async (req, res) => {
  const coverImageLocalPath = req.file?.path

  if (!coverImageLocalPath) {
    throw new ApiError(400, "coverimage file is missing")
  }

  fs.unlinkSync(avatarLocalPath)

  const coverImage = await uploadOnCloudinary(coverImageLocalPath)

  if (!coverImage) {
    throw new ApiError(400, "Error while uploading on  coverImage")
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        coverImage: coverImage.url
      }
    },
    {
      new: true
    }
  ).select("-password")

  return res.status(200)
    .json(new ApiResponse(200, user, " coverImage updated successfully"))
})
export {
  registerUser,
  loginUser,
  LogoutUser,
  refreshAccessToken,

  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage
};