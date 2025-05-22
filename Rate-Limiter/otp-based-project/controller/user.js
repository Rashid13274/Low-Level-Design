const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Secret key for JWT
const JWT_SECRET = 'your_jwt_secret_key';

exports.verifyOtp = async (req, res) => {
  try {
    const { otp, userId } = req.body;
    const currentTime = Date.now();

    // Fetch the user by ID
    const user = await User.findOne({ _id: userId });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Check if the account is locked
    if (user.lockedAccount && user.lockedAccount > currentTime) {
      const remainingTime = Math.ceil((user.lockedAccount - currentTime) / 1000 / 60); // Minutes left
      return res.status(403).json({
        success: false,
        message: `Account locked. Please try again after ${remainingTime} minutes.`,
      });
    }

    // Reset OTP attempts if OTP has expired
    if (!user.otpExpiresIn || currentTime > user.otpExpiresIn) {
      return res.status(400).json({ success: false, message: 'OTP expired. Please request a new one.' });
    }

    // Initialize or increment OTP attempts
    if (!user.otpAttempts) {
      user.otpAttempts = 1; // Start attempts count
    } else {
      user.otpAttempts += 1; // Increment attempts
    }

    // Lock account if attempts exceed the limit
    if (user.otpAttempts > 5) {
      user.lockedAccount = currentTime + 5 * 60 * 1000; // Lock for 5 minutes
      await user.save();
      return res.status(429).json({
        success: false,
        message: 'Too many attempts. Please try again after 5 minutes.',
      });
    }

    // Validate the OTP
    if (user.otp !== otp) {
      await user.save(); // Save incremented attempt count
      return res.status(400).json({ success: false, message: 'Invalid OTP.' });
    }

    // OTP is valid; reset attempts and lock fields
    user.otpAttempts = 0;
    user.lockedAccount = null;
    await user.save();

    res.status(200).json({ success: true, message: 'OTP verified successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Sign-in API
exports.signIn = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Fetch the user by email
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Validate password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '1h' });

    res.status(200).json({ success: true, token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Sign-out API
exports.signOut = (req, res) => {
  try {
    // Invalidate the token (handled on the client-side by removing it from storage)
    res.status(200).json({ success: true, message: 'Signed out successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// GetMe API
exports.getMe = async (req, res) => {
  try {
    const token = req.headers.authorization.split(' ')[1];

    if (!token) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);

    // Fetch user details
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({ success: true, data: user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const UserSchema = new mongoose.Schema({
  // Existing fields...
  otp: String,
  otpExpiresIn: Date,
  lockedAccount: Date,
  otpAttempts: { type: Number, default: 0 }, // Number of OTP attempts

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

