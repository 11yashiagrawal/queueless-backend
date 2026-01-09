import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";

const app = express();

const allowedOrigins = process.env.CORS_ORIGIN.split(",");

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true); // allow requests without origin
      if (allowedOrigins.includes(origin)) return callback(null, true);
      console.log("Origin not allowed: ", origin);
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

app.use(express.json({ limit: "16kb" }));

app.use(express.urlencoded({ extended: true, limit: "16kb" }));

app.use(express.static("public"));

app.use(cookieParser());

BigInt.prototype.toJSON = function() {
  return this.toString();
};

import AuthRouter from "./routes/auth.routes.js";
app.use("/api/v1/auth", AuthRouter);

import UserRouter from "./routes/user.routes.js";
app.use("/api/v1/users", UserRouter);

import BusinessRouter from "./routes/business.routes.js";
app.use("/api/v1/businesses", BusinessRouter);

export {app}