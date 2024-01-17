const mongoose = require("mongoose");

const HttpError = require("../models/http-error");
const { v4: uuidv4 } = require("uuid");
const User = require("../models/user");
const fs = require("fs");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const { validationResult } = require("express-validator");
const getUsers = async (req, res, next) => {
  let users;
  try {
    users = await User.find({}, "-password");
  } catch (err) {
    return next(new HttpError(err.message), 421);
  }
  res.json({ users: users.map((user) => user.toObject({ getters: true })) });
};

const createUser = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new HttpError("Your input is not valid", 422));
  }

  const { email, password, username } = req.body;
  // Check if server fail or existing email
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return next(new HttpError("Email existed", 422));
    }
  } catch (err) {
    return new HttpError(err.message, 422);
  }

  let hashedPassword;

  try {
    hashedPassword = await bcrypt.hash(password, 12);
  } catch (err) {
    return next(new HttpError("Can not create password", 422));
  }

  const newUser = new User({
    email,
    password: hashedPassword,
    username,
    image: `http://localhost:5000/${req.file.path}`,
    places: [],
  });

  // saving data
  try {
    await newUser.save();
  } catch (err) {
    return next(err.message, 500);
  }

  let token;
  try {
    token = jwt.sign(
      {
        userId: newUser.id,
        email: newUser.email,
      },
      process.env.JWT_KEY,
      { expiresIn: "1h" }
    );
  } catch (err) {
    const error = new HttpError(
      "Signing up failed, please try again later!!!",
      500
    );
    return next(error);
  }

  res.status(201).json({
    message: "Login sucessfully",
    user: {
      userId: newUser.id,
      email: newUser.email,
      token: token,
    },
  });
};

const signInHandler = async (req, res, next) => {
  let { email, password } = req.body;
  let identifierUser;
  let isValidPassword;
  let token;
  try {
    identifierUser = await User.findOne({ email: email.toLowerCase()});
    if (!identifierUser) {
      throw new Error("");
    }
    isValidPassword = await bcrypt.compare(password, identifierUser.password);
    if (isValidPassword !== true) {
      throw new Error("");
    }
  } catch (err) {
    return next(new HttpError("Bad Credential"), 421);
  }

  try {
    token = jwt.sign(
      {
        userId: identifierUser.id,
        email: identifierUser.email,
      },
     process.env.JWT_KEY,
      { expiresIn: "1h" }
    );
  } catch (err) {
    const error = new HttpError(
      "Signing in failed, please try again later!!!",
      500
    );
    return next(error);
  }

  res
    .status(200)
    .json({ message: "Login sucessfully", 
    user: { 
        userId: identifierUser.id ,
        email : identifierUser.email,
        token : token
    }});
};

exports.getUsers = getUsers;
exports.createUser = createUser;
exports.signInHandler = signInHandler;
