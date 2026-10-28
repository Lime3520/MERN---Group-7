// Defines the Mongoose user model and its schema. TEMPORARY waiting on actual DB info


const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// User fields: MongoDB default _id, username, email, password, and createAt
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true
  },

  email: {
    type: String,
    required: true
  },

  password: {
    type: String,
    required: true,
    select: false
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Hash the password before saving a new or changed password.
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return; // Skip hasing if password is unchanged

  this.password = await bcrypt.hash(this.password, 12); // Else, hash
});

module.exports = mongoose.model('User', userSchema);