const express = require('express');
const cors = require("cors")
const app = express();
const formRoute = require("./router/formRoute")

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors())

// Serve static files (for example, uploaded files)
app.use(express.static('uploads'));

// Use the routes
app.use('/api', formRoute);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
