// const express = require("express");
// const bodyParser = require("body-parser");
// const cors = require("cors");
// const fetch = require("node-fetch");

// const app = express();
// app.use(bodyParser.json());
// app.use(cors());

// const DEVICE_IP = "192.168.4.1"; // ✅ Keep ESP32 IP here

// // Handle Alexa and Mobile App Commands
// app.post("/control", async (req, res) => {
//   const { command } = req.body;
//   console.log("Received command:", command);

//   let deviceCommand = "";

//   if (command.includes("turn on light")) {
//     deviceCommand = "31";  // On
//   } else if (command.includes("turn off light")) {
//     deviceCommand = "32";  // Off
//   } else if (command.includes("set white light to")) {
//     const match = command.match(/\d+/);
//     if (match) deviceCommand = match[0]; 
//   }

//   if (deviceCommand) {
//     try {
//       await fetch(`http://${DEVICE_IP}/command`, {  // ✅ Send to ESP32
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ value: deviceCommand }),
//       });
//       res.json({ message: "Command sent to ESP32" });
//     } catch (error) {
//       console.error("Error communicating with ESP32:", error);
//       res.status(500).json({ error: "Failed to send command" });
//     }
//   } else {
//     res.status(400).json({ error: "Invalid command" });
//   }
// });

// // Get Current Light State
// app.get("/getState", async (req, res) => {
//   try {
//     const response = await fetch(`http://${DEVICE_IP}/state`);
//     const state = await response.json();
//     res.json(state);
//   } catch (error) {
//     console.error("⚠️ Failed to fetch ESP32 state:", error);
//     res.status(500).json({ error: "Failed to fetch state" });
//   }
// });

// app.listen(3000, () => console.log("Server running on port 3000"));

// const express = require("express");
// const bodyParser = require("body-parser");
// const cors = require("cors");
// const fetch = require("node-fetch");
// require('dotenv').config(); // For environment variables

// const app = express();
// app.use(bodyParser.json());
// app.use(cors());

// const DEVICE_IP = process.env.DEVICE_IP || "192.168.4.1"; // Use environment variable or default

// // Handle Alexa and Mobile App Commands
// app.post("/control", async (req, res) => {
//   const { command } = req.body;
//   console.log("Received command:", command);

//   let deviceCommand = "";

//   if (command.includes("turn on light")) {
//     deviceCommand = "31";  // On
//   } else if (command.includes("turn off light")) {
//     deviceCommand = "32";  // Off
//   } else if (command.includes("set white light to")) {
//     const match = command.match(/\d+/);
//     if (match) deviceCommand = `W${match[0]}`; // Prefix with 'W' for white light
//   } else if (command.includes("set yellow light to")) {
//     const match = command.match(/\d+/);
//     if (match) deviceCommand = `Y${match[0]}`; // Prefix with 'Y' for yellow light
//   }

//   if (deviceCommand) {
//     try {
//       const response = await fetch(`http://${DEVICE_IP}/command`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ value: deviceCommand }),
//       });

//       if (!response.ok) {
//         throw new Error(`ESP32 responded with status ${response.status}`);
//       }

//       res.json({ message: "Command sent to ESP32" });
//     } catch (error) {
//       console.error("Error communicating with ESP32:", error);
//       res.status(500).json({ error: "Failed to send command" });
//     }
//   } else {
//     res.status(400).json({ error: "Invalid command" });
//   }
// });

// // Get Current Light State
// app.get("/getState", async (req, res) => {
//   try {
//     const response = await fetch(`http://${DEVICE_IP}/state`);
//     if (!response.ok) {
//       throw new Error(`ESP32 responded with status ${response.status}`);
//     }
//     const state = await response.json();
//     res.json(state);
//   } catch (error) {
//     console.error("⚠️ Failed to fetch ESP32 state:", error);
//     res.status(500).json({ error: "Failed to fetch state" });
//   }
// });

// const PORT = process.env.PORT || 3000;
// app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const axios = require("axios");
require('dotenv').config();

const app = express();
app.use(bodyParser.json());
app.use(cors());

// Global variable to store the current ESP32 IP
let CURRENT_DEVICE_IP = process.env.DEVICE_IP || "192.168.4.1";

// Endpoint to update ESP32 IP address
app.post("/update-device-ip", async (req, res) => {
  const { ipAddress } = req.body;

  // Validate IP address format
  const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
  if (!ipRegex.test(ipAddress)) {
    return res.status(400).json({ error: "Invalid IP address format" });
  }

  try {
    // Update the global IP variable
    CURRENT_DEVICE_IP = ipAddress;

    res.json({ 
      message: "Device IP updated successfully",
      currentIP: CURRENT_DEVICE_IP 
    });
  } catch (error) {
    console.error("Error updating device IP:", error);
    res.status(500).json({ error: "Failed to update device IP" });
  }
});

// Endpoint to retrieve current stored IP (for AWS Lambda or other services)
app.get("/get-device-ip", (req, res) => {
  res.json({ 
    deviceIP: CURRENT_DEVICE_IP 
  });
});

// Existing control endpoint (now uses CURRENT_DEVICE_IP)
app.post("/control", async (req, res) => {
  const { command } = req.body;
  console.log("Received command:", command);

  let deviceCommand = "";

  if (command.includes("turn on light")) {
    deviceCommand = "31";  // On
  } else if (command.includes("turn off light")) {
    deviceCommand = "32";  // Off
  } else if (command.includes("set white light to")) {
    const match = command.match(/\d+/);
    if (match) deviceCommand = `W${match[0]}`; // Prefix with 'W' for white light
  } else if (command.includes("set yellow light to")) {
    const match = command.match(/\d+/);
    if (match) deviceCommand = `Y${match[0]}`; // Prefix with 'Y' for yellow light
  }

  if (deviceCommand) {
    try {
      const response = await axios.post(`http://${CURRENT_DEVICE_IP}/command`, 
        { value: deviceCommand },
        {
          headers: { "Content-Type": "application/json" }
        }
      );

      res.json({ message: "Command sent to ESP32" });
    } catch (error) {
      console.error("Error communicating with ESP32:", error);
      res.status(500).json({ 
        error: "Failed to send command",
        details: error.message 
      });
    }
  } else {
    res.status(400).json({ error: "Invalid command" });
  }
});

// Existing getState endpoint (now uses CURRENT_DEVICE_IP)
app.get("/getState", async (req, res) => {
  try {
    const response = await axios.get(`http://${CURRENT_DEVICE_IP}/state`);
    res.json(response.data);
  } catch (error) {
    console.error("⚠️ Failed to fetch ESP32 state:", error);
    res.status(500).json({ 
      error: "Failed to fetch state",
      details: error.message 
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`)); 