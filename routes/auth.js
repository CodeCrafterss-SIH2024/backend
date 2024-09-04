const express = require('express');
const router = express.Router();
const User = require('../models/User'); // Import the User model
const { sendEmail } = require('../utils/email');
const { generateOTP } = require('../utils/otp');

let otpStore = {};

router.post('/send-otp', async (req, res) => {
  const { email } = req.body;

  try {
    // Check if the email already exists in the database
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email is already registered' });
    }

    // Generate and store the OTP
    const otp = generateOTP();
    otpStore[email] = otp;

    // Send the OTP via email
    await sendEmail(email, 'Your OTP Code', `Your OTP code is ${otp}`);
    res.status(200).json({ message: 'OTP sent' });
  } catch (err) {
    console.error('Error sending OTP:', err);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
});

module.exports = router;
