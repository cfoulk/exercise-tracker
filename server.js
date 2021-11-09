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
    date:  toDateString*/

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
  userId: String,
  description: String,
  duration: Number,
  date: String,
});
const userSchema = new Schema({
  username: String,
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
  User.find({}, (err, users) => {
    if (err) {
      res.json({ error: "No users found" });
    } else {
      res.json(users);
    }
  });
});

app.post("/api/users/:_id/exercises", (req, res) => {
  const logObj = new Log({
    userId: req.params._id,
    description: req.body.description,
    duration: req.body.duration,
    date: new Date(req.body.date).toDateString(),
  });
  User.findById({ _id: req.params._id }, (err, userData) => {
    if (err) {
      res.json({ error: "Invalid _id" });
    } else {
      logObj.save((err, data) => {
        if (err) {
          res.json({ error: "Invalid" });
        } else {
          res.json({
            _id: userData._id,
            username: userData.username,
            date: data.date,
            description: data.description,
            duration: data.duration,
          });
        }
      });
    }
  });
});

app.get("/api/users/:_id/logs", (req, res) => {
  User.findById({ _id: req.params._id }, (err, userData) => {
    if (err) {
      res.json({ error: "Invalid _id" });
    } else {
      Log.find(userData._id).exec((err, results) => {
        if (err) {
          console.log("no logs for that id");
        } else {
          var countLog = results.length;
          res.json({
            _id: userData._id,
            username: userData.username,
            count: countLog,
            results,
          });
        }
      });
    }
  });
});
