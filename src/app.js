require("dotenv").config();
const express = require("express");
const path = require("path");
const app = express();
const hbs = require("hbs");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const auth = require("./middleWare/auth");

require("./db/conn");
const Register = require("./models/registers");

const port = process.env.PORT || 3000;

const static_path = path.join(__dirname, "../public");
const template_path = path.join(__dirname, "../templates/views");
const partials_path = path.join(__dirname, "../templates/partials");

app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: false }));

app.use(express.static(static_path));
app.set("view engine", "hbs");
app.set("views", template_path);
hbs.registerPartials(partials_path);

app.get("/", (req, res) => {
  res.render("index");
});

app.get("/secret", auth, (req, res) => {
  // console.log(`this is cookie ${req.cookies.jwt}`);
  res.render("secret");
});

app.get("/logout", auth, async (req, res) => {
  try {
    // for single logout
    // req.user.tokens = req.user.tokens.filter((currElm) =>{
    //    return currElm.token !== req.token
    // })

    // logout from all device
    req.user.tokens = [];

    res.clearCookie("jwt");
    console.log("Logout SuccessFully");
    await req.user.save();
    res.render("login");
  } catch (error) {
    res.status(500).send(error);
  }
});

app.get("/register", (req, res) => {
  res.render("register");
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.post("/register", async (req, res) => {
  try {
    const password = req.body.password;
    const cpassword = req.body.confirmpassword;

    if (password === cpassword) {
      const registerEmployee = new Register({
        firstname: req.body.firstname,
        lastname: req.body.lastname,
        email: req.body.email,
        gender: req.body.gender,
        phone: req.body.phone,
        age: req.body.age,
        password: password,
        confirmpassword: cpassword,
      });

      // middleWare
      const token = await registerEmployee.generateAuthToken();

      console.log("heelo");

      res.cookie("jwt", token, {
        expires: new Date(Date.now() + 3000),
        httpOnly: true,
      });

      const registered = await registerEmployee.save();

      res.status(201).render("index");
    } else {
      res.send("Password not matching");
    }
  } catch (err) {
    res.status(400).send(err);
  }
});

app.post("/login", async (req, res) => {
  try {
    const email = req.body.email;
    const password = req.body.password;

    const useremail = await Register.findOne({ email: email });

    const isMatch = await bcrypt.compare(password, useremail.password);

    const token = await useremail.generateAuthToken();

    res.cookie("jwt", token, {
      expires: new Date(Date.now() + 30000),
      httpOnly: true,
    });

    if (isMatch) {
      res.status(201).render("index");
    } else {
      res.send("Invalid Password details");
    }
  } catch (err) {
    res.status(400).send("Invalid Email");
  }
});

// jwt authentication
// const createToken = async() => {
//   const token = await jwt.sign({id:"6443cf6bff462adce4c25cd9"} , "riteshghartimagar");
//   console.log(token);

//   const useVer = await jwt.verify(token , "riteshghartimagar");
//   console.log(useVer);

// }

// createToken();

app.listen(port, () => {
  console.log(`Running in port ${port}`);
});
