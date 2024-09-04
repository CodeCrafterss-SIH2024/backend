  require('dotenv').config();

  const express = require('express');
  const mongoose = require('mongoose');
  const cors = require('cors');
  const bcrypt = require('bcryptjs');
  const jwt = require('jsonwebtoken');
  const nodemailer = require('nodemailer');
  const bodyParser = require('body-parser');
 


  const app = express();
  app.use(express.json());
  // app.use(cors({ origin: 'https://frontend-mauve-pi.vercel.app/' }));
  app.use(cors()); 
  app.use(bodyParser.json());

  const PORT = process.env.PORT || 5000;
  const MONGO_URI = process.env.MONGO_URI;
  const JWT_SECRET = process.env.JWT_SECRET;
  const EMAIL_USER = process.env.EMAIL_USER;
  const EMAIL_PASS = process.env.EMAIL_PASS;

  // Connect to MongoDB
  mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error('MongoDB connection error:', err));

  // User schema and model
  const UserSchema = new mongoose.Schema({
    username: String,
    email: String,
    password: String,
    age: Number,
    role: String,
    otp: String,
    otpExpires: Date,
  });

  const User = mongoose.model('User', UserSchema);

  // Nodemailer transporter setup
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASS,
    },
  });



  // Signup route
  app.post('/signup', async (req, res) => {
    const { username, email, password, age } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const role = age < 18 ? 'child' : 'adult';
  
    try {
      // Check if the user already exists
     
      const existingUser = await User.findOne({ email });
      // if (existingUser) {
      //   return res.status(400).json({ message: 'User already exists' });
      // }

      // Create the user with pending role
      const newUser = new User({
        username,
        email,
        password: hashedPassword,
        age,
        role, // Pending until OTP verification
        
      });
      await newUser.save();
       // Generate OTP and send it separately
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = Date.now() + 10 * 60 * 1000; // OTP valid for 10 minutes

    await User.findOneAndUpdate({ email }, { otp, otpExpires });

    // Send OTP via email
    await transporter.sendMail({
      from: EMAIL_USER,
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
    const { email, password} = req.body;
    try {
      const user = await User.findOne({ email });
    
      if (!user) return res.status(400).json({ message: 'User not found' });
     console.log(user)
     console.log(password)
     console.log(user.password)
      const isMatch = await bcrypt.compare(password, user.password);
      // const isMatch = password===user.password
      console.log(isMatch)
      if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });
  
      const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '1h' });
      res.json({ token });
      console.log({token})
     
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Login failed' });
    }
  });

  

app.post('/send-otp', async (req, res) => {
  const { email, password, age } = req.body;
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpires = Date.now() + 10 * 60 * 1000; // OTP valid for 10 minutes

  try {
    // Hash the password before storing it
    const hashedPassword = await bcrypt.hash(password, 10);

    // Check if the email exists
    let user = await User.findOne({ email });

    if (user) {
      // If user exists, update OTP and password if provided
      await User.findOneAndUpdate(
        { email },
        { otp, otpExpires, password: hashedPassword },
        { new: true }
      );
    } else {
      // If user does not exist, create a new user with hashed password
      user = new User({
        email,
        otp,
        otpExpires,
        username: '', // Provide default or empty value
        password: hashedPassword, // Store the hashed password
        age, // Provide default or empty value
        role: 'pending' // Set a default role for pending verification
      });
      await user.save();
    }

    // Send OTP via email
    await transporter.sendMail({
      from: EMAIL_USER,
      to: email,
      subject: 'Your OTP Code',
      text: `Your OTP code is ${otp}`,
    });

    res.status(200).json({ message: 'OTP sent to your email' });
  } catch (error) {
    console.error('Failed to send OTP:', error);
    res.status(500).json({ error: 'Failed to send OTP', details: error.message });
  }
});



// Verify OTP and complete registration route
app.post('/verify-otp', async (req, res) => {
  const { email, otp, username, password, age } = req.body;

  try {
    // Find user by email
    let user = await User.findOne({ email });

    // Check if the user exists
    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    // Check if the OTP is correct and not expired
    if (user.otp !== otp || user.otpExpires < Date.now()) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    // If user role is pending, finalize registration
    if (user.role === 'pending') {
      const hashedPassword = password ? await bcrypt.hash(password, 10) : user.password;
   
      // Update user with final details
      await User.findOneAndUpdate(
        { email },
        {
          username,
          password: hashedPassword,
          age,
          role: age < 18 ? 'child' : 'adult',
          otp: null,
          otpExpires: null
        }
      );

      return res.status(200).json({ message: 'User registered successfully' });
    }

    // If the user already completed registration
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
        from: EMAIL_USER,
        to: email,
        subject: 'Your OTP Code for Password Reset',
        text: `Your OTP code is ${otp}`,
      });

      res.status(200).json({ message: 'OTP sent to your email' });
    } catch (error) {
      console.error('Failed to send reset OTP:', error);
      res.status(500).json({ error: 'Failed to send OTP' });
    }
  });

  // Reset password route
  app.post('/reset-password', async (req, res) => {
    const { email, otp, newPassword } = req.body;

    try {
      const user = await User.findOne({ email });
      if (!user || user.otp !== otp || user.otpExpires < Date.now()) {
        return res.status(400).json({ message: 'Invalid or expired OTP' });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);

      await User.findOneAndUpdate(
        { email },
        { password: hashedPassword, otp: null, otpExpires: null }
      );

      res.status(200).json({ message: 'Password reset successful' });
    } catch (error) {
      console.error('Password reset error:', error);
      res.status(500).json({ error: 'Failed to reset password' });
    }
  });

  // Start the server
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
