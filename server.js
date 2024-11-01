const express = require('express');
const mysql = require('mysql');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const bodyParser = require('body-parser');
const { exec } = require('child_process');

const app = express();
app.use(cors());
app.use(express.json());
app.use(bodyParser.json());

// Define the JWT secret
const jwtSecret = 'your_jwt_secret';

// Users database connection
const usersDb = mysql.createConnection({
  host: '',
  user: '',
  password: '',
  database: ''
});

// Stocks database connection
const stocksDb = mysql.createConnection({
  host: '',
  user: '',
  password: '',
  database: ''
});

// Admin database connection
const adminDb = mysql.createConnection({
  host: '',
  user: '',
  password: '',
  database: ''
});

// Connect to databases
[usersDb, stocksDb, adminDb].forEach((db, index) => {
  const dbName = ['users', 'stocks', 'admin'][index];
  db.connect((err) => {
    if (err) {
      console.error(`Error connecting to MySQL ${dbName} database:`, err.stack);
      return;
    }
    console.log(`Connected to MySQL ${dbName} database`);
  });
});

// Signup API
app.post('/signup', (req, res) => {
  const { name, email_id, username, password } = req.body;

  if (!name || !email_id || !username || !password) {
    return res.status(400).send('All fields are required');
  }

  usersDb.query('SELECT * FROM user WHERE username = ? OR email_id = ?', [username, email_id], (err, results) => {
    if (err) {
      console.error('Database error while checking existing user:', err);
      return res.status(500).send('Internal server error');
    }

    if (results.length > 0) {
      return res.status(400).send('Username or email already exists');
    }

    const sql = 'INSERT INTO user (name, email_id, username, password) VALUES (?, ?, ?, ?)';
    usersDb.query(sql, [name, email_id, username, password], (err, result) => {
      if (err) {
        console.error('Error inserting user into the database:', err);
        return res.status(500).send('Internal server error');
      }

      const createTableSql = `
        CREATE TABLE \`${username}\` (
          id INT AUTO_INCREMENT PRIMARY KEY,
          total_return_text VARCHAR(255) NOT NULL,
          one_day_return_text VARCHAR(255) NOT NULL,
          nifty50 VARCHAR(255) NOT NULL,
          sensex VARCHAR(255) NOT NULL,
          date DATETIME NOT NULL
        )
      `;
      adminDb.query(createTableSql, (err) => {
        if (err) {
          console.error('Error creating user-specific table in admin database:', err);
          return res.status(500).send('Internal server error');
        }

        res.status(200).send('Signup successful');
      });
    });
  });
});

// Login API
app.post('/login', (req, res) => {
  const { usernameOrEmail, password } = req.body;

  if (!usernameOrEmail || !password) {
    return res.status(400).send('All fields are required');
  }

  usersDb.query('SELECT * FROM user WHERE username = ? OR email_id = ?', [usernameOrEmail, usernameOrEmail], (err, results) => {
    if (err) {
      console.error('Database error while fetching user:', err);
      return res.status(500).send('Internal server error');
    }

    if (results.length === 0) {
      return res.status(400).send('User not found');
    }

    const user = results[0];

    if (password !== user.password) {
      return res.status(400).send('Invalid username or password');
    }

    const token = jwt.sign({ id: user.username }, jwtSecret, { expiresIn: '1h' });
    res.status(200).json({ token });
  });
});

// Middleware to authenticate JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.sendStatus(401);

  jwt.verify(token, jwtSecret, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};
app.post('/send-otp', authenticateToken, async (req, res) => {
  const username = req.user.id;

  usersDb.query('SELECT email_id FROM user WHERE username = ?', [username], async (err, results) => {
    if (err) {
      console.error('Database error while fetching email:', err);
      return res.status(500).send('Internal server error');
    }

    if (results.length === 0) {
      return res.status(404).send('User not found');
    }

    // Generate a 6-digit OTP
    const otp = crypto.randomInt(100000, 999999);

    // Store the OTP in the user's record in the database
    usersDb.query('UPDATE user SET otp = ? WHERE username = ?', [otp, username], async (err) => {
      if (err) {
        console.error('Database error while saving OTP:', err);
        return res.status(500).send('Internal server error');
      }

      const email = results[0].email_id;

      try {
        // Send OTP via Flask server
        const flaskServerUrl = 'http://localhost:5000/send-otp';  // Replace with your Flask server URL
        const response = await axios.post(flaskServerUrl, {
          email: email,
          otp: otp
        });

        if (response.status === 200) {
          res.status(200).send('OTP sent to your email');
        } else {
          res.status(500).send('Failed to send OTP');
        }
      } catch (error) {
        console.error('Error calling Flask server to send OTP:', error.message);
        res.status(500).send('Failed to send OTP via Flask server');
      }
    });
  });
});

// Verify OTP API
app.post('/verify-otp', authenticateToken, (req, res) => {
  const username = req.user.id;
  const { otp } = req.body;

  usersDb.query('SELECT otp FROM user WHERE username = ?', [username], (err, results) => {
    if (err) {
      console.error('Database error while fetching OTP:', err);
      return res.status(500).send('Internal server error');
    }

    if (results.length === 0) {
      return res.status(404).send('User not found');
    }

    if (results[0].otp === otp) {
      res.status(200).send('OTP verified successfully');
    } else {
      res.status(400).send('Invalid OTP');
    }
  });
});

app.post('/save-password', authenticateToken, async (req, res) => {
  const username = req.user.id;
  const { newPassword } = req.body;

  usersDb.query('SELECT email_id FROM user WHERE username = ?', [username], async (err, results) => {
    if (err) {
      console.error('Database error while fetching email:', err);
      return res.status(500).send('Internal server error');
    }

    if (results.length === 0) {
      return res.status(404).send('User not found');
    }

    const email = results[0].email_id;

    try {
      // Call the Flask server to send a new OTP before saving the password
      const flaskServerUrl = 'http://localhost:5000/send-otp';
      const response = await axios.post(flaskServerUrl, {
        email: email
      });

      if (response.status === 200) {
        res.status(200).send('A new OTP has been sent to your email. Please verify to save the password.');
      } else {
        res.status(500).send('Failed to send OTP');
      }
    } catch (error) {
      console.error('Error calling Flask server to send OTP:', error.message);
      res.status(500).send('Failed to send OTP via Flask server');
    }
  });
});

// Verify OTP and Update Password
app.post('/verify-otp-save-password', authenticateToken, async (req, res) => {
  const username = req.user.id;
  const { otp, newPassword } = req.body;

  usersDb.query('SELECT email_id FROM user WHERE username = ?', [username], async (err, results) => {
    if (err) {
      console.error('Database error while fetching email:', err);
      return res.status(500).send('Internal server error');
    }

    if (results.length === 0) {
      return res.status(404).send('User not found');
    }

    const email = results[0].email_id;

    try {
      // Verify the OTP with the Flask server
      const flaskServerUrl = 'http://localhost:5000/verify-otp';
      const response = await axios.post(flaskServerUrl, {
        email: email,
        otp: otp
      });

      if (response.status === 200 && response.data.verified) {
        // OTP is verified, proceed to update the password
        usersDb.query('UPDATE user SET password = ? WHERE username = ?', [newPassword, username], (err) => {
          if (err) {
            console.error('Database error while updating password:', err);
            return res.status(500).send('Internal server error');
          }

          res.status(200).send('Password updated successfully');
        });
      } else {
        res.status(400).send('Invalid OTP');
      }
    } catch (error) {
      console.error('Error verifying OTP with Flask server:', error.message);
      res.status(500).send('Failed to verify OTP via Flask server');
    }
  });
});

// Get user-specific percentage data
app.get('/api/percentage-data', authenticateToken, (req, res) => {
  const username = req.user.id;

  const query = `SELECT id, total_return_text, one_day_return_text, nifty50, sensex, date FROM \`${username}\``;
  adminDb.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching data for percentage graph:', err);
      return res.status(500).send('Internal server error');
    }

    const data = results.map(item => {
      const oneDayReturnMatch = item.one_day_return_text.match(/\(([\d.]+)%\)/);
      const sensexMatch = item.sensex.match(/\(([\d.]+)%\)/);
      const nifty50Match = item.nifty50.match(/\(([\d.]+)%\)/);

      return {
        date: item.date,
        oneDayReturnPercentage: oneDayReturnMatch ? parseFloat(oneDayReturnMatch[1]) : null,
        sensexPercentage: sensexMatch ? parseFloat(sensexMatch[1]) : null,
        nifty50Percentage: nifty50Match ? parseFloat(nifty50Match[1]) : null
      };
    });

    res.status(200).json(data);
  });
});

// Get user holdings
app.get('/api/holdings', authenticateToken, (req, res) => {
  const username = req.user.id;

  const query = 'SELECT name, avg, no_shares, ticker FROM list_of_stocks WHERE user = ?';
  stocksDb.query(query, [username], (err, results) => {
    if (err) {
      console.error('Error fetching holdings:', err);
      return res.status(500).json({ error: 'Failed to fetch holdings' });
    }

    res.json(results);
  });
});
app.get('/verify-otp', authenticateToken,(req,res) => {
  
});
// Get user-specific financial data for graphs
app.get('/api/data', authenticateToken, (req, res) => {
  const username = req.user.id;

  const query = `SELECT id, total_return_text, one_day_return_text, nifty50, sensex, date FROM \`${username}\``;
  adminDb.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching data from user-specific table in admin database:', err);
      return res.status(500).send('Internal server error');
    }

    const data = results.map(item => {
      const oneDayReturnMatch = item.one_day_return_text.match(/([+-]₹[\d,]+)\(([\d.]+)%\)/);
      const sensexMatch = item.sensex.match(/([\d,.]+)\(([\d.]+)%\)/);
      const nifty50Match = item.nifty50.match(/([\d,.]+)\(([\d.]+)%\)/);

      return {
        label: item.date,
        value: oneDayReturnMatch ? parseFloat(oneDayReturnMatch[1].replace(/[^\d.-]/g, '')) : null,
        oneDayReturnChange: oneDayReturnMatch ? parseFloat(oneDayReturnMatch[2]) : null,
        sensexChange: sensexMatch ? parseFloat(sensexMatch[2]) : null,
        nifty50Change: nifty50Match ? parseFloat(nifty50Match[2]) : null,
        sensex: sensexMatch ? parseFloat(sensexMatch[1].replace(/[^\d.-]/g, '')) : null,
        nifty50: nifty50Match ? parseFloat(nifty50Match[1].replace(/[^\d.-]/g, '')) : null
      };
    });

    res.status(200).json(data);
  });
});

// Run the Python script
app.post('/run-script', authenticateToken, (req, res) => {
  const token = req.headers['authorization'].split(' ')[1]; // Extract the token from the Authorization header

  // Pass the token as an argument to the Python scripta
  const command = `python3 /Users/prakhartripathi/chartjs-api/combined.py ${token}`;
  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error executing script: ${error.message}`);
      return res.status(500).send(`Failed to execute script: ${error.message}`);
    }

    if (stderr) {
      console.error(`Script stderr: ${stderr}`);
      return res.status(500).send(`Script stderr: ${stderr}`);
    }

    console.log(`Script output: ${stdout}`);
    res.status(200).send('Script executed successfully');
  });
});

app.post('/changedate', authenticateToken, (req, res) => {
  console.log('Authenticated user:', req.user);
  console.log('Request body:', req.body);

  const { oldDate, newDate } = req.body;
  
  if (!oldDate || !newDate) {
    return res.status(400).json({ error: 'oldDate and newDate are required' });
  }

  // Proceed with SQL query if data is valid
  const sql = `UPDATE \`${req.user.id}\` SET date = ? WHERE date = ?`;
  adminDb.query(sql, [newDate, oldDate], (err, results) => {
    if (err) {
      console.error('Error updating date:', err);
      return res.status(500).json({ error: 'Failed to update date' });
    }

    if (results.affectedRows === 0) {
      return res.status(404).json({ error: 'No record found with the specified date' });
    }

    res.json({ message: 'Date updated successfully' });
  });
});


app.get('/transactions', authenticateToken, (req, res) => {
  const username = req.user.id;

  // Basic validation to prevent SQL injection
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return res.status(400).send('Invalid username');
  }

  // Dynamically construct the SQL query using the sanitized username as the table name
  const query = `SELECT * FROM \`${username}\``;

  adminDb.query(query, (err, results) => {
    if (err) {
      console.error('Database error while fetching user profile:', err);
      return res.status(500).send('Internal server error');
    }

    if (results.length === 0) {
      return res.status(400).send('No records found for user');
    }

    res.status(200).json(results);
  });
});

// Get user profile data
const multer = require('multer');
const upload = multer(); // For handling multipart form-data

app.post('/profileedit', authenticateToken, upload.single('profilePicture'), (req, res) => {
  const username = req.user.id;
  const { newUsername, email, password } = req.body;
  const profilePicture = req.file ? req.file.buffer : null; // profilePicture is handled as BLOB

  let query = 'UPDATE user SET ';
  const queryParams = [];

  // Check for which fields need to be updated
  if (newUsername) {
    query += 'username = ?, ';
    queryParams.push(newUsername);
  }

  if (email) {
    query += 'email_id = ?, ';
    queryParams.push(email);
  }

  if (password) {
    query += 'password = ?, ';
    queryParams.push(password);
  }

  
  query = query.slice(0, -2); // Remove trailing comma
  query += ' WHERE username = ?';
  queryParams.push(username);

  usersDb.query(query, queryParams, (err, result) => {
    if (err) {
      console.error('Database error while updating profile:', err);
      return res.status(500).send('Internal server error');
    }

    res.status(200).send('Profile updated successfully');
  });
});
app.get('/carddata', authenticateToken, (req, res) => {
  const username = req.user.id; // This holds the username and is used as the table name
  
  // Dynamically construct the query using the table name from the username
  const query = `
    SELECT total_return_text, one_day_return_text 
    FROM ?? 
    ORDER BY date DESC 
    LIMIT 1
  `;

  adminDb.query(query, [username], (err, result) => {
    if (err) {
      console.error('Database query error:', err);  // Log the error details
      return res.status(500).json({ error: 'Database query failed', details: err.message });
    }

    if (result.length === 0) {
      return res.status(404).json({ message: 'No data found for user' });
    }

    const totalReturnText = result[0].total_return_text;
    const oneDayReturnText = result[0].one_day_return_text;

    // Extract percentage from total_return_text and one_day_return_text
    const totalReturnPercentage = totalReturnText.match(/\(([^)]+)\)/)[1]; // Matches the percentage in parentheses
    const oneDayReturnPercentage = oneDayReturnText.match(/\(([^)]+)\)/)[1];

    // Extract the actual value of total return and one-day return
    const totalReturnValue = totalReturnText.match(/[+-]₹[0-9,]+/)[0];
    const oneDayReturnValue = oneDayReturnText.match(/[+-]₹[0-9,]+/)[0];

    // Send the response
    res.json({
      totalReturnValue,
      totalReturnPercentage,
      oneDayReturnValue,
      oneDayReturnPercentage
    });
  });
});


// Fetch profile details including the profile image
app.get('/profile', authenticateToken, (req, res) => {
  const username = req.user.id;

  usersDb.query('SELECT name, username, email_id as email, password FROM user WHERE username = ?', [username], (err, results) => {
    if (err) {
      console.error('Database error while fetching user profile:', err);
      return res.status(500).send('Internal server error');
    }

    if (results.length === 0) {
      return res.status(400).send('User not found');
    }

    const user = results[0];
    

    res.status(200).json(user);
  });
});


// Delete user account and associated data
app.delete('/delete-account', authenticateToken, (req, res) => {
  const username = req.user.id;

  const dropTableSql = `DROP TABLE IF EXISTS \`${username}\``;
  adminDb.query(dropTableSql, (err) => {
    if (err) {
      console.error('Error deleting user-specific table from admin database:', err);
      return res.status(500).send('Internal server error');
    }

    usersDb.query('DELETE FROM user WHERE username = ?', [username], (err) => {
      if (err) {
        console.error('Error deleting user from the database:', err);
        return res.status(500).send('Internal server error');
      }

      res.status(200).send('Account and associated data deleted successfully');
    });
  });
});

// Start the server
app.listen(3001, () => {
  console.log('Server is running on port 3001');
});
