try {
  const express = require('express');
  console.log('✅ express found');
  
  const mongoose = require('mongoose');
  console.log('✅ mongoose found');
  
  const cors = require('cors');
  console.log('✅ cors found');
  
  const dotenv = require('dotenv');
  console.log('✅ dotenv found');
  
  console.log('🎉 All packages are installed correctly!');
} catch (error) {
  console.log('❌ Missing package:', error.message);
}