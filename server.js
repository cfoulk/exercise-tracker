const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const mongoose = require("mongoose");
const { Schema } = require("mongoose");

app.use(cors());
app.use(express.static("public"));
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

/* Users schema:
    _id: given by db
    username: string
    count: 0
    logs: []
Log schema:
    description: string
    duration: number
    date:  toDateString */

//TODO
//have my users schema hold an array of logs, have each log pushed to each user
//figure out how to properly format the date, i.e. fix it being 1 day behind
//implement from to limit parameters

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const logSchema = new Schema({
  //userId: String,
  description: String,
  duration: Number,
  date: String,
});
const userSchema = new Schema({
  username: { type: String, required: true },
  log: [logSchema],
});

const User = mongoose.model("user", userSchema);
const Log = mongoose.model("log", logSchema);

app.get("/", function (req, res) {
  res.sendFile(__dirname + "/views/index.html");
});

app.post("/api/users", (req, res) => {
  const userObj = new User({ username: req.body.username });
  userObj.save((err, data) => {
    if (err) {
      res.json({ error: "Invalid" });
    } else {
      res.json({ username: data.username, _id: data._id });
    }
  });
});

app.get("/api/users", (req, res) => {
  var query = User.find({}).select("-log -__v");
  query.exec((err, users) => {
    if (err) {
      res.json({ error: "No users found" });
    } else {
      res.json(users);
    }
  });
});

app.post("/api/users/:_id/exercises", (req, res) => {
  if (!req.body.date) {
    var dateVar = new Date();
  } else {
    var dateVar = new Date(req.body.date); //always puts a day early
    //var dateVar = new Date(
    //tempDate.getTime() + tempDate.getTimezoneOffset * 60000 //this is why I cannot use a let or const keyword, the variable is being changed
    //);
  }
  var durationNum = parseInt(req.body.duration);
  const logObj = new Log({
    description: req.body.description,
    duration: durationNum,
    date: dateVar.toDateString(),
  });
  User.findOneAndUpdate(
    { _id: req.params._id },
    { $push: { log: logObj } },
    (err, userData) => {
      if (!userData) {
        res.json({ error: "Invalid _id" });
      } else {
        res.json({
          username: userData.username,
          description: req.body.description,
          duration: durationNum,
          date: dateVar.toDateString(),
          _id: userData._id,
        });
      }
    }
  );
});

app.get("/api/users/:_id/logs", (req, res) => {
  console.log("1");
  User.findById({ _id: req.params._id }, (err, userData) => {
    if (err) {
      res.json({ error: "Invalid _id" });
    } else {
      var countLog = userData.log.length;
      res.json({
        _id: userData._id,
        username: userData.username,
        count: countLog,
        log: userData.log,
      });
      //console.log("2");
      // Log.find(userData._id).exec((err, log) => {
      //   if (!log) {
      //     res.json({
      //       _id: userData._id,
      //       username: userData.username,
      //       count: 0,
      //       log: [],
      //     });
      //   } else {
      //     console.log("3");
      //     var countLog = log.length;
      //     console.log("4");
      //     res.json({
      //       _id: userData._id,
      //       username: userData.username,
      //       count: countLog,
      //       log: log,
      //     });
      //   }
      // });
    }
  });
});
