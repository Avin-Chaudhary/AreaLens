const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const locRouter = require(`${__dirname}/routes/locRoutes`);
const userRouter = require(`${__dirname}/routes/userRoutes`);

const app = express();

/* =========================
   CORS
   ========================= */

app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

/* =========================
   Middlewares
   ========================= */

app.use(express.json());
app.use(cookieParser());

app.use((req, res, next) => {
  console.log("Request is being processed...");
  next();
});

/* =========================
   Routes
   ========================= */

app.use("/api/v1/location-info", locRouter);
app.use("/api/v1/user", userRouter);

module.exports = app;
