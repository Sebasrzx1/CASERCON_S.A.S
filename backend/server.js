express = require("express");

app = require('./src/app');

dotenv = require("dotenv").config();

const PORT = process.env.PORT;

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


