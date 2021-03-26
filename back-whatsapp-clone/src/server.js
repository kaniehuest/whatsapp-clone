import express from "express";
import mongoose from "mongoose";
import Messages from "./dbMessages";
import Pusher from "pusher";
import cors from "cors";

const app = express();
const port = process.env.PORT || 9000;

// Middlewares
app.use(express.json());
app.use(cors());

// Pusher
const pusher = new Pusher({
  appId: "",
  key: "",
  secret: "",
  cluster: "",
  useTLS: true,
});

pusher.trigger("my-channel", "my-event", {
  message: "hello world",
});

// Mongodb Connection
const connection_url = "";

mongoose.connect(connection_url, {
  useCreateIndex: true,
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;

db.once("open", () => {
  console.log("DB is connected");

  const msgCollection = db.collection("messagecontents");
  const changeStream = msgCollection.watch();

  changeStream.on("change", (change) => {
    if (change.operationType === "insert") {
      const messageDetails = change.fullDocument;
      pusher.trigger("messages", "inserted", {
        name: messageDetails.name,
        message: messageDetails.message,
        timestamp: messageDetails.timestamp,
        received: messageDetails.received,
      });
    } else {
      console.log("An Error Ocurred");
    }
  });
});

// Controller
const getDashboard = async (req, res) => {
  await res.status(200).send("Hello");
};

const getAllMessages = async (req, res) => {
  await Messages.find((err, data) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.status(200).send(data);
    }
  });
};

const newMessage = async (req, res) => {
  const dbMessage = req.body;

  await Messages.create(dbMessage, (err, data) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.status(201).send(data);
    }
  });
};

// Routes
app.get("/", getDashboard);
app.get("/messages/sync", getAllMessages);
app.post("/messages/new", newMessage);

// Listening
app.listen(port, () => {
  console.log(`Server listening on port: ${port}`);
});
