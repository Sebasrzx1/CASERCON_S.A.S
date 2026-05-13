const express = require("express");
const path = require("path");

const envFile =
  process.env.NODE_ENV === "production"
    ? ".env.production"
    : ".env.development";

require("dotenv").config({
  path: path.resolve(__dirname, envFile),
});

const PORT = process.env.PORT;

console.log("Env:", process.env.NODE_ENV);

const app = require("./src/app");

app.listen(PORT, () =>
  console.log(
    `Servidor de Casercon S.A.S corriendo en el puerto ${PORT}
┌───────────────────────────────┐
│         CASERCON S.A.S        | 
├───────────────────────────────┤
│  System Ready...              │
│  Launching digital casercon...│
└───────────────────────────────┘
        `,
  ),
);