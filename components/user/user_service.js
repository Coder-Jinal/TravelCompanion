const express = require('express');
const router = express.Router();
const userService = require('./user_service');
const User = require('./user');
const bcrypt = require('bcrypt');

// Registration function
// async function register(userData) {
//   // console.log('User data received:', userData);
//   const existingUser = await User.findOne({ 
//     $or: [ 
//       { email: userData.email }, 
//       { username: userData.username } 
//     ] 
//   });
  
//   if (existingUser) {
//     throw new Error('Username or email already exists');
//   }

//   const user = new User({
//     username: userData.username,
//     email: userData.email,
//     password: userData.password,
//     securityQuestion: {
//       question: userData.securityQuestion.question,
//       answer: userData.securityQuestion.answer
//     }
//   });

//   return await user.save();
// }

// Updated registration function with better validation
async function register(userData) {
  // Validate security question data
  if (!userData.securityQuestion?.question || !userData.securityQuestion?.answer) {
    throw new Error('Both security question and answer are required');
  }

  if (userData.securityQuestion.answer.trim().length < 2) {
    throw new Error('Security answer must be at least 2 characters');
  }

  const existingUser = await User.findOne({ 
    $or: [ 
      { email: userData.email }, 
      { username: userData.username } 
    ] 
  });
  
  if (existingUser) {
    throw new Error('Username or email already exists');
  }

  // Create user with properly formatted security question
  const user = new User({
    username: userData.username,
    email: userData.email,
    password: userData.password,
    securityQuestion: {
      question: userData.securityQuestion.question.trim(),
      answer: userData.securityQuestion.answer.trim()
    }
  });

  const savedUser = await user.save();
  console.log('New user created with security question:', savedUser.securityQuestion);
  return savedUser;
}

// Login function
async function login(email, password) {
  const user = await User.findOne({ email });
  if (!user) throw new Error('Invalid email or password');

  // console.log('Stored hash:', user.password);
  // console.log('Comparing with input:', password);
  
  const isMatch = await bcrypt.compare(password, user.password);
  // console.log('Match result:', isMatch);
  
  if (!isMatch) throw new Error('Invalid email or password');
  return user;
}

// Update user function
async function updateUser(userId, updateData) {
  const updates = {
    username: updateData.username,
    email: updateData.email,
    updatedAt: Date.now()
  };

  if (updateData.password) {
    const salt = await bcrypt.genSalt(10);
    updates.password = await bcrypt.hash(updateData.password, salt);
  }

  return await User.findByIdAndUpdate(
    userId, 
    updates, 
    { new: true, runValidators: true }
  );
}

// Delete user function
async function deleteUser(userId) {
  return await User.findByIdAndDelete(userId);
}

// Get user by ID function
async function getUserById(userId) {
  return await User.findById(userId);
}


// Combined function to verify answer and reset password
// async function verifySecurityAnswerAndReset(email, answer, newPassword) {
//   const user = await User.findOne({ email });
//   if (!user) throw new Error('User not found');
  
//   if (answer.toLowerCase() !== user.securityQuestion.answer.toLowerCase()) {
//     throw new Error('Incorrect security answer');
//   }

//   // Directly set the password (pre-save hook will handle hashing)
//   user.password = newPassword;
//   await user.save();
  
//   return user;
// }

async function verifySecurityAnswerAndReset(email, answer, newPassword) {
  try {
    // Find user and ensure security question exists
    const user = await User.findOne({ email });
    if (!user) {
      throw new Error('User not found');
    }

    // Debug logging
    console.log('Current user security question:', user.securityQuestion);
    console.log('Provided answer:', answer);

    // Validate security answer exists
    if (!user.securityQuestion?.answer) {
      throw new Error('Security system error. No security answer found.');
    }

    // Compare answers (case-insensitive and trimmed)
    const isMatch = user.securityQuestion.answer.trim().toLowerCase() === 
                   answer.trim().toLowerCase();
    
    if (!isMatch) {
      throw new Error('Incorrect security answer');
    }

    // Update password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();
    
    return user;
  } catch (err) {
    console.error('Password reset error:', err);
    throw err;
  }
}

// Export all functions
module.exports = {
  register,
  login,
  updateUser,
  deleteUser,
  getUserById,
  verifySecurityAnswerAndReset
};