//   require('dotenv').config();

//   const express = require('express');
//   const mongoose = require('mongoose');
//   const cors = require('cors');
//   const bcrypt = require('bcryptjs');
//   const jwt = require('jsonwebtoken');
//   const nodemailer = require('nodemailer');
//   const bodyParser = require('body-parser');
 


//   const app = express();
//   app.use(express.json());
//   // app.use(cors({ origin: 'https://frontend-mauve-pi.vercel.app/' }));
//   app.use(cors()); 
//   app.use(bodyParser.json());

//   const PORT = process.env.PORT || 5000;
//   const MONGO_URI = process.env.MONGO_URI;
//   const JWT_SECRET = process.env.JWT_SECRET;
//   const EMAIL_USER = process.env.EMAIL_USER;
//   const EMAIL_PASS = process.env.EMAIL_PASS;

//   // Connect to MongoDB
//   mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
//     .then(() => console.log('MongoDB connected'))
//     .catch(err => console.error('MongoDB connection error:', err));

//   // User schema and model
//   const UserSchema = new mongoose.Schema({
//     username: String,
//     email: String,
//     password: String,
//     age: Number,
//     role: String,
//     otp: String,
//     otpExpires: Date,
//   });

//   const User = mongoose.model('User', UserSchema);

//   // Nodemailer transporter setup
//   const transporter = nodemailer.createTransport({
//     service: 'gmail',
//     auth: {
//       user: EMAIL_USER,
//       pass: EMAIL_PASS,
//     },
//   });



//   // Signup route
//   app.post('/signup', async (req, res) => {
//     const { username, email, password, age } = req.body;
//     const hashedPassword = await bcrypt.hash(password, 10);
//     const role = age < 18 ? 'child' : 'adult';
  
//     try {
//       // Check if the user already exists
     
//       const existingUser = await User.findOne({ email });
//       // if (existingUser) {
//       //   return res.status(400).json({ message: 'User already exists' });
//       // }

//       // Create the user with pending role
//       const newUser = new User({
//         username,
//         email,
//         password: hashedPassword,
//         age,
//         role, // Pending until OTP verification
        
//       });
//       await newUser.save();
//        // Generate OTP and send it separately
//     const otp = Math.floor(100000 + Math.random() * 900000).toString();
//     const otpExpires = Date.now() + 10 * 60 * 1000; // OTP valid for 10 minutes

//     await User.findOneAndUpdate({ email }, { otp, otpExpires });

//     // Send OTP via email
//     await transporter.sendMail({
//       from: EMAIL_USER,
//       to: email,
//       subject: 'Your OTP Code for Signup Verification',
//       text: `Your OTP code is ${otp}. It is valid for 10 minutes.`,
//     });

//     res.status(201).json({ message: 'User created successfully. OTP sent to your email.' });
//   } catch (err) {
//     console.error('Signup error:', err);
//     res.status(500).json({ error: 'Failed to create user' });
//   }
// });



//   // Login route
//   app.post('/login', async (req, res) => {
//     const { email, password} = req.body;
//     try {
//       const user = await User.findOne({ email });
    
//       if (!user) return res.status(400).json({ message: 'User not found' });
//      console.log(user)
//      console.log(password)
//      console.log(user.password)
//       const isMatch = await bcrypt.compare(password, user.password);
//       // const isMatch = password===user.password
//       console.log(isMatch)
//       if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });
  
//       const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '1h' });
//       res.json({ token });
//       console.log({token})
     
//     } catch (error) {
//       console.error('Login error:', error);
//       res.status(500).json({ error: 'Login failed' });
//     }
//   });

  

//   app.post('/send-otp', async (req, res) => {
//     const { email, password, age,username } = req.body;
//     const otp = Math.floor(100000 + Math.random() * 900000).toString();
//     const otpExpires = Date.now() + 10 * 60 * 1000; // OTP valid for 10 minutes
  
//     try {
//       // Check if the email exists
//       let user = await User.findOne({ email });
  
//       if (user) {
//         // If the user already exists, respond with an error or a message
//         return res.status(400).json({ error: 'Email already exists. Please log in.' });
//       }
  
//       // If user does not exist, proceed to create a new user and send OTP
//       // Hash the password before storing it
//       const hashedPassword = await bcrypt.hash(password, 10);
  
//       user = new User({
//         email,
//         otp,
//         otpExpires,
//         username, // Provide default or empty value
//         password: hashedPassword, // Store the hashed password
//         age, // Provide default or empty value
//         role: 'pending' // Set a default role for pending verification
//       });
  
//       await user.save();
  
//       // Send OTP via email
//       await transporter.sendMail({
//         from: EMAIL_USER,
//         to: email,
//         subject: 'Your OTP Code',
//         text: `Your OTP code is ${otp}`,
//       });
  
//       res.status(200).json({ message: 'OTP sent to your email' });
//     } catch (error) {
//       console.error('Failed to send OTP:', error);
//       res.status(500).json({ error: 'Failed to send OTP', details: error.message });
//     }
//   });
  

// // Verify OTP and complete registration route
// app.post('/verify-otp', async (req, res) => {
//   const { email, otp, username, password, age } = req.body;

//   try {
//     // Find user by email
//     let user = await User.findOne({ email });

//     // Check if the user exists
//     if (!user) {
//       return res.status(400).json({ message: 'User not found' });
//     }

//     // Check if the OTP is correct and not expired
//     if (user.otp !== otp || user.otpExpires < Date.now()) {
//       return res.status(400).json({ message: 'Invalid or expired OTP' });
//     }

//     // If user role is pending, finalize registration
//     if (user.role === 'pending') {
//       const hashedPassword = password ? await bcrypt.hash(password, 10) : user.password;
   
//       // Update user with final details
//       await User.findOneAndUpdate(
//         { email },
//         {
//           username,
//           password: hashedPassword,
//           age,
//           role: age < 18 ? 'child' : 'adult',
//           otp: null,
//           otpExpires: null
//         }
//       );

//       return res.status(200).json({ message: 'User registered successfully' });
//     }

//     // If the user already completed registration
//     res.status(200).json({ message: 'OTP verified' });
//   } catch (error) {
//     console.error('OTP verification error:', error);
//     res.status(500).json({ error: 'OTP verification failed' });
//   }
// });


//   // Send reset OTP route
//   app.post('/send-reset-otp', async (req, res) => {
//     const { email } = req.body;
//     const otp = Math.floor(100000 + Math.random() * 900000).toString();
//     const otpExpires = Date.now() + 10 * 60 * 1000;

//     try {
//       const user = await User.findOneAndUpdate({ email }, { otp, otpExpires }, { new: true });

//       if (!user) return res.status(400).json({ message: 'User not found' });

//       await transporter.sendMail({
//         from: EMAIL_USER,
//         to: email,
//         subject: 'Your OTP Code for Password Reset',
//         text: `Your OTP code is ${otp}`,
//       });

//       res.status(200).json({ message: 'OTP sent to your email' });
//     } catch (error) {
//       console.error('Failed to send reset OTP:', error);
//       res.status(500).json({ error: 'Failed to send OTP' });
//     }
//   });

//   // Reset password route
//   app.post('/reset-password', async (req, res) => {
//     const { email, otp, newPassword } = req.body;

//     try {
//       const user = await User.findOne({ email });
//       if (!user || user.otp !== otp || user.otpExpires < Date.now()) {
//         return res.status(400).json({ message: 'Invalid or expired OTP' });
//       }

//       const hashedPassword = await bcrypt.hash(newPassword, 10);

//       await User.findOneAndUpdate(
//         { email },
//         { password: hashedPassword, otp: null, otpExpires: null }
//       );

//       res.status(200).json({ message: 'Password reset successful' });
//     } catch (error) {
//       console.error('Password reset error:', error);
//       res.status(500).json({ error: 'Failed to reset password' });
//     }
//   });

//   // Start the server
//   app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
















// require('dotenv').config();

// const express = require('express');
// const mongoose = require('mongoose');
// const cors = require('cors');
// const bcrypt = require('bcryptjs');
// const jwt = require('jsonwebtoken');
// const nodemailer = require('nodemailer');
// const bodyParser = require('body-parser');
// const http = require('http');
// const { Server } = require('socket.io');

// const app = express();
// app.use(express.json());
// app.use(cors());
// app.use(bodyParser.json());

// const PORT = process.env.PORT || 5000;
// const MONGO_URI = process.env.MONGO_URI;
// const JWT_SECRET = process.env.JWT_SECRET;
// const EMAIL_USER = process.env.EMAIL_USER;
// const EMAIL_PASS = process.env.EMAIL_PASS;

// // Connect to MongoDB
// mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
//   .then(() => console.log('MongoDB connected'))
//   .catch(err => console.error('MongoDB connection error:', err));

// // User schema and model
// const UserSchema = new mongoose.Schema({
//   username: String,
//   email: { type: String, unique: true },
//   password: String,
//   age: Number,
//   role: { type: String, default: 'pending' }, // Default role pending for verification
//   otp: String,
//   otpExpires: Date,
// });

// const User = mongoose.model('User', UserSchema);

// // Nodemailer transporter setup
// const transporter = nodemailer.createTransport({
//   service: 'gmail',
//   auth: {
//     user: EMAIL_USER,
//     pass: EMAIL_PASS,
//   },
// });

// // Signup route
// app.post('/signup', async (req, res) => {
//   const { username, email, password, age } = req.body;
//   const hashedPassword = await bcrypt.hash(password, 10);
//   const role = age < 18 ? 'child' : 'adult';

//   try {
//     // Check if the user already exists
//     const existingUser = await User.findOne({ email });
//     if (existingUser) {
//       return res.status(400).json({ message: 'User already exists. Please log in.' });
//     }

//     // Create a new user with pending verification role
//     const newUser = new User({
//       username,
//       email,
//       password: hashedPassword,
//       age,
//       role: 'pending', // Set to pending until OTP verification
//     });
//     await newUser.save();

//     // Generate OTP and send it via email
//     const otp = Math.floor(100000 + Math.random() * 900000).toString();
//     const otpExpires = Date.now() + 10 * 60 * 1000; // OTP valid for 10 minutes

//     await User.findOneAndUpdate({ email }, { otp, otpExpires });

//     await transporter.sendMail({
//       from: EMAIL_USER,
//       to: email,
//       subject: 'Your OTP Code for Signup Verification',
//       text: `Your OTP code is ${otp}. It is valid for 10 minutes.`,
//     });

//     res.status(201).json({ message: 'User created successfully. OTP sent to your email.' });
//   } catch (err) {
//     console.error('Signup error:', err);
//     res.status(500).json({ error: 'Failed to create user' });
//   }
// });

// // Login route
// app.post('/login', async (req, res) => {
//   const { email, password } = req.body;
//   try {
//     const user = await User.findOne({ email });
//     if (!user) return res.status(400).json({ message: 'User not found' });

//     const isMatch = await bcrypt.compare(password, user.password);
//     if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

//     const token = jwt.sign({ id: user._id, role: user.role, user:user.username }, JWT_SECRET, { expiresIn: '1h' });
//     res.json({ token });
//   } catch (error) {
//     console.error('Login error:', error);
//     res.status(500).json({ error: 'Login failed' });
//   }
// });

// // Send OTP for account creation
// app.post('/send-otp', async (req, res) => {
//   const { email, password, age, username } = req.body;
//   const otp = Math.floor(100000 + Math.random() * 900000).toString();
//   const otpExpires = Date.now() + 10 * 60 * 1000;

//   try {
//     let user = await User.findOne({ email });
//     if (user) {
//       return res.status(400).json({ message: 'Email already exists. Please log in.' });
//     }

//     const hashedPassword = await bcrypt.hash(password, 10);

//     user = new User({
//       email,
//       otp,
//       otpExpires,
//       username,
//       password: hashedPassword,
//       age,
//       role: 'pending',
//     });

//     await user.save();

//     await transporter.sendMail({
//       from: EMAIL_USER,
//       to: email,
//       subject: 'Your OTP Code',
//       text: `Your OTP code is ${otp}.`,
//     });

//     res.status(200).json({ message: 'OTP sent to your email' });
//   } catch (error) {
//     console.error('Failed to send OTP:', error);
//     res.status(500).json({ error: 'Failed to send OTP' });
//   }
// });

// // Verify OTP and complete registration
// app.post('/verify-otp', async (req, res) => {
//   const { email, otp, username, password, age } = req.body;

//   try {
//     const user = await User.findOne({ email });
//     if (!user) return res.status(400).json({ message: 'User not found' });

//     if (user.otp !== otp || user.otpExpires < Date.now()) {
//       return res.status(400).json({ message: 'Invalid or expired OTP' });
//     }

//     if (user.role === 'pending') {
//       await User.findOneAndUpdate(
//         { email },
//         {
//           username,
//           password: user.password,
//           age,
//           role: age < 18 ? 'child' : 'adult',
//           otp: null, // Clear OTP after verification
//           otpExpires: null,
//         }
//       );

//       return res.status(200).json({ message: 'User registered successfully' });
//     }

//     res.status(200).json({ message: 'OTP verified' });
//   } catch (error) {
//     console.error('OTP verification error:', error);
//     res.status(500).json({ error: 'OTP verification failed' });
//   }
// });

// // Send reset OTP route
// app.post('/send-reset-otp', async (req, res) => {
//   const { email } = req.body;
//   const otp = Math.floor(100000 + Math.random() * 900000).toString();
//   const otpExpires = Date.now() + 10 * 60 * 1000;

//   try {
//     const user = await User.findOneAndUpdate({ email }, { otp, otpExpires }, { new: true });
//     if (!user) return res.status(400).json({ message: 'User not found' });

//     await transporter.sendMail({
//       from: EMAIL_USER,
//       to: email,
//       subject: 'Your OTP Code for Password Reset',
//       text: `Your OTP code is ${otp}.`,
//     });

//     res.status(200).json({ message: 'OTP sent to your email' });
//   } catch (error) {
//     console.error('Failed to send reset OTP:', error);
//     res.status(500).json({ error: 'Failed to send OTP' });
//   }
// });

// // Reset password route
// app.post('/reset-password', async (req, res) => {
//   const { email, otp, newPassword } = req.body;

//   try {
//     const user = await User.findOne({ email });
//     if (!user || user.otp !== otp || user.otpExpires < Date.now()) {
//       return res.status(400).json({ message: 'Invalid or expired OTP' });
//     }

//     const hashedPassword = await bcrypt.hash(newPassword, 10);

//     await User.findOneAndUpdate(
//       { email },
//       { password: hashedPassword, otp: null, otpExpires: null }
//     );

//     res.status(200).json({ message: 'Password reset successful' });
//   } catch (error) {
//     console.error('Password reset error:', error);
//     res.status(500).json({ error: 'Failed to reset password' });
//   }
// });

// // Start the server
// app.listen(PORT, () => console.log(`Server running on port ${PORT}`));


















// server.js
require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

app.use(cors());
app.use(express.json());
app.use(bodyParser.json());

// MongoDB connection
const MONGO_URI = process.env.MONGO_URI;
mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// User schema and model
const UserSchema = new mongoose.Schema({
  username: String,
  email: { type: String, unique: true },
  password: String,
  age: Number,
  role: { type: String, default: 'pending' }, // Default role pending for verification
  otp: String,
  otpExpires: Date,
  points: { type: Number, default: 0 },
});

const User = mongoose.model('User', UserSchema);

// Nodemailer transporter setup
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// WebSocket: Handle connections
let rooms = {}; // Store rooms and participants

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);



  // Create Room
  socket.on('createRoom', (name) => {
    const roomPin = Math.floor(100000 + Math.random() * 900000); // Generate a random 6-digit pin
    rooms[roomPin] = { users: [{ id: socket.id, name }] }; // Store user and name in the room
    socket.join(roomPin);
    socket.emit('roomCreated', roomPin);
  });

  // Join Room
  socket.on('joinRoom', ({ roomPin, name }) => {
    if (rooms[roomPin]) {
      rooms[roomPin].users.push({ id: socket.id, name }); // Add user to the room with their name
      socket.join(roomPin);
      socket.emit('roomJoined', roomPin);
      io.to(roomPin).emit('userJoined', `${name} joined the room`); // Notify others that a user joined
    } else {
      socket.emit('error', 'Room does not exist');
    }
  });

  // Handle Messages
  socket.on('sendMessage', ({ roomPin, message, user }) => {
    io.to(roomPin).emit('receiveMessage', { user, message }); // Broadcast message with username
  });

  // Disconnect
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    // Remove the user from the room
    for (let roomPin in rooms) {
      rooms[roomPin].users = rooms[roomPin].users.filter((user) => user.id !== socket.id);
      if (rooms[roomPin].users.length === 0) {
        delete rooms[roomPin]; // Delete room if empty
      }
    }
  });
});

// REST API Routes
// Signup route
app.post('/signup', async (req, res) => {
  const { username, email, password, age } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const role = age < 18 ? 'child' : 'adult';

  try {
    // Check if the user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists. Please log in.' });
    }

    // Create a new user with pending verification role
    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      age,
      role: 'pending', // Set to pending until OTP verification
    });
    await newUser.save();

    // Generate OTP and send it via email
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = Date.now() + 10 * 60 * 1000; // OTP valid for 10 minutes

    await User.findOneAndUpdate({ email }, { otp, otpExpires });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Your OTP Code for Signup Verification',
      text: `Your OTP code is ${otp}. It is valid for 10 minutes.`,
    });

    res.status(201).json({ message: 'User created successfully. OTP sent to your email.' });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// Login route
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'User not found' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id, role: user.role, user: user.username, email: user.email }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ token });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Send OTP for account creation
app.post('/send-otp', async (req, res) => {
  const { email, password, age, username } = req.body;
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpires = Date.now() + 10 * 60 * 1000;

  try {
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'Email already exists. Please log in.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    user = new User({
      email,
      otp,
      otpExpires,
      username,
      password: hashedPassword,
      age,
      role: 'pending',
    });

    await user.save();

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Your OTP Code',
      text: `Your OTP code is ${otp}.`,
    });

    res.status(200).json({ message: 'OTP sent to your email' });
  } catch (error) {
    console.error('Failed to send OTP:', error);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
});

// Verify OTP and complete registration
app.post('/verify-otp', async (req, res) => {
  const { email, otp, username, password, age } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'User not found' });

    if (user.otp !== otp || user.otpExpires < Date.now()) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }
    
    if (user.role === 'pending') {
      await User.findOneAndUpdate(
        { email },
        {
          username,
          password: user.password,
          age,
          role: age < 18 ? 'child' : 'adult',
          otp: null, // Clear OTP after verification
          otpExpires: null,
        }
      );

      return res.status(200).json({ message: 'User registered successfully' });
    }

    res.status(200).json({ message: 'OTP verified' });
  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({ error: 'OTP verification failed' });
  }
});

// Send reset OTP route
app.post('/send-reset-otp', async (req, res) => {
  const { email } = req.body;
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpires = Date.now() + 10 * 60 * 1000;

  try {
    const user = await User.findOneAndUpdate({ email }, { otp, otpExpires }, { new: true });
    if (!user) return res.status(400).json({ message: 'User not found' });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Your OTP Code for Password Reset',
      text: `Your OTP code is ${otp}.`,
    });

    res.status(200).json({ message: 'OTP sent to your email' });
  } catch (error) {
    console.error('Failed to send reset OTP:', error);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
});

// Verify reset OTP and reset password
app.post('/reset-password', async (req, res) => {
  const { email, otp, newPassword } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user || user.otp !== otp || user.otpExpires < Date.now()) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await User.findOneAndUpdate({ email }, {
      password: hashedPassword,
      otp: null, // Clear OTP after password reset
      otpExpires: null,
    });

    res.status(200).json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ error: 'Password reset failed' });
  }
});






//  for mcq...

// Route to get user points by user id
app.get('/get-points', async (req, res) => {
  try {
    const { email: emailString } = req.query;

    // Parse the email field to extract the actual email
    const emailObj = JSON.parse(emailString);  // Parse the email string to JSON
    const email = emailObj.email;  // Extract the actual email

    if (!email) {
      return res.status(400).json({ message: 'Invalid request. Email missing.' });
    }

    // Find the user by email (case-insensitive)
    const user = await User.findOne({ email: { $regex: new RegExp(`^${email}$`, 'i') } });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ points: user.points });
  } catch (error) {
    console.error("Error retrieving points:", error);
    res.status(500).json({ message: 'Server error' });
  }
});



// Route to update user points
app.post('/update-points', async (req, res) => {
  try {
    console.log("Request body:", req.body);  // Log the request body
    
    // Parse the email field to extract the actual email
    const { email: emailString, pointsToAdd } = req.body;
    const emailObj = JSON.parse(emailString);  // Parse the email string to JSON
    const email = emailObj.email;  // Extract the actual email

    console.log("Parsed email:", email);
    console.log("Points to add:", pointsToAdd);

    if (!email || !pointsToAdd) {
      return res.status(400).json({ message: 'Invalid request. Email or points missing.' });
    }

    // Find the user by email (case-insensitive)
    const user = await User.findOne({ email: { $regex: new RegExp(`^${email}$`, 'i') } });

    if (!user) {
      console.log("User not found");
      return res.status(404).json({ message: 'User not found' });
    }

 

    // Add new points to the current points
    user.points += pointsToAdd;
    await user.save();
    console.log("Points added successfully");

    res.json({ message: 'Points updated', points: user.points });
  } catch (error) {
    console.error("Error updating points:", error);
    res.status(500).json({ message: 'Server error' });
  }
});






app.get('/leaderboard', async (req, res) => {
  try {
    // Fetch users sorted by points in descending order
    const users = await User.find().sort({ points: -1 }).limit(10); // Adjust the limit as needed
    res.json(users);
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ message: 'Server error' });
  }
});




// Serve static files if needed
app.use(express.static('public'));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
