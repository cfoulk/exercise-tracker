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
  description: { type: String, required: true },
  duration: { type: Number, required: true },
  date: Date,
});
const userSchema = new Schema({
  username: { type: String, required: true, unique: true },
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
      res.json({ error: "Username already in Use" });
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
  }
  var durationNum = parseInt(req.body.duration);
  const logObj = new Log({
    description: req.body.description,
    duration: durationNum,
    date: dateVar,
  });
  User.findOneAndUpdate(
    { _id: req.params._id },
    { $push: { log: logObj } },
    (err, userData) => {
      if (err) {
        res.json({ error: "Invalid Id" });
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
  // var query = User.find(
  //   { _id: req.params._id },
  //   { date: { $gte: new Date(from), $lte: new Date(to) } }
  // ).limit(+limit);
  User.findById({ _id: req.params._id }, (err, userData) => {
    //query.exec((err, userData) => {
    if (err) {
      res.json({ error: "Invalid" });
    } else {
      var countLog = userData.log.length;
      var logResult = userData.log;
      if (req.query.from || req.query.to) {
        if (req.query.from) {
          let fromDate = new Date(req.query.from);
          logResult = logResult.filter(
            (logResult) => logResult.date > fromDate
          );
          console.log("From: " + fromDate.toDateString());
        }
        if (req.query.to) {
          let toDate = new Date(req.query.to);
          logResult = logResult.filter((logResult) => logResult.date < toDate);
          console.log("To: " + toDate.toDateString());
        }
      }
      if (req.query.limit) {
        logResult = logResult.slice(0, req.query.limit);
        if (req.query.limit < countLog) {
          countLog = parseInt(req.query.limit);
        }
      }

      console.log("logging: " + logResult[0].date.toDateString());
      logResult.forEach((x) => {
        x.date = x.date.toDateString();
        console.log("logging2: " + x);
      });
      res.json({
        _id: userData._id,
        username: userData.username,
        count: countLog,
        //from: fromDate,
        //to: toDate,
        log: logResult,
      });
    }
  });
});
