const express = require('express');
const router = express.Router();
const userService = require('./user_service');
const User = require('./user');

function isAuthenticated(req, res, next) {
  if (req.session.user) return next();
  res.redirect('/user/login');
}

// Profile page
// router.get('/profile', isAuthenticated, async (req, res) => {
//   res.render('user/profile', { user: req.session.user });
// });

router.get('/profile', isAuthenticated, async (req, res) => {
  try {
    // If session doesn't have security question, fetch fresh user data
    let user = req.session.user;
    if (!user.securityQuestion) {
      const freshUser = await userService.getUserById(user._id);
      user = {
        _id: freshUser._id,
        username: freshUser.username,
        email: freshUser.email,
        securityQuestion: freshUser.securityQuestion
      };
      // Update session with complete data
      req.session.user = user;
    }
    
    res.render('user/profile', { user: user });
  } catch (err) {
    console.error('Profile error:', err);
    res.render('user/profile', { 
      user: req.session.user,
      error: 'Error loading profile data'
    });
  }
});

// Update profile
router.post('/profile', isAuthenticated, async (req, res) => {
  try {
    const updates = {
      username: req.body.username,
      email: req.body.email,
      securityQuestion: {
        question: req.body.securityQuestion,
        answer: req.body.securityAnswer
      },
      updatedAt: Date.now()
    };

    if (req.body.password) {
      const salt = await bcrypt.genSalt(10);
      updates.password = await bcrypt.hash(req.body.password, salt);
    }

    const updatedUser = await userService.updateUser(req.session.user._id, updates);
    req.session.user = updatedUser;
    
    res.render('user/profile', { 
      user: updatedUser,
      success: 'Profile updated successfully!',
      error: null
    });
  } catch (err) {
    res.render('user/profile', { 
      user: req.session.user,
      error: 'Error updating profile: ' + err.message
    });
  }
});

// Delete account
router.post('/delete', isAuthenticated, async (req, res) => {
  try {
    await userService.deleteUser(req.session.user._id);
    req.session.destroy();
    res.redirect('/');
  } catch (err) {
    res.status(500).send('Error deleting account');
  }
});

// router.get('/register', (req, res) => {
//   res.render('register');
// });

router.get('/register', (req, res) => {
  res.render('user/register', { 
    title: 'Register',
    error: null 
  });
});

router.post('/register', async (req, res) => {
  // console.log('Request body:', req.body);
  try {
    const userData = {
      username: req.body.username,
      email: req.body.email,
      password: req.body.password,
      securityQuestion: {
        question: req.body['securityQuestion.question'],
        answer: req.body['securityQuestion.answer']
      }
    };

    await userService.register(userData);
    res.redirect('/user/login');
  } catch (err) {
    res.render('user/register', {
      title: 'Register',
      error: err.message,
      formData: req.body
    });
  }
});

// Forgot password page (GET request)
router.get('/forgot', (req, res) => {
  res.render('user/forgot', {
    title: 'Forgot Password',
    message: null,
    error: null,
    showQuestion: false,
    email: null
  });
});

// Forgot password - step 1: Enter email
router.post('/forgot', async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      // Don't reveal if user exists (security best practice)
      return res.render('user/forgot', {
        title: 'Forgot Password',
        message: 'If this email exists, you can reset your password',
        showQuestion: false
      });
    }
    
    res.render('user/forgot', {
      title: 'Security Question',
      email: req.body.email,
      showQuestion: true,
      question: user.securityQuestion.question,
      error: null
    });
  } catch (err) {
    res.render('user/forgot', {
      title: 'Forgot Password',
      error: 'An error occurred. Please try again.',
      showQuestion: false
    });
  }
});

// Forgot password - step 2: Verify answer and set new password
router.post('/reset', async (req, res) => {
  try {
    const { email, securityAnswer, password, confirmPassword } = req.body;
    
    // Validate passwords match
    if (password !== confirmPassword) {
      throw new Error('Passwords do not match');
    }
    
    await userService.verifySecurityAnswerAndReset(email, securityAnswer, password);
    
    // Set success message in session and redirect to login
    req.session.resetSuccess = 'Password has been successfully updated. Please login with your new password.';
    res.redirect('/user/login');
  } catch (err) {
    const user = await User.findOne({ email: req.body.email });
    
    res.render('user/forgot', {
      title: 'Security Question',
      error: err.message,
      email: req.body.email,
      showQuestion: true,
      question: user?.securityQuestion?.question
    });
  }
});

// router.get('/login', (req, res) => {
//   res.render('login');
// });

router.get('/login', (req, res) => {
  // Get and clear the success message from session
  const success = req.session.resetSuccess;
  if (req.session.resetSuccess) {
    delete req.session.resetSuccess;
  }
  
  res.render('user/login', { 
    title: 'Login',
    error: null,
    success: success // Pass the success message to the view
  });
});

// router.post('/login', async (req, res) => {
//   try {
//     const user = await userService.login(req.body.email, req.body.password);
//     req.session.user = user;
//     res.redirect('/trip-overview');
//   } catch (err) {
//     res.status(400).send('Login failed: ' + err.message);
//   }
// });

// Login POST route with this corrected version
router.post('/login', async (req, res) => {
  try {
    console.log('LOGIN ATTEMPT');
    console.log('Email:', req.body.email);
    console.log('Session before login:', req.session);
    
    const user = await userService.login(req.body.email, req.body.password);
    console.log('User authenticated:', user.username);
    
    // Include ALL user data in session (including securityQuestion)
    req.session.user = {
      _id: user._id,
      username: user.username,
      email: user.email,
      securityQuestion: user.securityQuestion // Add this line
    };
    
    console.log('Session after setting user:', req.session);
    
    // Force session save and wait for it
    req.session.save((err) => {
      if (err) {
        console.error('Session save error:', err);
        return res.render('user/login', { error: 'Login failed - session error' });
      }
      
      console.log('Session saved successfully');
      console.log('Final session state:', req.session);
      
      // Redirect to home page
      res.redirect('/');
    });
    
  } catch (error) {
    console.error('Login error:', error.message);
    res.render('user/login', { error: error.message });
  }
});

router.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
});


module.exports = router;
